import React, { useState, useEffect } from 'react';
import { approveGate } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';
import { getLocalDateString } from './planCalcs';

export function ApproveGateModal({
  isOpen,
  onClose,
  projectId,
  gate,
  currentUser,
  onSuccess
}) {
  const { addToast } = useToast();
  const [approvalDate, setApprovalDate] = useState(getLocalDateString());
  const [approvedBy, setApprovedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (gate) {
      setApprovalDate(gate.actualApprovalDate || getLocalDateString());
      setApprovedBy(gate.approvedBy || currentUser?.fullName || currentUser?.name || currentUser?.email || 'Project Manager');
      setNotes(gate.decisionNotes || '');
    }
    setErrorMsg('');
  }, [gate, currentUser, isOpen]);

  if (!isOpen || !gate) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!approvalDate) {
      setErrorMsg('Approval Date is required');
      return;
    }
    if (!approvedBy.trim()) {
      setErrorMsg('Approver name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await approveGate(projectId, gate.id, {
        approvalDate,
        approvedBy: approvedBy.trim(),
        notes: notes.trim()
      });
      addToast(`Gate ${gate.code} formally approved!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to approve gate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Approve Stage Gate</h3>
              <p className="text-xs text-slate-500">Formally record gate review decision and acceptance</p>
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200">
                {gate.code}
              </span>
              <span className="font-bold text-slate-900 text-sm">{gate.name}</span>
            </div>
            {gate.exitCriteria && (
              <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">Exit Criteria:</span> {gate.exitCriteria}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Approval Date *</label>
              <input
                type="date"
                value={approvalDate}
                onChange={(e) => setApprovalDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Approved By *</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                required
                placeholder="e.g. Swastik Kumar (PM)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Decision Notes / Rationale</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. All blueprint deliverables verified and signed off by stakeholders without critical blockers."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApproveGateModal;

