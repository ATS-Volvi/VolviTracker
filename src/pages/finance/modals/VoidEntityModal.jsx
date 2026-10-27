import React, { useState, useEffect } from 'react';

export const VoidEntityModal = ({
  isOpen,
  onClose,
  onConfirm,
  entityType = 'Invoice', // 'Invoice' | 'Client PO' | 'Supplier PO'
  entity = null,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen, entity]);

  if (!isOpen || !entity) return null;

  const entityTitle = entityType === 'Invoice'
    ? entity.invoiceNumber || entity.id
    : (entity.poNumber || entity.id);

  const counterparty = entity.clientName || entity.supplierName || '';
  const amount = entity.amountNative ?? entity.totalValueNative ?? entity.committedNative ?? entity.amountUsd ?? 0;
  const currency = entity.currency || 'USD';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError('A justification reason is required to void this record.');
      return;
    }
    if (cleanReason.length < 5) {
      setError('Please provide a more detailed reason (at least 5 characters).');
      return;
    }
    onConfirm(cleanReason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl backdrop-blur-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Void {entityType}</h3>
              <p className="text-rose-100 text-xs">Excludes record from financial totals & locks permanently</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Entity Overview Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs text-rose-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-800 uppercase tracking-wider text-[10px]">Record Identifier</span>
              <span className="font-mono font-bold text-sm text-slate-800">{entityTitle}</span>
            </div>
            {counterparty && (
              <div className="flex items-center justify-between">
                <span className="text-rose-700">Counterparty:</span>
                <span className="font-medium text-slate-700">{counterparty}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-rose-700">Nominal Amount:</span>
              <span className="font-semibold text-slate-900">{currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Warning Advisory */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex gap-3 text-xs text-amber-900">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1">
              <p className="font-semibold">Important Financial Audit Notice:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-800 text-[11px]">
                <li>This record will not be deleted from the database, but marked as <strong className="font-semibold text-rose-700">Void</strong>.</li>
                <li>Amounts are completely zeroed out in revenue, receivables, and balance summaries.</li>
                {entityType === 'Invoice' && (
                  <li>Linked Client PO drawdown will automatically recalculate and restore remaining balance.</li>
                )}
                <li>An audit entry with your user details, timestamp, and justification will be logged.</li>
              </ul>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Voiding <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Duplicate milestone invoice created in error; client requested credit cancellation."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Provide specific business justification required for compliance and audit logs.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Voiding...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Confirm Void</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
