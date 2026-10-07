import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FinanceSupplierPOs = ({
  supplierPos = [],
  paymentsMade = [],
  onOpenIssueSupplierPo,
  onOpenThreeWayMatch,
  onOpenRecordSupplierPayment,
  onViewSampleSupplierPo
}) => {
  const [activeSubTab, setActiveSubTab] = useState('POS'); // 'POS' | 'BILLS' | 'PAYMENTS'
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = supplierPos.filter(spo =>
    spo.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.linkedProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = paymentsMade.filter(pmt =>
    pmt.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pmt.supplierPoNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
                activeSubTab === 'POS' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier POs ({supplierPos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('BILLS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'BILLS' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Supplier Invoices & 3-Way Match
            </button>
            <button
              onClick={() => setActiveSubTab('PAYMENTS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSubTab === 'PAYMENTS' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payments Made ({paymentsMade.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenRecordSupplierPayment}
            className="px-3.5 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl transition border border-indigo-200 flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            <span>Record Payment Made</span>
          </button>

          <button
            onClick={() => onOpenThreeWayMatch()}
            className="px-3.5 py-2 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>3-Way Match Audit</span>
          </button>

          <button
            onClick={onOpenIssueSupplierPo}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            <span>+ Issue Supplier PO</span>
          </button>
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
                {filtered.map((spo) => (
                  <tr key={spo.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-gray-900 block">{spo.poNumber}</span>
                      <span className="text-gray-400 text-[10px] block">{spo.entity}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{spo.supplierName}</span>
                      <span className="text-gray-400 text-[11px] block">{spo.origin} · Tax: {spo.taxId}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-blue-700 block">{spo.linkedProject}</span>
                      <span className="text-gray-400 text-[10px] font-mono block">Client PO: {spo.linkedClientPo}</span>
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
                        spo.status === 'Fulfilled'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : spo.status === 'Bill Overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {spo.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewSampleSupplierPo(spo)}
                          className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition flex items-center gap-1"
                          title="View Official Purchase Order Document"
                        >
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          <span>PO Doc</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenThreeWayMatch(spo)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition flex items-center gap-1"
                          title="Run 3-Way Audit Verification"
                        >
                          <span className="material-symbols-outlined text-[13px]">fact_check</span>
                          <span>3-Way Match</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default FinanceSupplierPOs;
