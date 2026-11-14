/**
 * planCalcs.js
 *
 * Pure calculation module for Project Sprint Plans & Stage Gates.
 * Replicates Excel formulas without React or I/O.
 * All date comparisons operate on date-only strings (YYYY-MM-DD).
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getLocalDateString(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates whole days difference between two date strings: dateA - dateB.
 * Both dates must be in YYYY-MM-DD format.
 */
export function getDaysDiff(dateA, dateB) {
  if (!dateA || !dateB) return 0;
  const [yA, mA, dA] = String(dateA).slice(0, 10).split('-').map(Number);
  const [yB, mB, dB] = String(dateB).slice(0, 10).split('-').map(Number);
  if (!yA || !mA || !dA || !yB || !mB || !dB) return 0;

  const msA = Date.UTC(yA, mA - 1, dA);
  const msB = Date.UTC(yB, mB - 1, dB);
  return Math.round((msA - msB) / (86400 * 1000));
}

/**
 * Task Schedule Status:
 * if pct >= 100 -> actual date empty ? "Complete – date missing" : "Completed"
 * else if today > planned_finish -> "Overdue"
 * else if (planned_finish − today) <= 7 days -> "Due soon"
 * else -> "On track"
 */
export function calculateTaskScheduleStatus(task = {}, today = getLocalDateString()) {
  const pct = Number(task.percentComplete ?? task.percent_complete ?? 0);
  const actualDate = String(task.actualCompletionDate ?? task.actual_completion_date ?? '').trim();
  const plannedFinish = String(task.plannedFinish ?? task.planned_finish ?? '').trim();

  if (pct >= 100) {
    return actualDate ? 'Completed' : 'Complete – date missing';
  }

  if (!plannedFinish) {
    return 'On track';
  }

  const cleanToday = String(today).slice(0, 10);
  const cleanFinish = plannedFinish.slice(0, 10);

  if (cleanToday > cleanFinish) {
    return 'Overdue';
  }

  const daysRemaining = getDaysDiff(cleanFinish, cleanToday);
  if (daysRemaining <= 7) {
    return 'Due soon';
  }

  return 'On track';
}

/**
 * Task Risk Flag:
 * pct >= 100 -> none
 * Overdue -> HIGH
 * Due soon -> MEDIUM
 * else -> LOW
 */
