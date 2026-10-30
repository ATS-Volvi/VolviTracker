import React, { useState, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { TasksTab } from '../components/tasks/TasksTab';
import { ProjectForm } from '../components/forms/ProjectForm';
import { ProjectKpiDisplay } from '../components/projects/ProjectKpiDisplay';

export const TasksPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { user, isAdmin, isProjectManager } = useAuth();
  const { projects: rawProjects = [], tasks: rawTasks = [], employees = [] } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-semibold transition group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-600 transition">
              arrow_back
            </span>
            <span>Projects</span>
          </Link>
          <span className="text-slate-300">/</span>
          {activeProject ? (
            <>
              <Link
                to={`/projects/${activeProject.id}/edit`}
                className="text-slate-900 hover:text-blue-600 font-bold truncate max-w-[200px] sm:max-w-[320px] transition hover:underline"
                title="Go to Project Details"
              >
                {activeProject.name}
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                Tasks & Deadlines
              </span>
            </>
          ) : (
            <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              All Tasks & Deadlines
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeProject && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer"
              title="Open Project Details in a pop-up window"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">edit_document</span>
              <span>Project Details</span>
            </button>
          )}
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">folder</span>
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>

      {/* Active Project Dynamic KPI Display (When a specific project is selected) */}
      {activeProject && (
        <ProjectKpiDisplay
          project={activeProject}
          tasks={pageTasks}
          employees={employees}
          onOpenProjectDetails={() => setIsEditModalOpen(true)}
        />
      )}

      {/* Main TasksTab Component */}
      <div id="tasks-tracker-anchor" className="w-full pt-1">
        <TasksTab
          tasks={pageTasks}
          projects={pageProjects}
          heading={activeProject ? `${activeProject.name} — Tasks & Deadlines` : 'Project Tasks & Deadlines'}
          defaultProjectId={activeProject ? String(activeProject.id) : (activeProjectId || 'all')}
          showBackToProjects={true}
        />
      </div>

      {/* Project Details Modal */}
      {activeProject && (
        <ProjectForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initial={activeProject}
          isPage={false}
          hideTasksSection={true}
        />
      )}
    </div>
  );
};

export default TasksPage;
