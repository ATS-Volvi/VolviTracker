import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { convertToUsd, calculateArAgeing } from '../financeCalcs';
import {
  exportInvoicesToSpreadsheet,
  exportClientPosToSpreadsheet,
  exportPaymentsReceivedToSpreadsheet,
  exportArAgeingToSpreadsheet
} from '../financeExports';

const FinanceClientPOs = ({
  clientPos = [],
  invoices = [],
  paymentsReceived = [],
  exchangeRates = {},
  activeSubTab: controlledTab,
  onTabChange,
  onOpenRegisterClientPo,
  onOpenGenerateInvoice,
  onOpenRecordPayment,
  onViewSampleInvoice,
  onDeletePayment,
  canManageFinance = true,
  onEditClientPo,
  onVoidClientPo,
  onEditInvoice,
  onVoidInvoice
}) => {
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [internalTab, setInternalTab] = useState('POS');
  const activeSubTab = controlledTab || internalTab;
  const setActiveSubTab = (tab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatementClient, setSelectedStatementClient] = useState('ALL');
  const [expandedInvId, setExpandedInvId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedPoId(prev => (prev === id ? null : id));
  };
  const toggleExpandInv = (id) => {
    setExpandedInvId(prev => (prev === id ? null : id));
  };

  const filteredPos = clientPos.filter(cpo =>
    cpo.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cpo.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cpo.scope.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [pagePo, setPagePo] = useState(1);
  const [pageSizePo, setPageSizePo] = useState(25);
  const totalPagesPo = Math.max(1, Math.ceil(filteredPos.length / pageSizePo));
  const paginatedPos = filteredPos.slice((pagePo - 1) * pageSizePo, pagePo * pageSizePo);

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.linkedPo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [pageInv, setPageInv] = useState(1);
  const [pageSizeInv, setPageSizeInv] = useState(25);
  const totalPagesInv = Math.max(1, Math.ceil(filteredInvoices.length / pageSizeInv));
  const paginatedInvoices = filteredInvoices.slice((pageInv - 1) * pageSizeInv, pageInv * pageSizeInv);

  const filteredPayments = paymentsReceived.filter(pmt =>
    pmt.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Distinct clients list for statements & ageing
  const allClients = Array.from(new Set([
    ...clientPos.map(c => c.clientName),
    ...invoices.map(i => i.clientName)
  ])).filter(Boolean);

  // AR Ageing Filter States
  const [arAsOfDate, setArAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [arClientFilter, setArClientFilter] = useState('ALL');

  // Real AR Ageing Report computed pure via calculateArAgeing
  const arAgeingReport = useMemo(() => {
    return calculateArAgeing(invoices, {
      asOfDate: arAsOfDate,
      clientFilter: arClientFilter
    });
  }, [invoices, arAsOfDate, arClientFilter]);

  const { summary: arSummary, byClient: arByClient, items: arItems } = arAgeingReport;

  return (
    <div className="space-y-6 text-left">
      {/* Top Action & Sub-tab Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold text-xs overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('POS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'POS' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client POs ({clientPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'INVOICES' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'PAYMENTS' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Receipts ({paymentsReceived.length})
            </button>
            <button
              onClick={() => setActiveSubTab('AGEING')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'AGEING' ? 'bg-white text-purple-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AR Ageing
            </button>
            <button
              onClick={() => setActiveSubTab('STATEMENTS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'STATEMENTS' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client Statements
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Export for Active Tab */}
          <div className="inline-flex rounded-xl shadow-2xs border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => {
                if (activeSubTab === 'POS') exportClientPosToSpreadsheet(filteredPos, 'xlsx');
                else if (activeSubTab === 'INVOICES') exportInvoicesToSpreadsheet(filteredInvoices, 'xlsx');
                else if (activeSubTab === 'PAYMENTS') exportPaymentsReceivedToSpreadsheet(filteredPayments, 'xlsx');
                else if (activeSubTab === 'AGEING') exportArAgeingToSpreadsheet(arAgeingReport, arAsOfDate, 'xlsx');
                else exportInvoicesToSpreadsheet(invoices, 'xlsx');
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition"
              title="Export active records as Excel (.XLSX)"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
              <span>Export .XLSX</span>
            </button>
            <button
              onClick={() => {
                if (activeSubTab === 'POS') exportClientPosToSpreadsheet(filteredPos, 'csv');
                else if (activeSubTab === 'INVOICES') exportInvoicesToSpreadsheet(filteredInvoices, 'csv');
                else if (activeSubTab === 'PAYMENTS') exportPaymentsReceivedToSpreadsheet(filteredPayments, 'csv');
                else if (activeSubTab === 'AGEING') exportArAgeingToSpreadsheet(arAgeingReport, arAsOfDate, 'csv');
                else exportInvoicesToSpreadsheet(invoices, 'csv');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition"
              title="Export active records as CSV"
            >
              .CSV
            </button>
          </div>

          {canManageFinance ? (
            <>
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
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs flex items-center gap-1.5 border border-slate-200">
              <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
              <span>Read-Only Access</span>
            </span>
          )}
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
                {paginatedPos.map((cpo) => {
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
                            ${Math.round(convertToUsd(cpo.invoicedNative, cpo.currency, exchangeRates)).toLocaleString()}
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
                          ${Math.round(convertToUsd(cpo.remainingNative, cpo.currency, exchangeRates)).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            cpo.status === 'Void' || cpo.isVoid
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : cpo.status === 'Fully Invoiced' || cpo.status === 'Fulfilled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {cpo.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canManageFinance && cpo.status !== 'Void' && !cpo.isVoid && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenGenerateInvoice && onOpenGenerateInvoice();
                                  }}
                                  className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition"
                                  title="Generate Invoice for this PO"
                                >
                                  + Invoice
                                </button>
                                {onEditClientPo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditClientPo(cpo);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition"
                                    title="Edit PO specifications"
                                  >
                                    Edit
                                  </button>
                                )}
                                {onVoidClientPo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVoidClientPo(cpo);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] transition"
                                    title="Void PO"
                                  >
                                    Void
                                  </button>
                                )}
                              </>
                            )}
                            {(cpo.status === 'Void' || cpo.isVoid) && (
                              <span className="text-[10px] text-rose-600 font-semibold italic">Voided</span>
                            )}
                            {!canManageFinance && cpo.status !== 'Void' && !cpo.isVoid && (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </div>
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

                              {/* PO Specifications & Metadata */}
                              {(cpo.location || cpo.importExport || cpo.expectedCompletion || cpo.projectName || cpo.notes || (cpo.attachedDocuments && cpo.attachedDocuments.length > 0)) && (
                                <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs space-y-2.5">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-700">
                                    {cpo.location && (
                                      <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                                        <span className="font-semibold text-gray-900">{cpo.location}</span>
                                      </div>
                                    )}
                                    {cpo.importExport && (
                                      <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trade Classification</span>
                                        <span className="font-semibold text-gray-900">{cpo.importExport}</span>
                                      </div>
                                    )}
                                    {cpo.expectedCompletion && (
                                      <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Expected Completion</span>
                                        <span className="font-semibold text-gray-900 font-mono">{cpo.expectedCompletion}</span>
                                      </div>
                                    )}
                                    {cpo.projectName && (
                                      <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Linked Project</span>
                                        <span className="font-semibold text-gray-900">{cpo.projectName}</span>
                                      </div>
                                    )}
                                  </div>

                                  {cpo.notes && (
                                    <div className="pt-2 border-t border-gray-200/60 text-gray-600">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Notes</span>
                                      <p className="text-[11px] leading-relaxed">{cpo.notes}</p>
                                    </div>
                                  )}

                                  {cpo.attachedDocuments && cpo.attachedDocuments.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200/60">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Attached Documents</span>
                                      <div className="flex flex-wrap gap-2">
                                        {cpo.attachedDocuments.map((doc, docIdx) => (
                                          <span
                                            key={docIdx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-800 font-medium shadow-2xs"
                                          >
                                            <span className="material-symbols-outlined text-[14px] text-blue-600">description</span>
                                            <span>{doc.name}</span>
                                            <span className="text-gray-400 text-[10px]">({doc.size || 'PDF'})</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

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

          {/* Pagination Controls */}
          {filteredPos.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Showing {Math.min((pagePo - 1) * pageSizePo + 1, filteredPos.length)} to {Math.min(pagePo * pageSizePo, filteredPos.length)} of {filteredPos.length} entries</span>
                <span className="text-gray-300">|</span>
                <select
                  value={pageSizePo}
                  onChange={(e) => {
                    setPageSizePo(Number(e.target.value));
                    setPagePo(1);
                  }}
                  className="py-1 px-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-700"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagePo(1)}
                  disabled={pagePo === 1}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="First Page"
                >
                  «
                </button>
                <button
                  onClick={() => setPagePo(p => Math.max(1, p - 1))}
                  disabled={pagePo === 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Prev
                </button>
                <span className="px-3 py-1 font-semibold text-gray-800">
                  {pagePo} / {totalPagesPo}
                </span>
                <button
                  onClick={() => setPagePo(p => Math.min(totalPagesPo, p + 1))}
                  disabled={pagePo === totalPagesPo}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Next
                </button>
                <button
                  onClick={() => setPagePo(totalPagesPo)}
                  disabled={pagePo === totalPagesPo}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          )}
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
            {canManageFinance && (
              <button
                onClick={onOpenGenerateInvoice}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
              >
                + Generate Invoice
              </button>
            )}
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
                {paginatedInvoices.map((inv) => {
                  const isExpanded = expandedInvId === inv.id;
                  const isInvVoid = inv.status === 'Void' || inv.isVoid;
                  return (
                    <React.Fragment key={inv.id}>
                      <tr
                        onClick={() => toggleExpandInv(inv.id)}
                        className={`cursor-pointer transition ${
                          isInvVoid ? 'bg-rose-50/20 opacity-75' : isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <div>
                              <span className={`font-bold block ${isInvVoid ? 'text-rose-700 line-through' : 'text-blue-700'}`}>
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-gray-400 text-[10px] block">{inv.issueDate || inv.invoicingDate}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{inv.clientName}</span>
                          <span className="font-mono text-gray-400 text-[10px] block">PO: {inv.linkedPo || 'Not linked'}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inv.importExport === 'Export' || (inv.country && (inv.country.includes('USA') || inv.country.includes('UAE') || inv.country.includes('KSA') || inv.country.includes('Singapore')))
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {inv.importExport ? `${inv.importExport}` : (inv.country && (inv.country.includes('USA') || inv.country.includes('UAE') || inv.country.includes('KSA')) ? 'Export / Cross-Border' : 'Domestic')}
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
                            isInvVoid
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : inv.status === 'Paid'
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewSampleInvoice(inv);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition flex items-center gap-1"
                              title="View Tax Invoice Sample Format"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>View Doc</span>
                            </button>

                            {canManageFinance && !isInvVoid && (
                              <>
                                {inv.status !== 'Paid' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenRecordPayment();
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">payments</span>
                                    <span>Pay</span>
                                  </button>
                                )}

                                {onEditInvoice && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditInvoice(inv);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                                  >
                                    Edit
                                  </button>
                                )}

                                {onVoidInvoice && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVoidInvoice(inv);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition"
                                    title="Void Invoice"
                                  >
                                    Void
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Invoice Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-4 bg-gray-50/70 border-b border-gray-200">
                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-blue-600">receipt_long</span>
                                  <span>Client Invoice Specifications ({inv.invoiceNumber})</span>
                                </span>
                                <span className="text-gray-400 font-mono text-[11px]">
                                  Billing Month: {inv.month || '—'} · Terms: {inv.paymentTermDays ? `${inv.paymentTermDays} Days` : 'Net 30'}
                                </span>
                              </div>

                              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs space-y-2.5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-700">
                                  {inv.clientLocation && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                                      <span className="font-semibold text-gray-900">{inv.clientLocation}</span>
                                    </div>
                                  )}
                                  {inv.importExport && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trade Classification</span>
                                      <span className="font-semibold text-gray-900">{inv.importExport}</span>
                                    </div>
                                  )}
                                  {(inv.linkedProject || inv.projectName) && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project</span>
                                      <span className="font-semibold text-gray-900">{inv.projectName || inv.linkedProject}</span>
                                    </div>
                                  )}
                                  {inv.linkedPo && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Linked Client PO</span>
                                      <span className="font-semibold text-blue-700 font-mono">{inv.linkedPo}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Invoice Value (+ Tax)</span>
                                    <span className="font-semibold text-gray-900 font-mono">
                                      {inv.currency || 'USD'} {(inv.amountNative || inv.invoiceValueTax || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Amount Received</span>
                                    <span className="font-semibold text-emerald-700 font-mono">
                                      {inv.currency || 'USD'} {(inv.amountReceivedSoFar || inv.receivedUsd || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Balance Outstanding</span>
                                    <span className="font-semibold text-amber-700 font-mono">
                                      {inv.currency || 'USD'} {(inv.balanceNative || inv.balanceUsd || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  {inv.paidDate && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Paid Date</span>
                                      <span className="font-semibold text-emerald-600 font-mono">{inv.paidDate}</span>
                                    </div>
                                  )}
                                </div>

                                {(inv.milestones || inv.milestone) && (
                                  <div className="pt-2 border-t border-gray-200/60 text-gray-700">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Payment Milestone / Scope</span>
                                    <p className="text-[11.5px] font-medium leading-relaxed">{inv.milestones || inv.milestone}</p>
                                  </div>
                                )}

                                {inv.notes && (
                                  <div className="pt-2 border-t border-gray-200/60 text-gray-600">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Notes</span>
                                    <p className="text-[11px] leading-relaxed">{inv.notes}</p>
                                  </div>
                                )}

                                {inv.attachedDocuments && inv.attachedDocuments.length > 0 && (
                                  <div className="pt-2 border-t border-gray-200/60">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Attached Documents</span>
                                    <div className="flex flex-wrap gap-2">
                                      {inv.attachedDocuments.map((doc, docIdx) => (
                                        <span
                                          key={docIdx}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-800 font-medium shadow-2xs"
                                        >
                                          <span className="material-symbols-outlined text-[14px] text-blue-600">description</span>
                                          <span>{doc.name}</span>
                                          <span className="text-gray-400 text-[10px]">({doc.size || 'PDF'})</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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

          {/* Pagination Controls */}
          {filteredInvoices.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Showing {Math.min((pageInv - 1) * pageSizeInv + 1, filteredInvoices.length)} to {Math.min(pageInv * pageSizeInv, filteredInvoices.length)} of {filteredInvoices.length} entries</span>
                <span className="text-gray-300">|</span>
                <select
                  value={pageSizeInv}
                  onChange={(e) => {
                    setPageSizeInv(Number(e.target.value));
                    setPageInv(1);
                  }}
                  className="py-1 px-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-700"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPageInv(1)}
                  disabled={pageInv === 1}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="First Page"
                >
                  «
                </button>
                <button
                  onClick={() => setPageInv(p => Math.max(1, p - 1))}
                  disabled={pageInv === 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Prev
                </button>
                <span className="px-3 py-1 font-semibold text-gray-800">
                  {pageInv} / {totalPagesInv}
                </span>
                <button
                  onClick={() => setPageInv(p => Math.min(totalPagesInv, p + 1))}
                  disabled={pageInv === totalPagesInv}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Next
                </button>
                <button
                  onClick={() => setPageInv(totalPagesInv)}
                  disabled={pageInv === totalPagesInv}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          )}
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
                  {onDeletePayment && <th className="py-3 px-4 text-center">Action</th>}
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

                    {onDeletePayment && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to void/delete payment receipt ${pmt.id} for invoice ${pmt.invoiceNumber}? This will reverse the linked cash transaction.`)) {
                              onDeletePayment(pmt.id, pmt.invoiceNumber);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition"
                          title="Void / Delete Payment Receipt"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Real AR Ageing Analysis */}
      {activeSubTab === 'AGEING' && (
        <div className="space-y-6">
          {/* Ageing Control & Filter Bar */}
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">calendar_month</span>
                  <span>As of Date:</span>
                </label>
                <input
                  type="date"
                  value={arAsOfDate}
                  onChange={(e) => setArAsOfDate(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 focus:outline-hidden focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setArAsOfDate(new Date().toISOString().slice(0, 10))}
                  className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  title="Reset As Of Date to Today"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">business</span>
                  <span>Client Filter:</span>
                </label>
                <select
                  value={arClientFilter}
                  onChange={(e) => setArClientFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 focus:outline-hidden focus:border-blue-400"
                >
                  <option value="ALL">All Clients ({allClients.length})</option>
                  {allClients.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl shadow-2xs border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => exportArAgeingToSpreadsheet(arAgeingReport, arAsOfDate, 'xlsx')}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition"
                  title="Export AR Ageing Report to Excel"
                >
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">table_view</span>
                  <span>Export Ageing (.XLSX)</span>
                </button>
                <button
                  onClick={() => exportArAgeingToSpreadsheet(arAgeingReport, arAsOfDate, 'csv')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition"
                  title="Export AR Ageing Report to CSV"
                >
                  .CSV
                </button>
              </div>
            </div>
          </div>

          {/* Ageing KPI Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Outstanding</span>
              <div className="text-xl font-extrabold text-gray-900 font-mono">${Math.round(arSummary.totalOutstanding).toLocaleString()}</div>
              <p className="text-[10px] text-gray-400">As of {arAsOfDate}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current</span>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">${Math.round(arSummary.current).toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600">Not yet due</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">1 - 30 Days Due</span>
              <div className="text-xl font-extrabold text-blue-700 font-mono">${Math.round(arSummary.d1to30).toLocaleString()}</div>
              <p className="text-[10px] text-blue-500">First reminder notice</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">31 - 60 Days</span>
              <div className="text-xl font-extrabold text-amber-700 font-mono">${Math.round(arSummary.d31to60).toLocaleString()}</div>
              <p className="text-[10px] text-amber-500">Second follow-up</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">61 - 90 Days</span>
              <div className="text-xl font-extrabold text-orange-700 font-mono">${Math.round(arSummary.d61to90).toLocaleString()}</div>
              <p className="text-[10px] text-orange-500">Escalated collection</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">90+ Days Critical</span>
              <div className="text-xl font-extrabold text-rose-700 font-mono">${Math.round(arSummary.d90Plus).toLocaleString()}</div>
              <p className="text-[10px] text-rose-500">Legal notice hold</p>
            </div>
          </div>

          {/* Ageing by Client Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Client Accounts Receivable Ageing Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">Categorized breakdown of receivables aged from invoice due date as of {arAsOfDate}</p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {arByClient.length} Debtors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4 text-right">Current</th>
                    <th className="py-3 px-4 text-right">1-30 Days</th>
                    <th className="py-3 px-4 text-right">31-60 Days</th>
                    <th className="py-3 px-4 text-right">61-90 Days</th>
                    <th className="py-3 px-4 text-right">90+ Days</th>
                    <th className="py-3 px-4 text-right">Total Due</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {arByClient.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 font-medium">
                        No receivables found matching the selected client filter and as-of date.
                      </td>
                    </tr>
                  ) : (
                    arByClient.map((clientRow) => (
                      <tr key={clientRow.clientName} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {clientRow.clientName}
                          <span className="text-[10px] text-gray-400 block font-normal">{clientRow.invoiceCount} invoice(s)</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                          {clientRow.current > 0 ? `$${Math.round(clientRow.current).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-blue-700">
                          {clientRow.d1to30 > 0 ? `$${Math.round(clientRow.d1to30).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                          {clientRow.d31to60 > 0 ? `$${Math.round(clientRow.d31to60).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-orange-700">
                          {clientRow.d61to90 > 0 ? `$${Math.round(clientRow.d61to90).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-bold">
                          {clientRow.d90Plus > 0 ? `$${Math.round(clientRow.d90Plus).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-gray-900">
                          ${Math.round(clientRow.totalDue).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setActiveSubTab('STATEMENTS');
                              setSelectedStatementClient(clientRow.clientName);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                          >
                            Statement
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Aged Invoices Register */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Itemized Invoices Ageing Ledger</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real invoice-level overdue analysis computed as of {arAsOfDate}</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {arItems.length} Invoices Listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Name & Linked PO</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Days Overdue</th>
                    <th className="py-3 px-4 text-center">Ageing Bucket</th>
                    <th className="py-3 px-4 text-right">Outstanding (USD)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {arItems.map((inv) => (
                    <tr key={inv.id || inv.invoiceNumber} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block">{inv.clientName}</span>
                        <span className="text-gray-400 text-[10px] font-mono block">PO: {inv.linkedPo || 'Direct'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        {inv.issueDate || inv.date || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-900">
                        {inv.dueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {inv.daysOverdue > 0 ? (
                          <span className="text-rose-600">+{inv.daysOverdue} d</span>
                        ) : (
                          <span className="text-emerald-600">On time</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.bucket === 'current'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.bucket === '1-30'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : inv.bucket === '31-60'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : inv.bucket === '61-90'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {inv.bucket === 'current' ? 'CURRENT' : `${inv.bucket} DAYS`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-gray-900">
                        ${Math.round(inv.amountDue).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewSampleInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 5: Client Statements of Account */}
      {activeSubTab === 'STATEMENTS' && (
        <div className="space-y-6">
          {/* Statement Header Controls */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700">Select Client:</label>
              <select
                value={selectedStatementClient}
                onChange={(e) => setSelectedStatementClient(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden"
              >
                <option value="ALL">All Clients (Consolidated)</option>
                {allClients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Print Statement</span>
              </button>
              <button
                onClick={onOpenRecordPayment}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>+ Record Receipt</span>
              </button>
            </div>
          </div>

          {/* Statement Ledger Sheet */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Statement of Accounts</span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                  {selectedStatementClient === 'ALL' ? 'Consolidated Client Ledger' : selectedStatementClient}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">Statement As Of:</span>
                <div className="text-sm font-bold text-gray-800 font-mono">
                  {new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Document Ref</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (Invoiced)</th>
                    <th className="py-3 px-4 text-right">Credit (Received)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {[
                    ...invoices
                      .filter(i => selectedStatementClient === 'ALL' || i.clientName === selectedStatementClient)
                      .map(i => ({
                        date: i.date,
                        ref: i.invoiceNumber,
                        client: i.clientName,
                        desc: `Invoice for ${i.linkedPo}`,
                        debit: i.amountUsd,
                        credit: 0,
                        status: i.status
                      })),
                    ...paymentsReceived
                      .filter(p => selectedStatementClient === 'ALL' || p.clientName === selectedStatementClient)
                      .map(p => ({
                        date: p.date,
                        ref: p.reference,
                        client: p.clientName,
                        desc: `Payment via ${p.mode} for ${p.invoiceNumber}`,
                        debit: 0,
                        credit: p.amountUsd,
                        status: p.status
                      }))
                  ]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-mono text-gray-600">{item.date}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{item.ref}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{item.client}</td>
                        <td className="py-3.5 px-4 text-gray-600">{item.desc}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          {item.debit > 0 ? `$${item.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {item.credit > 0 ? `$${item.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.credit > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceClientPOs;
