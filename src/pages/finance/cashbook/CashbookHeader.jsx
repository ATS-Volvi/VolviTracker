import React from 'react';
import { Link } from 'react-router-dom';

export default function CashbookHeader({
  activeCompany,
  canManageFinance,
  openRecordModal,
  onExportExcel,
  onExportCsv
}) {
  return (
    <>
      {/* Top Banner & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Cash Book & Cashflow Ledger
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Total Cashflow Engine
            </span>
            {activeCompany && (
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span>{activeCompany.country.split(' ')[1] || '🏢'}</span>
                <span>{activeCompany.name}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Realtime tracking of Cash Inflows, Vendor Outflows, Extra Payments (Salaries, Rent, Cloud, Taxes) & Net Total Cashflow
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canManageFinance && (
            <>
              <button
                onClick={() => openRecordModal('Inflow')}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                title="Record client collection or cash receipt"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span>+ Inflow (Receipt)</span>
              </button>

              <button
                onClick={() => openRecordModal('Outflow')}
                className="px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                title="Record direct vendor purchase order payment"
              >
                <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
                <span>- Vendor Outflow</span>
              </button>

              <button
                onClick={() => openRecordModal('ExtraPayment')}
                className="px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                title="Record salaries, payroll, office rent, utilities, cloud or tax payments"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>- Extra Payment (Salary / OpEx)</span>
              </button>
            </>
          )}

          <div className="inline-flex rounded-xl shadow-2xs border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={onExportExcel}
              className="px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition active:scale-95"
              title="Download Cash Book Excel (.XLSX)"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
              <span>Export Cash Book (.XLSX)</span>
            </button>
            <button
              onClick={onExportCsv}
              className="px-2.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition active:scale-95"
              title="Download Cash Book CSV"
            >
              .CSV
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-2 text-gray-500 font-medium flex-wrap">
          <Link to="/finance" className="hover:text-blue-600 transition flex items-center gap-1 font-semibold text-gray-600">
            <span className="material-symbols-outlined text-[16px] text-blue-600">account_tree</span>
            <span>Finance Hub</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-800 font-semibold">Cash Book Ledger</span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/finance/client"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Client Side (AR)</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/finance/supplier"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            <span>Supplier Side (AP)</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </>
  );
}
