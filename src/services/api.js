// Client-side API Service for Cloud Sync with Neon PostgreSQL
import {
  directGetBootstrapData,
  directCreateProject,
  directUpdateProject,
  directDeleteProject,
  directCreateTask,
  directUpdateTask,
  directDeleteTask,
  directCreateMeeting,
  directUpdateMeeting,
  directDeleteMeeting,
  directCreateEmployee,
  directUpdateEmployee,
  directUpdatePassword
} from './neonDirect';

const API_BASE = '/api';

/**
 * Determines whether cloud database sync should be enabled.
 * - Localhost / local development: DISABLED (local data stays strictly in browser localStorage).
 * - Deployed on Render/Vercel or production: ENABLED (connects to Neon PostgreSQL database).
 * - Can be manually overridden locally by setting VITE_ENABLE_LOCAL_DB=true in .env if needed.
 */
export function isCloudSyncEnabled() {
  if (typeof window === 'undefined') return false;

  // Manual local opt-in if explicitly requested
  if (import.meta.env.VITE_ENABLE_LOCAL_DB === 'true') {
    return true;
  }

  const hostname = window.location.hostname;
  // Strictly disable cloud database calls when running locally
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '') {
    return false;
  }

  // Active on any deployed domain (e.g. volvitracker.onrender.com, *.vercel.app, custom domains)
  return true;
}

async function request(endpoint, options = {}) {
  if (!isCloudSyncEnabled()) {
    return null;
  }

  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  const res = await fetch(url, config);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(`Endpoint ${endpoint} returned status ${res.status} (${contentType})`);
  }
  return await res.json();
}

// 1. Data Bootstrap
export async function fetchInitialData() {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/data');
  } catch (err) {
    // Seamless fallback to direct Neon PostgreSQL query (e.g. on Render Static Site)
    return await directGetBootstrapData();
  }
}

// 2. Projects
export async function apiCreateProject(project, tasks = []) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ project, tasks })
    });
  } catch {
    return await directCreateProject(project, tasks);
  }
}

export async function apiUpdateProject(id, updates) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch {
    return await directUpdateProject(id, updates);
  }
}

export async function apiDeleteProject(id) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch {
    return await directDeleteProject(id);
  }
}

// 3. Tasks
export async function apiCreateTask(task) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  } catch {
    return await directCreateTask(task);
  }
}

export async function apiUpdateTask(id, updates) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch {
    return await directUpdateTask(id, updates);
  }
}

export async function apiDeleteTask(id) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch {
    return await directDeleteTask(id);
  }
}

// 4. Meetings
export async function apiCreateMeeting(meeting) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meeting)
    });
  } catch {
    return await directCreateMeeting(meeting);
  }
}

export async function apiUpdateMeeting(id, updates) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/meetings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch {
    return await directUpdateMeeting(id, updates);
  }
}

export async function apiDeleteMeeting(id) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/meetings/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch {
    return await directDeleteMeeting(id);
  }
}

// 5. Employees & Auth
export async function apiCreateEmployee(employee) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  } catch {
    return await directCreateEmployee(employee);
  }
}

export async function apiUpdateEmployee(id, updates) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch {
    return await directUpdateEmployee(id, updates);
  }
}

export async function apiUpdatePassword(email, passwordHash) {
  if (!isCloudSyncEnabled()) return null;
  try {
    return await request('/employees/password', {
      method: 'POST',
      body: JSON.stringify({ email, passwordHash })
    });
  } catch {
    return await directUpdatePassword(email, passwordHash);
  }
}
