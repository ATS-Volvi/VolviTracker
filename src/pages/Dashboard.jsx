import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import ProjectsTable from '../components/projects/ProjectsTable';
import TasksTab from '../components/tasks/TasksTab';
import MeetingCalendar from '../components/meetings/MeetingCalendar';
import EmployeesGrid from '../components/employees/EmployeesGrid';
import FilterControls from '../components/widgets/FilterControls';
import { exportToCsv, exportToJson } from '../utils/export';

export const Dashboard = () => {
  const { projects: allProjects, tasks: allTasks, meetings: allMeetings, employees: allEmployees } = useData();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({ projectStatus: '', taskPriority: '', employeeRole: '' });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exportType, setExportType] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');

  // Filter functions
  const isWithinRange = (dateStr, range) => {
    if (!dateStr) return true;
    if (!range.start && !range.end) return true;
    const d = new Date(dateStr);
    const start = range.start ? new Date(range.start) : null;
    const end = range.end ? new Date(range.end) : null;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  // Apply all filters
  let filteredProjects = allProjects.filter(p =>
    (!filters.projectStatus || p.status === filters.projectStatus)
  );

  if (quickFilter === 'active') {
    filteredProjects = filteredProjects.filter(p => p.status === 'In progress');
  } else if (quickFilter === 'done') {
    filteredProjects = filteredProjects.filter(p => p.status === 'Done');
  }

  const filteredTasks = allTasks.filter(t =>
    (!filters.taskPriority || t.priority === filters.taskPriority) &&
    isWithinRange(t.dueDate, dateRange)
  );
  const filteredMeetings = allMeetings.filter(m =>
    isWithinRange(m.dateTime, dateRange)
  );
  const filteredEmployees = allEmployees.filter(e =>
    (!filters.employeeRole || (e.role || '') === filters.employeeRole)
  );

  // Stats
  const completedProjectsCount = allProjects.filter(p => p.status === 'Done').length;
  const inProgressProjectsCount = allProjects.filter(p => p.status === 'In progress').length;
  const overallProjectCompletion = allProjects.length > 0
    ? Math.round((completedProjectsCount / allProjects.length) * 100)
    : 0;

  const completedTasksCount = allTasks.filter(t => t.status === 'Done').length;
  const taskCompletionRate = allTasks.length > 0
    ? Math.round((completedTasksCount / allTasks.length) * 100)
    : 0;

  const upcomingMeetings = [...allMeetings].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  const nextMeeting = upcomingMeetings[0];

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = (type) => {
    const data = [
      ...filteredProjects,
      ...filteredTasks,
      ...filteredMeetings,
      ...filteredEmployees
    ].map(item => ({ ...item, type: item.constructor?.name || 'Item' }));
    if (type === 'csv') {
      exportToCsv(data, `tracker-export-${Date.now()}.csv`);
      addToast('Exported CSV file successfully!', 'success');
    } else {
      exportToJson(data);
      addToast('Exported JSON file successfully!', 'success');
    }
    setExportType(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-3 sm:px-6 py-6 space-y-6">
      {/* Top Main Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Volvitech Planner
          </h1>
          <p className="text-xs text-gray-500 mt-1">Live enterprise workspace & real-time project management</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick filter pills */}
          <div className="hidden md:flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
            <button
              onClick={() => { setQuickFilter('all'); addToast('Viewing all projects', 'info'); }}
              className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'}`}
            >
              All ({allProjects.length})
            </button>
            <button
              onClick={() => { setQuickFilter('active'); addToast('Filtered: Active in progress', 'info'); }}
              className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'active' ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-gray-900'}`}
            >
              Active ({inProgressProjectsCount})
            </button>
            <button
              onClick={() => { setQuickFilter('done'); addToast('Filtered: Completed projects', 'info'); }}
              className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'done' ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-gray-900'}`}
            >
              Done ({completedProjectsCount})
            </button>
          </div>

          <div className="relative">
            <button
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              onClick={() => setExportType(exportType === 'menu' ? null : 'menu')}
            >
              <span>Export</span>
              <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {exportType === 'menu' && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-gray-200 rounded-xl shadow-xl z-20 text-xs py-1 animate-slide-up">
                <button
                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                  onClick={() => handleExport('csv')}
                >
                  <span>📊</span> Export CSV
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                  onClick={() => handleExport('json')}
                >
                  <span>📦</span> Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subheader Banner (as shown in the mockup) */}
      <div className="w-full bg-[#F8F9FA] border border-gray-200/70 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-[#4B5563] shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-base" role="img" aria-label="briefcase">💼</span>
          <span className="font-normal text-gray-700">Planner/tracker for all the employees</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Workspace Live</span>
        </div>
      </div>

      {/* Dynamic Live KPI Stat Cards - Full Width */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Projects Completed */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects</span>
            <span className="text-xs font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">{inProgressProjectsCount} active</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{allProjects.length}</span>
            <span className="text-xs text-gray-500">total projects</span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${overallProjectCompletion}%` }} />
          </div>
        </div>

        {/* Card 2: Task Completion */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{taskCompletionRate}% done</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">{completedTasksCount}/{allTasks.length}</span>
            <span className="text-xs text-gray-500">completed</span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        {/* Card 3: Upcoming Meeting */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next Sync</span>
            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div className="mt-2 truncate font-bold text-sm text-gray-800">
            {nextMeeting ? nextMeeting.name : 'No meetings'}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 truncate">
            {nextMeeting?.dateTime ? new Date(nextMeeting.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'All clear'}
          </div>
        </div>

        {/* Card 4: Team Members */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Capacity</span>
            <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{allEmployees.length} online</span>
          </div>
          <div className="mt-2 flex items-center -space-x-1.5 overflow-hidden pt-1">
            {allEmployees.slice(0, 4).map(e => (
              <img
                key={e.id}
                src={e.avatar}
                alt={e.fullName}
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
              />
            ))}
          </div>
          <div className="mt-2 text-[11px] text-gray-500">100% capacity available</div>
        </div>
      </div>

      {/* Primary Projects Section (Full Edge-to-Edge Width) */}
      <section className="w-full">
        <ProjectsTable projects={filteredProjects} />
      </section>

      {/* Secondary Dashboard Modules (Tasks, Meetings, Employees) */}
      <div className="pt-6 border-t border-gray-200/70 space-y-6 w-full">
        {/* Filter Controls */}
        <FilterControls
          onFilterChange={handleFilterChange}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
          <TasksTab tasks={filteredTasks} heading="Tasks Tracker" />
          <MeetingCalendar meetings={filteredMeetings} />
        </div>

        <div className="w-full">
          <EmployeesGrid employees={filteredEmployees} />
        </div>
      </div>

      {/* Footer / Summary Stats */}
      <div className="pt-4 pb-8 text-center text-xs text-gray-400">
        {filteredProjects.length} projects · {filteredTasks.length} tasks · {filteredMeetings.length} meetings · {filteredEmployees.length} employees
      </div>
    </div>
  );
};

export default Dashboard;