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
    name: '', projectId: '', assigneeId: '', status: 'Not started', dueDate: '', priority: 'Medium', description: ''
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
      setForm({
        name: initial.name || '',
        projectId: initial.projectId || '',
        assigneeId: initial.assigneeId || '',
        status: initial.status || 'Not started',
        dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        priority: initial.priority || 'Medium',
        description: initial.description || ''
      });
    } else {
      setForm({ name: '', projectId: '', assigneeId: '', status: 'Not started', dueDate: '', priority: 'Medium', description: '' });
    }
  }, [initial, isModalOpen]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (initial) {
      updateTask(initial.id, form);
      addToast(`Updated task "${form.name}"`, 'success');
    } else {
      addTask(form);
      addToast(`Created new task "${form.name}"`, 'success');
    }
    onClose();
  };

  return (
    <Modal isOpen={isModalOpen} onClose={onClose} title={initial ? 'Edit task' : 'New task'}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Name</label>
          <input className="input-field" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Project</label>
          <select className="input-field" value={form.projectId} onChange={set('projectId')}>
            <option value="">Select project (Optional)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Assignee</label>
          <select className="input-field" value={form.assigneeId} onChange={set('assigneeId')} required>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select className="input-field" value={form.status} onChange={set('status')}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Priority</label>
            <select className="input-field" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Due date</label>
          <input type="date" className="input-field" value={form.dueDate} onChange={set('dueDate')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
          <textarea className="input-field" rows="3" value={form.description} onChange={set('description')} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
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
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{initial ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
