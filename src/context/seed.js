import { DEFAULT_PASSWORD_HASH } from '../utils/crypto';

// Seed data used on first load when localStorage is empty.
export const seedEmployees = [
  { id: '1', fullName: 'Swastik Kumar', email: 'swastikk005@gmail.com', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=swastik', passwordHash: DEFAULT_PASSWORD_HASH },
  { id: '2', fullName: 'Amara Patel', email: 'amara@example.com', role: 'Designer', avatar: 'https://i.pravatar.cc/150?u=amara', passwordHash: DEFAULT_PASSWORD_HASH },
  { id: '3', fullName: 'Liam Chen', email: 'liam@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=liam', passwordHash: DEFAULT_PASSWORD_HASH },
  { id: '4', fullName: 'Noor Hassan', email: 'noor@example.com', role: 'Engineer', avatar: 'https://i.pravatar.cc/150?u=noor', passwordHash: DEFAULT_PASSWORD_HASH },
  { id: '5', fullName: 'Rachel Vance', email: 'rachel@example.com', role: 'Project Manager', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', passwordHash: DEFAULT_PASSWORD_HASH }
];

export const seedProjects = [
  { id: 'p1', name: 'Public launch of iOS app', createdBy: '1', clientName: 'Apex Mobility', contactDesignation: 'VP of Product', clientDesignation: 'VP of Product', pocName: 'Sarah Jenkins', refererName: 'Michael Scott', contactNumber: '+1 (555) 234-8901', contactEmail: 'sarah.jenkins@apexmobility.io', assigneeId: '1', assigneeIds: ['1'], status: 'In progress', startDate: '2025-04-09', endDate: '2025-04-30', startValue: 0, endValue: 100, progress: 0.5 },
  { id: 'p2', name: 'Revamp new hire onboarding', createdBy: '1', clientName: 'Internal Ops', contactDesignation: 'Head of People', clientDesignation: 'Head of People', pocName: 'Emma Watson', refererName: 'Internal HR', contactNumber: '+1 (555) 872-1094', contactEmail: 'emma.watson@volvitech.internal', assigneeId: '', assigneeIds: [], status: 'Done', startDate: '2025-01-20', endDate: '2025-02-04', startValue: 0, endValue: 100, progress: 1.0 },
  { id: 'p3', name: 'Quarterly sales planning', createdBy: '1', clientName: 'Global Sales Org', contactDesignation: 'Director of RevOps', clientDesignation: 'Director of RevOps', pocName: 'David Miller', refererName: 'Partner Agency', contactNumber: '+1 (555) 439-0128', contactEmail: 'david.miller@globalsales.com', assigneeId: '', assigneeIds: [], status: 'Not started', startDate: '2025-03-24', endDate: '2025-03-28', startValue: 0, endValue: 100, progress: 0 },
  { id: 'p4', name: 'Client Portal Modernization', createdBy: '5', clientName: 'Apex Mobility', contactDesignation: 'Director of IT', clientDesignation: 'Director of IT', pocName: 'Rachel Vance', refererName: 'Sarah Jenkins', contactNumber: '+1 (555) 345-6789', contactEmail: 'rachel.vance@apexmobility.io', assigneeIds: ['2', '3', '4'], assigneeId: '2', status: 'In progress', startDate: '2025-04-01', endDate: '2025-05-15', startValue: 0, endValue: 100, progress: 0.33 }
];

export const seedTasks = [
  { id: 't1', name: 'Design homepage hero', projectId: 'p1', assigneeId: '2', assigneeIds: ['2'], status: 'In progress', dueDate: '2026-07-20', priority: 'High', description: 'New hero section with gradient.' },
  { id: 't5', name: 'iOS Beta TestFlight build', projectId: 'p1', assigneeId: '1', assigneeIds: ['1'], status: 'Done', dueDate: '2026-07-10', priority: 'High', description: 'TestFlight build submitted and approved.' },
  { id: 't2', name: 'Set up CI pipeline', projectId: 'p3', assigneeId: '3', assigneeIds: ['3'], status: 'Not started', dueDate: '2026-07-25', priority: 'Medium', description: 'GitHub Actions for lint + test.' },
  { id: 't3', name: 'Write API docs', projectId: 'p2', assigneeId: '4', assigneeIds: ['4'], status: 'Done', dueDate: '2026-07-05', priority: 'Low', description: 'Document the v1 endpoints.' },
  { id: 't4', name: 'User interview synthesis', projectId: 'p1', assigneeId: '1', assigneeIds: ['1'], status: 'In progress', dueDate: '2026-07-18', priority: 'Medium', description: 'Summarize 10 interviews.' },
  { id: 't6', name: 'Design client dashboard wireframes', projectId: 'p4', assigneeId: '2', assigneeIds: ['2'], status: 'In progress', dueDate: '2026-07-28', priority: 'High', description: 'Wireframes for client analytics overview.' },
  { id: 't7', name: 'Backend API auth service', projectId: 'p4', assigneeId: '3', assigneeIds: ['3'], status: 'Not started', dueDate: '2026-08-05', priority: 'Medium', description: 'Authentication and authorization microservice.' },
  { id: 't8', name: 'QA end-to-end integration tests', projectId: 'p4', assigneeId: '4', assigneeIds: ['4'], status: 'Not started', dueDate: '2026-08-12', priority: 'Low', description: 'Run Playwright test suite against portal endpoints.' }
];

export const seedMeetings = [
  { id: 'm1', name: 'Sprint Planning', attendeeId: '1', attendeeIds: ['1'], dateTime: '2026-07-13T09:00:00.000Z', status: 'Done', url: 'https://meet.example.com/sprint' },
  { id: 'm2', name: 'Design Review', attendeeId: '2', attendeeIds: ['2'], dateTime: '2026-07-20T14:30:00.000Z', status: 'Not started', url: '' },
  { id: 'm3', name: '1:1 with Liam', attendeeId: '3', attendeeIds: ['3'], dateTime: '2026-07-17T11:00:00.000Z', status: 'In progress', url: 'https://meet.example.com/11' },
  { id: 'm4', name: 'Client Portal Kickoff', attendeeId: '5', attendeeIds: ['5', '2', '3'], dateTime: '2026-07-22T10:00:00.000Z', status: 'Not started', url: 'https://meet.example.com/portal' }
];

export const seedData = {
  employees: seedEmployees,
  projects: seedProjects,
  tasks: seedTasks,
  meetings: seedMeetings
};
