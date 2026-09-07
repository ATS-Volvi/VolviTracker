import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { seedData } from './seed';
import { DEFAULT_PASSWORD_HASH } from '../utils/crypto';
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
  apiUpdatePassword
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

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    employees: Array.isArray(seedData.employees) ? seedData.employees : [],
    projects: Array.isArray(seedData.projects) ? seedData.projects : [],
    tasks: Array.isArray(seedData.tasks) ? seedData.tasks : [],
    meetings: Array.isArray(seedData.meetings) ? seedData.meetings : []
  });
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

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

        const nextData = {
          employees: remoteEmployees.length > 0 ? remoteEmployees : (seedData.employees || []),
          projects: remoteProjects,
          tasks: remoteTasks,
          meetings: remoteMeetings.length > 0 ? remoteMeetings : (seedData.meetings || [])
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
    ['employees', 'projects', 'tasks', 'meetings'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loaded[key] = parsed;
          } else {
            loaded[key] = seedData[key] || [];
          }
        } catch {
          loaded[key] = seedData[key] || [];
        }
      } else {
        loaded[key] = seedData[key] || [];
      }
    });

    setData({
      employees: Array.isArray(loaded.employees) ? loaded.employees : seedData.employees,
      projects: Array.isArray(loaded.projects) ? loaded.projects : seedData.projects,
      tasks: Array.isArray(loaded.tasks) ? loaded.tasks : seedData.tasks,
      meetings: Array.isArray(loaded.meetings) ? loaded.meetings : seedData.meetings
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
        const merged = { ...p, ...updates };
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
      progress: computedProgress,
      status: computedProgress === 0
        ? 'Not started'
        : (computedProgress === 1 ? 'Done' : (proj.status === 'Not started' ? 'In progress' : (proj.status || 'In progress'))),
      startValue: 0,
      endValue: 100
    };

    const newTasks = [
      ...data.tasks,
      ...projectTasks.map(t => ({
        ...t,
        id: t.id && !t.id.startsWith('temp_') ? t.id : generateId(),
        projectId: projectId
      }))
    ];

    const nextProjects = [...data.projects, projectItem];
    setData(prev => ({ ...prev, projects: nextProjects, tasks: newTasks }));
    saveLocalMultiple({ projects: nextProjects, tasks: newTasks });

    // Sync to Neon Cloud
    apiCreateProject(projectItem, projectTasks).catch(e => console.error('[Neon Error] addProjectWithTasks:', e));
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
          progress: computedProgress,
          status: finalStatus,
          startValue: 0,
          endValue: 100
        };
      }
      return p;
    });

    const otherTasks = data.tasks.filter(t => t.projectId !== projectId);
    const updatedProjectTasks = projectTasks.map(t => ({
      ...t,
      id: t.id && !t.id.startsWith('temp_') ? t.id : generateId(),
      projectId: projectId
    }));

    const nextTasks = [...otherTasks, ...updatedProjectTasks];
    setData(prev => ({ ...prev, projects: updatedProjects, tasks: nextTasks }));
    saveLocalMultiple({ projects: updatedProjects, tasks: nextTasks });

    // Sync to Neon Cloud
    const targetProj = updatedProjects.find(p => p.id === projectId);
    apiCreateProject(targetProj || { id: projectId, ...projUpdates }, projectTasks)
      .catch(e => console.error('[Neon Error] updateProjectWithTasks:', e));
  };

  // ----------------------------------------------------
  // Task CRUD with Cloud Neon Sync
  // ----------------------------------------------------
  const addTask = (task) => {
    const item = { ...task, id: task.id || generateId() };
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
    const oldTask = data.tasks.find(t => t.id === id);
    const nextTasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);

    const targetProjectId = updates.projectId || oldTask?.projectId;
    const prevProjectId = (oldTask?.projectId && updates.projectId && oldTask.projectId !== updates.projectId)
      ? oldTask.projectId
      : null;

    let updatedProjects = data.projects;
    if (targetProjectId) {
      updatedProjects = syncProjectProgress(targetProjectId, nextTasks, updatedProjects);
    }
    if (prevProjectId) {
      updatedProjects = syncProjectProgress(prevProjectId, nextTasks, updatedProjects);
    }

    setData(prev => ({ ...prev, tasks: nextTasks, projects: updatedProjects }));
    saveLocalMultiple({ tasks: nextTasks, projects: updatedProjects });

    // Sync to Neon Cloud
    apiUpdateTask(id, updates).catch(e => console.error('[Neon Error] updateTask:', e));
  };

  const removeTask = (id) => {
    if (!id) return;
    const targetTask = data.tasks.find(t => t.id === id);
    const nextTasks = data.tasks.filter(t => t.id !== id);

    let updatedProjects = data.projects;
    if (targetTask?.projectId) {
      updatedProjects = syncProjectProgress(targetTask.projectId, nextTasks, updatedProjects);
    }

    setData(prev => ({ ...prev, tasks: nextTasks, projects: updatedProjects }));
    saveLocalMultiple({ tasks: nextTasks, projects: updatedProjects });

    // Sync to Neon Cloud
    apiDeleteTask(id).catch(e => console.error('[Neon Error] removeTask:', e));
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
  const addEmployee = (emp) => {
    const item = { ...emp, id: emp.id || generateId() };
    const nextEmployees = [...data.employees, item];

    setData(prev => ({ ...prev, employees: nextEmployees }));
    saveLocal('employees', nextEmployees);

    // Sync to Neon Cloud
    apiCreateEmployee(item).catch(e => console.error('[Neon Error] addEmployee:', e));
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

  const removeEmployee = (id) => {
    if (!id) return;
    const nextEmployees = data.employees.filter(e => e.id !== id);
    setData(prev => ({ ...prev, employees: nextEmployees }));
    saveLocal('employees', nextEmployees);
  };

  const updateEmployeeCredentials = (email, newPasswordHash) => {
    if (!email) return;
    const updated = data.employees.map(e =>
      e.email?.toLowerCase() === email.toLowerCase() ? { ...e, passwordHash: newPasswordHash } : e
    );

    setData(prev => ({ ...prev, employees: updated }));
    saveLocal('employees', updated);

    // Sync to Neon Cloud
    apiUpdatePassword(email, newPasswordHash).catch(e => console.error('[Neon Error] updateEmployeeCredentials:', e));
  };

  const getEmployee = (id) => (Array.isArray(data.employees) ? data.employees : seedData.employees).find(e => String(e.id) === String(id)) || null;
  const getProjectTasks = (projectId) => (Array.isArray(data.tasks) ? data.tasks : seedData.tasks).filter(t => t.projectId === projectId);

  const safeEmployees = Array.isArray(data.employees) && data.employees.length > 0 ? data.employees : (seedData.employees || []);
  const safeProjects = Array.isArray(data.projects) ? data.projects : (seedData.projects || []);
  const safeTasks = Array.isArray(data.tasks) ? data.tasks : (seedData.tasks || []);
  const safeMeetings = Array.isArray(data.meetings) ? data.meetings : (seedData.meetings || []);

  const value = {
    ...data,
    employees: safeEmployees,
    projects: safeProjects,
    tasks: safeTasks,
    meetings: safeMeetings,
    isCloudSynced,
    getEmployee,
    getProjectTasks,
    refreshFromCloud,
    addEmployee, updateEmployee, removeEmployee, updateEmployeeCredentials,
    addProject, updateProject, removeProject, addProjectWithTasks, updateProjectWithTasks,
    addTask, updateTask, removeTask,
    addMeeting, updateMeeting, removeMeeting
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};