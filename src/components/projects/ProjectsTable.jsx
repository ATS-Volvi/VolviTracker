import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ProjectForm } from '../forms/ProjectForm';

// Helper to format date as MM/DD/YYYY
const formatDateMMDDYYYY = (d) => {
  if (!d) return '';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    const parts = d.slice(0, 10).split('-');
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return d;
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${month}/${day}/${year}`;
};

const STATUS_CONFIG = {
  'In progress': {
    bg: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    label: 'In progress',
    accent: 'border-sky-400'
  },
  'Done': {
    bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Done',
    accent: 'border-emerald-400'
  },
  'Not started': {
    bg: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    label: 'Not started',
    accent: 'border-gray-300'
  }
};

const ALL_STATUSES = ['Not started', 'In progress', 'Done'];

export const ProjectsTable = ({ projects = [] }) => {
  const { employees, addProject, updateProject, removeProject, getEmployee, addTask, tasks } = useData();
  const { addToast } = useToast();

  // Active View: 'table', 'board', 'timeline', 'cards'
  const [currentView, setCurrentView] = useState('table');
  
  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [automationModalOpen, setAutomationModalOpen] = useState(false);
  const [aiSelectedProject, setAiSelectedProject] = useState(null);
  const [aiGeneratedTasks, setAiGeneratedTasks] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Inline Interactive States
  const [activeProgressPopoverId, setActiveProgressPopoverId] = useState(null);
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  const [assigneeDropdownId, setAssigneeDropdownId] = useState(null);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [editingNameId, setEditingNameId] = useState(null);
  const [tempNameValue, setTempNameValue] = useState('');

  // Inline Row Adding
  const [inlineNewName, setInlineNewName] = useState('');

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setStatusDropdownId(null);
        setAssigneeDropdownId(null);
        setActiveProgressPopoverId(null);
        setShowFilterMenu(false);
        setShowNewMenu(false);
        setEditingNameId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to extract assignees for a project (single or multiple)
  const getProjectAssignees = (p) => {
    let ids = [];
    if (Array.isArray(p.assigneeIds) && p.assigneeIds.length > 0) {
      ids = p.assigneeIds;
    } else if (p.assigneeId) {
      ids = [p.assigneeId];
    }
    return ids.map(id => getEmployee(id)).filter(Boolean);
  };

  const getProgressPercentage = (p) => {
    if (p.progress === undefined || p.progress === null) return 0;
    const raw = Number(p.progress);
    if (raw <= 1 && raw > 0) return Math.round(raw * 100);
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  // Filter & Sort
  let displayProjects = [...projects];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProjects = displayProjects.filter(p => {
      const assignees = getProjectAssignees(p);
      const assigneeMatch = assignees.some(emp =>
        emp.fullName?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q)
      );
      return (
        p.name?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q) ||
        assigneeMatch
      );
    });
  }

  if (statusFilter) {
    displayProjects = displayProjects.filter(p => p.status === statusFilter);
  }

  if (sortBy) {
    displayProjects.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (sortBy === 'progress') {
        valA = Number(a.progress) || 0;
        valB = Number(b.progress) || 0;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortBy(null);
        setSortOrder('asc');
      }
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleInlineSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inlineNewName.trim()) return;
    addProject({
      name: inlineNewName.trim(),
      status: 'Not started',
      assigneeIds: [],
      assigneeId: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      startValue: 0,
      endValue: 100,
      progress: 0
    });
    addToast(`Project "${inlineNewName.trim()}" created!`, 'success');
    setInlineNewName('');
  };

  const handleStatusChange = (projectId, newStatus) => {
    const proj = projects.find(p => p.id === projectId);
    const updates = { status: newStatus };
    if (newStatus === 'Done' && proj && getProgressPercentage(proj) < 100) {
      updates.progress = 1;
    }
    updateProject(projectId, updates);
    setStatusDropdownId(null);
    addToast(`Updated status to "${newStatus}"`, 'info');
  };

  // Toggle multiple assignees
  const handleToggleAssignee = (projectId, empId) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    let currentIds = [];
    if (Array.isArray(proj.assigneeIds)) {
      currentIds = [...proj.assigneeIds];
    } else if (proj.assigneeId) {
      currentIds = [proj.assigneeId];
    }

    const exists = currentIds.includes(empId);
    const nextIds = exists
      ? currentIds.filter(id => id !== empId)
      : [...currentIds, empId];

    updateProject(projectId, {
      assigneeIds: nextIds,
      assigneeId: nextIds[0] || '' // legacy fallback
    });

    const emp = getEmployee(empId);
    if (exists) {
      addToast(`Removed ${emp?.fullName || 'member'} from project`, 'info');
    } else {
      addToast(`Assigned ${emp?.fullName || 'member'} to project`, 'success');
    }
  };

  const handleClearAssignees = (projectId) => {
    updateProject(projectId, { assigneeIds: [], assigneeId: '' });
    addToast('Cleared all assignees', 'info');
  };

  const handleSelectAllAssignees = (projectId) => {
    const allIds = employees.map(e => e.id);
    updateProject(projectId, { assigneeIds: allIds, assigneeId: allIds[0] || '' });
    addToast('Assigned all team members', 'success');
  };

  const handleProgressChange = (projectId, pct) => {
    const decimal = pct / 100;
    const updates = { progress: decimal };
    if (pct === 100) updates.status = 'Done';
    else if (pct > 0) {
      const proj = projects.find(p => p.id === projectId);
      if (proj && proj.status === 'Not started') updates.status = 'In progress';
    }
    updateProject(projectId, updates);
    addToast(`Progress set to ${pct}%`, 'success');
  };

  const handleSaveInlineName = (projectId) => {
    if (tempNameValue.trim()) {
      updateProject(projectId, { name: tempNameValue.trim() });
      addToast('Project renamed', 'success');
    }
    setEditingNameId(null);
  };

  const handleDuplicate = (project) => {
    addProject({
      ...project,
      name: `${project.name} (Copy)`,
      id: undefined
    });
    addToast(`Duplicated "${project.name}"`, 'success');
  };

  const handleDelete = (project) => {
    removeProject(project.id);
    addToast(`Removed "${project.name}"`, 'error');
  };

  // AI Assistant generator
  const runAiAssistant = (project) => {
    setAiSelectedProject(project);
    setAiLoading(true);
    setAiModalOpen(true);
    
    setTimeout(() => {
      const suggestions = [
        { name: `Setup architectural milestone for ${project.name}`, priority: 'High', dueDate: project.endDate || '2025-05-01' },
        { name: `Conduct sprint stakeholder demo for ${project.name}`, priority: 'Medium', dueDate: project.endDate || '2025-05-15' },
        { name: `Finalize QA testing & deployment checklist`, priority: 'High', dueDate: project.endDate || '2025-05-20' },
      ];
      setAiGeneratedTasks(suggestions);
      setAiLoading(false);
    }, 600);
  };

  const applyAiTasks = () => {
    if (!aiGeneratedTasks.length) return;
    const assignees = getProjectAssignees(aiSelectedProject || {});
    const defaultAssigneeId = assignees[0]?.id || employees[0]?.id || '';

    aiGeneratedTasks.forEach(task => {
      addTask({
        name: task.name,
        assigneeId: defaultAssigneeId,
        status: 'Not started',
        dueDate: task.dueDate,
        priority: task.priority,
        description: `Generated by AI for project "${aiSelectedProject?.name}"`
      });
    });
    addToast(`Added ${aiGeneratedTasks.length} AI-generated tasks to Tracker!`, 'ai');
    setAiModalOpen(false);
  };

  return (
    <div ref={tableRef} className="w-full bg-white shadow-sm border-y sm:border sm:rounded-2xl border-gray-200 overflow-hidden font-sans transition-all">
      {/* Top Header Section with Extended Tabs spanning the entire width */}
      <div className="w-full border-b border-gray-200 bg-white">
        {/* Main Title Row */}
        <div className="px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Projects</h2>
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-0.5 rounded-full">
              {displayProjects.length}
            </span>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5 text-gray-500">
            {/* Live Search */}
            {showSearchInput ? (
              <div className="flex items-center bg-gray-50 border border-blue-400 rounded-lg px-2.5 py-1 text-xs shadow-inner animate-slide-up">
                <svg className="w-3.5 h-3.5 text-blue-500 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects or members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-gray-800 w-32 sm:w-48 text-xs font-medium"
                  autoFocus
                />
                <button onClick={() => { setShowSearchInput(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 ml-1.5">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                title="Search"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-800"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}

            {/* Filter Menu */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                title="Filter"
                className={`p-1.5 hover:bg-gray-100 rounded-lg transition ${statusFilter ? 'text-sky-600 bg-sky-50 ring-1 ring-sky-300' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="7" y1="12" x2="17" y2="12"></line>
                  <line x1="10" y1="18" x2="14" y2="18"></line>
                </svg>
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs animate-slide-up">
                  <div className="px-3 py-1 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Filter by status</div>
                  <button
                    onClick={() => { setStatusFilter(null); setShowFilterMenu(false); addToast('Showing all statuses', 'info'); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between ${!statusFilter ? 'font-bold text-sky-600' : 'text-gray-700'}`}
                  >
                    All Statuses {!statusFilter && '✓'}
                  </button>
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setShowFilterMenu(false); addToast(`Filtered by "${s}"`, 'info'); }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center justify-between ${statusFilter === s ? 'font-bold text-sky-600' : 'text-gray-700'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`}></span>
                        <span>{s}</span>
                      </span>
                      {statusFilter === s && '✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Button */}
            <button
              onClick={() => toggleSort('name')}
              title={`Sort by Name (${sortBy === 'name' ? sortOrder : 'off'})`}
              className={`p-1.5 hover:bg-gray-100 rounded-lg transition ${sortBy ? 'text-sky-600 bg-sky-50' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 15l5 5 5-5" /><path d="M7 9l5-5 5 5" />
              </svg>
            </button>

            {/* Automations Button */}
            <button
              onClick={() => setAutomationModalOpen(true)}
              title="Automations & Smart Sync"
              className="p-1.5 hover:bg-amber-50 rounded-lg transition text-gray-500 hover:text-amber-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </button>

            {/* AI Project Assist */}
            <button
              onClick={() => runAiAssistant(displayProjects[0] || { name: 'New Initiative' })}
              title="AI Project Assistant"
              className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-indigo-600 hover:text-indigo-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"></path>
              </svg>
            </button>

            {/* New Split Button */}
            <div className="relative ml-1">
              <div className="inline-flex rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => { setEditingProject(null); setModalOpen(true); }}
                  className="bg-[#0070F3] hover:bg-blue-600 text-white font-semibold text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <span>+</span> New
                </button>
                <button
                  onClick={() => setShowNewMenu(!showNewMenu)}
                  className="bg-[#0070F3] hover:bg-blue-600 text-white text-xs px-1.5 py-1.5 border-l border-blue-400 transition"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {showNewMenu && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs animate-slide-up">
                  <button
                    onClick={() => { setEditingProject(null); setModalOpen(true); setShowNewMenu(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-800 font-medium flex items-center gap-2"
                  >
                    <span>📝</span> New Project Modal
                  </button>
                  <button
                    onClick={() => {
                      handleInlineSubmit();
                      setShowNewMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                  >
                    <span>⚡</span> Quick Add Default Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extended Tabs spanning across the entire width of the table */}
        <div className="flex items-center w-full border-t border-gray-100 px-2 sm:px-6 bg-gray-50/60 overflow-x-auto">
          <button
            onClick={() => setCurrentView('table')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              currentView === 'table'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>📋</span> Table View
          </button>
          <button
            onClick={() => setCurrentView('board')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              currentView === 'board'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>📊</span> Kanban Board
          </button>
          <button
            onClick={() => setCurrentView('timeline')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              currentView === 'timeline'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>⏱️</span> Timeline
          </button>
          <button
            onClick={() => setCurrentView('cards')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              currentView === 'cards'
                ? 'border-blue-600 text-blue-600 bg-white shadow-xs'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span>🗂️</span> Gallery Cards
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: NOTION TABLE VIEW (Full Width & Multi-Assignee) */}
      {/* ======================================================== */}
      {currentView === 'table' && (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-gray-200 bg-white text-gray-500 select-none">
                <th className="py-2.5 px-4 font-normal w-[26%] min-w-[200px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <span className="text-[11px] font-serif font-bold text-gray-400">Aa</span>
                    <span>Project name</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[18%] min-w-[170px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    </svg>
                    <span>Assignees</span>
                    <span className="text-[11px] text-gray-400 font-normal cursor-help" title="Click cell to select multiple assignees">ⓘ</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[12%] min-w-[120px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <span className="text-gray-400 text-xs">✳️</span>
                    <span>Status</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[10%] min-w-[100px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line>
                    </svg>
                    <span>Start date</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[10%] min-w-[100px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line>
                    </svg>
                    <span>End date</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[6%] min-w-[70px] border-r border-gray-100 text-right">
                  <div className="flex items-center justify-end gap-1 text-gray-500 font-medium">
                    <span className="text-gray-400 font-bold text-xs">#</span>
                    <span>Start</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[6%] min-w-[70px] border-r border-gray-100 text-right">
                  <div className="flex items-center justify-end gap-1 text-gray-500 font-medium">
                    <span className="text-gray-400 font-bold text-xs">#</span>
                    <span>End</span>
                  </div>
                </th>
                <th className="py-2.5 px-4 font-normal w-[16%] min-w-[150px] border-r border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    <span>Progress</span>
                    <span className="text-[11px] text-gray-400 font-normal cursor-help" title="Click progress bar to adjust slider">ⓘ</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 font-normal w-12 text-center text-gray-400">
                  <span>···</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {displayProjects.map((p) => {
                const assignees = getProjectAssignees(p);
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['Not started'];
                const pct = getProgressPercentage(p);
                const isEditingName = editingNameId === p.id;
                const isProgressOpen = activeProgressPopoverId === p.id;
                const isAssigneeOpen = assigneeDropdownId === p.id;

                // Current project assignee IDs
                const currentAssigneeIds = Array.isArray(p.assigneeIds)
                  ? p.assigneeIds
                  : (p.assigneeId ? [p.assigneeId] : []);

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition group">
                    {/* Project Name (Inline Editable) */}
                    <td className="py-2.5 px-4 font-semibold text-gray-900 border-r border-gray-100">
                      {isEditingName ? (
                        <input
                          type="text"
                          value={tempNameValue}
                          onChange={(e) => setTempNameValue(e.target.value)}
                          onBlur={() => handleSaveInlineName(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineName(p.id);
                            if (e.key === 'Escape') setEditingNameId(null);
                          }}
                          autoFocus
                          className="w-full bg-blue-50/50 border border-blue-400 rounded px-1.5 py-0.5 text-xs font-semibold text-gray-900 outline-none"
                        />
                      ) : (
                        <div className="flex items-center justify-between group/cell">
                          <button
                            onClick={() => { setEditingNameId(p.id); setTempNameValue(p.name); }}
                            className="text-left font-medium text-gray-800 hover:text-blue-600 transition truncate"
                            title="Click to rename"
                          >
                            {p.name || <span className="text-gray-400 italic">Untitled</span>}
                          </button>
                          <div className="opacity-0 group-hover/cell:opacity-100 flex items-center gap-1">
                            <button
                              onClick={() => { setEditingProject(p); setModalOpen(true); }}
                              title="Full Edit"
                              className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition text-[11px]"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => runAiAssistant(p)}
                              title="AI Plan Assistant"
                              className="text-indigo-400 hover:text-indigo-600 p-0.5 rounded transition text-[11px]"
                            >
                              ✨
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Multi-Assignee Column */}
                    <td className="py-2.5 px-4 border-r border-gray-100 relative">
                      <div
                        onClick={() => {
                          setAssigneeDropdownId(isAssigneeOpen ? null : p.id);
                          setAssigneeSearchQuery('');
                        }}
                        className="inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-100/80 px-2 py-1 rounded-lg transition w-full"
                        title="Click to manage team assignees"
                      >
                        {assignees.length > 0 ? (
                          <div className="flex items-center gap-2 truncate">
                            {/* Stacked Avatars */}
                            <div className="flex items-center -space-x-2 shrink-0">
                              {assignees.slice(0, 3).map((emp, idx) => (
                                <span key={emp.id} title={emp.fullName}>
                                  {emp.avatar ? (
                                    <img src={emp.avatar} alt={emp.fullName} className="w-5 h-5 rounded-full object-cover ring-2 ring-white border border-gray-200" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px] ring-2 ring-white border border-gray-200">
                                      {emp.fullName?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                </span>
                              ))}
                            </div>

                            {/* Text labels */}
                            <span className="text-gray-700 font-medium truncate text-xs">
                              {assignees.length === 1
                                ? (assignees[0].email || assignees[0].fullName)
                                : `${assignees[0].fullName?.split(' ')[0]} +${assignees.length - 1}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 hover:text-gray-600 text-xs italic flex items-center gap-1">
                            <span>+</span> Assign
                          </span>
                        )}
                      </div>

                      {/* Multi-Select Assignee Dropdown */}
                      {isAssigneeOpen && (
                        <div className="absolute left-2 top-10 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-2.5 z-40 animate-slide-up">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              Assign Team Members ({currentAssigneeIds.length})
                            </span>
                            <button
                              onClick={() => setAssigneeDropdownId(null)}
                              className="text-gray-400 hover:text-gray-600 text-xs p-0.5"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Search members */}
                          <div className="mb-2">
                            <input
                              type="text"
                              placeholder="Search employees..."
                              value={assigneeSearchQuery}
                              onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-gray-50"
                              autoFocus
                            />
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-between text-[10px] text-gray-500 pb-1.5 px-1">
                            <button
                              onClick={() => handleSelectAllAssignees(p.id)}
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => handleClearAssignees(p.id)}
                              className="text-gray-500 hover:underline"
                            >
                              Clear
                            </button>
                          </div>

                          {/* Employee List with Checkboxes */}
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {employees
                              .filter(e =>
                                !assigneeSearchQuery.trim() ||
                                e.fullName?.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
                                e.email?.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
                              )
                              .map(emp => {
                                const isAssigned = currentAssigneeIds.includes(emp.id);
                                return (
                                  <div
                                    key={emp.id}
                                    onClick={() => handleToggleAssignee(p.id, emp.id)}
                                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition select-none text-xs ${
                                      isAssigned
                                        ? 'bg-blue-50/90 text-blue-900 font-semibold'
                                        : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 accent-blue-600 rounded cursor-pointer"
                                    />
                                    {emp.avatar ? (
                                      <img src={emp.avatar} alt={emp.fullName} className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px]">
                                        {emp.fullName?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                    <div className="truncate flex-1">
                                      <div className="truncate text-xs">{emp.fullName}</div>
                                      <div className="text-[10px] text-gray-400 font-normal truncate">{emp.email}</div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          <div className="pt-2 mt-1 border-t border-gray-100 flex justify-end">
                            <button
                              onClick={() => setAssigneeDropdownId(null)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md text-[11px] font-semibold hover:bg-blue-700 transition"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 border-r border-gray-100 relative">
                      <button
                        type="button"
                        onClick={() => setStatusDropdownId(statusDropdownId === p.id ? null : p.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${statusCfg.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                        <span>{statusCfg.label}</span>
                      </button>

                      {statusDropdownId === p.id && (
                        <div className="absolute left-2 top-10 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 animate-slide-up">
                          {ALL_STATUSES.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(p.id, s)}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                                <span className="font-medium">{s}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-2.5 px-4 text-gray-700 tabular-nums border-r border-gray-100">
                      <input
                        type="date"
                        value={p.startDate ? p.startDate.slice(0, 10) : ''}
                        onChange={(e) => {
                          updateProject(p.id, { startDate: e.target.value });
                          addToast('Start date updated', 'info');
                        }}
                        className="bg-transparent text-gray-700 text-xs outline-none cursor-pointer hover:bg-gray-100/80 px-1 py-0.5 rounded w-full"
                      />
                    </td>

                    {/* End Date */}
                    <td className="py-2.5 px-4 text-gray-700 tabular-nums border-r border-gray-100">
                      <input
                        type="date"
                        value={p.endDate ? p.endDate.slice(0, 10) : ''}
                        onChange={(e) => {
                          updateProject(p.id, { endDate: e.target.value });
                          addToast('End date updated', 'info');
                        }}
                        className="bg-transparent text-gray-700 text-xs outline-none cursor-pointer hover:bg-gray-100/80 px-1 py-0.5 rounded w-full"
                      />
                    </td>

                    {/* Start Value */}
                    <td className="py-2.5 px-4 text-right text-gray-700 tabular-nums border-r border-gray-100">
                      <input
                        type="number"
                        value={p.startValue !== undefined ? p.startValue : 0}
                        onChange={(e) => updateProject(p.id, { startValue: Number(e.target.value) })}
                        className="w-full text-right bg-transparent text-gray-700 text-xs outline-none hover:bg-gray-100/80 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* End Value */}
                    <td className="py-2.5 px-4 text-right text-gray-700 tabular-nums border-r border-gray-100">
                      <input
                        type="number"
                        value={p.endValue !== undefined ? p.endValue : 100}
                        onChange={(e) => updateProject(p.id, { endValue: Number(e.target.value) })}
                        className="w-full text-right bg-transparent text-gray-700 text-xs outline-none hover:bg-gray-100/80 px-1 py-0.5 rounded"
                      />
                    </td>

                    {/* Progress Column */}
                    <td className="py-2 px-4 border-r border-gray-100 relative">
                      <div
                        onClick={() => setActiveProgressPopoverId(isProgressOpen ? null : p.id)}
                        className={`flex items-center gap-3 cursor-pointer p-1 rounded-md transition ${
                          isProgressOpen ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:bg-gray-100/60'
                        }`}
                        title="Click to adjust progress"
                      >
                        <span className="text-xs font-semibold text-gray-800 w-10 tabular-nums">{pct}%</span>
                        <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden min-w-[60px]">
                          <div
                            className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Interactive Progress Popover */}
                      {isProgressOpen && (
                        <div className="absolute left-2 top-11 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 animate-slide-up">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-gray-700">Set Progress</span>
                            <span className="text-xs font-extrabold text-emerald-600">{pct}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => handleProgressChange(p.id, Number(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                          <div className="flex justify-between gap-1 mt-2">
                            {[0, 25, 50, 75, 100].map(v => (
                              <button
                                key={v}
                                onClick={() => handleProgressChange(p.id, v)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                                  pct === v ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {v}%
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Quick Row Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleDuplicate(p)}
                          title="Duplicate Project"
                          className="text-gray-400 hover:text-blue-600 p-1 rounded transition text-xs"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          title="Delete Project"
                          className="text-gray-400 hover:text-rose-600 p-1 rounded transition text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Inline Add Row */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/40 transition">
                <td className="py-2 px-4 border-r border-gray-100">
                  <input
                    type="text"
                    placeholder="+ New row"
                    value={inlineNewName}
                    onChange={(e) => setInlineNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInlineSubmit(e); }}
                    className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none font-medium"
                  />
                </td>
                <td className="py-2 px-4 border-r border-gray-100 text-gray-300"></td>
                <td className="py-2 px-4 border-r border-gray-100">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                    <span>Not started</span>
                  </span>
                </td>
                <td className="py-2 px-4 border-r border-gray-100"></td>
                <td className="py-2 px-4 border-r border-gray-100"></td>
                <td className="py-2 px-4 border-r border-gray-100"></td>
                <td className="py-2 px-4 border-r border-gray-100"></td>
                <td className="py-2 px-4 border-r border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-normal text-gray-400 w-10 tabular-nums">0%</span>
                    <div className="h-1.5 flex-1 rounded-full bg-gray-200 min-w-[60px]"></div>
                  </div>
                </td>
                <td className="py-2 px-3 text-center">
                  {inlineNewName ? (
                    <button
                      onClick={handleInlineSubmit}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 animate-pulse"
                    >
                      Add
                    </button>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: KANBAN BOARD VIEW (Multi-Assignee Cards) */}
      {/* ======================================================== */}
      {currentView === 'board' && (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 w-full">
          {ALL_STATUSES.map((status) => {
            const list = displayProjects.filter(p => p.status === status);
            const cfg = STATUS_CONFIG[status];

            return (
              <div key={status} className="bg-white rounded-xl border border-gray-200/80 shadow-sm flex flex-col min-h-[420px] w-full">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}></span>
                    <h3 className="font-bold text-gray-800 text-sm">{status}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                      {list.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      addProject({
                        name: `New ${status} Project`,
                        status: status,
                        assigneeIds: [],
                        assigneeId: '',
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                        startValue: 0,
                        endValue: 100,
                        progress: status === 'Done' ? 1 : 0
                      });
                      addToast(`Added project to ${status}`, 'success');
                    }}
                    className="text-gray-400 hover:text-blue-600 text-xs font-bold p-1 rounded hover:bg-gray-50 transition"
                  >
                    +
                  </button>
                </div>

                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {list.map(p => {
                    const assignees = getProjectAssignees(p);
                    const pct = getProgressPercentage(p);

                    return (
                      <div
                        key={p.id}
                        className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group w-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => { setEditingProject(p); setModalOpen(true); }}
                            className="font-bold text-sm text-gray-800 text-left hover:text-blue-600 transition"
                          >
                            {p.name}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => runAiAssistant(p)}
                              title="AI Assist"
                              className="text-xs p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                            >
                              ✨
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              title="Delete"
                              className="text-xs p-1 text-rose-500 hover:bg-rose-50 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                          <span>📅</span>
                          <span>{p.startDate ? formatDateMMDDYYYY(p.startDate) : '—'} → {p.endDate ? formatDateMMDDYYYY(p.endDate) : '—'}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-gray-500 font-medium">Progress</span>
                            <span className="font-bold text-gray-700">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer: Multi-Assignee & Stage Shift buttons */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            {assignees.length > 0 ? (
                              <div className="flex items-center -space-x-1.5">
                                {assignees.slice(0, 3).map(emp => (
                                  <span key={emp.id} title={emp.fullName}>
                                    {emp.avatar ? (
                                      <img src={emp.avatar} alt={emp.fullName} className="w-5 h-5 rounded-full object-cover ring-1 ring-white" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px] ring-1 ring-white">
                                        {emp.fullName?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                  </span>
                                ))}
                                {assignees.length > 3 && (
                                  <span className="text-[10px] text-gray-500 pl-2">+{assignees.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {status !== 'Not started' && (
                              <button
                                onClick={() => handleStatusChange(p.id, status === 'Done' ? 'In progress' : 'Not started')}
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-medium text-gray-600"
                                title="Move left"
                              >
                                ←
                              </button>
                            )}
                            {status !== 'Done' && (
                              <button
                                onClick={() => handleStatusChange(p.id, status === 'Not started' ? 'In progress' : 'Done')}
                                className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 rounded text-[10px] font-bold text-blue-600"
                                title="Move right"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                      No projects in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: TIMELINE / GANTT VIEW */}
      {/* ======================================================== */}
      {currentView === 'timeline' && (
        <div className="p-4 sm:p-6 bg-white overflow-x-auto w-full">
          <div className="w-full min-w-[700px]">
            <div className="grid grid-cols-12 gap-1 text-center text-xs font-bold text-gray-500 pb-3 border-b border-gray-100">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                <div key={m} className="p-1.5 bg-gray-50 rounded text-gray-600">{m}</div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              {displayProjects.map((p, idx) => {
                const pct = getProgressPercentage(p);
                const assignees = getProjectAssignees(p);
                const startM = p.startDate ? new Date(p.startDate).getMonth() : idx % 10;
                const endM = p.endDate ? new Date(p.endDate).getMonth() : Math.min(11, startM + 2);
                const colSpan = Math.max(1, endM - startM + 1);

                return (
                  <div key={p.id} className="flex items-center gap-4 group">
                    <div className="w-48 text-xs font-semibold text-gray-800 truncate flex items-center justify-between pr-2">
                      <span className="truncate">{p.name}</span>
                      {assignees.length > 0 && (
                        <div className="flex -space-x-1 shrink-0">
                          {assignees.slice(0, 2).map(e => (
                            <div key={e.id} className="w-3.5 h-3.5 rounded-full bg-blue-200 text-[8px] flex items-center justify-center font-bold">
                              {e.fullName?.charAt(0)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 grid grid-cols-12 gap-1 relative h-10 bg-gray-50/70 rounded-lg p-1 items-center">
                      <div
                        style={{ gridColumnStart: startM + 1, gridColumnEnd: `span ${colSpan}` }}
                        onClick={() => { setEditingProject(p); setModalOpen(true); }}
                        className="h-8 bg-gray-100 border border-gray-200/90 rounded-lg shadow-xs relative overflow-hidden flex items-center cursor-pointer transition-all group/bar hover:border-blue-400 hover:shadow-sm"
                        title={`${p.name}: ${pct}% completed (${p.startDate ? p.startDate.slice(0, 10) : '—'} to ${p.endDate ? p.endDate.slice(0, 10) : '—'})`}
                      >
                        {/* Dynamic Progress Fill / Loading Bar */}
                        <div
                          className={`h-full absolute left-0 top-0 transition-all duration-700 ${
                            pct === 100
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : pct > 0
                              ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600'
                              : 'bg-transparent'
                          } ${pct === 100 ? 'rounded-lg' : 'rounded-l-lg'}`}
                          style={{ width: `${pct}%` }}
                        >
                          {pct > 0 && pct < 100 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          )}
                        </div>

                        {/* Foreground Label & Progress Percentage */}
                        <div className="relative z-10 w-full px-2.5 flex items-center justify-between select-none">
                          <span className={`text-[11px] font-bold truncate max-w-[65%] ${
                            pct >= 40 ? 'text-white drop-shadow-xs' : 'text-gray-800'
                          }`}>
                            {p.name}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs tabular-nums ${
                            pct >= 85
                              ? 'bg-white/25 text-white'
                              : 'bg-white text-gray-800 border border-gray-200/80 shadow-xs'
                          }`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: CARDS / GALLERY VIEW (Multi-Assignee) */}
      {/* ======================================================== */}
      {currentView === 'cards' && (
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 bg-slate-50/40 w-full">
          {displayProjects.map(p => {
            const assignees = getProjectAssignees(p);
            const pct = getProgressPercentage(p);
            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['Not started'];

            return (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5 group w-full"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}></span>
                    {p.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => runAiAssistant(p)}
                      title="AI Assist"
                      className="text-xs p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                    >
                      ✨
                    </button>
                    <button
                      onClick={() => { setEditingProject(p); setModalOpen(true); }}
                      className="text-xs p-1 text-gray-400 hover:text-gray-700 rounded"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-3 group-hover:text-blue-600 transition">
                  {p.name}
                </h3>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    {assignees.length > 0 ? (
                      <div className="flex items-center -space-x-1.5">
                        {assignees.slice(0, 3).map(emp => (
                          <span key={emp.id} title={emp.fullName}>
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.fullName} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs ring-2 ring-white">
                                {emp.fullName?.charAt(0) || '—'}
                              </div>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                    <span className="font-medium text-gray-700 truncate max-w-[100px]">
                      {assignees.length === 1 ? assignees[0].fullName : (assignees.length > 1 ? `${assignees.length} members` : '')}
                    </span>
                  </div>
                  <span className="tabular-nums font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {pct}% done
                  </span>
                </div>

                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Assistant Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-indigo-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">AI Project Planner</h3>
                  <p className="text-xs text-gray-500">Analyzing "{aiSelectedProject?.name}"</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="py-4">
              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-indigo-600 font-semibold animate-pulse">Generating milestones & risk analysis...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900">
                    💡 <strong>AI Analysis:</strong> This project is currently in <em>{aiSelectedProject?.status}</em> with {getProgressPercentage(aiSelectedProject || {})}% progress. Recommended 3 critical milestones to expedite delivery.
                  </div>

                  <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">Suggested Subtasks</div>
                  <div className="space-y-2">
                    {aiGeneratedTasks.map((t, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800">{t.name}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{t.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setAiModalOpen(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={applyAiTasks}
                disabled={aiLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>✨</span> Insert Tasks into Tracker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automations Modal */}
      {automationModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="font-bold text-gray-900 text-base">Smart Automations</h3>
              </div>
              <button onClick={() => setAutomationModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 border border-gray-200 rounded-xl hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
                onClick={() => {
                  projects.forEach(p => {
                    const linkedTasks = tasks.filter(t => t.description?.includes(p.name));
                    if (linkedTasks.length > 0) {
                      const doneCount = linkedTasks.filter(t => t.status === 'Done').length;
                      updateProject(p.id, { progress: doneCount / linkedTasks.length });
                    }
                  });
                  addToast('Recalculated project progress based on tasks!', 'success');
                  setAutomationModalOpen(false);
                }}
              >
                <div>
                  <div className="text-xs font-bold text-gray-800">Auto-calculate progress</div>
                  <div className="text-[11px] text-gray-500">Syncs percentage directly with task completion</div>
                </div>
                <button className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Run</button>
              </div>

              <div className="p-3 border border-gray-200 rounded-xl hover:border-emerald-400 transition cursor-pointer flex items-center justify-between"
                onClick={() => {
                  projects.filter(p => getProgressPercentage(p) === 100).forEach(p => {
                    updateProject(p.id, { status: 'Done' });
                  });
                  addToast('Marked all 100% projects as Done!', 'success');
                  setAutomationModalOpen(false);
                }}
              >
                <div>
                  <div className="text-xs font-bold text-gray-800">Auto-complete 100% projects</div>
                  <div className="text-[11px] text-gray-500">Marks any fully finished project as Done</div>
                </div>
                <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Run</button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setAutomationModalOpen(false)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        initial={editingProject}
      />
    </div>
  );
};

export default ProjectsTable;