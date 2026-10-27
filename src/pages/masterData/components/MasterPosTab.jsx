import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MasterDataTabs from './MasterDataTabs';

export default function MasterPosTab({
  allMasterPos,
  filteredMasterPos,
  poMetrics,
  clientCount,
  supplierCount,
  vaultDocsCount,
  totalPoCount,
  handleSelectSegment,
  exportRegistry,
  poFilterType,
  setPoFilterType,
  poSearchTerm,
  setPoSearchTerm,
  poStatusFilter,
  setPoStatusFilter,
  poCurrencyFilter,
  setPoCurrencyFilter,
  setPoToDelete
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(filteredMasterPos.length / pageSize) || 1;
  const paginatedMasterPos = filteredMasterPos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div id="po-master-section" className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6 animate-fade-in text-left">
      {/* Navigation Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <MasterDataTabs
          activeSegment="POS"
          handleSelectSegment={handleSelectSegment}
          clientCount={clientCount}
          supplierCount={supplierCount}
          vaultDocsCount={vaultDocsCount}
          totalPoCount={totalPoCount}
        />

        <div className="flex items-center gap-2">
          <Link
            to="/finance/client"
            className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span>Register Client PO</span>
          </Link>
          <Link
            to="/finance/supplier"
            className="px-3.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/70 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[15px]">add_circle</span>
            <span>Issue Supplier PO</span>
          </Link>
        </div>
      </div>

      {/* Section Title & Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-display">
                Purchase Order (PO) Master Registry
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Centralized master ledger of all Client Purchase Orders (AR revenue contracts) and Supplier Purchase Orders (AP vendor commitments). Inspect details and manage PO lifecycle with administrative delete privileges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Ledger Synchronized</span>
          </span>
          <button
            type="button"
            onClick={exportRegistry}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-2xs flex items-center gap-1.5"
            title="Download complete registry export (.xlsx)"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
            <span>Export POs</span>
          </button>
        </div>
      </div>

      {/* Mini PO Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total PO Contracts</span>
            <span className="material-symbols-outlined text-[18px] text-gray-400">inventory_2</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 font-display tracking-tight">
            {poMetrics.totalCount}
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-2 font-medium">
            <span className="text-blue-600 font-bold">{poMetrics.clientCount} Client (AR)</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">{poMetrics.supplierCount} Supplier (AP)</span>
          </div>
        </div>

        <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
            <span>Client PO Value (AR)</span>
            <span className="material-symbols-outlined text-[18px] text-blue-500">arrow_downward</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-900 font-display tracking-tight">
            ${poMetrics.clientValUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            Revenue bookings across {poMetrics.clientCount} clients
          </div>
        </div>

        <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-700 font-semibold">
            <span>Supplier PO Value (AP)</span>
            <span className="material-symbols-outlined text-[18px] text-purple-500">arrow_upward</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-display tracking-tight">
            ${poMetrics.supplierValUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">
            Procurement commitments across {poMetrics.supplierCount} vendors
          </div>
        </div>

        <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span>Net PO Spread</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-500">account_balance</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 font-display tracking-tight">
            ${poMetrics.netSpread.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {poMetrics.clientValUsd > 0 ? `${((poMetrics.netSpread / poMetrics.clientValUsd) * 100).toFixed(1)}% Gross contract margin` : 'Balanced backlog'}
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
        {/* Sub-type Filter Pills */}
        <div className="inline-flex p-1 bg-white rounded-xl shadow-2xs border border-gray-100 gap-1 text-xs">
          <button
            type="button"
            onClick={() => { setPoFilterType('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              poFilterType === 'ALL'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All POs ({allMasterPos.length})
          </button>
          <button
            type="button"
            onClick={() => { setPoFilterType('CLIENT'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              poFilterType === 'CLIENT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            <span>Client POs ({poMetrics.clientCount})</span>
          </button>
          <button
            type="button"
            onClick={() => { setPoFilterType('SUPPLIER'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              poFilterType === 'SUPPLIER'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            <span>Supplier POs ({poMetrics.supplierCount})</span>
          </button>
        </div>

        {/* Search and Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search PO#, company, project..."
              value={poSearchTerm}
              onChange={(e) => { setPoSearchTerm(e.target.value); setCurrentPage(1); }}
              className="text-xs pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 w-48 sm:w-64"
            />
            {poSearchTerm && (
              <button
                type="button"
                onClick={() => { setPoSearchTerm(''); setCurrentPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={poStatusFilter}
            onChange={(e) => { setPoStatusFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-gray-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Partially Invoiced">Partially Invoiced</option>
            <option value="Fully Invoiced">Fully Invoiced</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Open">Open</option>
            <option value="Active Drawdown">Active Drawdown</option>
            <option value="Bill Overdue">Bill Overdue</option>
          </select>

          {/* Currency Filter */}
          <select
            value={poCurrencyFilter}
            onChange={(e) => { setPoCurrencyFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-gray-700 font-medium"
          >
            <option value="ALL">All FX</option>
            <option value="USD">USD</option>
            <option value="AED">AED</option>
            <option value="SAR">SAR</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>

      {/* Master PO Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="py-3 px-4">PO Number & Date</th>
              <th className="py-3 px-3">Classification</th>
              <th className="py-3 px-3">Counterparty</th>
              <th className="py-3 px-3">Scope / Project</th>
              <th className="py-3 px-3 text-right">Contract Value</th>
              <th className="py-3 px-3">Drawdown / Billed</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Terms</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredMasterPos.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No Purchase Orders Found</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      {poSearchTerm || poFilterType !== 'ALL' || poStatusFilter !== 'ALL' || poCurrencyFilter !== 'ALL'
                        ? 'No PO contracts match your active filter criteria. Try resetting filters.'
                        : 'No Purchase Orders are currently registered in the system.'}
                    </p>
                    {(poSearchTerm || poFilterType !== 'ALL' || poStatusFilter !== 'ALL' || poCurrencyFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPoFilterType('ALL');
                          setPoSearchTerm('');
                          setPoStatusFilter('ALL');
                          setPoCurrencyFilter('ALL');
                          setCurrentPage(1);
                        }}
                        className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMasterPos.map((po) => {
                const isClient = po.type === 'client';
                return (
                  <tr
                    key={po.uniqueKey}
                    className="hover:bg-purple-50/20 transition-colors group"
                  >
                    {/* PO Number & Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 font-mono text-[11px] group-hover:text-purple-700 transition">
                        {po.poNumber}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        <span>{po.date}</span>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-3">
                      {isClient ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                          <span>Client PO (AR)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                          <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                          <span>Supplier PO (AP)</span>
                        </span>
                      )}
                    </td>

                    {/* Counterparty */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{po.flag}</span>
                        <span>{po.counterparty}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {isClient ? (po.country || 'International') : (po.origin || 'Vendor')}
                      </div>
                    </td>

                    {/* Scope / Project */}
                    <td className="py-3.5 px-3 max-w-[220px]">
                      <div className="text-gray-700 font-medium truncate" title={po.scopeOrProject}>
                        {po.scopeOrProject}
                      </div>
                      {po.linkedClientPo && (
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                          Ref: {po.linkedClientPo}
                        </div>
                      )}
                    </td>

                    {/* Contract Value */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="font-bold text-gray-900">
                        {po.currency} {Number(po.valueNative || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ≈ ${Number(po.valueUsd || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* Drawdown / Billed */}
                    <td className="py-3.5 px-3 min-w-[130px]">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 mb-1">
                        <span>{po.billedPercent}%</span>
                        <span className="text-gray-400">
                          {po.currency} {Number(po.billedNative || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            po.billedPercent >= 100
                              ? 'bg-emerald-500'
                              : isClient
                              ? 'bg-blue-500'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, po.billedPercent))}%` }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          po.status === 'Fully Invoiced' || po.status === 'Fulfilled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'Partially Invoiced' || po.status === 'Active Drawdown'
                            ? 'bg-blue-100 text-blue-800'
                            : po.status === 'Bill Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    {/* Terms */}
                    <td className="py-3.5 px-3">
                      <span className="text-gray-600 font-medium text-[11px] bg-gray-100/80 px-2 py-0.5 rounded-md">
                        {po.terms}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={po.financeLink}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title={`View in Finance (${isClient ? 'Client Side' : 'Supplier Side'})`}
                        >
                          <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setPoToDelete(po)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition active:scale-95"
                          title={`Delete Purchase Order ${po.poNumber}`}
                          aria-label={`Delete Purchase Order ${po.poNumber}`}
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats & Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>
          Showing <strong>{paginatedMasterPos.length}</strong> of <strong>{filteredMasterPos.length}</strong> Purchase Orders (Page {currentPage} of {totalPages})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Previous Page"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="font-semibold text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Next Page"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
