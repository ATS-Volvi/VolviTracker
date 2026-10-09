import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  INITIAL_EXCHANGE_RATES,
  INITIAL_CASH_TRANSACTIONS
} from './financeData';

export const TaxFinance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState(() => loadFinanceData());
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Subscribe to real-time finance data
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  const exchangeRates = data.exchangeRates || INITIAL_EXCHANGE_RATES;
  const invoices = data.invoices || [];
  const supplierPos = data.supplierPos || [];
  const cashTransactions = data.cashTransactions || INITIAL_CASH_TRANSACTIONS;

  // Calculate Output Tax (VAT/GST collected on client invoices)
  const outputTax = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      const vatRate = inv.vatRate || 0.05; // default 5%
      const vatUsd = (inv.amountUsd || 0) * (vatRate / (1 + vatRate));
      return {
        totalUsd: acc.totalUsd + vatUsd,
        count: acc.count + 1
      };
    }, { totalUsd: 0, count: 0 });
  }, [invoices]);

  // Calculate Input Tax (VAT/GST paid on supplier POs)
  const inputTax = useMemo(() => {
    return supplierPos.reduce((acc, spo) => {
      const taxPct = (spo.taxPercent || 5) / 100;
      const taxUsd = (spo.totalValueUsd || 0) * (taxPct / (1 + taxPct));
      return {
        totalUsd: acc.totalUsd + taxUsd,
        count: acc.count + 1
      };
    }, { totalUsd: 0, count: 0 });
  }, [supplierPos]);

  // Tax Remittance cash transactions
  const taxTransactions = useMemo(() => {
    return cashTransactions.filter(t =>
      t.category?.toLowerCase().includes('tax') ||
      t.description?.toLowerCase().includes('tax') ||
      t.description?.toLowerCase().includes('gst') ||
      t.description?.toLowerCase().includes('tds') ||
      t.description?.toLowerCase().includes('vat')
    );
  }, [cashTransactions]);

  const totalTaxPaidUsd = useMemo(() => {
    return taxTransactions.reduce((acc, t) => acc + (t.amountUsd || 0), 0);
  }, [taxTransactions]);

  const netVatPayable = Math.max(0, outputTax.totalUsd - inputTax.totalUsd);

  // Statutory Compliance Filings Calendar
  const complianceFilings = [
    {
      id: 'FIL-01',
      type: 'GST / VAT Return (Q1)',
      entity: 'Volvitech UAE FZ-LLC',
      authority: 'Federal Tax Authority (FTA)',
      dueDate: '2024-04-28',
      period: 'Jan 2024 - Mar 2024',
      status: 'Filed & Cleared',
      challanRef: 'FTA-VAT-2024-Q1-99',
      estimatedTax: 12450
    },
    {
      id: 'FIL-02',
      type: 'Corporate Tax Advance Installment',
      entity: 'Volvitech India Pvt Ltd',
      authority: 'Income Tax Dept (CBDT)',
      dueDate: '2024-06-15',
      period: 'FY 2024-25 Q1',
      status: 'Paid / Pending Filing',
      challanRef: 'CHALLAN-IT-202404',
      estimatedTax: 17427.88
    },
    {
      id: 'FIL-03',
      type: 'Form 16 / TDS Salary Deduction',
      entity: 'Volvitech India Pvt Ltd',
      authority: 'TRACES / NSDL',
      dueDate: '2024-05-31',
      period: 'Monthly Remittance (Mar)',
      status: 'Reconciled',
      challanRef: 'TDS-IND-881920',
      estimatedTax: 4620
    },
    {
      id: 'FIL-04',
      type: 'US Corporate Franchise & Sales Tax',
      entity: 'Volvitech US Corp',
      authority: 'Delaware Division of Revenue',
      dueDate: '2024-06-01',
      period: 'Annual Franchise 2024',
      status: 'Upcoming',
      challanRef: 'DE-CORP-DUE',
      estimatedTax: 2500
    },
    {
      id: 'FIL-05',
      type: 'Zakat, Tax and Customs (ZATCA) Filing',
      entity: 'Volvitech KSA Branch',
      authority: 'ZATCA Kingdom of Saudi Arabia',
      dueDate: '2024-07-31',
      period: 'Q2 2024 VAT Audit',
      status: 'Upcoming',
      challanRef: 'ZATCA-SCHED-02',
      estimatedTax: 8900
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Tax & Statutory Compliance Ledger
            </h1>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Statutory Duty
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Output vs Input VAT/GST reconciliations, corporate tax provisions, withholding tax, and filing schedules
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

          <button
            onClick={() => {
              addToast('Tax reconciliation report downloaded as Excel/PDF', 'success');
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
            <span>Export Tax Audit</span>
          </button>

          <button
            onClick={() => setShowRecordModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>+ Record Tax Challan</span>
          </button>
        </div>
      </div>

      {/* KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Output VAT Collected */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Output Tax Collected</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg material-symbols-outlined text-[18px]">
              call_received
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-mono">
            ${Math.round(outputTax.totalUsd).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">
            From {outputTax.count} active Client Tax Invoices
          </p>
        </div>

        {/* Input VAT Paid */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Input Tax Credit (ITC)</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg material-symbols-outlined text-[18px]">
              call_made
            </span>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 font-mono">
            ${Math.round(inputTax.totalUsd).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">
            Deductible across {inputTax.count} Supplier POs
          </p>
        </div>

        {/* Net VAT Liability */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Tax Liability</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg material-symbols-outlined text-[18px]">
              balance
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            ${Math.round(netVatPayable).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">
            Estimated net payable to tax authorities
          </p>
        </div>

        {/* Total Remitted */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Statutory Duty Paid</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg material-symbols-outlined text-[18px]">
              verified
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ${Math.round(totalTaxPaidUsd).toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400">
            Cleared via bank tax portal challans
          </p>
        </div>
      </div>

      {/* Statutory Filing Compliance Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Statutory Filing Schedule & Tax Compliance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Corporate Income Tax, GST/VAT Returns, TDS & Withholding deadlines</p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {complianceFilings.length} Filings Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100 font-bold">
              <tr>
                <th className="py-3 px-4">Filing Type</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Authority</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Tax Amount</th>
                <th className="py-3 px-4">Challan / Ref</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complianceFilings.map((fil) => (
                <tr key={fil.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    {fil.type}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 font-medium">
                    {fil.entity}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {fil.authority}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {fil.period}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-800">
                    {fil.dueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                    ${fil.estimatedTax.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-blue-600">
                    {fil.challanRef}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      fil.status.includes('Filed') || fil.status.includes('Reconciled')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : fil.status.includes('Paid')
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {fil.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Remittance Ledger (from Cash Transactions) */}
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Tax Remittance & Challan Payment Records</h3>
            <p className="text-xs text-gray-400 mt-0.5">Historical treasury disbursements for statutory duty settlement</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {taxTransactions.length} Remittances Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100 font-bold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Operating Entity</th>
                <th className="py-3 px-4">Payee Authority</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Reference / Challan</th>
                <th className="py-3 px-4 text-right">Native Amount</th>
                <th className="py-3 px-4 text-right">USD Equivalent</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {taxTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-4 font-mono text-gray-600">
                    {tx.date}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {tx.voucherNo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {tx.entity}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    {tx.counterparty}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {tx.accountName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-800">
                    {tx.reference}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-gray-700">
                    {tx.currency} {tx.amountNative?.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                    ${Math.round(tx.amountUsd || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Challan Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Record Tax Challan Remittance</h3>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Record a tax challan remittance directly into the cash book and update statutory compliance status.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Tax Category</label>
                <select className="w-full border rounded-lg p-2">
                  <option>Corporate Income Tax Advance</option>
                  <option>GST / Output VAT Remittance</option>
                  <option>Withholding Tax / TDS Remittance</option>
                  <option>Zakat & Customs Clearance</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Challan / CIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. CIN-2024-00918"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Amount (USD)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowRecordModal(false)}
                className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  addToast('Tax Challan successfully recorded and reconciled!', 'success');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
              >
                Save Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxFinance;
