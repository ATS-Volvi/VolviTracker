import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { loadFinanceData, saveFinanceData } from './financeData';

// Tab Components
import FinanceOverview from './tabs/FinanceOverview';
import FinanceProjects from './tabs/FinanceProjects';
import FinanceClientPOs from './tabs/FinanceClientPOs';
import FinanceSupplierPOs from './tabs/FinanceSupplierPOs';
import FinanceMasterVault from './tabs/FinanceMasterVault';

// Modals
import RegisterClientPOModal from './modals/RegisterClientPOModal';
import IssueSupplierPOModal from './modals/IssueSupplierPOModal';
import GenerateInvoiceModal from './modals/GenerateInvoiceModal';
import SampleInvoiceModal from './modals/SampleInvoiceModal';
import SampleSupplierPOModal from './modals/SampleSupplierPOModal';
import ThreeWayMatchModal from './modals/ThreeWayMatchModal';

export const Finance = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State loaded from localStorage or defaults
  const [data, setData] = useState(() => loadFinanceData());

  // Active Tab from URL params or default to 'overview'
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Modals state
  const [registerClientPoOpen, setRegisterClientPoOpen] = useState(false);
  const [issueSupplierPoOpen, setIssueSupplierPoOpen] = useState(false);
  const [generateInvoiceOpen, setGenerateInvoiceOpen] = useState(false);
  const [sampleInvoiceModalOpen, setSampleInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForSample, setSelectedInvoiceForSample] = useState(null);
  const [sampleSupplierPoOpen, setSampleSupplierPoOpen] = useState(false);
  const [selectedPoForSample, setSelectedPoForSample] = useState(null);
  const [threeWayMatchOpen, setThreeWayMatchOpen] = useState(false);
  const [selectedPoForMatch, setSelectedPoForMatch] = useState(null);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveFinanceData(data);
  }, [data]);

  // Handlers for creating new records
  const handleSaveClientPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.clientPos];
      return {
        ...prev,
        clientPos: nextPos,
        kpis: {
          ...prev.kpis,
          clientPoTotal: prev.kpis.clientPoTotal + newPo.totalValueUsd
        }
      };
    });
    addToast(`Client PO ${newPo.poNumber} registered successfully!`, 'success');
  };

  const handleSaveSupplierPo = (newPo) => {
    setData(prev => {
      const nextPos = [newPo, ...prev.supplierPos];
      return {
        ...prev,
        supplierPos: nextPos,
        kpis: {
          ...prev.kpis,
          supplierPoCommitted: prev.kpis.supplierPoCommitted + newPo.committedUsd
        }
      };
    });
    addToast(`Supplier PO ${newPo.poNumber} issued successfully!`, 'success');
  };

  const handleSaveInvoice = (newInv) => {
    setData(prev => {
      // Update linked client PO drawdown
      const nextClientPos = prev.clientPos.map(cpo => {
        if (cpo.poNumber === newInv.linkedPo) {
          const nextInvoiced = cpo.invoicedNative + newInv.amountNative;
          const pct = Math.min(100, Math.round((nextInvoiced / cpo.totalValueNative) * 100));
          const remaining = Math.max(0, cpo.totalValueNative - nextInvoiced);
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

      return {
        ...prev,
        invoices: [newInv, ...prev.invoices],
        clientPos: nextClientPos,
        kpis: {
          ...prev.kpis,
          invoicedTotal: prev.kpis.invoicedTotal + newInv.amountUsd,
          arOutstanding: prev.kpis.arOutstanding + newInv.amountUsd
        }
      };
    });
    addToast(`Client Invoice ${newInv.invoiceNumber} generated!`, 'success');
  };

  const handleVerifyMatch = (result) => {
    setData(prev => {
      const nextSupplierPos = prev.supplierPos.map(spo => {
        if (spo.poNumber === result.poNumber) {
          return {
            ...spo,
            billedUsd: spo.billedUsd + result.amount,
            remainingUsd: Math.max(0, spo.remainingUsd - result.amount),
            status: '3-Way Match Verified'
          };
        }
        return spo;
      });

      return {
        ...prev,
        supplierPos: nextSupplierPos
      };
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

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6">
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
            Consolidated multi-entity treasury, client PO drawdowns, cost-mapped procurement, and 3-way match ledger
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setRegisterClientPoOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">add_task</span>
            <span>+ Client PO</span>
          </button>

          <button
            onClick={() => setIssueSupplierPoOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">shopping_cart_checkout</span>
            <span>+ Supplier PO</span>
          </button>

          <button
            onClick={() => setGenerateInvoiceOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">flash_on</span>
            <span>Auto-Gen Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Suite Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview / Executive', icon: 'dashboard' },
          { id: 'projects', label: 'Projects Financials', icon: 'account_tree' },
          { id: 'client-pos', label: 'Client POs & Invoicing', icon: 'request_quote' },
          { id: 'supplier-pos', label: 'Supplier Procurement (AP)', icon: 'shopping_cart_checkout' },
          { id: 'vault', label: 'Master Data & Vault', icon: 'corporate_fare' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 rounded-t-xl'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Render Active Tab */}
      <div>
        {activeTab === 'overview' && (
          <FinanceOverview
            kpis={data.kpis}
            exchangeRates={data.exchangeRates}
            projects={data.projects}
            clientPos={data.clientPos}
            supplierPos={data.supplierPos}
            onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
            onOpenIssueSupplierPo={() => setIssueSupplierPoOpen(true)}
            onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
            onViewSampleInvoice={openSampleInvoice}
          />
        )}

        {activeTab === 'projects' && (
          <FinanceProjects
            projects={data.projects}
            exchangeRates={data.exchangeRates}
          />
        )}

        {activeTab === 'client-pos' && (
          <FinanceClientPOs
            clientPos={data.clientPos}
            invoices={data.invoices}
            onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
            onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
            onViewSampleInvoice={openSampleInvoice}
          />
        )}

        {activeTab === 'supplier-pos' && (
          <FinanceSupplierPOs
            supplierPos={data.supplierPos}
            onOpenIssueSupplierPo={() => setIssueSupplierPoOpen(true)}
            onOpenThreeWayMatch={openThreeWayMatch}
            onViewSampleSupplierPo={openSampleSupplierPo}
          />
        )}

        {activeTab === 'vault' && (
          <FinanceMasterVault
            masterDirectory={data.masterDirectory}
            vaultDocs={data.vault}
            exchangeRates={data.exchangeRates}
          />
        )}
      </div>

      {/* Modals */}
      <RegisterClientPOModal
        isOpen={registerClientPoOpen}
        onClose={() => setRegisterClientPoOpen(false)}
        onSave={handleSaveClientPo}
        clients={data.masterDirectory.filter(d => d.category === 'Client')}
      />

      <IssueSupplierPOModal
        isOpen={issueSupplierPoOpen}
        onClose={() => setIssueSupplierPoOpen(false)}
        onSave={handleSaveSupplierPo}
        projects={data.projects}
        vendors={data.masterDirectory.filter(d => d.category === 'Supplier')}
      />

      <GenerateInvoiceModal
        isOpen={generateInvoiceOpen}
        onClose={() => setGenerateInvoiceOpen(false)}
        onSave={handleSaveInvoice}
        clientPos={data.clientPos}
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
    </div>
  );
};

export default Finance;
