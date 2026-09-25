import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FinanceClientPOs = ({
  clientPos = [],
  invoices = [],
  paymentsReceived = [],
  onOpenRegisterClientPo,
  onOpenGenerateInvoice,
  onOpenRecordPayment,
  onViewSampleInvoice
}) => {
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('POS'); // 'POS' | 'INVOICES' | 'PAYMENTS'
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id) => {
    setExpandedPoId(prev => (prev === id ? null : id));
  };

  const filteredPos = clientPos.filter(cpo =>
    cpo.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cpo.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cpo.scope.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.linkedPo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = paymentsReceived.filter(pmt =>
    pmt.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Workflow Step Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            <span>Client-Side Architecture</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-white font-bold">From Proposal to Payment</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
              Client-Side Workflow
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
              Receivables Stream
            </span>
          </div>
          <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
            Strict sequential pipeline: Client Master setup ➔ Project Linking ➔ Client PO Contract Intake ➔ Tax Invoicing (Domestic/Export) ➔ Cash Collection & PO Consumption.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/master-data"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_search</span>
            <span>Step 1: Client Master</span>
          </Link>
          <Link
            to="/finance?tab=projects"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>Step 2: Link Project</span>
          </Link>
        </div>
      </div>

      {/* 5-Step Connected Flow Visualizer */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Step 1 */}
          <Link
            to="/master-data"
            className="p-3 rounded-xl bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">1</span>
              <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-blue-600">open_in_new</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-gray-900 group-hover:text-blue-700">Client Master</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Domestic / Int'l, Tax & Bank Details</div>
            </div>
          </Link>

          {/* Step 2 */}
          <Link
            to="/finance?tab=projects"
            className="p-3 rounded-xl bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">2</span>
              <span className="material-symbols-outlined text-[16px] text-gray-400 group-hover:text-blue-600">open_in_new</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-gray-900 group-hover:text-blue-700">Create Project</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Link client & configure SOW</div>
            </div>
          </Link>

          {/* Step 3 */}
          <button
            onClick={() => setActiveSubTab('POS')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSubTab === 'POS'
                ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400/30'
                : 'bg-gray-50 hover:bg-gray-100/80 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
              <span className="material-symbols-outlined text-[16px] text-blue-600">request_quote</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-gray-900">Client PO Intake</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">PO Consumption & Balances</div>
            </div>
          </button>

          {/* Step 4 */}
          <button
            onClick={() => setActiveSubTab('INVOICES')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSubTab === 'INVOICES'
                ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400/30'
                : 'bg-gray-50 hover:bg-gray-100/80 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">4</span>
              <span className="material-symbols-outlined text-[16px] text-indigo-600">receipt_long</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-gray-900">Client Invoice</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Domestic / Export Drawdown</div>
            </div>
          </button>

          {/* Step 5 */}
          <button
            onClick={() => setActiveSubTab('PAYMENTS')}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              activeSubTab === 'PAYMENTS'
                ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/30'
                : 'bg-gray-50 hover:bg-gray-100/80 border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">5</span>
              <span className="material-symbols-outlined text-[16px] text-emerald-600">payments</span>
            </div>
            <div className="mt-2">
              <div className="font-bold text-gray-900">Payment Received</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Cash Update & PO Consumption</div>
            </div>
          </button>
        </div>
      </div>

      {/* Top Action & Sub-tab Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold text-xs">
            <button
              onClick={() => setActiveSubTab('POS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'POS' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Step 3. Client PO Contracts ({clientPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'INVOICES' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Step 4. Client Tax Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'PAYMENTS' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Step 5. Payments Received ({paymentsReceived.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenRecordPayment}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Record Payment</span>
          </button>

          <button
            onClick={onOpenGenerateInvoice}
            className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-gray-50 text-gray-800 rounded-xl transition border border-gray-200 flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">flash_on</span>
            <span>Auto-Gen Invoice</span>
          </button>

          <button
            onClick={onOpenRegisterClientPo}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add_task</span>
            <span>+ Register Client PO</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Client POs Table */}
      {activeSubTab === 'POS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Client Purchase Order Master Registry</h3>
              <p className="text-xs text-gray-400 mt-0.5">Authoritative SOW caps, currency schedules, and real-time drawdown utilization</p>
            </div>
            <span className="text-[11px] text-gray-500">
              Click row to expand milestone drawdown schedule
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client PO #</th>
                  <th className="py-3 px-4">Client Account</th>
                  <th className="py-3 px-4">SOW / Project Scope</th>
                  <th className="py-3 px-4 text-right">Total PO Value</th>
                  <th className="py-3 px-4 text-right">Invoiced & Drawdown</th>
                  <th className="py-3 px-4 text-right">Remaining Cap</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredPos.map((cpo) => {
                  const isExpanded = expandedPoId === cpo.id;
                  return (
                    <React.Fragment key={cpo.id}>
                      <tr
                        onClick={() => toggleExpand(cpo.id)}
                        className={`cursor-pointer transition ${
                          isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <span>{cpo.poNumber}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{cpo.clientName}</span>
                          <span className="text-gray-400 text-[11px] block">{cpo.country} {cpo.flag}</span>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs truncate text-gray-700">
                          {cpo.scope}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                          ${cpo.totalValueUsd?.toLocaleString()}
                          {cpo.currency !== 'USD' && (
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {cpo.currency} {cpo.totalValueNative?.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-blue-700 font-mono">
                            ${cpo.currency === 'USD' ? cpo.invoicedNative?.toLocaleString() : Math.round(cpo.invoicedNative / (cpo.currency === 'AED' ? 3.67 : cpo.currency === 'SAR' ? 3.75 : 83.2)).toLocaleString()}
                          </div>
                          <div className="w-24 ml-auto h-1.5 rounded-full bg-gray-200 mt-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, cpo.drawdownPercent || 0)}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{cpo.drawdownPercent || 0}% Drawn</div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-700">
                          ${cpo.currency === 'USD' ? cpo.remainingNative?.toLocaleString() : Math.round(cpo.remainingNative / (cpo.currency === 'AED' ? 3.67 : cpo.currency === 'SAR' ? 3.75 : 83.2)).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cpo.status === 'Fully Invoiced'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {cpo.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenGenerateInvoice();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition"
                          >
                            + Invoice
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Milestones Drawdown Schedule */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-gray-50/70 border-b border-gray-200">
                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-blue-600">checklist</span>
                                  <span>Contract Drawdown Milestones ({cpo.poNumber})</span>
                                </span>
                                <span className="text-gray-400 font-mono text-[11px]">Terms: {cpo.terms}</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(cpo.milestones || []).map((m, idx) => (
                                  <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                                    <div>
                                      <div className="font-semibold text-gray-900">{m.name}</div>
                                      <div className="text-[11px] text-gray-400 font-mono">
                                        {cpo.currency} {m.amount?.toLocaleString()} {m.invNum && `· Billed on ${m.invNum}`}
                                      </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      m.status === 'Paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : m.status === 'Billed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {m.status}
                                    </span>
                                  </div>
                                ))}
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
      )}

      {/* Sub-tab 2: Client Invoices Table */}
      {activeSubTab === 'INVOICES' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Client Tax Invoice & Billing Register</h3>
              <p className="text-xs text-gray-400 mt-0.5">Raised drawdown invoices with domestic vs export classifications and settlement statuses</p>
            </div>
            <button
              onClick={onOpenGenerateInvoice}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
            >
              + Generate Invoice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-4">Client & Linked PO</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoiced Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-blue-700 block">{inv.invoiceNumber}</span>
                      <span className="text-gray-400 text-[10px] block">{inv.issueDate}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{inv.clientName}</span>
                      <span className="font-mono text-gray-400 text-[10px] block">PO: {inv.linkedPo}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        inv.country.includes('USA') || inv.country.includes('UAE') || inv.country.includes('KSA')
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {inv.country.includes('USA') || inv.country.includes('UAE') || inv.country.includes('KSA') ? 'Export / Cross-Border' : 'Domestic'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {inv.dueDate}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                      ${inv.amountUsd?.toLocaleString()}
                      {inv.currency !== 'USD' && (
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {inv.currency} {inv.amountNative?.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold font-mono text-amber-700">
                      ${(inv.balanceUsd || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewSampleInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition flex items-center gap-1"
                          title="View Tax Invoice Sample Format"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>View Doc</span>
                        </button>

                        {inv.status !== 'Paid' && (
                          <button
                            type="button"
                            onClick={onOpenRecordPayment}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Payments Received Table */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Client Cash Collections & Payments Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Verified payment receipts updating PO consumption and bank reconciliations</p>
            </div>
            <button
              onClick={onOpenRecordPayment}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>+ Record Payment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Payment ID & Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Invoice & Linked PO</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-gray-900 block">{pmt.id}</span>
                      <span className="text-gray-400 text-[10px] block">{pmt.date}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {pmt.clientName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-blue-700 font-semibold block">{pmt.invoiceNumber}</span>
                      <span className="font-mono text-gray-400 text-[10px] block">{pmt.linkedPo}</span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-700">
                      {pmt.mode}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-800">
                      {pmt.reference}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                      ${pmt.amountUsd?.toLocaleString()}
                      {pmt.currency !== 'USD' && (
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {pmt.currency} {pmt.amountNative?.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pmt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceClientPOs;
