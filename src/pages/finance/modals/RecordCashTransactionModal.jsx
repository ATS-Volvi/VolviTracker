import React, { useState, useEffect } from 'react';

const CATEGORIES = {
  Inflow: [
    'Client Collection',
    'Client Advance',
    'Retention Release',
    'Interest & Dividends',
    'Tax Refund',
    'Other Inflow'
  ],
  Outflow: [
    'Vendor Payment',
    'Supplier Milestone PO',
    'Subcontractor Settlement',
    'Materials & Hardware Delivery',
    'Other Vendor Payment'
  ],
  ExtraPayment: [
    'Salary & Employee Payroll',
    'Executive & Contractor Stipend',
    'Office Rent & Lease',
    'Utilities & Facilities',
    'Cloud & IT Hosting (AWS/GCP/Azure)',
    'Software Licenses & Subscriptions',
    'Tax & Statutory Duty Remittance',
    'Legal & Audit Consultation',
    'Travel & Client Logistics',
    'Petty Cash Operational Overhead',
    'Other Operational Payment'
  ],
  Transfer: [
    'Inter-Account Transfer',
    'Treasury Cash Replenishment',
    'Liquidity Balancing',
    'Forex Conversion Transfer'
  ]
};

const PAYMENT_MODES = [
  'SWIFT Wire Transfer',
  'Fedwire / ACH',
  'RTGS / NEFT',
  'SADAD / Local Wire',
  'Corporate Credit Card',
  'Direct Debit / Auto-Pay',
  'Bank Cheque',
  'Cash Voucher'
];

