import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ProjectForm = ({ isOpen, onClose, initial = null }) => {
  const { employees, addProjectWithTasks, updateProjectWithTasks, getProjectTasks } = useData();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    assigneeIds: [],
    status: 'Not started',
    startDate: '',
    endDate: '',
    startValue: 0,
    endValue: 100,
    progress: 0
  });

  // Project tasks state
  const [projectTasks, setProjectTasks] = useState([]);

  // New task inline input state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState([]);
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const assigneeDropdownRef = useRef(null);

  // Edit task state (for editing existing tasks in the list)
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    name: '',
    dueDate: '',
    assigneeIds: [],
    priority: 'Medium',
    status: 'Not started'
  });
  const [showEditAssigneeDropdown, setShowEditAssigneeDropdown] = useState(false);
  const editAssigneeDropdownRef = useRef(null);

  // Close assignee dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
      if (editAssigneeDropdownRef.current && !editAssigneeDropdownRef.current.contains(e.target)) {
        setShowEditAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  useEffect(() => {
    if (initial) {
      let initialAssigneeIds = [];
      if (Array.isArray(initial.assigneeIds)) {
        initialAssigneeIds = initial.assigneeIds;
      } else if (initial.assigneeId) {
        initialAssigneeIds = [initial.assigneeId];
      }

      let prog = initial.progress || 0;
      if (prog <= 1 && prog > 0) prog = Math.round(prog * 100);

      let initialStatus = initial.status || 'Not started';
      if (prog === 0) initialStatus = 'Not started';
      else if (prog === 100) initialStatus = 'Done';
      else if (initialStatus === 'Not started' && prog > 0) initialStatus = 'In progress';

      const existingTasks = getProjectTasks(initial.id) || [];
      // Normalize task assigneeIds
      const normalizedTasks = existingTasks.map(t => {
        let taskAssigneeIds = [];
        if (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0) {
          taskAssigneeIds = t.assigneeIds;
        } else if (t.assigneeId) {
          taskAssigneeIds = [t.assigneeId];
        }
        return { ...t, assigneeIds: taskAssigneeIds };
      });

      setProjectTasks(normalizedTasks);

      const today = getLocalDateString();
      const start = initial.startDate ? initial.startDate.slice(0, 10) : today;
      const end = initial.endDate ? initial.endDate.slice(0, 10) : '';

      setForm({
        name: initial.name || '',
        assigneeIds: initialAssigneeIds,
        status: initialStatus,
        startDate: start,
        endDate: end,
        startValue: 0,
        endValue: 100,
        progress: prog
      });

      setNewTaskDeadline(today);
      setNewTaskAssigneeIds(initialAssigneeIds.length > 0 ? [initialAssigneeIds[0]] : (employees[0] ? [employees[0].id] : []));
      setEditingTaskId(null);
    } else {
      const today = getLocalDateString();
      const twoWeeksLaterDate = new Date();
      twoWeeksLaterDate.setDate(twoWeeksLaterDate.getDate() + 14);
      const twoWeeksLater = getLocalDateString(twoWeeksLaterDate);

      setForm({
        name: '',
        assigneeIds: [],
        status: 'Not started',
        startDate: today,
        endDate: twoWeeksLater,
        startValue: 0,
        endValue: 100,
        progress: 0
      });

      setProjectTasks([]);
      setNewTaskTitle('');
      setNewTaskDeadline(today);
      setNewTaskAssigneeIds(employees[0] ? [employees[0].id] : []);
      setNewTaskPriority('Medium');
      setEditingTaskId(null);
    }
  }, [initial, isOpen, employees]);

  // Recalculate progress whenever projectTasks change
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
  const hasTasks = totalTasks > 0;
  const autoProgress = hasTasks ? Math.round((completedTasks / totalTasks) * 100) : form.progress;

  // Sync form status and progress when tasks change
  useEffect(() => {
    if (hasTasks) {
      setForm(prev => {
        let nextStatus = 'In progress';
        if (autoProgress === 100) nextStatus = 'Done';
        else if (autoProgress === 0) nextStatus = 'Not started';
        return { ...prev, progress: autoProgress, status: nextStatus };
      });
    }
  }, [autoProgress, hasTasks]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAssignee = (empId) => {
    setForm(prev => {
      const exists = prev.assigneeIds.includes(empId);
      const newIds = exists
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId];
      return { ...prev, assigneeIds: newIds };
    });
  };

  const toggleNewTaskAssignee = (empId) => {
    setNewTaskAssigneeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const toggleEditTaskAssignee = (empId) => {
    setEditTaskForm(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(empId)
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId]
    }));
  };

  const getTaskAssignees = (task) => {
    if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) {
      return task.assigneeIds.map(id => employees.find(e => e.id === id)).filter(Boolean);
    }
    if (task.assigneeId) {
      const emp = employees.find(e => e.id === task.assigneeId);
      return emp ? [emp] : [];
    }
    return [];
  };

  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const taskItem = {
      id: 'temp_' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: title,
      dueDate: newTaskDeadline || form.endDate || form.startDate,
      assigneeIds: newTaskAssigneeIds.length > 0 ? [...newTaskAssigneeIds] : (form.assigneeIds.length > 0 ? [form.assigneeIds[0]] : []),
      assigneeId: newTaskAssigneeIds[0] || form.assigneeIds[0] || (employees[0]?.id || ''),
      priority: newTaskPriority,
      status: 'Not started',
      description: ''
    };

    setProjectTasks(prev => [...prev, taskItem]);
    setNewTaskTitle('');
    setNewTaskDeadline(getLocalDateString());
  };

  const handleStartEditTask = (task) => {
    setEditingTaskId(task.id);
    let ids = [];
    if (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0) {
      ids = [...task.assigneeIds];
    } else if (task.assigneeId) {
      ids = [task.assigneeId];
    }

    setEditTaskForm({
      name: task.name || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : getLocalDateString(),
      assigneeIds: ids,
      priority: task.priority || 'Medium',
      status: task.status || 'Not started'
    });
    setShowEditAssigneeDropdown(false);
  };

  const handleSaveEditTask = () => {
    if (!editTaskForm.name.trim()) return;

    setProjectTasks(prev =>
      prev.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            name: editTaskForm.name.trim(),
            dueDate: editTaskForm.dueDate,
            assigneeIds: editTaskForm.assigneeIds,
            assigneeId: editTaskForm.assigneeIds[0] || '',
            priority: editTaskForm.priority,
            status: editTaskForm.status
          };
        }
        return t;
      })
    );
    setEditingTaskId(null);
    setShowEditAssigneeDropdown(false);
    addToast('Task updated!', 'success', 2000);
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setShowEditAssigneeDropdown(false);
  };

  const handleToggleTaskStatus = (taskId) => {
    setProjectTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'Done' ? 'In progress' : 'Done';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleRemoveTask = (taskId) => {
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setShowEditAssigneeDropdown(false);
    }
    setProjectTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const submit = (e) => {
    e.preventDefault();
    const progVal = Number(form.progress) || 0;
    const effectiveProgress = progVal / 100;
    let finalStatus = form.status;
    if (progVal === 0) finalStatus = 'Not started';
    else if (progVal === 100) finalStatus = 'Done';
    else if (finalStatus === 'Not started' && progVal > 0) finalStatus = 'In progress';

    const payload = {
      ...form,
      assigneeIds: form.assigneeIds,
      assigneeId: form.assigneeIds[0] || '', // legacy compatibility
      startValue: 0,
      endValue: 100,
      progress: effectiveProgress,
      status: finalStatus
    };

    // Ensure each task in projectTasks has both assigneeIds and assigneeId
    const formattedTasks = projectTasks.map(t => ({
      ...t,
      assigneeIds: Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0 ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []),
      assigneeId: (Array.isArray(t.assigneeIds) && t.assigneeIds[0]) || t.assigneeId || ''
    }));

    if (initial) {
      updateProjectWithTasks(initial.id, payload, formattedTasks);
      addToast(`Updated project "${form.name}"!`, 'success');
    } else {
      addProjectWithTasks(payload, formattedTasks);
      addToast(`Created project "${form.name}" with ${formattedTasks.length} tasks!`, 'success');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edit Project' : 'Create New Project'}
      maxWidth="max-w-5xl xl:max-w-6xl"
    >
      <form onSubmit={submit} className="space-y-6">
        {/* Top: Project Info & Team */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Core Fields */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                className="input-field text-sm font-semibold"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="e.g. Mobile App Redesign"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Status</label>
                <select
                  className="input-field text-sm bg-white"
                  value={form.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let nextProg = form.progress;
                    if (newStatus === 'Not started') {
                      nextProg = 0;
                    } else if (newStatus === 'Done') {
                      nextProg = 100;
                    } else if (newStatus === 'In progress') {
                      if (form.progress === 0) nextProg = 25;
                      else if (form.progress === 100) nextProg = 50;
                    }
                    setForm(prev => ({ ...prev, status: newStatus, progress: nextProg }));
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Progress
                    {hasTasks && (
                      <span className="ml-1 text-[11px] font-normal text-gray-400">
                        ({completedTasks}/{totalTasks} tasks)
                      </span>
                    )}
                  </label>
                  <span className="text-xs font-bold text-emerald-600 tabular-nums">
                    {form.progress}%
                  </span>
                </div>
                <div className="flex items-center gap-2 h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-xs hover:border-gray-300 transition">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      let nextStatus = 'In progress';
                      if (val === 0) nextStatus = 'Not started';
                      else if (val === 100) nextStatus = 'Done';
                      setForm(prev => ({ ...prev, progress: val, status: nextStatus }));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.startDate}
                  onChange={set('startDate')}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">End Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={form.endDate}
                  onChange={set('endDate')}
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Column: Assigned Team Members */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Team Members ({form.assigneeIds.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, assigneeIds: employees.map(e => e.id) }))}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, assigneeIds: [] }))}
                  className="text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/60 custom-scrollbar flex-1">
              {employees.map(emp => {
                const isSelected = form.assigneeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleAssignee(emp.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-4 w-4 accent-blue-600 rounded"
                    />
                    <img
                      src={emp.avatar}
                      alt={emp.fullName}
                      className="w-6 h-6 rounded-full object-cover border border-white shrink-0"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=0070F3&color=fff`;
                      }}
                    />
                    <div className="truncate flex-1">
                      <div className="truncate">{emp.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-normal truncate">{emp.role || emp.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dedicated Tasks & Deadlines Section */}
        <div className="border-t border-gray-200 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900">Project Tasks & Deadlines</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {completedTasks}/{totalTasks} Completed ({hasTasks ? autoProgress : 0}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Tasks marked as <span className="font-semibold text-emerald-600">Done</span> automatically calculate this project's progress percentage. You can add, edit, or assign multiple employees.
              </p>
            </div>

            {hasTasks && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Live Project Progress: {autoProgress}%</span>
              </div>
            )}
          </div>

          {/* Quick Task Adder Form */}
          <div className="p-3 sm:p-4 rounded-xl border border-gray-200/90 bg-slate-50/70 space-y-3">
            <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Task with Deadlines & Multiple Assignees</span>
              </div>
              {newTaskAssigneeIds.length > 0 && (
                <span className="text-[11px] font-medium text-blue-600">
                  {newTaskAssigneeIds.length} employee{newTaskAssigneeIds.length > 1 ? 's' : ''} assigned
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
              {/* Task Title */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Task title (e.g. Design wireframes)..."
                  className="input-field text-xs h-9 bg-white"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }}
                />
              </div>

              {/* Deadline */}
              <div className="sm:col-span-3">
                <input
                  type="date"
                  className="input-field text-xs h-9 bg-white"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  title="Task deadline"
                />
                <div className="flex items-center gap-1 mt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNewTaskDeadline(getLocalDateString())}
                    className={`px-1.5 py-0.5 rounded font-medium transition ${
                      newTaskDeadline === getLocalDateString()
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setNewTaskDeadline(getLocalDateString(d));
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setNewTaskDeadline(getLocalDateString(d));
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                  >
                    +1w
                  </button>
                  {form.endDate && (
                    <button
                      type="button"
                      onClick={() => setNewTaskDeadline(form.endDate)}
                      className={`px-1.5 py-0.5 rounded font-medium transition ${
                        newTaskDeadline === form.endDate
                          ? 'bg-blue-600 text-white font-bold shadow-2xs'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title="Set to project end date"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Select Assignee Dropdown */}
              <div className="sm:col-span-3 relative" ref={assigneeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="input-field text-xs h-9 bg-white flex items-center justify-between gap-1.5 w-full text-left"
                  title="Assign one or more employees"
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                    {newTaskAssigneeIds.length === 0 ? (
                      <span className="text-gray-400 truncate flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Assign team (0)</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          {newTaskAssigneeIds.slice(0, 3).map(id => {
                            const emp = employees.find(e => e.id === id);
                            return emp ? (
                              <img
                                key={id}
                                src={emp.avatar}
                                alt={emp.fullName}
                                className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
                              />
                            ) : null;
                          })}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-800 truncate">
                          {newTaskAssigneeIds.length === 1
                            ? employees.find(e => e.id === newTaskAssigneeIds[0])?.fullName.split(' ')[0]
                            : `${newTaskAssigneeIds.length} assignees`}
                        </span>
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      showAssigneeDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Multi-Select Assignee Popover */}
                {showAssigneeDropdown && (
                  <div className="absolute z-30 left-0 mt-1 w-64 rounded-xl bg-white border border-gray-200 shadow-xl p-2 max-h-56 overflow-y-auto custom-scrollbar animate-slide-up text-left">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-[11px]">
                      <span className="font-semibold text-gray-700">Assign Multiple Employees</span>
                      <div className="flex items-center gap-1.5">
                        {form.assigneeIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setNewTaskAssigneeIds([...form.assigneeIds])}
                            className="text-blue-600 hover:underline text-[10px] font-medium"
                          >
                            All Project
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setNewTaskAssigneeIds([])}
                          className="text-gray-400 hover:text-gray-600 text-[10px]"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {employees.map(e => {
                        const isSelected = newTaskAssigneeIds.includes(e.id);
                        return (
                          <div
                            key={e.id}
                            onClick={() => toggleNewTaskAssignee(e.id)}
                            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                              isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="h-3.5 w-3.5 accent-blue-600 rounded"
                            />
                            <img
                              src={e.avatar}
                              alt={e.fullName}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                              onError={(ev) => {
                                ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=0070F3&color=fff`;
                              }}
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <div className="truncate">{e.fullName}</div>
                              <div className="text-[10px] text-gray-400 font-normal truncate">{e.role || 'Member'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority & Add Button */}
              <div className="sm:col-span-2 flex items-start gap-1.5">
                <select
                  className="input-field text-xs h-9 bg-white flex-1"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="btn-primary text-xs font-semibold px-3.5 h-9 shrink-0 disabled:opacity-50 inline-flex items-center justify-center"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List / Checklist with Inline Edit */}
          {projectTasks.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs max-h-72 overflow-y-auto custom-scrollbar">
              {projectTasks.map((task, idx) => {
                const isEditing = editingTaskId === task.id;
                const isDone = task.status === 'Done';
                const taskAssignees = getTaskAssignees(task);

                // INLINE EDIT MODE FOR THIS TASK
                if (isEditing) {
                  return (
                    <div
                      key={task.id || idx}
                      className="p-3 bg-blue-50/50 border-l-4 border-l-blue-600 space-y-2.5 transition animate-slide-up"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editing Task
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditTask}
                            className="text-xs font-semibold px-2.5 py-1 text-gray-600 hover:bg-gray-200/70 rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditTask}
                            disabled={!editTaskForm.name.trim()}
                            className="btn-primary text-xs font-bold px-3 py-1 inline-flex items-center gap-1 shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                        {/* Title input */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={editTaskForm.name}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                            className="input-field text-xs h-9 bg-white font-medium"
                            placeholder="Task name..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditTask();
                              } else if (e.key === 'Escape') {
                                handleCancelEditTask();
                              }
                            }}
                          />
                        </div>

                        {/* Deadline */}
                        <div className="sm:col-span-3">
                          <input
                            type="date"
                            value={editTaskForm.dueDate}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                            className="input-field text-xs h-9 bg-white"
                          />
                          <div className="flex items-center gap-1 mt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString() })}
                              className={`px-1.5 py-0.5 rounded font-medium transition ${
                                editTaskForm.dueDate === getLocalDateString()
                                  ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 3);
                                setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString(d) });
                              }}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + 7);
                                setEditTaskForm({ ...editTaskForm, dueDate: getLocalDateString(d) });
                              }}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded font-medium transition"
                            >
                              +1w
                            </button>
                            {form.endDate && (
                              <button
                                type="button"
                                onClick={() => setEditTaskForm({ ...editTaskForm, dueDate: form.endDate })}
                                className={`px-1.5 py-0.5 rounded font-medium transition ${
                                  editTaskForm.dueDate === form.endDate
                                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Set to project end date"
                              >
                                End
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Multi-Assignee selector in edit */}
                        <div className="sm:col-span-3 relative" ref={editAssigneeDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setShowEditAssigneeDropdown(!showEditAssigneeDropdown)}
                            className="input-field text-xs h-9 bg-white flex items-center justify-between gap-1 w-full text-left"
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
                              {editTaskForm.assigneeIds.length === 0 ? (
                                <span className="text-gray-400 truncate">Assign team (0)</span>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                  <div className="flex items-center -space-x-1 shrink-0">
                                    {editTaskForm.assigneeIds.slice(0, 3).map(id => {
                                      const emp = employees.find(e => e.id === id);
                                      return emp ? (
                                        <img key={id} src={emp.avatar} alt={emp.fullName} className="w-4 h-4 rounded-full object-cover ring-1 ring-white" />
                                      ) : null;
                                    })}
                                  </div>
                                  <span className="text-[11px] font-semibold text-gray-800 truncate">
                                    {editTaskForm.assigneeIds.length === 1
                                      ? employees.find(e => e.id === editTaskForm.assigneeIds[0])?.fullName.split(' ')[0]
                                      : `${editTaskForm.assigneeIds.length} assignees`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showEditAssigneeDropdown && (
                            <div className="absolute z-30 left-0 mt-1 w-60 rounded-xl bg-white border border-gray-200 shadow-xl p-2 max-h-52 overflow-y-auto custom-scrollbar animate-slide-up text-left">
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-[11px]">
                                <span className="font-semibold text-gray-700">Assign Employees</span>
                                <button
                                  type="button"
                                  onClick={() => setEditTaskForm(prev => ({ ...prev, assigneeIds: [] }))}
                                  className="text-gray-400 hover:text-gray-600 text-[10px]"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="space-y-1">
                                {employees.map(e => {
                                  const isSelected = editTaskForm.assigneeIds.includes(e.id);
                                  return (
                                    <div
                                      key={e.id}
                                      onClick={() => toggleEditTaskAssignee(e.id)}
                                      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                                        isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="h-3.5 w-3.5 accent-blue-600 rounded"
                                      />
                                      <img src={e.avatar} alt={e.fullName} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                      <span className="truncate">{e.fullName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Priority & Status */}
                        <div className="sm:col-span-2 flex items-start gap-1.5">
                          <select
                            className="input-field text-xs h-9 bg-white flex-1"
                            value={editTaskForm.priority}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                            title="Priority"
                          >
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <select
                            className="input-field text-xs h-9 bg-white flex-1"
                            value={editTaskForm.status}
                            onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                            title="Status"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                }

                // NORMAL TASK ROW DISPLAY
                return (
                  <div
                    key={task.id || idx}
                    className={`flex items-center justify-between p-3 transition text-xs group ${
                      isDone ? 'bg-emerald-50/30' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                            : 'border-gray-300 hover:border-emerald-500 bg-white'
                        }`}
                        title={isDone ? 'Mark In progress' : 'Mark as Done'}
                      >
                        {isDone && (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleStartEditTask(task)}>
                        <span
                          className={`font-semibold text-gray-900 block truncate group-hover:text-blue-600 transition ${
                            isDone ? 'line-through text-gray-400' : ''
                          }`}
                          title="Click to edit task"
                        >
                          {task.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      {/* Priority pill */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          task.priority === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : task.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {task.priority || 'Medium'}
                      </span>

                      {/* Deadline chip */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-md">
                          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{task.dueDate.slice(0, 10)}</span>
                        </div>
                      )}

                      {/* Multi-Assignee Avatars Cluster */}
                      {taskAssignees.length > 0 ? (
                        <div
                          className="flex items-center gap-1.5"
                          title={`Assigned to: ${taskAssignees.map(a => a.fullName).join(', ')}`}
                        >
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {taskAssignees.slice(0, 3).map(a => (
                              <img
                                key={a.id}
                                src={a.avatar}
                                alt={a.fullName}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-white border border-gray-200"
                                onError={(ev) => {
                                  ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(a.fullName)}&background=0070F3&color=fff`;
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-600 hidden sm:inline max-w-[90px] truncate">
                            {taskAssignees.length === 1
                              ? taskAssignees[0].fullName.split(' ')[0]
                              : `${taskAssignees.length} assignees`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'In progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {task.status || 'Not started'}
                      </span>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditTask(task)}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition"
                        title="Edit task"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(task.id)}
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                        title="Remove task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 px-4 text-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-xs font-semibold text-gray-700">No tasks added to this project yet</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Add tasks and deadlines above. Their completion status will automatically compute this project's progress!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {hasTasks ? (
              <span>
                Progress: <strong className="text-emerald-600">{autoProgress}%</strong> ({completedTasks}/{totalTasks} tasks done)
              </span>
            ) : (
              <span>No tasks linked (using manual progress)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs font-bold px-5 py-2">
              {initial ? 'Save Project & Tasks' : 'Create Project with Tasks'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;
