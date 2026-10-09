import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  INITIAL_CASH_ACCOUNTS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_EXCHANGE_RATES,
  INITIAL_MASTER_DIRECTORY
} from './financeData';

import RecordCashTransactionModal from './modals/RecordCashTransactionModal';
import { isExtraPaymentTxn, isSalaryTxn, isVendorOutflowTxn } from './CashBookFinance';

export const CashFlowFinance = () => {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Redirect unauthenticated users
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  const [data, setData] = useState(() => loadFinanceData());
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  const exchangeRates = data.exchangeRates || INITIAL_EXCHANGE_RATES;
  const accounts = data.cashAccounts || INITIAL_CASH_ACCOUNTS;
  const rawTransactions = data.cashTransactions || INITIAL_CASH_TRANSACTIONS;
  const masterDirectory = data.masterDirectory || INITIAL_MASTER_DIRECTORY;

  // Convert to USD helper
  const toUsd = (amt, curr) => {
    if (!amt) return 0;
    if (!curr || curr === 'USD') return Number(amt);
    const rate = exchangeRates[curr] || 1;
    return Number(amt) / rate;
  };

  // Format currency helper
  const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', AED: 'AED ', GBP: '£', EUR: '€', SAR: 'SAR ' };
    const prefix = symbols[currency] || `${currency} `;
    return `${prefix}${Number(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Filter transactions by entity and period
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter(txn => {
      if (selectedEntity !== 'ALL' && txn.entity !== selectedEntity) {
        return false;
      }
      if (selectedPeriod !== 'ALL') {
        const txnYear = txn.date ? txn.date.substring(0, 4) : '';
        if (selectedPeriod === '2024' && txnYear !== '2024') return false;
        if (selectedPeriod === '2023' && txnYear !== '2023') return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDesc = txn.description?.toLowerCase().includes(query);
        const matchParty = txn.counterparty?.toLowerCase().includes(query);
        const matchRef = txn.voucherNo?.toLowerCase().includes(query) || txn.reference?.toLowerCase().includes(query);
        const matchCat = txn.category?.toLowerCase().includes(query);
        if (!matchDesc && !matchParty && !matchRef && !matchCat) return false;
      }
      return true;
    });
  }, [rawTransactions, selectedEntity, selectedPeriod, searchQuery]);

  // Comprehensive Cashflow Calculation
  const metrics = useMemo(() => {
    let totalInflowUsd = 0;
    let vendorOutflowUsd = 0;
    let salaryOutflowUsd = 0;
    let rentOutflowUsd = 0;
    let cloudOutflowUsd = 0;
    let taxOutflowUsd = 0;
    let otherExtraUsd = 0;

    filteredTransactions.forEach(t => {
      const amtUsd = t.amountUsd || toUsd(t.amountNative, t.currency);

      if (t.type === 'Inflow') {
        totalInflowUsd += amtUsd;
      } else if (t.type === 'Outflow') {
        if (isSalaryTxn(t)) {
          salaryOutflowUsd += amtUsd;
        } else if (t.category?.includes('Rent') || t.category?.includes('Lease') || t.category?.includes('Facilities')) {
          rentOutflowUsd += amtUsd;
        } else if (t.category?.includes('Cloud') || t.category?.includes('Hosting') || t.category?.includes('Software')) {
          cloudOutflowUsd += amtUsd;
        } else if (t.category?.includes('Tax') || t.category?.includes('Duty')) {
          taxOutflowUsd += amtUsd;
        } else if (isExtraPaymentTxn(t)) {
          otherExtraUsd += amtUsd;
        } else {
          vendorOutflowUsd += amtUsd;
        }
      }
    });

    const totalExtraPaymentsUsd = salaryOutflowUsd + rentOutflowUsd + cloudOutflowUsd + taxOutflowUsd + otherExtraUsd;
    const totalOutflowUsd = vendorOutflowUsd + totalExtraPaymentsUsd;
    const netCashFlowUsd = totalInflowUsd - totalOutflowUsd;
    const netMarginPercent = totalInflowUsd > 0 ? ((netCashFlowUsd / totalInflowUsd) * 100).toFixed(1) : 0;

    // Total liquid cash balance across active accounts
    const totalLiquidCashUsd = accounts.reduce((acc, a) => {
      return acc + (a.balanceUsd || toUsd(a.balanceNative, a.currency));
    }, 0);

    // Monthly burn rate estimate (average monthly outflow based on extra payments + vendor)
    const monthlyBurnUsd = totalOutflowUsd > 0 ? totalOutflowUsd / 3 : 25000;
    const runwayMonths = monthlyBurnUsd > 0 ? (totalLiquidCashUsd / monthlyBurnUsd).toFixed(1) : '∞';

    return {
      totalInflowUsd,
      vendorOutflowUsd,
      salaryOutflowUsd,
      rentOutflowUsd,
      cloudOutflowUsd,
      taxOutflowUsd,
      otherExtraUsd,
      totalExtraPaymentsUsd,
      totalOutflowUsd,
      netCashFlowUsd,
      netMarginPercent,
      totalLiquidCashUsd,
      monthlyBurnUsd,
      runwayMonths
    };
  }, [filteredTransactions, accounts, exchangeRates]);

  // Handle Save Transaction
  const handleSaveTransaction = (newTxn) => {
    setData(prev => {
      const nextTxns = [newTxn, ...(prev.cashTransactions || INITIAL_CASH_TRANSACTIONS)];
      const nextData = { ...prev, cashTransactions: nextTxns };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Cash transaction ${newTxn.voucherNo} posted successfully!`, 'success');
  };

  // Export CSV Statement
  const handleExportCsv = () => {
    const headers = ['Voucher No', 'Date', 'Type', 'Counterparty', 'Category', 'Entity', 'Account', 'Native Amount', 'Currency', 'USD Equivalent', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.voucherNo,
      t.date,
      t.type,
      `"${(t.counterparty || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.entity || '').replace(/"/g, '""')}"`,
      `"${(t.accountName || '').replace(/"/g, '""')}"`,
      t.amountNative,
      t.currency,
      (t.amountUsd || toUsd(t.amountNative, t.currency)).toFixed(2),
      t.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cashflow_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Cash flow statement exported to CSV successfully.', 'success');
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Cash Flow & Liquidity Intelligence
            </h1>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Treasury
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Realtime cash inflow, operating outflow, payroll velocity, runway projections, and multi-currency balances
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/finance/cash-book"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">account_balance_wallet</span>
            <span>Cash Book</span>
          </Link>

          <Link
            to="/finance/tax"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600">balance</span>
            <span>Tax Ledger</span>
          </Link>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => setRecordModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Record Cash Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Operating Entity Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700">
            <span className="material-symbols-outlined text-[16px] text-gray-400">apartment</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase">Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Consolidated Entities</option>
              <option value="Volvitech LLC Dubai">Volvitech LLC Dubai (UAE)</option>
              <option value="Volvitech International UK">Volvitech International (UK)</option>
              <option value="Volvitech KSA Branch">Volvitech KSA (Riyadh)</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700">
            <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_today</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Recorded History</option>
              <option value="2024">Current Fiscal Year (2024)</option>
              <option value="2023">Previous Fiscal Year (2023)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search narration, party, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* KPI Cards: 4 Primary Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash Inflow */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Receipts (Inflow)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-display mt-2 font-mono">
            +${metrics.totalInflowUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Client milestones, advances & collection wires
          </p>
        </div>

        {/* Total Cash Outflow */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Total Disbursements (Outflow)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-display mt-2 font-mono">
            -${metrics.totalOutflowUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Vendors (${Math.round(metrics.vendorOutflowUsd).toLocaleString()}) + Overheads (${Math.round(metrics.totalExtraPaymentsUsd).toLocaleString()})
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className={`p-5 rounded-2xl border shadow-2xs relative overflow-hidden ${
          metrics.netCashFlowUsd >= 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-rose-50/40 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
              Net Cash Flow
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              metrics.netCashFlowUsd >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {metrics.netMarginPercent}% Margin
            </span>
          </div>
          <div className={`text-2xl font-extrabold font-display mt-2 font-mono ${
            metrics.netCashFlowUsd >= 0 ? 'text-blue-900' : 'text-rose-600'
          }`}>
            {metrics.netCashFlowUsd >= 0 ? '+' : ''}${metrics.netCashFlowUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-600 mt-1">
            Net cash generation after all operating charges
          </p>
        </div>

        {/* Liquid Treasury & Runway */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
              Treasury & Runway
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-display mt-2 font-mono">
            ${metrics.totalLiquidCashUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            Est. Runway: ~{metrics.runwayMonths} Months of burn
          </p>
        </div>
      </div>

      {/* Cash Accounts Summary Cards */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">account_balance</span>
              <span>Corporate Bank Accounts & Vault Liquidity</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Live balances reconciled across all registered enterprise financial institutions
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {accounts.length} Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-white hover:border-blue-200 transition shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{acc.currency} Account</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-xs font-bold text-gray-900 mt-1 truncate">{acc.accountName}</div>
              <div className="text-lg font-black text-gray-900 font-mono mt-1">
                {formatCurrency(acc.balanceNative, acc.currency)}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                ≈ ${Math.round(acc.balanceUsd || toUsd(acc.balanceNative, acc.currency)).toLocaleString()} USD
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expense Allocation & Burn Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[18px]">pie_chart</span>
          <span>Operating Outflow Breakdown by Function</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-700 uppercase">Vendor POs</span>
            <div className="text-base font-bold text-purple-900 font-mono mt-1">
              ${Math.round(metrics.vendorOutflowUsd).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Salaries & Payroll</span>
            <div className="text-base font-bold text-emerald-900 font-mono mt-1">
              ${Math.round(metrics.salaryOutflowUsd).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase">Office Rent</span>
            <div className="text-base font-bold text-blue-900 font-mono mt-1">
              ${Math.round(metrics.rentOutflowUsd).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Cloud & Hosting</span>
            <div className="text-base font-bold text-amber-900 font-mono mt-1">
              ${Math.round(metrics.cloudOutflowUsd).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-700 uppercase">Tax Duties</span>
            <div className="text-base font-bold text-rose-900 font-mono mt-1">
              ${Math.round(metrics.taxOutflowUsd).toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-700 uppercase">Other Overheads</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              ${Math.round(metrics.otherExtraUsd).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Cash Flow Movement Journal</h3>
            <p className="text-xs text-gray-500">Chronological ledger of cash injections and disbursements</p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Showing {filteredTransactions.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Voucher / Date</th>
                <th className="px-5 py-3">Particulars & Category</th>
                <th className="px-5 py-3">Counterparty</th>
                <th className="px-5 py-3">Bank Account</th>
                <th className="px-5 py-3 text-right">Cash Movement</th>
                <th className="px-5 py-3 text-right">USD Equivalent</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No cashflow records matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => {
                  const isInflow = txn.type === 'Inflow';
                  const usdVal = txn.amountUsd || toUsd(txn.amountNative, txn.currency);

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-gray-900">{txn.voucherNo}</div>
                        <div className="text-[10px] text-gray-400">{txn.date}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-gray-900 font-semibold">{txn.description}</div>
                        <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded mt-0.5">
                          {txn.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-800">
                        {txn.counterparty || 'Corporate Treasury'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                        {txn.accountName}
                      </td>
                      <td className={`px-5 py-3 whitespace-nowrap text-right font-mono font-bold ${
                        isInflow ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isInflow ? '+' : '-'}{formatCurrency(txn.amountNative, txn.currency)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-gray-700">
                        ${usdVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {txn.status || 'Cleared'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Modal */}
      <RecordCashTransactionModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        accounts={accounts}
        companies={masterDirectory}
        exchangeRates={exchangeRates}
        onSave={handleSaveTransaction}
        initialType="Inflow"
        initialCompany=""
      />
    </div>
  );
};

export default CashFlowFinance;
