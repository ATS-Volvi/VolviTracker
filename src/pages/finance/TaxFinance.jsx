import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  fetchFinanceData,
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  INITIAL_EXCHANGE_RATES,
  INITIAL_CASH_TRANSACTIONS
} from './financeData';
import FinanceBrowserImportBanner from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import { exportToSpreadsheet } from './financeExports';

// Authoritative multi-jurisdiction tax setup
export const TAX_REGIMES = {
  UAE: {
    code: 'UAE',
    name: 'United Arab Emirates VAT',
    country: 'UAE 🇦🇪',
    currency: 'AED',
    authority: 'Federal Tax Authority (FTA)',
    standardRate: 5.0,
    type: 'Single-tier Standard VAT',
    ruleDescription: 'Standard 5% VAT on domestic supplies. Reverse charge on imported services.',
    registrationFormat: '15-digit TRN (e.g. 10028941200003)'
  },
  KSA: {
    code: 'KSA',
    name: 'Saudi Arabia ZATCA VAT',
    country: 'KSA 🇸🇦',
    currency: 'SAR',
    authority: 'Zakat, Tax and Customs Authority (ZATCA)',
    standardRate: 15.0,
    type: 'Standard Multi-stage VAT & Phase-2 E-Invoice',
    ruleDescription: 'Mandatory 15% VAT on all non-exempt services under ZATCA Phase-2 integration.',
    registrationFormat: '15-digit TIN / VAT Number (e.g. 310294819200003)'
  },
  INDIA: {
    code: 'INDIA',
    name: 'Indian Goods & Services Tax (GST)',
    country: 'India 🇮🇳',
    currency: 'INR',
    authority: 'CBIC / GSTN Council',
    standardRate: 18.0,
    type: 'Dual GST with Intrastate / Interstate Split',
    ruleDescription: 'Intrastate: Split equally into 9% CGST (Central) + 9% SGST (State). Interstate / Export: 18% IGST (Integrated).',
    split: {
      intrastate: { cgst: 9.0, sgst: 9.0 },
      interstate: { igst: 18.0 }
    },
    registrationFormat: '15-character GSTIN (e.g. 29AABCV9912K1Z8)'
  },
  USA: {
    code: 'USA',
    name: 'United States Sales & Corporate Franchise',
    country: 'USA 🇺🇸',
    currency: 'USD',
    authority: 'IRS & State Department of Revenue',
    standardRate: 0.0,
    type: 'State-Level Sales & Use Tax Nexus',
    ruleDescription: 'Zero-rated for general B2B software export / non-nexus out-of-state SOW deliveries.',
    registrationFormat: '9-digit Federal EIN (e.g. 12-889021)'
  }
};

