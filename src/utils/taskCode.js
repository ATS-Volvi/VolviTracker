/**
 * Utility to format task codes consistently across Task List, Sprint Plan, and Gantt views.
 * Standardizes prefixes (e.g. T-001 -> TSK-01, TSK-1 -> TSK-01).
 *
 * @param {Object} task - The task object
 * @param {number} [fallbackIndex] - Optional 0-based index if no task code is assigned yet
 * @returns {string} Formatted task code (e.g. 'TSK-01')
 */
export function formatTaskCode(task, fallbackIndex) {
  if (!task) return '';
  const raw = task.taskCode || task.code || task.task_code;
  if (raw && typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    // Normalize TSK-XX or T-XX to TSK-XX
    const match = trimmed.match(/^(?:TSK|T)[-_]?(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      return `TSK-${String(num).padStart(2, '0')}`;
    }
    return trimmed;
  }

  // If task has an ID that looks like tsk_01 or similar
  if (task.id) {
    const idMatch = String(task.id).match(/^(?:tsk|stk|t)[-_]?(\d+)/i);
    if (idMatch) {
      const num = parseInt(idMatch[1], 10);
      return `TSK-${String(num).padStart(2, '0')}`;
    }
  }

  if (fallbackIndex !== undefined && fallbackIndex !== null) {
    return `TSK-${String(fallbackIndex + 1).padStart(2, '0')}`;
  }

  return '';
}

