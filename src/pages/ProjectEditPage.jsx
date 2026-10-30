import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ProjectForm } from '../components/forms/ProjectForm';
import { TasksTab } from '../components/tasks/TasksTab';
import { ProjectKpiDisplay } from '../components/projects/ProjectKpiDisplay';
import Avatar from '../components/widgets/Avatar';

export const ProjectEditPage = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const { projects = [], tasks = [], employees = [] } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const targetId = id || projectId;
  const isNew = !targetId || targetId === 'new';

  const project = useMemo(() => {
    if (isNew) return null;
    return projects.find(p => String(p.id) === String(targetId)) || null;
  }, [projects, targetId, isNew]);

  // Project task stats
  const projectTasks = useMemo(() => {
    if (!project) return [];
    return tasks.filter(t => String(t.projectId) === String(project.id));
  }, [tasks, project]);

  if (isNew) {
    return (
      <ProjectForm
        isPage={true}
        initial={null}
        onClose={() => navigate('/projects')}
      />
    );
  }

  // If a specific ID was passed but not found once projects are loaded
  if (!isNew && projects.length > 0 && !project) {
    return (
      <div className="w-full min-h-screen bg-[#FBFBFC] px-8 py-16 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-gray-800">Project Not Found</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          The project you are trying to view or edit does not exist or may have been removed.
        </p>
        <button
          onClick={() => navigate('/projects')}
          className="btn-primary text-xs font-bold px-5 py-2 inline-flex items-center gap-1.5 cursor-pointer"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 animate-fade-in pb-20">
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
          <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-[320px]">
            {project.name}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            Tasks Tracker
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/90 hover:bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer"
            title="Open Project Details in a pop-up window"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">edit_document</span>
            <span>Project Details</span>
          </button>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">folder</span>
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>

      {/* Dynamic KPI Display (Pipeline Completion, 6 Metrics, 4 Analytical Overviews) */}
      <ProjectKpiDisplay
        project={project}
        tasks={projectTasks}
        employees={employees}
        onOpenProjectDetails={() => setIsEditModalOpen(true)}
      />

      {/* Main Tasks List directly on page */}
      <div id="tasks-tracker-anchor" className="w-full pt-1">
        <TasksTab
          tasks={tasks}
          projects={projects}
          heading={`${project.name} — Tasks Tracker`}
          defaultProjectId={String(project.id)}
          lockToProject={true}
          hideProjectFilter={true}
          hideProjectDetailsHeader={true}
          disableUrlSync={true}
          asCard={true}
        />
      </div>

      {/* Project Details Modal Popup */}
      {isEditModalOpen && (
        <ProjectForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initial={project}
          isPage={false}
          hideTasksSection={true}
        />
      )}
    </div>
  );
};

export default ProjectEditPage;
