import React from 'react';

export default function DossierUploadModal({
  isOpen,
  onClose,
  companyName,
  onSubmit,
  newDocTitle,
  setNewDocTitle,
  newDocCategory,
  setNewDocCategory,
  newDocExpiry,
  setNewDocExpiry,
  newDocNotes,
  setNewDocNotes,
  newDocFileName,
  newDocFileSize,
  onFileSelect
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">upload_file</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Attach Extra Document</h3>
              <p className="text-xs text-gray-500">Adding to {companyName}'s dedicated dossier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 text-xs">
          {/* File Dropzone */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Choose File</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-500 transition bg-gray-50/50">
              <input
                type="file"
                id="company-doc-file"
                className="hidden"
                onChange={onFileSelect}
              />
              <label htmlFor="company-doc-file" className="cursor-pointer block space-y-1">
                <span className="material-symbols-outlined text-gray-400 text-[32px]">cloud_upload</span>
                <div className="text-xs font-bold text-blue-600">
                  {newDocFileName || 'Click to browse files (PDF, DOCX, XLSX, PNG)'}
                </div>
                {newDocFileSize && (
                  <div className="text-[10px] text-gray-500 font-medium">Selected size: {newDocFileSize}</div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Commercial Registry Certificate 2026"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Category *</label>
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
              >
                <option value="MSA">MSA / Contract</option>
                <option value="KYC">KYC & Compliance Dossier</option>
                <option value="License">Commercial License / CR</option>
                <option value="Tax">Tax Exemption / VAT</option>
                <option value="Banking">Banking Mandate</option>
                <option value="NDA">Mutual NDA</option>
                <option value="Custom">Custom / Extra Document</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={newDocExpiry}
                onChange={(e) => setNewDocExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Notes / Description for this Document</label>
            <textarea
              rows={2}
              value={newDocNotes}
              onChange={(e) => setNewDocNotes(e.target.value)}
              placeholder="e.g. Executed and stamped by Managing Director on Sept 25th"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition"
            >
              Save to Company Dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
