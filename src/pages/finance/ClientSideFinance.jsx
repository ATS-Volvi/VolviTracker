import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loadFinanceData, saveFinanceData, subscribeFinanceData } from './financeData';

import FinanceNavTabs from './FinanceNavTabs';
import FinanceClientPOs from './tabs/FinanceClientPOs';

// Modals
import RegisterClientPOModal from './modals/RegisterClientPOModal';
import GenerateInvoiceModal from './modals/GenerateInvoiceModal';
import RecordPaymentReceivedModal from './modals/RecordPaymentReceivedModal';
import SampleInvoiceModal from './modals/SampleInvoiceModal';

export const ClientSideFinance = () => {
  const { user, isAdmin, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Redirect non-admin users immediately
  if (!loading && !isAdmin) {
    return <Navigate to={user ? `/employee/${user.id}` : '/login'} replace />;
  }

  // State loaded from localStorage or defaults
  const [data, setData] = useState(() => loadFinanceData());

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  // Modals state
  const [registerClientPoOpen, setRegisterClientPoOpen] = useState(false);
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(false);
  const [recordClientPaymentOpen, setRecordClientPaymentOpen] = useState(false);
  const [sampleInvoiceModalOpen, setSampleInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForSample, setSelectedInvoiceForSample] = useState(null);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveFinanceData(data);
  }, [data]);

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

      const nextData = {
        ...prev,
        invoices: [newInv, ...prev.invoices],
        clientPos: nextClientPos,
        kpis: {
          ...prev.kpis,
          invoicedTotal: (prev.kpis.invoicedTotal || 0) + newInv.amountUsd,
          arOutstanding: (prev.kpis.arOutstanding || 0) + newInv.amountUsd
        }
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Client Invoice ${newInv.invoiceNumber} generated!`, 'success');
  };

  const handleRecordClientPayment = (newPayment, invoiceNumber) => {
    setData(prev => {
      const nextInvoices = prev.invoices.map(inv => {
        if (inv.invoiceNumber === invoiceNumber) {
          return {
            ...inv,
            status: 'Paid',
            balanceUsd: 0,
            receivedUsd: inv.amountUsd
          };
        }
        return inv;
      });

      const nextPaymentsReceived = [newPayment, ...(prev.paymentsReceived || [])];
      const nextData = {
        ...prev,
        invoices: nextInvoices,
        paymentsReceived: nextPaymentsReceived,
        kpis: {
          ...prev.kpis,
          collectedTotal: (prev.kpis.collectedTotal || 0) + newPayment.amountUsd,
          arOutstanding: Math.max(0, (prev.kpis.arOutstanding || 0) - newPayment.amountUsd)
        }
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Payment of $${newPayment.amountUsd?.toLocaleString()} recorded for invoice ${invoiceNumber}!`, 'success');
  };

  const openSampleInvoice = (inv = null) => {
    setSelectedInvoiceForSample(inv);
    setSampleInvoiceModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left">
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Client-Side Financial Operations
            </h1>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Receivables (AR)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Institutional client PO contract intake, drawdowns, multi-tax invoicing, and payment reconciliation
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

      {/* Main Suite Tabs Navigation */}
      <FinanceNavTabs activeTab="client-workflow" />

      {/* Client-Side Workflow Component */}
      <FinanceClientPOs
        clientPos={data.clientPos}
        invoices={data.invoices}
        paymentsReceived={data.paymentsReceived || []}
        onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
        onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
        onOpenRecordPayment={() => setRecordClientPaymentOpen(true)}
        onViewSampleInvoice={openSampleInvoice}
      />

      {/* Modals */}
      <RegisterClientPOModal
        isOpen={registerClientPoOpen}
        onClose={() => setRegisterClientPoOpen(false)}
        projects={data.projects}
        exchangeRates={data.exchangeRates}
        onSave={handleSaveClientPo}
      />

      <GenerateInvoiceModal
        isOpen={generateInvoiceOpen}
        onClose={() => setGenerateInvoiceOpen(false)}
        clientPos={data.clientPos}
        exchangeRates={data.exchangeRates}
        onSave={handleSaveInvoice}
      />

      <RecordPaymentReceivedModal
        isOpen={recordClientPaymentOpen}
        onClose={() => setRecordClientPaymentOpen(false)}
        invoices={data.invoices}
        onSave={handleRecordClientPayment}
      />

      <SampleInvoiceModal
        isOpen={sampleInvoiceModalOpen}
        onClose={() => setSampleInvoiceModalOpen(false)}
        invoice={selectedInvoiceForSample}
      />
    </div>
  );
};

export default ClientSideFinance;
