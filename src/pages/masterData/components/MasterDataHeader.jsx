import React from 'react';

export default function MasterDataHeader({
  activeSegment,
  exportRegistry,
  onOpenAddSupplier,
  onOpenAddClient
}) {
  const isEmployees = activeSegment === 'EMPLOYEES';
  const isSuppliers = activeSegment === 'SUPPLIERS';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Governance & Master Data</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className={`font-bold ${
            isEmployees ? 'text-purple-600' : isSuppliers ? 'text-emerald-600' : 'text-blue-600'
          }`}>
            {isEmployees
              ? 'User Management'
              : isSuppliers
              ? 'Suppliers'
              : 'Clients'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
            {isEmployees
              ? 'User Management'
              : isSuppliers
              ? 'Suppliers Directory'
              : 'Clients Directory'}
          </h1>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            isEmployees
              ? 'bg-purple-100 text-purple-800'
              : isSuppliers
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isEmployees
              ? 'Access Control'
              : isSuppliers
              ? 'Vendor Registry'
              : 'Client Registry'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          {isEmployees
            ? 'Centralized master governance for internal staff, client contacts, and supplier users with role-based access control.'
            : isSuppliers
            ? 'Centralized master governance for vendor accounts, settlement terms, tax profiles, and compliance dossiers.'
            : 'Centralized master governance for client accounts, credit limits, settlement defaults, bank mandates, and compliance dossiers.'}
        </p>
      </div>

      {/* Global Quick Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={exportRegistry}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Download Excel spreadsheet master data export (.xlsx)"
        >
          <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
          <span>Export Registry</span>
        </button>

        {isSuppliers && (
          <button
            type="button"
            onClick={onOpenAddSupplier}
            className="px-3.5 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">domain_add</span>
            <span>+ Add Supplier</span>
          </button>
        )}

        {!isEmployees && !isSuppliers && (
          <button
            type="button"
            onClick={onOpenAddClient}
            className="px-4 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Add Client</span>
          </button>
        )}
      </div>
    </div>
  );
}
