import React, { useState, useEffect } from 'react';
import { createGate, updateGate } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';

export function AddEditGateModal({
  isOpen,
  onClose,
  projectId,
  gate = null,
  onSuccess
}) {
  const { addToast } = useToast();
  const isEdit = Boolean(gate && gate.id);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [approvers, setApprovers] = useState('');
  const [requiredEvidence, setRequiredEvidence] = useState('');
  const [exitCriteria, setExitCriteria] = useState('');
  const [notesRisk, setNotesRisk] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (gate) {
      setCode(gate.code || '');
      setName(gate.name || '');
      setTargetDate(gate.targetDate || '');
      setApprovers(gate.approvers || '');
      setRequiredEvidence(gate.requiredEvidence || '');
      setExitCriteria(gate.exitCriteria || '');
      setNotesRisk(gate.notesRisk || '');
    } else {
      setCode('');
      setName('');
      setTargetDate('');
      setApprovers('');
      setRequiredEvidence('');
      setExitCriteria('');
      setNotesRisk('');
    }
    setErrorMsg('');
  }, [gate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code.trim()) {
      setErrorMsg('Gate Code is required (e.g. SG-00)');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Gate Name is required');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      code: code.trim(),
      name: name.trim(),
      targetDate: targetDate || '',
      approvers: approvers.trim(),
      requiredEvidence: requiredEvidence.trim(),
      exitCriteria: exitCriteria.trim(),
      notesRisk: notesRisk.trim()
    };

    try {
      if (isEdit) {
        await updateGate(projectId, gate.id, payload);
        addToast(`Updated gate ${code}`, 'success');
      } else {
        await createGate(projectId, payload);
        addToast(`Created gate ${code}`, 'success');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save gate');
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
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <span className="material-symbols-outlined text-[20px]">{isEdit ? 'rule_settings' : 'add_task'}</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Edit Stage Gate' : 'New Stage Gate'}</h3>
              <p className="text-xs text-slate-500">Configure stage gate milestones, approvers, and exit criteria</p>
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
              <label className="font-bold text-slate-700 block mb-1">Gate Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SG-00"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Gate Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Solution Design Approval Gate"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Approver(s) per Charter / To Confirm</label>
            <input
              type="text"
              value={approvers}
              onChange={(e) => setApprovers(e.target.value)}
              placeholder="e.g. Sponsor + Program Director, Project Manager"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Required Evidence / Entry Checklist (Semicolon separated)</label>
            <textarea
              rows={3}
              value={requiredEvidence}
              onChange={(e) => setRequiredEvidence(e.target.value)}
              placeholder="Signed charter; agreed scope/exclusions; governance/RACI; SAP DEV access"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Items separated by semicolons (;) are automatically converted into interactive checklist items.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Proposed Exit / Acceptance Criteria</label>
            <textarea
              rows={2}
              value={exitCriteria}
              onChange={(e) => setExitCriteria(e.target.value)}
              placeholder="e.g. Project initiation formally approved and decision recorded."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Risk</label>
            <input
              type="text"
              value={notesRisk}
              onChange={(e) => setNotesRisk(e.target.value)}
              placeholder="e.g. Verify actual status; target date has passed."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Gate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditGateModal;

