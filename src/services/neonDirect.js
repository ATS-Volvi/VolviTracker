// Direct Client Neon PostgreSQL Driver
// Works directly in the browser over HTTPS CORS when deployed on static CDNs (e.g. Render Static Site)
// or when backend serverless APIs are unavailable.
import { neon } from '@neondatabase/serverless';

const DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_bVuwYs2eRqF4@ep-square-mode-aesd0kh6-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';
const dbUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DATABASE_URL) || DEFAULT_NEON_URL;

export const sql = neon(dbUrl);

// DTO mappers
export const toEmployeeDto = (row) => row ? ({
  id: String(row.id),
  fullName: row.full_name || '',
  email: row.email || '',
  role: row.role || 'Member',
  avatar: row.avatar || '',
  passwordHash: row.password_hash || '',
  isAdmin: Boolean(row.is_admin || (row.role || '').toLowerCase() === 'admin')
}) : null;

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const toProjectDto = (row) => row ? ({
  id: String(row.id),
  name: row.name || '',
  clientName: row.client_name || '',
  contactDesignation: row.contact_designation || row.client_designation || '',
  clientDesignation: row.contact_designation || row.client_designation || '',
  pocName: row.poc_name || '',
  refererName: row.referer_name || '',
  contactNumber: row.contact_number || '',
  contactEmail: row.contact_email || '',
  status: row.status || 'Not started',
  startDate: row.start_date || '',
  endDate: row.end_date || '',
  startValue: Number(row.start_value) || 0,
  endValue: Number(row.end_value) || 100,
  progress: Number(row.progress) || 0,
  assigneeIds: parseJsonArray(row.assignee_ids),
  assigneeId: row.assignee_id ? String(row.assignee_id) : ''
}) : null;

export const toTaskDto = (row) => row ? ({
  id: String(row.id),
  name: row.name || '',
  projectId: row.project_id ? String(row.project_id) : '',
  status: row.status || 'Not started',
  dueDate: row.due_date || '',
  priority: row.priority || 'Medium',
  description: row.description || '',
  assigneeIds: parseJsonArray(row.assignee_ids),
  assigneeId: row.assignee_id ? String(row.assignee_id) : ''
}) : null;

export const toMeetingDto = (row) => row ? ({
  id: String(row.id),
  name: row.name || '',
  dateTime: row.date_time || '',
  status: row.status || 'Not started',
  url: row.url || '',
  attendeeIds: parseJsonArray(row.attendee_ids),
  attendeeId: row.attendee_id ? String(row.attendee_id) : ''
}) : null;

export const toDocDto = (row) => row ? ({
  id: String(row.id),
  title: row.title || '',
  category: row.category || 'General',
  summary: row.summary || '',
  content: row.content || '',
  tags: parseJsonArray(row.tags),
  externalUrl: row.external_url || '',
  authorId: row.author_id ? String(row.author_id) : '',
  authorName: row.author_name || '',
  authorRole: row.author_role || '',
  authorAvatar: row.author_avatar || '',
  isPinned: Boolean(row.is_pinned),
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
}) : null;

// Bootstrap Data from Neon DB
export async function directGetBootstrapData() {
  let docRows = [];
  const [empRows, projRows, taskRows, meetRows] = await Promise.all([
    sql`SELECT * FROM employees ORDER BY created_at ASC`,
    sql`SELECT * FROM projects ORDER BY created_at ASC`,
    sql`SELECT * FROM tasks ORDER BY created_at ASC`,
    sql`SELECT * FROM meetings ORDER BY created_at ASC`
  ]);

  try {
    docRows = await sql`SELECT * FROM docs ORDER BY created_at DESC`;
  } catch {
    docRows = [];
  }

  return {
    employees: empRows.map(toEmployeeDto).filter(Boolean),
    projects: projRows.map(toProjectDto).filter(Boolean),
    tasks: taskRows.map(toTaskDto).filter(Boolean),
    meetings: meetRows.map(toMeetingDto).filter(Boolean),
    docs: docRows.map(toDocDto).filter(Boolean)
  };
}

