import React, { useState } from 'react';

const IssueSupplierPOModal = ({ isOpen, onClose, onSave, projects = [], vendors = [] }) => {
  const [poNumber, setPoNumber] = useState(`PO-SUP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [supplierName, setSupplierName] = useState(vendors[0]?.name || 'Apex Cloud Infrastructure Ltd');
  const [entity, setEntity] = useState('Volvitech Tech FZ-LLC');
  const [linkedProject, setLinkedProject] = useState(projects[0]?.id || 'PRJ-2024-01');
  const [itemDesc, setItemDesc] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState('Net 30 SWIFT Wire');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    const project = projects.find(p => p.id === linkedProject);

    onSave({
      id: `SPO-${Date.now()}`,
      poNumber,
      entity,
      supplierName,
      origin: currency === 'INR' ? 'Domestic (India)' : currency === 'SAR' ? 'Domestic (KSA)' : 'International',
      taxId: 'TAX-' + Math.floor(100000 + Math.random() * 900000),
      linkedProject,
      linkedClientPo: project?.poNumber || 'PO-CLT-GEN',
      committedUsd: currency === 'USD' ? val : currency === 'AED' ? val / 3.67 : currency === 'SAR' ? val / 3.75 : val / 83.2,
      committedNative: val,
      currency,
      billedUsd: 0,
      billedPercent: 0,
      remainingUsd: currency === 'USD' ? val : currency === 'AED' ? val / 3.67 : currency === 'SAR' ? val / 3.75 : val / 83.2,
      terms,
      status: 'Open Active',
      items: [
        { desc: itemDesc || 'Specialized Engineering Subcontracting Scope', qty: 1, unitPrice: val, total: val }
      ]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-indigo-600 text-[22px]">shopping_cart_checkout</span>
            <div>
              <h2 className="text-base font-bold text-gray-900 font-display">Issue Supplier Purchase Order</h2>
              <p className="text-xs text-gray-500">Cost-mapped procurement against linked Client Project SOW</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier PO #</label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Volvitech Legal Entity</label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Volvitech Tech FZ-LLC (Dubai)">Volvitech Tech FZ-LLC (Dubai)</option>
                <option value="Volvitech India Pvt Ltd (Bengaluru)">Volvitech India Pvt Ltd (Bengaluru)</option>
                <option value="Volvitech US Corp (Delaware)">Volvitech US Corp (Delaware)</option>
                <option value="Volvitech KSA Branch (Riyadh)">Volvitech KSA Branch (Riyadh)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Supplier / Vendor</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Apex Cloud Infrastructure Ltd"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cost-Mapped Client Project</label>
              <select
                value={linkedProject}
                onChange={(e) => setLinkedProject(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.id} — {p.projectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deliverable / Scope Description</label>
            <input
              type="text"
              required
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="e.g. Cloud Telemetry Nodes & MQTT Cluster Provisioning"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Committed Amount ({currency})</label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. 140000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Terms</label>
              <select
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Net 15 Local Transfer">Net 15 Local Transfer</option>
                <option value="Net 30 SWIFT Wire">Net 30 SWIFT Wire</option>
                <option value="Net 45 NEFT/RTGS">Net 45 NEFT/RTGS</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Issue Supplier PO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueSupplierPOModal;
