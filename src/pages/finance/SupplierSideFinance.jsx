import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData,
  apiDeletePaymentMade,
  apiUpdateSupplierPo,
  apiVoidSupplierPo
} from './financeData';
import { FinanceBrowserImportBanner } from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import {
  getSupplierPoPayments,
  calcSupplierPoState,
  validateSupplierPayment,
  convertToUsd,
  createLinkedSupplierPaymentCashTransaction,
  applyCashTransactionToAccounts,
  reverseCashTransactionForPayment,
  reconcileSupplierPoAfterPaymentDeletion
} from './financeCalcs';


import FinanceSupplierPOs from './tabs/FinanceSupplierPOs';

// Modals
import IssueSupplierPOModal from './modals/IssueSupplierPOModal';
import RecordSupplierPaymentModal from './modals/RecordSupplierPaymentModal';
import SampleSupplierPOModal from './modals/SampleSupplierPOModal';
import ThreeWayMatchModal from './modals/ThreeWayMatchModal';
import { EditSupplierPOModal } from './modals/EditSupplierPOModal';
import { VoidEntityModal } from './modals/VoidEntityModal';

export const SupplierSideFinance = () => {
  const { user, loading, canManageFinance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Map URL tab to sub-tab identifier
  const tabParam = (searchParams.get('tab') || 'pos').toUpperCase();
  const activeSubTab = 
    tabParam === 'BILLS' || tabParam === 'INVOICES' || tabParam === 'INVOICE' || tabParam === 'BILL' ? 'BILLS' :
    tabParam === 'PAYMENTS' || tabParam === 'PAYMENT' ? 'PAYMENTS' :
    tabParam === 'AGEING' || tabParam === 'AGING' ? 'AGEING' :
    tabParam === 'STATEMENTS' || tabParam === 'STATEMENT' ? 'STATEMENTS' :
    'POS';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab.toLowerCase() });
  };

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
      console.error('[SupplierFinance] Error loading data:', err);
      setError(err.message || 'Failed to load supplier finance records.');
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

  // Modals state
  const [issueSupplierPoOpen, setIssueSupplierPoOpen] = useState(() => {
    const action = searchParams.get('action');
    return action === 'add-po' || action === 'add-supplier-po';
  });
  const [recordSupplierPaymentOpen, setRecordSupplierPaymentOpen] = useState(false);
  const [sampleSupplierPoOpen, setSampleSupplierPoOpen] = useState(false);
  const [selectedPoForSample, setSelectedPoForSample] = useState(null);
  const [threeWayMatchOpen, setThreeWayMatchOpen] = useState(false);
  const [selectedPoForMatch, setSelectedPoForMatch] = useState(null);

  // Edit & Void state
  const [editSupplierPoModalOpen, setEditSupplierPoModalOpen] = useState(false);
  const [selectedPoForEdit, setSelectedPoForEdit] = useState(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [entityToVoid, setEntityToVoid] = useState(null);
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);

  const handleOpenEditSupplierPo = (spo) => {
    setSelectedPoForEdit(spo);
    setEditSupplierPoModalOpen(true);
  };

  const handleSaveEditSupplierPo = async (updatedPo) => {
    try {
      setIsSubmittingMutation(true);
      await apiUpdateSupplierPo(updatedPo.id, updatedPo);
      addToast(`Supplier PO ${updatedPo.poNumber} updated successfully!`, 'success');
      setEditSupplierPoModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update Supplier PO', 'error');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const handleOpenVoidSupplierPo = (spo) => {
    setEntityToVoid(spo);
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async (reason) => {
    if (!entityToVoid) return;
    try {
      setIsSubmittingMutation(true);
      await apiVoidSupplierPo(entityToVoid.id, reason);
      addToast(`Supplier PO ${entityToVoid.poNumber} marked as Void!`, 'success');
      setVoidModalOpen(false);
      setEntityToVoid(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to void Supplier PO', 'error');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-po' || action === 'add-supplier-po') {
      setIssueSupplierPoOpen(true);
    }
  }, [searchParams]);

  // Handlers for creating new records
  const handleSaveSupplierPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.supplierPos];
      const nextData = {
        ...prev,
        supplierPos: nextPos,
        kpis: {
          ...prev.kpis,
          supplierPoCommitted: (prev.kpis.supplierPoCommitted || 0) + newPo.committedUsd
        }
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Supplier PO ${newPo.poNumber} issued successfully!`, 'success');
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

  const handleDeleteSupplierPayment = async (paymentId, poNumber) => {
    try {
      await apiDeletePaymentMade(paymentId);
    } catch (err) {
      console.warn('[Finance Supplier] Remote delete failed or offline, updating local state:', err);
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

  const openSampleSupplierPo = (spo = null) => {
    setSelectedPoForSample(spo);
    setSampleSupplierPoOpen(true);
  };

  const openThreeWayMatch = (spo = null) => {
    setSelectedPoForMatch(spo);
    setThreeWayMatchOpen(true);
  };

  const isPurchasesRoute = location.pathname.startsWith('/purchases');

  const pageTitle = isPurchasesRoute
    ? 'Supplier Purchase Orders'
    : activeSubTab === 'BILLS'
    ? 'Supplier Invoices & Bills'
    : activeSubTab === 'PAYMENTS'
    ? 'Supplier Payments & Disbursements'
    : activeSubTab === 'AGEING'
    ? 'Accounts Payable Ageing'
    : activeSubTab === 'STATEMENTS'
    ? 'Supplier Account Statements'
    : 'Supplier-Side Financial Operations';

  const pageBadge = isPurchasesRoute
    ? 'Purchases Workflow'
    : activeSubTab === 'POS'
    ? 'Supplier POs'
    : activeSubTab === 'BILLS'
    ? 'Supplier Invoices'
    : activeSubTab === 'PAYMENTS'
    ? 'Disbursements'
    : activeSubTab === 'AGEING'
    ? 'AP Ageing'
    : 'Statements';

  const pageDescription = isPurchasesRoute
    ? 'Vendor procurement purchase orders, scope delivery commitments, and subcontractor SOWs'
    : activeSubTab === 'BILLS'
    ? 'Vendor bills intake, 3-way matching, multi-tax verification, and due dates management'
    : activeSubTab === 'PAYMENTS'
    ? 'Outbound wire transfers, supplier payment settlement vouchers, and remittance tracking'
    : activeSubTab === 'AGEING'
    ? 'Payables obligations breakdown across 30, 60, and 90+ days aging cohorts'
    : activeSubTab === 'STATEMENTS'
    ? 'Vendor procurement summaries, historical statements, and ledger reconciliations'
    : 'Vendor procurement PO commitments, 3-way matching AP ledger, and outbound disbursements';

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
              {pageTitle}
            </h1>
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {pageBadge}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pageDescription}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/master-data"
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-500">storefront</span>
            <span>Supplier Master</span>
          </Link>

          {canManageFinance && (
            <button
              onClick={() => setIssueSupplierPoOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">shopping_cart_checkout</span>
              <span>+ Supplier PO</span>
            </button>
          )}

          <button
            onClick={() => openThreeWayMatch()}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">fact_check</span>
            <span>3-Way Match</span>
          </button>

          {canManageFinance && (
            <button
              onClick={() => setRecordSupplierPaymentOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>+ Record Payment</span>
            </button>
          )}
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
          {isPurchasesRoute ? (
            <span className="text-gray-900 font-bold flex items-center gap-1.5">
              <span>Purchases</span>
              <span className="text-gray-300">/</span>
              <span className="text-indigo-600 font-bold">Supplier POs</span>
            </span>
          ) : (
            <span className="text-gray-900 font-bold flex items-center gap-1.5">
              <span>Accounts Payable</span>
              <span className="text-gray-300">/</span>
              <span className="text-indigo-600 font-bold">{pageTitle}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700">AP</span>
            </span>
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
            to="/finance/cash-book"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Cash Book</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      {/* Admin One-Time Browser Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Loading & Error States */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading supplier POs and bills..." />
      ) : (
        /* Supplier-Side Workflow Component */
        <FinanceSupplierPOs
          supplierPos={data.supplierPos}
          paymentsMade={data.paymentsMade || []}
          activeSubTab={activeSubTab}
          onTabChange={handleTabChange}
          onOpenIssueSupplierPo={() => setIssueSupplierPoOpen(true)}
          onOpenThreeWayMatch={openThreeWayMatch}
          onOpenRecordSupplierPayment={() => setRecordSupplierPaymentOpen(true)}
          onViewSampleSupplierPo={openSampleSupplierPo}
          onDeletePayment={handleDeleteSupplierPayment}
          canManageFinance={canManageFinance}
          onEditSupplierPo={handleOpenEditSupplierPo}
          onVoidSupplierPo={handleOpenVoidSupplierPo}
        />
      )}

      {/* Modals */}
      <IssueSupplierPOModal
        isOpen={issueSupplierPoOpen}
        onClose={() => setIssueSupplierPoOpen(false)}
        projects={data.projects || []}
        vendors={data.masterDirectory?.filter(d => d.category === 'Supplier') || []}
        clientPos={data.clientPos || []}
        exchangeRates={data.exchangeRates || {}}
        existingPos={data.supplierPos || []}
        onSave={handleSaveSupplierPo}
      />

      <RecordSupplierPaymentModal
        isOpen={recordSupplierPaymentOpen}
        onClose={() => setRecordSupplierPaymentOpen(false)}
        supplierPos={data.supplierPos || []}
        paymentsMade={data.paymentsMade || []}
        cashAccounts={data.cashAccounts || []}
        exchangeRates={data.exchangeRates || {}}
        onSave={handleRecordSupplierPayment}
      />

      <SampleSupplierPOModal
        isOpen={sampleSupplierPoOpen}
        onClose={() => setSampleSupplierPoOpen(false)}
        po={selectedPoForSample}
      />

      <ThreeWayMatchModal
        isOpen={threeWayMatchOpen}
        onClose={() => setThreeWayMatchOpen(false)}
        supplierPos={data.supplierPos}
        selectedPo={selectedPoForMatch}
        onVerify={handleVerifyMatch}
      />

      <EditSupplierPOModal
        isOpen={editSupplierPoModalOpen}
        onClose={() => setEditSupplierPoModalOpen(false)}
        supplierPo={selectedPoForEdit}
        lockedPeriods={data.lockedPeriods || []}
        onSave={handleSaveEditSupplierPo}
        isSubmitting={isSubmittingMutation}
      />

      <VoidEntityModal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        entityType="Supplier PO"
        entity={entityToVoid}
        onConfirm={handleConfirmVoid}
        isSubmitting={isSubmittingMutation}
      />
    </div>
  );
};

export default SupplierSideFinance;
