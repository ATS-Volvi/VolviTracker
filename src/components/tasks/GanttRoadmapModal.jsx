import React, { useState, useMemo, useCallback } from 'react';
import { Avatar } from '../widgets/Avatar';
import { formatTaskCode } from '../../utils/taskCode';
import { sortSprintsByPhaseHierarchy } from '../projects/plan/planCalcs';

/**
 * Flexible Date Parser
 * Parses ISO dates ('2026-10-06'), DD-MMM-YYYY ('06-Oct-2026'), and standard date strings.
 */
const parseFlexibleDate = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Direct check for YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    }

    // Check for DD-MMM-YYYY (e.g. '06-Oct-2026', '01-Sep-2026')
    const dmyMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (dmyMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = monthNames.indexOf(dmyMatch[2].toLowerCase());
      if (mIdx !== -1) {
        return new Date(parseInt(dmyMatch[3], 10), mIdx, parseInt(dmyMatch[1], 10));
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

// Formats date into readable ordinal representation (e.g. '6th Oct 2026' or '6th Oct')
const formatOrdinalDate = (val, includeYear = true) => {
  const d = parseFlexibleDate(val);
  if (!d) return '—';
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const j = day % 10;
  const k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';

  return includeYear ? `${day}${suffix} ${month} ${year}` : `${day}${suffix} ${month}`;
};

// Formats short date for Gantt bar (e.g. 'Oct 6')
const formatShortDate = (val) => {
  const d = parseFlexibleDate(val);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * GanttRoadmapModal
 * High-fidelity Project Timeline & Gantt Roadmap View
 * With fully synchronized months, dates, sprint phases, and task durations.
 */
export const GanttRoadmapModal = ({
  isOpen,
  onClose,
  project,
  tasks = [],
  sprints = [],
  employees = [],
  onAddTask,
  onEditTask
}) => {
  const [viewTimeframe, setViewTimeframe] = useState('days'); // 'days', 'weeks', 'milestones'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSprint, setFilterSprint] = useState('ALL');
  const [filterPhase, setFilterPhase] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [activeNotes, setActiveNotes] = useState(() => {
    if (project?.id) {
      try {
        const saved = localStorage.getItem(`gantt_notes_${project.id}`);
        if (saved) return saved;
      } catch {}
    }
    return (
      project?.description ||
      'Focus on delivering high-impact sprint deliverables on schedule. Track task start and due dates, resolve bottlenecks early, and verify milestones before sign-off.'
    );
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Derive sprint title and target date
  const sprintTitle = useMemo(() => {
    if (!project) return 'Active Project Plan';
    return project.name || 'Active Project Plan';
  }, [project]);

  const targetDateFormatted = useMemo(() => {
    const rawTarget = project?.endDate || (tasks.length > 0 ? tasks[tasks.length - 1].dueDate : null);
    if (!rawTarget) return 'On Schedule';
    return formatOrdinalDate(rawTarget, true);
  }, [project, tasks]);

  // Assignee mapping helper
  const getTaskAssignees = useCallback((t) => {
    const ids = Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0
      ? t.assigneeIds
      : (t.assigneeId ? [t.assigneeId] : []);
    return ids.map(id => employees.find(e => String(e.id) === String(id))).filter(Boolean);
  }, [employees]);

  // 1. Discover all months represented across the project tasks, sprints, and project dates
  const availableMonths = useMemo(() => {
    const monthCounts = new Map();

    const recordDate = (d) => {
      const parsed = parseFlexibleDate(d);
      if (parsed) {
        const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
        monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
      }
    };

    (tasks || []).forEach(t => {
      if (t.dueDate) recordDate(t.dueDate);
      if (t.startDate) recordDate(t.startDate);
      if (t.createdDate) recordDate(t.createdDate);
      if (t.createdAt) recordDate(t.createdAt);
      if (t.completedDate) recordDate(t.completedDate);
    });

    (sprints || []).forEach(s => {
      if (s.startDate) recordDate(s.startDate);
      if (s.endDate) recordDate(s.endDate);
    });

    if (project?.startDate) recordDate(project.startDate);
    if (project?.endDate) recordDate(project.endDate);

    if (monthCounts.size === 0) {
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      monthCounts.set(key, 1);
    }

    const sortedKeys = Array.from(monthCounts.keys()).sort();
    return sortedKeys.map(key => {
      const [y, m] = key.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        key,
        year: y,
        monthIndex: m - 1,
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortLabel: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthName: d.toLocaleDateString('en-US', { month: 'long' }),
        count: monthCounts.get(key) || 0
      };
    });
  }, [tasks, sprints, project]);

  // 2. Default active month to current month if available, else project target or highest task concentration
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  const activeMonthInfo = useMemo(() => {
    if (availableMonths.length === 0) {
      const now = new Date();
      return {
        key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        year: now.getFullYear(),
        monthIndex: now.getMonth(),
        label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        shortLabel: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthName: now.toLocaleDateString('en-US', { month: 'long' })
      };
    }

    if (selectedMonthKey) {
      const found = availableMonths.find(m => m.key === selectedMonthKey);
      if (found) return found;
    }

    // Default to current month if in available months
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curFound = availableMonths.find(m => m.key === curKey);
    if (curFound) return curFound;

    // Default to the project end date month or the month with the most tasks
    if (project?.endDate) {
      const targetD = parseFlexibleDate(project.endDate);
      if (targetD) {
        const targetKey = `${targetD.getFullYear()}-${String(targetD.getMonth() + 1).padStart(2, '0')}`;
        const found = availableMonths.find(m => m.key === targetKey);
        if (found) return found;
      }
    }

    let best = availableMonths[0];
    for (const m of availableMonths) {
      if ((m.count || 0) > (best.count || 0)) best = m;
    }
    return best || availableMonths[availableMonths.length - 1];
  }, [availableMonths, selectedMonthKey, project]);

  const activeYear = activeMonthInfo.year;
  const activeMonthIndex = activeMonthInfo.monthIndex;
  const daysInActiveMonth = useMemo(() => {
    return new Date(activeYear, activeMonthIndex + 1, 0).getDate();
  }, [activeYear, activeMonthIndex]);

  // Today marker calculations
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const isCurrentMonth = todayDate.getFullYear() === activeYear && todayDate.getMonth() === activeMonthIndex;
  const todayDay = todayDate.getDate();
  const todayLeftPercent = isCurrentMonth && todayDay >= 1 && todayDay <= daysInActiveMonth
    ? ((todayDay - 0.5) / daysInActiveMonth) * 100
    : null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    const curIdx = availableMonths.findIndex(m => m.key === activeMonthInfo.key);
    if (curIdx > 0) {
      setSelectedMonthKey(availableMonths[curIdx - 1].key);
    } else {
      const prevD = new Date(activeYear, activeMonthIndex - 1, 1);
      setSelectedMonthKey(`${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  const handleNextMonth = () => {
    const curIdx = availableMonths.findIndex(m => m.key === activeMonthInfo.key);
    if (curIdx >= 0 && curIdx < availableMonths.length - 1) {
      setSelectedMonthKey(availableMonths[curIdx + 1].key);
    } else {
      const nextD = new Date(activeYear, activeMonthIndex + 1, 1);
      setSelectedMonthKey(`${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  const handleJumpToToday = () => {
    const curKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonthKey(curKey);
  };

  // Distinct sprint phases available
  const availablePhases = useMemo(() => {
    const set = new Set();
    (tasks || []).forEach(t => {
      if (t.sprintPhase) set.add(t.sprintPhase);
    });
    (sprints || []).forEach(s => {
      if (s.phase) set.add(s.phase);
    });
    return Array.from(set).sort();
  }, [tasks, sprints]);

  // 3. Process tasks with accurate start & end dates matched to the active timeline
  const processedTasks = useMemo(() => {
    const list = Array.isArray(tasks) ? tasks : [];
    if (list.length === 0) return [];

    const monthStart = new Date(activeYear, activeMonthIndex, 1, 0, 0, 0, 0);
    const monthEnd = new Date(activeYear, activeMonthIndex, daysInActiveMonth, 23, 59, 59, 999);

    return list.map((t, idx) => {
      const taskName = (t.name || t.title || 'Untitled Task').trim();
      const taskIdCode = formatTaskCode(t, idx);

      let parsedDue = parseFlexibleDate(t.dueDate);
      let parsedStart = parseFlexibleDate(t.startDate || t.createdDate || t.createdAt);

      // If startDate is missing, compute start relative to dueDate
      if (!parsedStart && parsedDue) {
        parsedStart = new Date(parsedDue.getTime() - 4 * 24 * 60 * 60 * 1000);
      } else if (parsedStart && !parsedDue) {
        parsedDue = new Date(parsedStart.getTime() + 4 * 24 * 60 * 60 * 1000);
      } else if (!parsedStart && !parsedDue) {
        const offset = (idx % 6) * 5 + 1;
        parsedStart = new Date(activeYear, activeMonthIndex, Math.min(daysInActiveMonth, offset));
        parsedDue = new Date(activeYear, activeMonthIndex, Math.min(daysInActiveMonth, offset + 4));
      }

      // Ensure chronological ordering
      let baseStart = parsedStart;
      let baseDue = parsedDue;
      if (baseStart > baseDue) {
        const tmp = baseStart;
        baseStart = baseDue;
        baseDue = tmp;
      }

      const isDone = String(t.status || '').toLowerCase().trim() === 'done';
      let parsedCompleted = null;
      if (isDone) {
        parsedCompleted = parseFlexibleDate(t.completedDate || t.createdDate || t.startDate || baseStart);
      }

      const overallStart = baseStart;
      let overallEnd = baseDue;
      if (isDone && parsedCompleted && parsedCompleted > baseDue) {
        overallEnd = parsedCompleted;
      }

      const overlapsActiveMonth = !(overallEnd < monthStart || overallStart > monthEnd);
      const isPriorMonth = overallEnd < monthStart;
      const isFutureMonth = overallStart > monthEnd;

      // Construct timeline segments:
      // 1. Not completed: [baseStart, baseDue] -> in progress sky / overdue amber / planned slate
      // 2. Completed on/before due: [baseStart, compEnd] -> emerald/blue, remaining -> grey
      // 3. Completed late: [baseStart, baseDue] -> emerald/blue, delayed -> rose red
      const rawSegments = [];
      if (!isDone) {
        const isPastDue = baseDue < todayDate;
        rawSegments.push({
          type: isPastDue ? 'overdue-amber' : (t.status === 'In progress' ? 'inprogress-sky' : 'uncompleted-grey'),
          sDate: baseStart,
          eDate: baseDue,
          title: `Planned: ${formatShortDate(baseStart)} – ${formatShortDate(baseDue)} (${t.status || 'Not started'})`
        });
      } else {
        if (!parsedCompleted || parsedCompleted <= baseDue) {
          const compEnd = parsedCompleted || baseDue;
          rawSegments.push({
            type: 'completed-emerald',
            sDate: baseStart,
            eDate: compEnd,
            title: `Completed: ${formatShortDate(baseStart)} – ${formatShortDate(compEnd)}`
          });
          if (compEnd < baseDue) {
            const nextDay = new Date(compEnd.getFullYear(), compEnd.getMonth(), compEnd.getDate() + 1);
            if (nextDay <= baseDue) {
              rawSegments.push({
                type: 'remaining-grey',
                sDate: nextDay,
                eDate: baseDue,
                title: `Remaining Due Window: ${formatShortDate(nextDay)} – ${formatShortDate(baseDue)}`
              });
            }
          }
        } else {
          rawSegments.push({
            type: 'completed-emerald',
            sDate: baseStart,
            eDate: baseDue,
            title: `Target Window: ${formatShortDate(baseStart)} – ${formatShortDate(baseDue)}`
          });
          const nextDay = new Date(baseDue.getFullYear(), baseDue.getMonth(), baseDue.getDate() + 1);
          if (nextDay <= parsedCompleted) {
            rawSegments.push({
              type: 'late-red',
              sDate: nextDay,
              eDate: parsedCompleted,
              title: `Late Completion: ${formatShortDate(nextDay)} – ${formatShortDate(parsedCompleted)}`
            });
          }
        }
      }

      // Project rawSegments into the active month's 1..daysInActiveMonth grid
      const activeSegments = [];
      rawSegments.forEach((seg) => {
        const segStartNorm = new Date(seg.sDate.getFullYear(), seg.sDate.getMonth(), seg.sDate.getDate(), 0, 0, 0);
        const segEndNorm = new Date(seg.eDate.getFullYear(), seg.eDate.getMonth(), seg.eDate.getDate(), 23, 59, 59);

        if (segEndNorm < monthStart || segStartNorm > monthEnd) {
          return;
        }

        let sDay = 1;
        let eDay = daysInActiveMonth;

        if (segStartNorm.getFullYear() === activeYear && segStartNorm.getMonth() === activeMonthIndex) {
          sDay = segStartNorm.getDate();
        }
        if (segEndNorm.getFullYear() === activeYear && segEndNorm.getMonth() === activeMonthIndex) {
          eDay = segEndNorm.getDate();
        }

        sDay = Math.max(1, Math.min(daysInActiveMonth, sDay));
        eDay = Math.max(sDay, Math.min(daysInActiveMonth, eDay));

        const left = ((sDay - 1) / daysInActiveMonth) * 100;
        const width = ((eDay - sDay + 1) / daysInActiveMonth) * 100;

        activeSegments.push({
          ...seg,
          sDay,
          eDay,
          spanDays: eDay - sDay + 1,
          left,
          width
        });
      });

      const isInProgress = String(t.status || '').toLowerCase().trim() === 'in progress';
      const progress = isDone ? 100 : (t.progress !== undefined ? t.progress : (isInProgress ? 65 : 0));

      const matchedSprint = (sprints || []).find(s => String(s.id) === String(t.sprintId));
      const sprintPhase = t.sprintPhase || matchedSprint?.phase || '';
      const sprintName = matchedSprint?.name || '';
      const assignees = getTaskAssignees(t);

      return {
        ...t,
        name: taskName,
        taskIdCode,
        sprintPhase,
        sprintName,
        assignees,
        parsedStart: baseStart,
        parsedDue: baseDue,
        parsedCompleted,
        overallStart,
        overallEnd,
        overlapsActiveMonth,
        isPriorMonth,
        isFutureMonth,
        activeSegments,
        progress,
        isDone,
        isInProgress,
        isKeyMilestone: t.priority === 'High' || idx === 0 || idx === 2
      };
    });
  }, [tasks, sprints, activeYear, activeMonthIndex, daysInActiveMonth, todayDate, getTaskAssignees]);

  // 4. Filtered tasks based on active search, sprint, phase, and timeframe
  const displayedTasks = useMemo(() => {
    return processedTasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (t.name || '').toLowerCase().includes(q);
        const matchCode = (t.taskIdCode || '').toLowerCase().includes(q);
        const matchSprint = (t.sprintName || '').toLowerCase().includes(q);
        const matchPhase = (t.sprintPhase || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchSprint && !matchPhase) return false;
      }
      if (filterSprint !== 'ALL' && String(t.sprintId) !== String(filterSprint)) {
        return false;
      }
      if (filterPhase !== 'ALL' && String(t.sprintPhase || '').toLowerCase() !== String(filterPhase).toLowerCase()) {
        return false;
      }
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'Done' && !t.isDone) return false;
        if (filterStatus === 'In progress' && (!t.isInProgress || t.isDone)) return false;
        if (filterStatus === 'Not started' && (t.isInProgress || t.isDone)) return false;
        if (filterStatus === 'Overdue') {
          if (t.isDone || !t.parsedDue || t.parsedDue >= todayDate) return false;
        }
      }
      if (viewTimeframe === 'milestones') {
        if (!t.isKeyMilestone && t.priority !== 'High') return false;
      }
      return true;
    });
  }, [processedTasks, searchQuery, filterSprint, filterPhase, filterStatus, viewTimeframe, todayDate]);

  // Sprints sorted in phase hierarchy order
  const sortedSprints = useMemo(() => sortSprintsByPhaseHierarchy(sprints || []), [sprints]);

  // Project milestones / Sprints summary
  const sprintMilestones = useMemo(() => {
    if (sortedSprints && sortedSprints.length > 0) {
      return sortedSprints.map((sp, idx) => {
        const sprintTasks = processedTasks.filter(t => String(t.sprintId) === String(sp.id));
        const doneTasks = sprintTasks.filter(t => t.isDone).length;
        const total = sprintTasks.length;
        const pct = total > 0 ? Math.round((doneTasks / total) * 100) : 0;
        return {
          id: sp.id || `sp-${idx}`,
          number: idx + 1,
          title: sp.name ? `${sp.code ? sp.code + ': ' : ''}${sp.name}` : `Sprint ${idx + 1}`,
          phase: sp.phase || 'Execution',
          progress: pct,
          totalTasks: total,
          doneTasks,
          window: `${formatShortDate(sp.startDate)} – ${formatShortDate(sp.endDate)}`,
          dueDate: sp.endDate ? formatOrdinalDate(sp.endDate, false) : '—',
          isSignedOff: pct === 100
        };
      });
    }

    return processedTasks.slice(0, 5).map((t, idx) => ({
      id: t.id || `m-${idx}`,
      number: idx + 1,
      title: t.name,
      phase: t.sprintPhase || 'Execution',
      progress: t.progress,
      totalTasks: 1,
      doneTasks: t.isDone ? 1 : 0,
      window: `${formatShortDate(t.parsedStart)} – ${formatShortDate(t.parsedDue)}`,
      dueDate: formatOrdinalDate(t.parsedDue, false),
      isSignedOff: t.isDone || t.progress >= 95
    }));
  }, [sortedSprints, processedTasks]);

  const onScheduleMilestonesCount = useMemo(() => {
    const onSchedule = sprintMilestones.filter(m => m.progress >= 50 || m.isSignedOff).length;
    return `${onSchedule} of ${sprintMilestones.length} milestones on schedule`;
  }, [sprintMilestones]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-[96vw] xl:max-w-7xl max-h-[95vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">

        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-white shrink-0 print:border-b-2">
          {/* Left: Icon, Title, Sprint Badge, Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4h18M3 10h12M3 16h16M3 20h8" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Detailed Gantt Chart & Roadmap
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  {sprintTitle}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {displayedTasks.length} {displayedTasks.length === 1 ? 'Task' : 'Tasks'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  Objective:{' '}
                  <strong className="text-slate-700 font-medium">
                    {project?.description || (project?.clientName ? `Deliver ${project.name} for ${project.clientName}` : 'Sprint Timeline Execution')}
                  </strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Target Delivery:{' '}
                  <strong className="text-slate-700 font-medium">{targetDateFormatted}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Right: View mode pills, Print button, Close 'X' */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 print:hidden">
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
                Days (1–{daysInActiveMonth})
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
                Weeks View
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
                Milestones Only
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
        <div className="overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-[#F8FAFC]">

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 1: SPRINT MILESTONES & PHASES                                      */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  {sprints && sprints.length > 0 ? 'Sprint Milestones & Execution Gates' : 'Project Milestones'}
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
                    <th className="py-2 px-3">Sprint / Milestone</th>
                    <th className="py-2 px-3 w-28">Phase</th>
                    <th className="py-2 px-3 w-1/3">Completion Distribution</th>
                    <th className="py-2 px-3 text-center w-36">Window / Due</th>
                    <th className="py-2 px-3 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sprintMilestones.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 text-center text-slate-400 font-bold">
                        {m.number}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold truncate max-w-[260px]">
                        {m.title}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 truncate max-w-[130px]">
                          {m.phase}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                m.progress === 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                  : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                              }`}
                              style={{ width: `${Math.max(4, m.progress)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-12 text-right shrink-0">
                            {m.progress}% {m.totalTasks > 1 ? `(${m.doneTasks}/${m.totalTasks})` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold text-[11px]">
                        {m.window || m.dueDate}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {m.isSignedOff ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200" title="Completed">
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
          {/* CARD 2: INTERACTIVE GANTT TIMELINE MATRIX                               */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
            
            {/* Toolbar: Month Navigation & Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Timeline Grid • {activeMonthInfo.label}
                </h2>

                {/* Month Navigator */}
                <div className="flex items-center gap-1 ml-2 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer"
                    title="Previous Month"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <select
                    value={activeMonthInfo.key}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer px-1 py-0.5"
                  >
                    {availableMonths.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.count} items)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer"
                    title="Next Month"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Jump to Today button */}
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    isCurrentMonth
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Jump timeline to current month"
                >
                  ● Today
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 sm:w-40 bg-slate-50/50"
                />

                {/* Sprint Filter */}
                {sortedSprints && sortedSprints.length > 0 && (
                  <select
                    value={filterSprint}
                    onChange={(e) => setFilterSprint(e.target.value)}
                    className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Sprints</option>
                    {sortedSprints.map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.code}</option>
                    ))}
                  </select>
                )}

                {/* Phase Filter */}
                {availablePhases.length > 0 && (
                  <select
                    value={filterPhase}
                    onChange={(e) => setFilterPhase(e.target.value)}
                    className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Phases</option>
                    {availablePhases.map(ph => (
                      <option key={ph} value={ph}>{ph}</option>
                    ))}
                  </select>
                )}

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="In progress">In Progress</option>
                  <option value="Done">Completed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Not started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between gap-3 text-xs text-slate-600 font-semibold flex-wrap">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600 shrink-0" />
                  <span>Completed (Emerald)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-sky-500 shrink-0" />
                  <span>In Progress (Sky)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500 shrink-0" />
                  <span>Late / Overdue (Red)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300 border border-slate-400 shrink-0" />
                  <span>Planned / Remaining (Grey)</span>
                </div>
              </div>

              {isCurrentMonth && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Red line marks Today ({formatShortDate(todayDate)})</span>
                </div>
              )}
            </div>

            {/* Gantt Grid Matrix */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-slate-50/40 relative shadow-2xs">
              <div style={{ minWidth: `${Math.max(920, 260 + daysInActiveMonth * 26)}px` }}>
                
                {/* 1. Optional Weeks Sub-Header */}
                {viewTimeframe === 'weeks' && (
                  <div
                    className="grid border-b border-slate-200/90 bg-indigo-50/60 text-[10px] font-bold text-indigo-900 select-none divide-x divide-indigo-100"
                    style={{ gridTemplateColumns: `260px repeat(${daysInActiveMonth}, minmax(0, 1fr))` }}
                  >
                    <div className="py-1 px-3 uppercase tracking-wider font-extrabold text-indigo-900">
                      Weeks Timeline
                    </div>
                    {Array.from({ length: Math.ceil(daysInActiveMonth / 7) }, (_, wIdx) => {
                      const startDay = wIdx * 7 + 1;
                      const endDay = Math.min((wIdx + 1) * 7, daysInActiveMonth);
                      const spanDays = endDay - startDay + 1;
                      return (
                        <div
                          key={wIdx}
                          className="py-1 text-center font-bold text-indigo-900 truncate px-1"
                          style={{ gridColumn: `span ${spanDays} / span ${spanDays}` }}
                        >
                          Week {wIdx + 1} ({activeMonthInfo.monthName?.slice(0, 3)} {startDay}–{endDay})
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Header Row: Task Column + Day Columns (1..daysInActiveMonth) */}
                <div
                  className="grid border-b border-slate-200 bg-slate-100/90 text-[10px] font-bold text-slate-600 select-none"
                  style={{ gridTemplateColumns: `260px repeat(${daysInActiveMonth}, minmax(0, 1fr))` }}
                >
                  <div className="py-2.5 px-3 border-r border-slate-200 uppercase tracking-wider font-bold flex items-center justify-between">
                    <span>Task ({displayedTasks.length})</span>
                    <span className="text-[9px] text-slate-400 font-normal">Phase & Assignee</span>
                  </div>
                  {Array.from({ length: daysInActiveMonth }, (_, i) => i + 1).map((day) => {
                    const colDate = new Date(activeYear, activeMonthIndex, day);
                    const isWeekend = colDate.getDay() === 0 || colDate.getDay() === 6;
                    const isTodayCol = isCurrentMonth && day === todayDay;
                    return (
                      <div
                        key={day}
                        className={`py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                          isTodayCol
                            ? 'bg-rose-500 text-white font-black shadow-xs ring-1 ring-rose-400'
                            : isWeekend
                            ? 'bg-slate-200/50 text-slate-400 font-medium'
                            : 'hover:bg-slate-200/40'
                        }`}
                        title={`${formatShortDate(colDate)}${isTodayCol ? ' (Today)' : ''}`}
                      >
                        <span>{day}</span>
                        {isTodayCol && <span className="block text-[7px] leading-tight font-extrabold uppercase">Today</span>}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Task Rows */}
                {displayedTasks.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 space-y-2 bg-white">
                    <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                    <p className="text-sm font-semibold text-slate-700">No tasks match the selected timeline or filters.</p>
                    <p className="text-xs text-slate-400">Try choosing another month or resetting your sprint/phase filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white relative">

                    {/* Today Vertical Guide Line */}
                    {isCurrentMonth && todayLeftPercent !== null && (
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
                        style={{ left: `calc(260px + (100% - 260px) * ${todayLeftPercent / 100})` }}
                      >
                        <div className="w-[2px] h-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                      </div>
                    )}

                    {displayedTasks.map((task) => {
                      return (
                        <div
                          key={task.id}
                          className="grid items-center min-h-[46px] hover:bg-slate-50/80 transition group relative"
                          style={{ gridTemplateColumns: `260px repeat(${daysInActiveMonth}, minmax(0, 1fr))` }}
                        >
                          {/* Left Task Title Column */}
                          <div
                            className="px-3 py-2 border-r border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between gap-2 overflow-hidden"
                            title={`${task.name} (${task.status || 'Active'})`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 truncate">
                                {task.level > 0 && (
                                  <span className="text-blue-500 font-bold select-none text-xs">
                                    {'↳'.repeat(Math.min(task.level, 3))}
                                  </span>
                                )}
                                <span className="font-mono text-[10px] font-bold text-slate-400 shrink-0">
                                  {task.taskIdCode}
                                </span>
                                <span
                                  onClick={() => onEditTask && onEditTask(task)}
                                  className={`truncate font-semibold ${
                                    task.isDone ? 'line-through text-slate-400' : 'text-slate-800'
                                  } ${onEditTask ? 'hover:text-blue-600 hover:underline cursor-pointer' : ''}`}
                                >
                                  {task.name}
                                </span>
                              </div>
                              {(task.sprintPhase || task.sprintName) && (
                                <div className="flex items-center gap-1 mt-0.5 truncate">
                                  <span className="inline-block text-[9px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200/80 truncate max-w-[140px]">
                                    {task.sprintPhase || task.sprintName}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Assignee Avatar */}
                            {task.assignees && task.assignees.length > 0 && (
                              <div className="shrink-0" title={task.assignees.map(a => a.fullName).join(', ')}>
                                <Avatar
                                  src={task.assignees[0].avatar}
                                  alt={task.assignees[0].fullName}
                                  className="w-5 h-5 rounded-full ring-1 ring-slate-200"
                                />
                              </div>
                            )}
                          </div>

                          {/* Gantt Bar spanning day columns */}
                          <div
                            className="relative h-full flex items-center px-1"
                            style={{ gridColumn: `span ${daysInActiveMonth} / span ${daysInActiveMonth}` }}
                          >
                            {/* Background day column lines */}
                            <div
                              className="absolute inset-0 grid pointer-events-none"
                              style={{ gridTemplateColumns: `repeat(${daysInActiveMonth}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: daysInActiveMonth }).map((_, i) => (
                                <div
                                  key={i}
                                  className="border-r border-slate-100 last:border-r-0 h-full"
                                />
                              ))}
                            </div>

                            {/* Multi-segment Timeline Bar */}
                            {task.activeSegments && task.activeSegments.length > 0 ? (
                              task.activeSegments.map((seg, sIdx) => {
                                const isFirst = sIdx === 0;
                                const isLast = sIdx === task.activeSegments.length - 1;
                                const single = task.activeSegments.length === 1;

                                const roundClass = single
                                  ? 'rounded-md'
                                  : isFirst
                                  ? 'rounded-l-md'
                                  : isLast
                                  ? 'rounded-r-md'
                                  : 'rounded-none';

                                let colorClass = '';
                                let text = '';
                                if (seg.type === 'completed-emerald') {
                                  colorClass = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs';
                                  text = `✓ ${formatShortDate(task.parsedCompleted || task.parsedDue)}`;
                                } else if (seg.type === 'inprogress-sky') {
                                  colorClass = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs';
                                  text = `⚡ Due ${formatShortDate(task.parsedDue)}`;
                                } else if (seg.type === 'late-red') {
                                  colorClass = 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs';
                                  text = `Late (Done ${formatShortDate(task.parsedCompleted)})`;
                                } else if (seg.type === 'overdue-amber') {
                                  colorClass = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs';
                                  text = `Overdue (${formatShortDate(task.parsedDue)})`;
                                } else if (seg.type === 'remaining-grey') {
                                  colorClass = 'bg-slate-300 text-slate-700 border border-slate-400/40 shadow-2xs';
                                  text = `Due ${formatShortDate(task.parsedDue)}`;
                                } else {
                                  colorClass = 'bg-slate-400/80 text-white shadow-2xs';
                                  text = `${formatShortDate(seg.sDate)}–${formatShortDate(seg.eDate)}`;
                                }

                                const tooltip = `${task.name}\nStatus: ${task.status}\nAssignee: ${task.assignees?.map(a => a.fullName).join(', ') || 'Unassigned'}\nStart: ${formatShortDate(task.parsedStart)}\nDue: ${formatShortDate(task.parsedDue)}${task.completedDate ? `\nCompleted: ${formatShortDate(task.completedDate)}` : ''}\nPhase: ${task.sprintPhase || 'N/A'}`;

                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      left: `${seg.left}%`,
                                      width: `${seg.width}%`
                                    }}
                                    onClick={() => onEditTask && onEditTask(task)}
                                    className={`absolute top-1/2 -translate-y-1/2 h-7 px-2 flex items-center justify-between text-[10px] font-bold transition-all z-10 ${roundClass} ${colorClass} ${onEditTask ? 'cursor-pointer hover:brightness-110' : ''}`}
                                    title={tooltip}
                                  >
                                    <span className="truncate flex items-center gap-1 font-bold">
                                      {seg.type === 'completed-emerald' && <span>✓</span>}
                                      {seg.type === 'late-red' && <span>⚠</span>}
                                      <span className="truncate">{text}</span>
                                    </span>
                                    {seg.spanDays >= 4 && (
                                      <span className="text-[9px] opacity-80 shrink-0 font-medium ml-1">
                                        {seg.spanDays}d
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            ) : task.isPriorMonth ? (
                              <div className="relative z-10 flex items-center h-full px-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  <span>Completed prior month ({formatShortDate(task.parsedCompleted || task.parsedDue)})</span>
                                </span>
                              </div>
                            ) : task.isFutureMonth ? (
                              <div className="relative z-10 flex items-center h-full px-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  <span>Scheduled next month ({formatShortDate(task.parsedStart)})</span>
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* CARD 3: PROJECT TASKS BREAKDOWN TABLE                                   */}
          {/* ----------------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Project Tasks Breakdown ({displayedTasks.length} Items)
                </h2>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-3 w-20">ID</th>
                    <th className="py-2 px-3">Task Name</th>
                    <th className="py-2 px-3 w-28">Phase</th>
                    <th className="py-2 px-3 text-center w-28">Start</th>
                    <th className="py-2 px-3 text-center w-28">Due Date</th>
                    <th className="py-2 px-3 text-center w-32">Completed</th>
                    <th className="py-2 px-3 text-center w-24">Priority</th>
                    <th className="py-2 px-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedTasks.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-2 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-500">
                        {t.taskIdCode}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-bold">
                        <div className="flex items-center gap-1.5">
                          {t.level > 0 && (
                            <span className="text-blue-500 font-bold select-none text-xs">
                              {'↳'.repeat(Math.min(t.level, 3))}
                            </span>
                          )}
                          <span
                            onClick={() => onEditTask && onEditTask(t)}
                            className={onEditTask ? 'hover:text-blue-600 hover:underline cursor-pointer' : ''}
                          >
                            {t.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {t.sprintPhase ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                            {t.sprintPhase}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {formatOrdinalDate(t.parsedStart, true)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                        {formatOrdinalDate(t.parsedDue, true)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {t.isDone ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ {formatOrdinalDate(t.parsedCompleted || t.parsedStart, true)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
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
                          {t.priority || 'Med'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {t.isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span>✓</span> Completed
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Notes & Sprint Guidelines
                </h2>
              </div>
              <button
                type="button"
                onClick={() => isEditingNotes ? handleSaveNotes() : setIsEditingNotes(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                {isEditingNotes ? 'Done Editing' : 'Edit Guidelines'}
              </button>
            </div>

            {isEditingNotes ? (
              <textarea
                value={activeNotes}
                onChange={(e) => setActiveNotes(e.target.value)}
                rows={3}
                className="w-full text-xs text-slate-700 p-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
            <span>Interactive Gantt Roadmap • Real-time synchronization active</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition active:scale-98 cursor-pointer"
            >
              Close Gantt View
            </button>
            {onAddTask && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddTask();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm hover:shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <span>+</span> Add Timeline Task
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GanttRoadmapModal;
