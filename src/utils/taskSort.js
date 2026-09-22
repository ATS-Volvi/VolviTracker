/**
 * Priority rank for task statuses:
 * 1. Incomplete / In progress: stay on top (Rank 0)
 * 2. Upcoming / Not started: come after that (Rank 1)
 * 3. Other statuses / The rest: (Rank 2)
 * 4. Completed / Done: go to the bottom of the list (Rank 3)
 */
export const getTaskStatusRank = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'in progress' || s === 'in-progress' || s === 'active') return 0;
  if (s === 'not started' || s === 'not-started' || s === 'upcoming' || s === 'to do' || s === 'todo') return 1;
  if (s === 'done' || s === 'completed') return 3;
  return 2;
};

/**
 * Sorts tasks so:
 * - Incomplete (In progress) tasks are at the top
 * - Upcoming (Not started) tasks come next
 * - Any other tasks come after that
 * - Completed (Done) tasks are pushed to the bottom
 * Within the same status rank, tasks are sorted by earlier due date first.
 */
export const sortTasks = (tasks = []) => {
  if (!Array.isArray(tasks)) return [];
  return [...tasks].sort((a, b) => {
    const rankA = getTaskStatusRank(a.status);
    const rankB = getTaskStatusRank(b.status);
    if (rankA !== rankB) return rankA - rankB;

    // Secondary: earlier due date first
    if (a.dueDate && b.dueDate) {
      const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (!isNaN(diff) && diff !== 0) return diff;
    } else if (a.dueDate && !b.dueDate) {
      return -1;
    } else if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return 0;
  });
};
