import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('[DB] Error: DATABASE_URL is not defined in environment variables.');
}

export const sql = neon(dbUrl);

// Transform DB snake_case to frontend camelCase
export const toEmployeeDto = (row) => row ? ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role || 'Member',
  avatar: row.avatar || '',
  passwordHash: row.password_hash || ''
}) : null;

export const toProjectDto = (row) => row ? ({
  id: row.id,
  name: row.name,
  status: row.status || 'Not started',
  startDate: row.start_date || '',
  endDate: row.end_date || '',
  startValue: Number(row.start_value) || 0,
  endValue: Number(row.end_value) || 100,
  progress: Number(row.progress) || 0,
  assigneeIds: Array.isArray(row.assignee_ids) ? row.assignee_ids : (row.assignee_ids ? JSON.parse(row.assignee_ids) : []),
  assigneeId: row.assignee_id || ''
}) : null;

export const toTaskDto = (row) => row ? ({
  id: row.id,
  name: row.name,
  projectId: row.project_id || '',
  status: row.status || 'Not started',
  dueDate: row.due_date || '',
  priority: row.priority || 'Medium',
  description: row.description || '',
  assigneeIds: Array.isArray(row.assignee_ids) ? row.assignee_ids : (row.assignee_ids ? JSON.parse(row.assignee_ids) : []),
  assigneeId: row.assignee_id || ''
}) : null;

export const toMeetingDto = (row) => row ? ({
  id: row.id,
  name: row.name,
  dateTime: row.date_time || '',
  status: row.status || 'Not started',
  url: row.url || '',
  attendeeIds: Array.isArray(row.attendee_ids) ? row.attendee_ids : (row.attendee_ids ? JSON.parse(row.attendee_ids) : []),
  attendeeId: row.attendee_id || ''
}) : null;

let isInitialized = false;

