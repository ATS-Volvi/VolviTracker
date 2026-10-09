import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  INITIAL_CASH_ACCOUNTS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_MASTER_DIRECTORY,
  INITIAL_EXCHANGE_RATES
} from './financeData';

import RecordCashTransactionModal from './modals/RecordCashTransactionModal';

// Helper to determine if a transaction is an Extra Payment (Salaries, Rent, Cloud, Tax, etc.)
export const isExtraPaymentTxn = (t) => {
  if (t.type === 'ExtraPayment') return true;
  const extraCategories = [
    'Payroll & Salaries',
    'Salary & Employee Payroll',
    'Executive & Contractor Stipend',
    'Office Rent & Facilities',
    'Office Rent & Lease',
    'Utilities & Facilities',
    'Cloud & Infrastructure',
    'Cloud & IT Infrastructure',
    'Cloud & IT Hosting (AWS/GCP/Azure)',
    'Software Licenses & Subscriptions',
    'Tax & Statutory Duty',
    'Tax & Statutory Duty Remittance',
    'Professional Fees & Legal',
    'Legal & Audit Consultation',
    'Travel & Client Entertainment',
    'Travel & Client Logistics',
    'Petty Cash Expense',
    'Petty Cash Operational Overhead',
    'Hardware & Equipment',
    'Other Operational Payment'
  ];
  return extraCategories.includes(t.category) || Boolean(t.isExtraPayment);
};

export const isSalaryTxn = (t) => {
  return t.category === 'Salary & Employee Payroll' ||
    t.category === 'Payroll & Salaries' ||
    t.category === 'Executive & Contractor Stipend' ||
    t.description?.toLowerCase().includes('salary') ||
    t.description?.toLowerCase().includes('payroll');
};

export const isVendorOutflowTxn = (t) => {
  return t.type === 'Outflow' && !isExtraPaymentTxn(t);
};

