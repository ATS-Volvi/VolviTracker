import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData,
  INITIAL_CASH_ACCOUNTS,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_MASTER_DIRECTORY,
  INITIAL_EXCHANGE_RATES
} from './financeData';
import { FinanceBrowserImportBanner } from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import { exportCashBookToSpreadsheet } from './financeExports';

import RecordCashTransactionModal from './modals/RecordCashTransactionModal';
import {
  isExtraPaymentTxn,
  isSalaryTxn,
  isVendorOutflowTxn,
  OPERATING_ENTITIES
} from './cashbook/cashbookHelpers';
import { useCashflowCalculation } from './cashbook/useCashflowCalculation';
import CashbookHeader from './cashbook/CashbookHeader';
import CashflowStatsCards from './cashbook/CashflowStatsCards';
import CashflowCategoryBreakdown from './cashbook/CashflowCategoryBreakdown';
import CashflowCompanyRibbon from './cashbook/CashflowCompanyRibbon';
import CashflowLedgerTable from './cashbook/CashflowLedgerTable';
import CashflowVoucherModal from './cashbook/CashflowVoucherModal';

// Re-export helper functions for backwards compatibility
export { isExtraPaymentTxn, isSalaryTxn, isVendorOutflowTxn };

export const CashBookFinance = () => {
  const { user, loading, canManageFinance } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load finance data from API or memory cache
  const [data, setData] = useState(() => loadFinanceData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchFinanceData();
      setData(res);
    } catch (err) {
      console.error('[CashBook] Error loading data:', err);
      setError(err.message || 'Failed to load cash book records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates and fetch from API on mount
  useEffect(() => {
    loadData();
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  const exchangeRates = data.exchangeRates || INITIAL_EXCHANGE_RATES;
  const accounts = data.cashAccounts || INITIAL_CASH_ACCOUNTS;
  const rawTransactions = data.cashTransactions || INITIAL_CASH_TRANSACTIONS;
  const masterDirectory = data.masterDirectory || INITIAL_MASTER_DIRECTORY;

  // Selected company state
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    return searchParams.get('company') || 'ALL';
  });

  // Filter & Search states
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');
  const [streamFilter, setStreamFilter] = useState(() => {
    const s = searchParams.get('stream');
    if (s && s.toLowerCase() === 'inflow') return 'Inflow';
    if (s && s.toLowerCase() === 'outflow') return 'Outflow';
    return 'all';
  });
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

    return [...partners, ...OPERATING_ENTITIES];
  }, [masterDirectory]);

  // Find currently selected company object
  const activeCompany = useMemo(() => {
    if (selectedCompanyId === 'ALL') return null;
    return companyList.find(c => c.id === selectedCompanyId || c.name.toLowerCase() === selectedCompanyId.toLowerCase()) || null;
  }, [companyList, selectedCompanyId]);

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

  // Central Cashflow Calculations & Table Running Balance
  const {
    stats,
    transactionsWithRunningBalance,
    toUsd
  } = useCashflowCalculation({
    rawTransactions,
    activeCompany,
    exchangeRates,
    streamFilter,
    extraCategoryFilter,
    statusFilter,
    accountFilter,
    txnSearchQuery
  });

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

  const handleExportCsv = () => {
    exportCashBookToSpreadsheet(transactionsWithRunningBalance, 'csv');
    addToast('Cash Book exported to CSV successfully.', 'success');
  };

  const handleExportExcel = () => {
    exportCashBookToSpreadsheet(transactionsWithRunningBalance, 'xlsx');
    addToast('Cash Book exported to Excel (.XLSX) successfully.', 'success');
  };

  const openRecordModal = (type) => {
    setModalInitialType(type);
    setRecordModalOpen(true);
  };

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left animate-fade-in">
      <CashbookHeader
        activeCompany={activeCompany}
        canManageFinance={canManageFinance}
        openRecordModal={openRecordModal}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
      />

      {/* Admin One-Time Browser Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Loading & Error States */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading cash accounts and transaction ledgers..." />
      ) : (
        <>
          {/* 1. Total Cashflow Calculation Pillar Cards */}
          <CashflowStatsCards stats={stats} />

          {/* 2. Extra Payments Breakdown Sub-Panel */}
          <CashflowCategoryBreakdown
            stats={stats}
            streamFilter={streamFilter}
            extraCategoryFilter={extraCategoryFilter}
            setStreamFilter={setStreamFilter}
            setExtraCategoryFilter={setExtraCategoryFilter}
          />

          {/* 3. Company Selection Ribbon */}
          <CashflowCompanyRibbon
            companyList={companyList}
            visibleCompanyList={visibleCompanyList}
            rawTransactionsCount={rawTransactions.length}
            selectedCompanyId={selectedCompanyId}
            companyCategoryFilter={companyCategoryFilter}
            companySearchQuery={companySearchQuery}
            setCompanyCategoryFilter={setCompanyCategoryFilter}
            setCompanySearchQuery={setCompanySearchQuery}
            handleSelectCompany={handleSelectCompany}
          />

          {/* 4. Main Cashflow Ledger Table */}
          <CashflowLedgerTable
            transactions={transactionsWithRunningBalance}
            accounts={accounts}
            rawTransactionsCount={rawTransactions.length}
            activeCompany={activeCompany}
            streamFilter={streamFilter}
            extraCategoryFilter={extraCategoryFilter}
            statusFilter={statusFilter}
            accountFilter={accountFilter}
            txnSearchQuery={txnSearchQuery}
            setStreamFilter={setStreamFilter}
            setExtraCategoryFilter={setExtraCategoryFilter}
            setStatusFilter={setStatusFilter}
            setAccountFilter={setAccountFilter}
            setTxnSearchQuery={setTxnSearchQuery}
            handleSelectCompany={handleSelectCompany}
            handleToggleReconcile={handleToggleReconcile}
            handleDeleteTransaction={handleDeleteTransaction}
            setSelectedTxnForDetail={setSelectedTxnForDetail}
          />
        </>
      )}

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
      <CashflowVoucherModal
        selectedTxn={selectedTxnForDetail}
        onClose={() => setSelectedTxnForDetail(null)}
        toUsd={toUsd}
      />
    </div>
  );
};

export default CashBookFinance;
