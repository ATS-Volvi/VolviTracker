import React from 'react';

export default function CashflowStatsCards({ stats }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 font-display flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">account_balance_wallet</span>
            <span>Total Cashflow Calculation Engine</span>
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Live calculation of Total Inflow, Vendor PO Outflow, Extra Payments (Salaries & Overheads), and Net Cashflow
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Statement Health:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
            {stats.reconRate}% Reconciled
          </span>
        </div>
      </div>

      {/* Four Calculation Pillar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Total Inflow */}
        <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              1. Total Inflow (Receipts)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-display mt-2 font-mono">
            +${stats.totalInflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-emerald-800/80 mt-1">
            Client collections, milestone wires & advances
          </div>
        </div>

        {/* Pillar 2: Vendor Outflows */}
        <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              2. Vendor Outflows
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-display mt-2 font-mono">
            -${stats.totalVendorOutflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-rose-800/80 mt-1">
            Direct supplier POs & subcontractor payments
          </div>
        </div>

        {/* Pillar 3: Extra Payments (Salaries & OpEx) */}
        <div className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              3. Extra Payments (Salaries & OpEx)
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">payments</span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 font-display mt-2 font-mono">
            -${stats.totalExtraPaymentsUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-purple-800/80 mt-1">
            Salaries, office rent, AWS cloud, taxes & duties
          </div>
        </div>

        {/* Pillar 4: Total Net Cashflow */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            stats.netCashflowUsd >= 0
              ? 'border-blue-300 bg-blue-50/50'
              : 'border-amber-300 bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                stats.netCashflowUsd >= 0 ? 'text-blue-900' : 'text-amber-900'
              }`}
            >
              = Total Net Cashflow
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                stats.netCashflowUsd >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">balance</span>
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold font-display mt-2 font-mono ${
              stats.netCashflowUsd >= 0 ? 'text-gray-900' : 'text-rose-600'
            }`}
          >
            {stats.netCashflowUsd >= 0 ? '+' : ''}${stats.netCashflowUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            Inflows minus all outflows ({stats.netMarginPercent}% net margin)
          </div>
        </div>
      </div>

      {/* Visual Cashflow Formula Bar */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap font-mono font-semibold">
          <span className="text-gray-500 font-sans text-[11px] font-bold uppercase">Formula:</span>
          <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
            +${Math.round(stats.totalInflowUsd).toLocaleString()} (Inflows)
          </span>
          <span className="text-gray-400 font-bold">-</span>
          <span className="text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded">
            ${Math.round(stats.totalVendorOutflowUsd).toLocaleString()} (Vendor Outflow)
          </span>
          <span className="text-gray-400 font-bold">-</span>
          <span className="text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
            ${Math.round(stats.totalExtraPaymentsUsd).toLocaleString()} (Extra Payments)
          </span>
          <span className="text-gray-400 font-bold">=</span>
          <span
            className={`px-2.5 py-0.5 rounded font-extrabold ${
              stats.netCashflowUsd >= 0
                ? 'bg-blue-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {stats.netCashflowUsd >= 0 ? '+' : ''}${Math.round(stats.netCashflowUsd).toLocaleString()} Net
          </span>
        </div>

        <div className="text-gray-500 text-[11px] font-medium">
          Total Combined Disbursements: <strong className="text-gray-900 font-mono">-${Math.round(stats.totalOutflowUsd).toLocaleString()}</strong>
        </div>
      </div>
    </div>
  );
}