// Project Operations
export async function directCreateProject(project, tasks = []) {
  const id = project.id || ('proj_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const assigneeIdsJson = JSON.stringify(Array.isArray(project.assigneeIds) ? project.assigneeIds : []);
  const assigneeId = (project.assigneeIds && project.assigneeIds[0]) || project.assigneeId || '';

  let progress = Number(project.progress) || 0;
  if (tasks.length > 0) {
    const doneCount = tasks.filter(t => t.status === 'Done').length;
    progress = doneCount / tasks.length;
  }
  let status = progress === 1 ? 'Done' : (progress === 0 ? 'Not started' : (project.status || 'In progress'));

  const clientName = project.clientName || '';
  const contactDesignation = project.contactDesignation || project.clientDesignation || '';
  const pocName = project.pocName || project.pointOfContactName || '';
  const refererName = project.refererName || '';
  const contactNumber = project.contactNumber || project.contactPhone || '';
  const contactEmail = project.contactEmail || '';

  await sql`
    INSERT INTO projects (
      id, name, client_name, contact_designation, client_designation, poc_name, referer_name, contact_number, contact_email, status, start_date, end_date, start_value, end_value, progress, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${project.name || 'Untitled Project'}, ${clientName}, ${contactDesignation}, ${contactDesignation}, ${pocName}, ${refererName}, ${contactNumber}, ${contactEmail}, ${status}, ${project.startDate || ''}, ${project.endDate || ''},
      0, 100, ${progress}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      client_name = EXCLUDED.client_name,
      contact_designation = EXCLUDED.contact_designation,
      client_designation = EXCLUDED.client_designation,
      poc_name = EXCLUDED.poc_name,
      referer_name = EXCLUDED.referer_name,
      contact_number = EXCLUDED.contact_number,
      contact_email = EXCLUDED.contact_email,
      status = EXCLUDED.status,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      progress = EXCLUDED.progress,
      assignee_ids = EXCLUDED.assignee_ids,
      assignee_id = EXCLUDED.assignee_id;
  `;

  for (const t of tasks) {
    const tId = t.id && !t.id.startsWith('temp_') ? t.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
    const tAssigneeIdsJson = JSON.stringify(Array.isArray(t.assigneeIds) ? t.assigneeIds : []);
    const tAssigneeId = (t.assigneeIds && t.assigneeIds[0]) || t.assigneeId || '';

    await sql`
      INSERT INTO tasks (
        id, name, project_id, status, due_date, priority, description, assignee_ids, assignee_id
      ) VALUES (
        ${tId}, ${t.name || 'Task'}, ${id}, ${t.status || 'Not started'}, ${t.dueDate || ''},
        ${t.priority || 'Medium'}, ${t.description || ''}, ${tAssigneeIdsJson}::jsonb, ${tAssigneeId}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        project_id = EXCLUDED.project_id,
        status = EXCLUDED.status,
        due_date = EXCLUDED.due_date,
        priority = EXCLUDED.priority,
        description = EXCLUDED.description,
        assignee_ids = EXCLUDED.assignee_ids,
        assignee_id = EXCLUDED.assignee_id;
    `;
  }

  const saved = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return toProjectDto(saved[0]);
}

export async function directUpdateProject(id, updates) {
  const existing = await sql`SELECT * FROM projects WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  let progress = updates.progress !== undefined ? Number(updates.progress) : Number(current.progress);
  let status = updates.status !== undefined ? updates.status : current.status;

  if (progress === 0) status = 'Not started';
  else if (progress === 1) status = 'Done';
  else if (status === 'Not started' && progress > 0) status = 'In progress';

  const startDate = updates.startDate !== undefined ? updates.startDate : current.start_date;
  const endDate = updates.endDate !== undefined ? updates.endDate : current.end_date;
  const assigneeIds = updates.assigneeIds !== undefined ? updates.assigneeIds : (current.assignee_ids || []);
  const assigneeIdsJson = JSON.stringify(Array.isArray(assigneeIds) ? assigneeIds : []);
  const assigneeId = updates.assigneeId !== undefined ? updates.assigneeId : ((assigneeIds && assigneeIds[0]) || current.assignee_id || '');

  const clientName = updates.clientName !== undefined ? updates.clientName : (current.client_name || '');
  const contactDesignation = updates.contactDesignation !== undefined ? updates.contactDesignation : (updates.clientDesignation !== undefined ? updates.clientDesignation : (current.contact_designation || current.client_designation || ''));
  const pocName = updates.pocName !== undefined ? updates.pocName : (current.poc_name || '');
  const refererName = updates.refererName !== undefined ? updates.refererName : (current.referer_name || '');
  const contactNumber = updates.contactNumber !== undefined ? updates.contactNumber : (updates.contactPhone !== undefined ? updates.contactPhone : (current.contact_number || ''));
  const contactEmail = updates.contactEmail !== undefined ? updates.contactEmail : (current.contact_email || '');

  await sql`
    UPDATE projects SET
      name = ${name},
      client_name = ${clientName},
      contact_designation = ${contactDesignation},
      client_designation = ${contactDesignation},
      poc_name = ${pocName},
      referer_name = ${refererName},
      contact_number = ${contactNumber},
      contact_email = ${contactEmail},
      status = ${status},
      progress = ${progress},
      start_date = ${startDate},
      end_date = ${endDate},
      assignee_ids = ${assigneeIdsJson}::jsonb,
      assignee_id = ${assigneeId}
    WHERE id = ${id};
  `;

  const updated = await sql`SELECT * FROM projects WHERE id = ${id}`;
  return toProjectDto(updated[0]);
}

export async function directDeleteProject(id) {
  await sql`DELETE FROM tasks WHERE project_id = ${id}`;
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return { success: true, id };
}

// Task Operations
export async function directCreateTask(task) {
  const id = task.id && !task.id.startsWith('temp_') ? task.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const assigneeIdsJson = JSON.stringify(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  const assigneeId = (task.assigneeIds && task.assigneeIds[0]) || task.assigneeId || '';
  const projectId = task.projectId || '';
  const status = task.status || 'Not started';

  await sql`
    INSERT INTO tasks (
      id, name, project_id, status, due_date, priority, description, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${task.name || 'Task'}, ${projectId}, ${status}, ${task.dueDate || ''},
      ${task.priority || 'Medium'}, ${task.description || ''}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    );
  `;

  if (projectId) {
    await directRecalcProjectProgress(projectId);
  }

  const created = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(created[0]);
}

export async function directUpdateTask(id, updates) {
  const existing = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  const projectId = updates.projectId !== undefined ? updates.projectId : current.project_id;
  const status = updates.status !== undefined ? updates.status : current.status;
  const dueDate = updates.dueDate !== undefined ? updates.dueDate : current.due_date;
  const priority = updates.priority !== undefined ? updates.priority : current.priority;
  const description = updates.description !== undefined ? updates.description : current.description;
  const assigneeIds = updates.assigneeIds !== undefined ? updates.assigneeIds : (current.assignee_ids || []);
  const assigneeIdsJson = JSON.stringify(Array.isArray(assigneeIds) ? assigneeIds : []);
  const assigneeId = updates.assigneeId !== undefined ? updates.assigneeId : ((assigneeIds && assigneeIds[0]) || current.assignee_id || '');

  await sql`
    UPDATE tasks SET
      name = ${name},
      project_id = ${projectId},
      status = ${status},
      due_date = ${dueDate},
      priority = ${priority},
      description = ${description},
      assignee_ids = ${assigneeIdsJson}::jsonb,
      assignee_id = ${assigneeId}
    WHERE id = ${id};
  `;

  if (projectId) await directRecalcProjectProgress(projectId);
  if (current.project_id && current.project_id !== projectId) {
    await directRecalcProjectProgress(current.project_id);
  }

  const updated = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(updated[0]);
}

export async function directDeleteTask(id) {
  const existing = await sql`SELECT project_id FROM tasks WHERE id = ${id}`;
  const projectId = existing[0]?.project_id;

  await sql`DELETE FROM tasks WHERE id = ${id}`;
  if (projectId) await directRecalcProjectProgress(projectId);
  return { success: true, id };
}

// Meeting Operations
export async function directCreateMeeting(meeting) {
  const id = meeting.id || ('meet_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const attendeeIdsJson = JSON.stringify(Array.isArray(meeting.attendeeIds) ? meeting.attendeeIds : []);
  const attendeeId = (meeting.attendeeIds && meeting.attendeeIds[0]) || meeting.attendeeId || '';

  await sql`
    INSERT INTO meetings (
      id, name, date_time, status, url, attendee_ids, attendee_id
    ) VALUES (
      ${id}, ${meeting.name || 'Meeting'}, ${meeting.dateTime || ''}, ${meeting.status || 'Not started'},
      ${meeting.url || ''}, ${attendeeIdsJson}::jsonb, ${attendeeId}
    );
  `;

  const created = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  return toMeetingDto(created[0]);
}

export async function directUpdateMeeting(id, updates) {
  const existing = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const name = updates.name !== undefined ? updates.name : current.name;
  const dateTime = updates.dateTime !== undefined ? updates.dateTime : current.date_time;
  const status = updates.status !== undefined ? updates.status : current.status;
  const url = updates.url !== undefined ? updates.url : current.url;
  const attendeeIds = updates.attendeeIds !== undefined ? updates.attendeeIds : (current.attendee_ids || []);
  const attendeeIdsJson = JSON.stringify(Array.isArray(attendeeIds) ? attendeeIds : []);
  const attendeeId = updates.attendeeId !== undefined ? updates.attendeeId : ((attendeeIds && attendeeIds[0]) || current.attendee_id || '');

  await sql`
    UPDATE meetings SET
      name = ${name},
      date_time = ${dateTime},
      status = ${status},
      url = ${url},
      attendee_ids = ${attendeeIdsJson}::jsonb,
      attendee_id = ${attendeeId}
    WHERE id = ${id};
  `;

  const updated = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  return toMeetingDto(updated[0]);
}

export async function directDeleteMeeting(id) {
  await sql`DELETE FROM meetings WHERE id = ${id}`;
  return { success: true, id };
}

// Employee Operations
export async function directCreateEmployee(emp) {
  const id = emp.id || ('emp_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const isAdmin = Boolean(emp.isAdmin || (emp.role || '').toLowerCase() === 'admin');

  await sql`
    INSERT INTO employees (
      id, full_name, email, role, avatar, password_hash, is_admin
    ) VALUES (
      ${id}, ${emp.fullName}, ${emp.email.toLowerCase().trim()}, ${emp.role || 'Member'},
      ${emp.avatar || ''}, ${emp.passwordHash || ''}, ${isAdmin}
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      avatar = EXCLUDED.avatar,
      is_admin = EXCLUDED.is_admin;
  `;

  const created = await sql`SELECT * FROM employees WHERE id = ${id}`;
  return toEmployeeDto(created[0]);
}

export async function directUpdateEmployee(id, updates) {
  const existing = await sql`SELECT * FROM employees WHERE id = ${id} OR email = ${updates.email || ''}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const fullName = updates.fullName !== undefined ? updates.fullName : current.full_name;
  let role = updates.role !== undefined ? updates.role : current.role;
  const avatar = updates.avatar !== undefined ? updates.avatar : current.avatar;
  const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : current.password_hash;

  let isAdmin;
  if (updates.isAdmin !== undefined) {
    isAdmin = Boolean(updates.isAdmin);
    if (!isAdmin && (role || '').toLowerCase() === 'admin') {
      role = 'Member';
    }
  } else {
    isAdmin = Boolean(current.is_admin || (current.role || '').toLowerCase() === 'admin');
  }

  await sql`
    UPDATE employees SET
      full_name = ${fullName},
      role = ${role},
      avatar = ${avatar},
      password_hash = ${passwordHash},
      is_admin = ${isAdmin}
    WHERE id = ${current.id};
  `;

  const updated = await sql`SELECT * FROM employees WHERE id = ${current.id}`;
  return toEmployeeDto(updated[0]);
}

export async function directUpdatePassword(email, newPasswordHash) {
  const cleanEmail = email.toLowerCase().trim();
  await sql`
    UPDATE employees SET password_hash = ${newPasswordHash}
    WHERE LOWER(email) = ${cleanEmail};
  `;
  const updated = await sql`SELECT * FROM employees WHERE LOWER(email) = ${cleanEmail}`;
  return toEmployeeDto(updated[0]);
}

export async function directDeleteEmployee(id) {
  if (!id) return { success: false };
  await sql`DELETE FROM employees WHERE id = ${id}`;
  return { success: true };
}

async function directRecalcProjectProgress(projectId) {
  if (!projectId) return;
  const tasks = await sql`SELECT status FROM tasks WHERE project_id = ${projectId}`;
  if (tasks.length === 0) return;

  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const progress = doneCount / tasks.length;
  const status = progress === 1 ? 'Done' : (progress === 0 ? 'Not started' : 'In progress');

  await sql`
    UPDATE projects SET
      progress = ${progress},
      status = ${status}
    WHERE id = ${projectId};
  `;
}

// ----------------------------------------------------
// Docs Direct Operations
// ----------------------------------------------------
export async function directCreateDoc(doc) {
  const id = doc.id || ('doc_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const tagsJson = JSON.stringify(Array.isArray(doc.tags) ? doc.tags : []);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS docs (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        summary TEXT DEFAULT '',
        content TEXT DEFAULT '',
        tags JSONB DEFAULT '[]'::jsonb,
        external_url TEXT DEFAULT '',
        author_id VARCHAR(100),
        author_name TEXT DEFAULT '',
        author_role TEXT DEFAULT '',
        author_avatar TEXT DEFAULT '',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      INSERT INTO docs (id, title, category, summary, content, tags, external_url, author_id, author_name, author_role, author_avatar, is_pinned)
      VALUES (${id}, ${doc.title || ''}, ${doc.category || 'General'}, ${doc.summary || ''}, ${doc.content || ''}, ${tagsJson}::jsonb, ${doc.externalUrl || ''}, ${doc.authorId || ''}, ${doc.authorName || ''}, ${doc.authorRole || ''}, ${doc.authorAvatar || ''}, ${Boolean(doc.isPinned)})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        summary = EXCLUDED.summary,
        content = EXCLUDED.content,
        tags = EXCLUDED.tags,
        external_url = EXCLUDED.external_url,
        is_pinned = EXCLUDED.is_pinned,
        updated_at = NOW();
    `;
    const res = await sql`SELECT * FROM docs WHERE id = ${id}`;
    return toDocDto(res[0]);
  } catch (err) {
    console.warn('[neonDirect] directCreateDoc error:', err);
    return { ...doc, id };
  }
}

export async function directUpdateDoc(id, updates) {
  try {
    const res = await sql`SELECT * FROM docs WHERE id = ${id}`;
    if (res.length === 0) return directCreateDoc({ id, ...updates });
    const current = res[0];
    const title = updates.title !== undefined ? updates.title : current.title;
    const category = updates.category !== undefined ? updates.category : current.category;
    const summary = updates.summary !== undefined ? updates.summary : current.summary;
    const content = updates.content !== undefined ? updates.content : current.content;
    const tagsJson = JSON.stringify(updates.tags !== undefined ? updates.tags : (current.tags || []));
    const externalUrl = updates.externalUrl !== undefined ? updates.externalUrl : current.external_url;
    const isPinned = updates.isPinned !== undefined ? Boolean(updates.isPinned) : Boolean(current.is_pinned);

    await sql`
      UPDATE docs SET
        title = ${title},
        category = ${category},
        summary = ${summary},
        content = ${content},
        tags = ${tagsJson}::jsonb,
        external_url = ${externalUrl},
        is_pinned = ${isPinned},
        updated_at = NOW()
      WHERE id = ${id};
    `;
    const updated = await sql`SELECT * FROM docs WHERE id = ${id}`;
    return toDocDto(updated[0]);
  } catch (err) {
    console.warn('[neonDirect] directUpdateDoc error:', err);
    return { id, ...updates };
  }
}

export async function directDeleteDoc(id) {
  try {
    await sql`DELETE FROM docs WHERE id = ${id}`;
    return true;
  } catch (err) {
    console.warn('[neonDirect] directDeleteDoc error:', err);
    return false;
  }
}

