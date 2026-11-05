import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
  deleteEmployeeRecord,
  updatePasswordByEmail,
  getEmployeeByEmailWithPassword,
  getEmployeeByIdWithPassword,
  createDocRecord,
  updateDocRecord,
  deleteDocRecord,
  toEmployeeDto,
  getFinanceSuiteData,
  getExchangeRates,
  getExchangeRatesList,
  upsertExchangeRate,
  getFinanceProjects,
  createFinanceProject,
  updateFinanceProject,
  deleteFinanceProject,
  getClientPos,
  createClientPo,
  updateClientPo,
  deleteClientPo,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getSupplierPos,
  createSupplierPo,
  updateSupplierPo,
  deleteSupplierPo,
  getPaymentsReceived,
  createPaymentReceived,
  updatePaymentReceived,
  deletePaymentReceived,
  getPaymentsMade,
  createPaymentMade,
  updatePaymentMade,
  deletePaymentMade,
  getCashAccounts,
  createCashAccount,
  updateCashAccount,
  deleteCashAccount,
  getCashTransactions,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction,
  getMasterDirectory,
  createMasterDirectoryEntry,
  updateMasterDirectoryEntry,
  deleteMasterDirectoryEntry,
  getDocumentVault,
  createDocumentVaultEntry,
  updateDocumentVaultEntry,
  deleteDocumentVaultEntry,
  createInvoiceTx,
  recordClientPaymentTx,
  recordSupplierPaymentTx,
  batchImportFinanceTx,
  voidInvoice,
  voidClientPo,
  voidSupplierPo,
  recordFinanceAuditLog,
  getFinanceAuditLogs,
  getLockedPeriods,
  lockPeriod,
  unlockPeriod,
  isPeriodLocked,
  sql,
  getProjectPlanData,
  createSprintRecord,
  updateSprintRecord,
  deleteSprintRecord,
  createSprintTaskRecord,
  updateSprintTaskRecord,
  deleteSprintTaskRecord,
  createGateRecord,
  updateGateRecord,
  deleteGateRecord,
  approveGateRecord,
  revokeGateRecord,
  toggleGateChecklistItemRecord,
  importProjectPlanTx
} from './db.js';
import {
  validate,
  loginSchema,
  signupSchema,
  changePasswordSchema,
  resetPasswordSchema,
  projectPostSchema,
  projectPutSchema,
  taskPostSchema,
  taskPutSchema,
  meetingPostSchema,
  meetingPutSchema,
  employeePostSchema,
  employeePutSchema,
  docPostSchema,
  docPutSchema,
  exchangeRatesSchema,
  financeImportSchema,
  financeProjectPostSchema,
  financeProjectPutSchema,
  voidReasonSchema,
  clientPoPostSchema,
  clientPoPutSchema,
  invoicePostSchema,
  invoicePutSchema,
  supplierPoPostSchema,
  supplierPoPutSchema,
  paymentReceivedPostSchema,
  paymentReceivedPutSchema,
  paymentMadePostSchema,
  paymentMadePutSchema,
  cashAccountPostSchema,
  cashAccountPutSchema,
  cashTransactionPostSchema,
  cashTransactionPutSchema,
  masterDirectoryPostSchema,
  masterDirectoryPutSchema,
  documentVaultPostSchema,
  documentVaultPutSchema,
  lockedPeriodPostSchema,
  sprintPostSchema,
  sprintPutSchema,
  sprintTaskPostSchema,
  sprintTaskPutSchema,
  gatePostSchema,
  gatePutSchema,
  gateApproveSchema,
  gateRevokeSchema,
  gateChecklistToggleSchema,
  planImportSchema
} from './validation.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tracker_jwt_secret_key_change_in_production_min_32_chars';

// Helper to check if user can create or modify finance records
export function canManageFinance(user) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const role = (user.role || '').toLowerCase().trim();
  return role === 'accountant' || role === 'admin';
}

// Helper to check permissions for Project Plan operations
export async function authorizePlanAccess(projectId, reqUser, action = 'write') {
  if (!reqUser) {
    return { allowed: false, status: 401, error: 'Unauthorized: Authentication required' };
  }

  const empRows = await sql`SELECT id, role, is_admin, email, full_name FROM employees WHERE id = ${reqUser.id} OR email = ${reqUser.email}`;
  const emp = empRows[0] || null;
  const isAdmin = Boolean(emp?.is_admin || (emp?.role || '').toLowerCase() === 'admin');

  if (action === 'read') {
    return { allowed: true, user: emp || reqUser, isAdmin };
  }

  if (action === 'revoke' || action === 'deleteGate') {
    if (!isAdmin) {
      return { allowed: false, status: 403, error: 'Forbidden: Admin access required' };
    }
    return { allowed: true, user: emp || reqUser, isAdmin: true };
  }

  if (isAdmin) {
    return { allowed: true, user: emp || reqUser, isAdmin: true };
  }

  // Verify Project Manager ownership
  const projRows = await sql`SELECT id, project_manager_id, created_by FROM projects WHERE id = ${projectId}`;
  if (!projRows || projRows.length === 0) {
    return { allowed: false, status: 404, error: 'Project not found' };
  }

  const proj = projRows[0];
  const pmId = String(proj.project_manager_id || proj.created_by || '');
  const userId = String(emp?.id || reqUser.id || '');

  if (!pmId || userId !== pmId) {
    return { allowed: false, status: 403, error: 'Forbidden: Only an Admin or this project\'s Project Manager can modify the plan' };
  }

  return { allowed: true, user: emp || reqUser, isAdmin: false };
}

