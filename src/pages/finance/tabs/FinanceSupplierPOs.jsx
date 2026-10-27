import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calculateApAgeing } from '../financeCalcs';
import {
  exportSupplierPosToSpreadsheet,
  exportPaymentsMadeToSpreadsheet,
  exportApAgeingToSpreadsheet
} from '../financeExports';

const FinanceSupplierPOs = ({
  supplierPos = [],
  paymentsMade = [],
  activeSubTab: controlledTab,
  onTabChange,
  onOpenIssueSupplierPo,
  onOpenThreeWayMatch,
  onOpenRecordSupplierPayment,
  onViewSampleSupplierPo,
  onDeletePayment,
  canManageFinance = true,
  onEditSupplierPo,
  onVoidSupplierPo
}) => {
  const [internalTab, setInternalTab] = useState('POS');
  const activeSubTab = controlledTab || internalTab;
  const setActiveSubTab = (tab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState('ALL');
  const [expandedPoId, setExpandedPoId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedPoId(prev => (prev === id ? null : id));
  };

  const filtered = supplierPos.filter(spo =>
    spo.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.linkedProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [pageSpo, setPageSpo] = useState(1);
  const [pageSizeSpo, setPageSizeSpo] = useState(25);
  const totalPagesSpo = Math.max(1, Math.ceil(filtered.length / pageSizeSpo));
  const paginatedSpo = filtered.slice((pageSpo - 1) * pageSizeSpo, pageSpo * pageSizeSpo);

  const filteredPayments = paymentsMade.filter(pmt =>
    pmt.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.supplierPoNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Distinct suppliers
  const allSuppliers = Array.from(new Set([
    ...supplierPos.map(s => s.supplierName),
    ...paymentsMade.map(p => p.supplierName)
  ])).filter(Boolean);

  // AP Ageing Filter States
  const [apAsOfDate, setApAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [apSupplierFilter, setApSupplierFilter] = useState('ALL');

  // Real AP Ageing Report computed pure via calculateApAgeing
  const apAgeingReport = useMemo(() => {
    return calculateApAgeing(supplierPos, {
      asOfDate: apAsOfDate,
      supplierFilter: apSupplierFilter
    });
  }, [supplierPos, apAsOfDate, apSupplierFilter]);

  const { summary: apSummary, bySupplier: apBySupplier, items: apItems } = apAgeingReport;

  return (
    <div className="space-y-6 text-left">
      {/* Top Action & Sub-tab Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold text-xs overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('POS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'POS' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier POs ({supplierPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('BILLS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'BILLS' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier Invoices
            </button>
            <button
              onClick={() => setActiveSubTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'PAYMENTS' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payments ({paymentsMade.length})
            </button>
            <button
              onClick={() => setActiveSubTab('AGEING')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'AGEING' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AP Ageing
            </button>
            <button
              onClick={() => setActiveSubTab('STATEMENTS')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeSubTab === 'STATEMENTS' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier Statements
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Export for Active Tab */}
          <div className="inline-flex rounded-xl shadow-2xs border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => {
                if (activeSubTab === 'POS') exportSupplierPosToSpreadsheet(filtered, 'xlsx');
                else if (activeSubTab === 'PAYMENTS') exportPaymentsMadeToSpreadsheet(filteredPayments, 'xlsx');
                else if (activeSubTab === 'AGEING') exportApAgeingToSpreadsheet(apAgeingReport, apAsOfDate, 'xlsx');
                else exportSupplierPosToSpreadsheet(filtered, 'xlsx');
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition active:scale-95"
              title={`Export ${activeSubTab} to Excel (.XLSX)`}
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
              <span>Export {activeSubTab === 'AGEING' ? 'Ageing' : activeSubTab === 'PAYMENTS' ? 'Payments' : 'Supplier POs'} (.XLSX)</span>
            </button>
            <button
              onClick={() => {
                if (activeSubTab === 'POS') exportSupplierPosToSpreadsheet(filtered, 'csv');
                else if (activeSubTab === 'PAYMENTS') exportPaymentsMadeToSpreadsheet(filteredPayments, 'csv');
                else if (activeSubTab === 'AGEING') exportApAgeingToSpreadsheet(apAgeingReport, apAsOfDate, 'csv');
                else exportSupplierPosToSpreadsheet(filtered, 'csv');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition active:scale-95"
              title={`Export ${activeSubTab} to CSV`}
            >
              .CSV
            </button>
          </div>

          {canManageFinance && (
            <button
              onClick={onOpenRecordSupplierPayment}
              className="px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl transition border border-indigo-200 flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>Record Payment Made</span>
            </button>
          )}

          <button
            onClick={() => onOpenThreeWayMatch()}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>3-Way Match Audit</span>
          </button>

          {canManageFinance ? (
            <button
              onClick={onOpenIssueSupplierPo}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
              <span>+ Issue Supplier PO</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs flex items-center gap-1.5 border border-slate-200">
              <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
              <span>Read-Only Access</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-tab 1: Supplier Purchase Orders */}
      {activeSubTab === 'POS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Supplier Purchase Orders & Procurement AP Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Procurement commitments cost-mapped to active Client Projects</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              {supplierPos.length} Active Supplier POs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supplier PO & Entity</th>
                  <th className="py-3 px-4">Vendor & Jurisdiction</th>
                  <th className="py-3 px-4">Linked Client SOW</th>
                  <th className="py-3 px-4 text-right">Committed Value</th>
                  <th className="py-3 px-4 text-right">Billed (% Progress)</th>
                  <th className="py-3 px-4 text-right">Remaining Headroom</th>
                  <th className="py-3 px-4 text-center">Payment Terms</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedSpo.map((spo) => {
                  const isExpanded = expandedPoId === spo.id;
                  return (
                    <React.Fragment key={spo.id}>
                      <tr
                        onClick={() => toggleExpand(spo.id)}
                        className={`cursor-pointer transition ${
                          isExpanded ? 'bg-indigo-50/40' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 block">{spo.poNumber}</span>
                              <span className="text-gray-400 text-[10px] block">{spo.entity}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{spo.supplierName}</span>
                          <span className="text-gray-400 text-[11px] block">{spo.origin} {spo.taxId && `· Tax: ${spo.taxId}`}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-blue-700 block">{spo.linkedProject || spo.projectName || '—'}</span>
                          {spo.linkedClientPo && (
                            <span className="text-gray-400 text-[10px] font-mono block">Client PO: {spo.linkedClientPo}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                          ${spo.committedUsd?.toLocaleString()}
                          {spo.currency !== 'USD' && (
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {spo.currency} {spo.committedNative?.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className="font-bold text-indigo-700 block">${(spo.billedUsd || 0).toLocaleString()}</span>
                          <span className="text-gray-400 text-[10px] block">{spo.billedPercent || 0}% Billed</span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold font-mono text-gray-700">
                          ${(spo.remainingUsd || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold">
                            {spo.terms}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            spo.status === 'Void' || spo.isVoid
                              ? 'bg-gray-100 text-gray-500 border border-gray-300'
                              : spo.status === 'Fulfilled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : spo.status === 'Bill Overdue'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {spo.status === 'Void' || spo.isVoid ? 'VOID' : spo.status}
                          </span>
                          {spo.voidReason && (
                            <span className="block text-[10px] text-gray-400 italic max-w-[120px] truncate mx-auto mt-0.5" title={spo.voidReason}>
                              {spo.voidReason}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewSampleSupplierPo(spo);
                              }}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition flex items-center gap-1"
                              title="View Official Purchase Order Document"
                            >
                              <span className="material-symbols-outlined text-[13px]">visibility</span>
                              <span>PO Doc</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenThreeWayMatch(spo);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition flex items-center gap-1"
                              title="Run 3-Way Audit Verification"
                            >
                              <span className="material-symbols-outlined text-[13px]">fact_check</span>
                              <span>3-Way Match</span>
                            </button>

                            {canManageFinance && spo.status !== 'Void' && !spo.isVoid && (
                              <>
                                {onEditSupplierPo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditSupplierPo(spo);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition flex items-center gap-1"
                                    title="Edit Supplier PO"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">edit</span>
                                    <span>Edit</span>
                                  </button>
                                )}
                                {onVoidSupplierPo && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVoidSupplierPo(spo);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold transition flex items-center gap-1"
                                    title="Void Supplier PO"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">block</span>
                                    <span>Void</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-4 bg-gray-50/70 border-b border-gray-200">
                            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-indigo-600">receipt_long</span>
                                  <span>Supplier Order Breakdown ({spo.poNumber})</span>
                                </span>
                                <span className="text-gray-400 font-mono text-[11px]">PO Date: {spo.issueDate || spo.date || '—'}</span>
                              </div>

                              {/* Specifications & Metadata */}
                              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs space-y-2.5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-700">
                                  {spo.location && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Location</span>
                                      <span className="font-semibold text-gray-900">{spo.location}</span>
                                    </div>
                                  )}
                                  {spo.importExport && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trade Classification</span>
                                      <span className="font-semibold text-gray-900">{spo.importExport}</span>
                                    </div>
                                  )}
                                  {spo.expectedCompletion && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Expected Completion</span>
                                      <span className="font-semibold text-gray-900 font-mono">{spo.expectedCompletion}</span>
                                    </div>
                                  )}
                                  {(spo.linkedProject || spo.projectName) && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Project</span>
                                      <span className="font-semibold text-gray-900">{spo.projectName || spo.linkedProject}</span>
                                    </div>
                                  )}
                                  {spo.linkedClientPo && (
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mapped Client PO</span>
                                      <span className="font-semibold text-indigo-700 font-mono">{spo.linkedClientPo}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Currency & Total</span>
                                    <span className="font-semibold text-gray-900 font-mono">
                                      {spo.currency || 'USD'} {(spo.totalValueNative || spo.committedNative || spo.committedUsd || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {spo.notes && (
                                  <div className="pt-2 border-t border-gray-200/60 text-gray-600">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Notes</span>
                                    <p className="text-[11px] leading-relaxed">{spo.notes}</p>
                                  </div>
                                )}

                                {spo.attachedDocuments && spo.attachedDocuments.length > 0 && (
                                  <div className="pt-2 border-t border-gray-200/60">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Attached Documents</span>
                                    <div className="flex flex-wrap gap-2">
                                      {spo.attachedDocuments.map((doc, docIdx) => (
                                        <span
                                          key={docIdx}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-800 font-medium shadow-2xs"
                                        >
                                          <span className="material-symbols-outlined text-[14px] text-indigo-600">description</span>
                                          <span>{doc.name}</span>
                                          <span className="text-gray-400 text-[10px]">({doc.size || 'PDF'})</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Milestones Breakdown */}
                              {spo.milestones && spo.milestones.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                                    Payment Milestones Schedule
                                  </span>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {spo.milestones.map((m, idx) => (
                                      <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                                        <div>
                                          <div className="font-semibold text-gray-900">{m.name}</div>
                                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                            {m.percent ? `${m.percent}% · ` : ''}{spo.currency || 'USD'} {(m.amount || 0).toLocaleString()}
                                            {m.date && ` · Due: ${m.date}`}
                                          </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          m.status === 'Paid'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : m.status === 'Billed'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                          {m.status || 'Scheduled'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span>Showing {Math.min((pageSpo - 1) * pageSizeSpo + 1, filtered.length)} to {Math.min(pageSpo * pageSizeSpo, filtered.length)} of {filtered.length} entries</span>
                <span className="text-gray-300">|</span>
                <select
                  value={pageSizeSpo}
                  onChange={(e) => {
                    setPageSizeSpo(Number(e.target.value));
                    setPageSpo(1);
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
                  onClick={() => setPageSpo(1)}
                  disabled={pageSpo === 1}
                  className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  title="First Page"
                >
                  «
                </button>
                <button
                  onClick={() => setPageSpo(p => Math.max(1, p - 1))}
                  disabled={pageSpo === 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Prev
                </button>
                <span className="px-3 py-1 font-semibold text-gray-800">
                  {pageSpo} / {totalPagesSpo}
                </span>
                <button
                  onClick={() => setPageSpo(p => Math.min(totalPagesSpo, p + 1))}
                  disabled={pageSpo === totalPagesSpo}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
                >
                  Next
                </button>
                <button
                  onClick={() => setPageSpo(totalPagesSpo)}
                  disabled={pageSpo === totalPagesSpo}
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

      {/* Sub-tab 2: Bills & 3-Way Match */}
      {activeSubTab === 'BILLS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Supplier Invoices & 3-Way Matching Hub</h3>
              <p className="text-xs text-gray-500">Automated verification across Purchase Order Ratecard, Supplier Bill, and Goods Receipt / SOW Delivery</p>
            </div>
            <button
              onClick={() => onOpenThreeWayMatch()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Launch 3-Way Match Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Step 1: PO Ratecard</span>
              <div className="text-sm font-bold text-gray-900">PO-SUP-2024-114</div>
              <p className="text-gray-500 text-[11px]">IoT Cluster Hosting contracted at $15,000 / month ceiling.</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Approved</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Step 2: Supplier Bill (AP)</span>
              <div className="text-sm font-bold text-gray-900">INV-APEX-99120</div>
              <p className="text-gray-500 text-[11px]">Billed amount: $15,000.00 USD with zero price escalation.</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Exact Match</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Step 3: Milestone Acceptance</span>
              <div className="text-sm font-bold text-gray-900">GRN-2024-0419</div>
              <p className="text-gray-500 text-[11px]">Engineering sign-off confirmed on cluster deployment.</p>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Accepted</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Payments Made Table */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Supplier Disbursements & AP Settlement Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Disbursed wire transfers and checks clearing supplier purchase order liabilities</p>
            </div>
            <button
              onClick={onOpenRecordSupplierPayment}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
              <span>+ Record Payment Made</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Payment ID & Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Target Supplier PO</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Remittance Reference</th>
                  <th className="py-3 px-4 text-right">Disbursed Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canManageFinance && onDeletePayment && <th className="py-3 px-4 text-center">Action</th>}
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
                      {pmt.supplierName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                      {pmt.supplierPoNumber}
                    </td>

                    <td className="py-3.5 px-4 text-gray-700">
                      {pmt.mode}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-gray-800">
                      {pmt.reference}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 font-mono">
                      ${pmt.amountUsd?.toLocaleString()}
                      {pmt.currency !== 'USD' && (
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {pmt.currency} {pmt.amountNative?.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {pmt.status}
                      </span>
                    </td>

                    {canManageFinance && onDeletePayment && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to void/delete supplier payment ${pmt.id} for PO ${pmt.supplierPoNumber}? This will reverse the linked cash transaction.`)) {
                              onDeletePayment(pmt.id, pmt.supplierPoNumber);
                            }
                          }}
                          className="p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 transition"
                          title="Void / Delete Supplier Payment"
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

      {/* Sub-tab 4: AP Ageing Schedule */}
      {activeSubTab === 'AGEING' && (
        <div className="space-y-6">
          {/* Controls Bar: As of Date & Supplier Filter */}
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">calendar_month</span>
                  <span>As of Date:</span>
                </label>
                <input
                  type="date"
                  value={apAsOfDate}
                  onChange={(e) => setApAsOfDate(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 focus:outline-hidden focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setApAsOfDate(new Date().toISOString().slice(0, 10))}
                  className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                  title="Reset As Of Date to Today"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">store</span>
                  <span>Supplier Filter:</span>
                </label>
                <select
                  value={apSupplierFilter}
                  onChange={(e) => setApSupplierFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-900 focus:outline-hidden focus:border-emerald-400"
                >
                  <option value="ALL">All Suppliers ({allSuppliers.length})</option>
                  {allSuppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl shadow-2xs border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => exportApAgeingToSpreadsheet(apAgeingReport, apAsOfDate, 'xlsx')}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1 transition"
                  title="Export AP Ageing Report to Excel"
                >
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">table_view</span>
                  <span>Export Ageing (.XLSX)</span>
                </button>
                <button
                  onClick={() => exportApAgeingToSpreadsheet(apAgeingReport, apAsOfDate, 'csv')}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition"
                  title="Export AP Ageing Report to CSV"
                >
                  .CSV
                </button>
              </div>
            </div>
          </div>

          {/* Ageing KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total AP Outstanding</span>
              <div className="text-xl font-extrabold text-gray-900 font-mono">${Math.round(apSummary.totalOutstanding).toLocaleString()}</div>
              <p className="text-[10px] text-gray-400">As of {apAsOfDate}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current</span>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">${Math.round(apSummary.current).toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600">Within payment term</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">1 - 30 Days Due</span>
              <div className="text-xl font-extrabold text-blue-700 font-mono">${Math.round(apSummary.d1to30).toLocaleString()}</div>
              <p className="text-[10px] text-blue-500">Upcoming invoice run</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">31 - 60 Days</span>
              <div className="text-xl font-extrabold text-amber-700 font-mono">${Math.round(apSummary.d31to60).toLocaleString()}</div>
              <p className="text-[10px] text-amber-500">Review cashflow</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">61 - 90 Days</span>
              <div className="text-xl font-extrabold text-orange-700 font-mono">${Math.round(apSummary.d61to90).toLocaleString()}</div>
              <p className="text-[10px] text-orange-500">Payment prioritized</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">90+ Days Critical</span>
              <div className="text-xl font-extrabold text-rose-700 font-mono">${Math.round(apSummary.d90Plus).toLocaleString()}</div>
              <p className="text-[10px] text-rose-500">Urgent vendor release</p>
            </div>
          </div>

          {/* Ageing by Supplier Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Supplier Accounts Payable Ageing Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">Procurement liabilities categorized by age past agreed payment terms as of {apAsOfDate}</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {apBySupplier.length} Creditors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4 text-right">Current</th>
                    <th className="py-3 px-4 text-right">1-30 Days</th>
                    <th className="py-3 px-4 text-right">31-60 Days</th>
                    <th className="py-3 px-4 text-right">61-90 Days</th>
                    <th className="py-3 px-4 text-right">90+ Days</th>
                    <th className="py-3 px-4 text-right">Total Payable</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {apBySupplier.map((sup) => (
                    <tr key={sup.supplierName} className="hover:bg-gray-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {sup.supplierName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                        {sup.current > 0 ? `$${Math.round(sup.current).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-blue-700">
                        {sup.d1to30 > 0 ? `$${Math.round(sup.d1to30).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                        {sup.d31to60 > 0 ? `$${Math.round(sup.d31to60).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-orange-700">
                        {sup.d61to90 > 0 ? `$${Math.round(sup.d61to90).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-bold">
                        {sup.d90Plus > 0 ? `$${Math.round(sup.d90Plus).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-gray-900">
                        ${Math.round(sup.total).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setActiveSubTab('STATEMENTS');
                            setSelectedStatementSupplier(sup.supplierName);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        >
                          Statement
                        </button>
                      </td>
                    </tr>
                  ))}
                  {apBySupplier.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No outstanding supplier payables match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Aged Supplier POs / AP Commitments Ledger */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Aged Supplier Purchase Orders & Liabilities</h3>
                <p className="text-xs text-gray-400 mt-0.5">Itemized commitments with individual aging overdue days and balances</p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {apItems.length} Commitments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">PO Number & Entity</th>
                    <th className="py-3 px-4">Supplier & SOW</th>
                    <th className="py-3 px-4">PO Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Overdue Days</th>
                    <th className="py-3 px-4 text-center">Ageing Bucket</th>
                    <th className="py-3 px-4 text-right">Committed Value</th>
                    <th className="py-3 px-4 text-right">Payable Balance</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {apItems.map((spo) => {
                    const bucketBadge = {
                      'current': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      '1-30': 'bg-blue-50 text-blue-700 border-blue-200',
                      '31-60': 'bg-amber-50 text-amber-700 border-amber-200',
                      '61-90': 'bg-orange-50 text-orange-700 border-orange-200',
                      '90+': 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                    }[spo.bucket] || 'bg-gray-50 text-gray-700 border-gray-200';

                    return (
                      <tr key={spo.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                          <div>{spo.poNumber}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{spo.entity}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block">{spo.supplierName}</span>
                          <span className="text-gray-400 text-[11px] block">{spo.linkedProject || spo.projectName || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">
                          {spo.issueDate || spo.date || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700 font-semibold">
                          {spo.dueDate || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {spo.daysOverdue > 0 ? (
                            <span className="font-bold text-rose-600">+{spo.daysOverdue}d</span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">Current</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${bucketBadge}`}>
                            {spo.bucket === 'current' ? 'Current' : `${spo.bucket} days`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                          ${Math.round(spo.committedUsd || spo.totalValueUsd || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          ${Math.round(spo.amountDue).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {onViewSampleSupplierPo && (
                            <button
                              onClick={() => onViewSampleSupplierPo(spo)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                            >
                              View PO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {apItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400">
                        No outstanding supplier commitments match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 5: Supplier Statements of Account */}
      {activeSubTab === 'STATEMENTS' && (
        <div className="space-y-6">
          {/* Statement Header Controls */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-gray-700">Select Supplier:</label>
              <select
                value={selectedStatementSupplier}
                onChange={(e) => setSelectedStatementSupplier(e.target.value)}
                className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-hidden"
              >
                <option value="ALL">All Suppliers (Consolidated)</option>
                {allSuppliers.map(s => (
                  <option key={s} value={s}>{s}</option>
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
                onClick={onOpenRecordSupplierPayment}
                className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                <span>+ Disburse Payment</span>
              </button>
            </div>
          </div>

          {/* Statement Ledger Sheet */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Statement of Accounts</span>
                <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
                  {selectedStatementSupplier === 'ALL' ? 'Consolidated Supplier Ledger' : selectedStatementSupplier}
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
                    <th className="py-3 px-4">PO / Document Ref</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Commitment (PO Incurred)</th>
                    <th className="py-3 px-4 text-right">Disbursed (Paid)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {[
                    ...supplierPos
                      .filter(s => selectedStatementSupplier === 'ALL' || s.supplierName === selectedStatementSupplier)
                      .map(s => ({
                        date: s.issueDate || '2024-03-01',
                        ref: s.poNumber,
                        supplier: s.supplierName,
                        desc: `Purchase Order for ${s.linkedProject}`,
                        debit: s.totalValueUsd,
                        credit: 0,
                        status: s.status
                      })),
                    ...paymentsMade
                      .filter(p => selectedStatementSupplier === 'ALL' || p.supplierName === selectedStatementSupplier)
                      .map(p => ({
                        date: p.date,
                        ref: p.reference,
                        supplier: p.supplierName,
                        desc: `Disbursement for ${p.supplierPoNumber} via ${p.mode}`,
                        debit: 0,
                        credit: p.amountUsd,
                        status: p.status
                      }))
                  ]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 font-mono text-gray-600">{item.date}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{item.ref}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{item.supplier}</td>
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
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
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

export default FinanceSupplierPOs;
