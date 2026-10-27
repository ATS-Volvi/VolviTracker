import React from 'react';

export default function MasterDataKpis({
  masterDirectory,
  clientCount,
  supplierCount,
  kycComplianceStats,
  vaultVolumeStats,
  currencyStats,
  handleSelectSegment
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* KPI 1: Total Active Entities */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Total Active Entities</span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">{masterDirectory.length}</span>
          <span className="text-xs text-gray-500 font-medium">Entities in Master</span>
        </div>
        <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
          <button
            type="button"
            onClick={() => handleSelectSegment('CLIENTS')}
            className="flex items-center gap-1.5 hover:text-blue-600 transition"
            title="Filter Clients"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span><strong>{clientCount}</strong> Clients</span>
          </button>
          <span className="text-gray-300">•</span>
          <button
            type="button"
            onClick={() => handleSelectSegment('SUPPLIERS')}
            className="flex items-center gap-1.5 hover:text-emerald-600 transition"
            title="Filter Suppliers"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span><strong>{supplierCount}</strong> Suppliers</span>
          </button>
        </div>
      </div>

      {/* KPI 2: KYC & Compliance Standing */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">KYC & Compliance Standing</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
        </div>
        <div className="my-2.5 flex items-center gap-2">
          <span className="text-3xl font-extrabold text-emerald-600 font-display tracking-tight">
            {kycComplianceStats.rate}%
          </span>
          <span className={`px-2 py-0.5 rounded-full ${kycComplianceStats.gradeColor} text-[10px] font-bold uppercase tracking-wider`}>
            {kycComplianceStats.grade}
          </span>
        </div>
        <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
          <span className="text-emerald-700 font-semibold">{kycComplianceStats.verifiedCount} Fully Verified</span>
          <span className="text-gray-300">•</span>
          {kycComplianceStats.renewalCount > 0 ? (
            <span className="text-amber-600 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{kycComplianceStats.renewalCount} Renewal Req.</span>
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>0 Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI 3: Contract Vault Volume */}
      <div
        onClick={() => handleSelectSegment('VAULT')}
        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md cursor-pointer group"
        title="Click to view Document Vault"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600 transition">Contract Vault Volume</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">lock</span>
          </div>
        </div>
        <div className="my-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">{vaultVolumeStats.totalFiles}</span>
          <span className="text-xs text-gray-500 font-medium">Encrypted Files</span>
        </div>
        <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
          <span>{vaultVolumeStats.centralVaultCount} in Vault</span>
          <span className="text-gray-300">•</span>
          <span className="text-indigo-600 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">shield</span>
            <span>{vaultVolumeStats.directAttachedCount} Attached</span>
          </span>
        </div>
      </div>

      {/* KPI 4: Multi-Currency Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">Settlement Currencies</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
          </div>
        </div>
        <div className="my-2.5 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">
                {currencyStats.uniqueCount}
              </span>
              <span className="text-xs text-gray-500 font-medium">Currencies Active</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
              Multi-FX
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 flex overflow-hidden">
            {currencyStats.list.map(c => (
              <div
                key={c.currency}
                className={`${c.colors.bg} h-full transition-all`}
                style={{ width: `${c.percent}%` }}
                title={`${c.currency}: ${c.percent}% (${c.count} entities)`}
              />
            ))}
          </div>
        </div>
        <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-gray-600 overflow-x-auto gap-1">
          {currencyStats.list.slice(0, 4).map(c => (
            <span key={c.currency} className="flex items-center gap-1 whitespace-nowrap">
              <span className={`w-1.5 h-1.5 rounded-full ${c.colors.dot}`}></span>
              <span className={c.colors.text}>{c.currency}</span> {c.percent}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
