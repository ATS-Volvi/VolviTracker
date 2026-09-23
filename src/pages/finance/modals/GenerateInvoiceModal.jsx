import React, { useState } from 'react';

const GenerateInvoiceModal = ({ isOpen, onClose, onSave, clientPos = [] }) => {
  const [selectedPoId, setSelectedPoId] = useState(clientPos[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-2024-00${Math.floor(60 + Math.random() * 40)}`);
  const [milestoneName, setMilestoneName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxPercent, setTaxPercent] = useState('5.0');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const selectedPo = clientPos.find(p => p.id === selectedPoId) || clientPos[0];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount) || (selectedPo?.remainingNative ? selectedPo.remainingNative / 2 : 50000);
    const tax = parseFloat(taxPercent) || 0;
    const totalAmount = val * (1 + tax / 100);

    onSave({
      id: `INV-${Date.now()}`,
      invoiceNumber,
      linkedPo: selectedPo?.poNumber || 'PO-GEN-01',
      clientName: selectedPo?.clientName || 'Client Account',
      country: selectedPo?.country || 'USA',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate,
      amountNative: totalAmount,
      currency: selectedPo?.currency || 'USD',
      amountUsd: selectedPo?.currency === 'USD' ? totalAmount : selectedPo?.currency === 'AED' ? totalAmount / 3.67 : selectedPo?.currency === 'SAR' ? totalAmount / 3.75 : totalAmount / 83.2,
      receivedUsd: 0,
      balanceUsd: selectedPo?.currency === 'USD' ? totalAmount : selectedPo?.currency === 'AED' ? totalAmount / 3.67 : selectedPo?.currency === 'SAR' ? totalAmount / 3.75 : totalAmount / 83.2,
      status: 'Pending',
      milestone: milestoneName || 'Milestone Delivery & Acceptance Signoff',
      taxPercent: tax
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">flash_on</span>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-display">Generate Client Invoice (Drawdown)</h2>
              <p className="text-xs text-gray-500">Auto-calculated invoice against registered Client PO cap</p>
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Client Sales PO</label>
            <select
              value={selectedPoId}
              onChange={(e) => {
                setSelectedPoId(e.target.value);
                const po = clientPos.find(p => p.id === e.target.value);
                if (po) {
                  setAmount(po.remainingNative > 0 ? (po.remainingNative / 2).toString() : '50000');
                }
              }}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {clientPos.map(po => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} — {po.clientName} ({po.currency} {po.totalValueNative.toLocaleString()} | {po.drawdownPercent}% Billed)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Milestone / Scope Deliverable</label>
            <input
              type="text"
              required
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Milestone 4: Final UAT & Cloud Integration Signoff"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Drawdown Subtotal ({selectedPo?.currency || 'USD'})
              </label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Amount to draw down"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tax / VAT / GST Rate</label>
              <select
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="0">0% (Zero-Rated / Export SOW)</option>
                <option value="5.0">5.0% (UAE FTA VAT)</option>
                <option value="15.0">15.0% (KSA ZATCA VAT)</option>
                <option value="18.0">18.0% (India GST 9%+9%)</option>
              </select>
            </div>
          </div>

          {selectedPo && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>Total PO Cap:</span>
                <span className="font-semibold text-gray-900">{selectedPo.currency} {selectedPo.totalValueNative.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Already Invoiced:</span>
                <span className="font-semibold text-blue-600">{selectedPo.currency} {selectedPo.invoicedNative.toLocaleString()} ({selectedPo.drawdownPercent}%)</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Remaining Drawdown Room:</span>
                <span className="font-semibold text-emerald-600">{selectedPo.currency} {selectedPo.remainingNative.toLocaleString()}</span>
              </div>
            </div>
          )}

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
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Generate Tax Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoiceModal;
