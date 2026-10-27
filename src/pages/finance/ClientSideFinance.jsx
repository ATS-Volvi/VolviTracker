import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  loadFinanceData,
  saveFinanceData,
  subscribeFinanceData,
  fetchFinanceData,
  apiDeletePaymentReceived,
  apiUpdateClientPo,
  apiVoidClientPo,
  apiUpdateInvoice,
  apiVoidInvoice
} from './financeData';
import { FinanceBrowserImportBanner } from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import {
  getInvoicePayments,
  calcInvoiceState,
  validateClientPayment,
  convertToUsd,
  createLinkedClientPaymentCashTransaction,
  applyCashTransactionToAccounts,
  reverseCashTransactionForPayment,
  reconcileInvoiceAfterPaymentDeletion,
  recalculateClientPoDrawdown
} from './financeCalcs';

import FinanceClientPOs from './tabs/FinanceClientPOs';

// Modals
import RegisterClientPOModal from './modals/RegisterClientPOModal';
import GenerateInvoiceModal from './modals/GenerateInvoiceModal';
import RecordPaymentReceivedModal from './modals/RecordPaymentReceivedModal';
import SampleInvoiceModal from './modals/SampleInvoiceModal';
import { EditClientPOModal } from './modals/EditClientPOModal';
import { EditInvoiceModal } from './modals/EditInvoiceModal';
import { VoidEntityModal } from './modals/VoidEntityModal';

