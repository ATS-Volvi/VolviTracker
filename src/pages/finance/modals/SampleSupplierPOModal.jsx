import React from 'react';

const SampleSupplierPOModal = ({ isOpen, onClose, po = null }) => {
  if (!isOpen) return null;

  const poNumber = po?.poNumber || 'PO-SUP-2024-114';
  const entity = po?.entity || 'Volvitech Tech FZ-LLC';
  const supplierName = po?.supplierName || 'Apex Cloud Infrastructure Ltd';
  const origin = po?.origin || 'International (Ireland)';
  const taxId = po?.taxId || 'IE9822401G';
  const currency = po?.currency || 'AED';
  const committed = po?.committedNative || 513800;
  const terms = po?.terms || 'Net 30 SWIFT Wire';
  const linkedClientPo = po?.linkedClientPo || 'PO-GLF-2024-03';
  const items = po?.items && po.items.length > 0 ? po.items : [
    { desc: 'Dedicated IoT Cluster Hosting 6 Months Tier 1 SLA', qty: 6, unitPrice: 55000, total: 330000 },
    { desc: 'MQTT Broker High-Throughput Node & 99.99% Uptime SLA', qty: 1, unitPrice: 183800, total: 183800 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-gray-200 overflow-hidden animate-slide-up text-left">
        {/* Top Action Bar */}
        <div className="px-6 py-3.5 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-[20px]">shopping_bag</span>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-200">
              Supplier Purchase Order Specimen — {poNumber}
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Procurement & AP Committed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg flex items-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Purchase Order Sheet */}
        <div className="p-8 sm:p-10 space-y-8 bg-white text-gray-800 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
            <div>
              <div className="text-xl font-extrabold text-gray-900 font-display tracking-tight">
                {entity}
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                Procurement & Accounts Payable Directorate<br />
                Global Corporate Operations Hub<br />
                Entity Registration: FZ-LLC-29104<br />
                Procurement Lead: procurement@volvitech.com
              </p>
            </div>
            <div className="text-right sm:min-w-max">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Official Purchase Order
              </span>
              <div className="mt-3 space-y-1 text-xs">
                <div><span className="text-gray-400">PO Number:</span> <span className="font-bold text-gray-900">{poNumber}</span></div>
                <div><span className="text-gray-400">Issue Date:</span> <span className="font-medium text-gray-800">14 Feb 2024</span></div>
                <div><span className="text-gray-400">Terms:</span> <span className="font-semibold text-gray-800">{terms}</span></div>
                <div><span className="text-gray-400">Cost-Mapped SOW:</span> <span className="font-semibold text-indigo-600">{linkedClientPo}</span></div>
              </div>
            </div>
          </div>

          {/* Supplier Vendor Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Vendor / Supplier</p>
              <p className="font-bold text-sm text-gray-900">{supplierName}</p>
              <p className="text-gray-500 mt-1 leading-relaxed">
                Enterprise Cloud & Data Services<br />
                Jurisdiction: {origin}<br />
                VAT / Tax ID: <span className="font-mono text-gray-800 font-semibold">{taxId}</span>
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Delivery & 3-Way Match Policy</p>
              <div className="space-y-1 text-gray-600">
                <div>All vendor bills must reference <span className="font-mono font-bold text-gray-900">{poNumber}</span>.</div>
                <div>Deliverables are subject to 3-Way Audit Match against delivery signoff before AP settlement.</div>
                <div>Currency: <span className="font-bold text-indigo-700">{currency}</span></div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Line</th>
                  <th className="py-2.5 px-4">Deliverable / Procurement Scope</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Rate ({currency})</th>
                  <th className="py-2.5 px-4 text-right">Total ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 font-bold text-gray-400">0{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{item.desc}</p>
                      <p className="text-[11px] text-gray-500">Service specification cost-mapped to Client Project Ref {linkedClientPo}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.qty}</td>
                    <td className="py-3 px-4 text-right font-medium">{item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Committed Purchase Total:</span>
                <span className="font-bold text-indigo-900 text-base">{currency} {committed.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right">Authorized digital purchase order under Volvitech Procurement Controls.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleSupplierPOModal;
