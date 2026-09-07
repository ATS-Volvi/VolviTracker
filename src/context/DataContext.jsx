import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { seedData } from './seed';

import { DEFAULT_PASSWORD_HASH } from '../utils/crypto';

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
    employees: [],
    projects: [],
    tasks: [],
    meetings: []
  });

  // Load data on mount; sanitize IDs so every item is guaranteed unique
  useEffect(() => {
    const loaded = {};
    const seeded = localStorage.getItem('tracker_seeded') === 'true';
    ['employees', 'projects', 'tasks', 'meetings'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          let items = JSON.parse(stored);
          let needsResave = false;
          // Fix any existing items in localStorage that were created without an id or passwordHash
          items = items.map(item => {
            let mod = item;
            if (!mod.id) {
              needsResave = true;
              mod = { ...mod, id: generateId() };
            }
            if (key === 'projects') {
              if (mod.startValue !== 0 || mod.endValue !== 100) {
                needsResave = true;
                mod = { ...mod, startValue: 0, endValue: 100 };
              }
              const pProg = Number(mod.progress) || 0;
              if (pProg === 0 && mod.status !== 'Not started') {
                needsResave = true;
                mod = { ...mod, status: 'Not started', progress: 0 };
              } else if (pProg === 1 && mod.status !== 'Done') {
                needsResave = true;
                mod = { ...mod, status: 'Done', progress: 1 };
              }
            }
            if (key === 'employees') {
              if (!mod.passwordHash) {
                needsResave = true;
                mod = { ...mod, passwordHash: DEFAULT_PASSWORD_HASH };
              }
              if ((mod.id === '1' || mod.email === 'swastikk005@gmail.com') && mod.role === 'Product Lead') {
                needsResave = true;
                mod = { ...mod, role: 'Admin' };
              }
            }
            return mod;
          });
          if (needsResave) {
            localStorage.setItem(key, JSON.stringify(items));
          }
          loaded[key] = items;
        } catch {
          loaded[key] = seeded ? [] : seedData[key];
        }
      } else {
        loaded[key] = seeded ? [] : seedData[key];
      }
    });
    if (!seeded) {
      ['employees', 'projects', 'tasks', 'meetings'].forEach(key => {
        localStorage.setItem(key, JSON.stringify(seedData[key]));
      });
      localStorage.setItem('tracker_seeded', 'true');
    }

    // Sync project progress with associated tasks if any
    if (loaded.projects && loaded.tasks) {
      let needsProjectResave = false;
      const synced = loaded.projects.map(p => {
        const pTasks = loaded.tasks.filter(t => t.projectId === p.id);
        if (pTasks.length > 0) {
          const completed = pTasks.filter(t => t.status === 'Done').length;
          const calculatedProgress = completed / pTasks.length;
          const expectedStatus = calculatedProgress === 1 ? 'Done' : (calculatedProgress === 0 ? 'Not started' : 'In progress');
          if (p.progress !== calculatedProgress || p.status !== expectedStatus) {
            needsProjectResave = true;
            return {
              ...p,
              progress: calculatedProgress,
              status: expectedStatus
            };
          }
        }
        return p;
      });
      if (needsProjectResave) {
        loaded.projects = synced;
        localStorage.setItem('projects', JSON.stringify(synced));
      }
    }

    setData(loaded);
  }, []);

  // Persist changes to localStorage
  const save = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveMultiple = useCallback((updates) => {
    Object.entries(updates).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
    });
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Employee CRUD
  const addEmployee = (emp) => {
    const item = { ...emp, id: emp.id || generateId() };
    save('employees', [...data.employees, item]);
    return item;
  };
  const updateEmployee = (id, updates) => {
    if (!id) return;
    const updated = data.employees.map(e => e.id === id ? { ...e, ...updates } : e);
    save('employees', updated);
  };
  const removeEmployee = (id) => {
    if (!id) return;
    save('employees', data.employees.filter(e => e.id !== id));
  };

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
        return { ...p, progress, status };
      }
      return p;
    });
  };

  // Project CRUD
  const addProject = (proj) => {
    let finalStatus = proj.status || 'Not started';
    let finalProg = proj.progress !== undefined ? proj.progress : 0;
    if (finalProg === 0) finalStatus = 'Not started';
    else if (finalProg === 1) finalStatus = 'Done';
    else if (finalStatus === 'Not started' && finalProg > 0) finalStatus = 'In progress';

    const item = { ...proj, id: proj.id || generateId(), progress: finalProg, status: finalStatus, startValue: 0, endValue: 100 };
    save('projects', [...data.projects, item]);
    return item;
  };
  const updateProject = (id, updates) => {
    if (!id) return;
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
        return merged;
      }
      return p;
    });
    save('projects', updated);
  };
  const removeProject = (id) => {
    if (!id) return;
    save('projects', data.projects.filter(p => p.id !== id));
    // Also remove or unlink tasks associated with this project
    const remainingTasks = data.tasks.filter(t => t.projectId !== id);
    if (remainingTasks.length !== data.tasks.length) {
      save('tasks', remainingTasks);
    }
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
        id: t.id || generateId(),
        projectId: projectId
      }))
    ];

    save('projects', [...data.projects, projectItem]);
    save('tasks', newTasks);
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
      id: t.id || generateId(),
      projectId: projectId
    }));

    save('projects', updatedProjects);
    save('tasks', [...otherTasks, ...updatedProjectTasks]);
  };

  // Task CRUD
  const addTask = (task) => {
    const item = { ...task, id: task.id || generateId() };
    const nextTasks = [...data.tasks, item];

    let updatedProjects = data.projects;
    if (item.projectId) {
      updatedProjects = syncProjectProgress(item.projectId, nextTasks, updatedProjects);
    }
    saveMultiple({ tasks: nextTasks, projects: updatedProjects });
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
    saveMultiple({ tasks: nextTasks, projects: updatedProjects });
  };

  const removeTask = (id) => {
    if (!id) return;
    const targetTask = data.tasks.find(t => t.id === id);
    const nextTasks = data.tasks.filter(t => t.id !== id);

    let updatedProjects = data.projects;
    if (targetTask?.projectId) {
      updatedProjects = syncProjectProgress(targetTask.projectId, nextTasks, updatedProjects);
    }
    saveMultiple({ tasks: nextTasks, projects: updatedProjects });
  };

  // Meeting CRUD
  const addMeeting = (meeting) => {
    const item = { ...meeting, id: meeting.id || generateId() };
    save('meetings', [...data.meetings, item]);
    return item;
  };
  const updateMeeting = (id, updates) => {
    if (!id) return;
    const updated = data.meetings.map(m => m.id === id ? { ...m, ...updates } : m);
    save('meetings', updated);
  };
  const removeMeeting = (id) => {
    if (!id) return;
    save('meetings', data.meetings.filter(m => m.id !== id));
  };

  const getEmployee = (id) => data.employees.find(e => e.id === id) || null;
  const getProjectTasks = (projectId) => data.tasks.filter(t => t.projectId === projectId);

  const updateEmployeeCredentials = (email, newPasswordHash) => {
    if (!email) return;
    const updated = data.employees.map(e =>
      e.email?.toLowerCase() === email.toLowerCase() ? { ...e, passwordHash: newPasswordHash } : e
    );
    save('employees', updated);
  };

  const value = {
    ...data,
    getEmployee,
    getProjectTasks,
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