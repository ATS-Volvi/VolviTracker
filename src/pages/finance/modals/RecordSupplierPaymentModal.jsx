import React, { useState, useMemo } from 'react';
import {
  calcSupplierPoState,
  getSupplierPoPayments,
  validateSupplierPayment,
  convertToUsd,
  getExchangeRate,
  toCents,
  roundMoney
} from '../financeCalcs';

const RecordSupplierPaymentModal = ({
  isOpen,
  onClose,
  onSave,
  supplierPos = [],
  paymentsMade = [],
  cashAccounts = [],
  exchangeRates = {}
}) => {
  // Pre-calculate status and balance for each supplier PO
  const supplierPosWithState = useMemo(() => {
    return supplierPos.map(spo => {
      const linked = getSupplierPoPayments(spo.poNumber, paymentsMade);
      const state = calcSupplierPoState(spo, linked, { exchangeRates });
      return {
        ...spo,
        calculatedBalanceUsd: state.balanceUsd,
        calculatedPaidUsd: state.paidUsd,
        calculatedStatus: state.status,
      };
    });
  }, [supplierPos, paymentsMade, exchangeRates]);

  const pendingPos = supplierPosWithState.filter(spo => spo.calculatedBalanceUsd > 0);
  const availablePos = pendingPos.length > 0 ? pendingPos : supplierPosWithState;

  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [mode, setMode] = useState('SWIFT Wire Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('Payment disbursed against approved 3-way matched supplier invoice');
  const [errorMsg, setErrorMsg] = useState('');

  const activePoNumber = selectedPoNumber || availablePos[0]?.poNumber || '';
  const currentPo = supplierPosWithState.find(spo => spo.poNumber === activePoNumber) || availablePos[0];

  React.useEffect(() => {
    if (isOpen) {
      const initialPo = availablePos[0];
      if (initialPo) {
        setSelectedPoNumber(initialPo.poNumber);
        setAmount(String(initialPo.calculatedBalanceUsd > 0 ? initialPo.calculatedBalanceUsd : (initialPo.billedUsd || initialPo.committedUsd || 0)));
        setCurrency(initialPo.currency || 'USD');
      }
      const defAcc = cashAccounts.find(a => a.currency === initialPo?.currency) ||
                     cashAccounts.find(a => a.isPrimary) ||
                     cashAccounts[0];
      if (defAcc) setSelectedAccountId(defAcc.id);
      setReference(`TX-DISB-${Math.floor(100000 + Math.random() * 900000)}`);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePoChange = (poNum) => {
    setSelectedPoNumber(poNum);
    setErrorMsg('');
    const spo = supplierPosWithState.find(s => s.poNumber === poNum);
    if (spo) {
      setAmount(String(spo.calculatedBalanceUsd > 0 ? spo.calculatedBalanceUsd : (spo.billedUsd || spo.committedUsd || 0)));
      setCurrency(spo.currency || 'USD');
      const matchingAcc = cashAccounts.find(a => a.currency === spo.currency) ||
                          cashAccounts.find(a => a.isPrimary) ||
                          cashAccounts[0];
      if (matchingAcc) setSelectedAccountId(matchingAcc.id);
    }
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setErrorMsg('');
    if (!currentPo) return;
    const pmtAmount = parseFloat(val) || 0;
    const pmtUsd = currency === 'USD' ? pmtAmount : convertToUsd(pmtAmount, currency, exchangeRates);
    const linked = getSupplierPoPayments(currentPo.poNumber, paymentsMade);
    const validation = validateSupplierPayment(currentPo, linked, pmtUsd);
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
    const linked = getSupplierPoPayments(activePoNumber, paymentsMade);
    const validation = validateSupplierPayment(currentPo, linked, pmtUsd);

    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    const chosenAcc = cashAccounts.find(a => a.id === selectedAccountId) ||
                      cashAccounts.find(a => a.isPrimary) ||
                      cashAccounts[0];
    const rateUsed = getExchangeRate(currency, exchangeRates);

    const newPayment = {
      id: `PMT-SUP-${Date.now()}`,
      date,
      supplierName: currentPo?.supplierName || 'Supplier',
      supplierPoNumber: activePoNumber,
      amountNative: roundMoney(pmtAmount),
      currency,
      exchangeRate: rateUsed,
      amountUsd: roundMoney(pmtUsd),
      accountId: chosenAcc?.id || '',
      accountName: chosenAcc?.accountName || 'Primary Operating Treasury Account',
      mode,
      reference,
      status: 'Paid',
      notes
    };

    onSave(newPayment, activePoNumber);
    onClose();
  };

  const remainingBalance = currentPo?.calculatedBalanceUsd ?? 0;

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
              value={activePoNumber}
              onChange={(e) => handlePoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
            >
              {availablePos.map(spo => (
                <option key={spo.id || spo.poNumber} value={spo.poNumber}>
                  {spo.poNumber} · {spo.supplierName} (${spo.committedUsd?.toLocaleString()}) · Bal: ${spo.calculatedBalanceUsd?.toLocaleString()}
                </option>
              ))}
            </select>
            {currentPo && (
              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                <span>Committed: <strong>${currentPo.committedUsd?.toLocaleString()}</strong></span>
                <span>Remaining Balance: <strong className={remainingBalance > 0 ? 'text-indigo-700' : 'text-gray-600'}>${remainingBalance.toLocaleString()}</strong></span>
              </div>
            )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-gray-700 font-semibold">Disbursed Amount *</label>
                {remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => handleAmountChange(String(remainingBalance))}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
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
                  errorMsg ? 'border-rose-400 bg-rose-50/30 text-rose-700' : 'border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
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
              Disbursement Cash Account *
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
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
            <span>Recording this payment will deduct the exact disbursement from the PO balance without modifying billed commitment totals.</span>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
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
