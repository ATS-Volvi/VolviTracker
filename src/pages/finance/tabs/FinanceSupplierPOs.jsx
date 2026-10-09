import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FinanceSupplierPOs = ({
  supplierPos = [],
  paymentsMade = [],
  activeSubTab: controlledTab,
  onTabChange,
  onOpenIssueSupplierPo,
  onOpenThreeWayMatch,
  onOpenRecordSupplierPayment,
  onViewSampleSupplierPo
}) => {
  const [internalTab, setInternalTab] = useState('POS');
  const activeSubTab = controlledTab || internalTab;
  const setActiveSubTab = (tab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState('ALL');

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

  // Distinct suppliers
  const allSuppliers = Array.from(new Set([
    ...supplierPos.map(s => s.supplierName),
    ...paymentsMade.map(p => p.supplierName)
  ])).filter(Boolean);

  // AP Ageing Calculations
  const ageingData = supplierPos.map(spo => {
    const isSettled = spo.paymentStatus === 'Paid' || spo.status === 'Fulfilled';
    const amountDue = isSettled ? 0 : (spo.remainingNative || spo.totalValueUsd || 0);
    const dueDate = new Date(spo.paymentTermsDueDate || spo.issueDate || '2024-03-30');
    const now = new Date();
    const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    const daysOverdue = isSettled ? 0 : Math.max(0, diffDays);

    let bucket = 'current';
    if (!isSettled) {
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';
    }

    return {
      ...spo,
      daysOverdue,
      amountDue,
      bucket
    };
  });

  const totalApOutstanding = ageingData.reduce((acc, s) => acc + s.amountDue, 0);
  const currentTotal = ageingData.filter(s => s.bucket === 'current' && s.paymentStatus !== 'Paid').reduce((acc, s) => acc + s.amountDue, 0);
  const d1to30Total = ageingData.filter(s => s.bucket === '1-30').reduce((acc, s) => acc + s.amountDue, 0);
  const d31to60Total = ageingData.filter(s => s.bucket === '31-60').reduce((acc, s) => acc + s.amountDue, 0);
  const d61to90Total = ageingData.filter(s => s.bucket === '61-90').reduce((acc, s) => acc + s.amountDue, 0);
  const d90PlusTotal = ageingData.filter(s => s.bucket === '90+').reduce((acc, s) => acc + s.amountDue, 0);

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

      {/* Sub-tab 4: AP Ageing Schedule */}
      {activeSubTab === 'AGEING' && (
        <div className="space-y-6">
          {/* Ageing KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total AP Outstanding</span>
              <div className="text-xl font-extrabold text-gray-900 font-mono">${Math.round(totalApOutstanding).toLocaleString()}</div>
              <p className="text-[10px] text-gray-400">All supplier commitments</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Current (0-30d)</span>
              <div className="text-xl font-extrabold text-emerald-700 font-mono">${Math.round(currentTotal).toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600">Within payment term</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">1 - 30 Days Due</span>
              <div className="text-xl font-extrabold text-blue-700 font-mono">${Math.round(d1to30Total).toLocaleString()}</div>
              <p className="text-[10px] text-blue-500">Upcoming invoice run</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">31 - 60 Days</span>
              <div className="text-xl font-extrabold text-amber-700 font-mono">${Math.round(d31to60Total).toLocaleString()}</div>
              <p className="text-[10px] text-amber-500">Review cashflow</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">61 - 90 Days</span>
              <div className="text-xl font-extrabold text-orange-700 font-mono">${Math.round(d61to90Total).toLocaleString()}</div>
              <p className="text-[10px] text-orange-500">Payment prioritized</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">90+ Days Critical</span>
              <div className="text-xl font-extrabold text-rose-700 font-mono">${Math.round(d90PlusTotal).toLocaleString()}</div>
              <p className="text-[10px] text-rose-500">Urgent vendor release</p>
            </div>
          </div>

          {/* Ageing by Supplier Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Supplier Accounts Payable Ageing Schedule</h3>
                <p className="text-xs text-gray-400 mt-0.5">Procurement liabilities categorized by age past agreed payment terms</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {allSuppliers.length} Creditors
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
                  {allSuppliers.map((supplier) => {
                    const supPos = ageingData.filter(s => s.supplierName === supplier);
                    const cur = supPos.filter(s => s.bucket === 'current' && s.paymentStatus !== 'Paid').reduce((a, b) => a + b.amountDue, 0);
                    const b1 = supPos.filter(s => s.bucket === '1-30').reduce((a, b) => a + b.amountDue, 0);
                    const b2 = supPos.filter(s => s.bucket === '31-60').reduce((a, b) => a + b.amountDue, 0);
                    const b3 = supPos.filter(s => s.bucket === '61-90').reduce((a, b) => a + b.amountDue, 0);
                    const b4 = supPos.filter(s => s.bucket === '90+').reduce((a, b) => a + b.amountDue, 0);
                    const tot = cur + b1 + b2 + b3 + b4;

                    return (
                      <tr key={supplier} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {supplier}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                          {cur > 0 ? `$${Math.round(cur).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-blue-700">
                          {b1 > 0 ? `$${Math.round(b1).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                          {b2 > 0 ? `$${Math.round(b2).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-orange-700">
                          {b3 > 0 ? `$${Math.round(b3).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-rose-700 font-bold">
                          {b4 > 0 ? `$${Math.round(b4).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-gray-900">
                          ${Math.round(tot).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setActiveSubTab('STATEMENTS');
                              setSelectedStatementSupplier(supplier);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                          >
                            Statement
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
