import { describe, it, expect } from 'vitest';
import {
  getDaysDiff,
  calculateTaskScheduleStatus,
  calculateTaskRiskFlag,
  calculateDaysVariance,
  calculateWeightedCompletion,
  calculateGateStatus,
  calculateDashboardMetrics,
  getGatePhase,
  getPhaseTheme
} from './planCalcs';

describe('planCalcs - Task Status, Variance, and Risk Calculations', () => {
  const fixedToday = '2026-10-30';

  it('planned_finish 2026-10-07 at 0% -> Overdue / variance 23 / HIGH', () => {
    const task = {
      plannedStart: '2026-10-01',
      plannedFinish: '2026-10-07',
      percentComplete: 0,
      actualCompletionDate: ''
    };

    expect(calculateTaskScheduleStatus(task, fixedToday)).toBe('Overdue');
    expect(calculateDaysVariance(task, fixedToday)).toBe(23);
    expect(calculateTaskRiskFlag(task, fixedToday)).toBe('HIGH');
  });

  it('finish 2026-11-04 -> Due soon / MEDIUM', () => {
    const task = {
      plannedStart: '2026-10-25',
      plannedFinish: '2026-11-04',
      percentComplete: 10,
      actualCompletionDate: ''
    };

    // 2026-11-04 - 2026-10-30 = 5 days <= 7 days
    expect(calculateTaskScheduleStatus(task, fixedToday)).toBe('Due soon');
    expect(calculateTaskRiskFlag(task, fixedToday)).toBe('MEDIUM');
    expect(calculateDaysVariance(task, fixedToday)).toBe(0);
  });

  it('finish 2026-11-11 -> On track / LOW', () => {
    const task = {
      plannedStart: '2026-10-25',
      plannedFinish: '2026-11-11',
      percentComplete: 0,
      actualCompletionDate: ''
    };

    // 2026-11-11 - 2026-10-30 = 12 days > 7 days
    expect(calculateTaskScheduleStatus(task, fixedToday)).toBe('On track');
    expect(calculateTaskRiskFlag(task, fixedToday)).toBe('LOW');
    expect(calculateDaysVariance(task, fixedToday)).toBe(0);
  });

  it('complete without date -> "Complete – date missing" and variance 0, risk none', () => {
    const task = {
      plannedStart: '2026-10-01',
      plannedFinish: '2026-10-07',
      percentComplete: 100,
      actualCompletionDate: ''
    };

    expect(calculateTaskScheduleStatus(task, fixedToday)).toBe('Complete – date missing');
    expect(calculateDaysVariance(task, fixedToday)).toBe(0);
    expect(calculateTaskRiskFlag(task, fixedToday)).toBe('none');
  });

  it('complete with date -> "Completed", variance = (actual - finish), risk none', () => {
    const taskEarly = {
      plannedStart: '2026-10-01',
      plannedFinish: '2026-10-15',
      percentComplete: 100,
      actualCompletionDate: '2026-10-12'
    };
    expect(calculateTaskScheduleStatus(taskEarly, fixedToday)).toBe('Completed');
    expect(calculateDaysVariance(taskEarly, fixedToday)).toBe(-3);
    expect(calculateTaskRiskFlag(taskEarly, fixedToday)).toBe('none');

    const taskLate = {
      plannedStart: '2026-10-01',
      plannedFinish: '2026-10-15',
      percentComplete: 100,
      actualCompletionDate: '2026-10-22'
    };
    expect(calculateTaskScheduleStatus(taskLate, fixedToday)).toBe('Completed');
    expect(calculateDaysVariance(taskLate, fixedToday)).toBe(7);
  });
});

describe('planCalcs - Weighted Completion Edge Cases', () => {
  it('returns 0 for empty task array', () => {
    expect(calculateWeightedCompletion([])).toBe(0);
    expect(calculateWeightedCompletion(null)).toBe(0);
  });

  it('returns 0 when sum of weights is 0', () => {
    const tasks = [
      { weight: 0, percentComplete: 100 },
      { weight: 0, percentComplete: 50 }
    ];
    expect(calculateWeightedCompletion(tasks)).toBe(0);
  });

  it('calculates weighted completion correctly for single task', () => {
    const tasks = [{ weight: 4, percentComplete: 75 }];
    expect(calculateWeightedCompletion(tasks)).toBe(75);
  });

  it('calculates weighted completion correctly across multiple tasks', () => {
    const tasks = [
      { weight: 1, percentComplete: 100 },
      { weight: 3, percentComplete: 0 }
    ];
    // (1 * 100 + 3 * 0) / (1 + 3) = 100 / 4 = 25
    expect(calculateWeightedCompletion(tasks)).toBe(25);
  });

  it('handles negative or invalid weights gracefully', () => {
    const tasks = [
      { weight: -2, percentComplete: 100 }, // treated as 0
      { weight: 2, percentComplete: 80 }
    ];
    expect(calculateWeightedCompletion(tasks)).toBe(80);
  });
});