// Initialize database schema tables & seed if empty
export async function initDb() {
  if (isInitialized) return;

  try {
    // 1. Employees Table
    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(100) PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'Member',
        avatar TEXT DEFAULT '',
        password_hash TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Projects Table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Not started',
        start_date TEXT,
        end_date TEXT,
        start_value NUMERIC DEFAULT 0,
        end_value NUMERIC DEFAULT 100,
        progress NUMERIC DEFAULT 0,
        assignee_ids JSONB DEFAULT '[]'::jsonb,
        assignee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 3. Tasks Table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        project_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Not started',
        due_date TEXT,
        priority VARCHAR(50) DEFAULT 'Medium',
        description TEXT DEFAULT '',
        assignee_ids JSONB DEFAULT '[]'::jsonb,
        assignee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 4. Meetings Table
    await sql`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        date_time TEXT,
        status VARCHAR(50) DEFAULT 'Not started',
        url TEXT DEFAULT '',
        attendee_ids JSONB DEFAULT '[]'::jsonb,
        attendee_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Check if initial seeding is needed
    const empCount = await sql`SELECT COUNT(*)::int as count FROM employees;`;
    if (empCount[0]?.count === 0) {
      console.log('[DB] Seeding initial data into Neon PostgreSQL...');
      // Seed default admin and team
      const DEFAULT_PASSWORD_HASH = '380693a778c772cb3353ef69b359f5ffad2e95a7ba9bb31ea41c6d3dfd71c4c1'; // SHA-256 for 'swastik'
      
      await sql`
        INSERT INTO employees (id, full_name, email, role, avatar, password_hash) VALUES
        ('1', 'Swastik Kumar', 'swastikk005@gmail.com', 'Admin', 'https://i.pravatar.cc/150?u=swastik', ${DEFAULT_PASSWORD_HASH}),
        ('2', 'Amara Patel', 'amara@example.com', 'Designer', 'https://i.pravatar.cc/150?u=amara', ${DEFAULT_PASSWORD_HASH}),
        ('3', 'Liam Chen', 'liam@example.com', 'Engineer', 'https://i.pravatar.cc/150?u=liam', ${DEFAULT_PASSWORD_HASH}),
        ('4', 'Noor Hassan', 'noor@example.com', 'Engineer', 'https://i.pravatar.cc/150?u=noor', ${DEFAULT_PASSWORD_HASH})
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO projects (id, name, assignee_id, assignee_ids, status, start_date, end_date, start_value, end_value, progress) VALUES
        ('p1', 'Public launch of iOS app', '1', '["1"]'::jsonb, 'In progress', '2025-04-09', '2025-04-30', 0, 100, 0.5),
        ('p2', 'Revamp new hire onboarding', '', '[]'::jsonb, 'Done', '2025-01-20', '2025-02-04', 0, 100, 1.0),
        ('p3', 'Quarterly sales planning', '', '[]'::jsonb, 'Not started', '2025-03-24', '2025-03-28', 0, 100, 0)
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO tasks (id, name, project_id, assignee_id, assignee_ids, status, due_date, priority, description) VALUES
        ('t1', 'Design homepage hero', 'p1', '2', '["2"]'::jsonb, 'In progress', '2026-07-20', 'High', 'New hero section with gradient.'),
        ('t5', 'iOS Beta TestFlight build', 'p1', '1', '["1"]'::jsonb, 'Done', '2026-07-10', 'High', 'TestFlight build submitted and approved.'),
        ('t2', 'Set up CI pipeline', 'p3', '3', '["3"]'::jsonb, 'Not started', '2026-07-25', 'Medium', 'GitHub Actions for lint + test.'),
        ('t3', 'Write API docs', 'p2', '4', '["4"]'::jsonb, 'Done', '2026-07-05', 'Low', 'Document the v1 endpoints.'),
        ('t4', 'User interview synthesis', 'p1', '1', '["1"]'::jsonb, 'In progress', '2026-07-18', 'Medium', 'Summarize 10 interviews.')
        ON CONFLICT (id) DO NOTHING;
      `;

      await sql`
        INSERT INTO meetings (id, name, attendee_id, attendee_ids, date_time, status, url) VALUES
        ('m1', 'Sprint Planning', '1', '["1"]'::jsonb, '2026-07-13T09:00:00.000Z', 'Done', 'https://meet.example.com/sprint'),
        ('m2', 'Design Review', '2', '["2"]'::jsonb, '2026-07-20T14:30:00.000Z', 'Not started', ''),
        ('m3', '1:1 with Liam', '3', '["3"]'::jsonb, '2026-07-17T11:00:00.000Z', 'In progress', 'https://meet.example.com/11')
        ON CONFLICT (id) DO NOTHING;
      `;
      console.log('[DB] Seeding completed successfully.');
    }

    isInitialized = true;
    console.log('[DB] Neon PostgreSQL schema ready.');
  } catch (err) {
    console.error('[DB] Schema initialization error:', err);
    throw err;
  }
}

// Data retrieval for client hydration
export async function getBootstrapData() {
  await initDb();
  const [empRows, projRows, taskRows, meetRows] = await Promise.all([
    sql`SELECT * FROM employees ORDER BY created_at ASC`,
    sql`SELECT * FROM projects ORDER BY created_at ASC`,
    sql`SELECT * FROM tasks ORDER BY created_at ASC`,
    sql`SELECT * FROM meetings ORDER BY created_at ASC`
  ]);

  return {
    employees: empRows.map(toEmployeeDto),
    projects: projRows.map(toProjectDto),
    tasks: taskRows.map(toTaskDto),
    meetings: meetRows.map(toMeetingDto)
  };
}

// Project Operations
export async function createProjectRecord(project, tasks = []) {
  await initDb();
  const id = project.id || ('proj_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const assigneeIdsJson = JSON.stringify(Array.isArray(project.assigneeIds) ? project.assigneeIds : []);
  const assigneeId = (project.assigneeIds && project.assigneeIds[0]) || project.assigneeId || '';
  
  // Calculate progress based on tasks if present
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
      ${id}, ${project.name}, ${status}, ${project.startDate || ''}, ${project.endDate || ''},
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

  // Insert or update bundled tasks
  for (const t of tasks) {
    const tId = t.id && !t.id.startsWith('temp_') ? t.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
    const tAssigneeIdsJson = JSON.stringify(Array.isArray(t.assigneeIds) ? t.assigneeIds : []);
    const tAssigneeId = (t.assigneeIds && t.assigneeIds[0]) || t.assigneeId || '';

    await sql`
      INSERT INTO tasks (
        id, name, project_id, status, due_date, priority, description, assignee_ids, assignee_id
      ) VALUES (
        ${tId}, ${t.name}, ${id}, ${t.status || 'Not started'}, ${t.dueDate || ''},
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

export async function updateProjectRecord(id, updates) {
  await initDb();
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

export async function deleteProjectRecord(id) {
  await initDb();
  await sql`DELETE FROM tasks WHERE project_id = ${id}`;
  await sql`DELETE FROM projects WHERE id = ${id}`;
  return { success: true };
}

// Task Operations
export async function createTaskRecord(task) {
  await initDb();
  const id = task.id && !task.id.startsWith('temp_') ? task.id : ('task_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const assigneeIdsJson = JSON.stringify(Array.isArray(task.assigneeIds) ? task.assigneeIds : []);
  const assigneeId = (task.assigneeIds && task.assigneeIds[0]) || task.assigneeId || '';
  const projectId = task.projectId || '';
  const status = task.status || 'Not started';

  await sql`
    INSERT INTO tasks (
      id, name, project_id, status, due_date, priority, description, assignee_ids, assignee_id
    ) VALUES (
      ${id}, ${task.name}, ${projectId}, ${status}, ${task.dueDate || ''},
      ${task.priority || 'Medium'}, ${task.description || ''}, ${assigneeIdsJson}::jsonb, ${assigneeId}
    );
  `;

  // Auto-recalculate project progress if associated with a project
  if (projectId) {
    await recalcProjectProgress(projectId);
  }

  const created = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(created[0]);
}

export async function updateTaskRecord(id, updates) {
  await initDb();
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

  if (projectId) await recalcProjectProgress(projectId);
  if (current.project_id && current.project_id !== projectId) {
    await recalcProjectProgress(current.project_id);
  }

  const updated = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  return toTaskDto(updated[0]);
}

export async function deleteTaskRecord(id) {
  await initDb();
  const existing = await sql`SELECT project_id FROM tasks WHERE id = ${id}`;
  const projectId = existing[0]?.project_id;

  await sql`DELETE FROM tasks WHERE id = ${id}`;
  if (projectId) await recalcProjectProgress(projectId);
  return { success: true };
}

// Meeting Operations
export async function createMeetingRecord(meeting) {
  await initDb();
  const id = meeting.id || ('meet_' + Date.now() + Math.random().toString(36).substring(2, 6));
  const attendeeIdsJson = JSON.stringify(Array.isArray(meeting.attendeeIds) ? meeting.attendeeIds : []);
  const attendeeId = (meeting.attendeeIds && meeting.attendeeIds[0]) || meeting.attendeeId || '';

  await sql`
    INSERT INTO meetings (
      id, name, date_time, status, url, attendee_ids, attendee_id
    ) VALUES (
      ${id}, ${meeting.name}, ${meeting.dateTime || ''}, ${meeting.status || 'Not started'},
      ${meeting.url || ''}, ${attendeeIdsJson}::jsonb, ${attendeeId}
    );
  `;

  const created = await sql`SELECT * FROM meetings WHERE id = ${id}`;
  return toMeetingDto(created[0]);
}

export async function updateMeetingRecord(id, updates) {
  await initDb();
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

export async function deleteMeetingRecord(id) {
  await initDb();
  await sql`DELETE FROM meetings WHERE id = ${id}`;
  return { success: true };
}

// Employee Operations
export async function createEmployeeRecord(emp) {
  await initDb();
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

export async function updateEmployeeRecord(id, updates) {
  await initDb();
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

export async function updatePasswordByEmail(email, newPasswordHash) {
  await initDb();
  const cleanEmail = email.toLowerCase().trim();
  await sql`
    UPDATE employees SET password_hash = ${newPasswordHash}
    WHERE LOWER(email) = ${cleanEmail};
  `;
  const updated = await sql`SELECT * FROM employees WHERE LOWER(email) = ${cleanEmail}`;
  return toEmployeeDto(updated[0]);
}

// Helper: Calculate project progress from its tasks in DB
async function recalcProjectProgress(projectId) {
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
