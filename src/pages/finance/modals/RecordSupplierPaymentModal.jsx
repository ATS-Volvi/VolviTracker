import React, { useState } from 'react';

const RecordSupplierPaymentModal = ({
  isOpen,
  onClose,
  onSave,
  supplierPos = []
}) => {
  const [selectedPoNumber, setSelectedPoNumber] = useState(supplierPos[0]?.poNumber || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(supplierPos[0]?.billedUsd || 50000);
  const [currency, setCurrency] = useState(supplierPos[0]?.currency || 'USD');
  const [mode, setMode] = useState('SWIFT Wire Transfer');
  const [reference, setReference] = useState(`TX-DISB-${Math.floor(100000 + Math.random() * 900000)}`);
  const [notes, setNotes] = useState('Payment disbursed against approved 3-way matched supplier invoice');

  if (!isOpen) return null;

  const currentPo = supplierPos.find(spo => spo.poNumber === selectedPoNumber) || supplierPos[0];

  const handlePoChange = (poNum) => {
    setSelectedPoNumber(poNum);
    const spo = supplierPos.find(s => s.poNumber === poNum);
    if (spo) {
      setAmount(spo.billedUsd || 30000);
      setCurrency(spo.currency || 'USD');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pmtAmount = parseFloat(amount) || 0;

    const newPayment = {
      id: `PMT-SUP-${Date.now()}`,
      date,
      supplierName: currentPo?.supplierName || 'Supplier',
      supplierPoNumber: selectedPoNumber,
      amountNative: pmtAmount,
      currency,
      amountUsd: currency === 'USD' ? pmtAmount : currency === 'AED' ? pmtAmount / 3.67 : currency === 'SAR' ? pmtAmount / 3.75 : pmtAmount / 83.2,
      mode,
      reference,
      status: 'Paid',
      notes
    };

    onSave(newPayment, selectedPoNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-[22px]">account_balance_wallet</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Record Supplier Payment Made</h3>
              <p className="text-xs text-gray-500">Record disbursement to vendor against verified PO commitments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Target Supplier PO / Bill *</label>
            <select
              value={selectedPoNumber}
              onChange={(e) => handlePoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
            >
              {supplierPos.map(spo => (
                <option key={spo.id} value={spo.poNumber}>
                  {spo.poNumber} · {spo.supplierName} (${spo.committedUsd?.toLocaleString()}) · {spo.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Disbursement Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Payment Method *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="SWIFT Wire Transfer">SWIFT Wire Transfer</option>
                <option value="RTGS / NEFT">RTGS / NEFT (India)</option>
                <option value="ACH / Federal Wire">ACH / Federal Wire (USA)</option>
                <option value="SADAD Local Transfer">SADAD Local Transfer (KSA)</option>
                <option value="Corporate Demand Draft">Corporate Demand Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Disbursed Amount *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Currency</label>
              <input
                type="text"
                readOnly
                value={currency}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-bold font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Remittance Reference / UTR Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. UTR-HDFC-99120814"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Payment Advice Note</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-indigo-600">shield_lock</span>
            <span>Supplier payment updates AP paid ledgers, reduces open payables, and finalizes milestone settlement.</span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Confirm Payment Made</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordSupplierPaymentModal;
