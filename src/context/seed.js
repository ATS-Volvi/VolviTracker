// Seed data used on first load when localStorage is empty.
export const seedEmployees = [
  { id: '1', fullName: 'Swastik Kumar', email: 'swastikk005@gmail.com', role: 'Product Lead', avatar: 'https://i.pravatar.cc/150?u=swastik' },
  { id: '2', fullName: 'Amara Patel', email: 'amara@example.com', role: 'Designer', avatar: 'https://i.pravatar.cc/150?u=amara' },
  { id: '3', fullName: 'Liam Chen', email: 'liam@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=liam' },
  { id: '4', fullName: 'Noor Hassan', email: 'noor@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=noor' }
];

export const seedProjects = [
  { id: 'p1', name: 'Public launch of iOS app', assigneeId: '1', status: 'In progress', startDate: '2025-04-09', endDate: '2025-04-30', startValue: 50, endValue: 100, progress: 0.5 },
  { id: 'p2', name: 'Revamp new hire onboarding', assigneeId: '', status: 'Done', startDate: '2025-01-20', endDate: '2025-02-04', startValue: 100, endValue: 100, progress: 1.0 },
  { id: 'p3', name: 'Quarterly sales planning', assigneeId: '', status: 'Not started', startDate: '2025-03-24', endDate: '2025-03-28', startValue: 0, endValue: 100, progress: 0 }
];

export const seedTasks = [
  { id: 't1', name: 'Design homepage hero', assigneeId: '2', status: 'In progress', dueDate: '2026-07-20', priority: 'High', description: 'New hero section with gradient.' },
  { id: 't2', name: 'Set up CI pipeline', assigneeId: '3', status: 'Not started', dueDate: '2026-07-25', priority: 'Medium', description: 'GitHub Actions for lint + test.' },
  { id: 't3', name: 'Write API docs', assigneeId: '4', status: 'Done', dueDate: '2026-07-05', priority: 'Low', description: 'Document the v1 endpoints.' },
  { id: 't4', name: 'User interview synthesis', assigneeId: '1', status: 'In progress', dueDate: '2026-07-18', priority: 'Medium', description: 'Summarize 10 interviews.' }
];

export const seedMeetings = [
  { id: 'm1', name: 'Sprint Planning', attendeeId: '1', dateTime: '2026-07-13T09:00:00.000Z', status: 'Done', url: 'https://meet.example.com/sprint' },
  { id: 'm2', name: 'Design Review', attendeeId: '2', dateTime: '2026-07-20T14:30:00.000Z', status: 'Not started', url: '' },
  { id: 'm3', name: '1:1 with Liam', attendeeId: '3', dateTime: '2026-07-17T11:00:00.000Z', status: 'In progress', url: 'https://meet.example.com/11' }
];

export const seedData = {
  employees: seedEmployees,
  projects: seedProjects,
  tasks: seedTasks,
  meetings: seedMeetings
};
