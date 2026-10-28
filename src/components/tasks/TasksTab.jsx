import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';
import { StatusSelect } from '../widgets/StatusSelect';
import { PriorityPill } from '../widgets/PriorityPill';
import { TaskForm } from '../forms/TaskForm';
import { sortTasks } from '../../utils/taskSort';
import { downloadTaskTemplateExcel, parseTaskExcelFile } from '../../utils/excelTaskImport';

const STATUSES = ['In progress', 'Not started', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
};

export const TasksTab = ({
  tasks: tasksProp,
  projects: projectsProp,
  heading = 'Tasks Tracker',
  defaultProjectId = null,
  showBackToProjects = false,
  showQuickInlineAdd = true,
  showExcelActions = true
}) => {
  const { user, isAdmin, isProjectManager } = useAuth();
  const canAssignAnyone = Boolean(isAdmin || isProjectManager);
  const { tasks: allTasks = [], projects: allProjects = [], employees = [], getEmployee, addTask, updateTask, removeTask } = useData();
  const { addToast } = useToast();
  const tasks = tasksProp || allTasks;

  const [searchParams, setSearchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');

  // Available project tabs:
  // Project-based segregation tabs
  const [activeProjectTab, setActiveProjectTab] = useState(() => {
    return (defaultProjectId && defaultProjectId !== 'all') ? String(defaultProjectId) : (urlProjectId || 'all');
  });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'done'
  const [viewMode, setViewMode] = useState('table'); // 'table', 'cards', 'checklist', 'status'
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Available project tabs:
  // 1. If projectsProp is explicitly passed (e.g. employee's assigned projects), show those projects.
  // 2. Else if tasksProp is passed, restrict project tabs to projects that actually have tasks in tasksProp.
  // 3. Otherwise (global dashboard), show all projects.
  const relevantProjects = useMemo(() => {
    let list = projectsProp !== undefined
      ? [...projectsProp]
      : (tasksProp ? allProjects.filter(p => tasks.some(t => String(t.projectId) === String(p.id))) : [...allProjects]);

    const targetPid = (activeProjectTab && activeProjectTab !== 'all' && activeProjectTab !== 'unassigned')
      ? activeProjectTab
      : (defaultProjectId && defaultProjectId !== 'all' && defaultProjectId !== 'unassigned' ? defaultProjectId : null);

    if (targetPid && !list.some(p => String(p.id) === String(targetPid))) {
      const found = allProjects.find(p => String(p.id) === String(targetPid));
      if (found) list.unshift(found);
    }
    return list;
  }, [projectsProp, tasksProp, allProjects, tasks, activeProjectTab, defaultProjectId]);

  // Quick inline task adder state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDeadline, setQuickDeadline] = useState(getLocalDateString());
  const [quickPriority, setQuickPriority] = useState('Medium');
  const [quickAssigneeIds, setQuickAssigneeIds] = useState([]);
  const [showQuickAssigneeDropdown, setShowQuickAssigneeDropdown] = useState(false);
  const quickAssigneeRef = useRef(null);

  // Excel import/export state
  const excelFileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  // Sync active project when defaultProjectId or urlProjectId changes
  useEffect(() => {
    if (defaultProjectId && defaultProjectId !== 'all') {
      setActiveProjectTab(String(defaultProjectId));
    } else if (urlProjectId) {
      setActiveProjectTab(String(urlProjectId));
    }
  }, [defaultProjectId, urlProjectId]);

  const handleSelectProjectTab = (pId) => {
    setActiveProjectTab(pId);
    setIsProjectDropdownOpen(false);
    if (searchParams.has('projectId') || urlProjectId || defaultProjectId) {
      const nextParams = new URLSearchParams(searchParams);
      if (pId === 'all') {
        nextParams.delete('projectId');
      } else {
        nextParams.set('projectId', pId);
      }
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Project Dropdown state
  const projectDropdownRef = useRef(null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setIsProjectDropdownOpen(false);
      }
      if (quickAssigneeRef.current && !quickAssigneeRef.current.contains(e.target)) {
        setShowQuickAssigneeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-reset activeProjectTab if the selected project tab is no longer valid
  useEffect(() => {
    if (relevantProjects.length > 0 && activeProjectTab !== 'all' && activeProjectTab !== 'unassigned') {
      if (defaultProjectId && String(defaultProjectId) === String(activeProjectTab)) {
        return;
      }
      if (allProjects.some(p => String(p.id) === String(activeProjectTab))) {
        return;
      }
      if (!relevantProjects.some(p => String(p.id) === String(activeProjectTab))) {
        setActiveProjectTab('all');
      }
    }
  }, [relevantProjects, activeProjectTab, defaultProjectId, allProjects]);

  const getProject = (pId) => allProjects.find(p => String(p.id) === String(pId));
  const unassignedCount = (allTasks || tasks).filter(t => !t.projectId || !allProjects.some(p => String(p.id) === String(t.projectId))).length;

  const selectedProjectInfo = useMemo(() => {
    if (activeProjectTab === 'all') {
      return {
        label: 'All Tasks',
        count: tasks.length,
        progress: null
      };
    }
    if (activeProjectTab === 'unassigned') {
      return {
        label: 'No Project',
        count: unassignedCount,
        progress: null
      };
    }
    const p = relevantProjects.find(item => String(item.id) === String(activeProjectTab))
      || allProjects.find(item => String(item.id) === String(activeProjectTab));
    if (!p) {
      return { label: 'All Tasks', count: tasks.length, progress: null };
    }
    const count = (allTasks || tasks).filter(t => String(t.projectId) === String(p.id)).length;
    const pPct = Math.round((p.progress <= 1 && p.progress > 0 ? p.progress * 100 : (p.progress || 0)));
    return {
      label: p.name,
      count,
      progress: count > 0 ? pPct : null
    };
  }, [activeProjectTab, tasks, relevantProjects, allProjects, unassignedCount]);

  // Tasks segregated by active project tab:
  // When 'all', show current tasks collection (tasksProp or allTasks)
  // When a specific project tab is selected, show all tasks for that project from allTasks
  const currentProjectTasks = activeProjectTab === 'all'
    ? tasks
    : activeProjectTab === 'unassigned'
      ? (allTasks || tasks).filter(t => !t.projectId || !allProjects.some(p => String(p.id) === String(t.projectId)))
      : (allTasks || tasks).filter(t => String(t.projectId) === String(activeProjectTab));

  // Tasks sorted: incomplete on top, upcoming next, completed at the bottom
  const sortedCurrentProjectTasks = sortTasks(currentProjectTasks);

  // Tasks further filtered by status
  const displayedTasks = sortedCurrentProjectTasks.filter(t => {
    if (statusFilter === 'active') return t.status !== 'Done';
    if (statusFilter === 'done') return t.status === 'Done';
    return true;
  });

  const activeCount = currentProjectTasks.filter(t => t.status !== 'Done').length;
  const completedCount = currentProjectTasks.filter(t => t.status === 'Done').length;

  const getTaskAssignees = (t) => {
    if (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0) {
      return t.assigneeIds.map(id => getEmployee(id)).filter(Boolean);
    }
    if (t.assigneeId) {
      const emp = getEmployee(t.assigneeId);
      return emp ? [emp] : [];
    }
    return [];
  };

  const AssigneesDisplay = ({ task }) => {
    const emps = getTaskAssignees(task);
    if (emps.length === 0) {
      return <span className="text-xs text-gray-400 italic">Unassigned</span>;
    }
    return (
      <div className="flex items-center gap-1.5 min-w-0" title={emps.map(e => e.fullName).join(', ')}>
        <div className="flex items-center -space-x-1.5 shrink-0 overflow-hidden">
          {emps.slice(0, 3).map(e => (
            <Avatar key={e.id} src={e.avatar} alt={e.fullName} className="h-6 w-6 ring-2 ring-white" />
          ))}
        </div>
        <span className="text-xs text-gray-600 truncate max-w-[120px]">
          {emps.length === 1 ? emps[0].fullName : `${emps.length} assigned`}
        </span>
      </div>
    );
  };

  const getTaskHierarchyInfo = (task) => {
    if (!task?.parentId) return { level: 0, parent: null, ancestors: [] };
    const taskMap = new Map((allTasks || []).map(t => [String(t.id), t]));
    let curr = task;
    let level = 0;
    const ancestors = [];
    const visited = new Set([String(task.id)]);

    while (curr && curr.parentId) {
      const parent = taskMap.get(String(curr.parentId));
      if (!parent || visited.has(String(parent.id))) break;
      visited.add(String(parent.id));
      ancestors.push(parent);
      level++;
      curr = parent;
    }

    return {
      level,
      parent: ancestors[0] || null,
      ancestors
    };
  };

  // Organize displayed tasks in tree order for arbitrary n-level nesting
  const hierarchicalDisplayedTasks = useMemo(() => {
    const list = [...displayedTasks];
    const taskIds = new Set(list.map(t => String(t.id)));
    const byParent = new Map();
    const roots = [];

    list.forEach(t => {
      const pId = t.parentId ? String(t.parentId) : null;
      if (!pId || !taskIds.has(pId)) {
        roots.push(t);
      } else {
        if (!byParent.has(pId)) byParent.set(pId, []);
        byParent.get(pId).push(t);
      }
    });

    const sortedRoots = sortTasks(roots);
    const result = [];
    const visited = new Set();

    const traverse = (node, level, parent = null) => {
      if (visited.has(String(node.id))) return;
      visited.add(String(node.id));
      result.push({ ...node, level, parent });

      const children = byParent.get(String(node.id)) || [];
      const sortedChildren = sortTasks(children);
      sortedChildren.forEach(child => traverse(child, level + 1, node));
    };

    sortedRoots.forEach(root => traverse(root, 0, null));

    // Fallback for any orphan tasks that weren't captured
    list.forEach(t => {
      if (!visited.has(String(t.id))) {
        visited.add(String(t.id));
        const info = getTaskHierarchyInfo(t);
        result.push({ ...t, level: info.level, parent: info.parent });
      }
    });

    return result;
  }, [displayedTasks, allTasks]);

  const handleDeleteTask = (e, task) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${task.name}"?`)) {
      removeTask(task.id);
      addToast(`Removed task "${task.name}"`, 'info');
    }
  };

  const handleStatusChange = (taskId, newStatus, taskName) => {
    updateTask(taskId, { status: newStatus });
    if (newStatus === 'Done') {
      // Also cascade completion to all descendant subtasks recursively
      const descendants = [];
      const queue = [String(taskId)];
      const seen = new Set([String(taskId)]);
      while (queue.length > 0) {
        const pId = queue.shift();
        (allTasks || []).forEach(t => {
          if (t.parentId && String(t.parentId) === pId && !seen.has(String(t.id))) {
            seen.add(String(t.id));
            descendants.push(t.id);
            queue.push(String(t.id));
          }
        });
      }
      descendants.forEach(dId => updateTask(dId, { status: 'Done' }));
      addToast(`Completed "${taskName}"!`, 'success');
    } else {
      addToast(`Updated status to "${newStatus}"`, 'info');
    }
  };

  const handleNewTask = () => {
    // If a specific project tab is selected, preselect that project in the new task form
    if (activeProjectTab !== 'all' && activeProjectTab !== 'unassigned') {
      setEditing({ projectId: activeProjectTab });
    } else {
      setEditing(null);
    }
    setOpen(true);
  };

  const handleQuickAddTask = (e) => {
    if (e) e.preventDefault();
    const title = quickTitle.trim();
    if (!title) {
      addToast('Please enter a task title.', 'warning', 2500);
      return;
    }

    const targetProjectId = (activeProjectTab !== 'all' && activeProjectTab !== 'unassigned')
      ? activeProjectTab
      : '';

    const assignedIds = (!canAssignAnyone && user?.id)
      ? [user.id]
      : [...quickAssigneeIds];

    const newTask = {
      name: title,
      dueDate: quickDeadline || getLocalDateString(),
      priority: quickPriority,
      status: 'Not started',
      projectId: targetProjectId,
      assigneeIds: assignedIds,
      assigneeId: assignedIds[0] || '',
      description: ''
    };

    addTask(newTask);
    setQuickTitle('');
    setQuickDeadline(getLocalDateString());
    setQuickAssigneeIds([]);
    addToast(`Added task "${title}"!`, 'success', 2500);
  };

  const handleDownloadTemplate = () => {
    try {
      downloadTaskTemplateExcel(employees);
      addToast('Tasks template downloaded!', 'success', 3000);
    } catch (err) {
      console.error('Template download error:', err);
      addToast('Failed to download template', 'error', 3000);
    }
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const targetProjectId = (activeProjectTab !== 'all' && activeProjectTab !== 'unassigned') ? activeProjectTab : '';
      const { tasks: parsedTasks, count } = await parseTaskExcelFile(
        file,
        employees,
        quickDeadline || getLocalDateString()
      );

      if (count === 0) {
        addToast('No tasks found in the uploaded file.', 'warning', 4000);
      } else {
        const idMap = new Map();
        parsedTasks.forEach(t => {
          if (!t.id || String(t.id).startsWith('temp_')) {
            idMap.set(t.id, 'task_' + Date.now() + Math.random().toString(36).substr(2, 6));
          }
        });

        parsedTasks.forEach(t => {
          const finalId = idMap.get(t.id) || t.id;
          const finalParentId = t.parentId ? (idMap.get(t.parentId) || t.parentId) : null;
          const assignedIds = (!canAssignAnyone && user?.id)
            ? [user.id]
            : (Array.isArray(t.assigneeIds) ? t.assigneeIds : (t.assigneeId ? [t.assigneeId] : []));

          addTask({
            ...t,
            id: finalId,
            parentId: finalParentId,
            projectId: targetProjectId || t.projectId || '',
            assigneeId: assignedIds[0] || '',
            assigneeIds: assignedIds
          });
        });
        addToast(`Successfully imported ${count} task${count > 1 ? 's' : ''}!`, 'success', 4000);
      }
    } catch (err) {
      console.error('Excel import error:', err);
      addToast(err.message || 'Failed to parse Excel file.', 'error', 4000);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const Th = ({ children }) => <th className="py-2.5 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">{children}</th>;
  const Td = ({ children, className = '' }) => <td className={`py-3 pr-4 align-middle ${className}`}>{children}</td>;

  const activeProjectObj = (activeProjectTab !== 'all' && activeProjectTab !== 'unassigned')
    ? getProject(activeProjectTab)
    : null;

  return (
    <section className="card p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{heading}</h2>
          {activeProjectObj && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500">
                Project: <strong className="text-gray-800 font-semibold">{activeProjectObj.name}</strong>
              </span>
              {activeProjectObj.clientName && (
                <span className="text-gray-500">
                  Client: <strong className="text-gray-700 font-medium">{activeProjectObj.clientName}</strong>
                </span>
              )}
              {(activeProjectObj.pocName || activeProjectObj.contactDesignation || activeProjectObj.clientDesignation) && (
                <span className="text-gray-500">
                  POC: <strong className="text-gray-700 font-medium">{activeProjectObj.pocName || 'Contact'}</strong>
                  {(activeProjectObj.contactDesignation || activeProjectObj.clientDesignation) && (
                    <span className="text-gray-400 font-normal"> ({activeProjectObj.contactDesignation || activeProjectObj.clientDesignation})</span>
                  )}
                </span>
              )}
              {activeProjectObj.contactEmail && (
                <a href={`mailto:${activeProjectObj.contactEmail}`} className="text-blue-600 hover:underline inline-flex items-center gap-0.5" title={activeProjectObj.contactEmail}>
                  ✉️ {activeProjectObj.contactEmail}
                </a>
              )}
              {activeProjectObj.contactNumber && (
                <a href={`tel:${activeProjectObj.contactNumber}`} className="text-emerald-700 hover:underline inline-flex items-center gap-0.5" title={activeProjectObj.contactNumber}>
                  📞 {activeProjectObj.contactNumber}
                </a>
              )}
              {activeProjectObj.refererName && (
                <span className="text-gray-500">
                  Ref: <span className="text-gray-600 italic">{activeProjectObj.refererName}</span>
                </span>
              )}
              <span className={`badge text-[10px] font-semibold ${
                activeProjectObj.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                activeProjectObj.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-700'
              }`}>
                {activeProjectObj.status || 'Not started'}
              </span>
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                {Math.round((activeProjectObj.progress <= 1 && activeProjectObj.progress > 0 ? activeProjectObj.progress * 100 : (activeProjectObj.progress || 0)))}% Progress
                {currentProjectTasks.length > 0 && ` (${completedCount}/${currentProjectTasks.length} tasks)`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {showExcelActions && (
            <>
              {/* Template Download Button */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                title="Download formatted Excel template for tasks"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition hover:border-slate-400 focus:outline-none cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download</span> Template
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => excelFileInputRef.current?.click()}
                disabled={isImporting}
                title="Import tasks from an Excel file (.xlsx, .xls, .csv)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 border border-emerald-600 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{isImporting ? 'Importing...' : 'Import Excel'}</span>
              </button>

              {/* Hidden file input */}
              <input
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleImportExcelFile}
              />
            </>
          )}

          <button
            className="btn-primary text-xs sm:text-sm flex items-center gap-1.5 shrink-0"
            onClick={handleNewTask}
          >
            <span className="font-bold">+</span> New task
          </button>
        </div>
      </div>

      {/* Sub-toolbar: Project Filter Dropdown + Status Filter Pills + View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 mb-4 text-xs">
        {/* Left: Project Selector Dropdown + Status Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Project Dropdown */}
          <div className="relative" ref={projectDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(prev => !prev)}
              className="h-8 px-3 rounded-lg border border-gray-200/90 bg-white hover:bg-gray-50/90 text-gray-800 font-medium flex items-center gap-2 text-xs shadow-2xs transition"
              title="Filter tasks by project"
            >
              <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-gray-400 font-normal">Project:</span>
              <span className="font-semibold text-gray-900 truncate max-w-[130px] sm:max-w-[200px]">
                {selectedProjectInfo.label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                {selectedProjectInfo.count}
              </span>
              {selectedProjectInfo.progress !== null && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {selectedProjectInfo.progress}%
                </span>
              )}
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isProjectDropdownOpen ? 'rotate-180 text-blue-600' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu Popup */}
            {isProjectDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden animate-slide-up max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Filter by Project</span>
                  <span className="text-[10px] font-normal text-gray-400">{relevantProjects.length} projects</span>
                </div>

                {/* All Tasks Option */}
                <button
                  type="button"
                  onClick={() => handleSelectProjectTab('all')}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                    activeProjectTab === 'all'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-sm">📋</span>
                    <span>All Tasks</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeProjectTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tasks.length}
                  </span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                {/* Individual Projects */}
                {relevantProjects.map(p => {
                  const count = (allTasks || tasks).filter(t => String(t.projectId) === String(p.id)).length;
                  const isActive = String(activeProjectTab) === String(p.id);
                  const pPct = Math.round((p.progress <= 1 && p.progress > 0 ? p.progress * 100 : (p.progress || 0)));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProjectTab(p.id)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="text-gray-400 text-sm shrink-0">📁</span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {pPct}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Unassigned Tasks (if any) */}
                {unassignedCount > 0 && (
                  <>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProjectTab('unassigned');
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition ${
                        activeProjectTab === 'unassigned'
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">📄</span>
                        <span>No Project (Unassigned)</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeProjectTab === 'unassigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {unassignedCount}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-medium mr-1 hidden md:inline">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              All ({currentProjectTasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === 'active'
                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                statusFilter === 'done'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <span>✓</span> Done ({completedCount})
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/60 ml-auto">
          <button
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-medium ${
              viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            title="Card Grid View"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-medium ${
              viewMode === 'cards' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            title="Checklist View"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-medium ${
              viewMode === 'checklist' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="hidden sm:inline">Checklist</span>
          </button>
          <button
            onClick={() => setViewMode('status')}
            title="Grouped By Status"
            className={`px-2 py-1 rounded-md transition flex items-center gap-1 font-medium ${
              viewMode === 'status' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="hidden sm:inline">By Status</span>
          </button>
        </div>
      </div>

      {/* Quick Inline Task Adder Bar */}
      {showQuickInlineAdd && (
        <form onSubmit={handleQuickAddTask} className="mb-4 p-3.5 rounded-xl border border-gray-200/90 bg-slate-50/70 space-y-2.5">
          <div className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{canAssignAnyone ? 'Quick Add Task with Deadlines & Assignees' : 'Quick Add Task (Self-assigned)'}</span>
            </div>
            {activeProjectObj ? (
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Project: {activeProjectObj.name}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-500">
                All Projects mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
            {/* Title */}
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Task title (e.g. Design wireframes, Review contract)..."
                className="input-field text-xs h-9 bg-white"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
            </div>

            {/* Deadline */}
            <div className="sm:col-span-3">
              <input
                type="date"
                className="input-field text-xs h-9 bg-white"
                value={quickDeadline}
                onChange={(e) => setQuickDeadline(e.target.value)}
              />
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                <button
                  type="button"
                  onClick={() => setQuickDeadline(getLocalDateString())}
                  className="px-1.5 py-0.5 rounded bg-gray-200/70 hover:bg-gray-300 transition text-gray-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeadline(addDaysToDate(3))}
                  className="px-1.5 py-0.5 rounded bg-gray-200/70 hover:bg-gray-300 transition text-gray-700"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDeadline(addDaysToDate(7))}
                  className="px-1.5 py-0.5 rounded bg-gray-200/70 hover:bg-gray-300 transition text-gray-700"
                >
                  +1w
                </button>
              </div>
            </div>

            {/* Assignees */}
            {canAssignAnyone ? (
              <div className="sm:col-span-2 relative" ref={quickAssigneeRef}>
                <button
                  type="button"
                  onClick={() => setShowQuickAssigneeDropdown(prev => !prev)}
                  className="w-full h-9 px-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-left text-xs flex items-center justify-between text-gray-700"
                >
                  <span className="truncate">
                    {quickAssigneeIds.length === 0
                      ? 'Assign team (0)'
                      : `${quickAssigneeIds.length} assigned`}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-gray-400">expand_more</span>
                </button>

                {showQuickAssigneeDropdown && (
                  <div className="absolute left-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-40 max-h-48 overflow-y-auto">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                      Select Assignees
                    </div>
                    {employees.map(emp => {
                      const isSel = quickAssigneeIds.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setQuickAssigneeIds(prev =>
                              prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs ${
                            isSel ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Avatar src={emp.avatar} alt={emp.fullName} className="h-5 w-5" />
                          <span className="truncate flex-1">{emp.fullName}</span>
                          {isSel && <span className="text-blue-600 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="sm:col-span-2 flex items-center h-9 px-2 text-xs text-gray-600 bg-gray-100/70 rounded-lg">
                Self (You)
              </div>
            )}

            {/* Priority & Submit */}
            <div className="sm:col-span-2 flex items-center gap-2">
              <select
                className="input-field text-xs h-9 bg-white flex-1"
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value)}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <button
                type="submit"
                className="btn-primary text-xs h-9 px-4 font-bold shadow-2xs shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Content Area */}
      {displayedTasks.length === 0 ? (
        <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm font-medium text-gray-600">No tasks found for this selection.</p>
          <p className="text-xs text-gray-400 mt-1">
            {statusFilter !== 'all' ? `No ${statusFilter} tasks.` : 'Create a new task to get started.'}
          </p>
          <button
            onClick={handleNewTask}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            + Add task {activeProjectObj ? `to ${activeProjectObj.name}` : ''}
          </button>
        </div>
      ) : (
        <>
          {/* CARDS VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedTasks.map(t => {
                const proj = getProject(t.projectId);
                const info = getTaskHierarchyInfo(t);
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between group transition ${
                      t.status === 'Done'
                        ? 'border-emerald-100 bg-emerald-50/15 hover:border-emerald-200'
                        : 'border-gray-100 bg-white hover:border-indigo-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          className={`text-left font-medium flex-1 truncate transition ${
                            t.status === 'Done'
                              ? 'text-gray-700 hover:text-emerald-700 line-through decoration-emerald-500/40'
                              : 'text-gray-800 hover:text-indigo-600'
                          }`}
                          onClick={() => { setEditing(t); setOpen(true); }}
                        >
                          {t.name}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <StatusSelect value={t.status} onChange={(s) => handleStatusChange(t.id, s, t.name)} />
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(e, t)}
                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition"
                            title="Remove task"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Project badge if in 'All Tasks' */}
                      {activeProjectTab === 'all' && proj && (
                        <div className="mt-1.5">
                          <button
                            onClick={() => setActiveProjectTab(proj.id)}
                            className="badge bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold transition"
                            title={`Filter by ${proj.name}`}
                          >
                            {proj.name}
                          </button>
                        </div>
                      )}

                      {/* Parent Task Hierarchy Badge */}
                      {t.parentId && info.parent && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                          <span className={info.level === 1 ? 'text-blue-600 font-bold' : info.level === 2 ? 'text-purple-600 font-bold' : 'text-indigo-600 font-bold'}>
                            {info.level === 1 ? '↳ Subtask of:' : info.level === 2 ? '↳↳ Sub-subtask of:' : `${'↳'.repeat(Math.min(info.level, 3))} L${info.level} Subtask of:`}
                          </span>
                          <span className="font-semibold text-gray-700 truncate max-w-[170px]">{info.parent.name}</span>
                        </div>
                      )}

                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{t.description || 'No description'}</p>
                    </div>

                    <div className="mt-3.5 pt-2 border-t border-gray-100/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AssigneesDisplay task={t} />
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={t.priority} />
                        <span className="text-xs text-gray-400">{fmtDate(t.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <Th>Task</Th>
                    {activeProjectTab === 'all' && <Th>Project</Th>}
                    <Th>Assignee</Th>
                    <Th>Status</Th>
                    <Th>Created</Th>
                    <Th>Due</Th>
                    <Th>Priority</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchicalDisplayedTasks.map(t => {
                    const proj = getProject(t.projectId);
                    return (
                      <tr key={t.id} className="border-b border-gray-50 hover:bg-slate-50/60 transition">
                        <Td>
                          <div
                            className="flex items-center gap-2"
                            style={{ paddingLeft: t.level > 0 ? `${t.level * 20}px` : undefined }}
                          >
                            {t.level > 0 && (
                              <span
                                className={`font-bold text-xs select-none ${
                                  t.level === 1 ? 'text-blue-500' : t.level === 2 ? 'text-purple-500' : 'text-indigo-500'
                                }`}
                              >
                                {'↳'.repeat(Math.min(t.level, 3))}
                              </span>
                            )}
                            {t.level === 1 && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                                Subtask
                              </span>
                            )}
                            {t.level === 2 && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                Sub-sub
                              </span>
                            )}
                            {t.level >= 3 && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                                L{t.level} Sub
                              </span>
                            )}
                            <button
                              className="font-medium text-gray-800 hover:text-indigo-600 text-left truncate"
                              onClick={() => { setEditing(t); setOpen(true); }}
                            >
                              {t.name}
                            </button>
                          </div>
                        </Td>
                        {activeProjectTab === 'all' && (
                          <Td className="text-gray-600 text-xs">
                            {proj ? (
                              <button
                                onClick={() => setActiveProjectTab(proj.id)}
                                className="badge bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold transition"
                              >
                                {proj.name}
                              </button>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                            )}
                          </Td>
                        )}
                        <Td><AssigneesDisplay task={t} /></Td>
                        <Td><StatusSelect value={t.status} onChange={(s) => handleStatusChange(t.id, s, t.name)} /></Td>
                        <Td className="text-gray-500 text-xs">{fmtDate(t.createdDate || t.createdAt)}</Td>
                        <Td className="text-gray-600 text-xs">{fmtDate(t.dueDate)}</Td>
                        <Td><PriorityPill priority={t.priority} /></Td>
                        <Td>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setEditing({ parentId: t.id, projectId: t.projectId }); setOpen(true); }}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition shrink-0"
                              title={`Add subtask under "${t.name}"`}
                            >
                              + Subtask
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditing(t); setOpen(true); }}
                              className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition"
                              title="Edit task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(e, t)}
                              className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition"
                              title="Remove task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CHECKLIST VIEW */}
          {viewMode === 'checklist' && (
            <div className="space-y-1">
              {hierarchicalDisplayedTasks.map(t => {
                const proj = getProject(t.projectId);
                return (
                  <div
                    key={t.id}
                    style={{ marginLeft: t.level > 0 ? `${t.level * 18}px` : undefined }}
                    className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition group ${
                      t.level === 1
                        ? 'bg-blue-50/20 border-l-2 border-l-blue-400 pl-3'
                        : t.level === 2
                        ? 'bg-purple-50/25 border-l-2 border-l-purple-400 pl-3'
                        : t.level >= 3
                        ? 'bg-indigo-50/25 border-l-2 border-l-indigo-400 pl-3'
                        : ''
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-emerald-600 rounded shrink-0"
                        checked={t.status === 'Done'}
                        onChange={(e) => handleStatusChange(t.id, e.target.checked ? 'Done' : 'Not started', t.name)}
                      />
                      {t.level > 0 && (
                        <span
                          className={`font-bold text-xs select-none shrink-0 ${
                            t.level === 1 ? 'text-blue-500' : t.level === 2 ? 'text-purple-500' : 'text-indigo-500'
                          }`}
                        >
                          {'↳'.repeat(Math.min(t.level, 3))}
                        </span>
                      )}
                      {t.level === 1 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          Subtask
                        </span>
                      )}
                      {t.level === 2 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                          Sub-sub
                        </span>
                      )}
                      {t.level >= 3 && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                          L{t.level} Sub
                        </span>
                      )}
                      <span className={`flex-1 text-sm truncate ${t.status === 'Done' ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                        {t.name}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeProjectTab === 'all' && proj && (
                        <span className="badge bg-blue-50 text-blue-700 text-[10px] font-medium hidden sm:inline-block">
                          {proj.name}
                        </span>
                      )}
                      <PriorityPill priority={t.priority} />
                      <button
                        type="button"
                        onClick={() => { setEditing({ parentId: t.id, projectId: t.projectId }); setOpen(true); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition shrink-0"
                        title={`Add subtask under "${t.name}"`}
                      >
                        + Subtask
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(e, t)}
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition"
                        title="Remove task"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BY STATUS GROUPED VIEW */}
          {viewMode === 'status' && (
            <div className="space-y-4">
              {STATUSES.map(s => {
                const list = displayedTasks.filter(t => t.status === s);
                return (
                  <div key={s}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                      <span>{s}</span>
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                        {list.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {list.map(t => {
                        const proj = getProject(t.projectId);
                        const info = getTaskHierarchyInfo(t);
                        return (
                          <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-slate-100/80 transition">
                            <div className="flex-1 min-w-0 pr-2">
                              <button
                                className="text-sm text-gray-700 hover:text-indigo-600 text-left block truncate font-medium"
                                onClick={() => { setEditing(t); setOpen(true); }}
                              >
                                {t.name}
                              </button>
                              {info.parent && (
                                <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <span className={info.level === 1 ? 'text-blue-600 font-semibold' : info.level === 2 ? 'text-purple-600 font-semibold' : 'text-indigo-600 font-semibold'}>
                                    {info.level === 1 ? '↳ Subtask of:' : info.level === 2 ? '↳↳ Sub-sub of:' : `${'↳'.repeat(Math.min(info.level, 3))} L${info.level} Sub of:`}
                                  </span>
                                  <span className="truncate max-w-[180px]">{info.parent.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {activeProjectTab === 'all' && proj && (
                                <span className="badge bg-blue-50 text-blue-700 text-[10px] font-medium hidden sm:inline-block">
                                  {proj.name}
                                </span>
                              )}
                              <PriorityPill priority={t.priority} />
                              <span className="text-xs text-gray-400">{fmtDate(t.dueDate)}</span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTask(e, t)}
                                className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition ml-1"
                                title="Remove task"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {list.length === 0 && <p className="text-xs text-gray-400 italic px-2">No tasks with status "{s}".</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Task Modal Form */}
      <TaskForm isOpen={open} open={open} onClose={() => setOpen(false)} initial={editing} projects={allProjects} />
    </section>
  );
};

export default TasksTab;