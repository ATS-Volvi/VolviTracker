import React from 'react';

export default function MasterDataHeader({
  activeSegment,
  exportRegistry,
  onOpenUploadVault,
  onOpenAddSupplier,
  onOpenAddClient
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Governance & Master Data</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-blue-600 font-bold">Client & Supplier Directory</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
            Master Data Directory & Document Vault
          </h1>
          <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Authoritative Registry
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Centralized master governance for Client & Supplier records, credit limits, settlement defaults, bank mandates, and regulatory compliance dossiers.
        </p>
      </div>

      {/* Global Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={exportRegistry}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          title="Download Excel spreadsheet master data export (.xlsx)"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
          <span>Export Registry</span>
        </button>

        <button
          type="button"
          onClick={onOpenUploadVault}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-indigo-600">cloud_upload</span>
          <span>Upload to Vault</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddSupplier}
          className={`px-3.5 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
            activeSegment === 'SUPPLIERS'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
              : 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-semibold'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain_add</span>
          <span>+ Add Supplier</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddClient}
          className={`px-4 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
            activeSegment === 'SUPPLIERS'
              ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-semibold'
              : 'bg-blue-600 hover:bg-blue-700 text-white font-bold'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>+ Add Client</span>
        </button>
      </div>
    </div>
  );
}