// Helper to sign JWT (8 hour expiry)
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'Member',
      isAdmin: Boolean(user.is_admin || (user.role || '').toLowerCase() === 'admin'),
      userType: user.user_type || 'internal',
      organization: user.organization || ''
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

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

// Connect/Express compatible API middleware handler (also works as Vercel Serverless Function)
export async function apiHandler(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Normalize pathname to always start with /api regardless of Vercel rewrite handling
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname}`;
  }

  // Restrict CORS to ALLOWED_ORIGIN env var instead of wildcard "*"
  const allowedOriginEnv = process.env.ALLOWED_ORIGIN || 'http://localhost:5175';
  const allowedOrigins = allowedOriginEnv.split(',').map(s => s.trim());
  const requestOrigin = req.headers.origin;

  if (requestOrigin && (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:5175');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Public Health Check
    // -------------------------------------------------------------------------
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'ok', mode: 'Neon PostgreSQL', time: new Date().toISOString() });
    }

    // -------------------------------------------------------------------------
    // 2. Public Auth Routes (/api/auth/*)
    // -------------------------------------------------------------------------

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(loginSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;
      const email = body.email.toLowerCase().trim();
      const password = body.password;

      const userRow = await getEmployeeByEmailWithPassword(email);
      if (!userRow) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      const storedHash = userRow.password_hash || '';
      let isValid = false;
      let needsRehash = false;

      if (storedHash.startsWith('$2')) {
        isValid = await bcrypt.compare(password, storedHash);
      } else if (storedHash) {
        // Legacy SHA-256 verification
        const sha256 = crypto.createHash('sha256').update(password).digest('hex');
        if (sha256 === storedHash) {
          isValid = true;
          needsRehash = true;
        }
      }

      if (!isValid) {
        return sendJson(res, 401, { error: 'Invalid email or password' });
      }

      // Transparent migration: Re-hash legacy SHA-256 with bcrypt with per-user salt
      if (needsRehash) {
        const salt = await bcrypt.genSalt(10);
        const newBcryptHash = await bcrypt.hash(password, salt);
        await updatePasswordByEmail(email, newBcryptHash);
      }

      const token = signToken(userRow);
      return sendJson(res, 200, {
        token,
        user: toEmployeeDto(userRow)
      });
    }

    // POST /api/auth/signup (Self-signup can NEVER create an Admin)
    if (pathname === '/api/auth/signup' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(signupSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;
      const fullName = (body.fullName || body.name || '').trim();
      const email = body.email.toLowerCase().trim();
      const password = body.password;

      const existing = await getEmployeeByEmailWithPassword(email);
      if (existing) {
        return sendJson(res, 400, { error: 'An account with this email already exists' });
      }

      // Self-signup can NEVER create an Admin
      let cleanRole = (body.role || '').trim();
      if (cleanRole.toLowerCase() === 'admin') {
        cleanRole = 'Member';
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const avatar = body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0070F3&color=fff`;

      const newEmpDto = await createEmployeeRecord({
        fullName,
        email,
        role: cleanRole || 'Member',
        avatar,
        passwordHash,
        isAdmin: false,
        userType: 'internal',
        organization: 'Volvitech'
      });

      const token = signToken({
        id: newEmpDto.id,
        email: newEmpDto.email,
        role: newEmpDto.role,
        is_admin: false,
        user_type: newEmpDto.userType,
        organization: newEmpDto.organization
      });

      return sendJson(res, 201, {
        token,
        user: newEmpDto
      });
    }

    // POST /api/auth/change-password
    if (pathname === '/api/auth/change-password' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(changePasswordSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;

      const authHeader = req.headers.authorization || '';
      let userEmail = rawBody.email;

      if (authHeader.startsWith('Bearer ')) {
        try {
          const decoded = jwt.verify(authHeader.substring(7).trim(), JWT_SECRET);
          userEmail = decoded.email || userEmail;
        } catch {}
      }

      if (!userEmail) {
        return sendJson(res, 401, { error: 'Unauthorized: Authentication token or email required' });
      }

      const { currentPassword, newPassword } = body;

      const userRow = await getEmployeeByEmailWithPassword(userEmail);
      if (!userRow) {
        return sendJson(res, 404, { error: 'User record not found' });
      }

      const storedHash = userRow.password_hash || '';
      let isValid = false;
      if (storedHash.startsWith('$2')) {
        isValid = await bcrypt.compare(currentPassword, storedHash);
      } else if (storedHash) {
        const sha256 = crypto.createHash('sha256').update(currentPassword).digest('hex');
        if (sha256 === storedHash) {
          isValid = true;
        }
      }

      if (!isValid) {
        return sendJson(res, 400, { error: 'Incorrect current password' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await updatePasswordByEmail(userEmail, newHash);

      return sendJson(res, 200, { success: true, message: 'Password updated successfully' });
    }

    // POST /api/auth/reset-password
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(resetPasswordSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;
      const email = body.email.toLowerCase().trim();
      const { newPassword } = body;

      const userRow = await getEmployeeByEmailWithPassword(email);
      if (!userRow) {
        return sendJson(res, 404, { error: 'No account registered with this email address' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await updatePasswordByEmail(email, newHash);

      return sendJson(res, 200, { success: true, message: 'Password reset successfully' });
    }

    // -------------------------------------------------------------------------
    // 3. Auth Middleware for all other /api routes
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { error: 'Unauthorized: Valid authentication token required' });
    }

    const token = authHeader.substring(7).trim();
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return sendJson(res, 401, { error: 'Unauthorized: Invalid or expired authentication token' });
    }

    req.user = decoded;
    if (!req.user.isAdmin && req.user.email) {
      try {
        const emp = await getEmployeeByEmailWithPassword(req.user.email);
        if (emp && (emp.is_admin || (emp.role || '').toLowerCase() === 'admin')) {
          req.user.isAdmin = true;
          req.user.role = emp.role || 'Admin';
        }
      } catch {}
    }

    // -------------------------------------------------------------------------
    // 4. Protected Workspace Data Bootstrap (Never returns password hashes)
    // -------------------------------------------------------------------------
    if (pathname === '/api/data' && method === 'GET') {
      const data = await getBootstrapData();
      return sendJson(res, 200, data);
    }

    // -------------------------------------------------------------------------
    // 5. Projects
    // -------------------------------------------------------------------------
    if (pathname === '/api/projects' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(projectPostSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;
      const project = await createProjectRecord(body.project || body, body.tasks || []);
      return sendJson(res, 201, project);
    }

    const projMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projMatch) {
      const id = decodeURIComponent(projMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(projectPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateProjectRecord(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteProjectRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // -------------------------------------------------------------------------
    // 5.1 Project Plans (Sprint Plan & Stage Gates)
    // -------------------------------------------------------------------------

    // GET /api/projects/:id/plan
    const planMatch = pathname.match(/^\/api\/projects\/([^/]+)\/plan$/);
    if (planMatch) {
      const id = decodeURIComponent(planMatch[1]);
      if (method === 'GET') {
        const auth = await authorizePlanAccess(id, req.user, 'read');
        if (!auth.allowed) {
          return sendJson(res, auth.status, { error: auth.error });
        }
        const plan = await getProjectPlanData(id);
        return sendJson(res, 200, plan);
      }
    }

    // POST /api/projects/:id/plan/import
    const importMatch = pathname.match(/^\/api\/projects\/([^/]+)\/plan\/import$/);
    if (importMatch) {
      const id = decodeURIComponent(importMatch[1]);
      if (method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) {
          return sendJson(res, auth.status, { error: auth.error });
        }
        const rawBody = await parseJsonBody(req);
        const v = validate(planImportSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const result = await importProjectPlanTx(id, v.data, auth.user);
        return sendJson(res, 200, result);
      }
    }

    // Sprints: POST /api/projects/:id/sprints, PUT/DELETE /api/projects/:id/sprints/:sprintId
    const sprintsMatch = pathname.match(/^\/api\/projects\/([^/]+)\/sprints(?:\/([^/]+))?$/);
    if (sprintsMatch) {
      const id = decodeURIComponent(sprintsMatch[1]);
      const sprintId = sprintsMatch[2] ? decodeURIComponent(sprintsMatch[2]) : null;

      if (!sprintId && method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        const rawBody = await parseJsonBody(req);
        const v = validate(sprintPostSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const sprint = await createSprintRecord(id, v.data, auth.user);
        return sendJson(res, 201, sprint);
      }

      if (sprintId && method === 'PUT') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_sprints WHERE id = ${sprintId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Sprint not found for this project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(sprintPutSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const updated = await updateSprintRecord(id, sprintId, v.data, auth.user);
        return sendJson(res, 200, updated);
      }

      if (sprintId && method === 'DELETE') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_sprints WHERE id = ${sprintId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Sprint not found for this project' });
        }

        await deleteSprintRecord(id, sprintId, auth.user);
        return sendJson(res, 200, { success: true, id: sprintId });
      }
    }

    // Sprint Tasks: POST /api/projects/:id/sprint-tasks, PUT/DELETE /api/projects/:id/sprint-tasks/:taskId
    const tasksPlanMatch = pathname.match(/^\/api\/projects\/([^/]+)\/sprint-tasks(?:\/([^/]+))?$/);
    if (tasksPlanMatch) {
      const id = decodeURIComponent(tasksPlanMatch[1]);
      const taskId = tasksPlanMatch[2] ? decodeURIComponent(tasksPlanMatch[2]) : null;

      if (!taskId && method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        const rawBody = await parseJsonBody(req);
        const v = validate(sprintTaskPostSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        // Check sprint belongs to project
        const sCheck = await sql`SELECT project_id FROM project_sprints WHERE id = ${v.data.sprintId}`;
        if (!sCheck || sCheck.length === 0 || sCheck[0].project_id !== id) {
          return sendJson(res, 400, { error: 'Invalid sprintId: sprint does not belong to this project' });
        }

        const task = await createSprintTaskRecord(id, v.data, auth.user);
        return sendJson(res, 201, task);
      }

      if (taskId && method === 'PUT') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_sprint_tasks WHERE id = ${taskId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Task not found for this project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(sprintTaskPutSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const updated = await updateSprintTaskRecord(id, taskId, v.data, auth.user);
        return sendJson(res, 200, updated);
      }

      if (taskId && method === 'DELETE') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_sprint_tasks WHERE id = ${taskId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Task not found for this project' });
        }

        await deleteSprintTaskRecord(id, taskId, auth.user);
        return sendJson(res, 200, { success: true, id: taskId });
      }
    }

    // Gate Approval: POST /api/projects/:id/gates/:gateId/approve
    const gateApproveMatch = pathname.match(/^\/api\/projects\/([^/]+)\/gates\/([^/]+)\/approve$/);
    if (gateApproveMatch) {
      const id = decodeURIComponent(gateApproveMatch[1]);
      const gateId = decodeURIComponent(gateApproveMatch[2]);
      if (method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_gates WHERE id = ${gateId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Gate not found for this project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(gateApproveSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const gate = await approveGateRecord(id, gateId, v.data, auth.user);
        return sendJson(res, 200, gate);
      }
    }

    // Gate Revocation: POST /api/projects/:id/gates/:gateId/revoke (Admin only)
    const gateRevokeMatch = pathname.match(/^\/api\/projects\/([^/]+)\/gates\/([^/]+)\/revoke$/);
    if (gateRevokeMatch) {
      const id = decodeURIComponent(gateRevokeMatch[1]);
      const gateId = decodeURIComponent(gateRevokeMatch[2]);
      if (method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'revoke');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_gates WHERE id = ${gateId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Gate not found for this project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(gateRevokeSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const gate = await revokeGateRecord(id, gateId, v.data, auth.user);
        return sendJson(res, 200, gate);
      }
    }

    // Gate Checklist Item Toggle: PUT /api/projects/:id/gates/:gateId/checklist/:itemId
    const checklistMatch = pathname.match(/^\/api\/projects\/([^/]+)\/gates\/([^/]+)\/checklist\/([^/]+)$/);
    if (checklistMatch) {
      const id = decodeURIComponent(checklistMatch[1]);
      const gateId = decodeURIComponent(checklistMatch[2]);
      const itemId = decodeURIComponent(checklistMatch[3]);
      if (method === 'PUT') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`
          SELECT project_id, gate_id FROM project_gate_checklist_items WHERE id = ${itemId}
        `;
        if (!rows || rows.length === 0 || rows[0].project_id !== id || rows[0].gate_id !== gateId) {
          return sendJson(res, 404, { error: 'Checklist item not found for this gate and project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(gateChecklistToggleSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const result = await toggleGateChecklistItemRecord(id, gateId, itemId, v.data.isDone, auth.user);
        return sendJson(res, 200, result);
      }
    }

    // Gates CRUD: POST /api/projects/:id/gates, PUT/DELETE /api/projects/:id/gates/:gateId
    const gatesMatch = pathname.match(/^\/api\/projects\/([^/]+)\/gates(?:\/([^/]+))?$/);
    if (gatesMatch) {
      const id = decodeURIComponent(gatesMatch[1]);
      const gateId = gatesMatch[2] ? decodeURIComponent(gatesMatch[2]) : null;

      if (!gateId && method === 'POST') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        const rawBody = await parseJsonBody(req);
        const v = validate(gatePostSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const gate = await createGateRecord(id, v.data, auth.user);
        return sendJson(res, 201, gate);
      }

      if (gateId && method === 'PUT') {
        const auth = await authorizePlanAccess(id, req.user, 'write');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_gates WHERE id = ${gateId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Gate not found for this project' });
        }

        const rawBody = await parseJsonBody(req);
        const v = validate(gatePutSchema, rawBody);
        if (!v.success) return sendJson(res, 400, { error: v.error, details: v.issues });

        const updated = await updateGateRecord(id, gateId, v.data, auth.user);
        return sendJson(res, 200, updated);
      }

      if (gateId && method === 'DELETE') {
        // revoke/delete gate = Admin only
        const auth = await authorizePlanAccess(id, req.user, 'deleteGate');
        if (!auth.allowed) return sendJson(res, auth.status, { error: auth.error });

        // IDOR check
        const rows = await sql`SELECT project_id FROM project_gates WHERE id = ${gateId}`;
        if (!rows || rows.length === 0 || rows[0].project_id !== id) {
          return sendJson(res, 404, { error: 'Gate not found for this project' });
        }

        await deleteGateRecord(id, gateId, auth.user);
        return sendJson(res, 200, { success: true, id: gateId });
      }
    }

    // -------------------------------------------------------------------------
    // 6. Tasks
    // -------------------------------------------------------------------------
    if (pathname === '/api/tasks' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(taskPostSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const data = {
        ...v.data,
        name: (v.data.name || v.data.title || '').trim()
      };
      const task = await createTaskRecord(data);
      return sendJson(res, 201, task);
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (taskMatch) {
      const id = decodeURIComponent(taskMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(taskPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateTaskRecord(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteTaskRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // -------------------------------------------------------------------------
    // 7. Meetings
    // -------------------------------------------------------------------------
    if (pathname === '/api/meetings' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(meetingPostSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const data = {
        ...v.data,
        name: (v.data.name || v.data.title || '').trim()
      };
      const meeting = await createMeetingRecord(data);
      return sendJson(res, 201, meeting);
    }

    const meetMatch = pathname.match(/^\/api\/meetings\/([^/]+)$/);
    if (meetMatch) {
      const id = decodeURIComponent(meetMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(meetingPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateMeetingRecord(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteMeetingRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // -------------------------------------------------------------------------
    // 8. Employees & Role Checks
    // -------------------------------------------------------------------------

    // Only Admins can create employees
    if (pathname === '/api/employees' && method === 'POST') {
      if (!req.user.isAdmin) {
        return sendJson(res, 403, { error: 'Forbidden: Admin access required to create employees' });
      }
      const rawBody = await parseJsonBody(req);
      const v = validate(employeePostSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const body = v.data;
      let passwordHash = '';
      if (body.password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(body.password, salt);
      } else if (body.passwordHash) {
        passwordHash = body.passwordHash;
      }
      const employee = await createEmployeeRecord({ ...body, passwordHash });
      return sendJson(res, 201, employee);
    }

    // Employee by ID
    const empMatch = pathname.match(/^\/api\/employees\/([^/]+)$/);
    if (empMatch) {
      const id = decodeURIComponent(empMatch[1]);

      // Only Admins can edit employees and change roles (Users can only update their own avatar/name)
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(employeePutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        const isSelf = String(req.user.id) === String(id);
        const isChangingRoleOrAdmin = body.role !== undefined || body.isAdmin !== undefined;

        if (isChangingRoleOrAdmin && !req.user.isAdmin) {
          return sendJson(res, 403, { error: 'Forbidden: Only admins can change roles or admin status' });
        }

        if (!isSelf && !req.user.isAdmin) {
          return sendJson(res, 403, { error: 'Forbidden: Admin access required to edit other employees' });
        }

        let updates = { ...body };
        if (body.password) {
          const salt = await bcrypt.genSalt(10);
          updates.passwordHash = await bcrypt.hash(body.password, salt);
          delete updates.password;
        }

        const updated = await updateEmployeeRecord(id, updates);
        return sendJson(res, 200, updated || { id });
      }

      // Only Admins can delete employees
      if (method === 'DELETE') {
        if (!req.user.isAdmin) {
          return sendJson(res, 403, { error: 'Forbidden: Admin access required to delete employees' });
        }
        if (String(req.user.id) === String(id) || (req.user.email && req.user.email.toLowerCase() === id.toLowerCase())) {
          return sendJson(res, 400, { error: 'Cannot delete your own active administrator account' });
        }
        await deleteEmployeeRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // -------------------------------------------------------------------------
    // 9. Docs
    // -------------------------------------------------------------------------
    if (pathname === '/api/docs' && method === 'POST') {
      const rawBody = await parseJsonBody(req);
      const v = validate(docPostSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const data = {
        ...v.data,
        title: (v.data.title || v.data.name || '').trim()
      };
      const doc = await createDocRecord(data);
      return sendJson(res, 201, doc);
    }

    const docMatch = pathname.match(/^\/api\/docs\/([^/]+)$/);
    if (docMatch) {
      const id = decodeURIComponent(docMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(docPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateDocRecord(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteDocRecord(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // -------------------------------------------------------------------------
    // 10. Finance Suite (/api/finance)
    // -------------------------------------------------------------------------

    // 10.0 Role-based permission enforcement for all finance mutations:
    // Only Admins and Accountants can create or modify finance records.
    if (pathname.startsWith('/api/finance') && method !== 'GET') {
      if (!canManageFinance(req.user)) {
        return sendJson(res, 403, { error: 'Forbidden: Only Admins and Accountants can create or modify finance records' });
      }
    }

    // GET /api/finance - Return all finance suite data
    if (pathname === '/api/finance' && method === 'GET') {
      const data = await getFinanceSuiteData();
      return sendJson(res, 200, data);
    }

    // Finance Audit Logs (Admin only)
    if (pathname === '/api/finance/audit-logs' && method === 'GET') {
      if (!req.user.isAdmin) {
        return sendJson(res, 403, { error: 'Forbidden: Admin access required to view audit logs' });
      }
      const userParam = url.searchParams.get('user') || '';
      const actionParam = url.searchParams.get('action') || '';
      const entityTypeParam = url.searchParams.get('entityType') || '';
      const startDate = url.searchParams.get('startDate') || '';
      const endDate = url.searchParams.get('endDate') || '';
      const search = url.searchParams.get('search') || '';
      const limit = Number(url.searchParams.get('limit')) || 200;

      const logs = await getFinanceAuditLogs({
        user: userParam,
        action: actionParam,
        entityType: entityTypeParam,
        startDate,
        endDate,
        search,
        limit
      });
      return sendJson(res, 200, logs);
    }

    // Finance Locked Periods
    if (pathname === '/api/finance/locked-periods') {
      if (method === 'GET') {
        const periods = await getLockedPeriods();
        return sendJson(res, 200, periods);
      }
      if (method === 'POST') {
        if (!req.user.isAdmin) {
          return sendJson(res, 403, { error: 'Forbidden: Admin access required to lock periods' });
        }
        const rawBody = await parseJsonBody(req);
        const v = validate(lockedPeriodPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        const updated = await lockPeriod(body.period, req.user.email, body.reason || '');
        return sendJson(res, 200, { success: true, lockedPeriods: updated });
      }
    }

    const lockedPeriodMatch = pathname.match(/^\/api\/finance\/locked-periods\/([^/]+)$/);
    if (lockedPeriodMatch && method === 'DELETE') {
      if (!req.user.isAdmin) {
        return sendJson(res, 403, { error: 'Forbidden: Admin access required to unlock periods' });
      }
      const period = decodeURIComponent(lockedPeriodMatch[1]);
      const updated = await unlockPeriod(period);
      return sendJson(res, 200, { success: true, lockedPeriods: updated });
    }

    // POST /api/finance/import - One-time migration/import from localStorage (Admin only)
    if (pathname === '/api/finance/import' && method === 'POST') {
      if (!req.user.isAdmin) {
        return sendJson(res, 403, { error: 'Forbidden: Admin privilege required to import finance data' });
      }
      const rawBody = await parseJsonBody(req);
      const v = validate(financeImportSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const imported = await batchImportFinanceTx(v.data);
      return sendJson(res, 200, { success: true, data: imported });
    }

    // Exchange Rates
    if (pathname === '/api/finance/exchange-rates') {
      if (method === 'GET') {
        const rates = await getExchangeRates();
        const list = await getExchangeRatesList();
        return sendJson(res, 200, { rates, list });
      }
      if (method === 'POST') {
        if (!req.user || !req.user.isAdmin) {
          return sendJson(res, 403, { error: 'Forbidden: Only administrators can modify exchange rates' });
        }
        const rawBody = await parseJsonBody(req);
        const v = validate(exchangeRatesSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.rates && typeof body.rates === 'object') {
          const effDate = body.effectiveDate || new Date().toISOString().slice(0, 10);
          for (const [curr, r] of Object.entries(body.rates)) {
            await upsertExchangeRate(curr, r, effDate);
          }
          const updated = await getExchangeRates();
          const list = await getExchangeRatesList();
          return sendJson(res, 200, { success: true, rates: updated, list });
        } else if (body.currency) {
          await upsertExchangeRate(body.currency, body.rate, body.effectiveDate);
          const updated = await getExchangeRates();
          const list = await getExchangeRatesList();
          return sendJson(res, 200, { success: true, rates: updated, list });
        }
        return sendJson(res, 400, { error: 'Invalid exchange rate payload' });
      }
    }

    // Finance Projects
    if (pathname === '/api/finance/projects') {
      if (method === 'GET') {
        const projects = await getFinanceProjects();
        return sendJson(res, 200, projects);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(financeProjectPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const created = await createFinanceProject(v.data);
        return sendJson(res, 201, created);
      }
    }

    const finProjMatch = pathname.match(/^\/api\/finance\/projects\/([^/]+)$/);
    if (finProjMatch) {
      const id = decodeURIComponent(finProjMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(financeProjectPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateFinanceProject(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteFinanceProject(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Void Client PO (Must be checked before generic cpoMatch)
    const voidCpoMatch = pathname.match(/^\/api\/finance\/client-pos\/([^/]+)\/void$/);
    if (voidCpoMatch && method === 'POST') {
      const id = decodeURIComponent(voidCpoMatch[1]);
      const rawBody = await parseJsonBody(req);
      const v = validate(voidReasonSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const voided = await voidClientPo(id, v.data.reason, req.user);
      return sendJson(res, 200, voided);
    }

    // Client POs (Supports search & limit/offset pagination)
    if (pathname === '/api/finance/client-pos') {
      if (method === 'GET') {
        let pos = await getClientPos();
        const search = (url.searchParams.get('search') || '').toLowerCase().trim();
        if (search) {
          pos = pos.filter(p =>
            (p.poNumber && String(p.poNumber).toLowerCase().includes(search)) ||
            (p.clientName && String(p.clientName).toLowerCase().includes(search)) ||
            (p.scope && String(p.scope).toLowerCase().includes(search)) ||
            (p.projectName && String(p.projectName).toLowerCase().includes(search))
          );
        }
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        if (limitParam !== null) {
          const limit = Math.max(1, parseInt(limitParam, 10) || 50);
          const offset = Math.max(0, parseInt(offsetParam, 10) || 0);
          return sendJson(res, 200, {
            data: pos.slice(offset, offset + limit),
            total: pos.length,
            limit,
            offset
          });
        }
        return sendJson(res, 200, pos);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(clientPoPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.issueDate && await isPeriodLocked(body.issueDate)) {
          return sendJson(res, 403, { error: `Period ${String(body.issueDate).slice(0, 7)} is locked against modifications.` });
        }
        const created = await createClientPo(body, req.user);
        return sendJson(res, 201, created);
      }
    }

    const cpoMatch = pathname.match(/^\/api\/finance\/client-pos\/([^/]+)$/);
    if (cpoMatch) {
      const id = decodeURIComponent(cpoMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(clientPoPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.issueDate && await isPeriodLocked(body.issueDate)) {
          return sendJson(res, 403, { error: `Period ${String(body.issueDate).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updateClientPo(id, body, req.user);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteClientPo(id, req.user);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Void Invoice (Must be checked before generic invMatch)
    const voidInvMatch = pathname.match(/^\/api\/finance\/invoices\/([^/]+)\/void$/);
    if (voidInvMatch && method === 'POST') {
      const id = decodeURIComponent(voidInvMatch[1]);
      const rawBody = await parseJsonBody(req);
      const v = validate(voidReasonSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const voided = await voidInvoice(id, v.data.reason, req.user);
      return sendJson(res, 200, voided);
    }

    // Invoices (Multi-step transactional create with PO drawdown, supports search & limit/offset pagination)
    if (pathname === '/api/finance/invoices') {
      if (method === 'GET') {
        let invoices = await getInvoices();
        const search = (url.searchParams.get('search') || '').toLowerCase().trim();
        if (search) {
          invoices = invoices.filter(inv =>
            (inv.invoiceNumber && String(inv.invoiceNumber).toLowerCase().includes(search)) ||
            (inv.clientName && String(inv.clientName).toLowerCase().includes(search)) ||
            (inv.linkedPo && String(inv.linkedPo).toLowerCase().includes(search))
          );
        }
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        if (limitParam !== null) {
          const limit = Math.max(1, parseInt(limitParam, 10) || 50);
          const offset = Math.max(0, parseInt(offsetParam, 10) || 0);
          return sendJson(res, 200, {
            data: invoices.slice(offset, offset + limit),
            total: invoices.length,
            limit,
            offset
          });
        }
        return sendJson(res, 200, invoices);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(invoicePostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        const invDate = (body.invoice || body).issueDate;
        if (invDate && await isPeriodLocked(invDate)) {
          return sendJson(res, 403, { error: `Period ${String(invDate).slice(0, 7)} is locked against modifications.` });
        }
        const created = await createInvoiceTx(body, req.user);
        return sendJson(res, 201, created);
      }
    }

    const invMatch = pathname.match(/^\/api\/finance\/invoices\/([^/]+)$/);
    if (invMatch) {
      const id = decodeURIComponent(invMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(invoicePutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.issueDate && await isPeriodLocked(body.issueDate)) {
          return sendJson(res, 403, { error: `Period ${String(body.issueDate).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updateInvoice(id, body, req.user);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        try {
          await deleteInvoice(id, req.user);
          return sendJson(res, 200, { success: true, id });
        } catch (err) {
          return sendJson(res, 400, { error: err.message });
        }
      }
    }

    // Void Supplier PO (Must be checked before generic spoMatch)
    const voidSpoMatch = pathname.match(/^\/api\/finance\/supplier-pos\/([^/]+)\/void$/);
    if (voidSpoMatch && method === 'POST') {
      const id = decodeURIComponent(voidSpoMatch[1]);
      const rawBody = await parseJsonBody(req);
      const v = validate(voidReasonSchema, rawBody);
      if (!v.success) {
        return sendJson(res, 400, { error: v.error, details: v.issues });
      }
      const voided = await voidSupplierPo(id, v.data.reason, req.user);
      return sendJson(res, 200, voided);
    }

    // Supplier POs (Supports search & limit/offset pagination)
    if (pathname === '/api/finance/supplier-pos') {
      if (method === 'GET') {
        let spos = await getSupplierPos();
        const search = (url.searchParams.get('search') || '').toLowerCase().trim();
        if (search) {
          spos = spos.filter(s =>
            (s.poNumber && String(s.poNumber).toLowerCase().includes(search)) ||
            (s.supplierName && String(s.supplierName).toLowerCase().includes(search)) ||
            (s.entity && String(s.entity).toLowerCase().includes(search)) ||
            (s.linkedProject && String(s.linkedProject).toLowerCase().includes(search))
          );
        }
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        if (limitParam !== null) {
          const limit = Math.max(1, parseInt(limitParam, 10) || 50);
          const offset = Math.max(0, parseInt(offsetParam, 10) || 0);
          return sendJson(res, 200, {
            data: spos.slice(offset, offset + limit),
            total: spos.length,
            limit,
            offset
          });
        }
        return sendJson(res, 200, spos);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(supplierPoPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.issueDate && await isPeriodLocked(body.issueDate)) {
          return sendJson(res, 403, { error: `Period ${String(body.issueDate).slice(0, 7)} is locked against modifications.` });
        }
        const created = await createSupplierPo(body, req.user);
        return sendJson(res, 201, created);
      }
    }

    const spoMatch = pathname.match(/^\/api\/finance\/supplier-pos\/([^/]+)$/);
    if (spoMatch) {
      const id = decodeURIComponent(spoMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(supplierPoPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.issueDate && await isPeriodLocked(body.issueDate)) {
          return sendJson(res, 403, { error: `Period ${String(body.issueDate).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updateSupplierPo(id, body, req.user);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteSupplierPo(id, req.user);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Payments Received (Transactional with invoice & cash accounts)
    if (pathname === '/api/finance/payments-received') {
      if (method === 'GET') {
        const pmts = await getPaymentsReceived();
        return sendJson(res, 200, pmts);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(paymentReceivedPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        const pmtDate = (body.payment || body).date;
        if (pmtDate && await isPeriodLocked(pmtDate)) {
          return sendJson(res, 403, { error: `Period ${String(pmtDate).slice(0, 7)} is locked against modifications.` });
        }
        const created = await recordClientPaymentTx(body, req.user);
        return sendJson(res, 201, created);
      }
    }

    const pmtRcvMatch = pathname.match(/^\/api\/finance\/payments-received\/([^/]+)$/);
    if (pmtRcvMatch) {
      const id = decodeURIComponent(pmtRcvMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(paymentReceivedPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.date && await isPeriodLocked(body.date)) {
          return sendJson(res, 403, { error: `Period ${String(body.date).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updatePaymentReceived(id, body, req.user);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deletePaymentReceived(id, req.user);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Payments Made (Transactional with supplier PO & cash accounts)
    if (pathname === '/api/finance/payments-made') {
      if (method === 'GET') {
        const pmts = await getPaymentsMade();
        return sendJson(res, 200, pmts);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(paymentMadePostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        const pmtDate = (body.payment || body).date;
        if (pmtDate && await isPeriodLocked(pmtDate)) {
          return sendJson(res, 403, { error: `Period ${String(pmtDate).slice(0, 7)} is locked against modifications.` });
        }
        const created = await recordSupplierPaymentTx(body, req.user);
        return sendJson(res, 201, created);
      }
    }

    const pmtMadeMatch = pathname.match(/^\/api\/finance\/payments-made\/([^/]+)$/);
    if (pmtMadeMatch) {
      const id = decodeURIComponent(pmtMadeMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(paymentMadePutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.date && await isPeriodLocked(body.date)) {
          return sendJson(res, 403, { error: `Period ${String(body.date).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updatePaymentMade(id, body, req.user);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deletePaymentMade(id, req.user);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Cash Accounts
    if (pathname === '/api/finance/cash-accounts') {
      if (method === 'GET') {
        const accounts = await getCashAccounts();
        return sendJson(res, 200, accounts);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(cashAccountPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const created = await createCashAccount(v.data);
        return sendJson(res, 201, created);
      }
    }

    const accMatch = pathname.match(/^\/api\/finance\/cash-accounts\/([^/]+)$/);
    if (accMatch) {
      const id = decodeURIComponent(accMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(cashAccountPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateCashAccount(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteCashAccount(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Cash Transactions (Supports search & limit/offset pagination)
    if (pathname === '/api/finance/cash-transactions') {
      if (method === 'GET') {
        let txns = await getCashTransactions();
        const search = (url.searchParams.get('search') || '').toLowerCase().trim();
        if (search) {
          txns = txns.filter(t =>
            (t.reference && String(t.reference).toLowerCase().includes(search)) ||
            (t.description && String(t.description).toLowerCase().includes(search)) ||
            (t.party && String(t.party).toLowerCase().includes(search)) ||
            (t.category && String(t.category).toLowerCase().includes(search))
          );
        }
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        if (limitParam !== null) {
          const limit = Math.max(1, parseInt(limitParam, 10) || 50);
          const offset = Math.max(0, parseInt(offsetParam, 10) || 0);
          return sendJson(res, 200, {
            data: txns.slice(offset, offset + limit),
            total: txns.length,
            limit,
            offset
          });
        }
        return sendJson(res, 200, txns);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(cashTransactionPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.date && await isPeriodLocked(body.date)) {
          return sendJson(res, 403, { error: `Period ${String(body.date).slice(0, 7)} is locked against modifications.` });
        }
        const created = await createCashTransaction(body);
        return sendJson(res, 201, created);
      }
    }

    const txnMatch = pathname.match(/^\/api\/finance\/cash-transactions\/([^/]+)$/);
    if (txnMatch) {
      const id = decodeURIComponent(txnMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(cashTransactionPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const body = v.data;
        if (body.date && await isPeriodLocked(body.date)) {
          return sendJson(res, 403, { error: `Period ${String(body.date).slice(0, 7)} is locked against modifications.` });
        }
        const updated = await updateCashTransaction(id, body);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteCashTransaction(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Master Directory
    if (pathname === '/api/finance/master-directory') {
      if (method === 'GET') {
        const dir = await getMasterDirectory();
        return sendJson(res, 200, dir);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(masterDirectoryPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const created = await createMasterDirectoryEntry(v.data);
        return sendJson(res, 201, created);
      }
    }

    const dirMatch = pathname.match(/^\/api\/finance\/master-directory\/([^/]+)$/);
    if (dirMatch) {
      const id = decodeURIComponent(dirMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(masterDirectoryPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateMasterDirectoryEntry(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteMasterDirectoryEntry(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Document Vault
    if (pathname === '/api/finance/vault') {
      if (method === 'GET') {
        const vault = await getDocumentVault();
        return sendJson(res, 200, vault);
      }
      if (method === 'POST') {
        const rawBody = await parseJsonBody(req);
        const v = validate(documentVaultPostSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const created = await createDocumentVaultEntry(v.data);
        return sendJson(res, 201, created);
      }
    }

    const vaultMatch = pathname.match(/^\/api\/finance\/vault\/([^/]+)$/);
    if (vaultMatch) {
      const id = decodeURIComponent(vaultMatch[1]);
      if (method === 'PUT') {
        const rawBody = await parseJsonBody(req);
        const v = validate(documentVaultPutSchema, rawBody);
        if (!v.success) {
          return sendJson(res, 400, { error: v.error, details: v.issues });
        }
        const updated = await updateDocumentVaultEntry(id, v.data);
        return sendJson(res, 200, updated || { id });
      }
      if (method === 'DELETE') {
        await deleteDocumentVaultEntry(id);
        return sendJson(res, 200, { success: true, id });
      }
    }

    // Endpoint not found
    return sendJson(res, 404, { error: `Not found: ${method} ${pathname}` });
  } catch (err) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    return sendJson(res, 500, { error: err.message || 'Internal server error' });
  }
}
