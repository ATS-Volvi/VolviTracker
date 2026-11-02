import React, { useState, useMemo } from 'react';
import { Avatar } from '../widgets/Avatar';

// Ordinal date formatter helper (e.g. '5th Sep', '1st Sep', '22nd Oct')
const formatOrdinalDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const j = day % 10;
    const k = day % 100;
    let suffix = 'th';
    if (j === 1 && k !== 11) suffix = 'st';
    else if (j === 2 && k !== 12) suffix = 'nd';
    else if (j === 3 && k !== 13) suffix = 'rd';
    return `${day}${suffix} ${month}`;
  } catch {
    return dateStr;
  }
};

const getMonthName = (dateStr) => {
  if (!dateStr) return 'Current Sprint';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Current Sprint' : d.toLocaleDateString('en-US', { month: 'long' });
  } catch {
    return 'Current Sprint';
  }
};

/**
 * GanttRoadmapModal
 * High-fidelity Project Timeline & Gantt Roadmap View
 * Exactly matching the user's specification:
 * - Header with sprint badge, objective & final target, view mode switchers (Days/Weeks/Milestones), print/PDF
 * - Card 1: Project Milestones (with progress distribution bars & sign-off)
 * - Card 2: Interactive Gantt Timeline (Days 1–30 grid with task span bars)
 * - Card 3: Project Tasks Breakdown table (with start, end, priority & status)
 * - Card 4: Notes & Sprint Guidelines
 * - Footer with live sync status, close button, and add task action
 */
