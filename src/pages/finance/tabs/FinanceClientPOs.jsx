import React, { useState } from 'react';

const FinanceClientPOs = ({
  clientPos,
  invoices,
  onOpenRegisterClientPo,
  onOpenGenerateInvoice,
  onViewSampleInvoice
}) => {
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('POS'); // 'POS' | 'INVOICES'

  const toggleExpand = (id) => {
    setExpandedPoId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Action & Sub-tab Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl font-semibold text-xs">
            <button
              onClick={() => setActiveSubTab('POS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'POS' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sales PO Contracts ({clientPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'INVOICES' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client Tax Invoices ({invoices.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenGenerateInvoice}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">flash_on</span>
            <span>Generate Drawdown Invoice</span>
          </button>
          <button
            onClick={onOpenRegisterClientPo}
            className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Register Client PO</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'POS' ? (
        /* Client POs Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Client Purchase Order Master Registry</h3>
              <p className="text-xs text-gray-400 mt-0.5">Authoritative SOW caps, currency schedules, and drawdown utilization</p>
            </div>
            <span className="text-xs text-gray-500">
              Click any row to expand milestone drawdown schedule
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Client PO #</th>
                  <th className="py-3 px-5">Client Account</th>
                  <th className="py-3 px-5">SOW / Project Scope</th>
                  <th className="py-3 px-5 text-right">Total PO Value</th>
                  <th className="py-3 px-5 text-right">Invoiced & Drawdown</th>
                  <th className="py-3 px-5 text-right">Remaining Cap</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {clientPos.map((cpo) => (
                  <React.Fragment key={cpo.id}>
                    <tr
                      onClick={() => toggleExpand(cpo.id)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-[16px]">
                          {expandedPoId === cpo.id ? 'expand_less' : 'expand_more'}
                        </span>
                        <span>{cpo.poNumber}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-gray-900">{cpo.clientName}</span>
                        <span className="text-gray-400 text-[11px] block">{cpo.flag} {cpo.country} · Terms: {cpo.terms}</span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-700 max-w-xs truncate">{cpo.scope}</td>
                      <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                        {cpo.currency} {cpo.totalValueNative.toLocaleString()}
                        <span className="text-[10px] text-gray-400 block font-normal">
                          ≈ ${cpo.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-bold text-blue-600">{cpo.drawdownPercent}%</span>
                        </div>
                        <div className="w-24 ml-auto bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, cpo.drawdownPercent)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-emerald-600">
                        {cpo.currency} {cpo.remainingNative.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          cpo.status === 'Fully Invoiced'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cpo.status === 'Partially Invoiced'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {cpo.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenGenerateInvoice(cpo)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Generate Invoice Drawdown"
                        >
                          Invoice Drawdown
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Milestone Drawer */}
                    {expandedPoId === cpo.id && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={8} className="p-4 px-8">
                          <div className="bg-white rounded-xl p-4 border border-gray-200/70 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-blue-600 text-[18px]">timeline</span>
                                <span>Milestone Drawdown & Billing Schedule for {cpo.poNumber}</span>
                              </h4>
                              <span className="text-[11px] text-gray-500 font-mono">
                                Total Cap: {cpo.currency} {cpo.totalValueNative.toLocaleString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {(cpo.milestones || []).map((m, idx) => (
                                <div key={idx} className="p-3 rounded-lg border border-gray-100 bg-gray-50/60 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800 text-[11px] truncate">{m.name}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      m.status === 'Paid'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : m.status === 'Billed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {m.status}
                                    </span>
                                  </div>
                                  <div className="text-xs font-black text-gray-900 font-display">
                                    {cpo.currency} {m.amount.toLocaleString()}
                                  </div>
                                  {m.invNum && (
                                    <span className="text-[10px] text-blue-600 font-mono block">Ref: {m.invNum}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Invoices Table */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-display">Client Tax Invoices Ledger</h3>
              <p className="text-xs text-gray-400 mt-0.5">Formal tax invoices billed against client PO drawdowns</p>
            </div>
            <button
              onClick={() => onViewSampleInvoice()}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>View Official Tax Invoice Specimen</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Linked PO</th>
                  <th className="py-3 px-5">Client Account</th>
                  <th className="py-3 px-5">Milestone / Scope</th>
                  <th className="py-3 px-5">Issue & Due Date</th>
                  <th className="py-3 px-5 text-right">Invoiced Amount</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Specimen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-5 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-5 font-mono text-blue-600">{inv.linkedPo}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-gray-900">{inv.clientName}</span>
                      <span className="text-gray-400 text-[11px] block">{inv.country}</span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-600 max-w-xs truncate">{inv.milestone}</td>
                    <td className="py-3.5 px-5 text-gray-500">
                      <div>Issued: {inv.issueDate}</div>
                      <div className="text-[11px] text-gray-400">Due: {inv.dueDate}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                      {inv.currency} {inv.amountNative.toLocaleString()}
                      <span className="text-[10px] text-gray-400 block font-normal">≈ ${inv.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => onViewSampleInvoice(inv)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      >
                        View Specimen
                      </button>
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
