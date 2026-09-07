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
  passwordHash: row.password_hash || ''
}) : null;

export const toProjectDto = (row) => row ? ({
  id: String(row.id),
  name: row.name || '',
  status: row.status || 'Not started',
  startDate: row.start_date || '',
  endDate: row.end_date || '',
  startValue: Number(row.start_value) || 0,
  endValue: Number(row.end_value) || 100,
  progress: Number(row.progress) || 0,
  assigneeIds: Array.isArray(row.assignee_ids) ? row.assignee_ids : (row.assignee_ids ? (typeof row.assignee_ids === 'string' ? JSON.parse(row.assignee_ids) : []) : []),
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
  assigneeIds: Array.isArray(row.assignee_ids) ? row.assignee_ids : (row.assignee_ids ? (typeof row.assignee_ids === 'string' ? JSON.parse(row.assignee_ids) : []) : []),
  assigneeId: row.assignee_id ? String(row.assignee_id) : ''
}) : null;

export const toMeetingDto = (row) => row ? ({
  id: String(row.id),
  name: row.name || '',
  dateTime: row.date_time || '',
  status: row.status || 'Not started',
  url: row.url || '',
  attendeeIds: Array.isArray(row.attendee_ids) ? row.attendee_ids : (row.attendee_ids ? (typeof row.attendee_ids === 'string' ? JSON.parse(row.attendee_ids) : []) : []),
  attendeeId: row.attendee_id ? String(row.attendee_id) : ''
}) : null;

// Bootstrap Data from Neon DB
export async function directGetBootstrapData() {
  const [empRows, projRows, taskRows, meetRows] = await Promise.all([
    sql`SELECT * FROM employees ORDER BY created_at ASC`,
    sql`SELECT * FROM projects ORDER BY created_at ASC`,
    sql`SELECT * FROM tasks ORDER BY created_at ASC`,
    sql`SELECT * FROM meetings ORDER BY created_at ASC`
  ]);

  return {
    employees: empRows.map(toEmployeeDto).filter(Boolean),
    projects: projRows.map(toProjectDto).filter(Boolean),
    tasks: taskRows.map(toTaskDto).filter(Boolean),
    meetings: meetRows.map(toMeetingDto).filter(Boolean)
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

  await sql`
    INSERT INTO projects (
      id, name, status, start_date, end_date, start_value, end_value, progress, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${project.name || 'Untitled Project'}, ${status}, ${project.startDate || ''}, ${project.endDate || ''},
      0, 100, ${progress}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
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

  await sql`
    UPDATE projects SET
      name = ${name},
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

  await sql`
    INSERT INTO employees (
      id, full_name, email, role, avatar, password_hash
    ) VALUES (
      ${id}, ${emp.fullName}, ${emp.email.toLowerCase().trim()}, ${emp.role || 'Member'},
      ${emp.avatar || ''}, ${emp.passwordHash || ''}
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      avatar = EXCLUDED.avatar;
  `;

  const created = await sql`SELECT * FROM employees WHERE id = ${id}`;
  return toEmployeeDto(created[0]);
}

export async function directUpdateEmployee(id, updates) {
  const existing = await sql`SELECT * FROM employees WHERE id = ${id} OR email = ${updates.email || ''}`;
  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const fullName = updates.fullName !== undefined ? updates.fullName : current.full_name;
  const role = updates.role !== undefined ? updates.role : current.role;
  const avatar = updates.avatar !== undefined ? updates.avatar : current.avatar;
  const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : current.password_hash;

  await sql`
    UPDATE employees SET
      full_name = ${fullName},
      role = ${role},
      avatar = ${avatar},
      password_hash = ${passwordHash}
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
