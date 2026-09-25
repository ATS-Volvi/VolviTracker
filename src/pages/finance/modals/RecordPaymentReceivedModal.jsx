import React, { useState } from 'react';

const RecordPaymentReceivedModal = ({
  isOpen,
  onClose,
  onSave,
  invoices = []
}) => {
  const pendingInvoices = invoices.filter(inv => inv.status !== 'Paid');
  const availableInvoices = pendingInvoices.length > 0 ? pendingInvoices : invoices;

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState(availableInvoices[0]?.invoiceNumber || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(availableInvoices[0]?.balanceUsd || availableInvoices[0]?.amountUsd || '');
  const [currency, setCurrency] = useState(availableInvoices[0]?.currency || 'USD');
  const [mode, setMode] = useState('SWIFT Wire / Fedwire');
  const [reference, setReference] = useState(`TX-RCV-${Math.floor(100000 + Math.random() * 900000)}`);
  const [notes, setNotes] = useState('Full milestone payment credited to primary treasury account');

  if (!isOpen) return null;

  const currentInv = invoices.find(inv => inv.invoiceNumber === selectedInvoiceNumber) || availableInvoices[0];

  const handleInvoiceChange = (invNum) => {
    setSelectedInvoiceNumber(invNum);
    const inv = invoices.find(i => i.invoiceNumber === invNum);
    if (inv) {
      setAmount(inv.balanceUsd || inv.amountUsd);
      setCurrency(inv.currency || 'USD');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pmtAmount = parseFloat(amount) || 0;

    const newPayment = {
      id: `PMT-RCV-${Date.now()}`,
      date,
      clientName: currentInv?.clientName || 'Client',
      invoiceNumber: selectedInvoiceNumber,
      linkedPo: currentInv?.linkedPo || '',
      amountNative: pmtAmount,
      currency,
      amountUsd: currency === 'USD' ? pmtAmount : currency === 'AED' ? pmtAmount / 3.67 : currency === 'SAR' ? pmtAmount / 3.75 : pmtAmount / 83.2,
      mode,
      reference,
      status: 'Settled',
      notes
    };

    onSave(newPayment, selectedInvoiceNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[22px]">payments</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Record Client Payment Received</h3>
              <p className="text-xs text-gray-500">Update invoice status, reduce AR exposure, and update PO consumption</p>
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
            <label className="block text-gray-700 font-semibold mb-1">Target Client Invoice *</label>
            <select
              value={selectedInvoiceNumber}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium"
            >
              {availableInvoices.map(inv => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} · {inv.clientName} · ${inv.amountUsd?.toLocaleString()} ({inv.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Payment Mode *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="SWIFT Wire / Fedwire">SWIFT Wire / Fedwire</option>
                <option value="ACH Direct Deposit">ACH Direct Deposit</option>
                <option value="RTGS / NEFT">RTGS / NEFT (India)</option>
                <option value="SADAD Transfer">SADAD Transfer (KSA)</option>
                <option value="Letter of Credit (L/C)">Letter of Credit (L/C)</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Amount Received *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold font-mono"
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
            <label className="block text-gray-700 font-semibold mb-1">Bank Reference / UTR Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. UTR891240189 or WIRE-REF-9921"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Settlement Memo / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
            <span>Recording this payment will mark the invoice as settled, increment collected cash totals, and reduce accounts receivable exposure.</span>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Confirm Payment Received</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentReceivedModal;