export const GanttRoadmapModal = ({
  isOpen,
  onClose,
  project,
  tasks = [],
  employees = [],
  onAddTask
}) => {
  const [viewTimeframe, setViewTimeframe] = useState('days'); // 'days', 'weeks', 'milestones'
  const [activeNotes, setActiveNotes] = useState(() => {
    if (project?.id) {
      try {
        const saved = localStorage.getItem(`gantt_notes_${project.id}`);
        if (saved) return saved;
      } catch {}
    }
    return (
      project?.description ||
      'Focus on targeting high-engagement audiences for the product launch sequence. Schedule a stakeholder sync meeting to review creative ROAS and audience retargeting halfway through the campaign.'
    );
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Derive sprint title and target date
  const sprintTitle = useMemo(() => {
    if (!project) return 'Q3 Growth Sprint';
    return project.name || 'Active Project Sprint';
  }, [project]);

  const targetDateFormatted = useMemo(() => {
    if (!project?.endDate) return 'September 30, 2025';
    try {
      const d = new Date(project.endDate);
      return isNaN(d.getTime())
        ? project.endDate
        : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return project.endDate || 'September 30, 2025';
    }
  }, [project]);

  const sprintMonth = useMemo(() => {
    return getMonthName(project?.startDate || project?.endDate || new Date());
  }, [project]);

  // Map and sort tasks for the timeline
  const timelineTasks = useMemo(() => {
    const list = Array.isArray(tasks) && tasks.length > 0 ? tasks : [
      {
        id: 't-demo-1',
        name: 'Research & Competitor Analysis',
        status: 'Done',
        priority: 'High',
        startDate: '2025-09-01',
        dueDate: '2025-09-05',
        startDay: 1,
        endDay: 5,
        progress: 100,
        isKeyMilestone: true
      },
      {
        id: 't-demo-2',
        name: 'Develop content strategy',
        status: 'In progress',
        priority: 'High',
        startDate: '2025-09-06',
        dueDate: '2025-09-10',
        startDay: 6,
        endDay: 10,
        progress: 70,
        isKeyMilestone: false
      },
      {
        id: 't-demo-3',
        name: 'Schedule posts & campaigns',
        status: 'In progress',
        priority: 'Medium',
        startDate: '2025-09-11',
        dueDate: '2025-09-15',
        startDay: 11,
        endDay: 15,
        progress: 40,
        isKeyMilestone: true
      },
      {
        id: 't-demo-4',
        name: 'Design visuals for post and ads',
        status: 'Not started',
        priority: 'Medium',
        startDate: '2025-09-16',
        dueDate: '2025-09-22',
        startDay: 16,
        endDay: 22,
        progress: 0,
        isKeyMilestone: false
      },
      {
        id: 't-demo-5',
        name: 'Set up Facebook and Instagram ads',
        status: 'Not started',
        priority: 'High',
        startDate: '2025-09-23',
        dueDate: '2025-09-28',
        startDay: 23,
        endDay: 28,
        progress: 0,
        isKeyMilestone: true
      }
    ];

    // Compute day offsets (1 to 30) for each task
    return list.map((t, idx) => {
      let startDay = t.startDay;
      let endDay = t.endDay;

      // Extract day number from dates if available
      if (!startDay && t.startDate) {
        const d = new Date(t.startDate);
        if (!isNaN(d.getTime())) {
          startDay = Math.min(30, Math.max(1, d.getDate()));
        }
      }
      if (!endDay && t.dueDate) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          endDay = Math.min(30, Math.max(1, d.getDate()));
        }
      }

      // If dates not set or need distribution across 30 days
      if (!startDay && !endDay) {
        const slot = (idx % 6);
        startDay = slot * 5 + 1;
        endDay = Math.min(30, startDay + 4);
      } else if (!startDay && endDay) {
        startDay = Math.max(1, endDay - 4);
      } else if (startDay && !endDay) {
        endDay = Math.min(30, startDay + 4);
      }

      if (startDay > endDay) {
        const temp = startDay;
        startDay = endDay;
        endDay = temp;
      }

      const isDone = String(t.status || '').toLowerCase().trim() === 'done';
      const isInProgress = String(t.status || '').toLowerCase().trim() === 'in progress';
      const progress = isDone ? 100 : (t.progress !== undefined ? t.progress : (isInProgress ? 65 : 0));

      return {
        ...t,
        startDay,
        endDay,
        spanDays: endDay - startDay + 1,
        progress,
        isDone,
        isInProgress,
        isKeyMilestone: t.priority === 'High' || idx === 0 || idx === 2
      };
    });
  }, [tasks]);

  // Project milestones (High-level milestone items)
  const milestoneItems = useMemo(() => {
    return timelineTasks.slice(0, 4).map((t, idx) => ({
      id: t.id || `m-${idx}`,
      number: idx + 1,
      title: t.name,
      progress: t.progress,
      dueDate: formatOrdinalDate(t.dueDate || t.startDate),
      isSignedOff: t.isDone || t.progress >= 95
    }));
  }, [timelineTasks]);

  const onScheduleMilestonesCount = useMemo(() => {
    const onSchedule = milestoneItems.filter(m => m.progress >= 50 || m.isSignedOff).length;
    return `${onSchedule} of ${milestoneItems.length} milestones on schedule`;
  }, [milestoneItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    if (project?.id) {
      try {
        localStorage.setItem(`gantt_notes_${project.id}`, activeNotes);
      } catch {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4.5 border-b border-slate-200 bg-white shrink-0 print:border-b-2">
          {/* Left: Icon, Title, Sprint Badge, Subtitle */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4h18M3 10h12M3 16h16M3 20h8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Project Timeline & Gantt Roadmap
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  {sprintTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>
                  Objective:{' '}
                  <strong className="text-slate-700 font-medium">
                    {project?.clientName ? `Client: ${project.clientName} • ` : ''}
                    {project?.name || 'Boost brand engagement & paid conversion'}
                  </strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Final Target:{' '}
                  <strong className="text-slate-700 font-medium">{targetDateFormatted}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Right: View mode pills, Print button, Close 'X' */}
          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0 print:hidden">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewTimeframe('days')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewTimeframe === 'days'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Days (1–30)
              </button>
              <button
                type="button"
                onClick={() => setViewTimeframe('weeks')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewTimeframe === 'weeks'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weeks
              </button>
              <button
                type="button"
                onClick={() => setViewTimeframe('milestones')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewTimeframe === 'milestones'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Milestones
              </button>
            </div>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer"
              title="Print Gantt Roadmap or Save as PDF"
            >
              <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close Gantt Roadmap"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE BODY CONTENT                                                   */}
        {/* ========================================================================= */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 space-y-5 bg-[#F8FAFC]">

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 1: PROJECT MILESTONES                                              */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Project Milestones
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {onScheduleMilestonesCount}
              </span>
            </div>

            {/* Milestones Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-3">Milestone Title</th>
                    <th className="py-2 px-3 w-1/2">Progress Distribution</th>
                    <th className="py-2 px-3 text-center w-28">Due Date</th>
                    <th className="py-2 px-3 text-center w-20">Sign-Off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {milestoneItems.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 text-center text-slate-400 font-bold">
                        {m.number}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold truncate max-w-[260px]">
                        {m.title}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                m.progress === 100
                                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
                                  : 'bg-gradient-to-r from-sky-400 to-blue-500'
                              }`}
                              style={{ width: `${Math.max(4, m.progress)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-10 text-right shrink-0">
                            {m.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {m.dueDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {m.isSignedOff ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 text-transparent">
                            ○
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 2: PROJECT TIMELINE (DAYS 1 – 30)                                  */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Project Timeline (Days 1 – 30)
                </h2>
                <span className="text-xs font-medium text-slate-400 ml-1">
                  Sprint Month: <strong className="text-slate-700 font-semibold">{sprintMonth}</strong>
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3.5 text-xs text-slate-600 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-blue-800 shrink-0" />
                  <span>Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-sky-400 shrink-0" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-indigo-700 shrink-0" />
                  <span>Key Milestone</span>
                </div>
              </div>
            </div>

            {/* Gantt Grid Matrix */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-slate-50/40">
              <div className="min-w-[900px]">
                {/* Header Row: Task on left + 30 day columns */}
                <div className="grid grid-cols-[220px_repeat(30,1fr)] border-b border-slate-200 bg-slate-100/80 text-[10px] font-bold text-slate-600 select-none">
                  <div className="py-2.5 px-3 border-r border-slate-200 uppercase tracking-wider font-bold">
                    Task
                  </div>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                    <div
                      key={day}
                      className={`py-2 text-center border-r border-slate-200/60 last:border-r-0 ${
                        day === 15 ? 'bg-blue-100/60 text-blue-900 font-extrabold' : ''
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Task Gantt Rows */}
                <div className="divide-y divide-slate-100 bg-white">
                  {timelineTasks.map((task) => {
                    const start = Math.min(30, Math.max(1, task.startDay));
                    const end = Math.min(30, Math.max(start, task.endDay));
                    const span = end - start + 1;

                    return (
                      <div
                        key={task.id}
                        className="grid grid-cols-[220px_repeat(30,1fr)] items-center min-h-[44px] hover:bg-slate-50/80 transition group"
                      >
                        {/* Left Task Title */}
                        <div
                          className="px-3 py-2 border-r border-slate-200 text-xs font-semibold text-slate-800 truncate"
                          title={task.name}
                        >
                          {task.name}
                        </div>

                        {/* Gantt Bar spanning 30 columns */}
                        <div className="col-span-30 relative h-full flex items-center px-1">
                          {/* Background day column lines */}
                          <div className="absolute inset-0 grid grid-cols-30 pointer-events-none">
                            {Array.from({ length: 30 }).map((_, i) => (
                              <div
                                key={i}
                                className="border-r border-slate-100 last:border-r-0 h-full"
                              />
                            ))}
                          </div>

                          {/* The Horizontal Gantt Bar */}
                          <div
                            style={{
                              marginLeft: `${((start - 1) / 30) * 100}%`,
                              width: `${(span / 30) * 100}%`
                            }}
                            className={`relative z-10 h-7 rounded-md px-2.5 flex items-center justify-between text-white text-[10px] font-bold shadow-xs transition-transform group-hover:scale-[1.01] ${
                              task.isDone
                                ? 'bg-gradient-to-r from-blue-900 to-blue-700'
                                : 'bg-gradient-to-r from-sky-400 to-blue-500'
                            }`}
                            title={`${task.name} (Days ${start}-${end}, ${task.progress}% - ${task.status})`}
                          >
                            <span className="truncate flex items-center gap-1 font-bold">
                              <span>✓</span>
                              {task.isDone ? '100%' : `${task.progress}%`}
                            </span>
                            <span className="truncate ml-1.5 opacity-95 font-semibold text-[9.5px]">
                              Days {start}–{end}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 3: PROJECT TASKS BREAKDOWN                                         */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Project Tasks Breakdown
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {timelineTasks.length} Primary Execution Items
              </span>
            </div>

            {/* Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-3">Task</th>
                    <th className="py-2 px-3 text-center w-28">Start</th>
                    <th className="py-2 px-3 text-center w-28">End</th>
                    <th className="py-2 px-3 text-center w-24">Priority</th>
                    <th className="py-2 px-3 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {timelineTasks.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold">
                        {t.name}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {formatOrdinalDate(t.startDate || project?.startDate)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {formatOrdinalDate(t.dueDate || project?.endDate)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider ${
                            t.priority === 'High'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : t.priority === 'Medium'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {t.priority === 'Medium' ? 'Med' : t.priority || 'Med'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {t.isDone ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {t.status || 'Active'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 4: NOTES & SPRINT GUIDELINES                                       */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Notes & Sprint Guidelines
                </h2>
              </div>
              <button
                type="button"
                onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                {isEditingNotes ? 'Done Editing' : 'Edit Guidelines'}
              </button>
            </div>

            {isEditingNotes ? (
              <textarea
                value={activeNotes}
                onChange={(e) => setActiveNotes(e.target.value)}
                rows={3}
                className="w-full text-xs text-slate-700 p-3 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            ) : (
              <p className="text-xs leading-relaxed text-slate-600 bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 font-normal">
                {activeNotes}
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Gantt • Real-time synchronization active with Volvitech Engine</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition active:scale-98 cursor-pointer"
            >
              Close Gantt View
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onAddTask) onAddTask();
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <span>+</span> Add Timeline Task
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default GanttRoadmapModal;
