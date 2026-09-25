import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';
import { StatusSelect } from '../widgets/StatusSelect';
import { PriorityPill } from '../widgets/PriorityPill';
import { TaskForm } from '../forms/TaskForm';
import { sortTasks } from '../../utils/taskSort';

const STATUSES = ['In progress', 'Not started', 'Done'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

export const TasksTab = ({ tasks: tasksProp, projects: projectsProp, heading = 'Tasks Tracker' }) => {
  const { tasks: allTasks = [], projects: allProjects = [], getEmployee, updateTask, removeTask } = useData();
  const { addToast } = useToast();
  const tasks = tasksProp || allTasks;

  // Available project tabs:
  // 1. If projectsProp is explicitly passed (e.g. employee's assigned projects), show only those projects.
  // 2. Else if tasksProp is passed, restrict project tabs to projects that actually have tasks in tasksProp.
  // 3. Otherwise (global dashboard), show all projects.
  const relevantProjects = projectsProp !== undefined
    ? projectsProp
    : (tasksProp ? allProjects.filter(p => tasks.some(t => String(t.projectId) === String(p.id))) : allProjects);

  // Project-based segregation tabs
  const [activeProjectTab, setActiveProjectTab] = useState('all'); // 'all', projectId, or 'unassigned'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'done'
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'checklist', 'status'
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Auto-reset activeProjectTab if the selected project tab is no longer in relevantProjects
  useEffect(() => {
    if (activeProjectTab !== 'all' && activeProjectTab !== 'unassigned') {
      if (!relevantProjects.some(p => String(p.id) === String(activeProjectTab))) {
        setActiveProjectTab('all');
      }
    }
  }, [relevantProjects, activeProjectTab]);

  const getProject = (pId) => allProjects.find(p => String(p.id) === String(pId));
  const unassignedCount = (allTasks || tasks).filter(t => !t.projectId || !allProjects.some(p => String(p.id) === String(t.projectId))).length;

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
    if (!task?.parentId) return { level: 0, parent: null };
    const parent = (allTasks || []).find(t => String(t.id) === String(task.parentId));
    if (!parent) return { level: 0, parent: null };
    if (!parent.parentId) return { level: 1, parent };
    const grandParent = (allTasks || []).find(t => String(t.id) === String(parent.parentId));
    return { level: 2, parent, grandParent };
  };

  // Organize displayed tasks in tree order (Main -> Subtask -> Sub-subtask) for Table & Checklist views
  const hierarchicalDisplayedTasks = useMemo(() => {
    const list = [...displayedTasks];
    const mains = list.filter(t => !t.parentId || !list.some(p => String(p.id) === String(t.parentId)));
    const sortedMains = sortTasks(mains);
    const result = [];

    sortedMains.forEach(main => {
      const mainInfo = getTaskHierarchyInfo(main);
      result.push({ ...main, level: mainInfo.level, parent: mainInfo.parent });
      const subs = sortTasks(list.filter(t => String(t.parentId) === String(main.id)));
      subs.forEach(sub => {
        result.push({ ...sub, level: 1, parent: main });
        const subSubs = sortTasks(list.filter(t => String(t.parentId) === String(sub.id)));
        subSubs.forEach(subSub => {
          result.push({ ...subSub, level: 2, parent: sub, grandParent: main });
        });
      });
    });

    // Fallback for any orphan tasks that weren't captured
    list.forEach(t => {
      if (!result.some(r => String(r.id) === String(t.id))) {
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
      // Also cascade completion to children subtasks
      const childTasks = (allTasks || []).filter(t => String(t.parentId) === String(taskId));
      childTasks.forEach(child => {
        updateTask(child.id, { status: 'Done' });
        const subSubTasks = (allTasks || []).filter(t => String(t.parentId) === String(child.id));
        subSubTasks.forEach(subSub => updateTask(subSub.id, { status: 'Done' }));
      });
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
        <button
          className="btn-primary text-sm flex items-center gap-1.5 shrink-0"
          onClick={handleNewTask}
        >
          <span className="font-bold">+</span> New task
        </button>
      </div>

      {/* Project-Based Tabs */}
      <div className="w-full flex items-center border-b border-gray-200 overflow-x-auto gap-1 scrollbar-thin">
        {/* All Tasks Tab */}
        <button
          onClick={() => setActiveProjectTab('all')}
          className={`py-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 text-center transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
            activeProjectTab === 'all'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <span>All Tasks</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            activeProjectTab === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {tasks.length}
          </span>
        </button>

        {/* Dynamic Project Tabs */}
        {relevantProjects.map(p => {
          const count = (allTasks || tasks).filter(t => String(t.projectId) === String(p.id)).length;
          const isActive = String(activeProjectTab) === String(p.id);
          const pPct = Math.round((p.progress <= 1 && p.progress > 0 ? p.progress * 100 : (p.progress || 0)));
          return (
            <button
              key={p.id}
              onClick={() => setActiveProjectTab(p.id)}
              className={`py-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 text-center transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="truncate max-w-[180px]">{p.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
              {count > 0 && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100">
                  {pPct}%
                </span>
              )}
            </button>
          );
        })}

        {/* Unassigned Tasks Tab (if any exist) */}
        {unassignedCount > 0 && (
          <button
            onClick={() => setActiveProjectTab('unassigned')}
            className={`py-2.5 px-3.5 text-xs sm:text-sm font-semibold border-b-2 text-center transition whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeProjectTab === 'unassigned'
                ? 'border-blue-600 text-blue-600 bg-blue-50/30'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>No Project</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeProjectTab === 'unassigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {unassignedCount}
            </span>
          </button>
        )}
      </div>

      {/* Sub-toolbar: Status Filter Pills + View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 mb-4 text-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 font-medium mr-1 hidden sm:inline">Status:</span>
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

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg border border-gray-200/60 ml-auto">
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
                          <span className={info.level === 1 ? 'text-blue-600 font-bold' : 'text-purple-600 font-bold'}>
                            {info.level === 1 ? '↳ Subtask of:' : '↳↳ Sub-subtask of:'}
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
                          <div className={`flex items-center gap-2 ${
                            t.level === 1 ? 'pl-5' : t.level === 2 ? 'pl-9' : ''
                          }`}>
                            {t.level === 1 && (
                              <span className="text-blue-500 font-bold text-xs select-none">↳</span>
                            )}
                            {t.level === 2 && (
                              <span className="text-purple-500 font-bold text-xs select-none">↳↳</span>
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
                        <Td className="text-gray-600 text-xs">{fmtDate(t.dueDate)}</Td>
                        <Td><PriorityPill priority={t.priority} /></Td>
                        <Td>
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
                    className={`flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition group ${
                      t.level === 1
                        ? 'ml-5 bg-blue-50/20 border-l-2 border-l-blue-400 pl-3'
                        : t.level === 2
                        ? 'ml-10 bg-purple-50/25 border-l-2 border-l-purple-400 pl-3'
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
                      {t.level === 1 && (
                        <span className="text-blue-500 font-bold text-xs select-none shrink-0">↳</span>
                      )}
                      {t.level === 2 && (
                        <span className="text-purple-500 font-bold text-xs select-none shrink-0">↳↳</span>
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
                                  <span className={info.level === 1 ? 'text-blue-600 font-semibold' : 'text-purple-600 font-semibold'}>
                                    {info.level === 1 ? '↳ Subtask of:' : '↳↳ Sub-sub of:'}
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
      <TaskForm isOpen={open} open={open} onClose={() => setOpen(false)} initial={editing} />
    </section>
  );
};

export default TasksTab;