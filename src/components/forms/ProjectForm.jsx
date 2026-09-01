import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Modal } from '../widgets/Modal';

const STATUSES = ['Not started', 'In progress', 'Done'];

export const ProjectForm = ({ isOpen, onClose, initial = null }) => {
  const { employees, addProject, updateProject } = useData();
  const [form, setForm] = useState({
    name: '',
    assigneeIds: [],
    status: 'Not started',
    startDate: '',
    endDate: '',
    startValue: 0,
    endValue: 100,
    progress: 0
  });

  useEffect(() => {
    if (initial) {
      let initialAssigneeIds = [];
      if (Array.isArray(initial.assigneeIds)) {
        initialAssigneeIds = initial.assigneeIds;
      } else if (initial.assigneeId) {
        initialAssigneeIds = [initial.assigneeId];
      }

      let prog = initial.progress || 0;
      if (prog <= 1 && prog > 0) prog = Math.round(prog * 100);

      setForm({
        name: initial.name || '',
        assigneeIds: initialAssigneeIds,
        status: initial.status || 'Not started',
        startDate: initial.startDate ? initial.startDate.slice(0, 10) : '',
        endDate: initial.endDate ? initial.endDate.slice(0, 10) : '',
        startValue: initial.startValue !== undefined ? initial.startValue : 0,
        endValue: initial.endValue !== undefined ? initial.endValue : 100,
        progress: prog
      });
    } else {
      setForm({
        name: '',
        assigneeIds: [],
        status: 'Not started',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        startValue: 0,
        endValue: 100,
        progress: 0
      });
    }
  }, [initial, isOpen]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleAssignee = (empId) => {
    setForm(prev => {
      const exists = prev.assigneeIds.includes(empId);
      const newIds = exists
        ? prev.assigneeIds.filter(id => id !== empId)
        : [...prev.assigneeIds, empId];
      return { ...prev, assigneeIds: newIds };
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const rawProgress = Number(form.progress) || 0;
    const progressDecimal = rawProgress > 1 ? rawProgress / 100 : rawProgress;

    const payload = {
      ...form,
      assigneeIds: form.assigneeIds,
      assigneeId: form.assigneeIds[0] || '', // legacy compatibility
      startValue: Number(form.startValue) || 0,
      endValue: Number(form.endValue) || 0,
      progress: progressDecimal
    };
    if (initial) updateProject(initial.id, payload);
    else addProject(payload);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit project' : 'New project'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Project Name</label>
          <input className="input-field font-medium" value={form.name} onChange={set('name')} required placeholder="e.g. Mobile App Redesign" />
        </div>

        {/* Multi-Employee Assignment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-600">Assign Team Members ({form.assigneeIds.length} selected)</label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, assigneeIds: employees.map(e => e.id) }))}
                className="text-blue-600 hover:underline font-medium"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, assigneeIds: [] }))}
                className="text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50/50">
            {employees.map(emp => {
              const isSelected = form.assigneeIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleAssignee(emp.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-3.5 w-3.5 accent-blue-600 rounded"
                  />
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.fullName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[9px]">
                      {emp.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="truncate flex-1">
                    <div className="font-semibold truncate">{emp.fullName}</div>
                    <div className="text-[10px] text-gray-400 truncate">{emp.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">Status</label>
          <select className="input-field" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Start date</label>
            <input type="date" className="input-field" value={form.startDate} onChange={set('startDate')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">End date</label>
            <input type="date" className="input-field" value={form.endDate} onChange={set('endDate')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Start value</label>
            <input type="number" className="input-field" value={form.startValue} onChange={set('startValue')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">End value</label>
            <input type="number" className="input-field" value={form.endValue} onChange={set('endValue')} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-600">Progress (%)</label>
            <span className="text-xs font-bold text-emerald-600">{form.progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={form.progress}
            onChange={set('progress')}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{initial ? 'Save Changes' : 'Create Project'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectForm;