export function calculateTaskRiskFlag(task = {}, today = getLocalDateString()) {
  const pct = Number(task.percentComplete ?? task.percent_complete ?? 0);
  if (pct >= 100) {
    return 'none';
  }

  const status = calculateTaskScheduleStatus(task, today);
  if (status === 'Overdue') {
    return 'HIGH';
  }
  if (status === 'Due soon') {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Days Variance:
 * if pct < 100 -> max(0, today − planned_finish) in days
 * if complete -> (actual_completion_date − planned_finish), 0 if no date
 */
export function calculateDaysVariance(task = {}, today = getLocalDateString()) {
  const pct = Number(task.percentComplete ?? task.percent_complete ?? 0);
  const plannedFinish = String(task.plannedFinish ?? task.planned_finish ?? '').trim();
  const actualDate = String(task.actualCompletionDate ?? task.actual_completion_date ?? '').trim();

  if (!plannedFinish) return 0;

  const cleanToday = String(today).slice(0, 10);
  const cleanFinish = plannedFinish.slice(0, 10);

  if (pct < 100) {
    const diff = getDaysDiff(cleanToday, cleanFinish);
    return Math.max(0, diff);
  }

  if (!actualDate) {
    return 0;
  }

  const cleanActual = actualDate.slice(0, 10);
  return getDaysDiff(cleanActual, cleanFinish);
}

/**
 * Weighted Completion:
 * Σ(weight × pct) / Σ(weight), 0 when Σweight = 0
 * Returns a number between 0 and 100, rounded to 1 decimal place.
 */
export function calculateWeightedCompletion(tasks = []) {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;

  let totalWeight = 0;
  let weightedPctSum = 0;

  for (const t of tasks) {
    const w = Math.max(0, Number(t.weight ?? 1));
    const isDone = String(t.status || '').toLowerCase() === 'done';
    const rawPct = t.percentComplete ?? t.percent_complete;
    const pct = rawPct !== undefined && rawPct !== null && rawPct !== ''
      ? Math.min(100, Math.max(0, Number(rawPct)))
      : (isDone ? 100 : 0);
    totalWeight += w;
    weightedPctSum += w * pct;
  }

  if (totalWeight <= 0) return 0;
  return Math.round((weightedPctSum / totalWeight) * 10) / 10;
}

/**
 * Gate Status:
 * actual_approval_date set -> "Approved"
 * else if today > target_date -> "Date passed – approval unconfirmed"
 * else if (target − today) <= 7 -> "Due soon"
 * else -> "Not yet approved"
 */
export function calculateGateStatus(gate = {}, today = getLocalDateString()) {
  const actualApproval = String(gate.actualApprovalDate ?? gate.actual_approval_date ?? '').trim();
  if (actualApproval) {
    return 'Approved';
  }

  const targetDate = String(gate.targetDate ?? gate.target_date ?? '').trim();
  if (!targetDate) {
    return 'Not yet approved';
  }

  const cleanToday = String(today).slice(0, 10);
  const cleanTarget = targetDate.slice(0, 10);

  if (cleanToday > cleanTarget) {
    return 'Date passed – approval unconfirmed';
  }

  const daysUntil = getDaysDiff(cleanTarget, cleanToday);
  if (daysUntil <= 7) {
    return 'Due soon';
  }

  return 'Not yet approved';
}

/**
 * Dashboard Numbers & Sprint Summaries:
 * - overall completion
 * - tasks overdue
 * - high-risk tasks
 * - gates approved
 * - gates past target
 * - planned go-live (target date of the gate whose name contains "Go-Live", else the last gate)
 * - per-sprint rows (task count, weighted completion, overdue, due soon, high risk)
 */
export function calculateDashboardMetrics(plan = {}, today = getLocalDateString()) {
  const { sprints = [], tasks = [], gates = [] } = plan;

  const overallCompletion = calculateWeightedCompletion(tasks);

  let tasksOverdue = 0;
  let highRiskTasks = 0;

  for (const t of tasks) {
    const sched = calculateTaskScheduleStatus(t, today);
    if (sched === 'Overdue') {
      tasksOverdue += 1;
    }
    const risk = calculateTaskRiskFlag(t, today);
    if (risk === 'HIGH') {
      highRiskTasks += 1;
    }
  }

  let gatesApproved = 0;
  let gatesPastTarget = 0;

  for (const g of gates) {
    const status = calculateGateStatus(g, today);
    if (status === 'Approved') {
      gatesApproved += 1;
    } else if (status === 'Date passed – approval unconfirmed') {
      gatesPastTarget += 1;
    }
  }

  // Planned Go-Live determination
  let plannedGoLive = '';
  const goLiveGate = gates.find(g => (g.name || '').toLowerCase().includes('go-live'));
  if (goLiveGate && goLiveGate.targetDate) {
    plannedGoLive = goLiveGate.targetDate;
  } else if (gates.length > 0) {
    const sorted = [...gates].sort((a, b) => (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)));
    plannedGoLive = sorted[sorted.length - 1]?.targetDate || '';
  }

  // Per-sprint breakdown
  const sprintProgress = sprints.map(s => {
    const sId = String(s.id);
    const sprintTasks = tasks.filter(t => String(t.sprintId) === sId);
    let overdueCount = 0;
    let dueSoonCount = 0;
    let highRiskCount = 0;

    for (const st of sprintTasks) {
      const status = calculateTaskScheduleStatus(st, today);
      if (status === 'Overdue') overdueCount += 1;
      if (status === 'Due soon') dueSoonCount += 1;

      const risk = calculateTaskRiskFlag(st, today);
      if (risk === 'HIGH') highRiskCount += 1;
    }

    return {
      sprintId: s.id,
      code: s.code,
      name: s.name || '',
      phase: s.phase || '',
      startDate: s.startDate || '',
      endDate: s.endDate || '',
      taskCount: sprintTasks.length,
      weightedCompletion: calculateWeightedCompletion(sprintTasks),
      overdueCount,
      dueSoonCount,
      highRiskCount
    };
  });

  return {
    overallCompletion,
    tasksOverdue,
    highRiskTasks,
    gatesApproved,
    gatesPastTarget,
    plannedGoLive,
    sprintProgress
  };
}

/**
 * Standard project phases matching the project delivery methodology
 */
export const PROJECT_PHASES = [
  'Prepare',
  'Explore',
  'Realize – Build',
  'Realize – Test & Train',
  'Deploy',
  'Run'
];

/**
 * Default Gate code to Phase mapping
 */
export const GATE_CODE_TO_PHASE = {
  'SG-00': 'Prepare',
  'SG-01': 'Explore',
  'SG-02': 'Realize – Build',
  'SG-03': 'Realize – Test & Train',
  'SG-04': 'Realize – Test & Train',
  'SG-05': 'Deploy',
  'SG-06': 'Run'
};

/**
 * Normalizes project phase strings by removing excess whitespace and standardizing all Unicode dashes/hyphens
 */
export function normalizePhase(p) {
  if (!p) return '';
  return String(p)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Returns the 0-based hierarchy index of a project/sprint phase.
 * Hierarchy:
 * 0. Prepare
 * 1. Explore
 * 2. Realize – Build
 * 3. Realize – Test & Train
 * 4. Deploy
 * 5. Run
 */
export function getPhaseIndex(phase) {
  if (!phase) return 999;
  const norm = normalizePhase(phase);

  for (let i = 0; i < PROJECT_PHASES.length; i++) {
    if (normalizePhase(PROJECT_PHASES[i]) === norm) {
      return i;
    }
  }

  // Keyword heuristic
  if (norm.includes('prepare') || norm.includes('initiat') || norm.includes('charter')) return 0;
  if (norm.includes('explore') || norm.includes('blueprint') || norm.includes('discovery')) return 1;
  if (norm.includes('test') || norm.includes('train') || norm.includes('sit') || norm.includes('uat') || norm.includes('qa')) return 3;
  if (norm.includes('build') || norm.includes('construct') || norm.includes('realize') || norm.includes('dev')) return 2;
  if (norm.includes('deploy') || norm.includes('go-live') || norm.includes('cutover') || norm.includes('release')) return 4;
  if (norm.includes('run') || norm.includes('hypercare') || norm.includes('transition') || norm.includes('support')) return 5;

  return 999;
}

/**
 * Sorts sprints in the hierarchy of project sprint phases:
 * Prepare -> Explore -> Realize – Build -> Realize – Test & Train -> Deploy -> Run.
 * Within the same phase, sprints are sorted by sortOrder, then sprint number/code, then startDate.
 */
export function sortSprintsByPhaseHierarchy(sprints = []) {
  if (!Array.isArray(sprints) || sprints.length <= 1) return sprints ? [...sprints] : [];

  return [...sprints].sort((a, b) => {
    const pA = getPhaseIndex(a?.phase);
    const pB = getPhaseIndex(b?.phase);

    if (pA !== pB) {
      return pA - pB;
    }

    // Secondary: sortOrder if explicitly provided and distinct
    const orderA = a?.sortOrder !== undefined && a?.sortOrder !== null ? Number(a.sortOrder) : null;
    const orderB = b?.sortOrder !== undefined && b?.sortOrder !== null ? Number(b.sortOrder) : null;
    if (orderA !== null && orderB !== null && orderA !== orderB && !isNaN(orderA) && !isNaN(orderB)) {
      return orderA - orderB;
    }

    // Tertiary: extract sprint number (e.g. "Sprint 01", "02", "Sprint 2", "Sprint 10")
    const extractNum = (s) => {
      if (!s) return null;
      const str = `${s.code || ''} ${s.name || ''}`;
      const match = str.match(/(?:sprint\s*)?(\d+)/i);
      return match ? parseInt(match[1], 10) : null;
    };
    const numA = extractNum(a);
    const numB = extractNum(b);
    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }

    // Quaternary: start date
    if (a?.startDate && b?.startDate && a.startDate !== b.startDate) {
      return String(a.startDate).localeCompare(String(b.startDate));
    }

    // Quinary: code or name alphanumeric
    const codeA = String(a?.code || a?.name || '');
    const codeB = String(b?.code || b?.name || '');
    return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Resolves the project phase for a stage gate.
 */
export function getGatePhase(gate = {}, linkedTasks = [], sprints = []) {
  if (gate.phase && String(gate.phase).trim()) {
    const raw = String(gate.phase).trim();
    const norm = normalizePhase(raw);
    for (const p of PROJECT_PHASES) {
      if (normalizePhase(p) === norm) return p;
    }
    return raw;
  }

  // Check tasks linked to this gate and inspect their sprint's phase
  if (linkedTasks && linkedTasks.length > 0 && sprints && sprints.length > 0) {
    const sprintMap = new Map(sprints.map(s => [String(s.id), s]));
    for (const t of linkedTasks) {
      const sp = sprintMap.get(String(t.sprintId));
      if (sp && sp.phase && String(sp.phase).trim()) {
        const norm = normalizePhase(sp.phase);
        for (const p of PROJECT_PHASES) {
          if (normalizePhase(p) === norm) return p;
        }
        return String(sp.phase).trim();
      }
    }
  }

  // Check standard gate code
  const code = String(gate.code || '').trim().toUpperCase();
  if (GATE_CODE_TO_PHASE[code]) {
    return GATE_CODE_TO_PHASE[code];
  }

  // Keyword heuristic
  const text = `${gate.code || ''} ${gate.name || ''}`.toLowerCase();
  if (text.includes('prepare') || text.includes('initiation') || text.includes('charter')) return 'Prepare';
  if (text.includes('explore') || text.includes('blueprint')) return 'Explore';
  if (text.includes('build') || text.includes('solution design') || text.includes('realize')) return 'Realize – Build';
  if (text.includes('test') || text.includes('train') || text.includes('sit') || text.includes('uat')) return 'Realize – Test & Train';
  if (text.includes('deploy') || text.includes('go-live') || text.includes('cutover')) return 'Deploy';
  if (text.includes('run') || text.includes('hypercare') || text.includes('transition')) return 'Run';

  return 'Explore';
}

/**
 * Theme styling for each Project Phase badge and accent
 */
export function getPhaseTheme(phase) {
  const norm = normalizePhase(phase);
  if (norm === 'prepare') {
    return {
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
      cardBorder: 'border-sky-200',
      bgSubtle: 'bg-sky-50/40',
      accentText: 'text-sky-700'
    };
  }
  if (norm === 'explore') {
    return {
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
      cardBorder: 'border-indigo-200',
      bgSubtle: 'bg-indigo-50/40',
      accentText: 'text-indigo-700'
    };
  }
  if (norm.includes('realize') && norm.includes('build')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      cardBorder: 'border-purple-200',
      bgSubtle: 'bg-purple-50/40',
      accentText: 'text-purple-700'
    };
  }
  if (norm.includes('realize') && (norm.includes('test') || norm.includes('train'))) {
    return {
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      cardBorder: 'border-amber-200',
      bgSubtle: 'bg-amber-50/40',
      accentText: 'text-amber-800'
    };
  }
  if (norm === 'deploy') {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      cardBorder: 'border-emerald-200',
      bgSubtle: 'bg-emerald-50/40',
      accentText: 'text-emerald-700'
    };
  }
  if (norm === 'run' || norm === 'hypercare') {
    return {
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
      cardBorder: 'border-teal-200',
      bgSubtle: 'bg-teal-50/40',
      accentText: 'text-teal-700'
    };
  }
  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    cardBorder: 'border-slate-200',
    bgSubtle: 'bg-slate-50/40',
    accentText: 'text-slate-700'
  };
}

