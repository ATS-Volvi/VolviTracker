import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ProjectForm } from '../components/forms/ProjectForm';
import { TasksTab } from '../components/tasks/TasksTab';
import { ProjectKpiDisplay } from '../components/projects/ProjectKpiDisplay';

// Lazy-load the new plan tabs
const SprintPlanTab = lazy(() => import('../components/projects/plan/SprintPlanTab'));
const StageGatesTab = lazy(() => import('../components/projects/plan/StageGatesTab'));

export const ProjectEditPage = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const { projects = [], tasks = [], employees = [] } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Tab state with URL hash persistence (#sprint-plan, #stage-gates, #tasks)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#stage-gates') return 'stage-gates';
      return 'sprint-plan';
    }
    return 'sprint-plan';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'stage-gates') {
      window.location.hash = '#stage-gates';
    } else {
      window.location.hash = '#sprint-plan';
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#stage-gates') setActiveTab('stage-gates');
      else setActiveTab('sprint-plan');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
            {activeTab === 'stage-gates' ? 'Stage Gates' : 'Tasks & Sprint Plan'}
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

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/90 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => handleTabChange('sprint-plan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'sprint-plan'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">view_timeline</span>
          <span>Tasks & Sprint Plan</span>
          {projectTasks.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'sprint-plan' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {projectTasks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('stage-gates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'stage-gates'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">rule</span>
          <span>Stage Gates</span>
        </button>
      </div>

      <Suspense fallback={
        <div className="w-full py-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="inline-block w-7 h-7 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading plan tab...</p>
        </div>
      }>
        {activeTab === 'sprint-plan' && <SprintPlanTab project={project} />}
        {activeTab === 'stage-gates' && <StageGatesTab project={project} />}
      </Suspense>

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
