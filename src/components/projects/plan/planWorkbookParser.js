import * as XLSX from 'xlsx';
import { getGatePhase } from './planCalcs';

export function parseExcelDateUtc(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number' && val > 0) {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const day = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const str = String(val).trim();
  if (!str) return '';
  const iso = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
  }
  return str;
}

export function parsePlanWorkbook(fileBuffer) {
  const wb = XLSX.read(fileBuffer, { type: typeof fileBuffer === 'string' ? 'string' : (fileBuffer instanceof ArrayBuffer ? 'array' : 'buffer') });

  // 1. Stage Gates
  const wsGates = wb.Sheets['Stage Gates'];
  if (!wsGates) throw new Error('Sheet "Stage Gates" not found in workbook');
  const gateRows = XLSX.utils.sheet_to_json(wsGates, { header: 1 });

  const parsedGates = [];
  for (let i = 4; i < gateRows.length; i++) {
    const row = gateRows[i];
    if (!row || !row[0]) continue;
    const code = String(row[0]).trim();
    const name = String(row[1] || '').trim();
    const targetDate = parseExcelDateUtc(row[2]);
    const approvers = String(row[3] || '').trim();
    const requiredEvidence = String(row[4] || '').trim();
    const exitCriteria = String(row[5] || '').trim();
    let pct = Number(row[6] ?? 0);
    if (pct > 0 && pct <= 1) pct = Math.round(pct * 100);
    const actualApprovalDate = parseExcelDateUtc(row[7]);
    const notesRisk = String(row[9] || '').trim();

    const checklistItems = requiredEvidence.split(';').map(s => s.trim()).filter(Boolean);

    parsedGates.push({
      code,
      name,
      phase: getGatePhase({ code, name }),
      targetDate,
      approvers,
      requiredEvidence,
      exitCriteria,
      percentComplete: pct,
      actualApprovalDate,
      notesRisk,
      checklistItems,
      sortOrder: parsedGates.length
    });
  }

  // 2. Detailed Sprint Plan
  const wsTasks = wb.Sheets['Detailed Sprint Plan'];
  if (!wsTasks) throw new Error('Sheet "Detailed Sprint Plan" not found in workbook');
  const taskRows = XLSX.utils.sheet_to_json(wsTasks, { header: 1 });

  const parsedSprints = [];
  const sprintMap = new Map();
  const parsedTasks = [];

  for (let i = 4; i < taskRows.length; i++) {
    const row = taskRows[i];
    if (!row || !row[0]) continue;

    const taskCode = String(row[0]).trim();
    const sprintCode = String(row[1] || '').trim();
    const phase = String(row[2] || '').trim();
    const workstream = String(row[3] || '').trim();
    const title = String(row[4] || '').trim();
    const plannedStart = parseExcelDateUtc(row[5]);
    const plannedFinish = parseExcelDateUtc(row[6]);
    const owner = String(row[7] || '').trim();
    let dependency = String(row[8] || '').trim();
    const relatedGateRaw = String(row[9] || '').trim();
    const weight = Math.max(0, Number(row[10] ?? 1));
    let pct = Number(row[11] ?? 0);
    if (pct > 0 && pct <= 1) pct = Math.round(pct * 100);
    const actualCompletionDate = parseExcelDateUtc(row[12]);
    const planningBasis = String(row[16] || '').trim();

    // Distinct sprints in first appearance order
    if (sprintCode && !sprintMap.has(sprintCode.toLowerCase())) {
      const sObj = {
        code: sprintCode,
        name: sprintCode,
        phase: phase,
        startDate: plannedStart,
        endDate: plannedFinish,
        sortOrder: parsedSprints.length
      };
      sprintMap.set(sprintCode.toLowerCase(), sObj);
      parsedSprints.push(sObj);
    } else if (sprintCode) {
      const sObj = sprintMap.get(sprintCode.toLowerCase());
      if (plannedStart && (!sObj.startDate || plannedStart < sObj.startDate)) {
        sObj.startDate = plannedStart;
      }
      if (plannedFinish && (!sObj.endDate || plannedFinish > sObj.endDate)) {
        sObj.endDate = plannedFinish;
      }
    }

    let relatedGate = '';
    if (relatedGateRaw) {
      const gateMatch = relatedGateRaw.match(/^SG-\d+/i);
      if (gateMatch) {
        relatedGate = gateMatch[0].toUpperCase();
      } else {
        dependency = dependency ? `${dependency}; ${relatedGateRaw}` : relatedGateRaw;
      }
    }

    parsedTasks.push({
      taskCode,
      sprintCode,
      workstream,
      title,
      plannedStart,
      plannedFinish,
      owner,
      dependency,
      relatedGate,
      weight,
      percentComplete: pct,
      actualCompletionDate,
      planningBasis,
      sortOrder: parsedTasks.length
    });
  }

  return {
    sprints: parsedSprints,
    gates: parsedGates,
    tasks: parsedTasks
  };
}

