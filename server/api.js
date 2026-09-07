import {
  getBootstrapData,
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
  createTaskRecord,
  updateTaskRecord,
  deleteTaskRecord,
  createMeetingRecord,
  updateMeetingRecord,
  deleteMeetingRecord,
  createEmployeeRecord,
  updateEmployeeRecord,
  updatePasswordByEmail
} from './db.js';

// Helper to read JSON body from request stream
export async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Connect/Express compatible API middleware handler
export async function apiHandler(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  if (!pathname.startsWith('/api')) {
    if (next) return next();
    return;
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // 1. GET /api/data (Bootstrap)
    if (pathname === '/api/data' && method === 'GET') {
      const data = await getBootstrapData();
      return sendJson(res, 200, data);
    }

    // 2. Projects
    if (pathname === '/api/projects' && method === 'POST') {
      const body = await parseJsonBody(req);
      const project = await createProjectRecord(body.project || body, body.tasks || []);
      return sendJson(res, 201, project);
    }

    const projMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projMatch) {
      const id = decodeURIComponent(projMatch[1]);
      if (method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = await updateProjectRecord(id, body);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteProjectRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // 3. Tasks
    if (pathname === '/api/tasks' && method === 'POST') {
      const body = await parseJsonBody(req);
      const task = await createTaskRecord(body);
      return sendJson(res, 201, task);
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch) {
      const id = decodeURIComponent(taskMatch[1]);
      if (method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = await updateTaskRecord(id, body);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteTaskRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // 4. Meetings
    if (pathname === '/api/meetings' && method === 'POST') {
      const body = await parseJsonBody(req);
      const meeting = await createMeetingRecord(body);
      return sendJson(res, 201, meeting);
    }

    const meetMatch = pathname.match(/^\/api\/meetings\/([^/]+)$/);
    if (meetMatch) {
      const id = decodeURIComponent(meetMatch[1]);
      if (method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = await updateMeetingRecord(id, body);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteMeetingRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // 5. Employees & Auth
    if (pathname === '/api/employees' && method === 'POST') {
      const body = await parseJsonBody(req);
      const employee = await createEmployeeRecord(body);
      return sendJson(res, 201, employee);
    }

    if (pathname === '/api/employees/password' && method === 'POST') {
      const body = await parseJsonBody(req);
      const updated = await updatePasswordByEmail(body.email, body.passwordHash);
      return sendJson(res, 200, updated || { success: true });
    }

    const empMatch = pathname.match(/^\/api\/employees\/([^/]+)$/);
    if (empMatch) {
      const id = decodeURIComponent(empMatch[1]);
      if (method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = await updateEmployeeRecord(id, body);
        return sendJson(res, 200, updated || { id });
      }
    }

    // Endpoint not found
    return sendJson(res, 404, { error: `Not found: ${method} ${pathname}` });
  } catch (err) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    return sendJson(res, 500, { error: err.message || 'Internal server error' });
  }
}
