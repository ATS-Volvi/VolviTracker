import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Avatar } from '../../widgets/Avatar';
import { TaskForm } from '../../forms/TaskForm';
import { sortTasks } from '../../../utils/taskSort';
import { useTableFlipAnimation } from '../../../utils/useTableFlipAnimation';
import { formatTaskCode } from '../../../utils/taskCode';
import {
  fetchProjectPlan,
  updateSprintTask,
  deleteSprintTask,
  deleteSprint
} from '../../../services/projectPlanApi';
import {
  calculateWeightedCompletion,
  calculateTaskScheduleStatus,
  calculateTaskRiskFlag,
  getLocalDateString,
  PROJECT_PHASES,
  normalizePhase,
  getPhaseTheme,
  sortSprintsByPhaseHierarchy
} from './planCalcs';
import { downloadBlankPlanTemplate, exportProjectPlanToExcel } from './planExcelExports';
import { PlanImportModal } from './PlanImportModal';
import { AddEditSprintModal } from './AddEditSprintModal';
import { GanttRoadmapModal } from '../../tasks/GanttRoadmapModal';

const fmtFullDate = (d) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
};

const getDueMeta = (dueDate, status) => {
  if (!dueDate) return { isOverdue: false, subtext: null };
  const isDone = String(status || '').toLowerCase() === 'done';
  if (isDone) return { isOverdue: false, subtext: null };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { isOverdue: true, subtext: `Overdue by ${Math.abs(diffDays)}d` };
  }
  if (diffDays === 0) {
    return { isOverdue: false, subtext: 'Due today' };
  }
  if (diffDays <= 3) {
    return { isOverdue: false, subtext: `Due in ${diffDays}d` };
  }
  return { isOverdue: false, subtext: null };
};

const getTaskTags = (task) => {
  if (Array.isArray(task.tags) && task.tags.length > 0) return task.tags;
  if (typeof task.tags === 'string' && task.tags.trim()) {
    return task.tags.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (task.category) return [task.category];

  const tags = [];
  const nameLower = String(task.name || task.title || '').toLowerCase();
  if (nameLower.includes('finance') || nameLower.includes('bill') || nameLower.includes('pay') || nameLower.includes('invoice') || nameLower.includes('tax')) {
    tags.push('Finance');
  }
  if (nameLower.includes('ops') || nameLower.includes('agency') || nameLower.includes('affiliate') || nameLower.includes('contract')) {
    tags.push('Ops');
  }
  if (nameLower.includes('market') || nameLower.includes('growth') || nameLower.includes('seo') || nameLower.includes('social')) {
    tags.push('Marketing');
  }
  if (nameLower.includes('design') || nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('visual')) {
    tags.push('Design');
  }
  if (nameLower.includes('dev') || nameLower.includes('api') || nameLower.includes('tech') || nameLower.includes('code')) {
    tags.push('Engineering');
  }
  return tags;
};

const renderPriorityPill = (priority) => {
  const p = priority || 'Medium';
  const pLower = String(p).toLowerCase();
  if (pLower === 'high' || pLower === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
        <span>High</span>
      </span>
    );
  }
  if (pLower === 'low') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Low</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span>Medium</span>
    </span>
  );
};