describe('planCalcs - Gate Status for Each Branch', () => {
  const fixedToday = '2026-10-30';

  it('actual_approval_date set -> "Approved"', () => {
    const gate = {
      targetDate: '2026-10-14',
      actualApprovalDate: '2026-10-14'
    };
    expect(calculateGateStatus(gate, fixedToday)).toBe('Approved');
  });

  it('today > target_date -> "Date passed – approval unconfirmed"', () => {
    const gate = {
      targetDate: '2026-10-14',
      actualApprovalDate: ''
    };
    expect(calculateGateStatus(gate, fixedToday)).toBe('Date passed – approval unconfirmed');
  });

  it('(target - today) <= 7 days -> "Due soon"', () => {
    const gate = {
      targetDate: '2026-11-04', // 5 days away from 2026-10-30
      actualApprovalDate: ''
    };
    expect(calculateGateStatus(gate, fixedToday)).toBe('Due soon');
  });

  it('(target - today) > 7 days -> "Not yet approved"', () => {
    const gate = {
      targetDate: '2026-12-01',
      actualApprovalDate: ''
    };
    expect(calculateGateStatus(gate, fixedToday)).toBe('Not yet approved');
  });

  it('missing target_date -> "Not yet approved"', () => {
    const gate = {
      targetDate: '',
      actualApprovalDate: ''
    };
    expect(calculateGateStatus(gate, fixedToday)).toBe('Not yet approved');
  });
});

describe('planCalcs - Dashboard Metrics & Sprint Summaries', () => {
  const fixedToday = '2026-10-30';

  it('calculates dashboard rollup counts and planned go-live', () => {
    const plan = {
      sprints: [
        { id: 's0', code: 'Sprint 0', name: 'Foundation' }
      ],
      gates: [
        { id: 'g0', name: 'SG-00 Project Initiation Gate', targetDate: '2026-10-14', actualApprovalDate: '2026-10-14' },
        { id: 'g1', name: 'SG-01 Blueprint', targetDate: '2026-10-20', actualApprovalDate: '' }, // passed target
        { id: 'g5', name: 'SG-05 Go-Live Approval Gate', targetDate: '2027-03-31', actualApprovalDate: '' }
      ],
      tasks: [
        { sprintId: 's0', plannedFinish: '2026-10-07', percentComplete: 0, weight: 1 }, // Overdue, HIGH
        { sprintId: 's0', plannedFinish: '2026-11-04', percentComplete: 50, weight: 1 }, // Due soon, MEDIUM
        { sprintId: 's0', plannedFinish: '2026-11-20', percentComplete: 100, actualCompletionDate: '2026-11-19', weight: 2 } // Completed
      ]
    };

    const metrics = calculateDashboardMetrics(plan, fixedToday);

    // Weights: (1*0 + 1*50 + 2*100) / 4 = 250 / 4 = 62.5%
    expect(metrics.overallCompletion).toBe(62.5);
    expect(metrics.tasksOverdue).toBe(1);
    expect(metrics.highRiskTasks).toBe(1);
    expect(metrics.gatesApproved).toBe(1);
    expect(metrics.gatesPastTarget).toBe(1);
    expect(metrics.plannedGoLive).toBe('2027-03-31');

    expect(metrics.sprintProgress).toHaveLength(1);
    expect(metrics.sprintProgress[0].taskCount).toBe(3);
    expect(metrics.sprintProgress[0].weightedCompletion).toBe(62.5);
    expect(metrics.sprintProgress[0].overdueCount).toBe(1);
    expect(metrics.sprintProgress[0].dueSoonCount).toBe(1);
  });
});

describe('planCalcs - Gate Phase and Sprint Phase Resolution', () => {
  it('resolves explicit gate phase if specified', () => {
    expect(getGatePhase({ code: 'SG-99', name: 'Custom Gate', phase: 'Realize – Build' })).toBe('Realize – Build');
  });

  it('resolves phase from linked tasks and sprints', () => {
    const sprints = [
      { id: 'sp1', code: 'Sprint 1', phase: 'Explore' }
    ];
    const linkedTasks = [
      { id: 't1', sprintId: 'sp1', gateId: 'g1' }
    ];
    expect(getGatePhase({ id: 'g1', code: 'CUSTOM-01', name: 'Workstream Gate' }, linkedTasks, sprints)).toBe('Explore');
  });

  it('maps standard gate codes (SG-00 to SG-06) to appropriate project phases', () => {
    expect(getGatePhase({ code: 'SG-00', name: 'Project Initiation Gate' })).toBe('Prepare');
    expect(getGatePhase({ code: 'SG-01', name: 'Business Blueprint Approval Gate' })).toBe('Explore');
    expect(getGatePhase({ code: 'SG-02', name: 'Solution Design Approval Gate' })).toBe('Realize – Build');
    expect(getGatePhase({ code: 'SG-03', name: 'SIT Completion Gate' })).toBe('Realize – Test & Train');
    expect(getGatePhase({ code: 'SG-04', name: 'UAT & Go-Live Readiness Gate' })).toBe('Realize – Test & Train');
    expect(getGatePhase({ code: 'SG-05', name: 'Go-Live Approval Gate' })).toBe('Deploy');
    expect(getGatePhase({ code: 'SG-06', name: 'Hypercare Exit' })).toBe('Run');
  });

  it('returns appropriate theme styling classes for phases', () => {
    const exploreTheme = getPhaseTheme('Explore');
    expect(exploreTheme.badge).toContain('indigo');
    const prepareTheme = getPhaseTheme('Prepare');
    expect(prepareTheme.badge).toContain('sky');
  });
});

