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
              Client PO Contracts ({clientPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('INVOICES')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'INVOICES' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Client Tax Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'PAYMENTS' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payments Received ({paymentsReceived.length})
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
