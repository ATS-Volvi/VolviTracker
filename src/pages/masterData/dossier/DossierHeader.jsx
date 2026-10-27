import React from 'react';

export default function DossierHeader({
  company,
  isAdmin,
  isClient,
  onBack,
  onOpenUploadModal,
  onOpenAddNote,
  onOpenDeleteModal
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-2xs transition flex items-center gap-1.5 text-xs font-semibold"
          title="Return to Directory"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <span>Master Data</span>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <span className={isClient ? 'text-blue-600 font-bold' : 'text-emerald-600 font-bold'}>
            {company.category}s
          </span>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <span className="text-gray-900 font-bold truncate max-w-xs">{company.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenDeleteModal}
            className="px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
            title="Admin only: Permanently delete this entity from Master Directory"
          >
            <span className="material-symbols-outlined text-[17px] text-rose-600">delete_forever</span>
            <span>Delete Entity</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenUploadModal}
          className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
          <span>Attach Extra Document</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddNote}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl shadow-2xs transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[17px] text-gray-500">edit_note</span>
          <span>Add Text Note</span>
        </button>
      </div>
    </div>
  );
}
