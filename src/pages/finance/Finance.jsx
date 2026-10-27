import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData,
  apiDeletePaymentReceived,
  apiDeletePaymentMade,
  apiLockPeriod,
  apiUnlockPeriod
} from './financeData';
import { FinanceBrowserImportBanner } from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import {
  computeFinancialKpis,
  getInvoicePayments,
  calcInvoiceState,
  validateClientPayment,
  getSupplierPoPayments,
  calcSupplierPoState,
  validateSupplierPayment,
  convertToUsd,
  createLinkedClientPaymentCashTransaction,
  createLinkedSupplierPaymentCashTransaction,
  applyCashTransactionToAccounts,
  reverseCashTransactionForPayment,
  reconcileInvoiceAfterPaymentDeletion,
  reconcileSupplierPoAfterPaymentDeletion
} from './financeCalcs';

import FinanceNavTabs from './FinanceNavTabs';

// Tab Components
import FinanceProjects from './tabs/FinanceProjects';
import FinanceDataRelationships from './tabs/FinanceDataRelationships';
import FinanceOverview from './tabs/FinanceOverview';
import { FinanceAuditLogTab } from './tabs/FinanceAuditLogTab';

// Modals
import RegisterClientPOModal from './modals/RegisterClientPOModal';
import IssueSupplierPOModal from './modals/IssueSupplierPOModal';
import GenerateInvoiceModal from './modals/GenerateInvoiceModal';
import RecordPaymentReceivedModal from './modals/RecordPaymentReceivedModal';
import RecordSupplierPaymentModal from './modals/RecordSupplierPaymentModal';
import CreateProjectModal from './modals/CreateProjectModal';
import SampleInvoiceModal from './modals/SampleInvoiceModal';
import SampleSupplierPOModal from './modals/SampleSupplierPOModal';
import ThreeWayMatchModal from './modals/ThreeWayMatchModal';
import ExchangeRatesPanelModal from './modals/ExchangeRatesPanelModal';
import { PeriodLockModal } from './modals/PeriodLockModal';