const TaskStatusCell = ({ task, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const rawStatus = task.status || 'Not started';
  const isDone = String(rawStatus).toLowerCase() === 'done';

  let isOverdue = false;
  if (!isDone && task.dueDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due.getTime() < now.getTime()) {
      isOverdue = true;
    }
  }

  const displayLabel = isOverdue ? 'Overdue' : (isDone ? 'Completed' : rawStatus);
  const dotColor = isOverdue
    ? 'bg-rose-600'
    : isDone
    ? 'bg-emerald-600'
    : rawStatus === 'In progress'
    ? 'bg-blue-600'
    : rawStatus === 'In review'
    ? 'bg-sky-500'
    : 'bg-gray-400';

  const pillClass = isOverdue
    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
    : isDone
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
    : rawStatus === 'In progress'
    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
    : rawStatus === 'In review'
    ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';

  const options = ['Not started', 'In progress', 'In review', 'Done'];

  return (
    <div className="relative inline-block" ref={statusRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition shadow-2xs cursor-pointer ${pillClass}`}
        title="Click to update status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{displayLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-1 w-36 rounded-xl bg-white shadow-xl border border-gray-200 py-1 animate-fade-in text-xs font-semibold">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onStatusChange(opt);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer ${
                rawStatus === opt ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-gray-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  opt === 'Done'
                    ? 'bg-emerald-600'
                    : opt === 'In progress'
                    ? 'bg-blue-600'
                    : opt === 'In review'
                    ? 'bg-sky-500'
                    : 'bg-gray-400'
                }`}
              />
              <span>{opt === 'Done' ? 'Completed' : opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export function SprintPlanTab({ project }) {
  const { user, isAdmin, isProjectManager, isProjectLead, canEditCompletionDate: authCanEditCompletion } = useAuth();
  const { tasks: allTasks = [], projects: allProjects = [], employees = [], addTask, updateTask, removeTask } = useData();
  const { addToast } = useToast();
  const projectId = String(project.id);
  const today = getLocalDateString();

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState({ sprints: [], tasks: [], gates: [], checklistItems: [] });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [sprintFilter, setSprintFilter] = useState('ALL');
  const [workstreamFilter, setWorkstreamFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [gateFilter, setGateFilter] = useState('ALL');

  // Collapsed sprints set
  const [collapsedSprints, setCollapsedSprints] = useState(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [isGanttModalOpen, setIsGanttModalOpen] = useState(false);

  // Permission: Admin or Project Manager of this project
  const canEdit = useMemo(() => {
    if (isAdmin) return true;
    const pmId = String(project.projectManagerId || project.createdBy || '');
    return Boolean(user?.id && String(user.id) === pmId);
  }, [isAdmin, user?.id, project.projectManagerId, project.createdBy]);

  const canUserEditCompletionDate = useCallback((task) => {
    if (isAdmin || isProjectManager || isProjectLead || authCanEditCompletion) return true;
    if (canEdit) return true;
    const taskProj = allProjects.find(p => String(p.id) === String(task?.projectId));
    if (taskProj && String(taskProj.createdBy || '') === String(user?.id)) return true;
    const uRole = (user?.role || '').toLowerCase().trim();
    if (uRole.includes('lead') || uRole.includes('manager')) return true;
    return false;
  }, [isAdmin, isProjectManager, isProjectLead, authCanEditCompletion, canEdit, allProjects, user?.id, user?.role]);

  const loadPlan = useCallback(async (force = false) => {
    try {
      if (!force) setLoading(true);
      const data = await fetchProjectPlan(projectId, { force });
      setPlanData({
        ...data,
        sprints: sortSprintsByPhaseHierarchy(data.sprints || [])
      });
    } catch (err) {
      if (!err.message?.includes('Unauthorized')) {
        addToast(err.message || 'Failed to load project plan', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, addToast]);

  useEffect(() => {
    loadPlan();

    const handlePlanUpdated = (e) => {
      if (!e.detail?.projectId || String(e.detail.projectId) === projectId) {
        loadPlan(true);
      }
    };
    window.addEventListener('project_plan_updated', handlePlanUpdated);
    return () => window.removeEventListener('project_plan_updated', handlePlanUpdated);
  }, [projectId, loadPlan]);

  // Unified list of tasks for this project
  const projectTasks = useMemo(() => {
    // 1. Gather all actual project tasks from allTasks
    const list = (allTasks || [])
      .filter(t => String(t.projectId) === String(projectId))
      .map(t => ({ ...t }));

    // Build fast lookup sets for matching: by raw ID, normalized ID, and lowercase name
    const idMap = new Set();
    const titleMap = new Set();

    list.forEach(t => {
      const rawId = String(t.id);
      idMap.add(rawId);
      idMap.add(rawId.replace(/^stk_/, ''));
      idMap.add(rawId.replace(/^stk_/, '').replace(/_/g, '-'));
      idMap.add(rawId.replace(/^stk_/, '').replace(/-/g, '_'));
      if (t.name) titleMap.add(t.name.trim().toLowerCase());
      if (t.title) titleMap.add(t.title.trim().toLowerCase());
    });

    // 2. Link planData info (such as taskCode, sprintId, gateId) onto existing tasks
    (planData.tasks || []).forEach(pt => {
      const rawPtId = String(pt.id);
      const cleanPtId = rawPtId.replace(/^stk_/, '');
      const normPtId = cleanPtId.replace(/_/g, '-');
      const ptTitle = (pt.title || pt.name || '').trim().toLowerCase();

      // Find if this plan task matches any existing task in list
      const matched = list.find(t => {
        const rawTId = String(t.id);
        const normTId = rawTId.replace(/^stk_/, '').replace(/_/g, '-');
        if (rawTId === rawPtId || normTId === normPtId) return true;
        if (ptTitle && (t.name || t.title) && (t.name || t.title).trim().toLowerCase() === ptTitle) return true;
        return false;
      });

      if (matched) {
        // Enrich the existing task with sprint metadata without creating a duplicate
        if (pt.taskCode && !matched.taskCode) matched.taskCode = pt.taskCode;
        if (pt.sprintId && !matched.sprintId) matched.sprintId = pt.sprintId;
        if (pt.gateId && !matched.gateId) matched.gateId = pt.gateId;
        if (pt.workstream && !matched.workstream) matched.workstream = pt.workstream;
        if (pt.priority && !matched.priority) matched.priority = pt.priority;
        if (pt.owner && !matched.owner) matched.owner = pt.owner;
        if ((pt.plannedFinish || pt.dueDate) && !matched.dueDate) matched.dueDate = pt.plannedFinish || pt.dueDate;
      } else {
        // Only if it doesn't match any existing task by ID or Title, add it as a new plan task
        const isKnown = idMap.has(rawPtId) || idMap.has(cleanPtId) || idMap.has(normPtId) || (ptTitle && titleMap.has(ptTitle));
        if (!isKnown) {
          list.push({
            id: pt.id,
            name: pt.title || pt.name,
            projectId: pt.projectId,
            sprintId: pt.sprintId,
            gateId: pt.gateId,
            taskCode: pt.taskCode,
            status: (Number(pt.percentComplete || 0) >= 100) ? 'Done' : (pt.status || 'In progress'),
            dueDate: pt.plannedFinish || pt.dueDate,
            createdDate: pt.plannedStart,
            completedDate: pt.actualCompletionDate,
            priority: pt.priority || 'Medium',
            description: pt.planningBasis || '',
            assigneeIds: Array.isArray(pt.assigneeIds) ? pt.assigneeIds : (pt.assigneeId ? [pt.assigneeId] : []),
            owner: pt.owner || ''
          });
          idMap.add(rawPtId);
          idMap.add(cleanPtId);
          idMap.add(normPtId);
          if (ptTitle) titleMap.add(ptTitle);
        }
      }
    });

    return list;
  }, [allTasks, projectId, planData.tasks]);

  // Smooth FLIP animation hook for table rows moving up or down
  const { registerRow, triggerRowAnimation, movingTaskInfo } = useTableFlipAnimation(projectTasks);

  // Subtasks map for badge counts
  const subtasksMap = useMemo(() => {
    const map = new Map();
    (allTasks || []).forEach(t => {
      if (t.parentId) {
        const pId = String(t.parentId);
        if (!map.has(pId)) map.set(pId, { total: 0, done: 0 });
        const entry = map.get(pId);
        entry.total += 1;
        if (String(t.status || '').toLowerCase() === 'done') {
          entry.done += 1;
        }
      }
    });
    return map;
  }, [allTasks]);

  // Assignee helper
  const getTaskAssignees = useCallback((task) => {
    const ids = Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0
      ? task.assigneeIds
      : (task.assigneeId ? [task.assigneeId] : []);
    if (ids.length > 0) {
      return ids
        .map(id => employees.find(e => String(e.id) === String(id)))
        .filter(Boolean);
    }
    if (task.owner) {
      const byName = employees.find(e => e.fullName?.toLowerCase() === task.owner?.toLowerCase());
      if (byName) return [byName];
    }
    return [];
  }, [employees]);

  // Workstream and Gate options for filters
  const workstreams = useMemo(() => {
    const set = new Set();
    projectTasks.forEach(t => {
      const tags = getTaskTags(t);
      tags.forEach(tag => set.add(tag));
      if (t.workstream) set.add(t.workstream);
    });
    return Array.from(set).sort();
  }, [projectTasks]);

  const gateOptions = useMemo(() => {
    return [...planData.gates].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  }, [planData.gates]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      if (phaseFilter !== 'ALL') {
        let taskPhase = t.sprintPhase;
        if (!taskPhase && t.sprintId) {
          const sp = planData.sprints.find(s => String(s.id) === String(t.sprintId));
          if (sp) taskPhase = sp.phase;
        }
        if (!taskPhase || normalizePhase(taskPhase) !== normalizePhase(phaseFilter)) {
          return false;
        }
      }
      if (sprintFilter !== 'ALL') {
        let taskSprintId = null;
        if (t.sprintPhase) {
          const sp = planData.sprints.find(s => s.phase && normalizePhase(s.phase) === normalizePhase(t.sprintPhase));
          if (sp) taskSprintId = sp.id;
        }
        if (!taskSprintId && t.sprintId) {
          taskSprintId = t.sprintId;
        }
        if (String(taskSprintId || '') !== sprintFilter) return false;
      }
      if (workstreamFilter !== 'ALL') {
        const tags = getTaskTags(t);
        if (!tags.includes(workstreamFilter) && t.workstream !== workstreamFilter) return false;
      }
      if (gateFilter !== 'ALL' && String(t.gateId || '') !== gateFilter) return false;

      const schedStatus = calculateTaskScheduleStatus({
        percentComplete: String(t.status).toLowerCase() === 'done' ? 100 : 0,
        actualCompletionDate: t.completedDate,
        plannedFinish: t.dueDate
      }, today);

      if (statusFilter !== 'ALL' && schedStatus !== statusFilter) return false;

      const risk = calculateTaskRiskFlag({
        percentComplete: String(t.status).toLowerCase() === 'done' ? 100 : 0,
        actualCompletionDate: t.completedDate,
        plannedFinish: t.dueDate
      }, today);
      if (riskFilter !== 'ALL' && risk !== riskFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (t.taskCode || t.code || '').toLowerCase();
        const title = (t.name || t.title || '').toLowerCase();
        const tags = getTaskTags(t).join(' ').toLowerCase();
        const emps = getTaskAssignees(t).map(e => e.fullName.toLowerCase()).join(' ');
        if (!code.includes(q) && !title.includes(q) && !tags.includes(q) && !emps.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [projectTasks, planData.sprints, phaseFilter, sprintFilter, workstreamFilter, gateFilter, statusFilter, riskFilter, searchQuery, today, getTaskAssignees]);

  // Sprints matching current filters, sorted in phase hierarchy order
  const displayedSprints = useMemo(() => {
    let list = sortSprintsByPhaseHierarchy(planData.sprints || []);
    if (phaseFilter !== 'ALL') {
      const norm = normalizePhase(phaseFilter);
      list = list.filter(s => normalizePhase(s.phase) === norm);
    }
    if (sprintFilter !== 'ALL') {
      list = list.filter(s => String(s.id) === sprintFilter);
    }
    return list;
  }, [planData.sprints, phaseFilter, sprintFilter]);

  // Group filtered tasks by sprint
  const { tasksBySprint, unassignedTasks } = useMemo(() => {
    const map = new Map();
    planData.sprints.forEach(s => {
      map.set(String(s.id), []);
    });
    const unassigned = [];

    filteredTasks.forEach(t => {
      let matchedSprintId = null;

      // 1. If task has a specific sprintPhase, match the sprint that corresponds to that phase!
      if (t.sprintPhase) {
        const match = planData.sprints.find(s => s.phase && normalizePhase(s.phase) === normalizePhase(t.sprintPhase));
        if (match) {
          matchedSprintId = String(match.id);
        }
      }

      // 2. If not matched by phase, fall back to direct sprintId
      if (!matchedSprintId && t.sprintId && map.has(String(t.sprintId))) {
        matchedSprintId = String(t.sprintId);
      }

      if (matchedSprintId && map.has(matchedSprintId)) {
        map.get(matchedSprintId).push(t);
      } else {
        unassigned.push(t);
      }
    });

    return { tasksBySprint: map, unassignedTasks: unassigned };
  }, [planData.sprints, filteredTasks]);

  // Build tree hierarchy for tasks in each sprint
  const buildSprintHierarchy = (tasksList) => {
    const list = [...tasksList];
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

    list.forEach(t => {
      if (!visited.has(String(t.id))) {
        visited.add(String(t.id));
        result.push({ ...t, level: 0, parent: null });
      }
    });

    return result;
  };

  // Toggle sprint collapse
  const toggleSprintCollapse = (sprintId) => {
    setCollapsedSprints(prev => {
      const next = new Set(prev);
      if (next.has(sprintId)) {
        next.delete(sprintId);
      } else {
        next.add(sprintId);
      }
      return next;
    });
  };

  const expandAllSprints = () => {
    setCollapsedSprints(new Set());
  };

  const collapseAllSprints = () => {
    setCollapsedSprints(new Set(planData.sprints.map(s => String(s.id))));
  };

  // Selection handlers
  const handleToggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleToggleSelectSprint = (sprintTasksList) => {
    if (sprintTasksList.length > 0 && sprintTasksList.every(t => selectedTaskIds.has(t.id))) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        sprintTasksList.forEach(t => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        sprintTasksList.forEach(t => next.add(t.id));
        return next;
      });
    }
  };

  // Helper to match a task against planData.tasks by ID, normalized ID, or title
  const findMatchingSprintTask = useCallback((idOrTask) => {
    if (!planData?.tasks || planData.tasks.length === 0) return null;
    const targetId = typeof idOrTask === 'object' ? idOrTask.id : idOrTask;
    const targetName = typeof idOrTask === 'object' ? (idOrTask.name || idOrTask.title) : null;
    const rawTargetId = String(targetId);
    const normTargetId = rawTargetId.replace(/^stk_/, '').replace(/_/g, '-');

    return planData.tasks.find(pt => {
      const rawPtId = String(pt.id);
      const normPtId = rawPtId.replace(/^stk_/, '').replace(/_/g, '-');
      if (rawPtId === rawTargetId || normPtId === normTargetId) return true;
      if (targetName && pt.title && pt.title.trim().toLowerCase() === targetName.trim().toLowerCase()) return true;
      return false;
    });
  }, [planData?.tasks]);

  // Task Action Handlers
  const handleToggleComplete = async (task) => {
    const isDone = String(task.status || '').toLowerCase() === 'done';
    const nextStatus = isDone ? 'In progress' : 'Done';
    const completedDate = !isDone ? (task.completedDate || getLocalDateString()) : '';

    // Trigger smooth FLIP table row animation: moves down when completed, moves up when undone
    triggerRowAnimation(task.id, !isDone ? 'down' : 'up');

    // 1. Immediately update in main task store
    updateTask(task.id, {
      status: nextStatus,
      completedDate
    });

    // 2. Also immediately update local planData state so progress cards and tables reflect change instantly
    const matchingSprintTask = findMatchingSprintTask(task);
    if (matchingSprintTask) {
      setPlanData(prev => {
        if (!prev?.tasks) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(pt => {
            if (pt.id === matchingSprintTask.id) {
              return {
                ...pt,
                percentComplete: !isDone ? 100 : 50,
                actualCompletionDate: completedDate
              };
            }
            return pt;
          })
        };
      });

      try {
        await updateSprintTask(projectId, matchingSprintTask.id, {
          percentComplete: !isDone ? 100 : 50,
          actualCompletionDate: completedDate
        });
      } catch {
        // ignore
      }
    }

    addToast(
      !isDone ? `Marked "${task.name || task.title}" as completed!` : `Set "${task.name || task.title}" to In progress`,
      'success',
      2000
    );
  };

  const handleStatusChange = async (taskId, newStatus, taskName) => {
    const isDone = newStatus === 'Done';
    const targetTask = projectTasks.find(t => String(t.id) === String(taskId));
    const completedDate = isDone ? (targetTask?.completedDate || getLocalDateString()) : '';

    // Trigger smooth FLIP table row animation
    triggerRowAnimation(taskId, isDone ? 'down' : 'up');

    updateTask(taskId, {
      status: newStatus,
      completedDate
    });

    const matchingSprintTask = findMatchingSprintTask(targetTask || taskId);
    if (matchingSprintTask) {
      setPlanData(prev => {
        if (!prev?.tasks) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map(pt => {
            if (pt.id === matchingSprintTask.id) {
              return {
                ...pt,
                percentComplete: isDone ? 100 : (newStatus === 'In progress' ? 50 : 0),
                actualCompletionDate: completedDate
              };
            }
            return pt;
          })
        };
      });

      try {
        await updateSprintTask(projectId, matchingSprintTask.id, {
          percentComplete: isDone ? 100 : (newStatus === 'In progress' ? 50 : 0),
          actualCompletionDate: completedDate
        });
      } catch {
        // ignore
      }
    }

    addToast(`Status updated to ${isDone ? 'Completed' : newStatus}`, 'success', 2000);
  };

  const handleDeleteTask = async (task) => {
    const title = task.name || task.title || 'task';
    if (!window.confirm(`Delete task "${title}"?`)) return;

    removeTask(task.id);

    const matchingSprintTask = findMatchingSprintTask(task);
    if (matchingSprintTask) {
      setPlanData(prev => ({
        ...prev,
        tasks: (prev.tasks || []).filter(pt => pt.id !== matchingSprintTask.id)
      }));
      try {
        await deleteSprintTask(projectId, matchingSprintTask.id);
      } catch {
        // ignore
      }
    }

    addToast(`Removed task "${title}"`, 'info');
    window.dispatchEvent(new CustomEvent('project_plan_updated', { detail: { projectId } }));
  };

  const handleUpdateCompletionDate = async (taskId, newDate) => {
    updateTask(taskId, { completedDate: newDate });
    const matchingSprintTask = findMatchingSprintTask(taskId);
    if (matchingSprintTask) {
      setPlanData(prev => ({
        ...prev,
        tasks: (prev.tasks || []).map(pt => pt.id === matchingSprintTask.id ? { ...pt, actualCompletionDate: newDate } : pt)
      }));
      try {
        await updateSprintTask(projectId, matchingSprintTask.id, { actualCompletionDate: newDate });
      } catch {
        // ignore
      }
    }
    addToast('Updated completion date', 'success', 1500);
    window.dispatchEvent(new CustomEvent('project_plan_updated', { detail: { projectId } }));
  };

  const handleAddSubtask = (parentTask, sprint) => {
    setEditingTask({
      parentId: parentTask.id,
      projectId: parentTask.projectId || projectId,
      sprintPhase: sprint?.phase || parentTask.sprintPhase || 'Realize – Build',
      sprintId: sprint?.id || parentTask.sprintId || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteSprint = async (sprintId, sprintCode) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to delete ${sprintCode} and all its associated tasks?`)) return;
    try {
      await deleteSprint(projectId, sprintId);
      addToast(`Sprint ${sprintCode} deleted`, 'info');
      loadPlan(true);
    } catch (err) {
      addToast(err.message || 'Failed to delete sprint', 'error');
    }
  };

  if (loading && planData.sprints.length === 0 && projectTasks.length === 0) {
    return (
      <div className="w-full py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="inline-block w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading sprint plan and tasks...</p>
      </div>
    );
  }

  const isEmptyPlan = planData.sprints.length === 0 && projectTasks.length === 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Detailed Sprint Plan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {projectTasks.length} {projectTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverable tracking, schedule baselines, and weight-based sprint completion
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadBlankPlanTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
            title="Download empty Excel template"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">download</span>
            <span>Blank Template</span>
          </button>

          {!isEmptyPlan && (
            <button
              type="button"
              onClick={() => exportProjectPlanToExcel(project.name, planData)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              title="Export complete plan to Excel"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">file_download</span>
              <span>Export Plan</span>
            </button>
          )}

          {/* Gantt Chart Button */}
          <button
            type="button"
            onClick={() => setIsGanttModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 active:bg-indigo-200 text-xs font-bold text-indigo-700 shadow-2xs transition cursor-pointer"
            title="Open Interactive Gantt Chart & Roadmap"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">view_timeline</span>
            <span>Gantt Chart</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-blue-600">upload_file</span>
                <span>Import from Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSprint(null);
                  setIsSprintModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-600">calendar_add_on</span>
                <span>Add Sprint</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTask({ projectId });
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-2xs transition active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Task</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {isEmptyPlan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Sprint Plan Configured</h3>
            <p className="text-xs text-slate-500">
              This project currently has an empty sprint plan. You can import from the standardized Excel workbook, add sprints manually, or download the template.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Import from Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSprint(null);
                    setIsSprintModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-indigo-600">add</span>
                  <span>Add First Sprint</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={downloadBlankPlanTemplate}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-2xs transition inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
              <span>Download Blank Template</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search task code, title, owner, workstream..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Sprint Filter */}
              <select
                value={sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Sprints</option>
                {sortSprintsByPhaseHierarchy(planData.sprints || []).map(s => {
                  const rawCode = String(s.code || '').trim();
                  const codeLabel = rawCode.toLowerCase().startsWith('sprint')
                    ? rawCode
                    : (/^\d+$/.test(rawCode) ? `Sprint ${rawCode}` : (rawCode ? `Sprint ${rawCode}` : 'Sprint'));
                  return (
                    <option key={s.id} value={String(s.id)}>{codeLabel} ({s.phase})</option>
                  );
                })}
              </select>

              {/* Workstream Filter */}
              <select
                value={workstreamFilter}
                onChange={(e) => setWorkstreamFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Workstreams</option>
                {workstreams.map(ws => (
                  <option key={ws} value={ws}>{ws}</option>
                ))}
              </select>

              {/* Gate Filter */}
              <select
                value={gateFilter}
                onChange={(e) => setGateFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Gates</option>
                {gateOptions.map(g => (
                  <option key={g.id} value={String(g.id)}>{g.code}: {g.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="On track">On track</option>
                <option value="Due soon">Due soon</option>
                <option value="Overdue">Overdue</option>
              </select>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-700"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {/* 5. Sprint Accordions */}
          <div className="space-y-4">
            {/* Global expand / collapse toolbar */}
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span className="font-semibold">Showing {displayedSprints.length} Sprints</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAllSprints}
                  className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-semibold transition cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                  <span>Expand All</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={collapseAllSprints}
                  className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-semibold transition cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">unfold_less</span>
                  <span>Collapse All</span>
                </button>
              </div>
            </div>

            {displayedSprints.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
                <p className="text-xs text-slate-500 font-medium">
                  No sprints match the selected filter criteria.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSprint({
                        phase: phaseFilter !== 'ALL' ? phaseFilter : 'Realize – Build',
                        code: '',
                        name: '',
                        goal: '',
                        startDate: '',
                        endDate: ''
                      });
                      setIsSprintModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Sprint {phaseFilter !== 'ALL' ? `in ${phaseFilter}` : ''}</span>
                  </button>
                )}
              </div>
            )}

            {displayedSprints.map(s => {
              const rawSprintTasks = tasksBySprint.get(String(s.id)) || [];
              const sprintTasks = buildSprintHierarchy(rawSprintTasks);
              const isCollapsed = collapsedSprints.has(String(s.id));
              const sprintCompletedTasks = rawSprintTasks.filter(t => String(t.status || '').toLowerCase() === 'done').length;
              const sprintWeightedCompletion = calculateWeightedCompletion(rawSprintTasks);
              const sprintOverdueCount = rawSprintTasks.filter(t => getDueMeta(t.dueDate, t.status).isOverdue).length;
              const sprintHighRiskCount = rawSprintTasks.filter(t => {
                const isDone = String(t.status || '').toLowerCase() === 'done';
                return !isDone && (getDueMeta(t.dueDate, t.status).isOverdue || String(t.priority).toLowerCase() === 'high');
              }).length;
              const phaseTheme = getPhaseTheme(s.phase);

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Sprint Collapsible Header */}
                  <div
                    onClick={() => toggleSprintCollapse(String(s.id))}
                    className="px-5 py-3.5 bg-slate-50 hover:bg-slate-100/90 transition cursor-pointer border-b border-slate-200/80 flex items-center justify-between gap-4 select-none group"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 shadow-2xs transition">
                        <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                          expand_more
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Sprint ID */}
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {s.code || s.id}
                          </span>

                          {/* Phase Pill */}
                          <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${phaseTheme.badge}`}>
                            {s.phase}
                          </span>

                          {/* Sprint Name */}
                          {s.name && s.name !== s.code && (
                            <span className="text-xs font-normal text-slate-500 truncate max-w-[260px]">
                              – {s.name}
                            </span>
                          )}

                          {isCollapsed && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              (Collapsed • {rawSprintTasks.length} {rawSprintTasks.length === 1 ? 'task' : 'tasks'})
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            {s.startDate && s.endDate ? `Window: ${s.startDate} → ${s.endDate}` : 'Dates TBD'}
                          </span>
                          {s.goal && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="truncate max-w-[400px]">Goal: {s.goal}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Sprint Metrics: Tasks & Weighted Completion */}
                      <div className="flex items-center gap-4 sm:gap-5">
                        {/* Tasks Count */}
                        <div className="flex flex-col items-end text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Tasks
                          </span>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>{rawSprintTasks.length}</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              ({sprintCompletedTasks}/{rawSprintTasks.length})
                            </span>
                          </div>
                        </div>

                        {/* Weighted Completion */}
                        <div className="flex flex-col items-end min-w-[130px] sm:min-w-[160px]">
                          <div className="flex items-center justify-between w-full mb-1 text-[10px]">
                            <span className="font-bold text-slate-400 uppercase tracking-wider">
                              Weighted Completion
                            </span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {sprintWeightedCompletion}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, sprintWeightedCompletion))}%` }}
                            />
                          </div>
                        </div>

                        {/* Badges for Overdue or High Risk if any */}
                        {(sprintOverdueCount > 0 || sprintHighRiskCount > 0) && (
                          <div className="hidden lg:flex items-center gap-1.5">
                            {sprintOverdueCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]" title={`${sprintOverdueCount} tasks overdue`}>
                                {sprintOverdueCount} Overdue
                              </span>
                            )}
                            {sprintHighRiskCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]" title={`${sprintHighRiskCount} high risk tasks`}>
                                {sprintHighRiskCount} High Risk
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask({
                                projectId,
                                sprintPhase: s.phase,
                                sprintId: s.id
                              });
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-blue-600 transition"
                            title={`Add task to Sprint ${s.code}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSprint(s);
                              setIsSprintModalOpen(true);
                            }}
                            className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 transition"
                            title="Edit sprint details"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSprint(s.id, s.code)}
                              className="p-1 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition"
                              title="Delete sprint (Admin only)"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks Table for this sprint - Internal UI matching user specification */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      {sprintTasks.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/30 space-y-2">
                          <p>No tasks match the active filters in this sprint.</p>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTask({
                                  projectId,
                                  sprintPhase: s.phase,
                                  sprintId: s.id
                                });
                                setIsTaskModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                              <span>Add Task to Sprint {s.code}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-[#f8fafc] border-b border-gray-200 text-gray-600">
                            <tr>
                              <th className="py-3 px-3.5 text-left w-10">
                                <input
                                  type="checkbox"
                                  checked={sprintTasks.length > 0 && sprintTasks.every(t => selectedTaskIds.has(t.id))}
                                  onChange={() => handleToggleSelectSprint(sprintTasks)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                  title="Select all tasks in this sprint"
                                />
                              </th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-20">ID</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left">Task Description & Tags</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-44">Assignee</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Status</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Mark Completed</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Due Date</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Completed</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-24">Priority</th>
                              <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-right pr-4 w-28">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sprintTasks.map((t, idx) => {
                              const assignees = getTaskAssignees(t);
                              const taskTags = getTaskTags(t);
                              const subInfo = subtasksMap.get(String(t.id));
                              const dueMeta = getDueMeta(t.dueDate, t.status);
                              const taskIdCode = formatTaskCode(t) || `TSK-${String(idx + 1).padStart(2, '0')}`;
                              const isSelected = selectedTaskIds.has(t.id);
                              const isDone = String(t.status || '').toLowerCase() === 'done';
                              const isMoving = movingTaskInfo?.id === String(t.id);
                              const moveDir = isMoving ? movingTaskInfo?.direction : null;

                              return (
                                <tr
                                  key={t.id}
                                  ref={registerRow(t.id)}
                                  className={`transition-colors duration-500 ${
                                    isMoving
                                      ? moveDir === 'down'
                                        ? 'bg-emerald-50/90 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/10'
                                        : 'bg-blue-50/90 ring-2 ring-blue-400/80 shadow-lg shadow-blue-500/10'
                                      : isSelected
                                        ? 'bg-blue-50/30 hover:bg-blue-50/50'
                                        : isDone
                                          ? 'bg-slate-50/30 hover:bg-slate-50/80'
                                          : 'hover:bg-slate-50/80'
                                  }`}
                                  style={{
                                    willChange: isMoving ? 'transform' : 'auto'
                                  }}
                                >
                                  {/* 1. Checkbox */}
                                  <td className="py-3.5 px-3.5 w-10 align-middle">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectTask(t.id)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                  </td>

                                  {/* 2. ID */}
                                  <td className="py-3.5 px-3 w-20 align-middle">
                                    <span className="font-mono text-xs font-semibold text-gray-600">
                                      {taskIdCode}
                                    </span>
                                  </td>

                                  {/* 3. Task Description & Tags */}
                                  <td className="py-3.5 px-3 align-middle">
                                    <div
                                      className="space-y-1.5"
                                      style={{ paddingLeft: t.level > 0 ? `${t.level * 20}px` : undefined }}
                                    >
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {t.level > 0 && (
                                          <span className="text-blue-500 font-bold text-xs select-none">
                                            {'↳'.repeat(Math.min(t.level, 3))}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          className="font-bold text-gray-900 hover:text-blue-600 text-left text-sm tracking-tight transition cursor-pointer"
                                          onClick={() => {
                                            setEditingTask(t);
                                            setIsTaskModalOpen(true);
                                          }}
                                        >
                                          {t.name || t.title}
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {taskTags.map((tag, tIdx) => (
                                          <span
                                            key={tIdx}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {subInfo && subInfo.total > 0 && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                            <span>☑</span>
                                            <span>{subInfo.done}/{subInfo.total}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* 4. Assignee */}
                                  <td className="py-3.5 px-3 w-44 align-middle">
                                    {assignees.length === 0 ? (
                                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                                    ) : (
                                      <div className="flex items-center gap-2 min-w-0" title={assignees.map(e => e.fullName).join(', ')}>
                                        <Avatar
                                          src={assignees[0].avatar}
                                          alt={assignees[0].fullName}
                                          className="h-6 w-6 ring-1 ring-gray-200 rounded-full shrink-0"
                                        />
                                        <span className="text-xs font-semibold text-gray-800 truncate">
                                          {assignees[0].fullName}
                                          {assignees.length > 1 && (
                                            <span className="text-gray-400 font-normal ml-1">+{assignees.length - 1}</span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  {/* 5. Status */}
                                  <td className="py-3.5 px-3 w-32 align-middle">
                                    <TaskStatusCell
                                      task={t}
                                      onStatusChange={(newStatus) => handleStatusChange(t.id, newStatus, t.name || t.title)}
                                    />
                                  </td>

                                  {/* 6. Mark Completed Toggle Button */}
                                  <td className="py-3.5 px-3 w-32 align-middle">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isDone}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                          e.currentTarget?.blur();
                                          handleToggleComplete(t);
                                        }}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                                          isDone ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200 hover:bg-slate-300'
                                        }`}
                                        title={isDone ? `Completed! Click to mark In Progress` : `Click to mark "${t.name || t.title}" as Completed`}
                                      >
                                        <span
                                          className={`pointer-events-none inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                                            isDone ? 'translate-x-4' : 'translate-x-0'
                                          }`}
                                        >
                                          <svg
                                            className={`w-2.5 h-2.5 text-emerald-600 stroke-[3] transition-all duration-500 ease-in-out ${
                                              isDone ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
                                            }`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </span>
                                      </button>
                                      <span className={`text-[11px] font-semibold select-none transition-colors duration-500 ${isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {isDone ? 'Completed' : 'Off'}
                                      </span>
                                    </div>
                                  </td>

                                  {/* 7. Due Date */}
                                  <td className="py-3.5 px-3 w-32 align-middle">
                                    <div>
                                      <div className={`text-xs font-semibold ${dueMeta.isOverdue ? 'text-rose-700' : 'text-gray-800'}`}>
                                        {fmtFullDate(t.dueDate)}
                                      </div>
                                      {dueMeta.subtext && (
                                        <div className={`text-[10px] font-semibold leading-tight ${dueMeta.isOverdue ? 'text-rose-600' : 'text-blue-600'}`}>
                                          {dueMeta.subtext}
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* 8. Completed */}
                                  <td className="py-3.5 px-3 w-36 align-middle">
                                    {isDone ? (
                                      canUserEditCompletionDate(t) ? (
                                        <div className="flex items-center gap-1.5" title="Project Lead / Admin: Click to change completion date">
                                          <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">check_circle</span>
                                          <input
                                            type="date"
                                            value={t.completedDate ? String(t.completedDate).slice(0, 10) : ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val) {
                                                handleUpdateCompletionDate(t.id, val);
                                              }
                                            }}
                                            className="text-xs font-semibold text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200 hover:border-emerald-300 transition cursor-pointer max-w-[125px]"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700" title="Completed Date">
                                          <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">check_circle</span>
                                          <span className="truncate">{fmtFullDate(t.completedDate || t.createdDate)}</span>
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-xs text-gray-400 font-normal">—</span>
                                    )}
                                  </td>

                                  {/* 9. Priority */}
                                  <td className="py-3.5 px-3 w-28 align-middle">
                                    {renderPriorityPill(t.priority)}
                                  </td>

                                  {/* 10. Actions */}
                                  <td className="py-3.5 px-3 text-right pr-4 w-28 align-middle">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubtask(t, s)}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition shrink-0 cursor-pointer"
                                        title={`Add subtask under "${t.name || t.title}"`}
                                      >
                                        + Subtask
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingTask(t);
                                          setIsTaskModalOpen(true);
                                        }}
                                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition cursor-pointer"
                                        title="Edit task"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTask(t)}
                                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition cursor-pointer"
                                        title="Remove task"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Backlog / Unassigned tasks if any */}
            {unassignedTasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-mono font-bold text-xs shadow-2xs">
                      Backlog / Unassigned
                    </span>
                    <span className="text-xs text-amber-900 font-medium hidden sm:inline">
                      Tasks not assigned to any existing sprint
                    </span>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider">Tasks</span>
                      <span className="text-xs font-bold text-amber-900">
                        {unassignedTasks.length} <span className="text-[11px] font-normal text-amber-700/80">({unassignedTasks.filter(t => String(t.status || '').toLowerCase() === 'done').length}/{unassignedTasks.length})</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end min-w-[130px] sm:min-w-[160px]">
                      <div className="flex items-center justify-between w-full mb-1 text-[10px]">
                        <span className="font-bold text-amber-700/70 uppercase tracking-wider">Weighted Completion</span>
                        <span className="font-bold text-amber-900 tabular-nums">{calculateWeightedCompletion(unassignedTasks)}%</span>
                      </div>
                      <div className="w-full bg-amber-200/70 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, calculateWeightedCompletion(unassignedTasks)))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8fafc] border-b border-gray-200 text-gray-600">
                      <tr>
                        <th className="py-3 px-3.5 text-left w-10">
                          <input
                            type="checkbox"
                            checked={unassignedTasks.length > 0 && unassignedTasks.every(t => selectedTaskIds.has(t.id))}
                            onChange={() => handleToggleSelectSprint(unassignedTasks)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-20">ID</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left">Task Description & Tags</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-44">Assignee</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Status</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Mark Completed</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Due Date</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-32">Completed</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-left w-24">Priority</th>
                        <th className="py-3 px-3 font-semibold text-xs text-gray-600 text-right pr-4 w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {buildSprintHierarchy(unassignedTasks).map((t, idx) => {
                        const assignees = getTaskAssignees(t);
                        const taskTags = getTaskTags(t);
                        const subInfo = subtasksMap.get(String(t.id));
                        const dueMeta = getDueMeta(t.dueDate, t.status);
                        const taskIdCode = formatTaskCode(t) || `TSK-${String(idx + 1).padStart(2, '0')}`;
                        const isSelected = selectedTaskIds.has(t.id);
                        const isDone = String(t.status || '').toLowerCase() === 'done';
                        const isMoving = movingTaskInfo?.id === String(t.id);
                        const moveDir = isMoving ? movingTaskInfo?.direction : null;

                        return (
                          <tr
                            key={t.id}
                            ref={registerRow(t.id)}
                            className={`transition-colors duration-500 ${
                              isMoving
                                ? moveDir === 'down'
                                  ? 'bg-emerald-50/90 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/10'
                                  : 'bg-blue-50/90 ring-2 ring-blue-400/80 shadow-lg shadow-blue-500/10'
                                : isSelected
                                  ? 'bg-blue-50/30 hover:bg-blue-50/50'
                                  : isDone
                                    ? 'bg-slate-50/30 hover:bg-slate-50/80'
                                    : 'hover:bg-slate-50/80'
                            }`}
                            style={{
                              willChange: isMoving ? 'transform' : 'auto'
                            }}
                          >
                            <td className="py-3.5 px-3.5 w-10 align-middle">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectTask(t.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-3.5 px-3 w-20 align-middle font-mono text-xs font-semibold text-gray-600">
                              {taskIdCode}
                            </td>
                            <td className="py-3.5 px-3 align-middle">
                              <div className="space-y-1.5" style={{ paddingLeft: t.level > 0 ? `${t.level * 20}px` : undefined }}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {t.level > 0 && (
                                    <span className="text-blue-500 font-bold text-xs select-none">
                                      {'↳'.repeat(Math.min(t.level, 3))}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="font-bold text-gray-900 hover:text-blue-600 text-left text-sm tracking-tight transition cursor-pointer"
                                    onClick={() => {
                                      setEditingTask(t);
                                      setIsTaskModalOpen(true);
                                    }}
                                  >
                                    {t.name || t.title}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {taskTags.map((tag, tIdx) => (
                                    <span key={tIdx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                                      {tag}
                                    </span>
                                  ))}
                                  {subInfo && subInfo.total > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                      <span>☑</span>
                                      <span>{subInfo.done}/{subInfo.total}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 w-44 align-middle">
                              {assignees.length === 0 ? (
                                <span className="text-xs text-gray-400 italic">Unassigned</span>
                              ) : (
                                <div className="flex items-center gap-2 min-w-0" title={assignees.map(e => e.fullName).join(', ')}>
                                  <Avatar src={assignees[0].avatar} alt={assignees[0].fullName} className="h-6 w-6 ring-1 ring-gray-200 rounded-full shrink-0" />
                                  <span className="text-xs font-semibold text-gray-800 truncate">
                                    {assignees[0].fullName}
                                    {assignees.length > 1 && (
                                      <span className="text-gray-400 font-normal ml-1">+{assignees.length - 1}</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 w-32 align-middle">
                              <TaskStatusCell task={t} onStatusChange={(newStatus) => handleStatusChange(t.id, newStatus, t.name || t.title)} />
                            </td>
                            <td className="py-3.5 px-3 w-32 align-middle">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isDone}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={(e) => {
                                    e.currentTarget?.blur();
                                    handleToggleComplete(t);
                                  }}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${
                                    isDone ? 'bg-emerald-500 shadow-xs' : 'bg-slate-200 hover:bg-slate-300'
                                  }`}
                                  title={isDone ? `Completed! Click to mark In Progress` : `Click to mark "${t.name || t.title}" as Completed`}
                                >
                                  <span
                                    className={`pointer-events-none inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
                                      isDone ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  >
                                    <svg
                                      className={`w-2.5 h-2.5 text-emerald-600 stroke-[3] transition-all duration-500 ease-in-out ${
                                        isDone ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45'
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                </button>
                                <span className={`text-[11px] font-semibold select-none transition-colors duration-500 ${isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                                  {isDone ? 'Completed' : 'Off'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 w-32 align-middle">
                              <div className={`text-xs font-semibold ${dueMeta.isOverdue ? 'text-rose-700' : 'text-gray-800'}`}>
                                {fmtFullDate(t.dueDate)}
                              </div>
                              {dueMeta.subtext && (
                                <div className={`text-[10px] font-semibold leading-tight ${dueMeta.isOverdue ? 'text-rose-600' : 'text-blue-600'}`}>
                                  {dueMeta.subtext}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 w-36 align-middle">
                              {isDone ? (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                  <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">check_circle</span>
                                  <span className="truncate">{fmtFullDate(t.completedDate || t.createdDate)}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-normal">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 w-28 align-middle">
                              {renderPriorityPill(t.priority)}
                            </td>
                            <td className="py-3.5 px-3 text-right pr-4 w-28 align-middle">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddSubtask(t, null)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-200 transition shrink-0 cursor-pointer"
                                  title={`Add subtask under "${t.name || t.title}"`}
                                >
                                  + Subtask
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTask(t);
                                    setIsTaskModalOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition cursor-pointer"
                                  title="Edit task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(t)}
                                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition cursor-pointer"
                                  title="Remove task"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {isImportModalOpen && (
        <PlanImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          projectId={projectId}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {/* Full-featured Task Modal */}
      <TaskForm
        isOpen={isTaskModalOpen}
        open={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        initial={editingTask}
        projects={allProjects}
      />

      {isSprintModalOpen && (
        <AddEditSprintModal
          isOpen={isSprintModalOpen}
          onClose={() => {
            setIsSprintModalOpen(false);
            setEditingSprint(null);
          }}
          projectId={projectId}
          sprint={editingSprint}
          onSuccess={() => loadPlan(true)}
        />
      )}

      {/* Interactive Gantt Roadmap Modal */}
      <GanttRoadmapModal
        isOpen={isGanttModalOpen}
        onClose={() => setIsGanttModalOpen(false)}
        project={project}
        tasks={projectTasks}
        sprints={planData.sprints}
        employees={employees}
        onAddTask={() => {
          setEditingTask({ projectId });
          setIsTaskModalOpen(true);
        }}
        onEditTask={(t) => {
          setEditingTask(t);
          setIsTaskModalOpen(true);
        }}
      />
    </div>
  );
}

export default SprintPlanTab;
