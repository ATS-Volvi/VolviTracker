import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ProjectForm } from '../components/forms/ProjectForm';

export const ProjectEditPage = () => {
  const { id, projectId } = useParams();
  const navigate = useNavigate();
  const { projects = [] } = useData();

  const targetId = id || projectId;
  const isNew = !targetId || targetId === 'new';

  const project = useMemo(() => {
    if (isNew) return null;
    return projects.find(p => String(p.id) === String(targetId)) || null;
  }, [projects, targetId, isNew]);

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
          className="btn-primary text-xs font-bold px-5 py-2 inline-flex items-center gap-1.5"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <ProjectForm
      isPage={true}
      initial={project}
      onClose={() => navigate('/projects')}
    />
  );
};

export default ProjectEditPage;
