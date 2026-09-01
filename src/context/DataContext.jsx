import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { seedData } from './seed';

const DataContext = createContext(null);

// Generate deterministic ID for seed data
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

  // Load data on mount; seed on very first visit
  useEffect(() => {
    const loaded = {};
    const seeded = localStorage.getItem('tracker_seeded') === 'true';
    ['employees', 'projects', 'tasks', 'meetings'].forEach(key => {
      const stored = localStorage.getItem(key);
      if (stored) {
        loaded[key] = JSON.parse(stored);
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
  const addEmployee = (emp) => save('employees', [...data.employees, { ...emp, id: emp.id || generateId() }]);
  const updateEmployee = (id, updates) => {
    const updated = data.employees.map(e => e.id === id ? { ...e, ...updates } : e);
    save('employees', updated);
  };
  const removeEmployee = (id) => save('employees', data.employees.filter(e => e.id !== id));

  // Project CRUD
  const addProject = (proj) => save('projects', [...data.projects, proj]);
  const updateProject = (id, updates) => {
    const updated = data.projects.map(p => p.id === id ? { ...p, ...updates } : p);
    save('projects', updated);
  };
  const removeProject = (id) => save('projects', data.projects.filter(p => p.id !== id));

  // Task CRUD
  const addTask = (task) => save('tasks', [...data.tasks, task]);
  const updateTask = (id, updates) => {
    const updated = data.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    save('tasks', updated);
  };
  const removeTask = (id) => save('tasks', data.tasks.filter(t => t.id !== id));

  // Meeting CRUD
  const addMeeting = (meeting) => save('meetings', [...data.meetings, meeting]);
  const updateMeeting = (id, updates) => {
    const updated = data.meetings.map(m => m.id === id ? { ...m, ...updates } : m);
    save('meetings', updated);
  };
  const removeMeeting = (id) => save('meetings', data.meetings.filter(m => m.id !== id));

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