import React from 'react';

export default function DossierDocsTab({
  filteredDocs,
  docCategoryFilter,
  setDocCategoryFilter,
  docSearch,
  setDocSearch,
  onOpenUploadModal,
  onPreviewDoc,
  onDownloadDoc,
  onDeleteDoc,
  isAdmin
}) {
  return (
    <div className="space-y-5">
      {/* Docs Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {['ALL', 'MSA', 'License', 'Tax', 'Banking', 'NDA', 'Custom'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setDocCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl transition ${
                docCategoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
              }`}
            >
              {cat === 'ALL' ? 'All Documents' : cat}
            </button>
          ))}
        </div>

        {/* Search and Upload */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search attached docs..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc, idx) => {
            const isPdf = doc.name.toLowerCase().endsWith('.pdf');
            const isExcel = doc.name.toLowerCase().includes('xls') || doc.name.toLowerCase().includes('sheet');
            const isWord = doc.name.toLowerCase().includes('doc');

            return (
              <div
                key={doc.id || idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-4 group min-w-0 overflow-hidden"
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isPdf ? 'bg-red-50 text-red-600' : isExcel ? 'bg-emerald-50 text-emerald-600' : isWord ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {isPdf ? 'picture_as_pdf' : isExcel ? 'table_chart' : isWord ? 'description' : 'draft'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 break-words group-hover:text-blue-600 transition" title={doc.name}>
                          {doc.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1 truncate">
                          <span className="font-medium text-gray-600">{doc.category || 'General'}</span>
                          <span>•</span>
                          <span>{doc.size || '1.2 MB'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                      {doc.category || 'Dossier'}
                    </span>
                  </div>

                  {/* Expiry and Validity Status */}
                  <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Status / Expiration:</span>
                      <span className={`font-semibold ${
                        (doc.expiry || '').toLowerCase().includes('expir')
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-700'
                      }`}>
                        {doc.expiry || 'Active / Verified'}
                      </span>
                    </div>
                    {doc.uploadDate && (
                      <div className="flex items-center justify-between text-gray-400 text-[10px]">
                        <span>Attached On:</span>
                        <span>{doc.uploadDate}</span>
                      </div>
                    )}
                    {doc.notes && (
                      <div className="text-[10px] text-gray-600 italic pt-1 border-t border-gray-200/60 line-clamp-2">
                        "{doc.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onPreviewDoc(doc)}
                    className="text-[11px] font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 transition"
                  >
                    <span className="material-symbols-outlined text-[15px]">visibility</span>
                    <span>Inspect</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDownloadDoc(doc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Download Document"
                    >
                      <span className="material-symbols-outlined text-[17px]">download</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteDoc(doc)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Admin only: Delete from Dossier"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">folder_off</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm">No Documents Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No documents match your filter. Click "Upload Document" to attach official contracts, licenses, or custom files.
          </p>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="mt-2 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            + Attach New Document
          </button>
        </div>
      )}
    </div>
  );
}
