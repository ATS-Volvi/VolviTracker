// Client-side API Service for Cloud Sync with Neon PostgreSQL

const API_BASE = '/api';

/**
 * Determines whether cloud database sync should be enabled.
 * - Localhost / local development: DISABLED (local data stays strictly in browser localStorage).
 * - Deployed on Vercel or production: ENABLED (connects to Neon PostgreSQL database).
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

  // Active on Vercel deployment (e.g. *.vercel.app or custom domain)
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

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Cloud Sync] API request to ${url} failed:`, err.message);
    throw err;
  }
}

// 1. Data Bootstrap
export async function fetchInitialData() {
  if (!isCloudSyncEnabled()) return null;
  return request('/data');
}

// 2. Projects
export async function apiCreateProject(project, tasks = []) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ project, tasks })
  });
}

export async function apiUpdateProject(id, updates) {
  return request(`/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function apiDeleteProject(id) {
  return request(`/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// 3. Tasks
export async function apiCreateTask(task) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
}

export async function apiUpdateTask(id, updates) {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function apiDeleteTask(id) {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// 4. Meetings
export async function apiCreateMeeting(meeting) {
  return request('/meetings', {
    method: 'POST',
    body: JSON.stringify(meeting)
  });
}

export async function apiUpdateMeeting(id, updates) {
  return request(`/meetings/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function apiDeleteMeeting(id) {
  return request(`/meetings/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

// 5. Employees & Auth
export async function apiCreateEmployee(employee) {
  return request('/employees', {
    method: 'POST',
    body: JSON.stringify(employee)
  });
}

export async function apiUpdateEmployee(id, updates) {
  return request(`/employees/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function apiUpdatePassword(email, passwordHash) {
  return request('/employees/password', {
    method: 'POST',
    body: JSON.stringify({ email, passwordHash })
  });
}
