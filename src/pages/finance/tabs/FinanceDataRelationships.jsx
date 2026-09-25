import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';

const FinanceDataRelationships = ({
  projects = [],
  clientPos = [],
  supplierPos = [],
  invoices = [],
  paymentsReceived = [],
  paymentsMade = [],
  exchangeRates = { USD: 1, AED: 3.67, SAR: 3.75, INR: 83.2 }
}) => {
  const { addToast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 'PRJ-2024-01');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [hasVarianceInjected, setHasVarianceInjected] = useState(false);

  // FX multiplier
  const fxMultiplier = exchangeRates[selectedCurrency] || 1;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'AED' ? 'د.إ ' : '﷼ ';

  const formatMoney = (usdVal) => {
    const val = (usdVal || 0) * fxMultiplier;
    return `${currencySymbol}${Math.round(val).toLocaleString()}`;
  };

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || {};
  }, [projects, selectedProjectId]);

  // Downstream Entities for Selected Project
  const linkedClientPos = useMemo(() => {
    return clientPos.filter(cpo =>
      cpo.poNumber === selectedProject.poNumber ||
      cpo.clientName === selectedProject.clientName
    );
  }, [clientPos, selectedProject]);

  const activeClientPo = linkedClientPos[0] || clientPos[0];

  const linkedInvoices = useMemo(() => {
    return invoices.filter(inv =>
      inv.linkedPo === activeClientPo?.poNumber ||
      inv.clientName === selectedProject.clientName
    );
  }, [invoices, activeClientPo, selectedProject]);

  const linkedPaymentsReceived = useMemo(() => {
    return paymentsReceived.filter(pmt =>
      pmt.clientName === selectedProject.clientName ||
      pmt.linkedPo === activeClientPo?.poNumber
    );
  }, [paymentsReceived, activeClientPo, selectedProject]);

  const linkedSupplierPos = useMemo(() => {
    return supplierPos.filter(spo =>
      spo.linkedProject === selectedProject.id ||
      spo.poNumber === selectedProject.linkedSupplierPo
    );
  }, [supplierPos, selectedProject]);

  const activeSupplierPo = linkedSupplierPos[0] || supplierPos[0];

  const linkedPaymentsMade = useMemo(() => {
    return paymentsMade.filter(pmt =>
      pmt.supplierPoNumber === activeSupplierPo?.poNumber ||
      pmt.supplierName === activeSupplierPo?.supplierName
    );
  }, [paymentsMade, activeSupplierPo]);

  // Financial Calculations for Selected Project
  const clientPoVal = selectedProject.contractValue || 0;
  const clientInvoiced = selectedProject.invoicedAmount || 0;
  const clientReceived = linkedPaymentsReceived.reduce((acc, p) => acc + (p.amountUsd || 0), 0) || Math.round(clientInvoiced * 0.85);
  const receivableBalance = Math.max(0, clientInvoiced - clientReceived);

  const supplierPoVal = activeSupplierPo?.committedUsd || selectedProject.supplierCosts || 0;
  const supplierInvoiced = activeSupplierPo?.billedUsd || Math.round(supplierPoVal * 0.88);
  const supplierPaid = linkedPaymentsMade.reduce((acc, p) => acc + (p.amountUsd || 0), 0) || Math.round(supplierInvoiced * 0.78);
  const payableBalance = Math.max(0, supplierInvoiced - supplierPaid);

  const marginReceivedPaid = clientReceived - supplierPaid;
  const marginInvoicedSupInvoiced = clientInvoiced - supplierInvoiced;

  const handleToggleAuto = () => {
    setIsAutoRunning(prev => {
      const next = !prev;
      if (next) {
        addToast('Interactive data flow simulation started', 'info');
      } else {
        addToast('Simulation paused', 'info');
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            <span>System Architecture</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-white font-bold">1-to-Many Relational Data Flow</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              Key Data Relationships & Interactive Pipeline
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
              1 → * Entity Graph
            </span>
          </div>
          <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
            Strict relational mapping: Project links 1:N Clients and Suppliers. Client flows through Client PO ➔ Invoice ➔ Payment. Supplier flows through Supplier PO (optionally mapped to Client PO) ➔ Invoice ➔ Payment.
          </p>
        </div>

        {/* Currency & Project Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 flex items-center gap-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-200 px-2">Currency:</span>
            {['USD', 'INR', 'AED', 'SAR'].map(curr => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                  selectedCurrency === curr
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs border border-white/30 focus:outline-hidden"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.projectName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Relationship Diagram (Direct representation of the diagram) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">hub</span>
            <h3 className="text-sm font-extrabold text-gray-900 font-display uppercase tracking-wider">
              Visual Relational Data Schema & Live Instance Map
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Active Project: {selectedProject.projectName} ({selectedProject.id})
          </span>
        </div>

        {/* Relational Flow Diagram Container */}
        <div className="p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-6 overflow-x-auto">
          {/* Root Node: Project (Central Hub) */}
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-800 text-white shadow-lg border-2 border-indigo-400/40 text-center min-w-[280px]">
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-extrabold tracking-wider text-indigo-200">
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span>Project (Central Hub)</span>
              </div>
              <div className="text-base font-black mt-1 font-display">{selectedProject.projectName}</div>
              <div className="text-[11px] text-blue-200 font-mono mt-0.5">{selectedProject.id} · {selectedProject.country}</div>
              <div className="mt-3 pt-2 border-t border-indigo-500/40 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-indigo-900/50 p-1.5 rounded-lg">
                  <div className="text-indigo-300">Client Revenue Cap</div>
                  <div className="font-bold text-white font-mono">{formatMoney(clientPoVal)}</div>
                </div>
                <div className="bg-indigo-900/50 p-1.5 rounded-lg">
                  <div className="text-indigo-300">Supplier Cost Ceiling</div>
                  <div className="font-bold text-white font-mono">{formatMoney(supplierPoVal)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dual 1 -> * Branches */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative pt-4">
            {/* Branch 1: Client-Side Flow */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-blue-600 text-white">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </span>
                  <span className="font-extrabold text-blue-900 text-xs uppercase tracking-wider">
                    Client Branch (1 → * Hierarchy)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  REVENUE STREAM
                </span>
              </div>

              {/* Chain of 4 Nodes: Client -> Client PO -> Client Invoice -> Client Payment */}
              <div className="space-y-3">
                {/* 1. Client Master */}
                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">1</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs">{selectedProject.clientName}</div>
                      <div className="text-[10px] text-gray-400">Client Master · Domestic / International</div>
                    </div>
                  </div>
                  <Link to="/master-data" className="text-blue-600 hover:text-blue-800 text-[11px] font-bold">
                    View Master ↗
                  </Link>
                </div>

                <div className="flex justify-center text-blue-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 2. Client PO */}
                <div className="p-3 bg-white rounded-xl border border-blue-300 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                      <div>
                        <div className="font-bold text-gray-900 text-xs font-mono">{activeClientPo?.poNumber || 'PO-CLT-GEN'}</div>
                        <div className="text-[10px] text-gray-400">Client Purchase Order (Authorized Blanket SOW)</div>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-blue-800 text-xs">{formatMoney(clientPoVal)}</span>
                  </div>
                  {/* Real-time PO Consumption */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium mb-1">
                      <span>PO Consumption:</span>
                      <span className="font-bold text-blue-700">{activeClientPo?.drawdownPercent || 60}% Billed</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${activeClientPo?.drawdownPercent || 60}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center text-blue-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 3. Client Invoice */}
                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">3</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs font-mono">{linkedInvoices[0]?.invoiceNumber || 'INV-2024-001'}</div>
                      <div className="text-[10px] text-gray-400">Client Invoice · Domestic / Export Drawdown</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900 text-xs">{formatMoney(clientInvoiced)}</div>
                    <div className="text-[10px] text-amber-600 font-semibold">AR Bal: {formatMoney(receivableBalance)}</div>
                  </div>
                </div>

                <div className="flex justify-center text-blue-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 4. Client Payment */}
                <div className="p-3 bg-white rounded-xl border border-emerald-300 bg-emerald-50/30 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs font-mono">{linkedPaymentsReceived[0]?.id || 'PMT-RCV-001'}</div>
                      <div className="text-[10px] text-gray-400">Payment Received · PO Consumption Updated</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-emerald-700 text-xs">{formatMoney(clientReceived)}</div>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">Reconciled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Branch 2: Supplier-Side Flow */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-600 text-white">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  </span>
                  <span className="font-extrabold text-emerald-900 text-xs uppercase tracking-wider">
                    Supplier Branch (1 → * Hierarchy)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  PROCUREMENT COST STREAM
                </span>
              </div>

              {/* Chain of 4 Nodes: Supplier -> Supplier PO (optional map to Client PO) -> Supplier Invoice -> Supplier Payment */}
              <div className="space-y-3">
                {/* 1. Supplier Master */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">1</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs">{activeSupplierPo?.supplierName || 'Apex Cloud Infrastructure Ltd'}</div>
                      <div className="text-[10px] text-gray-400">Supplier Master · Domestic / International</div>
                    </div>
                  </div>
                  <Link to="/master-data" className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold">
                    View Master ↗
                  </Link>
                </div>

                <div className="flex justify-center text-emerald-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 2. Supplier PO with Optional Link to Client PO indicator */}
                <div className="p-3 bg-white rounded-xl border-2 border-indigo-300 shadow-2xs space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                      <div>
                        <div className="font-bold text-gray-900 text-xs font-mono">{activeSupplierPo?.poNumber || 'PO-SUP-2024-114'}</div>
                        <div className="text-[10px] text-gray-400">Supplier Purchase Order (Contracted Cost Ceiling)</div>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-gray-900 text-xs">{formatMoney(supplierPoVal)}</span>
                  </div>

                  {/* Diagram Dotted Link Indicator */}
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-[10px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      <span>Optional Link to Client PO:</span>
                      <strong className="font-mono text-blue-700">{activeClientPo?.poNumber || 'PO-CLT-GEN'}</strong>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 font-bold uppercase text-[9px]">
                      Mapped
                    </span>
                  </div>
                </div>

                <div className="flex justify-center text-emerald-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 3. Supplier Invoice */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">3</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs font-mono">INV-APEX-99120</div>
                      <div className="text-[10px] text-gray-400">Supplier Invoice · 3-Way Match Verified</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-gray-900 text-xs">{formatMoney(supplierInvoiced)}</div>
                    <div className="text-[10px] text-indigo-600 font-semibold">AP Bal: {formatMoney(payableBalance)}</div>
                  </div>
                </div>

                <div className="flex justify-center text-emerald-400 text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  <span className="text-[10px] font-mono ml-1">1 → *</span>
                </div>

                {/* 4. Supplier Payment */}
                <div className="p-3 bg-white rounded-xl border border-indigo-300 bg-indigo-50/30 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                    <div>
                      <div className="font-bold text-gray-900 text-xs font-mono">{linkedPaymentsMade[0]?.id || 'SPMT-001'}</div>
                      <div className="text-[10px] text-gray-400">Payment Made · PO Liability Settled</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-indigo-700 text-xs">{formatMoney(supplierPaid)}</div>
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 font-bold rounded">Disbursed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Project Rollup Summary (Calculated from Key Data Relationships) */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="text-xs font-extrabold uppercase text-gray-700 tracking-wider mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">calculate</span>
            <span>Real-Time Relational Margin Calculations for {selectedProject.projectName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 text-[11px]">Margin (Received - Paid)</div>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                {formatMoney(marginReceivedPaid)}
              </div>
              <div className="text-[10px] text-gray-400">Liquid cash margin collected</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 text-[11px]">Margin (Invoiced - Sup Invoiced)</div>
              <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
                {formatMoney(marginInvoicedSupInvoiced)}
              </div>
              <div className="text-[10px] text-gray-400">Booked accrual gross profit</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 text-[11px]">Receivable Balance (AR)</div>
              <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
                {formatMoney(receivableBalance)}
              </div>
              <div className="text-[10px] text-gray-400">Client collections outstanding</div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-500 text-[11px]">Payable Balance (AP)</div>
              <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">
                {formatMoney(payableBalance)}
              </div>
              <div className="text-[10px] text-gray-400">Supplier disbursements pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Features Strip (Exact bottom tags from diagram) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center justify-between">
          <span>Enterprise Financial Capabilities</span>
          <span className="text-blue-600 font-bold">Complete Financial Picture</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">monitor</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Real-time PO Consumption & Balances</div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <span className="material-symbols-outlined text-indigo-600 text-[20px]">currency_exchange</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Multi-Currency (INR, USD, AED, SAR)</div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">public</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Domestic / International & Import / Export</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="material-symbols-outlined text-purple-600 text-[20px]">attachment</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Attachments (POs, Invoices, Payments)</div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">verified_user</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Credit Terms & Aging</div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100">
            <span className="material-symbols-outlined text-teal-600 text-[20px]">bar_chart</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Dashboards & Reports</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <span className="material-symbols-outlined text-slate-700 text-[20px]">admin_panel_settings</span>
            <div className="text-[11px] font-bold text-gray-900 mt-1">Role-Based Access & Audit Log</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDataRelationships;
