import React from 'react';

export default function CashflowCategoryBreakdown({
  stats,
  streamFilter,
  extraCategoryFilter,
  setStreamFilter,
  setExtraCategoryFilter
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-purple-600 text-[16px]">tune</span>
          <span>Extra Payments Categorical Breakdown (Salaries & Operational Overheads)</span>
        </span>
        <span className="text-[11px] font-bold text-purple-700 font-mono">
          Total Extra: ${Math.round(stats.totalExtraPaymentsUsd).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        {/* Salary Payments */}
        <div
          onClick={() => {
            setStreamFilter('Extra');
            setExtraCategoryFilter(extraCategoryFilter === 'Salary' ? 'all' : 'Salary');
          }}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            extraCategoryFilter === 'Salary'
              ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
              : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 uppercase">
            <span className="material-symbols-outlined text-[14px]">badge</span>
            <span>Salaries & Payroll</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
            ${Math.round(stats.salaryPaymentsUsd).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Staff salaries & stipends</div>
        </div>

        {/* Office Rent */}
        <div
          onClick={() => {
            setStreamFilter('Extra');
            setExtraCategoryFilter(extraCategoryFilter === 'Rent' ? 'all' : 'Rent');
          }}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            extraCategoryFilter === 'Rent'
              ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
              : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 uppercase">
            <span className="material-symbols-outlined text-[14px]">apartment</span>
            <span>Office Rent & Lease</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
            ${Math.round(stats.rentPaymentsUsd).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Corporate workspace leases</div>
        </div>

        {/* Cloud & Software */}
        <div
          onClick={() => {
            setStreamFilter('Extra');
            setExtraCategoryFilter(extraCategoryFilter === 'Cloud' ? 'all' : 'Cloud');
          }}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            extraCategoryFilter === 'Cloud'
              ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
              : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 uppercase">
            <span className="material-symbols-outlined text-[14px]">cloud</span>
            <span>Cloud & IT Hosting</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
            ${Math.round(stats.cloudPaymentsUsd).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">AWS, servers & SaaS licenses</div>
        </div>

        {/* Taxes & Duties */}
        <div
          onClick={() => {
            setStreamFilter('Extra');
            setExtraCategoryFilter(extraCategoryFilter === 'Tax' ? 'all' : 'Tax');
          }}
          className={`p-2.5 rounded-xl border transition cursor-pointer ${
            extraCategoryFilter === 'Tax'
              ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-500/20 shadow-2xs'
              : 'border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 uppercase">
            <span className="material-symbols-outlined text-[14px]">account_balance</span>
            <span>Tax & Statutory</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
            ${Math.round(stats.taxPaymentsUsd).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Advance tax, GST & duties</div>
        </div>

        {/* Miscellaneous & Petty Cash */}
        <div
          onClick={() => {
            setStreamFilter('Extra');
            setExtraCategoryFilter('all');
          }}
          className="p-2.5 rounded-xl border border-gray-200/80 bg-gray-50 hover:bg-white hover:border-gray-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-700 uppercase">
            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
            <span>General Overheads</span>
          </div>
          <div className="text-sm font-extrabold text-gray-900 font-mono mt-1">
            ${Math.round(stats.otherExtraUsd).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">Petty cash, travel, utilities</div>
        </div>
      </div>
    </div>
  );
}
