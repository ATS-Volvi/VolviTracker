// Client-side API Service for Cloud Sync with Neon PostgreSQL via Server Endpoints
const API_BASE = '/api';

/**
 * Retrieves the active session authentication token from browser storage.
 */
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('volvitech_auth_session') || sessionStorage.getItem('volvitech_auth_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.token || null;
    }
  } catch {}
  return null;
}

/**
 * Determines whether cloud database sync should be enabled.
 */
export function isCloudSyncEnabled() {
  return typeof window !== 'undefined';
}

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

  const res = await fetch(url, config);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    let errBody = null;
    try {
      errBody = await res.json();
    } catch {}
    const message = errBody?.error || errBody?.message || `Endpoint ${endpoint} returned status ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return await res.json();
}

// -----------------------------------------------------------------------------
// Auth Endpoints
// -----------------------------------------------------------------------------

export async function apiLogin(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function apiSignup(userData) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function apiChangePassword(currentPassword, newPassword) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
}

export async function apiResetPassword(email, newPassword) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword })
  });
}

export async function apiUpdatePassword(email, newPassword) {
  return apiResetPassword(email, newPassword);
}

// -----------------------------------------------------------------------------
// Data Bootstrap
// -----------------------------------------------------------------------------
export async function fetchInitialData() {
  try {
    return await request('/data');
  } catch (err) {
    console.error('[API] fetchInitialData error:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------
export async function apiCreateProject(project, tasks = []) {
  try {
    return await request('/projects', {
      method: 'POST',
      body: JSON.stringify({ project, tasks })
    });
  } catch (err) {
    console.error('[API] apiCreateProject error:', err.message);
    return null;
  }
}

export async function apiUpdateProject(id, updates) {
  try {
    return await request(`/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.error('[API] apiUpdateProject error:', err.message);
    return null;
  }
}

export async function apiDeleteProject(id) {
  try {
    return await request(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('[API] apiDeleteProject error:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------
export async function apiCreateTask(task) {
  try {
    return await request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
  } catch (err) {
    console.error('[API] apiCreateTask error:', err.message);
    return null;
  }
}

export async function apiUpdateTask(id, updates) {
  try {
    return await request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.error('[API] apiUpdateTask error:', err.message);
    return null;
  }
}

export async function apiDeleteTask(id) {
  try {
    return await request(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('[API] apiDeleteTask error:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Meetings
// -----------------------------------------------------------------------------
export async function apiCreateMeeting(meeting) {
  try {
    return await request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meeting)
    });
  } catch (err) {
    console.error('[API] apiCreateMeeting error:', err.message);
    return null;
  }
}

export async function apiUpdateMeeting(id, updates) {
  try {
    return await request(`/meetings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.error('[API] apiUpdateMeeting error:', err.message);
    return null;
  }
}

export async function apiDeleteMeeting(id) {
  try {
    return await request(`/meetings/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('[API] apiDeleteMeeting error:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Employees
// -----------------------------------------------------------------------------
export async function apiCreateEmployee(employee) {
  try {
    return await request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  } catch (err) {
    console.error('[API] apiCreateEmployee error:', err.message);
    return null;
  }
}

export async function apiUpdateEmployee(id, updates) {
  try {
    return await request(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.error('[API] apiUpdateEmployee error:', err.message);
    return null;
  }
}

export async function apiDeleteEmployee(id) {
  try {
    return await request(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('[API] apiDeleteEmployee error:', err.message);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Docs
// -----------------------------------------------------------------------------
export async function apiCreateDoc(doc) {
  try {
    return await request('/docs', {
      method: 'POST',
      body: JSON.stringify(doc)
    });
  } catch (err) {
    console.error('[API] apiCreateDoc error:', err.message);
    return null;
  }
}

export async function apiUpdateDoc(id, updates) {
  try {
    return await request(`/docs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (err) {
    console.error('[API] apiUpdateDoc error:', err.message);
    return null;
  }
}

export async function apiDeleteDoc(id) {
  try {
    return await request(`/docs/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('[API] apiDeleteDoc error:', err.message);
    return null;
  }
}
