import React, { useState } from 'react';

const CreateProjectModal = ({
  isOpen,
  onClose,
  onSave,
  clients = [],
  clientPos = [],
  supplierPos = []
}) => {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState(clients[0]?.name || 'Gulf Utilities Co.');
  const [currency, setCurrency] = useState('USD');
  const [contractValue, setContractValue] = useState('');
  const [unit, setUnit] = useState('Fintech Core');
  const [linkedClientPo, setLinkedClientPo] = useState(clientPos[0]?.poNumber || '');
  const [linkedSupplierPo, setLinkedSupplierPo] = useState(supplierPos[0]?.poNumber || '');
  const [supplierBudget, setSupplierBudget] = useState('');
  const [laborBudget, setLaborBudget] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(contractValue) || 0;
    const supCost = parseFloat(supplierBudget) || Math.round(val * 0.35);
    const labCost = parseFloat(laborBudget) || Math.round(val * 0.25);
    const margin = Math.max(0, val - supCost - labCost);
    const marginPct = val > 0 ? Math.round((margin / val) * 1000) / 10 : 0;

    const country = currency === 'INR' ? 'India 🇮🇳' : currency === 'AED' ? 'UAE 🇦🇪' : currency === 'SAR' ? 'KSA 🇸🇦' : 'USA 🇺🇸';
    const randomId = `PRJ-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`;

    const newProject = {
      id: randomId,
      projectName: projectName.trim() || 'New Commercial Project Platform',
      clientName,
      country,
      currency,
      contractValue: val,
      contractValueNative: currency === 'USD' ? val : currency === 'AED' ? val * 3.67 : currency === 'SAR' ? val * 3.75 : val * 83.2,
      invoicedAmount: 0,
      invoicedPercent: 0,
      supplierCosts: supCost,
      laborCosts: labCost,
      grossMargin: margin,
      grossMarginPercent: marginPct,
      status: marginPct > 20 ? 'Healthy' : 'Margin Risk',
      unit,
      poNumber: linkedClientPo || `PO-${randomId}`,
      linkedSupplierPo: linkedSupplierPo || null
    };

    onSave(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">account_tree</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Setup New Project (Central Hub)</h3>
              <p className="text-xs text-gray-500">Link client, sales PO, and map downstream supplier PO ratecards</p>
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
            <label className="block text-gray-700 font-semibold mb-1">Project Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Smart Grid Cloud IoT Phase III"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Select Client (From Master) *</label>
              <select
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Business Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Fintech Core">Fintech Core</option>
                <option value="Enterprise IoT">Enterprise IoT</option>
                <option value="Cloud Infra">Cloud Infra</option>
                <option value="AI Solutions">AI Solutions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Total Contract Value (USD) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 500000"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-semibold"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Link Client PO (Optional)</label>
              <select
                value={linkedClientPo}
                onChange={(e) => setLinkedClientPo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">None (Create later)</option>
                {clientPos.map(cpo => (
                  <option key={cpo.id} value={cpo.poNumber}>{cpo.poNumber} ({cpo.clientName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Map Supplier PO (Optional)</label>
              <select
                value={linkedSupplierPo}
                onChange={(e) => setLinkedSupplierPo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">None (Procure later)</option>
                {supplierPos.map(spo => (
                  <option key={spo.id} value={spo.poNumber}>{spo.poNumber} ({spo.supplierName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Allocated Supplier Cost ($)</label>
              <input
                type="number"
                placeholder="Estimated vendor cost"
                value={supplierBudget}
                onChange={(e) => setSupplierBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Allocated Internal Labor ($)</label>
              <input
                type="number"
                placeholder="Estimated labor cost"
                value={laborBudget}
                onChange={(e) => setLaborBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
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
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
