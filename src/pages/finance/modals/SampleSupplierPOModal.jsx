import React from 'react';

export const SampleSupplierPOModal = ({ isOpen, onClose, po = null }) => {
  if (!isOpen) return null;

  const poNumber = po?.poNumber || 'PO-SUP-000';
  const entity = po?.entity || 'Volvitech Operating Entity';
  const supplierName = po?.supplierName || 'Vendor / Supplier';
  const origin = po?.origin || po?.country || 'International';
  const taxId = po?.taxId || '—';
  const currency = po?.currency || 'USD';
  const committed = Number(po?.totalValueNative || po?.committedNative || po?.totalValueUsd || po?.committedUsd || 0);
  const terms = po?.paymentTerms || po?.terms || 'Net 30';
  const issueDate = po?.issueDate || po?.date || '—';
  const dueDate = po?.paymentTermsDueDate || po?.dueDate || '—';
  const linkedClientPo = po?.linkedClientPo || '—';
  const linkedProject = po?.linkedProject || po?.projectName || '—';
  const status = po?.status || 'Open';
  const isVoid = status === 'Void' || Boolean(po?.isVoid);
  const voidReason = po?.voidReason || '';
  const notes = po?.notes || '';

  // Localized entity information
  const isUae = currency === 'AED' || entity.includes('UAE') || entity.includes('FZ-LLC');
  const isKsa = currency === 'SAR' || entity.includes('KSA') || entity.includes('Saudi');
  const isIndia = currency === 'INR' || entity.includes('India');

  const entityInfo = isUae ? {
    companyName: 'VOLVITECH ENTERPRISE SOLUTIONS FZ-LLC',
    address: 'Standard Chartered Tower, Level 18, Downtown Dubai, United Arab Emirates',
    taxLabel: 'FTA TRN',
    taxId: '10028941200003',
    regNum: 'FZ-LLC-29104',
    leadEmail: 'procurement-ae@volvitech.com'
  } : isKsa ? {
    companyName: 'VOLVITECH SAUDI ARABIA LLC',
    address: 'King Fahd Road, Al Olaya District, Riyadh 12214, Kingdom of Saudi Arabia',
    taxLabel: 'CR / ZATCA Tax ID',
    taxId: '310294819200003',
    regNum: 'CR-1010992812',
    leadEmail: 'procurement-ksa@volvitech.com'
  } : isIndia ? {
    companyName: 'VOLVITECH INDIA PVT LTD',
    address: 'Manyata Tech Park, Block G3, Outer Ring Road, Bengaluru, Karnataka 560045',
    taxLabel: 'GSTIN / PAN',
    taxId: '29AABCV9912K1Z8',
    regNum: 'U72900KA2021PTC149810',
    leadEmail: 'procurement-in@volvitech.com'
  } : {
    companyName: 'VOLVITECH US CORP',
    address: '1209 Orange Street, Wilmington, New Castle County, DE 19801, United States',
    taxLabel: 'Delaware Corp EIN',
    taxId: 'US-EIN-12-889021',
    regNum: 'DE-SR-20219801',
    leadEmail: 'procurement@volvitech.com'
  };

  // Derive display items from po.items or po.milestones or fallback
  const items = po?.items && po.items.length > 0 ? po.items :
    po?.milestones && po.milestones.length > 0 ? po.milestones.map((m, idx) => ({
      desc: `${m.name || `Milestone Phase ${idx + 1}`}${m.date ? ` (Due: ${m.date})` : ''}`,
      qty: 1,
      unitPrice: Number(m.amount || (committed * (m.percent || 100)) / 100),
      total: Number(m.amount || (committed * (m.percent || 100)) / 100),
      status: m.status || 'Scheduled'
    })) : [
      {
        desc: `Professional Procurement & Technical Deliverables for ${linkedProject}`,
        qty: 1,
        unitPrice: committed,
        total: committed,
        status: status
      }
    ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Clean Print CSS: hides overlay, backdrop, buttons, and formats clean A4 page */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #supplier-po-print-container, #supplier-po-print-container * {
            visibility: visible;
          }
          #supplier-po-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print-bg">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 border border-gray-200 overflow-hidden animate-slide-up text-left">
          {/* Top Modal Navigation & Action Bar (Hidden when printing) */}
          <div className="no-print px-6 py-3.5 bg-gray-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-indigo-400 text-[20px]">shopping_bag</span>
              <span className="text-xs font-bold tracking-wide uppercase text-gray-200">
                Official Supplier PO Specimen — {poNumber}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isVoid
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : status === 'Fulfilled' || status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
                title="Download or Print Purchase Order as PDF"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                title="Close Window"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Printable Purchase Order Sheet */}
          <div id="supplier-po-print-container" className="p-8 sm:p-10 space-y-6 bg-white text-gray-800 font-sans relative">
            {/* Watermark for Void */}
            {isVoid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                <span className="text-8xl font-black text-rose-700 uppercase tracking-widest rotate-[-25deg] border-8 border-rose-700 px-8 py-4 rounded-3xl">
                  VOID
                </span>
              </div>
            )}

            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
              <div>
                <div className="text-xl sm:text-2xl font-black text-indigo-900 font-display tracking-tight">
                  {entityInfo.companyName}
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                  {entityInfo.address}<br />
                  Registration: {entityInfo.regNum} · {entityInfo.taxLabel}: <span className="font-mono font-bold text-gray-700">{entityInfo.taxId}</span><br />
                  Procurement Desk: <span className="font-mono text-gray-700">{entityInfo.leadEmail}</span>
                </p>
              </div>
              <div className="text-left sm:text-right sm:min-w-max">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                  Supplier Purchase Order
                </span>
                <div className="mt-3 space-y-1 text-xs">
                  <div><span className="text-gray-400">PO Number:</span> <span className="font-bold text-gray-900 font-mono">{poNumber}</span></div>
                  <div><span className="text-gray-400">Issue Date:</span> <span className="font-medium text-gray-800 font-mono">{issueDate}</span></div>
                  <div><span className="text-gray-400">Delivery / Due:</span> <span className="font-medium text-gray-800 font-mono">{dueDate}</span></div>
                  <div><span className="text-gray-400">Payment Terms:</span> <span className="font-semibold text-gray-800">{terms}</span></div>
                  {linkedClientPo && linkedClientPo !== '—' && (
                    <div><span className="text-gray-400">Cost-Mapped SOW:</span> <span className="font-semibold text-indigo-700 font-mono">{linkedClientPo}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor / Supplier Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Vendor / Creditor</p>
                <p className="font-bold text-sm text-gray-900">{supplierName}</p>
                <p className="text-gray-500 mt-1 leading-relaxed">
                  Origin / Jurisdiction: <span className="font-semibold text-gray-800">{origin}</span><br />
                  Tax / Commercial ID: <span className="font-mono text-gray-800 font-semibold">{taxId}</span><br />
                  {linkedProject && linkedProject !== '—' && (
                    <span>Allocated Project: <span className="font-semibold text-indigo-700">{linkedProject}</span></span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Procurement & AP 3-Way Match Policy</p>
                <div className="space-y-1 text-gray-600 text-[11px] leading-relaxed">
                  <div>• Invoices must reference PO number <span className="font-mono font-bold text-gray-900">{poNumber}</span>.</div>
                  <div>• Deliverables are verified against milestones and delivery receipts prior to disbursement.</div>
                  <div>• Settlement Currency: <span className="font-bold text-indigo-700 font-mono">{currency}</span></div>
                </div>
              </div>
            </div>

            {/* Void Notice */}
            {isVoid && voidReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <span className="font-bold uppercase tracking-wider text-[10px] block">Void Specification</span>
                <span>{voidReason}</span>
              </div>
            )}

            {/* Deliverables / Scope Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Deliverable / Procurement Scope</th>
                    <th className="py-2.5 px-4 text-center w-16">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Rate ({currency})</th>
                    <th className="py-2.5 px-4 text-right">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-gray-400">0{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{item.desc}</p>
                        {linkedProject && (
                          <p className="text-[11px] text-gray-500">Service specification cost-mapped to Client Project Ref {linkedProject}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{item.qty || 1}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium">
                        {(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes & Bottom Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
              <div className="text-xs text-gray-500 space-y-1">
                {notes && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">PO Notes</span>
                    <p className="text-[11px] text-gray-700">{notes}</p>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 pt-1">
                  Authorized digital purchase order under Volvitech Global Procurement Controls.
                </p>
              </div>

              <div className="space-y-2 text-xs bg-gray-50/80 p-4 rounded-xl border border-gray-200 sm:ml-auto w-full sm:w-72">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Committed Subtotal:</span>
                  <span className="font-mono font-semibold">{currency} {committed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-indigo-950 font-extrabold text-sm">
                  <span>Total PO Value:</span>
                  <span className="font-mono text-base text-indigo-700">{currency} {committed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SampleSupplierPOModal;
