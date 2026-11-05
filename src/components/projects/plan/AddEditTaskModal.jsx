import React, { useState, useEffect } from 'react';
import { createSprintTask, updateSprintTask } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';
import { getLocalDateString } from './planCalcs';

export function AddEditTaskModal({
  isOpen,
  onClose,
  projectId,
  task = null,
  sprints = [],
  gates = [],
  defaultSprintId = '',
  onSuccess
}) {
  const { addToast } = useToast();
  const isEdit = Boolean(task && task.id);

  const [sprintId, setSprintId] = useState('');
  const [gateId, setGateId] = useState('');
  const [taskCode, setTaskCode] = useState('');
  const [workstream, setWorkstream] = useState('');
  const [title, setTitle] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedFinish, setPlannedFinish] = useState('');
  const [owner, setOwner] = useState('');
  const [dependency, setDependency] = useState('');
  const [weight, setWeight] = useState(1);
  const [percentComplete, setPercentComplete] = useState(0);
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [planningBasis, setPlanningBasis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (task) {
      setSprintId(task.sprintId || defaultSprintId || (sprints[0]?.id || ''));
      setGateId(task.gateId || '');
      setTaskCode(task.taskCode || '');
      setWorkstream(task.workstream || '');
      setTitle(task.title || '');
      setPlannedStart(task.plannedStart || '');
      setPlannedFinish(task.plannedFinish || '');
      setOwner(task.owner || '');
      setDependency(task.dependency || '');
      setWeight(task.weight !== undefined ? Number(task.weight) : 1);
      setPercentComplete(task.percentComplete !== undefined ? Number(task.percentComplete) : 0);
      setActualCompletionDate(task.actualCompletionDate || '');
      setPlanningBasis(task.planningBasis || '');
    } else {
      setSprintId(defaultSprintId || (sprints[0]?.id || ''));
      setGateId('');
      setTaskCode('');
      setWorkstream('');
      setTitle('');
      setPlannedStart('');
      setPlannedFinish('');
      setOwner('');
      setDependency('');
      setWeight(1);
      setPercentComplete(0);
      setActualCompletionDate('');
      setPlanningBasis('');
    }
    setErrorMsg('');
  }, [task, defaultSprintId, sprints, isOpen]);

  if (!isOpen) return null;

  const handlePercentChange = (val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setPercentComplete(num);
    if (num >= 100 && !actualCompletionDate) {
      setActualCompletionDate(getLocalDateString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!taskCode.trim()) {
      setErrorMsg('Task Code is required (e.g. T-001)');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Task Title / Deliverable is required');
      return;
    }
    if (!sprintId) {
      setErrorMsg('Please select a sprint for this task');
      return;
    }

    if (plannedStart && plannedFinish && plannedFinish < plannedStart) {
      setErrorMsg('Planned Finish date cannot be earlier than Planned Start date');
      return;
    }

    if (Number(weight) < 0) {
      setErrorMsg('Weight must be greater than or equal to 0');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      sprintId,
      gateId: gateId || null,
      taskCode: taskCode.trim(),
      workstream: workstream.trim(),
      title: title.trim(),
      plannedStart,
      plannedFinish,
      owner: owner.trim(),
      dependency: dependency.trim(),
      weight: Number(weight) || 1,
      percentComplete: Number(percentComplete) || 0,
      actualCompletionDate: actualCompletionDate || '',
      planningBasis: planningBasis.trim()
    };

    try {
      if (isEdit) {
        await updateSprintTask(projectId, task.id, payload);
        addToast(`Updated task ${taskCode}`, 'success');
      } else {
        await createSprintTask(projectId, payload);
        addToast(`Created task ${taskCode}`, 'success');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <span className="material-symbols-outlined text-[20px]">{isEdit ? 'edit_note' : 'add_task'}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Sprint Task' : 'New Sprint Task'}</h3>
              <p className="text-xs text-slate-500">Configure task schedule, workstream, and stage gate linkage</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Task Code *</label>
              <input
                type="text"
                value={taskCode}
                onChange={(e) => setTaskCode(e.target.value)}
                placeholder="e.g. T-001"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Sprint / Wave *</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.code} {s.name ? `— ${s.name}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Task Title / Deliverable *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize governance framework, RACI, escalation path"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Workstream</label>
              <input
                type="text"
                value={workstream}
                onChange={(e) => setWorkstream(e.target.value)}
                placeholder="e.g. Governance, SIT, Data"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Related Stage Gate</label>
              <select
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">None / Unlinked</option>
                {gates.map(g => (
                  <option key={g.id} value={g.id}>{g.code} — {g.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Planned Start</label>
              <input
                type="date"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Planned Finish</label>
              <input
                type="date"
                value={plannedFinish}
                onChange={(e) => setPlannedFinish(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Responsible Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Volvitech PMO + Expertise Lead"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dependency / Entry Condition</label>
              <input
                type="text"
                value={dependency}
                onChange={(e) => setDependency(e.target.value)}
                placeholder="e.g. Signed charter, Dev access"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Weight (&ge; 0)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">% Complete (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={percentComplete}
                onChange={(e) => handlePercentChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Actual Completion Date</label>
              <input
                type="date"
                value={actualCompletionDate}
                onChange={(e) => setActualCompletionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Planning Basis / Notes</label>
            <textarea
              rows={2}
              value={planningBasis}
              onChange={(e) => setPlanningBasis(e.target.value)}
              placeholder="e.g. Charter phase window / proposed task breakdown"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Footer inside form */}
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditTaskModal;

