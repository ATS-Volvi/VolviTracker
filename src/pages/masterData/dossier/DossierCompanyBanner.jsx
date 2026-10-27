import React from 'react';

export default function DossierCompanyBanner({
  company,
  isClient,
  attachedDocsCount,
  notesCount
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0 ${
          isClient ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {company.avatarText || company.name.substring(0, 2).toUpperCase()}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 font-display tracking-tight">
              {company.name}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isClient ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {company.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 font-mono">
              {company.id}
            </span>
            {company.globalEntityId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono flex items-center gap-1" title="Global Legal Entity Identifier (LEI / D-U-N-S®)">
                <span className="material-symbols-outlined text-[13px]">corporate_fare</span>
                <span>LEI/DUNS: {company.globalEntityId}</span>
              </span>
            )}
            {company.taxId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60 font-mono" title={company.taxAuthority ? `Tax ID (${company.taxAuthority})` : 'Tax / Regulatory ID'}>
                Tax: {company.taxId}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{company.compliance || 'Active Verified'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <span className="material-symbols-outlined text-[15px] text-gray-400">public</span>
              <span>{company.country}</span>
            </span>
            <span>•</span>
            <a
              href={`mailto:${company.contactEmail || company.companyMail}`}
              className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
            >
              <span className="material-symbols-outlined text-[15px] text-gray-400">mail</span>
              <span>{company.contactEmail || company.companyMail || `contact@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 shrink-0">
        <div className="px-3 py-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Documents</div>
          <div className="text-base font-black text-gray-900 mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-blue-600">folder_open</span>
            <span>{attachedDocsCount}</span>
          </div>
        </div>

        <div className="px-3 py-1 border-l border-gray-200">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Notes & Logs</div>
          <div className="text-base font-black text-gray-900 mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-indigo-600">notes</span>
            <span>{notesCount}</span>
          </div>
        </div>

        <div className="px-3 py-1 border-l border-gray-200">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Currency</div>
          <div className="text-base font-black text-blue-600 font-mono mt-0.5">
            {company.currency || 'USD'}
          </div>
        </div>

        <div className="px-3 py-1 border-l border-gray-200">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Settlement Terms</div>
          <div className="text-xs font-bold text-gray-800 mt-1 truncate max-w-[100px]" title={company.creditTerms}>
            {company.creditTerms || 'Net 30'}
          </div>
        </div>
      </div>
    </div>
  );
}