export const Finance = () => {
  const { user, isAdmin, loading, canManageFinance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State loaded from API or memory cache
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
      console.error('[Finance] Error loading data:', err);
      setError(err.message || 'Failed to load finance data from server.');
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

  const rawTab = searchParams.get('tab') || 'projects';
  
  // Handle redirects for dedicated separate pages and vault
  useEffect(() => {
    if (rawTab === 'vault') {
      navigate('/master-data', { replace: true });
    } else if (rawTab === 'client-pos' || rawTab === 'client-workflow') {
      navigate('/finance/client', { replace: true });
    } else if (rawTab === 'supplier-pos' || rawTab === 'supplier-workflow') {
      navigate('/finance/supplier', { replace: true });
    } else if (rawTab === 'cash-book' || rawTab === 'cashbook') {
      navigate('/finance/cash-book', { replace: true });
    }
  }, [rawTab, navigate]);

  const activeTab = 
    rawTab === 'simulation' ? 'relationships' :
    rawTab === 'vault' ? 'projects' : rawTab;

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Modals state
  const [registerClientPoOpen, setRegisterClientPoOpen] = useState(false);
  const [issueSupplierPoOpen, setIssueSupplierPoOpen] = useState(false);
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(false);
  const [recordClientPaymentOpen, setRecordClientPaymentOpen] = useState(false);
  const [recordSupplierPaymentOpen, setRecordSupplierPaymentOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [exchangeRatesOpen, setExchangeRatesOpen] = useState(false);
  const [sampleInvoiceModalOpen, setSampleInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForSample, setSelectedInvoiceForSample] = useState(null);
  const [sampleSupplierPoOpen, setSampleSupplierPoOpen] = useState(false);
  const [selectedPoForSample, setSelectedPoForSample] = useState(null);
  const [threeWayMatchOpen, setThreeWayMatchOpen] = useState(false);
  const [selectedPoForMatch, setSelectedPoForMatch] = useState(null);

  // Period Lock state & handlers
  const [periodLockOpen, setPeriodLockOpen] = useState(false);
  const [isLockingPeriod, setIsLockingPeriod] = useState(false);

  const handleLockPeriod = async ({ period, reason }) => {
    try {
      setIsLockingPeriod(true);
      const locked = await apiLockPeriod(period, reason);
      setData(prev => {
        const nextPeriods = [locked, ...(prev.lockedPeriods || [])];
        const nextData = { ...prev, lockedPeriods: nextPeriods };
        saveFinanceData(nextData);
        return nextData;
      });
      addToast(`Accounting Period ${period} locked successfully.`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to lock period', 'error');
    } finally {
      setIsLockingPeriod(false);
    }
  };

  const handleUnlockPeriod = async (period) => {
    try {
      setIsLockingPeriod(true);
      await apiUnlockPeriod(period);
      setData(prev => {
        const nextPeriods = (prev.lockedPeriods || []).filter(p => (typeof p === 'string' ? p : p.period) !== period);
        const nextData = { ...prev, lockedPeriods: nextPeriods };
        saveFinanceData(nextData);
        return nextData;
      });
      addToast(`Accounting Period ${period} unlocked.`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to unlock period', 'error');
    } finally {
      setIsLockingPeriod(false);
    }
  };


  // Dynamic, drift-free financial KPIs computed pure via useMemo
  const computedKpis = useMemo(() => {
    return computeFinancialKpis(data);
  }, [
    data.invoices,
    data.clientPos,
    data.supplierPos,
    data.paymentsReceived,
    data.paymentsMade,
    data.exchangeRates
  ]);

  // Handlers for creating new records
  const handleSaveClientPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.clientPos];
      const nextData = {
        ...prev,
        clientPos: nextPos,
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Client PO ${newPo.poNumber} registered successfully!`, 'success');
  };

  const handleSaveSupplierPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.supplierPos];
      const nextData = {
        ...prev,
        supplierPos: nextPos,
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Supplier PO ${newPo.poNumber} issued successfully!`, 'success');
  };

  const handleSaveInvoice = (newInv) => {
    setData(prev => {
      // Update linked client PO drawdown
      const nextClientPos = prev.clientPos.map(cpo => {
        if (cpo.poNumber === newInv.linkedPo) {
          const nextInvoiced = (cpo.invoicedNative || 0) + newInv.amountNative;
          const pct = Math.min(100, Math.round((nextInvoiced / (cpo.totalValueNative || 1)) * 100));
          const remaining = Math.max(0, (cpo.totalValueNative || 0) - nextInvoiced);
          return {
            ...cpo,
            invoicedNative: nextInvoiced,
            drawdownPercent: pct,
            remainingNative: remaining,
            remainingPercent: 100 - pct,
            status: pct >= 100 ? 'Fully Invoiced' : 'Partially Invoiced'
          };
        }
        return cpo;
      });

      // Record automatic receipt if partial or full payment was received upfront
      const nextPaymentsReceived = [...(prev.paymentsReceived || [])];
      let nextCashAccounts = prev.cashAccounts || [];
      let nextCashTransactions = prev.cashTransactions || [];
      if (newInv.amountReceivedSoFar > 0) {
        const autoPmt = {
          id: `PMT-${Date.now()}`,
          date: newInv.paidDate || newInv.invoicingDate || new Date().toISOString().split('T')[0],
          clientName: newInv.clientName,
          invoiceNumber: newInv.invoiceNumber,
          linkedPo: newInv.linkedPo,
          mode: 'Direct Deposit / Wire',
          reference: `REC-${newInv.invoiceNumber.replace(/^VOL-/, '')}`,
          amountNative: newInv.amountReceivedSoFar,
          currency: newInv.currency,
          amountUsd: newInv.receivedUsd || 0,
          exchangeRate: newInv.exchangeRate || 1.0,
          status: 'Cleared'
        };
        nextPaymentsReceived.unshift(autoPmt);

        const chosenAccount = (prev.cashAccounts || []).find(a => a.currency === newInv.currency) || (prev.cashAccounts || [])[0];
        if (chosenAccount) {
          const cashTx = createLinkedClientPaymentCashTransaction({
            payment: autoPmt,
            chosenAccount,
            invoiceNumber: newInv.invoiceNumber
          });
          nextCashAccounts = applyCashTransactionToAccounts(cashTx, nextCashAccounts);
          nextCashTransactions = [cashTx, ...nextCashTransactions];
        }
      }

      const nextData = {
        ...prev,
        invoices: [newInv, ...prev.invoices],
        clientPos: nextClientPos,
        paymentsReceived: nextPaymentsReceived,
        cashAccounts: nextCashAccounts,
        cashTransactions: nextCashTransactions,
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Client Invoice ${newInv.invoiceNumber} generated!`, 'success');
  };

  const handleRecordClientPayment = (newPayment, invoiceNumber) => {
    const targetInvoice = (data.invoices || []).find(inv => inv.invoiceNumber === invoiceNumber);
    if (!targetInvoice) {
      addToast(`Invoice ${invoiceNumber} not found.`, 'error');
      return;
    }

    const linked = getInvoicePayments(invoiceNumber, data.paymentsReceived || []);
    const pmtUsd = newPayment.amountUsd !== undefined && newPayment.amountUsd !== null
      ? newPayment.amountUsd
      : convertToUsd(newPayment.amountNative, newPayment.currency, data.exchangeRates);

    const validation = validateClientPayment(targetInvoice, linked, pmtUsd);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }

    setData(prev => {
      const nextPaymentsReceived = [newPayment, ...(prev.paymentsReceived || [])];
      const updatedLinked = [newPayment, ...linked];
      const state = calcInvoiceState(targetInvoice, updatedLinked, { exchangeRates: prev.exchangeRates });

      const nextInvoices = prev.invoices.map(inv => {
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

      // Automatically create the matching cash_transactions entry linked by payment id
      const chosenAccount = (prev.cashAccounts || []).find(a => a.id === newPayment.accountId) || (prev.cashAccounts || [])[0];
      const cashTx = createLinkedClientPaymentCashTransaction({
        payment: newPayment,
        chosenAccount,
        invoiceNumber
      });
      const nextCashAccounts = applyCashTransactionToAccounts(cashTx, prev.cashAccounts || []);
      const nextCashTransactions = [cashTx, ...(prev.cashTransactions || [])];

      const nextData = {
        ...prev,
        invoices: nextInvoices,
        paymentsReceived: nextPaymentsReceived,
        cashAccounts: nextCashAccounts,
        cashTransactions: nextCashTransactions,
      };
      saveFinanceData(nextData);
      return nextData;
    });

    addToast(`Payment of $${Number(pmtUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded for invoice ${invoiceNumber}!`, 'success');
  };

  const handleRecordSupplierPayment = (newPayment, poNumber) => {
    const targetPo = (data.supplierPos || []).find(spo => spo.poNumber === poNumber);
    if (!targetPo) {
      addToast(`Supplier PO ${poNumber} not found.`, 'error');
      return;
    }

    const linked = getSupplierPoPayments(poNumber, data.paymentsMade || []);
    const pmtUsd = newPayment.amountUsd !== undefined && newPayment.amountUsd !== null
      ? newPayment.amountUsd
      : convertToUsd(newPayment.amountNative, newPayment.currency, data.exchangeRates);

    const validation = validateSupplierPayment(targetPo, linked, pmtUsd);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }

    setData(prev => {
      const nextPaymentsMade = [newPayment, ...(prev.paymentsMade || [])];
      const updatedLinked = [newPayment, ...linked];
      const state = calcSupplierPoState(targetPo, updatedLinked, { exchangeRates: prev.exchangeRates });

      const nextSupplierPos = prev.supplierPos.map(spo => {
        if (spo.poNumber === poNumber) {
          return {
            ...spo,
            paidUsd: state.paidUsd,
            balanceUsd: state.balanceUsd,
            remainingUsd: state.balanceUsd,
            status: state.status,
          };
        }
        return spo;
      });

      // Automatically create matching cash_transactions entry linked by payment id
      const chosenAccount = (prev.cashAccounts || []).find(a => a.id === newPayment.accountId) || (prev.cashAccounts || [])[0];
      const cashTx = createLinkedSupplierPaymentCashTransaction({
        payment: newPayment,
        chosenAccount,
        poNumber
      });
      const nextCashAccounts = applyCashTransactionToAccounts(cashTx, prev.cashAccounts || []);
      const nextCashTransactions = [cashTx, ...(prev.cashTransactions || [])];

      const nextData = {
        ...prev,
        supplierPos: nextSupplierPos,
        paymentsMade: nextPaymentsMade,
        cashAccounts: nextCashAccounts,
        cashTransactions: nextCashTransactions,
      };
      saveFinanceData(nextData);
      return nextData;
    });

    addToast(`Supplier payment of $${Number(pmtUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded for PO ${poNumber}!`, 'success');
  };

  const handleDeleteClientPayment = async (paymentId, invoiceNumber) => {
    try {
      await apiDeletePaymentReceived(paymentId);
    } catch (err) {
      console.warn('[Finance] Remote delete failed or offline, updating local state:', err);
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
    addToast(`Payment ${paymentId} deleted and linked cash transaction reversed.`, 'success');
  };

  const handleDeleteSupplierPayment = async (paymentId, poNumber) => {
    try {
      await apiDeletePaymentMade(paymentId);
    } catch (err) {
      console.warn('[Finance] Remote delete failed or offline, updating local state:', err);
    }
    setData(prev => {
      const remainingPmts = (prev.paymentsMade || []).filter(p => p.id !== paymentId);
      const { updatedAccounts, remainingTransactions } = reverseCashTransactionForPayment(
        paymentId,
        prev.cashTransactions || [],
        prev.cashAccounts || []
      );
      const nextSupplierPos = reconcileSupplierPoAfterPaymentDeletion(
        poNumber,
        remainingPmts,
        prev.supplierPos || [],
        prev.exchangeRates || {}
      );
      const nextData = {
        ...prev,
        paymentsMade: remainingPmts,
        supplierPos: nextSupplierPos,
        cashAccounts: updatedAccounts,
        cashTransactions: remainingTransactions
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Supplier payment ${paymentId} deleted and linked cash transaction reversed.`, 'success');
  };

  const handleSaveProject = (newProject) => {
    setData(prev => {
      const nextProjects = [newProject, ...prev.projects];
      const nextData = {
        ...prev,
        projects: nextProjects
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Project "${newProject.projectName}" setup successfully!`, 'success');
  };

  const handleVerifyMatch = (result) => {
    setData(prev => {
      const nextSupplierPos = prev.supplierPos.map(spo => {
        if (spo.poNumber === result.poNumber) {
          return {
            ...spo,
            billedUsd: (spo.billedUsd || 0) + result.amount,
            remainingUsd: Math.max(0, (spo.remainingUsd || 0) - result.amount),
            status: '3-Way Match Verified'
          };
        }
        return spo;
      });

      const nextData = {
        ...prev,
        supplierPos: nextSupplierPos
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`3-Way Match verification logged for ${result.poNumber}`, 'success');
    setThreeWayMatchOpen(false);
  };

  const openSampleInvoice = (inv = null) => {
    setSelectedInvoiceForSample(inv);
    setSampleInvoiceModalOpen(true);
  };

  const openSampleSupplierPo = (spo = null) => {
    setSelectedPoForSample(spo);
    setSampleSupplierPoOpen(true);
  };

  const openThreeWayMatch = (spo = null) => {
    setSelectedPoForMatch(spo);
    setThreeWayMatchOpen(true);
  };

  // Redirect unauthenticated users safely after all hooks have executed
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Volvitech Financial Operations
            </h1>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Institutional PO Suite
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Consolidated multi-entity treasury, client PO drawdowns, project margin rollups, and supplier 3-way match AP ledger
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canManageFinance && (
            <button
              onClick={() => setCreateProjectOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
              <span>+ Setup Project</span>
            </button>
          )}

          {canManageFinance && (
            <button
              onClick={() => setRegisterClientPoOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">add_task</span>
              <span>+ Client PO</span>
            </button>
          )}

          {canManageFinance && (
            <button
              onClick={() => setIssueSupplierPoOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">shopping_cart_checkout</span>
              <span>+ Supplier PO</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setPeriodLockOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
              title="Lock or Unlock Monthly Accounting Periods"
            >
              <span className="material-symbols-outlined text-[16px] text-purple-600">lock</span>
              <span>Period Lock</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setExchangeRatesOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">currency_exchange</span>
              <span>Exchange Rates</span>
            </button>
          )}

          {canManageFinance ? (
            <button
              onClick={() => setGenerateInvoiceOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">flash_on</span>
              <span>Auto-Gen Invoice</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs flex items-center gap-1.5 border border-slate-200">
              <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
              <span>Read-Only Finance View</span>
            </span>
          )}
        </div>
      </div>

      {/* Admin One-Time Browser Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Main Suite Tabs Navigation */}
      <FinanceNavTabs activeTab={activeTab} />

      {/* Loading & Error States */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner />
      ) : (
        /* Render Active Tab strictly following Data Flow */
        <div>
          {activeTab === 'projects' && (
            <FinanceProjects
              projects={data.projects}
              exchangeRates={data.exchangeRates}
              onOpenCreateProject={() => setCreateProjectOpen(true)}
            />
          )}

          {activeTab === 'relationships' && (
            <FinanceDataRelationships
              projects={data.projects}
              clientPos={data.clientPos}
              supplierPos={data.supplierPos}
              invoices={data.invoices}
              paymentsReceived={data.paymentsReceived || []}
              paymentsMade={data.paymentsMade || []}
              exchangeRates={data.exchangeRates}
            />
          )}

          {activeTab === 'overview' && (
            <FinanceOverview
              kpis={computedKpis}
              exchangeRates={data.exchangeRates}
              projects={data.projects}
              clientPos={data.clientPos}
              supplierPos={data.supplierPos}
              isAdmin={isAdmin}
              onOpenExchangeRates={() => setExchangeRatesOpen(true)}
              onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
              onOpenIssueSupplierPo={() => setIssueSupplierPoOpen(true)}
              onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
              onViewSampleInvoice={openSampleInvoice}
            />
          )}

          {activeTab === 'audit-log' && isAdmin && (
            <FinanceAuditLogTab />
          )}
        </div>
      )}

      {/* Modals */}
      <RegisterClientPOModal
        isOpen={registerClientPoOpen}
        onClose={() => setRegisterClientPoOpen(false)}
        onSave={handleSaveClientPo}
        clients={data.masterDirectory?.filter(d => d.category === 'Client') || []}
        projects={data.projects || []}
        exchangeRates={data.exchangeRates || {}}
        existingPos={data.clientPos || []}
      />

      <IssueSupplierPOModal
        isOpen={issueSupplierPoOpen}
        onClose={() => setIssueSupplierPoOpen(false)}
        onSave={handleSaveSupplierPo}
        projects={data.projects || []}
        vendors={data.masterDirectory?.filter(d => d.category === 'Supplier') || []}
        clientPos={data.clientPos || []}
        exchangeRates={data.exchangeRates || {}}
        existingPos={data.supplierPos || []}
      />

      <GenerateInvoiceModal
        isOpen={generateInvoiceOpen}
        onClose={() => setGenerateInvoiceOpen(false)}
        clientPos={data.clientPos || []}
        projects={data.projects || []}
        clients={data.masterDirectory?.filter(d => d.category === 'Client') || []}
        exchangeRates={data.exchangeRates || {}}
        existingInvoices={data.invoices || []}
        onSave={handleSaveInvoice}
      />

      <RecordPaymentReceivedModal
        isOpen={recordClientPaymentOpen}
        onClose={() => setRecordClientPaymentOpen(false)}
        onSave={handleRecordClientPayment}
        invoices={data.invoices || []}
        paymentsReceived={data.paymentsReceived || []}
        cashAccounts={data.cashAccounts || []}
        exchangeRates={data.exchangeRates || {}}
      />

      <RecordSupplierPaymentModal
        isOpen={recordSupplierPaymentOpen}
        onClose={() => setRecordSupplierPaymentOpen(false)}
        onSave={handleRecordSupplierPayment}
        supplierPos={data.supplierPos || []}
        paymentsMade={data.paymentsMade || []}
        cashAccounts={data.cashAccounts || []}
        exchangeRates={data.exchangeRates || {}}
      />

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSave={handleSaveProject}
        clients={data.masterDirectory.filter(d => d.category === 'Client')}
        clientPos={data.clientPos}
        supplierPos={data.supplierPos}
        exchangeRates={data.exchangeRates || {}}
      />

      <SampleInvoiceModal
        isOpen={sampleInvoiceModalOpen}
        onClose={() => setSampleInvoiceModalOpen(false)}
        invoice={selectedInvoiceForSample}
      />

      <SampleSupplierPOModal
        isOpen={sampleSupplierPoOpen}
        onClose={() => setSampleSupplierPoOpen(false)}
        po={selectedPoForSample}
      />

      <ThreeWayMatchModal
        isOpen={threeWayMatchOpen}
        onClose={() => setThreeWayMatchOpen(false)}
        supplierPo={selectedPoForMatch}
        onVerify={handleVerifyMatch}
      />

      <ExchangeRatesPanelModal
        isOpen={exchangeRatesOpen}
        onClose={() => setExchangeRatesOpen(false)}
        exchangeRates={data.exchangeRates || {}}
        exchangeRatesList={data.exchangeRatesList || []}
        isAdmin={isAdmin}
        onSaveRates={(rates) => setData(prev => ({ ...prev, exchangeRates: rates }))}
      />

      <PeriodLockModal
        isOpen={periodLockOpen}
        onClose={() => setPeriodLockOpen(false)}
        lockedPeriods={data.lockedPeriods || []}
        onLockPeriod={handleLockPeriod}
        onUnlockPeriod={handleUnlockPeriod}
        isSubmitting={isLockingPeriod}
      />
    </div>
  );
};

export default Finance;
