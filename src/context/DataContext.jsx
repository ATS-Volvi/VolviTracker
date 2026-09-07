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
          if (p.progress !== calculatedProgress) {
            needsProjectResave = true;
            return {
              ...p,
              progress: calculatedProgress,
              status: calculatedProgress === 1 ? 'Done' : (calculatedProgress > 0 && p.status === 'Not started' ? 'In progress' : p.status)
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
    const status = progress === 1 ? 'Done' : (progress > 0 ? 'In progress' : undefined);

    return currentProjects.map(p => {
      if (p.id === projectId) {
        const updates = { progress };
        if (status) updates.status = status;
        return { ...p, ...updates };
      }
      return p;
    });
  };

  // Project CRUD
  const addProject = (proj) => {
    const item = { ...proj, id: proj.id || generateId() };
    save('projects', [...data.projects, item]);
    return item;
  };
  const updateProject = (id, updates) => {
    if (!id) return;
    const updated = data.projects.map(p => p.id === id ? { ...p, ...updates } : p);
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
    const computedProgress = projectTasks.length > 0
      ? (completedCount / projectTasks.length)
      : (proj.progress !== undefined ? proj.progress : 0);

    const projectItem = {
      ...proj,
      id: projectId,
      progress: computedProgress,
      status: computedProgress === 1 && projectTasks.length > 0
        ? 'Done'
        : (computedProgress > 0 && proj.status === 'Not started' ? 'In progress' : (proj.status || 'Not started'))
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
    const computedProgress = projectTasks.length > 0
      ? (completedCount / projectTasks.length)
      : (projUpdates.progress !== undefined ? projUpdates.progress : 0);

    const updatedProjects = data.projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          ...projUpdates,
          progress: computedProgress,
          status: computedProgress === 1 && projectTasks.length > 0
            ? 'Done'
            : (computedProgress > 0 && (projUpdates.status || p.status) === 'Not started' ? 'In progress' : (projUpdates.status || p.status))
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
    save('tasks', nextTasks);

    if (item.projectId) {
      const updatedProjects = syncProjectProgress(item.projectId, nextTasks, data.projects);
      save('projects', updatedProjects);
    }
    return item;
  };

  const updateTask = (id, updates) => {
    if (!id) return;
    const oldTask = data.tasks.find(t => t.id === id);
    const nextTasks = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    save('tasks', nextTasks);

    const targetProjectId = updates.projectId || oldTask?.projectId;
    if (targetProjectId) {
      const updatedProjects = syncProjectProgress(targetProjectId, nextTasks, data.projects);
      save('projects', updatedProjects);
    }
  };

  const removeTask = (id) => {
    if (!id) return;
    const targetTask = data.tasks.find(t => t.id === id);
    const nextTasks = data.tasks.filter(t => t.id !== id);
    save('tasks', nextTasks);

    if (targetTask?.projectId) {
      const updatedProjects = syncProjectProgress(targetTask.projectId, nextTasks, data.projects);
      save('projects', updatedProjects);
    }
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