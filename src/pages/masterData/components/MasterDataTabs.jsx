import React from 'react';

export default function MasterDataTabs({
  activeSegment,
  handleSelectSegment,
  clientCount,
  supplierCount,
  employeeCount
}) {
  return (
    <div className="inline-flex p-1 bg-gray-200/80 rounded-xl gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => handleSelectSegment('CLIENTS')}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
          activeSegment === 'CLIENTS'
            ? 'bg-white text-blue-600 shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">person</span>
        <span>Clients</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          activeSegment === 'CLIENTS'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-300 text-gray-700'
        }`}>
          {clientCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectSegment('SUPPLIERS')}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
          activeSegment === 'SUPPLIERS'
            ? 'bg-white text-emerald-600 shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">local_shipping</span>
        <span>Suppliers</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          activeSegment === 'SUPPLIERS'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-300 text-gray-700'
        }`}>
          {supplierCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectSegment('EMPLOYEES')}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
          activeSegment === 'EMPLOYEES'
            ? 'bg-white text-purple-600 shadow-xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">badge</span>
        <span>User Management</span>
        {employeeCount !== undefined && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeSegment === 'EMPLOYEES'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-300 text-gray-700'
          }`}>
            {employeeCount}
          </span>
        )}
      </button>
    </div>
  );
}
