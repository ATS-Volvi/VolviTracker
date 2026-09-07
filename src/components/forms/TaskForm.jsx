import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export const TaskForm = ({ isOpen, open, onClose, initial = null }) => {
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const { employees, projects = [], addTask, updateTask, removeTask } = useData();
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

  const handleDelete = () => {
    if (initial && window.confirm(`Delete task "${form.name}"?`)) {
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

      setForm({
        name: initial.name || '',
        projectId: initial.projectId || '',
        assigneeIds: initialAssigneeIds,
        assigneeId: initialAssigneeIds[0] || initial.assigneeId || '',
        status: initial.status || 'Not started',
        dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        priority: initial.priority || 'Medium',
        description: initial.description || ''
      });
    } else {
      setForm({
        name: '',
        projectId: '',
        assigneeIds: [],
        assigneeId: '',
        status: 'Not started',
        dueDate: '',
        priority: 'Medium',
        description: ''
      });
    }
  }, [initial, isModalOpen]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAssignee = (empId) => {
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
    const payload = {
      ...form,
      assigneeIds: form.assigneeIds,
      assigneeId: form.assigneeIds[0] || form.assigneeId || ''
    };

    if (initial) {
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
      title={initial ? 'Edit Task' : 'New Task'}
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

        {/* Multi-Assignee Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Assign Team Members ({form.assigneeIds.length} selected)
            </label>
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
          </div>

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
          {initial ? (
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
            <button type="submit" className="btn-primary text-xs font-bold px-4 py-2">{initial ? 'Save Changes' : 'Create Task'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
