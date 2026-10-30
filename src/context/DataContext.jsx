import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { seedData } from './seed';
import { seedDocs } from './seedDocs';
import {
  isCloudSyncEnabled,
  fetchInitialData,
  apiCreateProject,
  apiUpdateProject,
  apiDeleteProject,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
  apiCreateMeeting,
  apiUpdateMeeting,
  apiDeleteMeeting,
  apiCreateEmployee,
  apiUpdateEmployee,
  apiDeleteEmployee,
  apiUpdatePassword,
  apiCreateDoc,
  apiUpdateDoc,
  apiDeleteDoc
} from '../services/api';

const DataContext = createContext(null);

// Generate deterministic unique ID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper: Auto-cascade parent assignees to subtasks & sub-subtasks
const cascadeParentAssignees = (tasksList) => {
  if (!Array.isArray(tasksList)) return tasksList;
  const taskMap = new Map(tasksList.map(t => [String(t.id), { ...t }]));
  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;
    for (const [, task] of taskMap.entries()) {
      if (task.parentId) {
        const parent = taskMap.get(String(task.parentId));
        if (parent) {
          const pAssignees = Array.isArray(parent.assigneeIds) && parent.assigneeIds.length > 0
            ? parent.assigneeIds
            : (parent.assigneeId ? [parent.assigneeId] : []);
          
          const myAssignees = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
            ? task.assigneeIds
            : (task.assigneeId ? [task.assigneeId] : []);

          if (pAssignees.length > 0 && (myAssignees.length === 0 || JSON.stringify(myAssignees) !== JSON.stringify(pAssignees))) {
            task.assigneeIds = [...pAssignees];
            task.assigneeId = pAssignees[0] || '';
            changed = true;
          }
        }
      }
    }
  }
  return Array.from(taskMap.values());
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    let initialEmployees = seedData.employees || [];
    let initialProjects = seedData.projects || [];
    let initialTasks = seedData.tasks || [];
    let initialMeetings = seedData.meetings || [];
    let initialDocs = seedDocs || [];

    try {
      const storedDeletedIds = (() => {
        try {
          const raw = localStorage.getItem('volvitech_deleted_employee_ids');
          return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
          return new Set();
        }
      })();

      const empRaw = localStorage.getItem('employees');
      if (empRaw !== null) {
        try {
          const parsed = JSON.parse(empRaw);
          if (Array.isArray(parsed)) {
            initialEmployees = parsed.filter(e => e && !storedDeletedIds.has(String(e.id)) && (!e.email || !storedDeletedIds.has(e.email.toLowerCase().trim())));
          }
        } catch {}
      } else {
        initialEmployees = (seedData.employees || []).filter(e => e && !storedDeletedIds.has(String(e.id)) && (!e.email || !storedDeletedIds.has(e.email.toLowerCase().trim())));
      }
      const projRaw = localStorage.getItem('projects');
      if (projRaw) {
        const parsed = JSON.parse(projRaw);
        if (Array.isArray(parsed) && parsed.length > 0) initialProjects = parsed;
      }
      const taskRaw = localStorage.getItem('tasks');
      if (taskRaw) {
        const parsed = JSON.parse(taskRaw);
        if (Array.isArray(parsed) && parsed.length > 0) initialTasks = parsed;
      }
      const meetRaw = localStorage.getItem('meetings');
      if (meetRaw) {
        const parsed = JSON.parse(meetRaw);
        if (Array.isArray(parsed) && parsed.length > 0) initialMeetings = parsed;
      }
      const docsRaw = localStorage.getItem('docs');
      if (docsRaw) {
        const parsed = JSON.parse(docsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) initialDocs = parsed;
      }
    } catch {}

    return {
      employees: initialEmployees,
      projects: initialProjects,
      tasks: initialTasks,
      meetings: initialMeetings,
      docs: initialDocs
    };
  });
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;
  const deletedEmployeeIds = useRef((() => {
    try {
      const raw = localStorage.getItem('volvitech_deleted_employee_ids');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  })());
  const deletedTaskIds = useRef(new Set());

  // Persist changes to localStorage cache
  const saveLocal = useCallback((key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota or parsing error fallback
    }
  }, []);

  const saveLocalMultiple = useCallback((updates) => {
    Object.entries(updates).forEach(([key, val]) => {
      saveLocal(key, val);
    });
  }, [saveLocal]);

  // Sync data from remote Neon PostgreSQL database (only active on Vercel deployment)
  const refreshFromCloud = useCallback(async (isInitial = false) => {
    if (!isCloudSyncEnabled()) {
      setIsCloudSynced(false);
      return;
    }

    try {
      const cloudData = await fetchInitialData();
      if (cloudData && typeof cloudData === 'object') {
        let remoteProjects = Array.isArray(cloudData.projects) ? [...cloudData.projects] : [];
        let remoteTasks = Array.isArray(cloudData.tasks) ? [...cloudData.tasks] : [];
        let remoteMeetings = Array.isArray(cloudData.meetings) ? [...cloudData.meetings] : [];
        let remoteEmployees = Array.isArray(cloudData.employees) ? [...cloudData.employees] : [];
        let remoteDocs = Array.isArray(cloudData.docs) ? [...cloudData.docs] : [];

        // Automatic Local-to-Cloud Sync & preservation for Employees:
        // Ensure any locally added employees (e.g. external partners, clients, suppliers)
        // are preserved and synced to Neon DB instead of being wiped out by remote fetch!
        const localEmployees = (dataRef.current?.employees || []).filter(le => {
          if (!le || !le.email) return false;
          const leId = String(le.id);
          const leEmail = le.email.toLowerCase().trim();
          return !deletedEmployeeIds.current.has(leId) && !deletedEmployeeIds.current.has(leEmail);
        });

        for (const le of localEmployees) {
          const leId = String(le.id);
          const leEmail = le.email.toLowerCase().trim();
          const exists = remoteEmployees.some(re =>
            String(re.id) === leId || (re.email && re.email.toLowerCase().trim() === leEmail)
          );
          if (!exists) {
            remoteEmployees.push(le);
            apiCreateEmployee(le).catch(e => console.error('[Cloud Sync] Failed to sync local employee to Neon:', e));
          }
        }

        // Filter out any locally deleted employees that remote Neon might still be returning
        if (deletedEmployeeIds.current.size > 0) {
          remoteEmployees = remoteEmployees.filter(re => 
            !deletedEmployeeIds.current.has(String(re.id)) &&
            (!re.email || !deletedEmployeeIds.current.has(re.email.toLowerCase().trim()))
          );
          // Also clean up any lingering deleted employees from remote Neon DB
          (cloudData.employees || []).forEach(re => {
            if (re && (deletedEmployeeIds.current.has(String(re.id)) || (re.email && deletedEmployeeIds.current.has(re.email.toLowerCase().trim())))) {
              apiDeleteEmployee(re.id).catch(() => {});
            }
          });
        }

        // Automatic Local-to-Cloud Sync & preservation for Tasks:
        // Ensure any locally created tasks are preserved and synced to Neon DB
        // instead of being wiped out if the remote database fetch happens before or during writes!
        const localTasks = dataRef.current?.tasks || [];
        for (const lt of localTasks) {
          if (!lt || !lt.id) continue;
          if (deletedTaskIds.current.has(lt.id)) continue;
          const exists = remoteTasks.some(rt => String(rt.id) === String(lt.id));
          if (!exists) {
            remoteTasks.push(lt);
            apiCreateTask(lt).catch(e => console.error('[Cloud Sync] Failed to sync local task to Neon:', e));
          }
        }

        // Filter out any locally deleted tasks that remote Neon might still be returning
        if (deletedTaskIds.current.size > 0) {
          remoteTasks = remoteTasks.filter(rt => !deletedTaskIds.current.has(rt.id));
        }

        // Automatic Local-to-Cloud Sync:
        // If the device has custom user projects (e.g. "CRM for FACE co", "ATS")
        // that are not yet in Neon DB, push them to Neon DB so all devices share them!
        if (isInitial) {
          const localProjects = dataRef.current.projects || [];
          const localTasks = dataRef.current.tasks || [];

          for (const lp of localProjects) {
            const exists = remoteProjects.some(rp => rp.id === lp.id || rp.name?.toLowerCase().trim() === lp.name?.toLowerCase().trim());
            const isDemo = ['Public launch of iOS app', 'Revamp new hire onboarding', 'Quarterly sales planning'].includes(lp.name);
            if (!exists && !isDemo && lp.name) {
              console.log('[Cloud Sync] Uploading active user project to Neon DB:', lp.name);
              const relatedTasks = localTasks.filter(t => t.projectId === lp.id);
              try {
                const created = await apiCreateProject(lp, relatedTasks);
                if (created) {
                  remoteProjects.push(created);
                  remoteTasks.push(...relatedTasks);
                }
              } catch (e) {
                console.error('[Cloud Sync] Failed to upload local project:', e);
              }
            }
          }
        }

        const cascadedRemoteTasks = cascadeParentAssignees(remoteTasks);
        const nextData = {
          employees: remoteEmployees,
          projects: remoteProjects,
          tasks: cascadedRemoteTasks,
          meetings: remoteMeetings.length > 0 ? remoteMeetings : (seedData.meetings || []),
          docs: remoteDocs.length > 0 ? remoteDocs : (dataRef.current.docs || seedDocs || [])
        };

        // Standardize projects to 0-100 & progress 0 = Not started
        nextData.projects = nextData.projects.map(p => {
          const prog = Number(p.progress) || 0;
          let status = p.status || 'Not started';
          if (prog === 0) status = 'Not started';
          else if (prog === 1) status = 'Done';
          return {
            ...p,
            startValue: 0,
            endValue: 100,
            progress: prog,
            status
          };
        });

        // Only update state if data changed (avoid unnecessary re-renders)
        const currentJson = JSON.stringify(dataRef.current);
        const nextJson = JSON.stringify(nextData);
        if (currentJson !== nextJson || isInitial) {
          setData(nextData);
          saveLocalMultiple(nextData);
        }
        setIsCloudSynced(true);
      }
    } catch (err) {
      console.warn('[Cloud Sync] Failed to fetch from Neon DB, using local cache:', err.message);
    }
  }, [saveLocalMultiple]);

  // Initial load: Load local cache immediately, then hydrate from Neon PostgreSQL if on Vercel
  useEffect(() => {
    const loaded = {};
    ['employees', 'projects', 'tasks', 'meetings', 'docs'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded[key] = parsed;
          } else {
            loaded[key] = key === 'docs' ? seedDocs : (seedData[key] || []);
          }
        } catch {
          loaded[key] = key === 'docs' ? seedDocs : (seedData[key] || []);
        }
      } else {
        loaded[key] = key === 'docs' ? seedDocs : (seedData[key] || []);
      }
    });

    // Auto-cascade parent assignees to all subtasks & sub-subtasks
    const rawLoadedTasks = Array.isArray(loaded.tasks) && loaded.tasks.length > 0 ? loaded.tasks : seedData.tasks;
    const initialTasks = cascadeParentAssignees(rawLoadedTasks);

    const currentDeletedEmployeeIds = (() => {
      try {
        const raw = localStorage.getItem('volvitech_deleted_employee_ids');
        return raw ? new Set(JSON.parse(raw)) : deletedEmployeeIds.current;
      } catch {
        return deletedEmployeeIds.current;
      }
    })();
    deletedEmployeeIds.current = currentDeletedEmployeeIds;

    const initialEmployeesRaw = (Array.isArray(loaded.employees) ? [...loaded.employees] : [...seedData.employees])
      .filter(e => e && !currentDeletedEmployeeIds.has(String(e.id)) && (!e.email || !currentDeletedEmployeeIds.has(e.email.toLowerCase().trim())));

    const hasStoredEmployees = localStorage.getItem('employees') !== null;
    if (!hasStoredEmployees) {
      (seedData.employees || []).forEach(se => {
        const seId = String(se.id);
        const seEmail = (se.email || '').toLowerCase().trim();
        if (currentDeletedEmployeeIds.has(seId) || currentDeletedEmployeeIds.has(seEmail)) return;
        if (!initialEmployeesRaw.some(le => String(le.id) === seId || (le.email && le.email.toLowerCase().trim() === seEmail))) {
          initialEmployeesRaw.push(se);
        }
      });
    }
    const loadedEmployees = initialEmployeesRaw.map(emp => ({
      ...emp,
      userType: emp.userType || 'internal',
      externalType: emp.externalType || null,
      organization: emp.organization || (emp.userType === 'external' ? '' : 'Volvitech')
    }));

    // Merge seed projects and ensure createdBy field
    const hasStoredProjects = localStorage.getItem('projects') !== null;
    const rawProjects = Array.isArray(loaded.projects) && loaded.projects.length > 0 ? loaded.projects : seedData.projects;
    const loadedProjects = rawProjects.map(p => ({
      ...p,
      createdBy: p.createdBy !== undefined && p.createdBy !== '' ? p.createdBy : (p.id === 'p4' ? '5' : '1')
    }));
    if (!hasStoredProjects) {
      (seedData.projects || []).forEach(sp => {
        if (!loadedProjects.some(lp => lp.id === sp.id)) {
          loadedProjects.push({ ...sp, createdBy: sp.createdBy || (sp.id === 'p4' ? '5' : '1') });
        }
      });
    }

    const hasStoredTasks = localStorage.getItem('tasks') !== null;
    if (!hasStoredTasks) {
      (seedData.tasks || []).forEach(st => {
        if (!initialTasks.some(lt => lt.id === st.id)) {
          initialTasks.push(st);
        }
      });
    }

    saveLocalMultiple({ employees: loadedEmployees, projects: loadedProjects, tasks: initialTasks });

    setData({
      employees: loadedEmployees,
      projects: loadedProjects,
      tasks: initialTasks,
      meetings: Array.isArray(loaded.meetings) && loaded.meetings.length > 0 ? loaded.meetings : seedData.meetings,
      docs: Array.isArray(loaded.docs) && loaded.docs.length > 0 ? loaded.docs : seedDocs
    });

    // In local dev: stay strictly on local storage. In production on Vercel: hydrate & poll Neon DB.
    if (isCloudSyncEnabled()) {
      refreshFromCloud(true);

      const interval = setInterval(() => {
        refreshFromCloud(false);
      }, 6000);

      const onFocus = () => refreshFromCloud(false);
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshFromCloud(false);
        }
      };

      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }
  }, [refreshFromCloud]);

  // Recalculate project progress based on tasks
  const syncProjectProgress = (projectId, currentTasks, currentProjects) => {
    if (!projectId) return currentProjects;
    const projectTasks = currentTasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return currentProjects;

    const completed = projectTasks.filter(t => t.status === 'Done').length;
    const progress = completed / projectTasks.length;
    const status = progress === 1 ? 'Done' : (progress === 0 ? 'Not started' : 'In progress');

    return currentProjects.map(p => {
      if (p.id === projectId) {
        return { ...p, progress, status, startValue: 0, endValue: 100 };
      }
      return p;
    });
  };

  // ----------------------------------------------------
  // Project CRUD with Cloud Neon Sync
  // ----------------------------------------------------
  const addProject = (proj) => {
    let finalStatus = proj.status || 'Not started';
    let finalProg = proj.progress !== undefined ? proj.progress : 0;
    if (finalProg === 0) finalStatus = 'Not started';
    else if (finalProg === 1) finalStatus = 'Done';
    else if (finalStatus === 'Not started' && finalProg > 0) finalStatus = 'In progress';

    const item = {
      ...proj,
      id: proj.id || generateId(),
      createdBy: proj.createdBy !== undefined && proj.createdBy !== '' ? proj.createdBy : '',
      progress: finalProg,
      status: finalStatus,
      startValue: 0,
      endValue: 100
    };

    const nextProjects = [...data.projects, item];
    setData(prev => ({ ...prev, projects: nextProjects }));
    saveLocal('projects', nextProjects);

    // Sync to Neon Cloud
    apiCreateProject(item).catch(e => console.error('[Neon Error] addProject:', e));
    return item;
  };

  const updateProject = (id, updates) => {
    if (!id) return;
    let nextUpdatedItem = null;
    const updated = data.projects.map(p => {
      if (p.id === id) {
        const merged = {
          ...p,
          ...updates,
          createdBy: updates.createdBy !== undefined ? updates.createdBy : (p.createdBy || '')
        };
        if (updates.progress !== undefined) {
          const pVal = Number(updates.progress);
          if (pVal === 0) merged.status = 'Not started';
          else if (pVal === 1) merged.status = 'Done';
          else if (merged.status === 'Not started' && pVal > 0) merged.status = 'In progress';
        } else if (updates.status !== undefined) {
          if (updates.status === 'Not started') merged.progress = 0;
          else if (updates.status === 'Done') merged.progress = 1;
          else if (updates.status === 'In progress' && (merged.progress === 0 || merged.progress === 1)) {
            merged.progress = 0.25;
          }
        }
        nextUpdatedItem = merged;
        return merged;
      }
      return p;
    });

    setData(prev => ({ ...prev, projects: updated }));
    saveLocal('projects', updated);

    // Sync to Neon Cloud
    if (nextUpdatedItem) {
      apiUpdateProject(id, updates).catch(e => console.error('[Neon Error] updateProject:', e));
    }
  };

  const removeProject = (id) => {
    if (!id) return;
    const nextProjects = data.projects.filter(p => p.id !== id);
    const nextTasks = data.tasks.filter(t => t.projectId !== id);

    setData(prev => ({ ...prev, projects: nextProjects, tasks: nextTasks }));
    saveLocalMultiple({ projects: nextProjects, tasks: nextTasks });

    // Sync to Neon Cloud
    apiDeleteProject(id).catch(e => console.error('[Neon Error] removeProject:', e));
  };

  // Atomic Project + Tasks creation
  const addProjectWithTasks = (proj, projectTasks = []) => {
    const projectId = proj.id || generateId();
    const completedCount = projectTasks.filter(t => t.status === 'Done').length;
    const computedProgress = proj.progress !== undefined
      ? proj.progress
      : (projectTasks.length > 0 ? (completedCount / projectTasks.length) : 0);

    const projectItem = {
      ...proj,
      id: projectId,
      createdBy: proj.createdBy !== undefined && proj.createdBy !== '' ? proj.createdBy : '',
      progress: computedProgress,
      status: computedProgress === 0
        ? 'Not started'
        : (computedProgress === 1 ? 'Done' : (proj.status === 'Not started' ? 'In progress' : (proj.status || 'In progress'))),
      startValue: 0,
      endValue: 100
    };

    // Map temp IDs to permanent IDs so parentId hierarchy remains intact
    const idMap = new Map();
    projectTasks.forEach(t => {
      if (!t.id || String(t.id).startsWith('temp_')) {
        idMap.set(t.id, generateId());
      }
    });

    const newProjectTasks = projectTasks.map(t => ({
      ...t,
      id: idMap.get(t.id) || t.id || generateId(),
      parentId: t.parentId ? (idMap.get(t.parentId) || t.parentId) : null,
      projectId: projectId
    }));

    const newTasks = [
      ...data.tasks,
      ...newProjectTasks
    ];

    const nextProjects = [...data.projects, projectItem];
    setData(prev => ({ ...prev, projects: nextProjects, tasks: newTasks }));
    saveLocalMultiple({ projects: nextProjects, tasks: newTasks });

    // Sync to Neon Cloud
    apiCreateProject(projectItem, newProjectTasks).catch(e => console.error('[Neon Error] addProjectWithTasks:', e));
    return projectItem;
  };

  // Atomic Project + Tasks update
  const updateProjectWithTasks = (projectId, projUpdates, projectTasks = []) => {
    if (!projectId) return;
    const completedCount = projectTasks.filter(t => t.status === 'Done').length;
    const computedProgress = projUpdates.progress !== undefined
      ? projUpdates.progress
      : (projectTasks.length > 0 ? (completedCount / projectTasks.length) : 0);

    const updatedProjects = data.projects.map(p => {
      if (p.id === projectId) {
        const finalStatus = computedProgress === 0
          ? 'Not started'
          : (computedProgress === 1 ? 'Done' : (projUpdates.status === 'Not started' ? 'In progress' : (projUpdates.status || p.status || 'In progress')));
        return {
          ...p,
          ...projUpdates,
          createdBy: projUpdates.createdBy !== undefined ? projUpdates.createdBy : (p.createdBy || ''),
          progress: computedProgress,
          status: finalStatus,
          startValue: 0,
          endValue: 100
        };
      }
      return p;
    });

    // Map temp IDs to permanent IDs so parentId hierarchy remains intact
    const idMap = new Map();
    projectTasks.forEach(t => {
      if (!t.id || String(t.id).startsWith('temp_')) {
        idMap.set(t.id, generateId());
      }
    });

    const otherTasks = data.tasks.filter(t => t.projectId !== projectId);
    const updatedProjectTasks = projectTasks.map(t => ({
      ...t,
      id: idMap.get(t.id) || t.id || generateId(),
      parentId: t.parentId ? (idMap.get(t.parentId) || t.parentId) : null,
      projectId: projectId
    }));

    const nextTasks = [...otherTasks, ...updatedProjectTasks];
    setData(prev => ({ ...prev, projects: updatedProjects, tasks: nextTasks }));
    saveLocalMultiple({ projects: updatedProjects, tasks: nextTasks });

    // Sync to Neon Cloud
    const targetProj = updatedProjects.find(p => p.id === projectId);
    apiCreateProject(targetProj || { id: projectId, ...projUpdates }, updatedProjectTasks)
      .catch(e => console.error('[Neon Error] updateProjectWithTasks:', e));
  };

  // ----------------------------------------------------
  // Task CRUD with Cloud Neon Sync
  // ----------------------------------------------------
  const addTask = (task) => {
    let item = { ...task, id: task.id || generateId() };

    // If this is a subtask or sub-subtask and assignees are not specified, inherit from parent
    if (item.parentId && (!item.assigneeIds || item.assigneeIds.length === 0)) {
      const parent = data.tasks.find(t => String(t.id) === String(item.parentId));
      if (parent) {
        const parentAssignees = Array.isArray(parent.assigneeIds) && parent.assigneeIds.length > 0
          ? parent.assigneeIds
          : (parent.assigneeId ? [parent.assigneeId] : []);
        if (parentAssignees.length > 0) {
          item.assigneeIds = [...parentAssignees];
          item.assigneeId = parentAssignees[0] || '';
        }
      }
    }

    const nextTasks = [...data.tasks, item];

    let updatedProjects = data.projects;
    if (item.projectId) {
      updatedProjects = syncProjectProgress(item.projectId, nextTasks, updatedProjects);
    }

    setData(prev => ({ ...prev, tasks: nextTasks, projects: updatedProjects }));
    saveLocalMultiple({ tasks: nextTasks, projects: updatedProjects });

    // Sync to Neon Cloud
    apiCreateTask(item).catch(e => console.error('[Neon Error] addTask:', e));
    return item;
  };

  const updateTask = (id, updates) => {
    if (!id) return;

    let cascadedDescendantIds = [];
    let cascadedAssigneeIds = [];
    let cascadedAssigneeId = '';

    setData(prev => {
      const oldTask = prev.tasks.find(t => String(t.id) === String(id));
      const descendants = new Set();
      if (updates.assigneeIds !== undefined) {
        let added = true;
        while (added) {
          added = false;
          prev.tasks.forEach(t => {
            if (t.parentId && (String(t.parentId) === String(id) || descendants.has(String(t.parentId))) && !descendants.has(String(t.id))) {
              descendants.add(String(t.id));
              added = true;
            }
          });
        }
      }

      cascadedAssigneeIds = Array.isArray(updates.assigneeIds) ? updates.assigneeIds : [];
      cascadedAssigneeId = updates.assigneeId || cascadedAssigneeIds[0] || '';
      cascadedDescendantIds = Array.from(descendants);

      const nextTasks = prev.tasks.map(t => {
        if (String(t.id) === String(id)) {
          return { ...t, ...updates };
        }
        if (descendants.has(String(t.id))) {
          return {
            ...t,
            assigneeIds: cascadedAssigneeIds,
            assigneeId: cascadedAssigneeId
          };
        }
        return t;
      });

      const targetProjectId = updates.projectId || oldTask?.projectId;
      const prevProjectId = (oldTask?.projectId && updates.projectId && oldTask.projectId !== updates.projectId)
        ? oldTask.projectId
        : null;

      let updatedProjects = prev.projects;
      if (targetProjectId) {
        updatedProjects = syncProjectProgress(targetProjectId, nextTasks, updatedProjects);
      }
      if (prevProjectId) {
        updatedProjects = syncProjectProgress(prevProjectId, nextTasks, updatedProjects);
      }

      saveLocalMultiple({ tasks: nextTasks, projects: updatedProjects });
      return { ...prev, tasks: nextTasks, projects: updatedProjects };
    });

    // Sync to Neon Cloud
    apiUpdateTask(id, updates).catch(e => console.error('[Neon Error] updateTask:', e));
    if (cascadedDescendantIds.length > 0) {
      cascadedDescendantIds.forEach(descId => {
        apiUpdateTask(descId, {
          assigneeIds: cascadedAssigneeIds,
          assigneeId: cascadedAssigneeId
        }).catch(e => console.error('[Neon Error] cascade updateTask:', e));
      });
    }
  };

  const removeTask = (id) => {
    if (!id) return;
    const targetTask = data.tasks.find(t => t.id === id);
    const toDelete = new Set([id]);
    let added = true;
    while (added) {
      added = false;
      data.tasks.forEach(t => {
        if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
          toDelete.add(t.id);
          added = true;
        }
      });
    }

    const nextTasks = data.tasks.filter(t => !toDelete.has(t.id));

    let updatedProjects = data.projects;
    if (targetTask?.projectId) {
      updatedProjects = syncProjectProgress(targetTask.projectId, nextTasks, updatedProjects);
    }

    setData(prev => ({ ...prev, tasks: nextTasks, projects: updatedProjects }));
    saveLocalMultiple({ tasks: nextTasks, projects: updatedProjects });

    // Sync to Neon Cloud
    toDelete.forEach(delId => {
      deletedTaskIds.current.add(delId);
      apiDeleteTask(delId).catch(e => console.error('[Neon Error] removeTask:', e));
    });
  };

  // ----------------------------------------------------
  // Meeting CRUD with Cloud Neon Sync
  // ----------------------------------------------------
  const addMeeting = (meeting) => {
    const item = { ...meeting, id: meeting.id || generateId() };
    const nextMeetings = [...data.meetings, item];

    setData(prev => ({ ...prev, meetings: nextMeetings }));
    saveLocal('meetings', nextMeetings);

    // Sync to Neon Cloud
    apiCreateMeeting(item).catch(e => console.error('[Neon Error] addMeeting:', e));
    return item;
  };

  const updateMeeting = (id, updates) => {
    if (!id) return;
    const updated = data.meetings.map(m => m.id === id ? { ...m, ...updates } : m);

    setData(prev => ({ ...prev, meetings: updated }));
    saveLocal('meetings', updated);

    // Sync to Neon Cloud
    apiUpdateMeeting(id, updates).catch(e => console.error('[Neon Error] updateMeeting:', e));
  };

  const removeMeeting = (id) => {
    if (!id) return;
    const nextMeetings = data.meetings.filter(m => m.id !== id);

    setData(prev => ({ ...prev, meetings: nextMeetings }));
    saveLocal('meetings', nextMeetings);

    // Sync to Neon Cloud
    apiDeleteMeeting(id).catch(e => console.error('[Neon Error] removeMeeting:', e));
  };

  // ----------------------------------------------------
  // Employee CRUD & Credentials with Cloud Neon Sync
  // ----------------------------------------------------
  const addEmployee = async (emp) => {
    const userType = emp.userType || 'internal';
    const item = {
      ...emp,
      id: emp.id || generateId(),
      userType,
      externalType: userType === 'external' ? (emp.externalType || 'client') : null,
      organization: emp.organization || (userType === 'internal' ? 'Volvitech' : '')
    };

    deletedEmployeeIds.current.delete(String(item.id));
    if (item.email) {
      deletedEmployeeIds.current.delete(item.email.toLowerCase().trim());
    }
    try {
      localStorage.setItem('volvitech_deleted_employee_ids', JSON.stringify(Array.from(deletedEmployeeIds.current)));
    } catch {}

    let currentEmployees = [];
    try {
      const stored = localStorage.getItem('employees');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentEmployees = parsed;
        }
      }
    } catch {}

    if (currentEmployees.length === 0) {
      currentEmployees = Array.isArray(dataRef.current?.employees) && dataRef.current.employees.length > 0
        ? dataRef.current.employees
        : (Array.isArray(data.employees) ? data.employees : (seedData.employees || []));
    }

    const nextEmployees = [
      ...currentEmployees.filter(e => e.id !== item.id && (e.email || '').toLowerCase().trim() !== (item.email || '').toLowerCase().trim()),
      item
    ];

    try {
      localStorage.setItem('employees', JSON.stringify(nextEmployees));
    } catch (e) {
      console.error('Failed to write employees to localStorage:', e);
    }
    if (dataRef.current) {
      dataRef.current.employees = nextEmployees;
    }

    setData(prev => ({ ...prev, employees: nextEmployees }));

    // Sync to Neon Cloud
    try {
      const saved = await apiCreateEmployee(item);
      if (saved && saved.id) {
        const synced = (dataRef.current?.employees || nextEmployees).map(e =>
          (e.id === item.id || (e.email && saved.email && e.email.toLowerCase() === saved.email.toLowerCase()))
            ? { ...e, ...saved }
            : e
        );
        try {
          localStorage.setItem('employees', JSON.stringify(synced));
        } catch {}
        if (dataRef.current) dataRef.current.employees = synced;
        setData(prev => ({ ...prev, employees: synced }));
        return saved;
      }
    } catch (e) {
      console.error('[Neon Error] addEmployee:', e);
    }
    return item;
  };

  const updateEmployee = (id, updates) => {
    if (!id) return;
    const updated = data.employees.map(e => e.id === id ? { ...e, ...updates } : e);

    setData(prev => ({ ...prev, employees: updated }));
    saveLocal('employees', updated);

    // Sync to Neon Cloud
    apiUpdateEmployee(id, updates).catch(e => console.error('[Neon Error] updateEmployee:', e));
  };

  const removeEmployee = async (id) => {
    if (!id) return;
    const strId = String(id).trim();
    const lowerId = strId.toLowerCase();
    const emp = (data.employees || []).find(e => 
      String(e.id) === strId || (e.email && e.email.toLowerCase().trim() === lowerId)
    );

    deletedEmployeeIds.current.add(strId);
    if (emp?.id) deletedEmployeeIds.current.add(String(emp.id));
    if (emp?.email) deletedEmployeeIds.current.add(emp.email.toLowerCase().trim());
    if (strId.includes('@')) deletedEmployeeIds.current.add(lowerId);

    try {
      localStorage.setItem('volvitech_deleted_employee_ids', JSON.stringify(Array.from(deletedEmployeeIds.current)));
    } catch {}

    const empEmail = emp?.email ? emp.email.toLowerCase().trim() : (strId.includes('@') ? lowerId : '');
    const empId = emp?.id ? String(emp.id) : strId;

    const nextEmployees = (data.employees || []).filter(e => {
      if (!e) return false;
      const curId = String(e.id);
      const curEmail = (e.email || '').toLowerCase().trim();
      if (curId === empId || curId === strId) return false;
      if (empEmail && curEmail === empEmail) return false;
      if (deletedEmployeeIds.current.has(curId) || (curEmail && deletedEmployeeIds.current.has(curEmail))) return false;
      return true;
    });

    // Unassign deleted employee from local projects, tasks, and meetings
    const nextTasks = (data.tasks || []).map(t => {
      let changed = false;
      let newAssigneeId = t.assigneeId;
      let newAssigneeIds = t.assigneeIds;
      if (String(t.assigneeId) === strId || String(t.assigneeId) === empId) {
        newAssigneeId = '';
        changed = true;
      }
      if (Array.isArray(t.assigneeIds) && t.assigneeIds.some(aid => String(aid) === strId || String(aid) === empId)) {
        newAssigneeIds = t.assigneeIds.filter(aid => String(aid) !== strId && String(aid) !== empId);
        changed = true;
      }
      return changed ? { ...t, assigneeId: newAssigneeId, assigneeIds: newAssigneeIds } : t;
    });

    const nextProjects = (data.projects || []).map(p => {
      let changed = false;
      let newAssigneeId = p.assigneeId;
      let newAssigneeIds = p.assigneeIds;
      if (String(p.assigneeId) === strId || String(p.assigneeId) === empId) {
        newAssigneeId = '';
        changed = true;
      }
      if (Array.isArray(p.assigneeIds) && p.assigneeIds.some(aid => String(aid) === strId || String(aid) === empId)) {
        newAssigneeIds = p.assigneeIds.filter(aid => String(aid) !== strId && String(aid) !== empId);
        changed = true;
      }
      return changed ? { ...p, assigneeId: newAssigneeId, assigneeIds: newAssigneeIds } : p;
    });

    setData(prev => ({ ...prev, employees: nextEmployees, tasks: nextTasks, projects: nextProjects }));
    saveLocal('employees', nextEmployees);
    saveLocal('tasks', nextTasks);
    saveLocal('projects', nextProjects);

    if (dataRef.current) {
      dataRef.current.employees = nextEmployees;
      dataRef.current.tasks = nextTasks;
      dataRef.current.projects = nextProjects;
    }

    // Sync deletion to Neon Cloud
    try {
      await apiDeleteEmployee(empId || strId);
    } catch (e) {
      console.error('[Neon Error] removeEmployee:', e);
    }
  };

  const updateEmployeeCredentials = (email, newPassword) => {
    if (!email) return;
    // Sync to Server API
    apiUpdatePassword(email, newPassword).catch(e => console.error('[Server Error] updateEmployeeCredentials:', e));
  };

  // ----------------------------------------------------
  // Docs CRUD with Local Cache & Cloud Sync
  // ----------------------------------------------------
  const addDoc = (doc) => {
    const item = {
      ...doc,
      id: doc.id || ('doc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      isPinned: Boolean(doc.isPinned)
    };

    const nextDocs = [item, ...(data.docs || [])];
    setData(prev => ({ ...prev, docs: nextDocs }));
    saveLocal('docs', nextDocs);

    apiCreateDoc(item).catch(e => console.error('[Neon Error] addDoc:', e));
    return item;
  };

  const updateDoc = (id, updates) => {
    if (!id) return;
    let nextUpdatedItem = null;
    const nextDocs = (data.docs || []).map(d => {
      if (d.id === id) {
        nextUpdatedItem = {
          ...d,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return nextUpdatedItem;
      }
      return d;
    });

    setData(prev => ({ ...prev, docs: nextDocs }));
    saveLocal('docs', nextDocs);

    if (nextUpdatedItem) {
      apiUpdateDoc(id, nextUpdatedItem).catch(e => console.error('[Neon Error] updateDoc:', e));
    }
  };

  const removeDoc = (id) => {
    if (!id) return;
    const nextDocs = (data.docs || []).filter(d => d.id !== id);
    setData(prev => ({ ...prev, docs: nextDocs }));
    saveLocal('docs', nextDocs);

    apiDeleteDoc(id).catch(e => console.error('[Neon Error] removeDoc:', e));
  };

  const togglePinDoc = (id) => {
    if (!id) return;
    const doc = (data.docs || []).find(d => d.id === id);
    if (!doc) return;
    updateDoc(id, { isPinned: !doc.isPinned });
  };

  const getEmployee = (id) => (Array.isArray(data.employees) ? data.employees : seedData.employees).find(e => String(e.id) === String(id)) || null;
  const getProjectTasks = (projectId) => (Array.isArray(data.tasks) ? data.tasks : seedData.tasks).filter(t => t.projectId === projectId);

  const safeEmployees = Array.isArray(data.employees) ? data.employees : [];
  const safeProjects = Array.isArray(data.projects) ? data.projects : (seedData.projects || []);
  const safeTasks = Array.isArray(data.tasks) ? data.tasks : (seedData.tasks || []);
  const safeMeetings = Array.isArray(data.meetings) ? data.meetings : (seedData.meetings || []);
  const safeDocs = Array.isArray(data.docs) && data.docs.length > 0 ? data.docs : (seedDocs || []);

  const value = {
    ...data,
    employees: safeEmployees,
    projects: safeProjects,
    tasks: safeTasks,
    meetings: safeMeetings,
    docs: safeDocs,
    isCloudSynced,
    getEmployee,
    getProjectTasks,
    refreshFromCloud,
    addEmployee, updateEmployee, removeEmployee, updateEmployeeCredentials,
    addProject, updateProject, removeProject, addProjectWithTasks, updateProjectWithTasks,
    addTask, updateTask, removeTask,
    addMeeting, updateMeeting, removeMeeting,
    addDoc, updateDoc, removeDoc, togglePinDoc
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};