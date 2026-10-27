import React from 'react';

export default function DossierTabsNav({
  activeTab,
  setActiveTab,
  attachedDocsCount,
  notesCount,
  stakeholdersCount
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-100 pt-2 text-xs font-bold overflow-x-auto">
      <button
        type="button"
        onClick={() => setActiveTab('DOCS')}
        className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
          activeTab === 'DOCS'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-900'
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">folder_special</span>
        <span>Attached Documents & Files</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          activeTab === 'DOCS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
        }`}>
          {attachedDocsCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('TEXT_INFO')}
        className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
          activeTab === 'TEXT_INFO'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-900'
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">description</span>
        <span>Text Info & Notes</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          activeTab === 'TEXT_INFO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
        }`}>
          {notesCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('STAKEHOLDERS')}
        className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
          activeTab === 'STAKEHOLDERS'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-900'
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">badge</span>
        <span>Key Stakeholders</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
          {stakeholdersCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('BANKING')}
        className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
          activeTab === 'BANKING'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-900'
        }`}
      >
        <span className="material-symbols-outlined text-[17px]">account_balance</span>
        <span>Banking & Remittance</span>
      </button>
    </div>
  );
}
