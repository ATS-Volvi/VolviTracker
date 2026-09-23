import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/widgets/Avatar';
import TasksTab from '../components/tasks/TasksTab';
import MeetingList from '../components/meetings/MeetingList';
import ProjectsTable from '../components/projects/ProjectsTable';
import EditEmployeeModal from '../components/employees/EditEmployeeModal';

const fmt = (dt) => new Date(dt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const STATUS_STYLES = {
  'Not started': 'bg-gray-100 text-gray-600',
  'In progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700'
};

export const Employee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployee, employees = [], projects = [], tasks, meetings, updateEmployee, removeEmployee } = useData();
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [comment, setComment] = useState('');
  const [props, setProps] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnProfile = user && String(user.id) === String(id);

  // Gated: Only Admins can view other employees' personal profile pages
  if (!isAdmin && !isOwnProfile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center space-y-4 shadow-xl border-gray-200 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-sm">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Access Required</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Viewing other team members' personal profiles is restricted to users with the <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">Admin</span> designation.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {isAdmin ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary w-full sm:w-auto text-xs py-2 px-4"
              >
                Return to Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate(`/employee/${user?.id}`)}
                className="btn-primary w-full sm:w-auto text-xs py-2 px-4"
              >
                Go to My Profile
              </button>
            )}
            <button
              onClick={() => navigate('/docs')}
              className="btn-ghost w-full sm:w-auto text-xs py-2 px-4"
            >
              Company Docs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const emp = getEmployee(id);

  // Sync custom properties
  useEffect(() => {
    if (emp && Array.isArray(emp.properties)) {
      setProps(emp.properties);
    } else {
      setProps([]);
    }
  }, [emp?.properties]);

  if (!emp) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center text-gray-500">
          Employee not found.{' '}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigate(isAdmin ? '/dashboard' : `/employee/${user?.id}`)}
          >
            {isAdmin ? 'Back to dashboard' : 'Back to my profile'}
          </button>
        </div>
      </div>
    );
  }

  const myProjects = (projects || []).filter(p => {
    const isProjectAssignee =
      (Array.isArray(p.assigneeIds) && p.assigneeIds.some(aid => String(aid) === String(id))) ||
      String(p.assigneeId) === String(id);
    const hasAssignedTask = (tasks || []).some(
      t => String(t.projectId) === String(p.id) &&
      ((Array.isArray(t.assigneeIds) && t.assigneeIds.some(aid => String(aid) === String(id))) || String(t.assigneeId) === String(id))
    );
    return isProjectAssignee || hasAssignedTask;
  });
  const myTasks = (tasks || []).filter(t => {
    if (Array.isArray(t.assigneeIds)) return t.assigneeIds.some(aid => String(aid) === String(id));
    return String(t.assigneeId) === String(id);
  });
  const myMeetings = (meetings || []).filter(m => {
    if (Array.isArray(m.attendeeIds)) return m.attendeeIds.some(aid => String(aid) === String(id));
    return String(m.attendeeId) === String(id);
  });

  const handleAddProperty = () => {
    const v = window.prompt('Add a property (e.g. Department: Engineering, Location: New York)');
    if (v && v.trim()) {
      const cleanVal = v.trim();
      const currentProps = Array.isArray(emp.properties) ? emp.properties : props;
      const nextProps = [...currentProps, cleanVal];
      setProps(nextProps);
      if (updateEmployee) {
        updateEmployee(id, { properties: nextProps });
      }
      addToast(`Added property: "${cleanVal}"`, 'success', 2000);
    }
  };

  const handleRemoveProperty = (idxToRemove) => {
    const currentProps = Array.isArray(emp.properties) ? emp.properties : props;
    const nextProps = currentProps.filter((_, i) => i !== idxToRemove);
    setProps(nextProps);
    if (updateEmployee) {
      updateEmployee(id, { properties: nextProps });
    }
    addToast('Property removed', 'info', 2000);
  };

  const handleSaveProperties = (updates) => {
    if (updateEmployee) {
      updateEmployee(id, updates);
    }
  };

  const isEmpAdmin = emp.isAdmin === true || (emp.role || '').toLowerCase() === 'admin';

  const handleToggleAdminStatus = async () => {
    if (!isAdmin) return;

    if (isEmpAdmin) {
      const remainingAdmins = (employees || []).filter(
        e => (e.isAdmin === true || (e.role || '').toLowerCase() === 'admin') && e.id !== emp.id
      );
      if (remainingAdmins.length === 0) {
        addToast('Cannot remove admin status: At least one administrator account must be retained.', 'warning', 4000);
        return;
      }

      const confirmed = window.confirm(
        `Remove Admin status from ${emp.fullName}? They will become a standard team member.`
      );
      if (!confirmed) return;

      try {
        await updateEmployee(id, {
          isAdmin: false,
          role: (emp.role || '').toLowerCase() === 'admin' ? 'Software Engineer' : emp.role
        });
        addToast(`Admin status removed from ${emp.fullName}.`, 'info', 3000);
      } catch {
        addToast('Failed to update admin status.', 'error');
      }
    } else {
      const confirmed = window.confirm(
        `Grant Admin status to ${emp.fullName}? They will have full administrative access across the platform.`
      );
      if (!confirmed) return;

      try {
        await updateEmployee(id, { isAdmin: true });
        addToast(`Granted Admin status to ${emp.fullName}!`, 'success', 3000);
      } catch {
        addToast('Failed to grant admin status.', 'error');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin || isOwnProfile || !emp) return;
    setIsDeleting(true);
    try {
      if (removeEmployee) {
        removeEmployee(id);
      }
      addToast(`Account for ${emp.fullName} has been permanently deleted.`, 'info', 3000);
      setIsDeleteConfirmOpen(false);
      navigate('/dashboard');
    } catch {
      addToast('Failed to delete employee account.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full min-h-screen">
      <main className="w-full px-4 sm:px-8 py-6 space-y-6">
        <section className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar src={emp.avatar} alt={emp.fullName} className="h-16 w-16 shadow-sm border border-gray-100" />
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{emp.fullName}</h1>
                  {isOwnProfile ? (
                    <span className="badge bg-indigo-100 text-indigo-700">You</span>
                  ) : isAdmin ? (
                    <span className="badge bg-purple-100 text-purple-700 border border-purple-200 font-semibold">Admin View</span>
                  ) : null}
                  {(isAdmin || isOwnProfile) && (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-gray-400 hover:text-purple-700 p-1 rounded-md hover:bg-purple-50 transition"
                      title="Edit employee properties"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{emp.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                    {emp.role || '—'}
                  </span>
                  {isEmpAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                      </svg>
                      Admin
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      Standard Member
                    </span>
                  )}
                  {(isAdmin || isOwnProfile) && (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Change designation
                    </button>
                  )}
                </div>
                {props.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {props.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                        <span>{p}</span>
                        {(isAdmin || isOwnProfile) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProperty(i)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-0.5 transition"
                            title="Remove property"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Admin / Owner Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Admin Status Toggle Action (Admin Only) */}
              {isAdmin && !isOwnProfile && (
                <button
                  type="button"
                  onClick={handleToggleAdminStatus}
                  className={`btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-xl transition shadow-2xs font-semibold ${
                    isEmpAdmin
                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                  }`}
                  title={isEmpAdmin ? 'Revoke administrator privileges' : 'Grant administrator privileges'}
                >
                  {isEmpAdmin ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Remove Admin Status</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Convert to Admin</span>
                    </>
                  )}
                </button>
              )}

              {(isAdmin || isOwnProfile) && (
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
              )}
              {(isAdmin || isOwnProfile) && (
                <button
                  type="button"
                  className="btn-ghost text-xs py-1.5 px-3 text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200 shadow-2xs"
                  onClick={handleAddProperty}
                >
                  + Add property
                </button>
              )}
              {isAdmin && !isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition shadow-2xs font-semibold"
                  title="Permanently delete this account (Admin only)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <input
              className="input-field"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </section>

        {/* Assigned Projects Section (Same view as main page projects tab) */}
        <section className="w-full">
          <ProjectsTable projects={myProjects} title="Assigned Projects" />
        </section>

        <TasksTab tasks={myTasks} projects={myProjects} heading="My Tasks" />
        <MeetingList meetings={myMeetings} defaultAttendeeId={id} />
      </main>

      {/* Edit Employee Properties Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employee={emp}
        onSave={handleSaveProperties}
        onDelete={isAdmin && !isOwnProfile ? () => setIsDeleteConfirmOpen(true) : undefined}
      />

      {/* Delete Account Confirmation Modal (Admin Only) */}
      {isAdmin && !isOwnProfile && isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full p-6 animate-slide-up text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Employee Account</h3>
                <p className="text-xs text-rose-600 font-semibold">Admin authorization required</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl mb-4 text-xs text-gray-700 leading-relaxed">
              Are you sure you want to permanently delete the account for <strong className="text-gray-900 font-bold">{emp.fullName}</strong> (<span className="text-gray-600 font-mono text-[11px]">{emp.email}</span>)?
              <p className="mt-2 text-[11px] text-rose-700 font-medium">
                ⚠️ This user will be immediately revoked from the workspace and will no longer be able to log in. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="btn-ghost text-xs py-2 px-4 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;