import React, { useState, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { TasksTab } from '../components/tasks/TasksTab';
import Avatar from '../components/widgets/Avatar';

export const TasksPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { user, isAdmin, isProjectManager } = useAuth();
  const { projects: rawProjects = [], tasks: rawTasks = [], employees = [] } = useData();

  const allProjects = Array.isArray(rawProjects) ? rawProjects : [];
  const allTasks = Array.isArray(rawTasks) ? rawTasks : [];

  // Scoped projects accessible to this user
  const baseProjects = isAdmin
    ? allProjects
    : (isProjectManager
      ? allProjects.filter(p => String(p.createdBy || '') === String(user?.id))
      : allProjects.filter(p => (Array.isArray(p.assigneeIds) && p.assigneeIds.some(aid => String(aid) === String(user?.id))) || String(p.assigneeId) === String(user?.id)));

  // Scoped tasks
  const baseTasks = isAdmin
    ? allTasks
    : (isProjectManager
      ? allTasks.filter(t => baseProjects.some(p => String(p.id) === String(t.projectId)))
      : allTasks.filter(t => (Array.isArray(t.assigneeIds) && t.assigneeIds.some(aid => String(aid) === String(user?.id))) || String(t.assigneeId) === String(user?.id)));

  // Determine active project from URL params or search params
  const activeProjectId = params.projectId || searchParams.get('projectId') || null;
  const activeProject = useMemo(() => {
    if (!activeProjectId || activeProjectId === 'all' || activeProjectId === 'unassigned') return null;
    return allProjects.find(p => String(p.id) === String(activeProjectId)) || null;
  }, [allProjects, activeProjectId]);

  // Project task stats
  const projectTasks = useMemo(() => {
    if (!activeProject) return [];
    return allTasks.filter(t => String(t.projectId) === String(activeProject.id));
  }, [allTasks, activeProject]);

  const totalTasksCount = projectTasks.length;
  const completedTasksCount = projectTasks.filter(t => t.status === 'Done').length;
  const inProgressTasksCount = projectTasks.filter(t => t.status === 'In progress').length;
  const progressPct = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : (activeProject?.progress ? Math.round((activeProject.progress <= 1 && activeProject.progress > 0 ? activeProject.progress * 100 : activeProject.progress)) : 0);

  // Project team members
  const projectAssignees = useMemo(() => {
    if (!activeProject) return [];
    let ids = [];
    if (Array.isArray(activeProject.assigneeIds) && activeProject.assigneeIds.length > 0) {
      ids = activeProject.assigneeIds;
    } else if (activeProject.assigneeId) {
      ids = [activeProject.assigneeId];
    }
    return ids.map(id => employees.find(e => String(e.id) === String(id))).filter(Boolean);
  }, [activeProject, employees]);

  // Ensure active project and its full task list are available on its dedicated subpage
  const pageProjects = useMemo(() => {
    if (!activeProject) return baseProjects;
    const exists = baseProjects.some(p => String(p.id) === String(activeProject.id));
    return exists ? baseProjects : [activeProject, ...baseProjects];
  }, [baseProjects, activeProject]);

  const pageTasks = useMemo(() => {
    if (!activeProject) return baseTasks;
    const projectTaskIds = new Set(projectTasks.map(t => String(t.id)));
    const otherTasks = baseTasks.filter(t => !projectTaskIds.has(String(t.id)));
    return [...projectTasks, ...otherTasks];
  }, [projectTasks, baseTasks, activeProject]);

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-blue-600 font-semibold transition group"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-blue-600">
              arrow_back
            </span>
            <span>Projects</span>
          </Link>
          <span className="text-gray-300">/</span>
          {activeProject ? (
            <>
              <Link
                to={`/projects/${activeProject.id}/edit`}
                className="text-gray-800 hover:text-blue-600 font-bold truncate max-w-[200px] sm:max-w-[320px] transition hover:underline"
                title="Go to Project Details"
              >
                {activeProject.name}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-semibold">Tasks & Deadlines</span>
            </>
          ) : (
            <span className="text-blue-600 font-semibold">All Tasks & Deadlines</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeProject && (
            <Link
              to={`/projects/${activeProject.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">edit_document</span>
              <span>Project Details</span>
            </Link>
          )}
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">folder</span>
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>

      {/* Active Project Header Banner (When a specific project is selected) */}
      {activeProject && (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  📁
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight truncate">
                  {activeProject.name}
                </h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    activeProject.status === 'Done'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : activeProject.status === 'In progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {activeProject.status || 'Not started'}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {progressPct}% Progress
                </span>
              </div>

              {/* Subtitle details */}
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                {activeProject.clientName && (
                  <span className="flex items-center gap-1 text-gray-700 font-medium">
                    <span className="text-gray-400">Client:</span>
                    <span>{activeProject.clientName}</span>
                  </span>
                )}
                {activeProject.pocName && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <span className="text-gray-400">• POC:</span>
                    <span>{activeProject.pocName}</span>
                  </span>
                )}
                {(activeProject.startDate || activeProject.endDate) && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <span className="text-gray-400">• Timeline:</span>
                    <span>{activeProject.startDate || '—'} to {activeProject.endDate || '—'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics & Team Members */}
            <div className="flex items-center gap-4 flex-wrap shrink-0">
              {/* Task Counters */}
              <div className="flex items-center gap-3 bg-gray-50/90 border border-gray-200/80 px-3.5 py-2 rounded-xl text-xs">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</div>
                  <div className="font-extrabold text-gray-900 text-sm">{totalTasksCount}</div>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">In Progress</div>
                  <div className="font-extrabold text-blue-700 text-sm">{inProgressTasksCount}</div>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Done</div>
                  <div className="font-extrabold text-emerald-700 text-sm">{completedTasksCount}</div>
                </div>
              </div>

              {/* Team Members Stack */}
              {projectAssignees.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-50/90 border border-gray-200/80 px-3.5 py-2 rounded-xl">
                  <div className="flex items-center -space-x-2 overflow-hidden">
                    {projectAssignees.slice(0, 4).map(emp => (
                      <Avatar
                        key={emp.id}
                        src={emp.avatar}
                        alt={emp.fullName}
                        className="h-7 w-7 ring-2 ring-white shadow-2xs"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {projectAssignees.length} Team Member{projectAssignees.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-700 tabular-nums shrink-0">
              {completedTasksCount} of {totalTasksCount} tasks completed ({progressPct}%)
            </span>
          </div>

          {/* Subpage navigation tabs */}
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-2">
            <Link
              to={`/projects/${activeProject.id}/edit`}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-gray-400">edit_document</span>
              <span>Project Details</span>
            </Link>
            <div className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs flex items-center gap-1.5 cursor-default">
              <span className="material-symbols-outlined text-[16px] text-blue-600">task_alt</span>
              <span>Tasks & Deadlines ({totalTasksCount})</span>
            </div>
          </div>
        </div>
      )}

      {/* Main TasksTab Component */}
      <div className="w-full">
        <TasksTab
          tasks={pageTasks}
          projects={pageProjects}
          heading={activeProject ? `${activeProject.name} — Tasks & Deadlines` : 'Project Tasks & Deadlines'}
          defaultProjectId={activeProject ? String(activeProject.id) : (activeProjectId || 'all')}
          showBackToProjects={true}
        />
      </div>
    </div>
  );
};

export default TasksPage;
