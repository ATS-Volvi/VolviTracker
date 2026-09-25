import React, { useState } from 'react';

const UploadVaultModal = ({
  isOpen,
  onClose,
  onUpload,
  entities = []
}) => {
  const [selectedEntity, setSelectedEntity] = useState(entities[0]?.name || '');
  const [category, setCategory] = useState('MSA');
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const docName = fileName.trim() || title.trim() || 'Official_Regulatory_Filing.pdf';
    const newDoc = {
      id: `DOC-V-${Date.now()}`,
      title: title.trim() || docName,
      category,
      entityName: selectedEntity || 'Global Corporate',
      fileType: 'PDF',
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      updatedDate: issueDate,
      expiryDate,
      hash: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 4)}`,
      tags: [category, selectedEntity, 'Verified'],
      url: '#'
    };

    onUpload(newDoc, selectedEntity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">cloud_upload</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Attach Document to Master Dossier</h3>
              <p className="text-xs text-gray-500">Cryptographically secure zero-alteration document store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Target Entity *</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {entities.map(ent => (
                <option key={ent.id} value={ent.name}>
                  {ent.name} ({ent.id}) · {ent.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Document Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="MSA">Master Service Agreement (MSA)</option>
              <option value="License">Commercial Trade License / CR</option>
              <option value="Tax">Tax Exemption / VAT / GST Form</option>
              <option value="Banking">Official Bank Mandate & Remittance Details</option>
              <option value="NDA">Mutual NDA / Confidentiality Agreement</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Document Title / Description</label>
            <input
              type="text"
              placeholder="e.g. Executed Master Agreement 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Simulated File Upload</label>
            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center hover:bg-gray-50 transition cursor-pointer">
              <span className="material-symbols-outlined text-[28px] text-blue-600">upload_file</span>
              <div className="mt-1 font-medium text-gray-800">
                {fileName ? fileName : 'Click to select PDF or Image file'}
              </div>
              <input
                type="text"
                placeholder="Or specify filename (e.g. Entity_CR_Verified.pdf)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="mt-2 w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">Automatic SHA-256 seal verified on upload</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Commit to Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVaultModal;
