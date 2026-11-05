import React, { useState, useEffect } from 'react';
import { createSprint, updateSprint } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';

export function AddEditSprintModal({
  isOpen,
  onClose,
  projectId,
  sprint = null,
  onSuccess
}) {
  const { addToast } = useToast();
  const isEdit = Boolean(sprint && sprint.id);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phase, setPhase] = useState('Explore');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (sprint) {
      setCode(sprint.code || '');
      setName(sprint.name || '');
      setPhase(sprint.phase || 'Explore');
      setStartDate(sprint.startDate || '');
      setEndDate(sprint.endDate || '');
      setGoal(sprint.goal || '');
    } else {
      setCode('');
      setName('');
      setPhase('Explore');
      setStartDate('');
      setEndDate('');
      setGoal('');
    }
    setErrorMsg('');
  }, [sprint, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Sprint Code is required (e.g. Sprint 1)');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setErrorMsg('End Date cannot be earlier than Start Date');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      code: code.trim(),
      name: name.trim() || code.trim(),
      phase: phase.trim(),
      startDate,
      endDate,
      goal: goal.trim()
    };

    try {
      if (isEdit) {
        await updateSprint(projectId, sprint.id, payload);
        addToast(`Updated sprint ${code}`, 'success');
      } else {
        await createSprint(projectId, payload);
        addToast(`Created sprint ${code}`, 'success');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save sprint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <span className="material-symbols-outlined text-[20px]">{isEdit ? 'edit_calendar' : 'calendar_add_on'}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Sprint' : 'New Sprint'}</h3>
              <p className="text-xs text-slate-500">Configure sprint code, phase, and target dates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Sprint Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. Sprint 1"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Project Phase</label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Prepare">Prepare</option>
                <option value="Explore">Explore</option>
                <option value="Realize – Build">Realize – Build</option>
                <option value="Realize – Test & Train">Realize – Test & Train</option>
                <option value="Deploy">Deploy</option>
                <option value="Run">Run</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sprint Name / Theme</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 1 - Core Architecture"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Sprint Goal</label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Complete blueprint sign-off and environment connectivity"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Sprint')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditSprintModal;