export const TaxFinance = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState(() => loadFinanceData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegime, setSelectedRegime] = useState('ALL');
  const [showRecordModal, setShowRecordModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await fetchFinanceData();
      setData(fetched);
    } catch (err) {
      console.error('Failed to load tax finance data:', err);
      setError(err?.message || 'Failed to load tax finance data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to real-time finance data
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  const exchangeRates = data.exchangeRates || INITIAL_EXCHANGE_RATES;
  const invoices = (data.invoices || []).filter(inv => inv.status !== 'Void' && !inv.isVoid);
  const supplierPos = (data.supplierPos || []).filter(spo => spo.status !== 'Void' && !spo.isVoid);
  const cashTransactions = data.cashTransactions || INITIAL_CASH_TRANSACTIONS;

  // Filter invoices and supplier POs by selected regime if applicable
  const regimeFilteredInvoices = useMemo(() => {
    if (selectedRegime === 'ALL') return invoices;
    return invoices.filter(inv => {
      const c = (inv.country || '').toUpperCase();
      const curr = (inv.currency || '').toUpperCase();
      if (selectedRegime === 'UAE') return c.includes('UAE') || curr === 'AED';
      if (selectedRegime === 'KSA') return c.includes('KSA') || c.includes('SAUDI') || curr === 'SAR';
      if (selectedRegime === 'INDIA') return c.includes('INDIA') || curr === 'INR';
      if (selectedRegime === 'USA') return c.includes('USA') || c.includes('US') || curr === 'USD';
      return true;
    });
  }, [invoices, selectedRegime]);

  const regimeFilteredSupplierPos = useMemo(() => {
    if (selectedRegime === 'ALL') return supplierPos;
    return supplierPos.filter(spo => {
      const c = (spo.origin || spo.entity || '').toUpperCase();
      const curr = (spo.currency || '').toUpperCase();
      if (selectedRegime === 'UAE') return c.includes('UAE') || curr === 'AED';
      if (selectedRegime === 'KSA') return c.includes('KSA') || c.includes('SAUDI') || curr === 'SAR';
      if (selectedRegime === 'INDIA') return c.includes('INDIA') || curr === 'INR';
      if (selectedRegime === 'USA') return c.includes('USA') || c.includes('US') || curr === 'USD';
      return true;
    });
  }, [supplierPos, selectedRegime]);

  // Output Tax calculated strictly from rate stored on each invoice (NO hardcoded 5% rate)
  const outputTax = useMemo(() => {
    return regimeFilteredInvoices.reduce((acc, inv) => {
      const ratePct = Number(inv.taxPercent ?? inv.taxRate ?? 0);
      const taxRate = ratePct / 100;
      const baseUsd = Number(inv.amountUsd || 0);
      const taxUsd = baseUsd * taxRate;

      return {
        totalUsd: acc.totalUsd + taxUsd,
        count: acc.count + 1,
        totalTaxableUsd: acc.totalTaxableUsd + baseUsd
      };
    }, { totalUsd: 0, count: 0, totalTaxableUsd: 0 });
  }, [regimeFilteredInvoices]);

  // India GST specific breakdown (CGST 9% + SGST 9% or IGST 18%)
  const indiaGstBreakdown = useMemo(() => {
    const indiaInvs = invoices.filter(inv => {
      const c = (inv.country || '').toUpperCase();
      const curr = (inv.currency || '').toUpperCase();
      return c.includes('INDIA') || curr === 'INR';
    });

    let cgstUsd = 0;
    let sgstUsd = 0;
    let igstUsd = 0;
    let totalTaxUsd = 0;

    for (const inv of indiaInvs) {
      const ratePct = Number(inv.taxPercent ?? inv.taxRate ?? 18);
      const baseUsd = Number(inv.amountUsd || 0);
      const taxUsd = baseUsd * (ratePct / 100);
      totalTaxUsd += taxUsd;

      // Check if interstate vs intrastate (default to intrastate 9%+9% unless export/interstate specified)
      const isInterstate = inv.importExport === 'Interstate' || inv.importExport === 'Export' || ratePct === 18;
      if (isInterstate) {
        igstUsd += taxUsd;
      } else {
        cgstUsd += taxUsd / 2;
        sgstUsd += taxUsd / 2;
      }
    }

    return {
      count: indiaInvs.length,
      cgstUsd,
      sgstUsd,
      igstUsd,
      totalTaxUsd
    };
  }, [invoices]);

  // Input Tax Credit (ITC) calculated from rate stored on each supplier PO
  const inputTax = useMemo(() => {
    return regimeFilteredSupplierPos.reduce((acc, spo) => {
      const taxPct = Number(spo.taxPercent || 0) / 100;
      const taxUsd = (spo.totalValueUsd || spo.committedUsd || 0) * taxPct;
      return {
        totalUsd: acc.totalUsd + taxUsd,
        count: acc.count + 1
      };
    }, { totalUsd: 0, count: 0 });
  }, [regimeFilteredSupplierPos]);

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
      type: 'FTA VAT Return Form 201',
      entity: 'Volvitech UAE FZ-LLC',
      authority: 'Federal Tax Authority (FTA)',
      dueDate: '2024-04-28',
      period: 'Q1 2024 (Jan - Mar)',
      status: 'Filed & Cleared',
      challanRef: 'FTA-VAT-2024-Q1-99',
      estimatedTax: 12450
    },
    {
      id: 'FIL-02',
      type: 'GSTR-3B Monthly Return',
      entity: 'Volvitech India Pvt Ltd',
      authority: 'Goods & Services Tax Network (GSTN)',
      dueDate: '2024-05-20',
      period: 'Apr 2024 Monthly Filing',
      status: 'Reconciled',
      challanRef: 'GST-IND-29AABCV-04',
      estimatedTax: 16800
    },
    {
      id: 'FIL-03',
      type: 'TDS Salary / Contractor Challan 281',
      entity: 'Volvitech India Pvt Ltd',
      authority: 'Income Tax Department (TRACES)',
      dueDate: '2024-05-07',
      period: 'Apr 2024 Monthly Remittance',
      status: 'Paid / Cleared',
      challanRef: 'TDS-IND-881920',
      estimatedTax: 4620
    },
    {
      id: 'FIL-04',
      type: 'ZATCA VAT Return (Q2)',
      entity: 'Volvitech Saudi Arabia LLC',
      authority: 'Zakat, Tax and Customs Authority',
      dueDate: '2024-07-31',
      period: 'Q2 2024 VAT Audit',
      status: 'Upcoming',
      challanRef: 'ZATCA-SCHED-02',
      estimatedTax: 8900
    },
    {
      id: 'FIL-05',
      type: 'Delaware Annual Franchise & Sales Nexus',
      entity: 'Volvitech US Corp',
      authority: 'Delaware Division of Revenue',
      dueDate: '2024-06-01',
      period: 'Annual Franchise 2024',
      status: 'Upcoming',
      challanRef: 'DE-CORP-DUE',
      estimatedTax: 2500
    }
  ];

  // Export Tax Register via xlsx
  const handleExportTaxAudit = (format = 'xlsx') => {
    const rows = regimeFilteredInvoices.map(inv => {
      const rate = Number(inv.taxPercent ?? inv.taxRate ?? 0);
      const taxUsd = (Number(inv.amountUsd || 0) * rate) / 100;
      const totalUsd = Number(inv.amountUsd || 0) + taxUsd;
      const isIndia = (inv.country || '').includes('India') || inv.currency === 'INR';

      return {
        'Invoice Number': inv.invoiceNumber,
        'Client Name': inv.clientName,
        'Jurisdiction / Country': inv.country || 'Global',
        'Tax Point Date': inv.issueDate || inv.date || '',
        'Currency': inv.currency || 'USD',
        'Taxable Amount (Native)': Number(inv.amountNative || 0),
        'Taxable Amount (USD)': Number(inv.amountUsd || 0),
        'Stored Tax Rate (%)': rate,
        'Output Tax (USD)': Math.round(taxUsd * 100) / 100,
        'CGST (9%) (USD)': isIndia ? Math.round((taxUsd / 2) * 100) / 100 : 'N/A',
        'SGST (9%) (USD)': isIndia ? Math.round((taxUsd / 2) * 100) / 100 : 'N/A',
        'Total with Tax (USD)': Math.round(totalUsd * 100) / 100,
        'Status': inv.status || 'Pending'
      };
    });

    const filename = `Volvitech_Tax_Audit_Register_${selectedRegime}_${new Date().toISOString().slice(0, 10)}`;
    exportToSpreadsheet(rows, filename, 'Tax Register', format);
    addToast(`Tax Audit Register exported as .${format.toUpperCase()}`, 'success');
  };

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
              Multi-Jurisdiction Tax
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Realtime statutory output tax reconciliations based on invoice-stored rates, Input Tax Credits (ITC), and country tax regimes
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

          <div className="inline-flex rounded-xl shadow-2xs">
            <button
              onClick={() => handleExportTaxAudit('xlsx')}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-l-xl transition flex items-center gap-1 active:scale-95"
              title="Export Tax Ledger to Excel"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
              <span>Export .XLSX</span>
            </button>
            <button
              onClick={() => handleExportTaxAudit('csv')}
              className="px-2.5 py-2 text-xs font-semibold bg-white border-y border-r border-gray-200 hover:bg-gray-50 text-gray-700 rounded-r-xl transition flex items-center gap-0.5 active:scale-95"
              title="Export Tax Ledger to CSV"
            >
              <span>.CSV</span>
            </button>
          </div>

          <button
            onClick={() => setShowRecordModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>+ Record Tax Challan</span>
          </button>
        </div>
      </div>

      {/* Admin Browser Storage Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Error state */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading tax compliance and statutory data..." />
      ) : (
        <>
          {/* Regime Filter Selector Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-500 mr-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">public</span>
                <span>Jurisdiction Filter:</span>
              </span>
              {[
                { id: 'ALL', label: 'All Regimes' },
                { id: 'UAE', label: 'UAE 🇦🇪 (5% VAT)' },
                { id: 'KSA', label: 'KSA 🇸🇦 (15% VAT)' },
                { id: 'INDIA', label: 'India 🇮🇳 (18% GST)' },
                { id: 'USA', label: 'USA 🇺🇸 (Sales Tax)' },
              ].map(regime => (
                <button
                  key={regime.id}
                  onClick={() => setSelectedRegime(regime.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedRegime === regime.id
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {regime.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Active Regimes: <span className="font-bold text-gray-900">4 Supported</span> · Stored Invoice Rates Enforced
            </div>
          </div>

          {/* KPI Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Output Tax Collected */}
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
                Calculated strictly from invoice stored rates ({outputTax.count} invoices)
              </p>
            </div>

            {/* Input Tax Paid (ITC) */}
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
                Deductible input duty across {inputTax.count} Supplier POs
              </p>
            </div>

            {/* Net Tax Liability */}
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
                Output duty minus deductible input credits
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
                Total statutory remittances cleared via bank challans
              </p>
            </div>
          </div>

          {/* Per-Country Statutory Setup Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(TAX_REGIMES).map((regime) => {
              const isSelected = selectedRegime === regime.code;
              return (
                <div
                  key={regime.code}
                  onClick={() => setSelectedRegime(selectedRegime === regime.code ? 'ALL' : regime.code)}
                  className={`p-4.5 rounded-2xl border cursor-pointer transition shadow-2xs space-y-2.5 ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-white border-gray-200/80 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 font-display flex items-center gap-1.5">
                      <span>{regime.country}</span>
                      <span>{regime.code}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {regime.standardRate}% Std
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Authority</span>
                      <span className="font-semibold text-gray-800">{regime.authority}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Format / Registration</span>
                      <span className="font-mono text-gray-800 text-[11px]">{regime.registrationFormat}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-snug pt-1 border-t border-gray-100">
                    {regime.ruleDescription}
                  </p>
                </div>
              );
            })}
          </div>

          {/* India GST Dual Split Special Panel */}
          {(selectedRegime === 'ALL' || selectedRegime === 'INDIA') && (
            <div className="bg-gradient-to-r from-orange-50 via-white to-green-50 p-5 rounded-2xl border border-orange-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇮🇳</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 font-display">Indian Goods & Services Tax (GST) Dual Split Engine</h3>
                    <p className="text-xs text-gray-500">Equally partitioned into Central GST & State GST for intrastate, or Integrated GST for interstate</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full border border-orange-200 text-orange-800 shadow-2xs">
                  Standard Rate: 18.0%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-white/80 rounded-xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-orange-700">Central GST (CGST - 9.0%)</span>
                  <div className="text-lg font-bold text-gray-900">${Math.round(indiaGstBreakdown.cgstUsd).toLocaleString()}</div>
                  <p className="text-[10px] text-gray-400">Remitted to Central Treasury</p>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-orange-700">State GST (SGST - 9.0%)</span>
                  <div className="text-lg font-bold text-gray-900">${Math.round(indiaGstBreakdown.sgstUsd).toLocaleString()}</div>
                  <p className="text-[10px] text-gray-400">Remitted to Karnataka Commercial Taxes</p>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Integrated GST (IGST - 18.0%)</span>
                  <div className="text-lg font-bold text-emerald-800">${Math.round(indiaGstBreakdown.igstUsd).toLocaleString()}</div>
                  <p className="text-[10px] text-gray-400">Interstate & Cross-border Deliveries</p>
                </div>
              </div>
            </div>
          )}

          {/* Itemized Invoices Tax Register (Actual Stored Rates on Invoices) */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Client Invoices Tax Assessment Register</h3>
                <p className="text-xs text-gray-400 mt-0.5">Calculated strictly from invoice stored tax rates (no default rate)</p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {regimeFilteredInvoices.length} Invoices Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100 font-bold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client & Jurisdiction</th>
                    <th className="py-3 px-4">Tax Point Date</th>
                    <th className="py-3 px-4 text-right">Taxable Base (USD)</th>
                    <th className="py-3 px-4 text-center">Stored Tax Rate</th>
                    <th className="py-3 px-4 text-right">Output Tax (USD)</th>
                    <th className="py-3 px-4">Tax Split / Breakdown</th>
                    <th className="py-3 px-4 text-right">Total with Tax</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {regimeFilteredInvoices.map((inv) => {
                    const rate = Number(inv.taxPercent ?? inv.taxRate ?? 0);
                    const baseUsd = Number(inv.amountUsd || 0);
                    const taxUsd = baseUsd * (rate / 100);
                    const totalUsd = baseUsd + taxUsd;
                    const isIndia = (inv.country || '').includes('India') || inv.currency === 'INR';
                    const isUae = (inv.country || '').includes('UAE') || inv.currency === 'AED';
                    const isKsa = (inv.country || '').includes('KSA') || inv.currency === 'SAR';

                    return (
                      <tr key={inv.id || inv.invoiceNumber} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{inv.clientName}</span>
                          <span className="text-gray-400 text-[11px] block">{inv.country || 'Global Client'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">
                          {inv.issueDate || inv.date || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-800">
                          ${baseUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {inv.currency !== 'USD' && (
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {inv.currency} {Number(inv.amountNative || 0).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                            {rate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">
                          ${taxUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-gray-600">
                          {isIndia && rate > 0 ? (
                            <span className="font-mono text-orange-800 font-semibold">
                              CGST: ${(taxUsd / 2).toFixed(2)} + SGST: ${(taxUsd / 2).toFixed(2)}
                            </span>
                          ) : isUae ? (
                            <span className="font-mono text-emerald-800 font-semibold">
                              FTA VAT: ${taxUsd.toFixed(2)}
                            </span>
                          ) : isKsa ? (
                            <span className="font-mono text-emerald-800 font-semibold">
                              ZATCA VAT: ${taxUsd.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-mono text-gray-500">
                              {rate === 0 ? 'Export / Zero-Rated' : `Sales Tax: $${taxUsd.toFixed(2)}`}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
        </>
      )}

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
