import React, { useState } from 'react';

const FinanceSupplierPOs = ({
  supplierPos,
  onOpenIssueSupplierPo,
  onOpenThreeWayMatch,
  onViewSampleSupplierPo
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = supplierPos.filter(spo =>
    spo.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spo.linkedProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Top Action & Search Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search supplier POs, vendors, or entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenThreeWayMatch()}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>3-Way Match Audit Tool</span>
          </button>
          <button
            onClick={onOpenIssueSupplierPo}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Issue Supplier PO</span>
          </button>
        </div>
      </div>

      {/* Supplier POs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Supplier Purchase Orders & Procurement AP Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">Procurement commitments cost-mapped to active Client Projects</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {supplierPos.length} Active Supplier POs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-5">Supplier PO & Entity</th>
                <th className="py-3 px-5">Vendor & Jurisdiction</th>
                <th className="py-3 px-5">Linked Client SOW</th>
                <th className="py-3 px-5 text-right">Committed Value</th>
                <th className="py-3 px-5 text-right">Billed (% Progress)</th>
                <th className="py-3 px-5 text-right">Remaining Headroom</th>
                <th className="py-3 px-5 text-center">Payment Terms</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-center">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.map((spo) => (
                <tr key={spo.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-gray-900 block">{spo.poNumber}</span>
                    <span className="text-gray-400 text-[11px] block">{spo.entity}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-gray-900 block">{spo.supplierName}</span>
                    <span className="text-gray-400 text-[11px] block">{spo.origin} · Tax: {spo.taxId}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-blue-700 block">{spo.linkedProject}</span>
                    <span className="text-gray-400 text-[11px] font-mono block">Client PO: {spo.linkedClientPo}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                    ${spo.committedUsd.toLocaleString()}
                    {spo.currency !== 'USD' && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        {spo.currency} {spo.committedNative.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-bold text-indigo-600">${spo.billedUsd.toLocaleString()}</span>
                    <div className="w-20 ml-auto bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, spo.billedPercent)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right font-semibold text-emerald-600">
                    ${spo.remainingUsd.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-center text-gray-600 text-[11px]">
                    {spo.terms}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      spo.status === 'Fulfilled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : spo.status === 'Active Drawdown'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : spo.status === 'Bill Overdue'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {spo.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenThreeWayMatch(spo)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                        title="3-Way Match Verification"
                      >
                        3-Way Match
                      </button>
                      <button
                        onClick={() => onViewSampleSupplierPo(spo)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                        title="View Official Purchase Order Specimen"
                      >
                        View PO
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceSupplierPOs;
