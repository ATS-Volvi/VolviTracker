import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

export const FilterControls = ({ onFilterChange, dateRange, setDateRange }) => {
  const { projects, tasks, employees, meetings } = useData();
  const [projectStatus, setProjectStatus] = useState('');
  const [taskPriority, setTaskPriority] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');

  const isWithinRange = (dateStr, range) => {
    if (!dateStr) return true;
    if (!range.start && !range.end) return true;
    const d = new Date(dateStr);
    const start = range.start ? new Date(range.start) : null;
    const end = range.end ? new Date(range.end) : null;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  const filteredProjects = projects.filter(p => !projectStatus || p.status === projectStatus);
  const filteredTasks = tasks.filter(t => !taskPriority || t.priority === taskPriority);
  const filteredMeetings = meetings.filter(m => isWithinRange(m.dateTime, dateRange));
  const filteredEmployees = employees.filter(e => !employeeRole || (e.role || '') === employeeRole);

  useEffect(() => {
    onFilterChange?.({
      projects: filteredProjects,
      tasks: filteredTasks,
      meetings: filteredMeetings,
      employees: filteredEmployees
    });
  }, [projectStatus, taskPriority, employeeRole, dateRange, projects, tasks, meetings, employees]);

  const clearAll = () => {
    setProjectStatus('');
    setTaskPriority('');
    setEmployeeRole('');
    if (setDateRange) setDateRange({ start: '', end: '' });
  };

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Project Status</label>
        <select className="input-field" value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)}>
          <option value="">All Projects</option>
          {['Not started', 'In progress', 'Done'].map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Task Priority</label>
        <select className="input-field" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {['Low', 'Medium', 'High'].map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Employee Role</label>
        <select className="input-field" value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)}>
          <option value="">All Roles</option>
          {[...new Set(employees.map(e => e.role || 'Unspecified'))].map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
        <div className="flex gap-2">
          <input type="date" className="input-field flex-1" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} placeholder="Start" />
          <input type="date" className="input-field flex-1" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} placeholder="End" />
        </div>
      </div>
      <div>
        <button className="btn-ghost mt-5" onClick={clearAll}>Clear All</button>
      </div>
    </div>
  );
};

export default FilterControls;