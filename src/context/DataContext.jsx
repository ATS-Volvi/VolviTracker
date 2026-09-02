import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { seedData } from './seed';

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
          // Fix any existing items in localStorage that were created without an id
          items = items.map(item => {
            if (!item.id) {
              needsResave = true;
              return { ...item, id: generateId() };
            }
            return item;
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
  };

  // Task CRUD
  const addTask = (task) => {
    const item = { ...task, id: task.id || generateId() };
    save('tasks', [...data.tasks, item]);
    return item;
  };
  const updateTask = (id, updates) => {
    if (!id) return;
    const updated = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    save('tasks', updated);
  };
  const removeTask = (id) => {
    if (!id) return;
    save('tasks', data.tasks.filter(t => t.id !== id));
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

  const value = {
    ...data,
    getEmployee,
    addEmployee, updateEmployee, removeEmployee,
    addProject, updateProject, removeProject,
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