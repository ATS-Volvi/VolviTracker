import React, { useState } from 'react';

const RegisterClientPOModal = ({ isOpen, onClose, onSave, clients = [] }) => {
  const [poNumber, setPoNumber] = useState(`PO-CLT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [clientName, setClientName] = useState(clients[0]?.name || 'Gulf Utilities Co.');
  const [scope, setScope] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [totalValue, setTotalValue] = useState('');
  const [terms, setTerms] = useState('Net 30');
  const [milestonesCount, setMilestonesCount] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(totalValue) || 0;
    const count = parseInt(milestonesCount, 10) || 1;
    const splitAmount = Math.round((val / count) * 100) / 100;

    const milestones = Array.from({ length: count }, (_, i) => ({
      name: `Milestone ${i + 1}: Scope Phase ${i + 1}`,
      amount: splitAmount,
      status: 'Unbilled'
    }));

    onSave({
      id: `CPO-${Date.now()}`,
      poNumber,
      issueDate: new Date().toISOString().split('T')[0],
      clientName,
      flag: currency === 'INR' ? '🇮🇳' : currency === 'AED' ? '🇦🇪' : currency === 'SAR' ? '🇸🇦' : '🇺🇸',
      country: currency === 'INR' ? 'India' : currency === 'AED' ? 'UAE' : currency === 'SAR' ? 'KSA' : 'USA',
      scope: scope || 'Enterprise Software Engineering Scope',
      totalValueNative: val,
      currency,
      totalValueUsd: currency === 'USD' ? val : currency === 'AED' ? val / 3.67 : currency === 'SAR' ? val / 3.75 : val / 83.2,
      invoicedNative: 0,
      drawdownPercent: 0,
      remainingNative: val,
      remainingPercent: 100,
      terms,
      status: 'Open',
      milestones
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">add_task</span>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-display">Register Client Purchase Order</h2>
              <p className="text-xs text-gray-500">Intake formal SOW/PO to enable milestone drawdowns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Client PO #</label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Client Account</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Gulf Utilities Co., NexaCorp"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Scope / SOW Title</label>
            <input
              type="text"
              required
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Core Banking API Microservices Phase 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total PO Value ({currency})</label>
              <input
                type="number"
                step="any"
                required
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Terms</label>
              <select
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Milestone Drawdowns</label>
            <select
              value={milestonesCount}
              onChange={(e) => setMilestonesCount(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="1">1 Lump Sum Milestone (100%)</option>
              <option value="2">2 Milestones (50% / 50%)</option>
              <option value="3">3 Milestones (Equal Drawdowns)</option>
              <option value="4">4 Milestones (Quarterly 25%)</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Each milestone unlocks auto invoice generation against client contract.</p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Register Client PO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterClientPOModal;
