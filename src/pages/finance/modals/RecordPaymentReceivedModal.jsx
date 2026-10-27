import React, { useState, useMemo } from 'react';
import {
  calcInvoiceState,
  getInvoicePayments,
  validateClientPayment,
  convertToUsd,
  getExchangeRate,
  toCents,
  roundMoney
} from '../financeCalcs';

const RecordPaymentReceivedModal = ({
  isOpen,
  onClose,
  onSave,
  invoices = [],
  paymentsReceived = [],
  cashAccounts = [],
  exchangeRates = {}
}) => {
  // Pre-calculate status and balance for each invoice
  const invoicesWithState = useMemo(() => {
    return invoices.map(inv => {
      const linked = getInvoicePayments(inv.invoiceNumber, paymentsReceived);
      const state = calcInvoiceState(inv, linked, { exchangeRates });
      return {
        ...inv,
        calculatedBalanceUsd: state.balanceUsd,
        calculatedReceivedUsd: state.receivedUsd,
        calculatedStatus: state.status,
      };
    });
  }, [invoices, paymentsReceived, exchangeRates]);

  const pendingInvoices = invoicesWithState.filter(inv => inv.calculatedBalanceUsd > 0);
  const availableInvoices = pendingInvoices.length > 0 ? pendingInvoices : invoicesWithState;

  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [mode, setMode] = useState('SWIFT Wire / Fedwire');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('Full milestone payment credited to primary treasury account');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep state synchronized with selected invoice
  const activeInvoiceNumber = selectedInvoiceNumber || availableInvoices[0]?.invoiceNumber || '';
  const currentInv = invoicesWithState.find(inv => inv.invoiceNumber === activeInvoiceNumber) || availableInvoices[0];

  React.useEffect(() => {
    if (isOpen) {
      const initialInv = availableInvoices[0];
      if (initialInv) {
        setSelectedInvoiceNumber(initialInv.invoiceNumber);
        setAmount(String(initialInv.calculatedBalanceUsd > 0 ? initialInv.calculatedBalanceUsd : initialInv.amountUsd || 0));
        setCurrency(initialInv.currency || 'USD');
      }
      // Pick default account matching currency or primary account
      const defAcc = cashAccounts.find(a => a.currency === initialInv?.currency) ||
                     cashAccounts.find(a => a.isPrimary) ||
                     cashAccounts[0];
      if (defAcc) setSelectedAccountId(defAcc.id);
      setReference(`TX-RCV-${Math.floor(100000 + Math.random() * 900000)}`);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInvoiceChange = (invNum) => {
    setSelectedInvoiceNumber(invNum);
    setErrorMsg('');
    const inv = invoicesWithState.find(i => i.invoiceNumber === invNum);
    if (inv) {
      setAmount(String(inv.calculatedBalanceUsd > 0 ? inv.calculatedBalanceUsd : inv.amountUsd || 0));
      setCurrency(inv.currency || 'USD');
      const matchingAcc = cashAccounts.find(a => a.currency === inv.currency) ||
                          cashAccounts.find(a => a.isPrimary) ||
                          cashAccounts[0];
      if (matchingAcc) setSelectedAccountId(matchingAcc.id);
    }
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setErrorMsg('');
    if (!currentInv) return;
    const pmtAmount = parseFloat(val) || 0;
    const pmtUsd = currency === 'USD' ? pmtAmount : convertToUsd(pmtAmount, currency, exchangeRates);
    const linked = getInvoicePayments(currentInv.invoiceNumber, paymentsReceived);
    const validation = validateClientPayment(currentInv, linked, pmtUsd);
    if (!validation.valid && validation.isOverpayment) {
      setErrorMsg(validation.error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pmtAmount = parseFloat(amount) || 0;
    if (pmtAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    const pmtUsd = currency === 'USD' ? pmtAmount : convertToUsd(pmtAmount, currency, exchangeRates);
    const linked = getInvoicePayments(activeInvoiceNumber, paymentsReceived);
    const validation = validateClientPayment(currentInv, linked, pmtUsd);

    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    const chosenAcc = cashAccounts.find(a => a.id === selectedAccountId) ||
                      cashAccounts.find(a => a.isPrimary) ||
                      cashAccounts[0];
    const rateUsed = getExchangeRate(currency, exchangeRates);

    const newPayment = {
      id: `PMT-RCV-${Date.now()}`,
      date,
      clientName: currentInv?.clientName || 'Client',
      invoiceNumber: activeInvoiceNumber,
      linkedPo: currentInv?.linkedPo || '',
      amountNative: roundMoney(pmtAmount),
      currency,
      exchangeRate: rateUsed,
      amountUsd: roundMoney(pmtUsd),
      accountId: chosenAcc?.id || '',
      accountName: chosenAcc?.accountName || 'Primary Operating Treasury Account',
      mode,
      reference,
      status: 'Settled',
      notes
    };

    onSave(newPayment, activeInvoiceNumber);
    onClose();
  };

  const remainingBalance = currentInv?.calculatedBalanceUsd ?? 0;

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
              value={activeInvoiceNumber}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium"
            >
              {availableInvoices.map(inv => (
                <option key={inv.id || inv.invoiceNumber} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} · {inv.clientName} · ${inv.amountUsd?.toLocaleString()} (Bal: ${inv.calculatedBalanceUsd?.toLocaleString()})
                </option>
              ))}
            </select>
            {currentInv && (
              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                <span>Invoice Total: <strong>${currentInv.amountUsd?.toLocaleString()}</strong></span>
                <span>Remaining Balance: <strong className={remainingBalance > 0 ? 'text-emerald-700' : 'text-gray-600'}>${remainingBalance.toLocaleString()}</strong></span>
              </div>
            )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-gray-700 font-semibold">Amount Received *</label>
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => handleAmountChange(String(remainingBalance))}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    Pay Full Balance
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl focus:outline-hidden font-bold font-mono ${
                  errorMsg ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
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

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] flex items-center gap-1.5 animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Deposit Cash Account *
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              {cashAccounts.length > 0 ? (
                cashAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName} ({acc.currency}) — {acc.bankName || acc.entity || 'Treasury'}
                  </option>
                ))
              ) : (
                <option value="">Primary Operating Treasury Account (USD)</option>
              )}
            </select>
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
            <span>Recording this payment will deduct the exact amount from the invoice balance and update status to Partially Paid or Paid.</span>
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
              disabled={Boolean(errorMsg)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
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
