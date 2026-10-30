import React, { useMemo } from 'react';
import Avatar from '../widgets/Avatar';

/**
 * ProjectKpiDisplay
 * Modern, streamlined dynamic KPI and analytical overview matching top-tier product design:
 * 1. Top banner: Project title, details button, status, dates, client, team stack, and multi-segment pipeline completion
 * 2. 6 Metric KPI cards: Total Tasks, Completed, In Progress, In Review, Overdue, Due <48H
 * 3. 4 Analytical cards: Priority Status Overview, Tasks by Responsible, Task Status Overview, Track Completion
 */
export const ProjectKpiDisplay = ({
  project,
  tasks = [],
  employees = [],
  onOpenProjectDetails,
}) => {
  if (!project) return null;

  // 1. Calculate project task counts and statuses
  const metrics = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    const total = list.length;

    let completed = 0;
    let inProgress = 0;
    let inReview = 0;
    let notStarted = 0;

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
      const isDone = statusLower === 'done' || statusLower === 'completed';
      const isInReview = statusLower.includes('review');
      const isInProgress = statusLower === 'in progress' || statusLower === 'in_progress' || statusLower === 'active';

      if (isDone) {
        completed += 1;
      } else if (isInReview) {
        inReview += 1;
      } else if (isInProgress) {
        inProgress += 1;
      } else {
        notStarted += 1;
      }

      // Priority
      const priorityLower = String(t.priority || '').toLowerCase().trim();
      if (priorityLower === 'high' || priorityLower === 'critical') {
        high += 1;
      } else if (priorityLower === 'low') {
        low += 1;
      } else {
        medium += 1;
      }

      // Deadlines (only if not done)
      if (!isDone && t.dueDate) {
        const due = String(t.dueDate).slice(0, 10);
        if (due < todayStr) {
          overdue += 1;
          if (priorityLower === 'high' || priorityLower === 'critical') {
            overdueHigh += 1;
          }
        } else if (due >= todayStr && due <= in48h) {
          dueSoon += 1;
        }
      }
    });

    const pendingOrLate = notStarted + overdue;
    const completedPct = total > 0 ? (completed / total) * 100 : 0;
    const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
    const inReviewPct = total > 0 ? (inReview / total) * 100 : 0;
    const overduePct = total > 0 ? (overdue / total) * 100 : 0;

    const highPct = total > 0 ? Math.round((high / total) * 100) : 0;
    const mediumPct = total > 0 ? Math.round((medium / total) * 100) : 0;
    const lowPct = total > 0 ? Math.max(0, 100 - highPct - mediumPct) : 0;

    return {
      total,
      completed,
      inProgress,
      inReview,
      notStarted,
      pendingOrLate,
      overdue,
      dueSoon,
      overdueHigh,
      completedPct: Number(completedPct.toFixed(1)),
      inProgressPct: Number(inProgressPct.toFixed(1)),
      inReviewPct: Number(inReviewPct.toFixed(1)),
      overduePct: Number(overduePct.toFixed(1)),
      high,
      medium,
      low,
      highPct,
      mediumPct,
      lowPct,
    };
  }, [tasks]);

  // 2. Resolve project team members and their task loads
  const { memberStats, avgTasksPerMember, projectMembers } = useMemo(() => {
    let ids = [];
    if (Array.isArray(project.assigneeIds) && project.assigneeIds.length > 0) {
      ids = project.assigneeIds;
    } else if (project.assigneeId) {
      ids = [project.assigneeId];
    }

    const members = ids
      .map(id => employees.find(e => String(e.id) === String(id)))
      .filter(Boolean);

    // Compute task counts per member
    const countsMap = new Map();
    (tasks || []).forEach(t => {
      const taskAssignees = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
        ? t.assigneeIds
        : (t.assigneeId ? [t.assigneeId] : []);

      taskAssignees.forEach(aid => {
        countsMap.set(String(aid), (countsMap.get(String(aid)) || 0) + 1);
      });
    });

    const activeMemberIds = Array.from(new Set([...ids.map(String), ...Array.from(countsMap.keys())]));
    const allRelevantEmployees = activeMemberIds
      .map(aid => employees.find(e => String(e.id) === String(aid)))
      .filter(Boolean);

    const stats = allRelevantEmployees.map(emp => {
      const taskCount = countsMap.get(String(emp.id)) || 0;
      const firstName = (emp.fullName || 'Member').trim().split(' ')[0] || 'User';
      const shortName = firstName.slice(0, 4);
      return {
        id: emp.id,
        fullName: emp.fullName,
        shortName,
        avatar: emp.avatar,
        taskCount,
      };
    });

    const maxTasks = stats.reduce((max, s) => Math.max(max, s.taskCount), 1);
    const avg = stats.length > 0 ? (metrics.total / stats.length).toFixed(1) : '0.0';

    return {
      memberStats: stats.map(s => ({
        ...s,
        pct: Math.round((s.taskCount / maxTasks) * 100),
      })),
      avgTasksPerMember: avg,
      projectMembers: members.length > 0 ? members : allRelevantEmployees,
    };
  }, [project, tasks, employees, metrics.total]);

  // 3. Dynamic Track Completion
  const tracks = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    if (list.length === 0) {
      return {
        list: [
          { name: 'Marketing & Growth', pct: 0, done: 0, total: 0, color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
          { name: 'Creative & Visuals', pct: 0, done: 0, total: 0, color: 'bg-gradient-to-r from-sky-500 to-cyan-500' },
          { name: 'Engineering & API', pct: 0, done: 0, total: 0, color: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
          { name: 'Operations & Finance', pct: 0, done: 0, total: 0, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
        ],
        avgTrackPct: 0,
      };
    }

    const buckets = {
      growth: { name: 'Marketing & Growth', tasks: [], color: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
      creative: { name: 'Creative & Visuals', tasks: [], color: 'bg-gradient-to-r from-sky-500 to-cyan-500' },
      tech: { name: 'Engineering & API', tasks: [], color: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
      ops: { name: 'Operations & Finance', tasks: [], color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    };

    list.forEach((t, idx) => {
      const nameLower = String(t.name || '').toLowerCase();
      if (nameLower.includes('market') || nameLower.includes('seo') || nameLower.includes('social') || nameLower.includes('growth') || nameLower.includes('campaign')) {
        buckets.growth.tasks.push(t);
      } else if (nameLower.includes('design') || nameLower.includes('ui') || nameLower.includes('ux') || nameLower.includes('visual') || nameLower.includes('brand') || nameLower.includes('art')) {
        buckets.creative.tasks.push(t);
      } else if (nameLower.includes('api') || nameLower.includes('backend') || nameLower.includes('dev') || nameLower.includes('code') || nameLower.includes('tech') || nameLower.includes('db')) {
        buckets.tech.tasks.push(t);
      } else if (nameLower.includes('finance') || nameLower.includes('tax') || nameLower.includes('ops') || nameLower.includes('legal') || nameLower.includes('client') || nameLower.includes('review')) {
        buckets.ops.tasks.push(t);
      } else {
        const keys = ['growth', 'creative', 'tech', 'ops'];
        buckets[keys[idx % 4]].tasks.push(t);
      }
    });

    const result = Object.values(buckets).map(b => {
      const bTotal = b.tasks.length;
      const bDone = b.tasks.filter(t => String(t.status || '').toLowerCase() === 'done').length;
      const pct = bTotal > 0 ? Math.round((bDone / bTotal) * 100) : 0;
      return {
        name: b.name,
        total: bTotal,
        done: bDone,
        pct,
        color: b.color,
      };
    });

    const avgTrackPct = Math.round(result.reduce((sum, r) => sum + r.pct, 0) / result.length);
    return { list: result, avgTrackPct };
  }, [tasks]);

  // Overall Pipeline Completion math
  const pipelineDoneWidth = metrics.completedPct;
  const pipelineActiveWidth = metrics.inProgressPct;
  const pipelineReviewWidth = metrics.inReviewPct;
  const pipelineLateWidth = metrics.overduePct;

  // Donut SVG circumference helper
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  // Priority SVG Donut segments
  const highStroke = (metrics.highPct / 100) * circumference;
  const medStroke = (metrics.mediumPct / 100) * circumference;
  const lowStroke = (metrics.lowPct / 100) * circumference;

  // Status SVG Donut segments
  const statusDoneStroke = (metrics.completedPct / 100) * circumference;
  const statusActiveStroke = (metrics.inProgressPct / 100) * circumference;
  const statusReviewStroke = (metrics.inReviewPct / 100) * circumference;
  const statusLateStroke = (metrics.overduePct / 100) * circumference;

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
                {project.status || 'On Track'}
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
          <div className="lg:w-[340px] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Overall Pipeline Completion</span>
              <span className="text-blue-700 font-black text-sm">{metrics.completedPct}%</span>
            </div>

            {/* Multi-segmented Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${pipelineDoneWidth}%` }}
                className="h-full bg-blue-700 transition-all duration-500"
                title={`Done: ${metrics.completed}`}
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
            <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-x-2 pt-0.5">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-700" />
                <span>{metrics.completed} Done</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-400" />
                <span>{metrics.inProgress} Active</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-200" />
                <span>{metrics.inReview} Review</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span>{metrics.overdue} Late</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 6 KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: TOTAL TASKS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL TASKS</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</span>
            <span className="text-[11px] font-bold text-emerald-600">↑ 100%</span>
          </div>
        </div>

        {/* Card 2: COMPLETED */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">COMPLETED</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.completed}</span>
            <span className="text-[11px] font-bold text-slate-500">{metrics.completedPct}%</span>
          </div>
        </div>

        {/* Card 3: IN PROGRESS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IN PROGRESS</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[16px]">timelapse</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.inProgress}</span>
            <span className="text-[11px] font-bold text-slate-500">{metrics.inProgressPct}%</span>
          </div>
        </div>

        {/* Card 4: IN REVIEW */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IN REVIEW</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.inReview}</span>
            <span className="text-[11px] font-bold text-slate-500">{metrics.inReviewPct}%</span>
          </div>
        </div>

        {/* Card 5: OVERDUE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OVERDUE</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <span className="material-symbols-outlined text-[16px]">warning</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.overdue}</span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              CRITICAL
            </span>
          </div>
        </div>

        {/* Card 6: DUE <48H */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DUE &lt;48H</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.dueSoon}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Urgent
            </span>
          </div>
        </div>
      </div>

      {/* 3. ROW OF 4 ANALYTICAL CARDS */}
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
            <div className="mt-4 flex items-center justify-between gap-3">
              {/* SVG Donut */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />

                  {/* High Priority (Red) */}
                  {highStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="12"
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
                      strokeWidth="12"
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
                      strokeWidth="12"
                      strokeDasharray={`${lowStroke} ${circumference}`}
                      strokeDashoffset={-(highStroke + medStroke)}
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-base font-black text-slate-900 leading-none">{metrics.total}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Tasks</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs text-slate-600 flex-1 min-w-0">
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
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden">
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

            {/* Bar Chart Columns */}
            <div className="mt-4 h-24 flex items-end justify-between gap-1 sm:gap-1.5 pt-2">
              {memberStats.length > 0 ? (
                memberStats.slice(0, 9).map((m, idx) => (
                  <div key={m.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div
                      className="w-full max-w-[20px] rounded-t-md transition-all duration-300 relative shadow-2xs"
                      style={{
                        height: `${Math.max(14, (m.pct / 100) * 64)}px`,
                        backgroundColor: idx % 2 === 0 ? '#0284c7' : '#38bdf8',
                      }}
                      title={`${m.fullName}: ${m.taskCount} tasks`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-10 font-bold shadow-md">
                        {m.taskCount}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[28px] text-center">
                      {m.shortName}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                  No member assignments
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
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
            <div className="mt-4 flex items-center justify-between gap-3">
              {/* SVG Donut */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />

                  {/* Completed (Deep Blue) */}
                  {statusDoneStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="12"
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
                      strokeWidth="12"
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
                      strokeWidth="12"
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
                      strokeWidth="12"
                      strokeDasharray={`${statusLateStroke} ${circumference}`}
                      strokeDashoffset={-(statusDoneStroke + statusActiveStroke + statusReviewStroke)}
                    />
                  )}
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-sm font-black text-slate-900 leading-none">{metrics.completedPct}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Done</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs text-slate-600 flex-1 min-w-0">
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
            <span className="font-bold text-blue-700">{metrics.completed}/{metrics.total} done</span>
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

            {/* Track Progress Bars */}
            <div className="mt-3.5 space-y-2.5">
              {tracks.list.map(t => (
                <div key={t.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate">{t.name}</span>
                    <span className="font-bold text-slate-800 tabular-nums ml-2">{t.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full ${t.color} rounded-full transition-all duration-500`}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-50/90 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('tasks-tracker-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              <span>View Milestone Roadmap</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectKpiDisplay;
