import React, { useState, useEffect, useMemo } from 'react';
import Avatar from '../widgets/Avatar';
import { fetchProjectPlan } from '../../services/projectPlanApi';
import { normalizePhase, calculateWeightedCompletion, sortSprintsByPhaseHierarchy } from './plan/planCalcs';
import { GanttRoadmapModal } from '../tasks/GanttRoadmapModal';

/**
 * ProjectKpiDisplay
 * Modern, streamlined dynamic KPI and analytical overview matching top-tier product design:
 * 1. Top banner: Project title, details button, status, dates, client, team stack, and multi-segment pipeline completion
 * 2. 4 Analytical cards: Priority Status Overview, Tasks by Responsible, Task Status Overview, Track Completion
 */
export const ProjectKpiDisplay = ({
  project,
  tasks = [],
  employees = [],
  onOpenProjectDetails,
}) => {
  const [planSprints, setPlanSprints] = useState([]);
  const [planTasks, setPlanTasks] = useState([]);
  const [isGanttModalOpen, setIsGanttModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!project?.id) {
      setPlanSprints([]);
      setPlanTasks([]);
      return;
    }

    const loadPlan = async () => {
      try {
        const data = await fetchProjectPlan(project.id);
        if (isMounted && data) {
          setPlanSprints(sortSprintsByPhaseHierarchy(data.sprints || []));
          setPlanTasks(data.tasks || []);
        }
      } catch (err) {
        console.error('Failed to load project plan sprints for KPI display:', err);
      }
    };

    loadPlan();

    const handleUpdate = (e) => {
      if (!e.detail?.projectId || String(e.detail.projectId) === String(project.id)) {
        loadPlan();
      }
    };

    window.addEventListener('project_plan_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('project_plan_updated', handleUpdate);
    };
  }, [project?.id]);

  // 1. Combined tasks list enriched with plan task metadata (sprintId, sprintPhase, percentComplete, etc.)
  const combinedTasks = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks.map(t => ({ ...t })) : [];
    const idMap = new Set();
    const titleMap = new Set();

    list.forEach(t => {
      const rawId = String(t.id);
      idMap.add(rawId);
      idMap.add(rawId.replace(/^stk_/, ''));
      const normId = rawId.replace(/^stk_/, '').replace(/_/g, '-');
      idMap.add(normId);
      if (t.name) titleMap.add(t.name.trim().toLowerCase());
      if (t.title) titleMap.add(t.title.trim().toLowerCase());
    });

    (planTasks || []).forEach(pt => {
      const rawPtId = String(pt.id);
      const cleanPtId = rawPtId.replace(/^stk_/, '');
      const normPtId = cleanPtId.replace(/_/g, '-');
      const ptTitle = (pt.title || pt.name || '').trim().toLowerCase();

      const matched = list.find(t => {
        const rawTId = String(t.id);
        const normTId = rawTId.replace(/^stk_/, '').replace(/_/g, '-');
        if (rawTId === rawPtId || normTId === normPtId) return true;
        if (ptTitle && (t.name || t.title) && (t.name || t.title).trim().toLowerCase() === ptTitle) return true;
        return false;
      });

      if (matched) {
        if (pt.taskCode && !matched.taskCode) matched.taskCode = pt.taskCode;
        if (pt.sprintId && !matched.sprintId) matched.sprintId = pt.sprintId;
        if (pt.gateId && !matched.gateId) matched.gateId = pt.gateId;
        if (pt.workstream && !matched.workstream) matched.workstream = pt.workstream;
        if (pt.sprintPhase && !matched.sprintPhase) matched.sprintPhase = pt.sprintPhase;
        if (pt.percentComplete !== undefined && matched.percentComplete === undefined) {
          matched.percentComplete = pt.percentComplete;
        }
        if (pt.priority && !matched.priority) matched.priority = pt.priority;
        if (pt.owner && !matched.owner) matched.owner = pt.owner;
        if ((pt.plannedFinish || pt.dueDate) && !matched.dueDate) {
          matched.dueDate = pt.plannedFinish || pt.dueDate;
        }
        if (pt.status && !matched.status) {
          matched.status = pt.status;
        }
      } else {
        const isKnown = idMap.has(rawPtId) || idMap.has(cleanPtId) || idMap.has(normPtId) || (ptTitle && titleMap.has(ptTitle));
        if (!isKnown) {
          list.push({
            id: pt.id,
            name: pt.title || pt.name,
            title: pt.title || pt.name,
            taskCode: pt.taskCode,
            projectId: pt.projectId,
            sprintId: pt.sprintId,
            gateId: pt.gateId,
            workstream: pt.workstream,
            sprintPhase: pt.sprintPhase,
            percentComplete: pt.percentComplete,
            status: Number(pt.percentComplete || 0) >= 100 ? 'Done' : (pt.status || 'In progress'),
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
  }, [tasks, planTasks]);

  // 2. Calculate project task counts, priorities, and statuses across all unified tasks
  const metrics = useMemo(() => {
    const list = Array.isArray(combinedTasks) ? combinedTasks : [];
    const total = list.length;

    let completed = 0;
    let inProgress = 0;
    let inReview = 0;
    let pendingOrLate = 0;

    let high = 0;
    let medium = 0;
    let low = 0;

    let overdue = 0;
    let dueSoon = 0;
    let overdueHigh = 0;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

    list.forEach(t => {
      const statusLower = String(t.status || '').toLowerCase().trim();
      const isDone = statusLower === 'done' || statusLower === 'completed' || Number(t.percentComplete || 0) >= 100;
      const isInReview = !isDone && statusLower.includes('review');
      const isInProgress = !isDone && !isInReview && (
        statusLower === 'in progress' ||
        statusLower === 'in_progress' ||
        statusLower === 'active' ||
        Number(t.percentComplete || 0) > 0
      );

      // Deadlines (only if not done)
      let isTaskOverdue = false;
      const dueDateVal = t.dueDate || t.plannedFinish;
      if (!isDone && dueDateVal) {
        const due = String(dueDateVal).slice(0, 10);
        if (due < todayStr) {
          isTaskOverdue = true;
          overdue += 1;
        } else if (due >= todayStr && due <= in48h) {
          dueSoon += 1;
        }
      }

      if (isDone) {
        completed += 1;
      } else if (isTaskOverdue) {
        // Overdue pending tasks count in Pending/Late state to match SprintPlanTab visual status
        pendingOrLate += 1;
      } else if (isInReview) {
        inReview += 1;
      } else if (isInProgress) {
        inProgress += 1;
      } else {
        pendingOrLate += 1;
      }

      // Priority (matches renderPriorityPill in SprintPlanTab)
      const priorityLower = String(t.priority || '').toLowerCase().trim();
      if (priorityLower === 'high' || priorityLower === 'critical') {
        high += 1;
        if (isTaskOverdue) {
          overdueHigh += 1;
        }
      } else if (priorityLower === 'low') {
        low += 1;
      } else {
        medium += 1;
      }
    });

    const completedPct = total > 0 ? (completed / total) * 100 : 0;
    const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
    const inReviewPct = total > 0 ? (inReview / total) * 100 : 0;
    const pendingOrLatePct = total > 0 ? (pendingOrLate / total) * 100 : 0;
    const overduePct = total > 0 ? (overdue / total) * 100 : 0;

    const highPct = total > 0 ? Math.round((high / total) * 100) : 0;
    const mediumPct = total > 0 ? Math.round((medium / total) * 100) : 0;
    const lowPct = total > 0 ? Math.max(0, 100 - highPct - mediumPct) : 0;

    return {
      total,
      completed,
      inProgress,
      inReview,
      pendingOrLate,
      overdue,
      dueSoon,
      overdueHigh,
      completedPct: Number(completedPct.toFixed(1)),
      inProgressPct: Number(inProgressPct.toFixed(1)),
      inReviewPct: Number(inReviewPct.toFixed(1)),
      pendingOrLatePct: Number(pendingOrLatePct.toFixed(1)),
      overduePct: Number(overduePct.toFixed(1)),
      high,
      medium,
      low,
      highPct,
      mediumPct,
      lowPct,
    };
  }, [combinedTasks]);

  // Project Manager resolution
  const projectManager = useMemo(() => {
    if (!project) return null;
    const pmId = project.projectManagerId || project.createdBy;
    if (!pmId) return null;
    return employees.find(e => String(e.id) === String(pmId)) || null;
  }, [project?.projectManagerId, project?.createdBy, employees, project]);

  // 3. Resolve project team members and their task loads from combinedTasks
  const { memberStats, maxMemberTasks, avgTasksPerMember, projectMembers } = useMemo(() => {
    if (!project) {
      return { memberStats: [], maxMemberTasks: 1, avgTasksPerMember: '0.0', projectMembers: [] };
    }
    let ids = [];
    if (Array.isArray(project.assigneeIds) && project.assigneeIds.length > 0) {
      ids = project.assigneeIds;
    } else if (project.assigneeId) {
      ids = [project.assigneeId];
    }

    const members = ids
      .map(id => employees.find(e => String(e.id) === String(id)))
      .filter(Boolean);

    // Compute task counts per member: total, completed, inProgress, other
    const countsMap = new Map();
    (combinedTasks || []).forEach(t => {
      let taskAssignees = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
        ? t.assigneeIds
        : (t.assigneeId ? [t.assigneeId] : []);

      if (taskAssignees.length === 0 && t.owner) {
        const ownerLower = String(t.owner).trim().toLowerCase();
        const emp = employees.find(e => {
          const fn = String(e.fullName || '').trim().toLowerCase();
          const n = String(e.name || '').trim().toLowerCase();
          return fn === ownerLower || n === ownerLower || (fn && fn.includes(ownerLower)) || (n && n.includes(ownerLower));
        });
        if (emp) taskAssignees = [emp.id];
      }

      const statusLower = String(t.status || '').toLowerCase().trim();
      const isDone = statusLower === 'done' || statusLower === 'completed' || Number(t.percentComplete || 0) >= 100;
      const isInProgress = !isDone && (
        statusLower === 'in progress' ||
        statusLower === 'in_progress' ||
        statusLower === 'active' ||
        statusLower.includes('review') ||
        Number(t.percentComplete || 0) > 0
      );

      taskAssignees.forEach(aid => {
        const key = String(aid);
        if (!countsMap.has(key)) {
          countsMap.set(key, { total: 0, completed: 0, inProgress: 0, other: 0 });
        }
        const data = countsMap.get(key);
        data.total += 1;
        if (isDone) {
          data.completed += 1;
        } else if (isInProgress) {
          data.inProgress += 1;
        } else {
          data.other += 1;
        }
      });
    });

    const activeMemberIds = Array.from(new Set([...ids.map(String), ...Array.from(countsMap.keys())]));
    const allRelevantEmployees = activeMemberIds
      .map(aid => employees.find(e => String(e.id) === String(aid)))
      .filter(Boolean);

    const stats = allRelevantEmployees.map(emp => {
      const data = countsMap.get(String(emp.id)) || { total: 0, completed: 0, inProgress: 0, other: 0 };
      const firstName = (emp.fullName || emp.name || 'Member').trim().split(' ')[0] || 'User';
      const shortName = firstName.length > 5 ? firstName.slice(0, 5) : firstName;
      return {
        id: emp.id,
        fullName: emp.fullName || emp.name,
        shortName,
        avatar: emp.avatar,
        taskCount: data.total,
        completed: data.completed,
        inProgress: data.inProgress,
        other: data.other,
      };
    });

    const maxTasks = stats.reduce((max, s) => Math.max(max, s.taskCount), 1);
    const avg = stats.length > 0 ? (metrics.total / stats.length).toFixed(1) : '0.0';

    return {
      memberStats: stats.map(s => ({
        ...s,
        pct: Math.round((s.taskCount / maxTasks) * 100),
      })),
      maxMemberTasks: maxTasks,
      avgTasksPerMember: avg,
      projectMembers: members.length > 0 ? members : allRelevantEmployees,
    };
  }, [project, combinedTasks, employees, metrics.total]);

  // 3. Dynamic Sprint Track Completion
  const tracks = useMemo(() => {
    const sprintColors = [
      'bg-gradient-to-r from-blue-600 to-indigo-600',
      'bg-gradient-to-r from-sky-500 to-cyan-500',
      'bg-gradient-to-r from-indigo-500 to-purple-600',
      'bg-gradient-to-r from-amber-500 to-orange-500',
      'bg-gradient-to-r from-emerald-500 to-teal-600',
      'bg-gradient-to-r from-rose-500 to-pink-600',
      'bg-gradient-to-r from-violet-600 to-fuchsia-600'
    ];

    if (!planSprints || planSprints.length === 0) {
      // Fallback: If no plan sprints exist, check if tasks have any sprintPhase
      const phaseMap = new Map();
      combinedTasks.forEach(t => {
        if (t.sprintPhase) {
          const ph = String(t.sprintPhase).trim();
          if (!phaseMap.has(ph)) phaseMap.set(ph, []);
          phaseMap.get(ph).push(t);
        }
      });

      if (phaseMap.size > 0) {
        const list = Array.from(phaseMap.entries()).map(([phase, sTasks], idx) => {
          const total = sTasks.length;
          const done = sTasks.filter(t => String(t.status || '').toLowerCase() === 'done').length;
          const pct = calculateWeightedCompletion(sTasks);
          return {
            id: `phase-${idx}`,
            name: phase,
            total,
            done,
            pct,
            color: sprintColors[idx % sprintColors.length]
          };
        });
        const avgTrackPct = list.length > 0
          ? Math.round(list.reduce((sum, r) => sum + r.pct, 0) / list.length)
          : 0;
        return { list, avgTrackPct, totalSprints: list.length };
      }

      return { list: [], avgTrackPct: 0, totalSprints: 0 };
    }

    const list = sortSprintsByPhaseHierarchy(planSprints).map((s, idx) => {
      const sTasks = combinedTasks.filter(t => {
        if (t.sprintPhase && s.phase && normalizePhase(t.sprintPhase) === normalizePhase(s.phase)) {
          return true;
        }
        if (t.sprintId && String(t.sprintId) === String(s.id)) {
          return true;
        }
        return false;
      });

      const total = sTasks.length;
      const done = sTasks.filter(t => String(t.status || '').toLowerCase() === 'done').length;
      const pct = calculateWeightedCompletion(sTasks);

      const nameParts = [];
      if (s.code) {
        const rawCode = String(s.code).trim();
        const codeLabel = rawCode.toLowerCase().startsWith('sprint')
          ? rawCode
          : (/^\d+$/.test(rawCode) ? `Sprint ${rawCode}` : rawCode);
        nameParts.push(codeLabel);
      }
      if (s.name && s.name !== s.code && (!s.code || !String(s.name).toLowerCase().includes(String(s.code).toLowerCase()))) {
        nameParts.push(s.name);
      } else if (s.phase) {
        nameParts.push(s.phase);
      }
      const displayName = nameParts.length > 0 ? nameParts.join(' • ') : (s.phase || `Sprint ${idx + 1}`);

      return {
        id: s.id,
        name: displayName,
        total,
        done,
        pct,
        color: sprintColors[idx % sprintColors.length]
      };
    });

    const avgTrackPct = list.length > 0
      ? Math.round(list.reduce((sum, r) => sum + r.pct, 0) / list.length)
      : 0;

    return { list, avgTrackPct, totalSprints: list.length };
  }, [planSprints, combinedTasks]);

  // Overall Pipeline Completion math
  const pipelineDoneWidth = metrics.completedPct;
  const pipelineActiveWidth = metrics.inProgressPct;
  const pipelineReviewWidth = metrics.inReviewPct;
  const pipelineLateWidth = metrics.overduePct;

  // Donut SVG circumference helper
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.33

  // Priority SVG Donut segments
  const highStroke = (metrics.highPct / 100) * circumference;
  const medStroke = (metrics.mediumPct / 100) * circumference;
  const lowStroke = (metrics.lowPct / 100) * circumference;

  // Status SVG Donut segments (matches the 4 legend states: Completed, In Progress, In Review, Pending/Late)
  const statusDoneStroke = (metrics.completedPct / 100) * circumference;
  const statusActiveStroke = (metrics.inProgressPct / 100) * circumference;
  const statusReviewStroke = (metrics.inReviewPct / 100) * circumference;
  const statusLateStroke = (metrics.pendingOrLatePct / 100) * circumference;

  if (!project) return null;

  return (
    <div className="w-full space-y-4">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left info: Project Name, Badges, Dates, Client, Avatars */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {project.name}
              </h1>

              {/* ACTION BUTTON BESIDE PROJECT NAME */}
              {onOpenProjectDetails && (
                <button
                  type="button"
                  onClick={onOpenProjectDetails}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer shrink-0"
                  title="Open Project Details in a pop-up window"
                >
                  <span className="material-symbols-outlined text-[16px] text-blue-600">edit_document</span>
                  <span>Project Details</span>
                </button>
              )}

              {/* Status Pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50/90 text-blue-700 border border-blue-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                {project.status === 'Done' ? 'Completed' : (project.status || 'On Track')}
              </span>

              {/* Dates Pill */}
              {(project.startDate || project.endDate) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80">
                  <span className="text-slate-400">📅</span>
                  <span>{project.startDate || '—'} – {project.endDate || '—'}</span>
                </span>
              )}

              {/* Client Pill */}
              {project.clientName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/80">
                  <span className="text-slate-400">🏢</span>
                  <span className="text-slate-500 font-normal">Client:</span>
                  <span className="font-bold text-slate-800">{project.clientName}</span>
                </span>
              )}

              {/* Team Avatars Stack */}
              {projectMembers.length > 0 && (
                <div className="flex items-center -space-x-2 overflow-hidden ml-1">
                  {projectMembers.slice(0, 3).map(m => (
                    <Avatar
                      key={m.id}
                      src={m.avatar}
                      alt={m.fullName}
                      className="h-7 w-7 ring-2 ring-white shadow-2xs"
                    />
                  ))}
                  {projectMembers.length > 3 && (
                    <div className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-2xs">
                      +{projectMembers.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subtitle Line */}
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-medium">Sprint Scope</span>
              <span>•</span>
              {project.pocName ? (
                <span>POC: <strong className="text-slate-700 font-semibold">{project.pocName}</strong></span>
              ) : (
                <span>Target Milestone: Project Final Delivery</span>
              )}
              {project.supplierName && (
                <>
                  <span>•</span>
                  <span>Supplier: <strong className="text-slate-700 font-semibold">{project.supplierName}</strong></span>
                </>
              )}
              {projectManager && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-slate-400">PM:</span>
                    <strong className="text-indigo-700 font-semibold">{projectManager.fullName}</strong>
                  </span>
                </>
              )}
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tasks-tracker-anchor');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5 hover:underline cursor-pointer"
              >
                <span>View Task Tracker</span>
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              </button>
            </div>
          </div>

          {/* Right side: Overall Pipeline Completion */}
          <div className="w-full lg:w-[460px] xl:w-[480px] shrink-0 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Overall Pipeline Completion</span>
              <span className="text-blue-700 font-black text-sm">{metrics.completedPct}%</span>
            </div>

            {/* Multi-segmented Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${pipelineDoneWidth}%` }}
                className="h-full bg-blue-700 transition-all duration-500"
                title={`Completed: ${metrics.completed}`}
              />
              <div
                style={{ width: `${pipelineActiveWidth}%` }}
                className="h-full bg-sky-400 transition-all duration-500"
                title={`Active: ${metrics.inProgress}`}
              />
              <div
                style={{ width: `${pipelineReviewWidth}%` }}
                className="h-full bg-sky-200 transition-all duration-500"
                title={`Review: ${metrics.inReview}`}
              />
              <div
                style={{ width: `${pipelineLateWidth}%` }}
                className="h-full bg-rose-500 transition-all duration-500"
                title={`Late: ${metrics.overdue}`}
              />
            </div>

            {/* Pipeline Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2.5 gap-y-1 text-[11px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-700 shrink-0" />
                <span>{metrics.completed} Completed</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 shrink-0" />
                <span>{metrics.inProgress} Active</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-200 shrink-0" />
                <span>{metrics.inReview} Review</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                <span>{metrics.overdue} Late</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 4 ANALYTICAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PRIORITY STATUS OVERVIEW */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-blue-600">pie_chart</span>
                <span>Priority Status Overview</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                {metrics.total} Total
              </span>
            </div>

            {/* Donut Chart + Legend */}
            <div className="mt-4 flex items-center justify-between gap-4">
              {/* SVG Donut */}
              <div className="relative w-[102px] h-[102px] shrink-0 flex items-center justify-center">
                <svg className="w-[102px] h-[102px] -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="9" />

                  {/* High Priority (Red) */}
                  {highStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="9"
                      strokeDasharray={`${highStroke} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}

                  {/* Medium Priority (Sky Blue) */}
                  {medStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="9"
                      strokeDasharray={`${medStroke} ${circumference}`}
                      strokeDashoffset={-highStroke}
                    />
                  )}

                  {/* Low Priority (Deep Blue) */}
                  {lowStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#1d4ed8"
                      strokeWidth="9"
                      strokeDasharray={`${lowStroke} ${circumference}`}
                      strokeDashoffset={-(highStroke + medStroke)}
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                  <span className="font-black text-slate-900 leading-none" style={{ fontSize: '16px' }}>
                    {metrics.total}
                  </span>
                  <span
                    className="font-bold text-slate-400 uppercase leading-none mt-1"
                    style={{ fontSize: '8.5px', letterSpacing: '0.04em' }}
                  >
                    Tasks
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs text-slate-600 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>High:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {metrics.high} <span className="text-slate-400 font-normal">({metrics.highPct}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span>Medium:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {metrics.medium} <span className="text-slate-400 font-normal">({metrics.mediumPct}%)</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-700 shrink-0" />
                    <span>Low:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    {metrics.low} <span className="text-slate-400 font-normal">({metrics.lowPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="truncate">
              {metrics.overdueHigh > 0 ? (
                <strong className="text-rose-600 font-bold">Critical focus: {metrics.overdueHigh} high priority overdue</strong>
              ) : (
                <span className="text-emerald-700 font-semibold">✓ All high-priority tasks on track</span>
              )}
            </span>
          </div>
        </div>

        {/* Card 2: TASKS BY RESPONSIBLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-visible relative hover:z-30">
          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-blue-600">bar_chart</span>
                <span>Tasks by Responsible</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                {memberStats.length} Members
              </span>
            </div>

            {/* Mini Legend for Completed vs In Progress */}
            <div className="mt-2.5 flex items-center justify-end gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded-xs bg-blue-600 shrink-0" />
                <span>Completed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2 rounded-xs bg-sky-400 shrink-0" />
                <span>In Progress</span>
              </span>
            </div>

            {/* Bar Chart Columns */}
            <div className="mt-2 h-24 flex items-end justify-between gap-1.5 sm:gap-2.5 pt-2">
              {memberStats.length > 0 ? (
                memberStats.slice(0, 9).map((m, idx) => {
                  const maxHeightPx = 68;
                  const maxTasksCount = maxMemberTasks || 1;
                  const barHeightPx = m.taskCount > 0
                    ? Math.max(16, Math.round((m.taskCount / maxTasksCount) * maxHeightPx))
                    : 0;

                  // Compute segment heights inside the bar
                  let cHeight = m.taskCount > 0 ? Math.round((m.completed / m.taskCount) * barHeightPx) : 0;
                  let ipHeight = m.taskCount > 0 ? Math.round((m.inProgress / m.taskCount) * barHeightPx) : 0;
                  let oHeight = Math.max(0, barHeightPx - cHeight - ipHeight);

                  if (m.completed > 0 && cHeight === 0) cHeight = 3;
                  if (m.inProgress > 0 && ipHeight === 0) ipHeight = 3;

                  return (
                    <div key={m.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group min-w-0">
                      {/* Bar */}
                      <div className="w-full flex justify-center items-end relative">
                        {/* Tooltip on Hover - Extends outside the box fully without clipping */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50">
                          <div className="bg-slate-900/95 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg shadow-2xl border border-slate-700/60 font-medium flex items-center gap-1.5">
                            <span className="font-bold">{m.fullName}:</span>
                            <span className="text-blue-300 font-semibold">{m.completed} Done</span>
                            <span>•</span>
                            <span className="text-sky-300 font-semibold">{m.inProgress} Active</span>
                            {m.other > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300">{m.other} Other</span>
                              </>
                            )}
                          </div>
                        </div>

                        {m.taskCount > 0 ? (
                          <div
                            className="w-full max-w-[34px] sm:max-w-[42px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 shadow-2xs group-hover:shadow-md cursor-pointer"
                            style={{ height: `${barHeightPx}px` }}
                          >
                            {/* Other / Pending (top) */}
                            {oHeight > 0 && (
                              <div
                                style={{ height: `${oHeight}px` }}
                                className="w-full bg-slate-200 transition-all duration-300"
                                title={`Pending: ${m.other}`}
                              />
                            )}
                            {/* In Progress (middle) */}
                            {ipHeight > 0 && (
                              <div
                                style={{ height: `${ipHeight}px` }}
                                className="w-full bg-sky-400 transition-all duration-300"
                                title={`In Progress: ${m.inProgress}`}
                              />
                            )}
                            {/* Completed (bottom) */}
                            {cHeight > 0 && (
                              <div
                                style={{ height: `${cHeight}px` }}
                                className="w-full bg-blue-600 transition-all duration-300"
                                title={`Completed: ${m.completed}`}
                              />
                            )}
                          </div>
                        ) : (
                          <div
                            className="w-full max-w-[34px] sm:max-w-[42px] h-[3px] rounded-full bg-slate-200"
                            title={`${m.fullName}: 0 tasks`}
                          />
                        )}
                      </div>

                      {/* Name */}
                      <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[42px] sm:max-w-[52px] text-center" title={m.fullName}>
                        {m.shortName}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No member assignments
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between rounded-b-2xl">
            <span className="font-semibold text-slate-600">Balanced load</span>
            <span className="font-bold text-slate-800">Avg {avgTasksPerMember} tasks/lead</span>
          </div>
        </div>

        {/* Card 3: TASK STATUS OVERVIEW */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-blue-600">donut_large</span>
                <span>Task Status Overview</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                4 States
              </span>
            </div>

            {/* Donut Chart + Legend */}
            <div className="mt-4 flex items-center justify-between gap-4">
              {/* SVG Donut */}
              <div className="relative w-[102px] h-[102px] shrink-0 flex items-center justify-center">
                <svg className="w-[102px] h-[102px] -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="9" />

                  {/* Completed (Deep Blue) */}
                  {statusDoneStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="9"
                      strokeDasharray={`${statusDoneStroke} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}

                  {/* In Progress (Sky Blue) */}
                  {statusActiveStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="9"
                      strokeDasharray={`${statusActiveStroke} ${circumference}`}
                      strokeDashoffset={-statusDoneStroke}
                    />
                  )}

                  {/* In Review (Soft Blue) */}
                  {statusReviewStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#93c5fd"
                      strokeWidth="9"
                      strokeDasharray={`${statusReviewStroke} ${circumference}`}
                      strokeDashoffset={-(statusDoneStroke + statusActiveStroke)}
                    />
                  )}

                  {/* Pending/Late (Red) */}
                  {statusLateStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="9"
                      strokeDasharray={`${statusLateStroke} ${circumference}`}
                      strokeDashoffset={-(statusDoneStroke + statusActiveStroke + statusReviewStroke)}
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                  <span className="font-black text-slate-900 leading-none" style={{ fontSize: '15px' }}>
                    {metrics.completedPct}%
                  </span>
                  <span
                    className="font-bold text-slate-400 uppercase leading-none mt-1"
                    style={{ fontSize: '8.5px', letterSpacing: '0.04em' }}
                  >
                    Completed
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs text-slate-600 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    <span>Completed:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{metrics.completed}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                    <span>In Progress:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{metrics.inProgress}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-sky-200 shrink-0" />
                    <span>In Review:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{metrics.inReview}</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>Pending/Late:</span>
                  </span>
                  <span className="font-bold text-slate-800 tabular-nums">{metrics.pendingOrLate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Velocity: Real-time sync</span>
            <span className="font-bold text-blue-700">{metrics.completed}/{metrics.total} completed</span>
          </div>
        </div>

        {/* Card 4: TRACK COMPLETION */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden">
          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-blue-600">trending_up</span>
                <span>Track Completion</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                {tracks.avgTrackPct}% Avg
              </span>
            </div>

            {/* Track Progress Bars - Scrollable List */}
            <div className="mt-3 max-h-[140px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
              {tracks.list.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No sprints configured for this project yet.
                </div>
              ) : (
                tracks.list.map(t => (
                  <div key={t.id || t.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-slate-700 font-medium truncate" title={t.name}>{t.name}</span>
                        {t.total > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">({t.done}/{t.total})</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-800 tabular-nums ml-2 shrink-0">{t.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${t.color} rounded-full transition-all duration-500`}
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsGanttModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
              title="Open Interactive Gantt Chart & Milestone Roadmap"
            >
              <span>View Milestone Roadmap</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
            {tracks.totalSprints > 0 && (
              <span className="text-slate-500 font-medium">{tracks.totalSprints} {tracks.totalSprints === 1 ? 'Sprint' : 'Sprints'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Gantt Roadmap Modal */}
      {isGanttModalOpen && (
        <GanttRoadmapModal
          isOpen={isGanttModalOpen}
          onClose={() => setIsGanttModalOpen(false)}
          project={project}
          tasks={combinedTasks}
          sprints={planSprints}
          employees={employees}
        />
      )}
    </div>
  );
};

export default ProjectKpiDisplay;