export const RecordCashTransactionModal = ({
  isOpen,
  onClose,
  accounts = [],
  companies = [],
  exchangeRates = {},
  onSave,
  initialType = 'Inflow',
  initialCompany = ''
}) => {
  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [category, setCategory] = useState(CATEGORIES.Inflow[0]);
  const [counterparty, setCounterparty] = useState(initialCompany || '');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [amountNative, setAmountNative] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('Reconciled');
  const [notes, setNotes] = useState('');

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      const cats = CATEGORIES[initialType] || CATEGORIES.Inflow;
      setCategory(cats[0]);
      
      const targetCompany = companies.find(c => c.name === initialCompany);
      const initialCur = targetCompany?.currency || 'USD';
      setCurrency(initialCur);

      const matchingAccount = accounts.find(a => a.currency === initialCur) || accounts[0];
      if (matchingAccount) {
        setAccountId(matchingAccount.id);
      }

      const secondAcc = accounts[1] || accounts[0];
      if (secondAcc) {
        setTransferToAccountId(secondAcc.id);
      }

      setDate(new Date().toISOString().split('T')[0]);
      setReference(`VR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setCounterparty(initialCompany || '');
      setDescription(initialCompany ? `Settlement transaction with ${initialCompany}` : '');
      setAmountNative('');
      setNotes('');
      setStatus('Reconciled');
    }
  }, [isOpen, initialType, initialCompany, accounts, companies]);

  // When account changes, update currency
  const handleAccountChange = (accId) => {
    setAccountId(accId);
    const acc = accounts.find(a => a.id === accId);
    if (acc) {
      setCurrency(acc.currency || 'USD');
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    const cats = CATEGORIES[newType] || CATEGORIES.Inflow;
    setCategory(cats[0]);
    if (newType === 'Transfer' && !counterparty) {
      setCounterparty('Internal Treasury');
    }
  };

  if (!isOpen) return null;

  const selectedAccount = accounts.find(a => a.id === accountId) || accounts[0];
  const selectedTransferAccount = accounts.find(a => a.id === transferToAccountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(amountNative);
    if (isNaN(num) || num <= 0) return;

    const rate = exchangeRates[currency] || (currency === 'USD' ? 1.0 : currency === 'AED' ? 3.67 : currency === 'SAR' ? 3.75 : 83.2);
    const amountUsd = currency === 'USD' ? num : num / rate;

    const newTxn = {
      id: `CB-TXN-${Date.now()}`,
      voucherNo: reference || `VR-${Date.now()}`,
      date,
      type,
      category,
      accountId: selectedAccount?.id,
      accountName: selectedAccount?.accountName || 'Bank Account',
      transferToAccountId: type === 'Transfer' ? selectedTransferAccount?.id : undefined,
      transferToAccountName: type === 'Transfer' ? selectedTransferAccount?.accountName : undefined,
      entity: selectedAccount?.entity || 'Corporate Headquarters',
      counterparty: counterparty.trim() || (type === 'Transfer' ? 'Internal Transfer' : 'General Counterparty'),
      description: description.trim() || `${category} - ${paymentMode}`,
      reference: reference.trim(),
      paymentMode,
      currency,
      amountNative: num,
      amountUsd,
      status,
      notes: notes.trim(),
    };

    onSave(newTxn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[24px]">account_balance_wallet</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Record Cash Book Entry</h3>
              <p className="text-xs text-gray-500">Record cash & bank transaction with live account balance update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Type Selector Pills */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Transaction Classification *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('Inflow')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold border transition text-center ${
                  type === 'Inflow'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">arrow_downward</span>
                <span>Inflow (Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Outflow')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold border transition text-center ${
                  type === 'Outflow'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">shopping_cart_checkout</span>
                <span>Vendor Outflow</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('ExtraPayment')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold border transition text-center ${
                  type === 'ExtraPayment'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">payments</span>
                <span>Extra Payment (Salary / OpEx)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Transfer')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-bold border transition text-center ${
                  type === 'Transfer'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">sync_alt</span>
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                {type === 'Transfer' ? 'From Bank / Cash Account *' : 'Bank / Cash Account *'}
              </label>
              <select
                value={accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.currency}) - {acc.entity}
                  </option>
                ))}
              </select>
            </div>

            {type === 'Transfer' ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  To Destination Account *
                </label>
                <select
                  value={transferToAccountId}
                  onChange={(e) => setTransferToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                  required
                >
                  {accounts.filter(a => a.id !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} ({acc.currency}) - {acc.entity}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Operating Legal Entity
                </label>
                <input
                  type="text"
                  value={selectedAccount?.entity || 'Corporate Headquarters'}
                  disabled
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Date & Voucher Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Transaction Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Voucher / Ref # *</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="VR-2024-XXXX"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Accounting Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500"
              >
                {(CATEGORIES[type] || CATEGORIES.Inflow).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount, Currency & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Amount *</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={amountNative}
                  onChange={(e) => setAmountNative(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-14 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-mono font-bold"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">
                  {currency}
                </span>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-bold"
              >
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="INR">INR (₹)</option>
                <option value="SAR">SAR (﷼)</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Payment Instrument / Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500"
              >
                {PAYMENT_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Counterparty & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-600">
                  {type === 'Inflow' ? 'Received From (Client / Remitter) *' : type === 'Outflow' ? 'Paid To (Vendor / Beneficiary) *' : 'Counterparty Entity *'}
                </label>
                {companies.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">Registered Company</span>
                )}
              </div>
              <input
                type="text"
                list="company-list"
                value={counterparty}
                onChange={(e) => {
                  const val = e.target.value;
                  setCounterparty(val);
                  const matched = companies.find(c => c.name.toLowerCase() === val.toLowerCase());
                  if (matched && matched.currency) {
                    setCurrency(matched.currency);
                    const matchingAcc = accounts.find(a => a.currency === matched.currency);
                    if (matchingAcc) setAccountId(matchingAcc.id);
                  }
                }}
                placeholder={type === 'Inflow' ? 'e.g. Gulf Utilities Co.' : type === 'Outflow' ? 'e.g. DataCore Systems India Ltd' : 'Internal Treasury'}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-semibold text-gray-900"
                required
              />
              <datalist id="company-list">
                {companies.map(c => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.category} • {c.country} ({c.currency})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Reconciliation Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 font-semibold"
              >
                <option value="Reconciled">Reconciled (Matched with Bank Statement)</option>
                <option value="Cleared">Cleared (Funds Dispatched / Settled)</option>
                <option value="Pending">Pending (In Transit / Unconfirmed)</option>
              </select>
            </div>
          </div>

          {/* Description & Particulars */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Particulars / Narration *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Tranche milestone wire transfer received against approved invoice"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Audit Notes / Cheque Details</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes, wire verification code, bank slip remarks..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          {/* Summary Box */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/80 flex items-center justify-between text-xs">
            <span className="text-gray-500">Live Equivalent in Base USD:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              ${amountNative && !isNaN(parseFloat(amountNative))
                ? (
                    (parseFloat(amountNative) / (exchangeRates[currency] || (currency === 'USD' ? 1.0 : currency === 'AED' ? 3.67 : currency === 'SAR' ? 3.75 : 83.2)))
                  ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'
              }
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 ${
                type === 'Inflow'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'Outflow'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : type === 'ExtraPayment'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Post to Cash Book</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordCashTransactionModal;
