import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData
} from './financeData';
import {
  calcInvoiceState,
  getInvoicePayments,
  validateClientPayment,
  convertToUsd,
  reconcileInvoiceAfterPaymentDeletion,
  reverseCashTransactionForPayment,
  createLinkedClientPaymentCashTransaction,
  applyCashTransactionToAccounts
} from './financeCalcs';
import { apiDeletePaymentReceived } from '../../services/financeApi';
import RecordPaymentReceivedModal from './modals/RecordPaymentReceivedModal';

// Seed receipts matching design standard when database has no records yet
const SEED_RECEIPTS = [
  {
    id: 'RCPT-2026007',
    date: '2025-12-25',
    clientName: 'Prasanna Technologies',
    invoiceNumber: 'VOL-IN-EXP-10010',
    linkedPo: 'PO-GLF-2024-03',
    type: 'Full',
    amountNative: 52500,
    amountUsd: 52500,
    currency: 'USD',
    mode: 'Wire Remittance',
    reference: 'UTR-IN-992019',
    status: 'Settled',
    notes: 'Settled in full via Fedwire'
  },
  {
    id: 'RCPT-2026003',
    date: '2025-11-10',
    clientName: 'Barik IT Solutions LLC',
    invoiceNumber: 'VOL-IN-EXP-10005',
    linkedPo: 'PO-KSA-2024-11',
    type: 'Full',
    amountNative: 1200,
    amountUsd: 1200,
    currency: 'USD',
    mode: 'Corporate ACH',
    reference: 'ACH-8821034',
    status: 'Settled',
    notes: 'Final milestone settlement'
  },
  {
    id: 'RCPT-2026001',
    date: '2025-10-28',
    clientName: 'Barik IT Solutions LLC',
    invoiceNumber: 'VOL-IN-EXP-10006',
    linkedPo: 'PO-KSA-2024-11',
    type: 'Full',
    amountNative: 1200,
    amountUsd: 1200,
    currency: 'USD',
    mode: 'Fedwire',
    reference: 'WIRE-2025-99',
    status: 'Settled',
    notes: 'Advance retainer payment'
  }
];

const formatReceiptDate = (dateStr) => {
  if (!dateStr) return '—';
  // If already formatted like "25 Dec 2025", return directly
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatCurrencyAmount = (amount, curr = 'USD') => {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  });
  if (curr === 'USD') return `$${formatted}`;
  if (curr === 'INR') return `₹${formatted}`;
  if (curr === 'AED') return `AED ${formatted}`;
  if (curr === 'SAR') return `SAR ${formatted}`;
  return `${curr} ${formatted}`;
};

