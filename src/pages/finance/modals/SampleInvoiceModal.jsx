import React from 'react';

const SampleInvoiceModal = ({ isOpen, onClose, invoice = null }) => {
  if (!isOpen) return null;

  const invNum = invoice?.invoiceNumber || 'INV-2025-091';
  const issueDate = invoice?.issueDate || '24 March 2025';
  const dueDate = invoice?.dueDate || '24 April 2025';
  const client = invoice?.clientName || 'Gulf Utilities Co.';
  const linkedPo = invoice?.linkedPo || 'PO-GLF-2024-03';
  const currency = invoice?.currency || 'AED';
  const amount = invoice?.amountNative || 450000;
  const taxRate = invoice?.taxPercent ?? 5.0;
  const taxAmount = (amount * taxRate) / 100;
  const totalWithTax = amount + taxAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-gray-200 overflow-hidden animate-slide-up text-left">
        {/* Top Action Bar */}
        <div className="px-6 py-3.5 bg-gray-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[20px]">verified</span>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-200">
              Official Tax Invoice Specimen — {invNum}
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              FTA / ZATCA Phase-2 Sealed
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

        {/* Printable Invoice Sheet */}
        <div className="p-8 sm:p-10 space-y-8 bg-white text-gray-800 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
            <div>
              <div className="text-2xl font-black text-blue-900 font-display tracking-tight flex items-center gap-2">
                <span>VOLVITECH ENTERPRISE SOLUTIONS LLC</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                Standard Chartered Tower, Level 18, Downtown Commercial District<br />
                P.O. Box 9241, Downtown Dubai, United Arab Emirates<br />
                TRN (Tax Registration Number): <span className="font-semibold text-gray-800">10028941200003</span><br />
                Corporate Treasury Desk: treasury@volvitech.com
              </p>
            </div>
            <div className="text-right sm:min-w-max">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Commercial Tax Invoice
              </span>
              <div className="mt-3 space-y-1 text-xs">
                <div><span className="text-gray-400">Invoice #:</span> <span className="font-bold text-gray-900">{invNum}</span></div>
                <div><span className="text-gray-400">Tax Point Date:</span> <span className="font-medium text-gray-800">{issueDate}</span></div>
                <div><span className="text-gray-400">Payment Due:</span> <span className="font-semibold text-rose-600">{dueDate}</span></div>
                <div><span className="text-gray-400">Client PO Ref:</span> <span className="font-semibold text-blue-600">{linkedPo}</span></div>
              </div>
            </div>
          </div>

          {/* Billed To / Client Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Billed To (Client Account)</p>
              <p className="font-bold text-sm text-gray-900">{client}</p>
              <p className="text-gray-500 mt-1 leading-relaxed">
                Procurement & Accounts Payable Division<br />
                Al-Saada St, Trade Centre Complex, P.O. Box 4811<br />
                Tax ID / TRN: 100482910300003<br />
                Client Contact: Tariq Al-Maktoum (Finance Controller)
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Settlement & Compliance</p>
              <div className="space-y-1 text-gray-600">
                <div><span className="text-gray-400">Payment Terms:</span> <span className="font-medium text-gray-900">Net 60 Days via SWIFT Wire</span></div>
                <div><span className="text-gray-400">Jurisdiction:</span> UAE Corporate Tax & VAT Law</div>
                <div><span className="text-gray-400">Invoice Currency:</span> <span className="font-bold text-blue-700">{currency}</span></div>
                <div><span className="text-gray-400">Validation:</span> <span className="text-emerald-700 font-semibold">✓ Cryptographic QR Hash Verified</span></div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Line</th>
                  <th className="py-2.5 px-4">Milestone Scope / Service Description</th>
                  <th className="py-2.5 px-4">SAC / HSN</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amount ({currency})</th>
                  <th className="py-2.5 px-4 text-right">VAT Rate</th>
                  <th className="py-2.5 px-4 text-right">Total ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-400">01</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-900">{invoice?.milestone || 'Milestone 3: Cloud Telemetry Pipeline & MQTT Sensor Deployment'}</p>
                    <p className="text-[11px] text-gray-500">Contract Drawdown against Sales Purchase Order Ref {linkedPo}</p>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-500">998314</td>
                  <td className="py-3 px-4 text-right font-medium">{amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{taxRate}%</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{(amount + taxAmount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Wire Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs space-y-1.5">
              <p className="font-bold text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-blue-600">account_balance</span>
                <span>Volvitech Remittance Bank Wire Details</span>
              </p>
              <div className="text-gray-600 text-[11px] space-y-0.5 pt-1">
                <div><span className="text-gray-400">Bank Name:</span> Emirates NBD PJSC (Corporate Banking)</div>
                <div><span className="text-gray-400">Account Name:</span> Volvitech Enterprise Solutions LLC</div>
                <div><span className="text-gray-400">IBAN:</span> <span className="font-mono font-semibold text-gray-800">AE030260000109284719201</span></div>
                <div><span className="text-gray-400">SWIFT / BIC:</span> <span className="font-mono font-semibold text-gray-800">EBILAEADXXX</span></div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (Net Amount):</span>
                <span className="font-semibold text-gray-900">{currency} {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Value Added Tax ({taxRate}%):</span>
                <span className="font-semibold text-gray-900">{currency} {taxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                <span>Total Amount Payable:</span>
                <span className="text-blue-700 font-display text-base">{currency} {totalWithTax.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right">Electronic Tax Invoice generated by Volvitech Financial Operations Suite.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleInvoiceModal;
