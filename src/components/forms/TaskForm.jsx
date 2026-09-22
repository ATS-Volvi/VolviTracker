import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export const TaskForm = ({ isOpen, open, onClose, initial = null }) => {
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const { employees, projects = [], addTask, updateTask, removeTask } = useData();
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    projectId: '',
    assigneeIds: [],
    assigneeId: '',
    status: 'Not started',
    dueDate: '',
    priority: 'Medium',
    description: ''
  });

  const isEditing = Boolean(initial && initial.id);

  const handleDelete = () => {
    if (isEditing && window.confirm(`Delete task "${form.name}"?`)) {
      removeTask(initial.id);
      addToast(`Deleted task "${form.name}"`, 'info');
      onClose();
    }
  };

  useEffect(() => {
    if (initial) {
      let initialAssigneeIds = [];
      if (Array.isArray(initial.assigneeIds) && initial.assigneeIds.length > 0) {
        initialAssigneeIds = initial.assigneeIds;
      } else if (initial.assigneeId) {
        initialAssigneeIds = [initial.assigneeId];
      }

      // Non-admins can only assign tasks to themselves
      if (!isAdmin && user?.id) {
        initialAssigneeIds = [user.id];
      }

      setForm({
        name: initial.name || '',
        projectId: initial.projectId || '',
        assigneeIds: initialAssigneeIds,
        assigneeId: initialAssigneeIds[0] || (user?.id || ''),
        status: initial.status || 'Not started',
        dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        priority: initial.priority || 'Medium',
        description: initial.description || ''
      });
    } else {
      const defaultAssignees = (!isAdmin && user?.id) ? [user.id] : [];
      setForm({
        name: '',
        projectId: '',
        assigneeIds: defaultAssignees,
        assigneeId: defaultAssignees[0] || '',
        status: 'Not started',
        dueDate: '',
        priority: 'Medium',
        description: ''
      });
    }
  }, [initial, isModalOpen, isAdmin, user?.id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAssignee = (empId) => {
    if (!isAdmin) return; // Non-admin cannot assign tasks to anyone else
    setForm(prev => {
      const exists = prev.assigneeIds.includes(empId);
      const newIds = exists
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId];
      return { ...prev, assigneeIds: newIds, assigneeId: newIds[0] || '' };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const finalAssigneeIds = (!isAdmin && user?.id) ? [user.id] : form.assigneeIds;
    const payload = {
      ...form,
      assigneeIds: finalAssigneeIds,
      assigneeId: finalAssigneeIds[0] || ''
    };

    if (isEditing) {
      updateTask(initial.id, payload);
      addToast(`Updated task "${form.name}"`, 'success');
    } else {
      addTask(payload);
      addToast(`Created new task "${form.name}"`, 'success');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'New Task'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Task Name</label>
          <input className="input-field text-sm" value={form.name} onChange={set('name')} required placeholder="e.g. Design homepage hero" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Project (Optional)</label>
          <select className="input-field text-sm bg-white" value={form.projectId} onChange={set('projectId')}>
            <option value="">Select project (Optional)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              {isAdmin ? `Assign Team Members (${form.assigneeIds.length} selected)` : 'Assigned Team Member'}
            </label>
            {isAdmin ? (
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({
                    ...prev,
                    assigneeIds: employees.map(e => e.id),
                    assigneeId: employees[0]?.id || ''
                  }))}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, assigneeIds: [], assigneeId: '' }))}
                  className="text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                Self-assigned only
              </span>
            )}
          </div>

          {isAdmin ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/60 custom-scrollbar">
              {employees.map(emp => {
                const isSelected = form.assigneeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => toggleAssignee(emp.id)}
                    className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer border transition text-xs select-none ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-3.5 w-3.5 accent-blue-600 rounded"
                    />
                    <img
                      src={emp.avatar}
                      alt={emp.fullName}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                      onError={(ev) => {
                        ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName)}&background=0070F3&color=fff`;
                      }}
                    />
                    <div className="truncate flex-1">
                      <div className="truncate">{emp.fullName}</div>
                      <div className="text-[10px] text-gray-400 font-normal truncate">{emp.role || emp.email}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar || employees.find(e => e.id === user?.id)?.avatar}
                  alt={user?.fullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-blue-500/30"
                  onError={(ev) => {
                    ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0070F3&color=fff`;
                  }}
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <span>{user?.fullName || 'Your Account'}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-100 font-semibold px-1.5 py-0.2 rounded">You</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-normal">
                    {user?.email || 'Non-admin users can only assign tasks to themselves'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Assigned</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Status</label>
            <select className="input-field text-sm bg-white" value={form.status} onChange={set('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Priority</label>
            <select className="input-field text-sm bg-white" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Due Date</label>
          <input type="date" className="input-field text-sm" value={form.dueDate} onChange={set('dueDate')} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Description</label>
          <textarea className="input-field text-sm" rows="3" value={form.description} onChange={set('description')} placeholder="Task details or requirements..." />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
            >
              Delete task
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs px-4 py-2" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary text-xs font-bold px-4 py-2">{isEditing ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