const ReceiptsPage = () => {
  const { addToast } = useToast();
  const [data, setData] = useState(() => {
    const stored = loadFinanceData();
    if (!stored.paymentsReceived || stored.paymentsReceived.length === 0) {
      return {
        ...stored,
        paymentsReceived: SEED_RECEIPTS
      };
    }
    return stored;
  });

  const [activeCurrency, setActiveCurrency] = useState('USD');
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [receiptToEdit, setReceiptToEdit] = useState(null);

  // Load and subscribe to real-time finance data
  useEffect(() => {
    fetchFinanceData().then((res) => {
      if (res && Array.isArray(res.paymentsReceived) && res.paymentsReceived.length > 0) {
        setData(res);
      } else {
        setData(prev => ({
          ...prev,
          paymentsReceived: prev.paymentsReceived?.length ? prev.paymentsReceived : SEED_RECEIPTS
        }));
      }
    }).catch(err => {
      console.warn('[ReceiptsPage] Error fetching remote finance data:', err);
    });

    const unsub = subscribeFinanceData((updated) => {
      if (updated) {
        setData(prev => ({
          ...updated,
          paymentsReceived: updated.paymentsReceived?.length ? updated.paymentsReceived : prev.paymentsReceived
        }));
      }
    });
    return unsub;
  }, []);

  const rawPayments = data.paymentsReceived && data.paymentsReceived.length > 0
    ? data.paymentsReceived
    : SEED_RECEIPTS;

  const invoices = data.invoices || [];

  // Enriched receipts with calculated invoice balance and type
  const enrichedReceipts = useMemo(() => {
    return rawPayments.map(pmt => {
      const inv = invoices.find(i => i.invoiceNumber === pmt.invoiceNumber);
      let invoiceBalance = 0;
      let isPartial = false;

      if (inv) {
        const linkedPmts = getInvoicePayments(inv.invoiceNumber, rawPayments);
        const state = calcInvoiceState(inv, linkedPmts, { exchangeRates: data.exchangeRates });
        invoiceBalance = state.balanceNative !== undefined ? state.balanceNative : state.balanceUsd;
        isPartial = state.status === 'Partially Paid' || (invoiceBalance > 0 && Number(pmt.amountNative || pmt.amountUsd) < Number(inv.amountNative || inv.amountUsd));
      } else {
        isPartial = Boolean(pmt.isPartial || pmt.type?.toLowerCase() === 'partial');
        invoiceBalance = pmt.invoiceBalance !== undefined ? pmt.invoiceBalance : 0;
      }

      const receiptType = pmt.type || (isPartial ? 'Partial' : 'Full');

      return {
        ...pmt,
        type: receiptType,
        isPartial,
        invoiceBalance,
        displayAmount: pmt.amountNative !== undefined && pmt.amountNative !== null ? pmt.amountNative : (pmt.amountUsd || 0)
      };
    });
  }, [rawPayments, invoices, data.exchangeRates]);

  // Filtered receipts by selected currency
  const filteredReceipts = useMemo(() => {
    if (!activeCurrency || activeCurrency === 'ALL') return enrichedReceipts;
    return enrichedReceipts.filter(r => (r.currency || 'USD').toUpperCase() === activeCurrency.toUpperCase());
  }, [enrichedReceipts, activeCurrency]);

  // Summary KPIs for active currency
  const totalReceived = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + (Number(r.displayAmount) || 0), 0);
  }, [filteredReceipts]);

  const totalReceiptsCount = filteredReceipts.length;

  const partialReceiptsCount = useMemo(() => {
    return filteredReceipts.filter(r => r.type?.toLowerCase() === 'partial' || r.isPartial).length;
  }, [filteredReceipts]);

  // Handle saving a recorded payment receipt
  const handleSavePaymentReceived = ({ invoiceNumber, payment: newPayment }) => {
    const targetInvoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    const linked = getInvoicePayments(invoiceNumber, rawPayments);
    const pmtUsd = newPayment.amountUsd !== undefined && newPayment.amountUsd !== null
      ? newPayment.amountUsd
      : convertToUsd(newPayment.amountNative, newPayment.currency, data.exchangeRates);

    if (targetInvoice) {
      const validation = validateClientPayment(targetInvoice, linked, pmtUsd);
      if (!validation.valid) {
        addToast(validation.error, 'error');
        return;
      }
    }

    const receiptObj = {
      ...newPayment,
      id: newPayment.id || `RCPT-${Date.now().toString().slice(-7)}`,
      clientName: newPayment.clientName || targetInvoice?.clientName || 'Client Entity',
      invoiceNumber,
      linkedPo: newPayment.linkedPo || targetInvoice?.linkedPo || targetInvoice?.poNumber || '',
      type: newPayment.isPartial ? 'Partial' : 'Full',
      amountNative: Number(newPayment.amountNative) || Number(newPayment.amount) || pmtUsd,
      amountUsd: pmtUsd,
      currency: newPayment.currency || 'USD',
      status: 'Settled'
    };

    setData(prev => {
      const nextPayments = [receiptObj, ...(prev.paymentsReceived || [])];
      let nextInvoices = prev.invoices || [];

      if (targetInvoice) {
        const updatedLinked = [receiptObj, ...linked];
        const state = calcInvoiceState(targetInvoice, updatedLinked, { exchangeRates: prev.exchangeRates });
        nextInvoices = (prev.invoices || []).map(inv => {
          if (inv.invoiceNumber === invoiceNumber) {
            return {
              ...inv,
              receivedUsd: state.receivedUsd,
              balanceUsd: state.balanceUsd,
              status: state.status,
            };
          }
          return inv;
        });
      }

      // Automatically create matching cash_transactions entry linked by payment id
      const chosenAccount = (prev.cashAccounts || []).find(a => a.id === receiptObj.accountId) || (prev.cashAccounts || [])[0];
      const cashTx = createLinkedClientPaymentCashTransaction({
        payment: receiptObj,
        chosenAccount,
        invoiceNumber
      });
      const nextCashAccounts = applyCashTransactionToAccounts(cashTx, prev.cashAccounts || []);
      const nextCashTransactions = [cashTx, ...(prev.cashTransactions || [])];

      const nextData = {
        ...prev,
        invoices: nextInvoices,
        paymentsReceived: nextPayments,
        cashAccounts: nextCashAccounts,
        cashTransactions: nextCashTransactions,
      };
      saveFinanceData(nextData);
      return nextData;
    });

    addToast(`Payment receipt ${receiptObj.id} recorded successfully!`, 'success');
  };

  // Handle deleting / voiding a payment receipt
  const handleDeleteReceipt = async (paymentId, invoiceNumber) => {
    if (!window.confirm(`Are you sure you want to void/delete payment receipt ${paymentId}? This will reverse the linked transaction and update invoice balance.`)) {
      return;
    }

    try {
      await apiDeletePaymentReceived(paymentId);
    } catch (err) {
      console.warn('[ReceiptsPage] Remote delete skipped or failed, updating local state:', err);
    }

    setData(prev => {
      const remainingPmts = (prev.paymentsReceived || []).filter(p => p.id !== paymentId);
      const { updatedAccounts, remainingTransactions } = reverseCashTransactionForPayment(
        paymentId,
        prev.cashTransactions || [],
        prev.cashAccounts || []
      );
      const nextInvoices = reconcileInvoiceAfterPaymentDeletion(
        invoiceNumber,
        remainingPmts,
        prev.invoices || [],
        prev.exchangeRates || {}
      );
      const nextData = {
        ...prev,
        paymentsReceived: remainingPmts,
        invoices: nextInvoices,
        cashAccounts: updatedAccounts,
        cashTransactions: remainingTransactions
      };
      saveFinanceData(nextData);
      return nextData;
    });

    addToast(`Payment receipt ${paymentId} removed.`, 'info');
  };

  // Handle updating an existing receipt
  const handleSaveEditedReceipt = (updatedReceipt) => {
    setData(prev => {
      const nextPayments = (prev.paymentsReceived || []).map(p => p.id === updatedReceipt.id ? { ...p, ...updatedReceipt } : p);
      const nextData = {
        ...prev,
        paymentsReceived: nextPayments
      };
      saveFinanceData(nextData);
      return nextData;
    });
    setReceiptToEdit(null);
    addToast(`Receipt ${updatedReceipt.id} updated.`, 'success');
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] text-left px-4 sm:px-8 py-6 space-y-6">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Receipts
            </h1>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Collections
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Full and partial payments received from clients
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRecordModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            <span>Record receipt</span>
          </button>
        </div>
      </div>

      {/* Dedicated Page Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2 text-gray-500 font-medium flex-wrap">
          <Link to="/finance" className="hover:text-blue-600 transition flex items-center gap-1 font-semibold text-gray-600">
            <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
            <span>Finance</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold flex items-center gap-1.5">
            <span>Accounts Receivable</span>
            <span className="text-gray-300">/</span>
            <span className="text-blue-600 font-bold">Receipts</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700">AR</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/finance/supplier"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            <span>Supplier Side (AP)</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/finance/cash-book"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Cash Book</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Currency Switcher Filter */}
      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
        <span className="text-gray-400 select-none">CURRENCY</span>
        <div className="flex items-center gap-1.5 ml-1">
          {['INR', 'USD', 'AED'].map((curr) => {
            const isActive = activeCurrency === curr;
            return (
              <button
                key={curr}
                type="button"
                onClick={() => setActiveCurrency(curr)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                {curr}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: TOTAL RECEIVED */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            TOTAL RECEIVED
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
            {formatCurrencyAmount(totalReceived, activeCurrency)}
          </div>
        </div>

        {/* Card 2: RECEIPTS COUNT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            RECEIPTS
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
            {totalReceiptsCount}
          </div>
        </div>

        {/* Card 3: PARTIAL COUNT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            PARTIAL
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
            {partialReceiptsCount}
          </div>
        </div>
      </div>

      {/* Receipts Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider bg-gray-50/50">
              <tr>
                <th className="py-3.5 px-6 font-semibold">RECEIPT NO.</th>
                <th className="py-3.5 px-6 font-semibold">DATE</th>
                <th className="py-3.5 px-6 font-semibold">PARTY</th>
                <th className="py-3.5 px-6 font-semibold">INVOICE</th>
                <th className="py-3.5 px-6 font-semibold">TYPE</th>
                <th className="py-3.5 px-6 font-semibold">AMOUNT</th>
                <th className="py-3.5 px-6 font-semibold">INVOICE BALANCE</th>
                <th className="py-3.5 px-6 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((rcpt) => (
                  <tr key={rcpt.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-mono font-semibold text-blue-600">
                      {rcpt.id}
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {formatReceiptDate(rcpt.date)}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {rcpt.clientName}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-600">
                      {rcpt.invoiceNumber || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        rcpt.type === 'Full' || (!rcpt.isPartial && rcpt.type !== 'Partial')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {rcpt.type || (rcpt.isPartial ? 'Partial' : 'Full')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900 font-mono">
                      {formatCurrencyAmount(rcpt.displayAmount, rcpt.currency || activeCurrency)}
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-600">
                      {formatCurrencyAmount(rcpt.invoiceBalance, rcpt.currency || activeCurrency)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-gray-400">
                        <button
                          type="button"
                          onClick={() => setReceiptToEdit(rcpt)}
                          className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit receipt"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReceipt(rcpt.id, rcpt.invoiceNumber)}
                          className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete receipt"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    No receipts found for {activeCurrency}. Click "+ Record receipt" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentReceivedModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSave={handleSavePaymentReceived}
        invoices={invoices}
        paymentsReceived={rawPayments}
        cashAccounts={data.cashAccounts || []}
        exchangeRates={data.exchangeRates || {}}
      />

      {/* Edit Receipt Modal */}
      {receiptToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100 animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-display">Edit Receipt</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{receiptToEdit.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptToEdit(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveEditedReceipt({
                  ...receiptToEdit,
                  date: formData.get('date'),
                  amountNative: parseFloat(formData.get('amount')) || receiptToEdit.amountNative,
                  amountUsd: parseFloat(formData.get('amount')) || receiptToEdit.amountUsd,
                  reference: formData.get('reference'),
                  mode: formData.get('mode'),
                  type: formData.get('type')
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-gray-500 font-semibold mb-1">Receipt Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={receiptToEdit.date}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Amount ({receiptToEdit.currency || 'USD'})</label>
                <input
                  type="number"
                  step="any"
                  name="amount"
                  defaultValue={receiptToEdit.displayAmount}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Type</label>
                  <select
                    name="type"
                    defaultValue={receiptToEdit.type || 'Full'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Full">Full</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 font-semibold mb-1">Payment Mode</label>
                  <input
                    type="text"
                    name="mode"
                    defaultValue={receiptToEdit.mode || 'Wire Remittance'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-semibold mb-1">Reference / UTR</label>
                <input
                  type="text"
                  name="reference"
                  defaultValue={receiptToEdit.reference || ''}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReceiptToEdit(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsPage;
