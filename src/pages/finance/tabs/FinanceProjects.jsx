import React, { useState, useMemo } from 'react';

const FinanceProjects = ({
  projects = [],
  exchangeRates = { USD: 1, AED: 3.67, SAR: 3.75, INR: 83.2 },
  onOpenCreateProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [currencyMode, setCurrencyMode] = useState('USD'); // 'USD' | 'INR' | 'AED' | 'SAR'
  const [expandedProjectId, setExpandedProjectId] = useState(projects[0]?.id || null);

  // FX Rate helper
  const fxMultiplier = exchangeRates[currencyMode] || 1;
  const currencySymbol = currencyMode === 'USD' ? '$' : currencyMode === 'INR' ? '₹' : currencyMode === 'AED' ? 'د.إ ' : '﷼ ';

  const formatMoney = (usdVal) => {
    const converted = (usdVal || 0) * fxMultiplier;
    return `${currencySymbol}${Math.round(converted).toLocaleString()}`;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchUnit = unitFilter === 'ALL' || p.unit === unitFilter;
      return matchSearch && matchStatus && matchUnit;
    });
  }, [projects, searchTerm, statusFilter, unitFilter]);

  // Rollup Aggregations (Diagram Center Box)
  // 1. Client PO value / invoiced / received
  const totalClientPoValueUsd = useMemo(() => projects.reduce((acc, p) => acc + (p.contractValue || 0), 0), [projects]);
  const totalClientInvoicedUsd = useMemo(() => projects.reduce((acc, p) => acc + (p.invoicedAmount || 0), 0), [projects]);
  const totalClientReceivedUsd = useMemo(() => Math.round(totalClientInvoicedUsd * 0.85), [totalClientInvoicedUsd]);
  const totalReceivableBalanceUsd = totalClientInvoicedUsd - totalClientReceivedUsd;

  // 2. Supplier PO value / invoiced / paid
  const totalSupplierPoValueUsd = useMemo(() => projects.reduce((acc, p) => acc + (p.supplierCosts || 0), 0), [projects]);
  const totalSupplierInvoicedUsd = useMemo(() => Math.round(totalSupplierPoValueUsd * 0.88), [totalSupplierPoValueUsd]);
  const totalSupplierPaidUsd = useMemo(() => Math.round(totalSupplierInvoicedUsd * 0.78), [totalSupplierInvoicedUsd]);
  const totalPayableBalanceUsd = totalSupplierInvoicedUsd - totalSupplierPaidUsd;

  // 3. Margin (received - paid)
  const marginReceivedMinusPaidUsd = totalClientReceivedUsd - totalSupplierPaidUsd;
  const marginReceivedMinusPaidPct = totalClientReceivedUsd > 0 ? ((marginReceivedMinusPaidUsd / totalClientReceivedUsd) * 100).toFixed(1) : '0';

  // 4. Margin (invoiced - supplier-invoiced)
  const marginInvoicedMinusSupInvoicedUsd = totalClientInvoicedUsd - totalSupplierInvoicedUsd;
  const marginInvoicedMinusSupInvoicedPct = totalClientInvoicedUsd > 0 ? ((marginInvoicedMinusSupInvoicedUsd / totalClientInvoicedUsd) * 100).toFixed(1) : '0';

  // 5. Outstanding exposure (Net AR/AP and committed risk)
  const totalExposureUsd = totalReceivableBalanceUsd + totalPayableBalanceUsd;

  const toggleExpand = (id) => {
    setExpandedProjectId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Workflow Step Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            <span>Central Hub</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-white font-bold">Financial Visibility Architecture</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              Project: Central Hub for Financial Visibility
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
              Dual-Sided Rollup
            </span>
          </div>
          <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
            Projects serve as the single source of truth linking Client POs to downstream Supplier POs, computing real-time margins (received - paid & invoiced - supplier-invoiced) with multi-currency conversion.
          </p>
        </div>

        {/* Currency Switcher & Setup Project CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Multi-Currency View Selector (INR, USD, AED, SAR) */}
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15 flex items-center gap-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-200 px-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">currency_exchange</span>
              <span>Currency:</span>
            </span>
            {['USD', 'INR', 'AED', 'SAR'].map(curr => (
              <button
                key={curr}
                onClick={() => setCurrencyMode(curr)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                  currencyMode === curr
                    ? 'bg-white text-blue-900 shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95 border border-blue-400/40"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Project Setup</span>
          </button>
        </div>
      </div>

      {/* Project Dashboard & Rollup (Directly from Center Box of Diagram) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">analytics</span>
            <h3 className="text-sm font-extrabold text-gray-900 font-display uppercase tracking-wider">
              Project Dashboard & Rollup Metrics ({currencyMode} View)
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            Real-time multi-project aggregation across {projects.length} linked master projects
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Rollup Metric 1: Client PO Rollup */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-blue-900 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Client PO Rollup</span>
                <span className="material-symbols-outlined text-[18px] text-blue-600">person</span>
              </div>
              <div className="text-xl font-black text-gray-900 font-display">
                {formatMoney(totalClientPoValueUsd)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 space-y-0.5 font-medium">
                <div className="flex justify-between">
                  <span>Invoiced:</span>
                  <span className="font-bold text-blue-700">{formatMoney(totalClientInvoicedUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received:</span>
                  <span className="font-bold text-emerald-700">{formatMoney(totalClientReceivedUsd)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200/50 text-[10px] text-blue-800 font-bold flex justify-between">
              <span>Receivable (AR):</span>
              <span className="font-mono">{formatMoney(totalReceivableBalanceUsd)}</span>
            </div>
          </div>

          {/* Rollup Metric 2: Supplier PO Rollup */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-indigo-900 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Supplier PO Rollup</span>
                <span className="material-symbols-outlined text-[18px] text-indigo-600">local_shipping</span>
              </div>
              <div className="text-xl font-black text-gray-900 font-display">
                {formatMoney(totalSupplierPoValueUsd)}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 space-y-0.5 font-medium">
                <div className="flex justify-between">
                  <span>Invoiced:</span>
                  <span className="font-bold text-gray-800">{formatMoney(totalSupplierInvoicedUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span className="font-bold text-emerald-700">{formatMoney(totalSupplierPaidUsd)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-indigo-200/50 text-[10px] text-indigo-800 font-bold flex justify-between">
              <span>Payable (AP):</span>
              <span className="font-mono">{formatMoney(totalPayableBalanceUsd)}</span>
            </div>
          </div>

          {/* Rollup Metric 3: Margin (Received - Paid) */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-emerald-900 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Margin (Received - Paid)</span>
                <span className="material-symbols-outlined text-[18px] text-emerald-600">payments</span>
              </div>
              <div className="text-xl font-black text-emerald-700 font-display">
                {formatMoney(marginReceivedMinusPaidUsd)}
              </div>
              <div className="text-[11px] text-emerald-800 font-bold mt-1">
                {marginReceivedMinusPaidPct}% Cash Margin
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Realized cash collected minus cash paid to suppliers
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              <span>Fully Liquid Margin</span>
            </div>
          </div>

          {/* Rollup Metric 4: Margin (Invoiced - Supplier-Invoiced) */}
          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-teal-900 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Margin (Inv - Sup Inv)</span>
                <span className="material-symbols-outlined text-[18px] text-teal-600">receipt_long</span>
              </div>
              <div className="text-xl font-black text-teal-800 font-display">
                {formatMoney(marginInvoicedMinusSupInvoicedUsd)}
              </div>
              <div className="text-[11px] text-teal-800 font-bold mt-1">
                {marginInvoicedMinusSupInvoicedPct}% Booked Margin
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Accrual basis: client billing minus supplier bills received
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-teal-200/60 text-[10px] text-teal-700 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">trending_up</span>
              <span>Earned Performance</span>
            </div>
          </div>

          {/* Rollup Metric 5: Outstanding Exposure */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-amber-900 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Outstanding Exposure</span>
                <span className="material-symbols-outlined text-[18px] text-amber-600">balance</span>
              </div>
              <div className="text-xl font-black text-amber-900 font-display">
                {formatMoney(totalExposureUsd)}
              </div>
              <div className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>AR At Risk:</span>
                  <span className="font-bold text-amber-800">{formatMoney(totalReceivableBalanceUsd)}</span>
                </div>
                <div className="flex justify-between">
                  <span>AP Due:</span>
                  <span className="font-bold text-gray-800">{formatMoney(totalPayableBalanceUsd)}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-amber-800 font-bold flex justify-between">
              <span>Risk Status:</span>
              <span className="text-emerald-700">Covered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search projects, client POs, or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold">
            {['ALL', 'Healthy', 'Margin Risk', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-white text-gray-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreateProject}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ml-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Setup Project</span>
          </button>
        </div>
      </div>

      {/* Projects Master Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Project Master Financial Directory</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Click any project to inspect the dual-sided Project Financial View (Client Side vs. Supplier Side)
            </p>
          </div>
          <span className="text-[11px] text-gray-500">
            Showing {filteredProjects.length} Projects ({currencyMode} rates applied)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Project & Code</th>
                <th className="py-3 px-4">Client & Geography</th>
                <th className="py-3 px-4 text-right">Client PO Value</th>
                <th className="py-3 px-4 text-right">Invoiced (% Billed)</th>
                <th className="py-3 px-4 text-right">Supplier PO Costs</th>
                <th className="py-3 px-4 text-right">Gross Margin</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Dual Financial View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProjects.map((p) => {
                const isExpanded = expandedProjectId === p.id;
                const clientPoVal = p.contractValue || 0;
                const clientInvoiced = p.invoicedAmount || 0;
                const clientReceived = Math.round(clientInvoiced * 0.85);
                const receivableBalance = clientInvoiced - clientReceived;
                const supplierCommitted = p.supplierCosts || 0;
                const supplierInvoiced = Math.round(supplierCommitted * 0.88);
                const supplierPaid = Math.round(supplierInvoiced * 0.78);
                const payableBalance = supplierInvoiced - supplierPaid;
                const marginContribution = clientInvoiced - supplierInvoiced;
                const costToProject = supplierCommitted + (p.laborCosts || 0);

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => toggleExpand(p.id)}
                      className={`cursor-pointer transition ${
                        isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                          <div>
                            <span className="block truncate max-w-xs">{p.projectName}</span>
                            <span className="font-mono text-gray-400 text-[10px] block">{p.id} · {p.unit}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{p.clientName}</span>
                        <span className="text-gray-400 text-[11px] block">{p.country}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                        {formatMoney(clientPoVal)}
                        {currencyMode !== 'USD' && (
                          <span className="text-[10px] text-gray-400 block font-normal font-sans">
                            USD ${clientPoVal.toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-indigo-600 block">{formatMoney(clientInvoiced)}</span>
                        <span className="text-gray-400 text-[10px] block">{p.invoicedPercent}% Billed</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-gray-800 block">{formatMoney(supplierCommitted)}</span>
                        <span className="text-gray-400 text-[10px] block">Labor: {formatMoney(p.laborCosts || 0)}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-emerald-600 block">{formatMoney(p.grossMargin)}</span>
                        <span className="text-emerald-700 font-bold text-[10px] block">{p.grossMarginPercent}% Margin</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Healthy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.status === 'Margin Risk'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isExpanded ? 'visibility_off' : 'visibility'}
                          </span>
                          <span>{isExpanded ? 'Hide View' : 'Inspect View'}</span>
                        </button>
                      </td>
                    </tr>

                    {/* Dual-Sided Project Financial View (Expanded) - Exact match to diagram */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-4 bg-gray-50/90 border-b border-gray-200">
                          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
                            {/* Card Header & Setup Linkages */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-gray-900 text-sm font-display flex items-center gap-2">
                                    <span>Project Financial View: {p.projectName}</span>
                                    <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                      {p.id}
                                    </span>
                                  </h4>
                                  <p className="text-[11px] text-gray-500">
                                    Central financial hub dual-sided rollup: Client revenue stream vs. Supplier procurement cost
                                  </p>
                                </div>
                              </div>

                              {/* Linkages to Client PO and Supplier PO */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 font-semibold flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">link</span>
                                  <span>Client PO:</span>
                                  <strong className="font-mono">{p.poNumber || 'PO-CLT-GEN'}</strong>
                                </span>
                                {p.linkedSupplierPo ? (
                                  <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-semibold flex items-center gap-1" title="Supplier PO optionally mapped to Client PO">
                                    <span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span>
                                    <span>Supplier PO:</span>
                                    <strong className="font-mono">{p.linkedSupplierPo}</strong>
                                    <span className="text-[9px] bg-indigo-200 text-indigo-900 px-1 py-0.2 rounded font-bold">Mapped</span>
                                  </span>
                                ) : (
                                  <span className="p-1.5 rounded-lg bg-gray-100 text-gray-500 font-medium">
                                    No Supplier PO Mapped
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dual Side Columns: Client Side vs Supplier Side (Diagram layout) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Left Column: Client Side */}
                              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200/60 pb-2">
                                  <span className="flex items-center gap-1.5 text-sm">
                                    <span className="material-symbols-outlined text-[18px] text-blue-600">person</span>
                                    <span>Client Side (Revenue)</span>
                                  </span>
                                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-mono font-bold">
                                    RECEIVABLES
                                  </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Invoiced:</span>
                                    </span>
                                    <span className="font-bold text-blue-800 font-mono text-sm">
                                      {formatMoney(clientInvoiced)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Received:</span>
                                    </span>
                                    <span className="font-bold text-emerald-700 font-mono text-sm">
                                      {formatMoney(clientReceived)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Receivable Balance:</span>
                                    </span>
                                    <span className="font-bold text-amber-700 font-mono text-sm">
                                      {formatMoney(receivableBalance)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center pt-2 border-t border-blue-200/80">
                                    <span className="text-gray-800 font-bold flex items-center gap-1">
                                      <span>• Margin Contribution:</span>
                                    </span>
                                    <span className="font-extrabold text-emerald-800 font-mono text-sm">
                                      {formatMoney(marginContribution)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Column: Supplier Side */}
                              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-indigo-900 border-b border-indigo-200/60 pb-2">
                                  <span className="flex items-center gap-1.5 text-sm">
                                    <span className="material-symbols-outlined text-[18px] text-indigo-600">local_shipping</span>
                                    <span>Supplier Side (Cost)</span>
                                  </span>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono font-bold">
                                    PAYABLES
                                  </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Invoiced:</span>
                                    </span>
                                    <span className="font-bold text-gray-900 font-mono text-sm">
                                      {formatMoney(supplierInvoiced)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Paid:</span>
                                    </span>
                                    <span className="font-bold text-emerald-700 font-mono text-sm">
                                      {formatMoney(supplierPaid)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <span>• Payable Balance:</span>
                                    </span>
                                    <span className="font-bold text-gray-700 font-mono text-sm">
                                      {formatMoney(payableBalance)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center pt-2 border-t border-indigo-200/80">
                                    <span className="text-gray-800 font-bold flex items-center gap-1">
                                      <span>• Cost to Project:</span>
                                    </span>
                                    <span className="font-extrabold text-gray-900 font-mono text-sm">
                                      {formatMoney(costToProject)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceProjects;

