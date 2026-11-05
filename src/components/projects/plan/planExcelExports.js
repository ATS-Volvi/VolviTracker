import * as XLSX from 'xlsx';
import {
  calculateDaysVariance,
  calculateTaskScheduleStatus,
  calculateTaskRiskFlag,
  calculateGateStatus,
  getLocalDateString
} from './planCalcs';

export const SPRINT_PLAN_HEADERS = [
  'Task ID',
  'Sprint / Wave',
  'Project Phase',
  'Workstream',
  'Task / Deliverable',
  'Planned Start',
  'Planned Finish',
  'Responsible Owner',
  'Dependency / Entry Condition',
  'Related Gate',
  'Weight',
  '% Complete',
  'Actual Completion Date',
  'Days Variance',
  'Schedule Status',
  'Risk Flag',
  'Planning Basis / Notes'
];

export const STAGE_GATES_HEADERS = [
  'Gate ID',
  'Gate Name',
  'Target Date',
  'Approver(s) per Charter / To Confirm',
  'Required Evidence / Entry Checklist',
  'Proposed Exit / Acceptance Criteria',
  '% Complete',
  'Actual Approval Date',
  'Gate Status',
  'Notes / Risk'
];

/**
 * Downloads a blank Excel template matching the required 2-sheet structure.
 */
export function downloadBlankPlanTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Detailed Sprint Plan Sheet
  const sprintRows = [
    ['FMS-365 | Detailed Sprint Plan'],
    ['Baseline dates follow the supplied charter where specified. Task-level breakdown dates within broad sprint windows are proposed planning assumptions.'],
    [],
    SPRINT_PLAN_HEADERS,
    ['T-001', 'Sprint 0', 'Prepare', 'Governance', 'Confirm project charter and objectives', '2026-10-01', '2026-10-07', 'Volvitech PMO', 'Charter initiation', 'SG-00', 1, 0, '', '', '', '', 'Charter phase window'],
    ['T-002', 'Sprint 0', 'Prepare', 'Environment', 'Confirm DEV/QA access prerequisites', '2026-10-01', '2026-10-14', 'Volvitech Tech Lead', 'Access request', 'SG-00', 1, 0, '', '', '', '', 'Infrastructure setup']
  ];
  const wsSprints = XLSX.utils.aoa_to_sheet(sprintRows);
  XLSX.utils.book_append_sheet(wb, wsSprints, 'Detailed Sprint Plan');

  // 2. Stage Gates Sheet
  const gateRows = [
    ['FMS-365 | Stage Gate Register'],
    ['Use this sheet to record gate readiness and formal decisions. % Complete and Actual Approval Date are editable.'],
    [],
    STAGE_GATES_HEADERS,
    ['SG-00', 'Project Initiation Gate', '2026-10-14', 'Sponsor + Program Director', 'Signed charter; agreed scope; governance RACI; SAP DEV access', 'Project initiation formally approved.', 0, '', '', 'Verify actual status before proceeding'],
    ['SG-01', 'Business Blueprint Approval Gate', '2026-11-15', 'Project Manager + Business Owners', 'Approved blueprint for all modules; FSD/RTM; WRICEF register', 'Business owners accept requirements.', 0, '', '', 'Require review evidence']
  ];
  const wsGates = XLSX.utils.aoa_to_sheet(gateRows);
  XLSX.utils.book_append_sheet(wb, wsGates, 'Stage Gates');

  XLSX.writeFile(wb, 'Project_Plan_Template.xlsx');
}

/**
 * Exports the active project plan to an Excel (.xlsx) file.
 */
export function exportProjectPlanToExcel(projectName, planData = {}) {
  const { sprints = [], tasks = [], gates = [] } = planData;
  const today = getLocalDateString();
  const wb = XLSX.utils.book_new();

  const sprintMap = new Map(sprints.map(s => [String(s.id), s]));
  const gateMap = new Map(gates.map(g => [String(g.id), g]));

  // 1. Detailed Sprint Plan Sheet
  const sprintAoa = [
    [`${projectName || 'Project'} | Detailed Sprint Plan`],
    ['Exported from VolviTracker. Statuses and variances recalculated on export.'],
    [],
    SPRINT_PLAN_HEADERS
  ];

  for (const t of tasks) {
    const sprint = sprintMap.get(String(t.sprintId));
    const gate = t.gateId ? gateMap.get(String(t.gateId)) : null;

    sprintAoa.push([
      t.taskCode || '',
      sprint?.code || '',
      sprint?.phase || '',
      t.workstream || '',
      t.title || '',
      t.plannedStart || '',
      t.plannedFinish || '',
      t.owner || '',
      t.dependency || '',
      gate?.code || '',
      Number(t.weight ?? 1),
      (Number(t.percentComplete ?? 0) / 100),
      t.actualCompletionDate || '',
      calculateDaysVariance(t, today),
      calculateTaskScheduleStatus(t, today),
      calculateTaskRiskFlag(t, today),
      t.planningBasis || ''
    ]);
  }

  const wsTasks = XLSX.utils.aoa_to_sheet(sprintAoa);
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Detailed Sprint Plan');

  // 2. Stage Gates Sheet
  const gateAoa = [
    [`${projectName || 'Project'} | Stage Gate Register`],
    ['Exported from VolviTracker. Statuses recalculated on export.'],
    [],
    STAGE_GATES_HEADERS
  ];

  for (const g of gates) {
    gateAoa.push([
      g.code || '',
      g.name || '',
      g.targetDate || '',
      g.approvers || '',
      g.requiredEvidence || '',
      g.exitCriteria || '',
      (Number(g.percentComplete ?? 0) / 100),
      g.actualApprovalDate || '',
      calculateGateStatus(g, today),
      g.notesRisk || ''
    ]);
  }

  const wsGates = XLSX.utils.aoa_to_sheet(gateAoa);
  XLSX.utils.book_append_sheet(wb, wsGates, 'Stage Gates');

  const safeName = (projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Sprint_Plan_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

