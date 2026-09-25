import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import ProjectsTable from '../components/projects/ProjectsTable';
import TasksTab from '../components/tasks/TasksTab';
import MeetingCalendar from '../components/meetings/MeetingCalendar';
import MeetingList from '../components/meetings/MeetingList';
import EmployeesGrid from '../components/employees/EmployeesGrid';
import EditEmployeeModal from '../components/employees/EditEmployeeModal';
import StatusPieChart from '../components/widgets/StatusPieChart';
import Avatar from '../components/widgets/Avatar';
import { exportToCsv, exportToJson } from '../utils/export';

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const {
    projects: rawProjects,
    tasks: rawTasks,
    meetings: rawMeetings,
    employees: rawEmployees,
    getEmployee,
    updateEmployee
  } = useData();

  const allProjects = Array.isArray(rawProjects) ? rawProjects : [];
  const allTasks = Array.isArray(rawTasks) ? rawTasks : [];
  const allMeetings = Array.isArray(rawMeetings) ? rawMeetings : [];
  const allEmployees = Array.isArray(rawEmployees) ? rawEmployees : [];
  const { addToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab');
  const activeTab = currentTabParam === 'personal' || currentTabParam === 'my' ? 'personal' : 'planner';

  const handleTabChange = (tabName) => {
    if (tabName === 'personal') {
      setSearchParams({ tab: 'personal' });
    } else {
      setSearchParams({});
    }
  };

  const [exportType, setExportType] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');

  // Admin's own employee record & custom properties
  const currentEmp = getEmployee(user?.id) || user;
  const [props, setProps] = useState([]);
  const [comment, setComment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (currentEmp && Array.isArray(currentEmp.properties)) {
      setProps(currentEmp.properties);
    } else {
      setProps([]);
    }
  }, [currentEmp?.properties]);

  const handleAddProperty = () => {
    const v = window.prompt('Add a property (e.g. Department: Engineering, Location: New York)');
    if (v && v.trim()) {
      const cleanVal = v.trim();
      const currentProps = Array.isArray(currentEmp?.properties) ? currentEmp.properties : props;
      const nextProps = [...currentProps, cleanVal];
      setProps(nextProps);
      if (updateEmployee && user?.id) {
        updateEmployee(user.id, { properties: nextProps });
      }
      addToast(`Added property: "${cleanVal}"`, 'success', 2000);
    }
  };

  const handleRemoveProperty = (idxToRemove) => {
    const currentProps = Array.isArray(currentEmp?.properties) ? currentEmp.properties : props;
    const nextProps = currentProps.filter((_, i) => i !== idxToRemove);
    setProps(nextProps);
    if (updateEmployee && user?.id) {
      updateEmployee(user.id, { properties: nextProps });
    }
    addToast('Property removed', 'info', 2000);
  };

  const handleSaveProperties = (updates) => {
    if (updateEmployee && user?.id) {
      updateEmployee(user.id, updates);
    }
  };

  // Filter personal items assigned to the current admin
  const myProjects = allProjects.filter(p => {
    const isProjectAssignee =
      (Array.isArray(p.assigneeIds) && p.assigneeIds.some(aid => String(aid) === String(user?.id))) ||
      String(p.assigneeId) === String(user?.id);
    const hasAssignedTask = allTasks.some(
      t => String(t.projectId) === String(p.id) &&
      ((Array.isArray(t.assigneeIds) && t.assigneeIds.some(aid => String(aid) === String(user?.id))) || String(t.assigneeId) === String(user?.id))
    );
    return isProjectAssignee || hasAssignedTask;
  });

  const myTasks = allTasks.filter(t => {
    const isDirectlyAssigned = (Array.isArray(t.assigneeIds) && t.assigneeIds.some(aid => String(aid) === String(user?.id))) ||
      String(t.assigneeId) === String(user?.id);
    if (isDirectlyAssigned) return true;

    // Include unassigned tasks in user's assigned projects
    const isUnassigned = (!t.assigneeId || t.assigneeId === '') && (!Array.isArray(t.assigneeIds) || t.assigneeIds.length === 0);
    const isInMyProject = myProjects.some(p => String(p.id) === String(t.projectId));
    return isUnassigned && isInMyProject;
  });

  const myMeetings = allMeetings.filter(m => {
    if (Array.isArray(m.attendeeIds)) return m.attendeeIds.some(aid => String(aid) === String(user?.id));
    return String(m.attendeeId) === String(user?.id);
  });

  // Filter projects by quick filter pill
  let filteredProjects = allProjects;
  if (quickFilter === 'active') {
    filteredProjects = allProjects.filter(p => p.status === 'In progress');
  } else if (quickFilter === 'done') {
    filteredProjects = allProjects.filter(p => p.status === 'Done');
  } else if (quickFilter === 'mine') {
    filteredProjects = myProjects;
  }

  // Company-wide Stats
  const completedProjectsCount = allProjects.filter(p => p.status === 'Done').length;
  const inProgressProjectsCount = allProjects.filter(p => p.status === 'In progress').length;
  const notStartedProjectsCount = allProjects.filter(p => p.status === 'Not started').length;

  const completedTasksCount = allTasks.filter(t => t.status === 'Done').length;
  const inProgressTasksCount = allTasks.filter(t => t.status === 'In progress').length;
  const notStartedTasksCount = allTasks.filter(t => t.status === 'Not started').length;
  const taskCompletionRate = allTasks.length > 0
    ? Math.round((completedTasksCount / allTasks.length) * 100)
    : 0;

  // Personal Stats
  const myCompletedProjectsCount = myProjects.filter(p => p.status === 'Done').length;
  const myInProgressProjectsCount = myProjects.filter(p => p.status === 'In progress').length;
  const myCompletedTasksCount = myTasks.filter(t => t.status === 'Done').length;
  const myInProgressTasksCount = myTasks.filter(t => t.status === 'In progress').length;
  const myTaskCompletionRate = myTasks.length > 0
    ? Math.round((myCompletedTasksCount / myTasks.length) * 100)
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

  const upcomingTodayMeeting = todayMeetings.find(m => new Date(m.dateTime) >= now) || todayMeetings[0];
  const nextFutureMeeting = allMeetings
    .filter(m => new Date(m.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];

  const nextMeeting = upcomingTodayMeeting || nextFutureMeeting || null;
  const isMeetingToday = nextMeeting ? isSameDay(nextMeeting.dateTime, now) : false;

  const handleExport = (type) => {
    const targetProjects = activeTab === 'personal' ? myProjects : filteredProjects;
    const targetTasks = activeTab === 'personal' ? myTasks : allTasks;
    const targetMeetings = activeTab === 'personal' ? myMeetings : allMeetings;
    const targetEmployees = activeTab === 'personal' ? [currentEmp] : allEmployees;

    const data = [
      ...targetProjects,
      ...targetTasks,
      ...targetMeetings,
      ...targetEmployees
    ].map(item => ({ ...item, type: item.constructor?.name || 'Item' }));
    if (type === 'csv') {
      exportToCsv(data, `projects-export-${Date.now()}.csv`);
      addToast('Exported CSV file successfully!', 'success');
    } else {
      exportToJson(data);
      addToast('Exported JSON file successfully!', 'success');
    }
    setExportType(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Live enterprise workspace, project planner & personal management
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Combined Page View Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => handleTabChange('planner')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'planner'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>All Projects (Planner)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold">
                {allProjects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('personal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'personal'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>My Projects (Personal)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-bold">
                {myProjects.length}
              </span>
            </button>
          </div>

          {/* Quick filter pills (when in planner view) */}
          {activeTab === 'planner' && (
            <div className="hidden md:flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
              <button
                onClick={() => { setQuickFilter('all'); addToast('Viewing all projects', 'info'); }}
                className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'}`}
              >
                All ({allProjects.length})
              </button>
              <button
                onClick={() => { setQuickFilter('active'); addToast('Filtered: Active in progress', 'info'); }}
                className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'active' ? 'bg-white text-sky-600 shadow-xs' : 'hover:text-gray-900'}`}
              >
                Active ({inProgressProjectsCount})
              </button>
              <button
                onClick={() => { setQuickFilter('done'); addToast('Filtered: Completed projects', 'info'); }}
                className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'done' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-gray-900'}`}
              >
                Done ({completedProjectsCount})
              </button>
              <button
                onClick={() => { setQuickFilter('mine'); addToast('Filtered: Assigned to me', 'info'); }}
                className={`px-3 py-1.5 rounded-md transition ${quickFilter === 'mine' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'hover:text-gray-900'}`}
              >
                Assigned to Me ({myProjects.length})
              </button>
            </div>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs active:scale-95"
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

      {/* ========================================================================= */}
      {/* TAB 1: ALL PROJECTS & PLANNER OVERVIEW                                     */}
      {/* ========================================================================= */}
      {activeTab === 'planner' && (
        <div className="space-y-6 animate-fade-in">
          {/* Subheader Banner */}
          <div className="w-full bg-[#F8F9FA] border border-gray-200/70 rounded-xl px-4 py-3 flex items-center justify-between text-sm text-[#4B5563] shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base" role="img" aria-label="briefcase">💼</span>
              <span className="font-normal text-gray-700">Company-wide project planner & tracking overview</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Workspace Live</span>
            </div>
          </div>

          {/* Dynamic Live KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
            {/* Card 1: Projects Status Pie Chart */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
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
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
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
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
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
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[190px]">
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

          {/* Primary Projects Section */}
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

            {isAdmin && (
              <div className="pt-6 border-t border-gray-200/70 w-full">
                <EmployeesGrid employees={allEmployees} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY PROJECTS & PERSONAL WORKSPACE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'personal' && (
        <div className="space-y-6 animate-fade-in">
          {/* Admin Profile Overview Card */}
          <section className="card p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={currentEmp?.avatar || user?.avatar}
                  alt={currentEmp?.fullName || user?.fullName}
                  className="h-16 w-16 shadow-xs border border-gray-100 ring-2 ring-purple-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">
                      {currentEmp?.fullName || user?.fullName}
                    </h2>
                    <span className="badge bg-indigo-100 text-indigo-700">You</span>
                    <span className="badge bg-purple-100 text-purple-700 border border-purple-200 font-bold">
                      Admin
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-gray-400 hover:text-purple-700 p-1 rounded-md hover:bg-purple-50 transition"
                      title="Edit employee details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5">{currentEmp?.email || user?.email}</p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                      {currentEmp?.role || user?.role || 'Administrator'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Change designation
                    </button>
                  </div>

                  {props.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {props.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <span>{p}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProperty(i)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 transition"
                            title="Remove property"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition shadow-2xs font-semibold"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Edit Details</span>
                </button>

                <button
                  type="button"
                  className="btn-ghost text-xs py-1.5 px-3 text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200 shadow-2xs"
                  onClick={handleAddProperty}
                >
                  + Add property
                </button>
              </div>
            </div>

            <div className="mt-4">
              <input
                className="input-field w-full text-xs"
                placeholder="Add a personal comment or workspace note..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </section>

          {/* Personal KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Assigned Projects</span>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">{myProjects.length}</div>
                <div className="mt-0.5 text-xs text-sky-600 font-semibold">{myInProgressProjectsCount} in progress · {myCompletedProjectsCount} done</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Active Tasks</span>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">{myTasks.length}</div>
                <div className="mt-0.5 text-xs text-emerald-600 font-semibold">{myTaskCompletionRate}% completion rate</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Meetings</span>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">{myMeetings.length}</div>
                <div className="mt-0.5 text-xs text-indigo-600 font-semibold">Scheduled syncs</div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Assigned Projects Section */}
          <section className="w-full">
            <ProjectsTable projects={myProjects} title="My Assigned Projects" />
          </section>

          {/* Personal Tasks & Meetings */}
          <div className="pt-6 border-t border-gray-200/70 space-y-6 w-full">
            <TasksTab tasks={myTasks} projects={myProjects} heading="My Assigned Tasks" />
            <MeetingList meetings={myMeetings} defaultAttendeeId={user?.id} />
          </div>

          {/* Edit Employee Properties Modal */}
          <EditEmployeeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            employee={currentEmp}
            onSave={handleSaveProperties}
          />
        </div>
      )}

      {/* Footer / Summary Stats */}
      <div className="pt-4 pb-8 text-center text-xs text-gray-400">
        {allProjects.length} total projects ({myProjects.length} assigned to you) · {allTasks.length} tasks · {allMeetings.length} meetings · {allEmployees.length} employees
      </div>
    </div>
  );
};

export default Dashboard;