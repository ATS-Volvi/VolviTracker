import React, { useState } from 'react';
import { revokeGate } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';

export function RevokeGateModal({
  isOpen,
  onClose,
  projectId,
  gate,
  onSuccess
}) {
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !gate) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reason.trim()) {
      setErrorMsg('A valid reason for revoking gate approval is mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      await revokeGate(projectId, gate.id, { reason: reason.trim() });
      addToast(`Approval revoked for gate ${gate.code}`, 'info');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to revoke gate approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <span className="material-symbols-outlined text-[20px]">undo</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Revoke Gate Approval</h3>
              <p className="text-xs text-slate-500">Admin Action: Rollback formal approval for {gate.code}</p>
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Warning: Reverting Stage Gate Approval
            </div>
            This will clear the actual approval date and record this revocation and rationale in the audit logs.
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Reason for Revocation *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="e.g. Critical defect INT-04 discovered during downstream integration; re-testing required."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? 'Revoking...' : 'Revoke Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RevokeGateModal;

