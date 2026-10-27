import React from 'react';

export default function CashflowCompanyRibbon({
  companyList,
  visibleCompanyList,
  rawTransactionsCount,
  selectedCompanyId,
  companyCategoryFilter,
  companySearchQuery,
  setCompanyCategoryFilter,
  setCompanySearchQuery,
  handleSelectCompany
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">domain</span>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-display">
              Company & Partner Cashflow View
            </h2>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Isolate transactions and calculate cashflow specifically for any client, vendor or entity
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCompanyCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                companyCategoryFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({companyList.length})
            </button>
            <button
              onClick={() => setCompanyCategoryFilter('Client')}
              className={`px-2.5 py-1 rounded-lg transition ${
                companyCategoryFilter === 'Client'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-blue-700'
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setCompanyCategoryFilter('Supplier')}
              className={`px-2.5 py-1 rounded-lg transition ${
                companyCategoryFilter === 'Supplier'
                  ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-indigo-700'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setCompanyCategoryFilter('Operating Entity')}
              className={`px-2.5 py-1 rounded-lg transition ${
                companyCategoryFilter === 'Operating Entity'
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-purple-700'
              }`}
            >
              Entities
            </button>
          </div>

          <div className="relative w-48 sm:w-56">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
              placeholder="Find company..."
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Company Ribbon Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
        <div
          onClick={() => handleSelectCompany('ALL')}
          className={`p-3 rounded-xl border transition cursor-pointer relative text-left group ${
            selectedCompanyId === 'ALL'
              ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-2 ring-blue-500/20'
              : 'border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="w-6 h-6 rounded-lg bg-gray-900 text-white font-bold text-[10px] flex items-center justify-center">
              ALL
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rollup</span>
          </div>
          <div className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition">
            All Companies
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5 truncate">
            {rawTransactionsCount} Total Vouchers
          </div>
        </div>

        {visibleCompanyList.map(comp => {
          const isSelected = selectedCompanyId === comp.id || selectedCompanyId === comp.name;
          const isClient = comp.category === 'Client';
          const isSupplier = comp.category === 'Supplier';

          return (
            <div
              key={comp.id}
              onClick={() => handleSelectCompany(comp.id)}
              className={`p-3 rounded-xl border transition cursor-pointer relative text-left group ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-500/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center ${
                  isClient ? 'bg-blue-100 text-blue-800' : isSupplier ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {comp.avatarText}
                </span>
                <span className="text-xs">{comp.country.split(' ')[1] || '🌐'}</span>
              </div>

              <div className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700 transition" title={comp.name}>
                {comp.name}
              </div>

              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className={`font-semibold ${isClient ? 'text-blue-600' : isSupplier ? 'text-indigo-600' : 'text-purple-600'}`}>
                  {comp.category}
                </span>
                <span className="font-mono font-bold text-gray-700">
                  {comp.currency}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
