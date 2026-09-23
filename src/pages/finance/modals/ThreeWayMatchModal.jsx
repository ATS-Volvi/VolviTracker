import React, { useState } from 'react';

const ThreeWayMatchModal = ({ isOpen, onClose, supplierPo = null, onVerify }) => {
  const [billNumber, setBillNumber] = useState(`BILL-VND-${Math.floor(1000 + Math.random() * 9000)}`);
  const [billAmount, setBillAmount] = useState(supplierPo?.remainingUsd ? String(supplierPo.remainingUsd) : '30000');
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(true);
  const [pmApproved, setPmApproved] = useState(true);
  const [isAudited, setIsAudited] = useState(false);

  if (!isOpen) return null;

  const po = supplierPo || {
    poNumber: 'PO-SUP-2024-114',
    supplierName: 'Apex Cloud Infrastructure Ltd',
    entity: 'Volvitech Tech FZ-LLC',
    linkedProject: 'PRJ-2024-01',
    linkedClientPo: 'PO-GLF-2024-03',
    committedUsd: 140000,
    billedUsd: 110000,
    remainingUsd: 30000,
    currency: 'USD'
  };

  const parsedAmount = parseFloat(billAmount) || 0;
  const isWithinBudget = parsedAmount <= po.remainingUsd;

  const handleVerify = () => {
    setIsAudited(true);
    if (onVerify) {
      onVerify({
        poNumber: po.poNumber,
        billNumber,
        amount: parsedAmount,
        status: isWithinBudget ? 'Verified & Approved' : 'Variance Hold'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-gray-100 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-[24px]">verified_user</span>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-display">Record Supplier Bill & 3-Way Match Verification</h2>
              <p className="text-xs text-gray-500">Cross-reference PO Commitment, Delivery Signoff, and Vendor Invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Purchase Order */}
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Pillar 1: Supplier PO</span>
                <span className="material-symbols-outlined text-blue-600 text-[18px]">shopping_bag</span>
              </div>
              <p className="font-mono font-bold text-gray-900 text-xs">{po.poNumber}</p>
              <div className="text-[11px] text-gray-600 space-y-0.5">
                <div>Committed: <span className="font-semibold text-gray-800">${po.committedUsd.toLocaleString()}</span></div>
                <div>Prior Billed: <span className="text-gray-500">${po.billedUsd.toLocaleString()}</span></div>
                <div>Headroom: <span className="font-bold text-emerald-600">${po.remainingUsd.toLocaleString()}</span></div>
              </div>
            </div>

            {/* 2. Delivery / Milestone Signoff */}
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Pillar 2: Deliverable Signoff</span>
                <span className="material-symbols-outlined text-purple-600 text-[18px]">task_alt</span>
              </div>
              <p className="font-bold text-gray-900 text-xs">Project PM Acceptance</p>
              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryConfirmed}
                    onChange={(e) => setDeliveryConfirmed(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-[11px] text-gray-700">Deliverables Received</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pmApproved}
                    onChange={(e) => setPmApproved(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="text-[11px] text-gray-700">PM Signoff Signed</span>
                </label>
              </div>
            </div>

            {/* 3. Vendor Invoice */}
            <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Pillar 3: Vendor Bill</span>
                <span className="material-symbols-outlined text-amber-600 text-[18px]">receipt_long</span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Bill # Ref</label>
                <input
                  type="text"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full text-xs font-mono px-2 py-1 border border-gray-200 rounded mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Bill Amount (USD)</label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full text-xs font-bold px-2 py-1 border border-gray-200 rounded mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Audit Verification Result Box */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
            isWithinBudget && deliveryConfirmed && pmApproved
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <span className={`material-symbols-outlined text-[24px] ${
              isWithinBudget && deliveryConfirmed && pmApproved ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isWithinBudget && deliveryConfirmed && pmApproved ? 'check_circle' : 'warning'}
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">
                {isWithinBudget && deliveryConfirmed && pmApproved
                  ? '3-Way Match Verified (Clean Approval)'
                  : '3-Way Match Exception Detected'}
              </p>
              <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                {isWithinBudget
                  ? `Vendor bill of $${parsedAmount.toLocaleString()} is within PO headroom ($${po.remainingUsd.toLocaleString()}). Deliverables and PM approvals are verified.`
                  : `Variance Alert: Bill amount $${parsedAmount.toLocaleString()} exceeds remaining PO headroom ($${po.remainingUsd.toLocaleString()}) by $${(parsedAmount - po.remainingUsd).toLocaleString()}.`}
              </p>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Linked to Client Project: <strong className="text-gray-700">{po.linkedProject}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleVerify}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>{isAudited ? 'Audit Logged ✓' : 'Approve & Post to AP'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeWayMatchModal;
