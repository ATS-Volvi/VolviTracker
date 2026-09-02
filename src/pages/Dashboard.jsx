import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import ProjectsTable from '../components/projects/ProjectsTable';
import TasksTab from '../components/tasks/TasksTab';
import MeetingCalendar from '../components/meetings/MeetingCalendar';
import EmployeesGrid from '../components/employees/EmployeesGrid';
import StatusPieChart from '../components/widgets/StatusPieChart';
import { exportToCsv, exportToJson } from '../utils/export';

export const Dashboard = () => {
  const { projects: allProjects, tasks: allTasks, meetings: allMeetings, employees: allEmployees } = useData();
  const { addToast } = useToast();

  const [exportType, setExportType] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');

  // Filter projects by quick filter pill
  let filteredProjects = allProjects;
  if (quickFilter === 'active') {
    filteredProjects = allProjects.filter(p => p.status === 'In progress');
  } else if (quickFilter === 'done') {
    filteredProjects = allProjects.filter(p => p.status === 'Done');
  }

  // Stats
  const completedProjectsCount = allProjects.filter(p => p.status === 'Done').length;
  const inProgressProjectsCount = allProjects.filter(p => p.status === 'In progress').length;
  const notStartedProjectsCount = allProjects.filter(p => p.status === 'Not started').length;
  const overallProjectCompletion = allProjects.length > 0
    ? Math.round((completedProjectsCount / allProjects.length) * 100)
    : 0;

  const completedTasksCount = allTasks.filter(t => t.status === 'Done').length;
  const inProgressTasksCount = allTasks.filter(t => t.status === 'In progress').length;
  const notStartedTasksCount = allTasks.filter(t => t.status === 'Not started').length;
  const taskCompletionRate = allTasks.length > 0
    ? Math.round((completedTasksCount / allTasks.length) * 100)
    : 0;

  const now = new Date();
  const isSameDay = (dateStr, targetDate) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  };

  // Filter meetings occurring today
  const todayMeetings = allMeetings
    .filter(m => isSameDay(m.dateTime, now))
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  // Determine current day's active/upcoming meeting or next future meeting
  const upcomingTodayMeeting = todayMeetings.find(m => new Date(m.dateTime) >= now) || todayMeetings[0];
  const nextFutureMeeting = allMeetings
    .filter(m => new Date(m.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];

  const nextMeeting = upcomingTodayMeeting || nextFutureMeeting || null;
  const isMeetingToday = nextMeeting ? isSameDay(nextMeeting.dateTime, now) : false;

  const handleExport = (type) => {
    const data = [
      ...filteredProjects,
      ...allTasks,
      ...allMeetings,
      ...allEmployees
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {/* Card 1: Projects Status Pie Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects</span>
            <span className="text-xs font-bold bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full">{inProgressProjectsCount} active</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="w-[50%] flex justify-center items-center py-1">
              <StatusPieChart
                notStarted={notStartedProjectsCount}
                inProgress={inProgressProjectsCount}
                done={completedProjectsCount}
                size={110}
                strokeWidth={9.5}
              />
            </div>
            <div className="w-[50%] min-w-0 space-y-2 pl-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-xs truncate font-medium">Done</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{completedProjectsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-xs truncate font-medium">In progress</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{inProgressProjectsCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="text-xs truncate font-medium">Not started</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{notStartedProjectsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Tasks Status Pie Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks</span>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">{taskCompletionRate}% done</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="w-[50%] flex justify-center items-center py-1">
              <StatusPieChart
                notStarted={notStartedTasksCount}
                inProgress={inProgressTasksCount}
                done={completedTasksCount}
                size={110}
                strokeWidth={9.5}
              />
            </div>
            <div className="w-[50%] min-w-0 space-y-2 pl-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-xs truncate font-medium">Done</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{completedTasksCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-xs truncate font-medium">In progress</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{inProgressTasksCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 truncate text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="text-xs truncate font-medium">Not started</span>
                </span>
                <span className="font-bold text-gray-900 text-sm">{notStartedTasksCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Upcoming Meeting */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next Sync</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isMeetingToday
                ? 'bg-indigo-50 text-indigo-600'
                : nextMeeting
                ? 'bg-slate-100 text-slate-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {isMeetingToday
                ? (todayMeetings.length > 1 ? `${todayMeetings.length} Today` : 'Today')
                : nextMeeting
                ? new Date(nextMeeting.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'All clear'}
            </span>
          </div>

          {/* Scrollable Meeting Syncs Container */}
          <div className="my-2.5 max-h-[96px] overflow-y-auto pr-1.5 space-y-2.5 divide-y divide-gray-100/90 custom-scrollbar">
            {todayMeetings.length > 0 ? (
              todayMeetings.map((m, idx) => {
                const meetingUrl = m.url ? (m.url.startsWith('http://') || m.url.startsWith('https://') ? m.url : `https://${m.url}`) : null;
                return (
                  <div key={m.id || idx} className={idx > 0 ? 'pt-2' : ''}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-bold text-sm text-gray-900 flex-1" title={m.name}>
                        {m.name}
                      </span>
                      {meetingUrl && (
                        <a
                          href={meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:text-indigo-800 p-0.5 rounded-md hover:bg-indigo-50 transition shrink-0"
                          title="Open meeting link in new tab"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 font-medium truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      <span>{new Date(m.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            ) : nextMeeting ? (
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-bold text-sm text-gray-900 flex-1" title={nextMeeting.name}>
                    {nextMeeting.name}
                  </span>
                  {nextMeeting.url && (
                    <a
                      href={nextMeeting.url.startsWith('http://') || nextMeeting.url.startsWith('https://') ? nextMeeting.url : `https://${nextMeeting.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-500 hover:text-indigo-800 p-0.5 rounded-md hover:bg-indigo-50 transition shrink-0"
                      title="Open meeting link in new tab"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-gray-500 font-medium truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                  <span>
                    {new Date(nextMeeting.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ({new Date(nextMeeting.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-xs text-gray-500 font-medium">
                No meetings scheduled today. All clear!
              </div>
            )}
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('meetings-calendar-section');
              if (el) {
                const yOffset = -80;
                const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }}
            className="text-[11px] text-indigo-600 font-semibold hover:underline text-left pt-1"
          >
            {todayMeetings.length > 0 || nextMeeting ? 'View in calendar →' : 'View calendar →'}
          </button>
        </div>

        {/* Card 4: Team Members */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Capacity</span>
            <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">{allEmployees.length} online</span>
          </div>
          <div className="my-auto py-2">
            <div className="flex items-center -space-x-2 overflow-hidden">
              {allEmployees.slice(0, 5).map(e => (
                <img
                  key={e.id}
                  src={e.avatar}
                  alt={e.fullName}
                  className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-2xs"
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">100% capacity available</div>
        </div>
      </div>

      {/* Primary Projects Section (Full Edge-to-Edge Width) */}
      <section className="w-full">
        <ProjectsTable projects={filteredProjects} />
      </section>

      {/* Secondary Dashboard Modules (Tasks, Meetings, Employees) */}
      <div className="pt-6 border-t border-gray-200/70 space-y-6 w-full">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
          <TasksTab tasks={allTasks} heading="Tasks Tracker" />
          <div id="meetings-calendar-section" className="scroll-mt-24">
            <MeetingCalendar meetings={allMeetings} />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200/70 w-full">
          <EmployeesGrid employees={allEmployees} />
        </div>
      </div>

      {/* Footer / Summary Stats */}
      <div className="pt-4 pb-8 text-center text-xs text-gray-400">
        {filteredProjects.length} projects · {allTasks.length} tasks · {allMeetings.length} meetings · {allEmployees.length} employees
      </div>
    </div>
  );
};

export default Dashboard;