// Client-side API Service for Cloud Sync with Neon PostgreSQL

const API_BASE = '/api';

async function request(endpoint, options = {}) {
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
