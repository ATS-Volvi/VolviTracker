import { getAuthToken, API_BASE } from './api';

// Per-project in-memory cache
const projectPlanCache = new Map();

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {}
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message: errorMsg } }));
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Invalidate the cache for a specific project (or all projects if no ID provided)
 */
export function invalidatePlanCache(projectId) {
  if (projectId) {
    projectPlanCache.delete(String(projectId));
  } else {
    projectPlanCache.clear();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('project_plan_updated', { detail: { projectId } }));
  }
}

/**
 * Fetch project plan data (sprints, tasks, gates, checklistItems)
 */
export async function fetchProjectPlan(projectId, { force = false } = {}) {
  const key = String(projectId);
  if (!force && projectPlanCache.has(key)) {
    return projectPlanCache.get(key);
  }

  const data = await request(`/projects/${encodeURIComponent(projectId)}/plan`, { method: 'GET' });
  const normalized = {
    sprints: data.sprints || [],
    tasks: data.tasks || [],
    gates: data.gates || [],
    checklistItems: data.checklistItems || []
  };

  projectPlanCache.set(key, normalized);
  return normalized;
}

/**
 * Sprints
 */
export async function createSprint(projectId, sprintData) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprints`, {
    method: 'POST',
    body: JSON.stringify(sprintData)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function updateSprint(projectId, sprintId, sprintData) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`, {
    method: 'PUT',
    body: JSON.stringify(sprintData)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function deleteSprint(projectId, sprintId) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`, {
    method: 'DELETE'
  });
  invalidatePlanCache(projectId);
  return result;
}

/**
 * Sprint Tasks
 */
export async function createSprintTask(projectId, taskData) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprint-tasks`, {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function updateSprintTask(projectId, taskId, updates) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprint-tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function deleteSprintTask(projectId, taskId) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/sprint-tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE'
  });
  invalidatePlanCache(projectId);
  return result;
}

/**
 * Stage Gates
 */
export async function createGate(projectId, gateData) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates`, {
    method: 'POST',
    body: JSON.stringify(gateData)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function updateGate(projectId, gateId, gateData) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateId)}`, {
    method: 'PUT',
    body: JSON.stringify(gateData)
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function deleteGate(projectId, gateId) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateId)}`, {
    method: 'DELETE'
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function approveGate(projectId, gateId, { approvalDate, approvedBy, notes = '' }) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approvalDate, approvedBy, notes })
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function revokeGate(projectId, gateId, { reason }) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateId)}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  invalidatePlanCache(projectId);
  return result;
}

export async function toggleGateChecklistItem(projectId, gateId, itemId, isDone) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/gates/${encodeURIComponent(gateId)}/checklist/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: JSON.stringify({ isDone })
  });
  invalidatePlanCache(projectId);
  return result;
}

/**
 * Plan Import (Merge / Replace)
 */
export async function importProjectPlan(projectId, { mode = 'merge', sprints = [], tasks = [], gates = [] }) {
  const result = await request(`/projects/${encodeURIComponent(projectId)}/plan/import`, {
    method: 'POST',
    body: JSON.stringify({ mode, sprints, tasks, gates })
  });
  invalidatePlanCache(projectId);
  return result;
}