export const CashBookFinance = () => {
  const { user, isAdmin, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirect unauthenticated users immediately
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Load finance data
  const [data, setData] = useState(() => loadFinanceData());

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  // Sync updates to localStorage
  useEffect(() => {
    saveFinanceData(data);
  }, [data]);

  const exchangeRates = data.exchangeRates || INITIAL_EXCHANGE_RATES;
  const accounts = data.cashAccounts || INITIAL_CASH_ACCOUNTS;
  const rawTransactions = data.cashTransactions || INITIAL_CASH_TRANSACTIONS;
  const masterDirectory = data.masterDirectory || INITIAL_MASTER_DIRECTORY;

  // Selected company state (from query param `company` or internal state)
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return searchParams.get('company') || 'ALL';
  });

  // Filter & Search states
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState('ALL'); // 'ALL' | 'Client' | 'Supplier'
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [streamFilter, setStreamFilter] = useState(() => {
    const s = searchParams.get('stream');
    if (s && s.toLowerCase() === 'inflow') return 'Inflow';
    if (s && s.toLowerCase() === 'outflow') return 'Outflow';
    return 'all';
  }); // 'all' | 'Inflow' | 'Outflow' | 'Vendor' | 'Extra' | 'Transfer'
  const [statusFilter, setStatusFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [extraCategoryFilter, setExtraCategoryFilter] = useState('all');

  // Modal states
  const [recordModalOpen, setRecordModalOpen] = useState(() => {
    const act = searchParams.get('action');
    return act === 'add' || act === 'add-entry';
  });
  const [modalInitialType, setModalInitialType] = useState('Inflow');
  const [selectedTxnForDetail, setSelectedTxnForDetail] = useState(null);

  // Sync stream from URL param
  useEffect(() => {
    const s = searchParams.get('stream');
    if (s) {
      const lower = s.toLowerCase();
      if (lower === 'inflow') setStreamFilter('Inflow');
      else if (lower === 'outflow') setStreamFilter('Outflow');
      else if (lower === 'all') setStreamFilter('all');
    }
  }, [searchParams]);

  // Sync action from URL param
  useEffect(() => {
    const act = searchParams.get('action');
    if (act === 'add' || act === 'add-entry') {
      setRecordModalOpen(true);
    }
  }, [searchParams]);

  // Sync URL query when selectedCompanyId changes
  const handleSelectCompany = (compIdentifier) => {
    setSelectedCompanyId(compIdentifier);
    if (compIdentifier === 'ALL') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('company');
      setSearchParams(nextParams);
    } else {
      setSearchParams({ company: compIdentifier });
    }
  };

  // Helper currency converter to USD
  const toUsd = (amount, cur) => {
    if (!amount) return 0;
    if (cur === 'USD') return Number(amount);
    const rate = exchangeRates[cur] || (cur === 'AED' ? 3.67 : cur === 'SAR' ? 3.75 : 83.2);
    return Number(amount) / rate;
  };

  const formatCurrency = (amount, cur = 'USD') => {
    const symbols = { USD: '$', AED: 'AED ', INR: '₹', SAR: 'SAR ' };
    const sym = symbols[cur] || `${cur} `;
    return `${sym}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Build unified list of companies from masterDirectory + Operating Entities
  const companyList = useMemo(() => {
    const partners = masterDirectory.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      classification: m.classification || 'Corporate',
      country: m.country || 'USA 🇺🇸',
      currency: m.currency || 'USD',
      avatarText: m.avatarText || m.name.substring(0, 2).toUpperCase(),
      taxId: m.taxId || 'N/A',
      contactPerson: m.contactPerson || m.contact || 'Commercial Desk',
      contactEmail: m.contactEmail || m.companyMail || '',
      contactPhone: m.contactPhone || '',
      bankDetails: m.bankDetails || null,
      creditTerms: m.creditTerms || 'Net 30',
      activePoVolume: m.activePoVolume || null,
      isInternalEntity: false
    }));

    const entities = [
      {
        id: 'ENT-VOL-US',
        name: 'Volvitech US Corp',
        category: 'Operating Entity',
        classification: 'Internal Entity',
        country: 'USA 🇺🇸',
        currency: 'USD',
        avatarText: 'US',
        taxId: 'US-EIN-12-889021',
        contactPerson: 'Global Treasury Desk',
        contactEmail: 'treasury@volvitech.com',
        contactPhone: '+1 (415) 800-9900',
        bankDetails: { bankName: 'JPMorgan Chase New York', accountNumber: '••••8102', swiftIban: 'CHASUS33XXX' },
        creditTerms: 'Operating Hub',
        isInternalEntity: true
      },
      {
        id: 'ENT-VOL-AE',
        name: 'Volvitech UAE FZ-LLC',
        category: 'Operating Entity',
        classification: 'Internal Entity',
        country: 'UAE 🇦🇪',
        currency: 'AED',
        avatarText: 'AE',
        taxId: 'TRN 10049281000003',
        contactPerson: 'GCC Treasury Desk',
        contactEmail: 'treasury-ae@volvitech.com',
        contactPhone: '+971 4 550 1122',
        bankDetails: { bankName: 'First Abu Dhabi Bank (FAB)', accountNumber: '••••1002', swiftIban: 'FABUAEADXXX' },
        creditTerms: 'Operating Hub',
        isInternalEntity: true
      },
      {
        id: 'ENT-VOL-IN',
        name: 'Volvitech India Pvt Ltd',
        category: 'Operating Entity',
        classification: 'Internal Entity',
        country: 'India 🇮🇳',
        currency: 'INR',
        avatarText: 'IN',
        taxId: '29AABCV9912K1Z8',
        contactPerson: 'India Accounts Desk',
        contactEmail: 'accounts-in@volvitech.com',
        contactPhone: '+91 80 4900 2200',
        bankDetails: { bankName: 'HDFC Bank Bengaluru', accountNumber: '••••0194', swiftIban: 'HDFCINBBXXX' },
        creditTerms: 'Operating Hub',
        isInternalEntity: true
      },
      {
        id: 'ENT-VOL-SA',
        name: 'Volvitech KSA Branch',
        category: 'Operating Entity',
        classification: 'Internal Entity',
        country: 'KSA 🇸🇦',
        currency: 'SAR',
        avatarText: 'SA',
        taxId: 'CR 1010992812',
        contactPerson: 'Riyadh Finance Desk',
        contactEmail: 'finance-ksa@volvitech.com',
        contactPhone: '+966 11 800 4400',
        bankDetails: { bankName: 'Al Rajhi Bank Riyadh', accountNumber: '••••4421', swiftIban: 'RJHIUSMSXXX' },
        creditTerms: 'Operating Hub',
        isInternalEntity: true
      }
    ];

    return [...partners, ...entities];
  }, [masterDirectory]);

  // Find currently selected company object
  const activeCompany = useMemo(() => {
    if (selectedCompanyId === 'ALL') return null;
    return companyList.find(c => c.id === selectedCompanyId || c.name.toLowerCase() === selectedCompanyId.toLowerCase()) || null;
  }, [companyList, selectedCompanyId]);

  // TOTAL CASHFLOW CALCULATION ENGINE
  // Breaks down all movements into:
  // 1. Total Inflow
  // 2. Vendor Outflows
  // 3. Extra Payments (Salaries & OpEx)
  // 4. Net Cashflow = Inflows - (Vendor Outflow + Extra Payments)
  const cashflowCalculation = useMemo(() => {
    let totalInflowUsd = 0;
    let totalVendorOutflowUsd = 0;
    let totalExtraPaymentsUsd = 0;
    let salaryPaymentsUsd = 0;
    let rentPaymentsUsd = 0;
    let cloudPaymentsUsd = 0;
    let taxPaymentsUsd = 0;
    let otherExtraUsd = 0;
    let reconciledCount = 0;

    // Filter by company if a company is active
    const targetTxns = activeCompany
      ? rawTransactions.filter(t =>
          (t.counterparty || '').toLowerCase() === activeCompany.name.toLowerCase() ||
          (t.entity || '').toLowerCase() === activeCompany.name.toLowerCase() ||
          t.companyId === activeCompany.id
        )
      : rawTransactions;

    targetTxns.forEach(t => {
      const usdVal = t.amountUsd || toUsd(t.amountNative, t.currency);
      if (t.status === 'Reconciled') reconciledCount += 1;

      if (t.type === 'Inflow') {
        totalInflowUsd += usdVal;
      } else if (isExtraPaymentTxn(t)) {
        totalExtraPaymentsUsd += usdVal;
        if (isSalaryTxn(t)) {
          salaryPaymentsUsd += usdVal;
        } else if (t.category?.includes('Rent') || t.description?.toLowerCase().includes('rent') || t.description?.toLowerCase().includes('lease')) {
          rentPaymentsUsd += usdVal;
        } else if (t.category?.includes('Cloud') || t.description?.toLowerCase().includes('aws') || t.description?.toLowerCase().includes('hosting')) {
          cloudPaymentsUsd += usdVal;
        } else if (t.category?.includes('Tax') || t.description?.toLowerCase().includes('gst') || t.description?.toLowerCase().includes('tax')) {
          taxPaymentsUsd += usdVal;
        } else {
          otherExtraUsd += usdVal;
        }
      } else if (t.type === 'Outflow') {
        totalVendorOutflowUsd += usdVal;
      }
    });

    const totalOutflowUsd = totalVendorOutflowUsd + totalExtraPaymentsUsd;
    const netCashflowUsd = totalInflowUsd - totalOutflowUsd;
    const netMarginPercent = totalInflowUsd > 0 ? Math.round((netCashflowUsd / totalInflowUsd) * 100) : 0;
    const reconRate = targetTxns.length > 0 ? Math.round((reconciledCount / targetTxns.length) * 100) : 100;

    return {
      totalInflowUsd,
      totalVendorOutflowUsd,
      totalExtraPaymentsUsd,
      totalOutflowUsd,
      netCashflowUsd,
      netMarginPercent,
      salaryPaymentsUsd,
      rentPaymentsUsd,
      cloudPaymentsUsd,
      taxPaymentsUsd,
      otherExtraUsd,
      totalCount: targetTxns.length,
      reconciledCount,
      reconRate
    };
  }, [rawTransactions, activeCompany, exchangeRates]);

  // Filtered companies in top ribbon
  const visibleCompanyList = useMemo(() => {
    return companyList.filter(c => {
      if (companyCategoryFilter !== 'ALL' && c.category !== companyCategoryFilter) {
        return false;
      }
      if (companySearchQuery.trim()) {
        const q = companySearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.currency.toLowerCase().includes(q) ||
          c.taxId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companyList, companyCategoryFilter, companySearchQuery]);

  // Filter transactions based on selected company, stream, search, and status
  const filteredTransactions = useMemo(() => {
    let list = rawTransactions;

    // Filter by Company
    if (activeCompany) {
      list = list.filter(t =>
        (t.counterparty || '').toLowerCase() === activeCompany.name.toLowerCase() ||
        (t.entity || '').toLowerCase() === activeCompany.name.toLowerCase() ||
        t.companyId === activeCompany.id
      );
    }

    return list.filter(t => {
      // Cashflow Stream Filter
      if (streamFilter === 'Inflow' && t.type !== 'Inflow') return false;
      if (streamFilter === 'Outflow' && t.type !== 'Outflow' && !isExtraPaymentTxn(t)) return false;
      if (streamFilter === 'Vendor' && !isVendorOutflowTxn(t)) return false;
      if (streamFilter === 'Extra' && !isExtraPaymentTxn(t)) return false;
      if (streamFilter === 'Transfer' && t.type !== 'Transfer') return false;

      // Extra Category Filter
      if (extraCategoryFilter !== 'all') {
        if (extraCategoryFilter === 'Salary' && !isSalaryTxn(t)) return false;
        if (extraCategoryFilter === 'Rent' && !(t.category?.includes('Rent') || t.description?.toLowerCase().includes('rent'))) return false;
        if (extraCategoryFilter === 'Cloud' && !(t.category?.includes('Cloud') || t.description?.toLowerCase().includes('cloud') || t.description?.toLowerCase().includes('aws'))) return false;
        if (extraCategoryFilter === 'Tax' && !(t.category?.includes('Tax') || t.description?.toLowerCase().includes('tax'))) return false;
      }

      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (accountFilter !== 'all' && t.accountId !== accountFilter && t.transferToAccountId !== accountFilter) return false;

      if (txnSearchQuery.trim()) {
        const q = txnSearchQuery.toLowerCase();
        const match =
          t.voucherNo?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.counterparty?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.reference?.toLowerCase().includes(q) ||
          t.linkedInvoice?.toLowerCase().includes(q) ||
          t.linkedPo?.toLowerCase().includes(q) ||
          t.accountName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [rawTransactions, activeCompany, streamFilter, extraCategoryFilter, statusFilter, accountFilter, txnSearchQuery]);

  // Calculate cumulative running balances for filtered transactions (in chronological order)
  const transactionsWithRunningBalance = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningNet = 0;

    const withBalance = sorted.map(t => {
      const isCredit = t.type === 'Inflow';
      const usdVal = t.amountUsd || toUsd(t.amountNative, t.currency);
      if (isCredit) {
        runningNet += usdVal;
      } else {
        runningNet -= usdVal;
      }
      return {
        ...t,
        runningNetBalanceUsd: runningNet
      };
    });

    return withBalance.reverse();
  }, [filteredTransactions, exchangeRates]);

  // Handlers for transactions
  const handleSaveTransaction = (newTxn) => {
    setData(prev => {
      const nextTxns = [newTxn, ...(prev.cashTransactions || [])];
      const nextData = { ...prev, cashTransactions: nextTxns };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Cash Book entry ${newTxn.voucherNo} posted successfully!`, 'success');
  };

  const handleToggleReconcile = (txnId) => {
    setData(prev => {
      const nextTxns = (prev.cashTransactions || []).map(t => {
        if (t.id === txnId) {
          const nextStatus = t.status === 'Reconciled' ? 'Cleared' : 'Reconciled';
          return { ...t, status: nextStatus };
        }
        return t;
      });
      const nextData = { ...prev, cashTransactions: nextTxns };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast('Reconciliation status updated.', 'info', 1800);
  };

  const handleDeleteTransaction = (txnId, voucherNo) => {
    if (!window.confirm(`Are you sure you want to delete cash voucher ${voucherNo}?`)) return;
    setData(prev => {
      const nextTxns = (prev.cashTransactions || []).filter(t => t.id !== txnId);
      const nextData = { ...prev, cashTransactions: nextTxns };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Entry ${voucherNo} removed from Cash Book.`, 'info');
  };

  // Export CSV
  const handleExportCsv = () => {
    const filenamePrefix = activeCompany ? activeCompany.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'full_cashflow';
    const headers = ['Voucher No', 'Date', 'Stream Type', 'Category', 'Company / Beneficiary', 'Account', 'Description', 'Ref / PO / Inv', 'Payment Mode', 'Currency', 'Amount Native', 'Amount USD', 'Running Net USD', 'Status'];
    const rows = transactionsWithRunningBalance.map(t => {
      const stream = t.type === 'Inflow' ? 'Inflow (Receipt)' : isVendorOutflowTxn(t) ? 'Vendor Outflow' : isExtraPaymentTxn(t) ? 'Extra Payment' : 'Transfer';
      return [
        t.voucherNo || '',
        t.date || '',
        stream,
        t.category || '',
        `"${(t.counterparty || activeCompany?.name || '').replace(/"/g, '""')}"`,
        `"${(t.accountName || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.linkedInvoice || t.linkedPo || t.reference || '').replace(/"/g, '""')}"`,
        t.paymentMode || '',
        t.currency || '',
        t.amountNative || 0,
        t.amountUsd ? t.amountUsd.toFixed(2) : 0,
        t.runningNetBalanceUsd ? t.runningNetBalanceUsd.toFixed(2) : 0,
        t.status || ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cashflow_statement_${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Total cashflow statement exported to CSV successfully.', 'success');
  };

  const openRecordModal = (type) => {
    setModalInitialType(type);
    setRecordModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left animate-fade-in">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Cash Book & Cashflow Ledger
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Total Cashflow Engine
            </span>
            {activeCompany && (
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span>{activeCompany.country.split(' ')[1] || '🏢'}</span>
                <span>{activeCompany.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Realtime tracking of Cash Inflows, Vendor Outflows, Extra Payments (Salaries, Rent, Cloud, Taxes) & Net Total Cashflow
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openRecordModal('Inflow')}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Record client collection or cash receipt"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            <span>+ Inflow (Receipt)</span>
          </button>

          <button
            onClick={() => openRecordModal('Outflow')}
            className="px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Record direct vendor purchase order payment"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
            <span>- Vendor Outflow</span>
          </button>

          <button
            onClick={() => openRecordModal('ExtraPayment')}
            className="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Record salaries, payroll, office rent, utilities, cloud or tax payments"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>- Extra Payment (Salary / OpEx)</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Download Cashflow CSV"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">download</span>
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Dedicated Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2 text-gray-500 font-medium flex-wrap">
          <Link to="/finance" className="hover:text-blue-600 transition flex items-center gap-1 font-semibold text-gray-600">
            <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
            <span>Finance Hub</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-bold flex items-center gap-1.5">
            <span>Cash Book</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">CB</span>
          </span>
          {activeCompany && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-bold">{activeCompany.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/client"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Client Side (AR)</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/finance/supplier"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            <span>Supplier Side (AP)</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* 1. TOTAL CASHFLOW CALCULATION EXECUTIVE DASHBOARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">account_balance_wallet</span>
              <span>Total Cashflow Calculation Engine</span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Live calculation of Total Inflow, Vendor PO Outflow, Extra Payments (Salaries & Overheads), and Net Cashflow
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Statement Health:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {cashflowCalculation.reconRate}% Reconciled
            </span>
          </div>
        </div>

        {/* Four Calculation Pillar Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Total Inflow */}
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                1. Total Inflow (Receipts)
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 font-display mt-2 font-mono">
              +${cashflowCalculation.totalInflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-emerald-800/80 mt-1">
              Client collections, milestone wires & advances
            </div>
          </div>

          {/* Pillar 2: Vendor Outflows */}
          <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                2. Vendor Outflows
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-rose-700 font-display mt-2 font-mono">
              -${cashflowCalculation.totalVendorOutflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-rose-800/80 mt-1">
              Direct supplier POs & subcontractor payments
            </div>
          </div>

          {/* Pillar 3: Extra Payments (Salaries & OpEx) */}
          <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                3. Extra Payments (Salaries & OpEx)
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">payments</span>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-purple-700 font-display mt-2 font-mono">
              -${cashflowCalculation.totalExtraPaymentsUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-purple-800/80 mt-1">
              Salaries, office rent, AWS cloud, taxes & duties
            </div>
          </div>

          {/* Pillar 4: Total Net Cashflow */}
          <div className={`p-4 rounded-xl border relative overflow-hidden ${
            cashflowCalculation.netCashflowUsd >= 0
              ? 'border-blue-300 bg-blue-50/50'
              : 'border-amber-300 bg-amber-50/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                cashflowCalculation.netCashflowUsd >= 0 ? 'text-blue-900' : 'text-amber-900'
              }`}>
                = Total Net Cashflow
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                cashflowCalculation.netCashflowUsd >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className="material-symbols-outlined text-[16px]">balance</span>
              </div>
            </div>
            <div className={`text-2xl font-extrabold font-display mt-2 font-mono ${
              cashflowCalculation.netCashflowUsd >= 0 ? 'text-gray-900' : 'text-rose-600'
            }`}>
              {cashflowCalculation.netCashflowUsd >= 0 ? '+' : ''}${cashflowCalculation.netCashflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Inflows minus all outflows ({cashflowCalculation.netMarginPercent}% net margin)
            </div>
          </div>
        </div>

        {/* Visual Cashflow Formula Bar */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap font-mono font-semibold">
            <span className="text-gray-500 font-sans text-[11px] font-bold uppercase">Formula:</span>
            <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
              +${Math.round(cashflowCalculation.totalInflowUsd).toLocaleString()} (Inflows)
            </span>
            <span className="text-gray-400 font-bold">-</span>
            <span className="text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
              ${Math.round(cashflowCalculation.totalVendorOutflowUsd).toLocaleString()} (Vendor Outflow)
            </span>
            <span className="text-gray-400 font-bold">-</span>
            <span className="text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
              ${Math.round(cashflowCalculation.totalExtraPaymentsUsd).toLocaleString()} (Extra Payments)
            </span>
            <span className="text-gray-400 font-bold">=</span>
            <span className={`px-2.5 py-0.5 rounded font-extrabold ${
              cashflowCalculation.netCashflowUsd >= 0
                ? 'bg-blue-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {cashflowCalculation.netCashflowUsd >= 0 ? '+' : ''}${Math.round(cashflowCalculation.netCashflowUsd).toLocaleString()} Net
            </span>
          </div>

          <div className="text-gray-500 text-[11px] font-medium">
            Total Combined Disbursements: <strong className="text-gray-900 font-mono">-${Math.round(cashflowCalculation.totalOutflowUsd).toLocaleString()}</strong>
          </div>
        </div>

        {/* 2. Extra Payments Breakdown Sub-Panel */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-purple-600 text-[16px]">tune</span>
              <span>Extra Payments Categorical Breakdown (Salaries & Operational Overheads)</span>
            </span>
            <span className="text-[11px] font-bold text-purple-700 font-mono">
              Total Extra: ${Math.round(cashflowCalculation.totalExtraPaymentsUsd).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            {/* Salary Payments */}
            <div
              onClick={() => {
                setStreamFilter('Extra');
                setExtraCategoryFilter(extraCategoryFilter === 'Salary' ? 'all' : 'Salary');
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                extraCategoryFilter === 'Salary'
                  ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
                  : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 uppercase">
                <span className="material-symbols-outlined text-[14px]">badge</span>
                <span>Salaries & Payroll</span>
              </div>
              <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                ${Math.round(cashflowCalculation.salaryPaymentsUsd).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Staff salaries & stipends</div>
            </div>

            {/* Office Rent */}
            <div
              onClick={() => {
                setStreamFilter('Extra');
                setExtraCategoryFilter(extraCategoryFilter === 'Rent' ? 'all' : 'Rent');
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                extraCategoryFilter === 'Rent'
                  ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
                  : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 uppercase">
                <span className="material-symbols-outlined text-[14px]">apartment</span>
                <span>Office Rent & Lease</span>
              </div>
              <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                ${Math.round(cashflowCalculation.rentPaymentsUsd).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Corporate workspace leases</div>
            </div>

            {/* Cloud & Software */}
            <div
              onClick={() => {
                setStreamFilter('Extra');
                setExtraCategoryFilter(extraCategoryFilter === 'Cloud' ? 'all' : 'Cloud');
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                extraCategoryFilter === 'Cloud'
                  ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
                  : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase">
                <span className="material-symbols-outlined text-[14px]">cloud</span>
                <span>Cloud & IT Hosting</span>
              </div>
              <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                ${Math.round(cashflowCalculation.cloudPaymentsUsd).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">AWS, servers & SaaS licenses</div>
            </div>

            {/* Taxes & Duties */}
            <div
              onClick={() => {
                setStreamFilter('Extra');
                setExtraCategoryFilter(extraCategoryFilter === 'Tax' ? 'all' : 'Tax');
              }}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                extraCategoryFilter === 'Tax'
                  ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
                  : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
                <span className="material-symbols-outlined text-[14px]">account_balance</span>
                <span>Tax & Statutory</span>
              </div>
              <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                ${Math.round(cashflowCalculation.taxPaymentsUsd).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Advance tax, GST & duties</div>
            </div>

            {/* Miscellaneous & Petty Cash */}
            <div
              onClick={() => {
                setStreamFilter('Extra');
                setExtraCategoryFilter('all');
              }}
              className="p-2.5 rounded-xl border border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300 transition cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700 uppercase">
                <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                <span>General Overheads</span>
              </div>
              <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
                ${Math.round(cashflowCalculation.otherExtraUsd).toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Petty cash, travel, utilities</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Company Selection Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">domain</span>
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
                Company & Partner Cashflow View
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Isolate transactions and calculate cashflow specifically for any client, vendor or entity
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCompanyCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  companyCategoryFilter === 'ALL'
                    ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({companyList.length})
              </button>
              <button
                onClick={() => setCompanyCategoryFilter('Client')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  companyCategoryFilter === 'Client'
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setCompanyCategoryFilter('Supplier')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  companyCategoryFilter === 'Supplier'
                    ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-indigo-700'
                }`}
              >
                Suppliers
              </button>
              <button
                onClick={() => setCompanyCategoryFilter('Operating Entity')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  companyCategoryFilter === 'Operating Entity'
                    ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-purple-700'
                }`}
              >
                Entities
              </button>
            </div>

            <div className="relative w-48 sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
                search
              </span>
              <input
                type="text"
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
                placeholder="Find company..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Company Ribbon Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
          <div
            onClick={() => handleSelectCompany('ALL')}
            className={`p-3 rounded-xl border transition cursor-pointer relative text-left group ${
              selectedCompanyId === 'ALL'
                ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-2 ring-blue-500/20'
                : 'border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-gray-900 text-white font-bold text-[10px] flex items-center justify-center">
                ALL
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rollup</span>
            </div>
            <div className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
              All Companies
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
              {rawTransactions.length} Total Vouchers
            </div>
          </div>

          {visibleCompanyList.map(comp => {
            const isSelected = selectedCompanyId === comp.id || selectedCompanyId === comp.name;
            const isClient = comp.category === 'Client';
            const isSupplier = comp.category === 'Supplier';

            return (
              <div
                key={comp.id}
                onClick={() => handleSelectCompany(comp.id)}
                className={`p-3 rounded-xl border transition cursor-pointer relative text-left group ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center ${
                    isClient ? 'bg-blue-100 text-blue-800' : isSupplier ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {comp.avatarText}
                  </span>
                  <span className="text-xs">{comp.country.split(' ')[1] || '🌐'}</span>
                </div>

                <div className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700 transition" title={comp.name}>
                  {comp.name}
                </div>

                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className={`font-semibold ${isClient ? 'text-blue-600' : isSupplier ? 'text-indigo-600' : 'text-purple-600'}`}>
                    {comp.category}
                  </span>
                  <span className="font-mono font-bold text-gray-700">
                    {comp.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Cashflow Ledger Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {/* Ledger Toolbar & Filters */}
        <div className="p-4 border-b border-gray-200/80 space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 font-display">
                {activeCompany ? `${activeCompany.name} — Cashflow Ledger` : 'Comprehensive Cashflow Ledger'}
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {transactionsWithRunningBalance.length} Entries
              </span>
            </div>

            {/* Stream Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setStreamFilter('all'); setExtraCategoryFilter('all'); }}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  streamFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All Movements ({rawTransactions.length})
              </button>

              <button
                onClick={() => { setStreamFilter('Inflow'); setExtraCategoryFilter('all'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  streamFilter === 'Inflow'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                <span>Inflows (Receipts)</span>
              </button>

              <button
                onClick={() => { setStreamFilter('Vendor'); setExtraCategoryFilter('all'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  streamFilter === 'Vendor'
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-rose-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span>
                <span>Vendor Outflows</span>
              </button>

              <button
                onClick={() => { setStreamFilter('Extra'); setExtraCategoryFilter('all'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  streamFilter === 'Extra'
                    ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-purple-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">payments</span>
                <span>Extra Payments (Salaries & OpEx)</span>
              </button>

              <button
                onClick={() => { setStreamFilter('Transfer'); setExtraCategoryFilter('all'); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                  streamFilter === 'Transfer'
                    ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                <span>Transfers</span>
              </button>
            </div>
          </div>

          {/* Secondary Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
                search
              </span>
              <input
                type="text"
                value={txnSearchQuery}
                onChange={(e) => setTxnSearchQuery(e.target.value)}
                placeholder="Search salary, vendor, ref, voucher..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Bank Account */}
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Bank Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.accountName} ({a.currency})</option>
              ))}
            </select>

            {/* Extra Category Sub-Filter if Extra is selected */}
            {streamFilter === 'Extra' && (
              <select
                value={extraCategoryFilter}
                onChange={(e) => setExtraCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-purple-200 bg-purple-50/50 rounded-xl text-purple-900 text-xs font-bold focus:outline-hidden"
              >
                <option value="all">All Extra Payments</option>
                <option value="Salary">Salaries & Employee Payroll</option>
                <option value="Rent">Office Rent & Facilities</option>
                <option value="Cloud">Cloud & IT Infrastructure</option>
                <option value="Tax">Taxes & Statutory Duties</option>
              </select>
            )}

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Cleared">Cleared</option>
              <option value="Pending">Pending</option>
            </select>

            {activeCompany && (
              <button
                onClick={() => handleSelectCompany('ALL')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
              >
                <span>Clear Company Filter</span>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date & Voucher</th>
                <th className="py-3 px-3">Stream / Classification</th>
                <th className="py-3 px-4">Payee / Partner / Employee</th>
                <th className="py-3 px-3">Doc Ref / PO / Run</th>
                <th className="py-3 px-4">Particulars & Narration</th>
                <th className="py-3 px-3">Bank A/C & Mode</th>
                <th className="py-3 px-3 text-right">Outflow (Debit)</th>
                <th className="py-3 px-3 text-right">Inflow (Credit)</th>
                <th className="py-3 px-3 text-right">Net Running Cash USD</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactionsWithRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">
                      payments
                    </span>
                    <p className="font-semibold text-gray-600">No transactions found for this cashflow filter</p>
                    <p className="text-xs text-gray-400 mt-0.5">Try recording a new Inflow, Vendor Outflow, or Extra Payment</p>
                  </td>
                </tr>
              ) : (
                transactionsWithRunningBalance.map((txn) => {
                  const isInflow = txn.type === 'Inflow';
                  const isVendor = isVendorOutflowTxn(txn);
                  const isExtra = isExtraPaymentTxn(txn);
                  const isSalary = isSalaryTxn(txn);
                  const isTransfer = txn.type === 'Transfer';
                  const docRef = txn.linkedInvoice || txn.linkedPo || txn.reference || '—';

                  return (
                    <tr
                      key={txn.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Date & Voucher */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{txn.date}</div>
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5">{txn.voucherNo}</div>
                      </td>

                      {/* Stream Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isInflow && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                            <span>Inflow (Receipt)</span>
                          </span>
                        )}
                        {isVendor && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="material-symbols-outlined text-[12px]">shopping_cart_checkout</span>
                            <span>Vendor Outflow</span>
                          </span>
                        )}
                        {isExtra && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSalary
                              ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                              : 'bg-amber-50 text-amber-800 border-amber-200/60'
                          }`}>
                            <span className="material-symbols-outlined text-[12px]">
                              {isSalary ? 'badge' : 'payments'}
                            </span>
                            <span>{isSalary ? 'Salary Payment' : 'Extra Payment'}</span>
                          </span>
                        )}
                        {isTransfer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            <span className="material-symbols-outlined text-[12px]">sync_alt</span>
                            <span>Transfer</span>
                          </span>
                        )}
                      </td>

                      {/* Payee / Partner / Employee */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-gray-900 truncate" title={txn.counterparty}>
                          {txn.counterparty || 'Corporate Treasury'}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          {txn.entity}
                        </div>
                      </td>

                      {/* Doc Ref */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {docRef}
                        </span>
                      </td>

                      {/* Particulars */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="font-medium text-gray-900 line-clamp-1" title={txn.description}>
                          {txn.description}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          <span className="bg-gray-100 px-1.5 py-0.2 rounded font-medium text-gray-600">
                            {txn.category}
                          </span>
                        </div>
                      </td>

                      {/* Bank A/C & Mode */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-gray-900 font-semibold truncate max-w-[140px]" title={txn.accountName}>
                          {txn.accountName}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[140px] mt-0.5">
                          {txn.paymentMode}
                        </div>
                      </td>

                      {/* Outflow (Debit) */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {isVendor ? (
                          <span className="text-rose-600">
                            -{formatCurrency(txn.amountNative, txn.currency)}
                          </span>
                        ) : isExtra ? (
                          <span className="text-purple-600">
                            -{formatCurrency(txn.amountNative, txn.currency)}
                          </span>
                        ) : isTransfer ? (
                          <span className="text-blue-600">
                            -{formatCurrency(txn.amountNative, txn.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Inflow (Credit) */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {isInflow ? (
                          <span className="text-emerald-600">
                            +{formatCurrency(txn.amountNative, txn.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Net Running Cash USD */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={txn.runningNetBalanceUsd >= 0 ? 'text-gray-900' : 'text-rose-600'}>
                          {txn.runningNetBalanceUsd >= 0 ? '+' : ''}${Number(txn.runningNetBalanceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleReconcile(txn.id)}
                          title="Click to toggle Reconciled status"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer hover:opacity-80 ${
                            txn.status === 'Reconciled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : txn.status === 'Cleared'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {txn.status === 'Reconciled' ? 'check_circle' : txn.status === 'Cleared' ? 'done' : 'hourglass_top'}
                          </span>
                          <span>{txn.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedTxnForDetail(txn)}
                            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Voucher Slip"
                          >
                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(txn.id, txn.voucherNo)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Voucher"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Cash Transaction Modal */}
      <RecordCashTransactionModal
        isOpen={recordModalOpen}
        onClose={() => {
          setRecordModalOpen(false);
          if (searchParams.get('action')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('action');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        accounts={accounts}
        companies={masterDirectory}
        exchangeRates={exchangeRates}
        onSave={handleSaveTransaction}
        initialType={modalInitialType}
        initialCompany={activeCompany?.name || ''}
      />

      {/* Transaction Detail View Modal */}
      {selectedTxnForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">receipt_long</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">
                    Voucher Slip {selectedTxnForDetail.voucherNo}
                  </h3>
                  <p className="text-xs text-gray-500">Official cash & bank journal audit receipt</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxnForDetail(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Voucher Amount</div>
                  <div className="text-xl font-extrabold text-gray-900 font-mono mt-0.5">
                    {formatCurrency(selectedTxnForDetail.amountNative, selectedTxnForDetail.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">USD Value</div>
                  <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                    ${(selectedTxnForDetail.amountUsd || toUsd(selectedTxnForDetail.amountNative, selectedTxnForDetail.currency)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Payee / Beneficiary / Partner</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedTxnForDetail.counterparty || 'Corporate Treasury'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Transaction Date</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedTxnForDetail.date}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Bank / Cash Account</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedTxnForDetail.accountName}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Operating Entity</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedTxnForDetail.entity}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Document Reference / PO / Inv</div>
                  <div className="font-mono text-gray-800 mt-0.5">{selectedTxnForDetail.linkedInvoice || selectedTxnForDetail.linkedPo || selectedTxnForDetail.reference || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Payment Mode</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedTxnForDetail.paymentMode}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Accounting Category</div>
                  <div className="font-semibold text-gray-800 mt-0.5">{selectedTxnForDetail.category}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Audit Status</div>
                  <div className="font-semibold text-emerald-700 mt-0.5">{selectedTxnForDetail.status}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Particulars / Narration</div>
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-800 font-medium mt-1">
                  {selectedTxnForDetail.description}
                </div>
              </div>

              {selectedTxnForDetail.notes && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Auditor Remarks</div>
                  <div className="p-2.5 bg-blue-50/50 text-blue-900 rounded-xl mt-1">
                    {selectedTxnForDetail.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedTxnForDetail(null)}
                className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBookFinance;
