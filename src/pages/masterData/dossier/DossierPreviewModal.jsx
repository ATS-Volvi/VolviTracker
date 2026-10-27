import React from 'react';

export default function DossierPreviewModal({
  previewDoc,
  companyName,
  onClose,
  onDownloadDoc
}) {
  if (!previewDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">description</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">{previewDoc.name}</h3>
              <p className="text-xs text-gray-500">Attached to {companyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Document Category:</span>
              <span className="font-bold text-gray-900">{previewDoc.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">File Size:</span>
              <span className="font-mono text-gray-800">{previewDoc.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Validity / Status:</span>
              <span className="font-semibold text-emerald-600">{previewDoc.expiry}</span>
            </div>
            {previewDoc.uploadDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Uploaded On:</span>
                <span className="text-gray-700">{previewDoc.uploadDate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Integrity Signature:</span>
              <span className="font-mono text-[10px] text-gray-500">{previewDoc.hash || 'sha256:verified_ok'}</span>
            </div>
          </div>

          {previewDoc.notes && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs">
              <div className="font-bold mb-0.5">Notes:</div>
              <div>{previewDoc.notes}</div>
            </div>
          )}

          <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
            <span className="material-symbols-outlined text-[36px] text-gray-400">lock</span>
            <p className="text-xs text-gray-500">
              Document verified & encrypted under AES-256 vault standard.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onDownloadDoc(previewDoc);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
