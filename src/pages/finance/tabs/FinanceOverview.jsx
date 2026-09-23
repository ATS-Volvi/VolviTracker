import React, { useState } from 'react';

const FinanceOverview = ({
  kpis,
  exchangeRates,
  projects,
  clientPos,
  supplierPos,
  onOpenRegisterClientPo,
  onOpenIssueSupplierPo,
  onOpenGenerateInvoice,
  onViewSampleInvoice
}) => {
  const [currencyMode, setCurrencyMode] = useState('USD'); // 'USD' | 'NATIVE'

  const formatCurrency = (valUsd, nativeVal, nativeCurrency) => {
    if (currencyMode === 'NATIVE' && nativeVal && nativeCurrency) {
      return `${nativeCurrency} ${nativeVal.toLocaleString()}`;
    }
    return `$${valUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Realtime Receivables / Payables Cash Velocity Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outstanding Receivables (AR) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Outstanding Receivables (AR)
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                  ${kpis.arOutstanding.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-rose-500">
                  (Overdue: ${kpis.arOverdue.toLocaleString()} across 3 accounts)
                </span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-mono text-gray-400">DSO Target: 45d</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">trending_down</span> Current: {kpis.dsoDays} Days
            </span>
          </div>
        </div>

        {/* Outstanding Payables (AP) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Outstanding Payables (AP)
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                  ${kpis.apOutstanding.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-rose-500">
                  (Overdue: ${kpis.apOverdue.toLocaleString()} supplier bills)
                </span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-mono text-gray-400">DPO Target: 30d</span>
            <span className="text-xs text-blue-600 font-bold flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">check_circle</span> Current: {kpis.dpoDays} Days
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Top KPI Summary Cards (Bento 6-Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Client PO Total */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Client PO Total</span>
              <span className="material-symbols-outlined text-blue-600 text-[18px]">request_quote</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display tracking-tight">$4.85M</div>
            <div className="text-[11px] text-gray-400 mt-0.5 font-medium">{clientPos.length} Active Sales POs</div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">trending_up</span> +14.2% YoY
            </span>
            <span className="text-[10px] text-gray-400">Cap Base</span>
          </div>
        </div>

        {/* 2. Invoiced to Clients */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Invoiced Total</span>
              <span className="material-symbols-outlined text-indigo-600 text-[18px]">receipt</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display tracking-tight">$3.42M</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">70.5% PO Drawdown Rate</div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium">Unbilled: $1.43M</span>
            <span className="text-[10px] font-bold text-gray-400">Milestones</span>
          </div>
        </div>

        {/* 3. Collections */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Collected Cash</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">account_balance_wallet</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-display tracking-tight">$2.98M</div>
            <div className="text-[11px] text-gray-400 mt-0.5 font-medium">87.1% Collection Efficiency</div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium">AR Open: $440k</span>
            <span className="text-[10px] font-bold text-emerald-600">Liquid Cash</span>
          </div>
        </div>

        {/* 4. Supplier PO Committed */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Supplier POs</span>
              <span className="material-symbols-outlined text-amber-600 text-[18px]">shopping_bag</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display tracking-tight">$2.12M</div>
            <div className="text-[11px] text-gray-400 mt-0.5 font-medium">{supplierPos.length} Vendor Purchase Orders</div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-amber-600 font-bold">Cost Mapped</span>
            <span className="text-[10px] text-gray-400">AP Bounds</span>
          </div>
        </div>

        {/* 5. Supplier Billed */}
        <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Supplier Billed</span>
              <span className="material-symbols-outlined text-purple-600 text-[18px]">inventory</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display tracking-tight">$1.65M</div>
            <div className="text-[11px] text-gray-400 mt-0.5 font-medium">Paid: $1.34M (81.2%)</div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-500">AP Due: $310k</span>
            <span className="text-[10px] font-bold text-purple-600">3-Way Match</span>
          </div>
        </div>

        {/* 6. Gross Profit & Margin */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-4 rounded-xl shadow-xs text-white flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between text-blue-200 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Gross Margin</span>
              <span className="material-symbols-outlined text-amber-300 text-[18px]">verified</span>
            </div>
            <div className="text-2xl font-black text-white font-display tracking-tight">$1.77M</div>
            <div className="text-[11px] text-emerald-300 font-bold mt-0.5">51.8% Realized Margin</div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-blue-200">Target: &gt; 45%</span>
            <span className="text-[10px] font-bold text-emerald-300">Surpassed ✓</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Multi-Currency Exposure & Real-Time FX Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Multi-Currency Treasury Book */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">currency_exchange</span>
              <h3 className="text-sm font-bold text-gray-900 font-display">Multi-Currency Exposure & Sovereign Treasury</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setCurrencyMode('USD')}
                className={`px-2.5 py-1 rounded-md transition ${currencyMode === 'USD' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                USD Base
              </button>
              <button
                onClick={() => setCurrencyMode('NATIVE')}
                className={`px-2.5 py-1 rounded-md transition ${currencyMode === 'NATIVE' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Native FX
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <span>🇺🇸</span> <span>USD Exposure</span>
              </div>
              <div className="text-lg font-black text-gray-900 mt-1 font-display">$2.95M</div>
              <div className="text-[10px] text-gray-400 mt-0.5">60.8% of Treasury Book</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <span>🇦🇪</span> <span>UAE (AED)</span>
              </div>
              <div className="text-lg font-black text-gray-900 mt-1 font-display">
                {currencyMode === 'NATIVE' ? 'د.إ 4.20M' : '$1.14M'}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Fixed Peg: 3.6725</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <span>🇸🇦</span> <span>KSA (SAR)</span>
              </div>
              <div className="text-lg font-black text-gray-900 mt-1 font-display">
                {currencyMode === 'NATIVE' ? '﷼ 1.90M' : '$506k'}
              </div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Fixed Peg: 3.7500</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <span>🇮🇳</span> <span>India (INR)</span>
              </div>
              <div className="text-lg font-black text-gray-900 mt-1 font-display">
                {currencyMode === 'NATIVE' ? '₹ 3.80 Cr' : '$456k'}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">Rate: ₹83.20 / USD</div>
            </div>
          </div>

          {/* PO Waterfall Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
              <span>Overall PO Drawdown & Conversion Velocity</span>
              <span className="font-bold text-gray-900">70.5% Realized</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: '61.4%' }} title="Collected: $2.98M"></div>
              <div className="bg-blue-500 h-full" style={{ width: '9.1%' }} title="Pending AR: $440k"></div>
              <div className="bg-gray-300 h-full" style={{ width: '29.5%' }} title="Unbilled SOW: $1.43M"></div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-gray-500 pt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Collected ($2.98M)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Invoiced / Pending AR ($440k)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> Unbilled SOW Cap ($1.43M)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Compliance Status */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 font-display">Operations Quick Actions</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                Institutional
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenRegisterClientPo}
                className="w-full px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center justify-between border border-blue-100"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                  <span>Register Client Sales PO</span>
                </div>
                <span className="text-[11px] text-blue-500 font-normal">SOW Cap</span>
              </button>

              <button
                onClick={onOpenGenerateInvoice}
                className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition flex items-center justify-between border border-emerald-100"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">flash_on</span>
                  <span>Auto-Gen Drawdown Invoice</span>
                </div>
                <span className="text-[11px] text-emerald-500 font-normal">Milestone</span>
              </button>

              <button
                onClick={onOpenIssueSupplierPo}
                className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition flex items-center justify-between border border-indigo-100"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                  <span>Issue Supplier PO (Procurement)</span>
                </div>
                <span className="text-[11px] text-indigo-500 font-normal">Cost Mapped</span>
              </button>

              <button
                onClick={onViewSampleInvoice}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition flex items-center justify-between border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  <span>View Sample Tax Invoice</span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">FTA/ZATCA</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
              <span className="text-gray-700 font-medium">Statutory Compliance</span>
            </div>
            <span className="text-emerald-700 font-bold text-[11px]">100% Audit Ready</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Active Client POs Snapshot Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-display">Active Client Purchase Orders & Drawdown Status</h3>
            <p className="text-xs text-gray-400 mt-0.5">SOW contract limits, drawdown milestones, and unbilled headroom</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {clientPos.length} Tracked POs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-5">Client PO #</th>
                <th className="py-3 px-5">Client & Territory</th>
                <th className="py-3 px-5">Project SOW Scope</th>
                <th className="py-3 px-5 text-right">Total PO Value</th>
                <th className="py-3 px-5 text-right">Invoiced & Drawdown</th>
                <th className="py-3 px-5 text-right">Remaining Headroom</th>
                <th className="py-3 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {clientPos.slice(0, 4).map((cpo) => (
                <tr key={cpo.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-gray-900">{cpo.poNumber}</td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-gray-900">{cpo.clientName}</span>
                    <span className="text-gray-400 text-[11px] block">{cpo.flag} {cpo.country}</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 max-w-xs truncate">{cpo.scope}</td>
                  <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                    {cpo.currency} {cpo.totalValueNative.toLocaleString()}
                    <span className="text-[10px] text-gray-400 block font-normal">≈ ${cpo.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-bold text-blue-600">{cpo.drawdownPercent}%</span>
                    <span className="text-[10px] text-gray-400 block font-normal">{cpo.currency} {cpo.invoicedNative.toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-semibold text-emerald-600">{cpo.currency} {cpo.remainingNative.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 block font-normal">{cpo.remainingPercent}% Left</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceOverview;