export const ClientSideFinance = () => {
  const { user, canManageFinance, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Map URL tab to sub-tab identifier
  const tabParam = (searchParams.get('tab') || 'pos').toUpperCase();
  const activeSubTab = 
    tabParam === 'INVOICES' || tabParam === 'INVOICE' ? 'INVOICES' :
    tabParam === 'PAYMENTS' || tabParam === 'RECEIPTS' || tabParam === 'PAYMENT' ? 'PAYMENTS' :
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
      console.error('[ClientFinance] Error loading data:', err);
      setError(err.message || 'Failed to load client finance records.');
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
  const [registerClientPoOpen, setRegisterClientPoOpen] = useState(() => {
    const action = searchParams.get('action');
    return action === 'add-po' || action === 'add-client-po';
  });
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(() => {
    const action = searchParams.get('action');
    return action === 'generate-invoice' || action === 'add-invoice' || action === 'new-invoice';
  });
  const [recordClientPaymentOpen, setRecordClientPaymentOpen] = useState(false);
  const [sampleInvoiceModalOpen, setSampleInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForSample, setSelectedInvoiceForSample] = useState(null);

  // Edit & Void modals state
  const [editClientPoModalOpen, setEditClientPoModalOpen] = useState(false);
  const [selectedPoForEdit, setSelectedPoForEdit] = useState(null);
  const [editInvoiceModalOpen, setEditInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState(null);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [entityToVoid, setEntityToVoid] = useState(null);
  const [entityTypeToVoid, setEntityTypeToVoid] = useState('Invoice');
  const [isSubmittingMutation, setIsSubmittingMutation] = useState(false);

  const handleOpenEditClientPo = (cpo) => {
    setSelectedPoForEdit(cpo);
    setEditClientPoModalOpen(true);
  };

  const handleSaveEditClientPo = async (updatedPo) => {
    try {
      setIsSubmittingMutation(true);
      await apiUpdateClientPo(updatedPo.id, updatedPo);
      addToast(`Client PO ${updatedPo.poNumber} updated successfully!`, 'success');
      setEditClientPoModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update Client PO', 'error');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const handleOpenVoidClientPo = (cpo) => {
    setEntityToVoid(cpo);
    setEntityTypeToVoid('Client PO');
    setVoidModalOpen(true);
  };

  const handleOpenEditInvoice = (inv) => {
    setSelectedInvoiceForEdit(inv);
    setEditInvoiceModalOpen(true);
  };

  const handleSaveEditInvoice = async (updatedInv) => {
    try {
      setIsSubmittingMutation(true);
      await apiUpdateInvoice(updatedInv.id, updatedInv);
      addToast(`Invoice ${updatedInv.invoiceNumber} updated and PO drawdown recalculated!`, 'success');
      setEditInvoiceModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update invoice', 'error');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  const handleOpenVoidInvoice = (inv) => {
    setEntityToVoid(inv);
    setEntityTypeToVoid('Invoice');
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async (reason) => {
    if (!entityToVoid) return;
    try {
      setIsSubmittingMutation(true);
      if (entityTypeToVoid === 'Invoice') {
        await apiVoidInvoice(entityToVoid.id, reason);
        addToast(`Invoice ${entityToVoid.invoiceNumber} voided successfully. PO drawdown recalculated!`, 'success');
      } else if (entityTypeToVoid === 'Client PO') {
        await apiVoidClientPo(entityToVoid.id, reason);
        addToast(`Client PO ${entityToVoid.poNumber} marked as Void!`, 'success');
      }
      setVoidModalOpen(false);
      setEntityToVoid(null);
      loadData();
    } catch (err) {
      addToast(err.message || `Failed to void ${entityTypeToVoid}`, 'error');
    } finally {
      setIsSubmittingMutation(false);
    }
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add-po' || action === 'add-client-po') {
      setRegisterClientPoOpen(true);
    } else if (action === 'generate-invoice' || action === 'add-invoice' || action === 'new-invoice') {
      setGenerateInvoiceOpen(true);
    }
  }, [searchParams]);

  // Handlers for creating new records
  const handleSaveClientPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.clientPos];
      const nextData = {
        ...prev,
        clientPos: nextPos,
        kpis: {
          ...prev.kpis,
          clientPoTotal: (prev.kpis.clientPoTotal || 0) + newPo.totalValueUsd
        }
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Client PO ${newPo.poNumber} registered successfully!`, 'success');
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

      // Automatically create matching cash_transactions entry linked by payment id
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

  const handleDeleteClientPayment = async (paymentId, invoiceNumber) => {
    try {
      await apiDeletePaymentReceived(paymentId);
    } catch (err) {
      console.warn('[Finance Client] Remote delete failed or offline, updating local state:', err);
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

  const openSampleInvoice = (inv = null) => {
    setSelectedInvoiceForSample(inv);
    setSampleInvoiceModalOpen(true);
  };

  const isSalesRoute = location.pathname.startsWith('/sales');
  
  const pageTitle = isSalesRoute
    ? 'Client Purchase Orders'
    : activeSubTab === 'INVOICES'
    ? 'Client Invoices'
    : activeSubTab === 'PAYMENTS'
    ? 'Receipts & Payment Collections'
    : activeSubTab === 'AGEING'
    ? 'Accounts Receivable Ageing'
    : activeSubTab === 'STATEMENTS'
    ? 'Client Account Statements'
    : 'Client-Side Financial Operations';

  const pageBadge = isSalesRoute
    ? 'Sales Workflow'
    : activeSubTab === 'POS'
    ? 'Client POs'
    : activeSubTab === 'INVOICES'
    ? 'Invoicing'
    : activeSubTab === 'PAYMENTS'
    ? 'Receipts'
    : activeSubTab === 'AGEING'
    ? 'AR Ageing'
    : 'Statements';

  const pageDescription = isSalesRoute
    ? 'Authoritative SOW contract caps, client purchase order intakes, and milestone billing schedules'
    : activeSubTab === 'INVOICES'
    ? 'Multi-tax invoicing, milestone drawdowns, payment terms, and invoice status tracking'
    : activeSubTab === 'PAYMENTS'
    ? 'Receipt reconciliation, wire settlement recordings, and customer balance updates'
    : activeSubTab === 'AGEING'
    ? 'Receivables overdue exposure across 30, 60, and 90+ days aging cohorts'
    : activeSubTab === 'STATEMENTS'
    ? 'Consolidated client statements of account, lifetime billing, and remittance history'
    : 'Institutional client PO contract intake, drawdowns, multi-tax invoicing, and payment reconciliation';

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
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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
            <span>Client Master</span>
          </Link>

          <button
            onClick={() => setRegisterClientPoOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">add_task</span>
            <span>+ Client PO</span>
          </button>

          <button
            onClick={() => setGenerateInvoiceOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">flash_on</span>
            <span>Auto-Gen Invoice</span>
          </button>

          <button
            onClick={() => setRecordClientPaymentOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>+ Record Payment</span>
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
          {isSalesRoute ? (
            <span className="text-gray-900 font-bold flex items-center gap-1.5">
              <span>Sales</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-bold">Client POs</span>
            </span>
          ) : (
            <span className="text-gray-900 font-bold flex items-center gap-1.5">
              <span>Accounts Receivable</span>
              <span className="text-gray-300">/</span>
              <span className="text-blue-600 font-bold">{pageTitle}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700">AR</span>
            </span>
          )}
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

      {/* Admin One-Time Browser Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Loading & Error States */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading client POs and billing records..." />
      ) : (
        /* Client-Side Workflow Component */
        <FinanceClientPOs
          clientPos={data.clientPos}
          invoices={data.invoices}
          paymentsReceived={data.paymentsReceived || []}
          exchangeRates={data.exchangeRates || {}}
          activeSubTab={activeSubTab}
          onTabChange={handleTabChange}
          canManageFinance={canManageFinance}
          onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
          onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
          onOpenRecordPayment={() => setRecordClientPaymentOpen(true)}
          onViewSampleInvoice={openSampleInvoice}
          onDeletePayment={handleDeleteClientPayment}
          onEditClientPo={handleOpenEditClientPo}
          onVoidClientPo={handleOpenVoidClientPo}
          onEditInvoice={handleOpenEditInvoice}
          onVoidInvoice={handleOpenVoidInvoice}
        />
      )}

      {/* Modals */}
      <RegisterClientPOModal
        isOpen={registerClientPoOpen}
        onClose={() => {
          setRegisterClientPoOpen(false);
          if (searchParams.get('action')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('action');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        projects={data.projects}
        exchangeRates={data.exchangeRates}
        clients={data.masterDirectory?.filter(d => d.category === 'Client') || []}
        existingPos={data.clientPos || []}
        onSave={handleSaveClientPo}
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
        invoices={data.invoices || []}
        paymentsReceived={data.paymentsReceived || []}
        cashAccounts={data.cashAccounts || []}
        exchangeRates={data.exchangeRates || {}}
        onSave={handleRecordClientPayment}
      />

      <SampleInvoiceModal
        isOpen={sampleInvoiceModalOpen}
        onClose={() => setSampleInvoiceModalOpen(false)}
        invoice={selectedInvoiceForSample}
      />

      <EditClientPOModal
        isOpen={editClientPoModalOpen}
        onClose={() => setEditClientPoModalOpen(false)}
        clientPo={selectedPoForEdit}
        lockedPeriods={data.lockedPeriods || []}
        onSave={handleSaveEditClientPo}
        isSubmitting={isSubmittingMutation}
      />

      <EditInvoiceModal
        isOpen={editInvoiceModalOpen}
        onClose={() => setEditInvoiceModalOpen(false)}
        invoice={selectedInvoiceForEdit}
        clientPos={data.clientPos || []}
        lockedPeriods={data.lockedPeriods || []}
        onSave={handleSaveEditInvoice}
        isSubmitting={isSubmittingMutation}
      />

      <VoidEntityModal
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        entityType={entityTypeToVoid}
        entity={entityToVoid}
        onConfirm={handleConfirmVoid}
        isSubmitting={isSubmittingMutation}
      />
    </div>
  );
};

export default ClientSideFinance;
