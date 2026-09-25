import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loadFinanceData, saveFinanceData, subscribeFinanceData } from './financeData';

// Tab Components
import FinanceProjects from './tabs/FinanceProjects';
import FinanceClientPOs from './tabs/FinanceClientPOs';
import FinanceSupplierPOs from './tabs/FinanceSupplierPOs';
import FinanceDataRelationships from './tabs/FinanceDataRelationships';
import FinanceOverview from './tabs/FinanceOverview';
import FinanceSimulationPOC from './tabs/FinanceSimulationPOC';

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

export const Finance = () => {
  const { user, isAdmin, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redirect non-admin users immediately
  if (!loading && !isAdmin) {
    return <Navigate to={user ? `/employee/${user.id}` : '/login'} replace />;
  }

  // State loaded from localStorage or defaults
  const [data, setData] = useState(() => loadFinanceData());

  // Subscribe to real-time updates from Master Data or other tabs
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  // Canonical tabs according to flow of data:
  // 1. 'projects': Projects (Central Hub)
  // 2. 'client-workflow': Client-Side Workflow (PO -> Invoice -> Payment)
  // 3. 'supplier-workflow': Supplier-Side Workflow (PO -> Invoice -> Payment)
  // 4. 'relationships': Key Data Relationships (1 -> * Entity Graph)
  // 5. 'overview': Overview & Rollup (Treasury & Cash Velocity)
  const rawTab = searchParams.get('tab') || 'projects';
  
  // If someone accessed ?tab=vault, redirect them to the dedicated Master Data page
  useEffect(() => {
    if (rawTab === 'vault') {
      navigate('/master-data', { replace: true });
    }
  }, [rawTab, navigate]);

  const activeTab = 
    rawTab === 'client-pos' ? 'client-workflow' :
    rawTab === 'supplier-pos' ? 'supplier-workflow' :
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

  const handleRecordSupplierPayment = (newPayment, poNumber) => {
    setData(prev => {
      const nextSupplierPos = prev.supplierPos.map(spo => {
        if (spo.poNumber === poNumber) {
          return {
            ...spo,
            billedUsd: Math.max(0, spo.billedUsd - newPayment.amountUsd),
            status: 'Fulfilled'
          };
        }
        return spo;
      });

      const nextPaymentsMade = [newPayment, ...(prev.paymentsMade || [])];
      const nextData = {
        ...prev,
        supplierPos: nextSupplierPos,
        paymentsMade: nextPaymentsMade,
        kpis: {
          ...prev.kpis,
          supplierPaid: (prev.kpis.supplierPaid || 0) + newPayment.amountUsd,
          apOutstanding: Math.max(0, (prev.kpis.apOutstanding || 0) - newPayment.amountUsd)
        }
      };
      saveFinanceData(nextData);
      return nextData;
    });
    addToast(`Supplier payment of $${newPayment.amountUsd?.toLocaleString()} recorded for PO ${poNumber}!`, 'success');
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
          <button
            onClick={() => setCreateProjectOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
            <span>+ Setup Project</span>
          </button>

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

      {/* Main Suite Tabs Navigation (Ordered strictly by Flow of Data & Key Data Relationships) */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { id: 'projects', label: '1. Projects (Central Hub)', icon: 'account_tree', badge: 'Hub' },
          { id: 'client-workflow', label: '2. Client-Side Workflow', icon: 'request_quote', badge: 'Proposal to Payment' },
          { id: 'supplier-workflow', label: '3. Supplier-Side Workflow', icon: 'shopping_cart_checkout', badge: 'PO to Payment' },
          { id: 'relationships', label: '4. Key Data Relationships', icon: 'hub', badge: '1 → * Graph' },
          { id: 'overview', label: '5. Executive Rollup', icon: 'dashboard', badge: 'Treasury' },
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

      {/* Render Active Tab strictly following Data Flow */}
      <div>
        {activeTab === 'projects' && (
          <FinanceProjects
            projects={data.projects}
            exchangeRates={data.exchangeRates}
            onOpenCreateProject={() => setCreateProjectOpen(true)}
          />
        )}

        {activeTab === 'client-workflow' && (
          <FinanceClientPOs
            clientPos={data.clientPos}
            invoices={data.invoices}
            paymentsReceived={data.paymentsReceived || []}
            onOpenRegisterClientPo={() => setRegisterClientPoOpen(true)}
            onOpenGenerateInvoice={() => setGenerateInvoiceOpen(true)}
            onOpenRecordPayment={() => setRecordClientPaymentOpen(true)}
            onViewSampleInvoice={openSampleInvoice}
          />
        )}

        {activeTab === 'supplier-workflow' && (
          <FinanceSupplierPOs
            supplierPos={data.supplierPos}
            paymentsMade={data.paymentsMade || []}
            onOpenIssueSupplierPo={() => setIssueSupplierPoOpen(true)}
            onOpenThreeWayMatch={openThreeWayMatch}
            onOpenRecordSupplierPayment={() => setRecordSupplierPaymentOpen(true)}
            onViewSampleSupplierPo={openSampleSupplierPo}
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

      <RecordPaymentReceivedModal
        isOpen={recordClientPaymentOpen}
        onClose={() => setRecordClientPaymentOpen(false)}
        onSave={handleRecordClientPayment}
        invoices={data.invoices}
      />

      <RecordSupplierPaymentModal
        isOpen={recordSupplierPaymentOpen}
        onClose={() => setRecordSupplierPaymentOpen(false)}
        onSave={handleRecordSupplierPayment}
        supplierPos={data.supplierPos}
      />

      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onSave={handleSaveProject}
        clients={data.masterDirectory.filter(d => d.category === 'Client')}
        clientPos={data.clientPos}
        supplierPos={data.supplierPos}
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
