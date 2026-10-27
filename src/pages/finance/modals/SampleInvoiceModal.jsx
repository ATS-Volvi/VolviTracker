import React from 'react';

export const SampleInvoiceModal = ({ isOpen, onClose, invoice = null }) => {
  if (!isOpen) return null;

  const invNum = invoice?.invoiceNumber || 'INV-2025-091';
  const issueDate = invoice?.issueDate || invoice?.date || '2025-03-24';
  const dueDate = invoice?.dueDate || '2025-04-24';
  const client = invoice?.clientName || 'Gulf Utilities Co.';
  const linkedPo = invoice?.linkedPo || invoice?.linkedPoNumber || 'PO-GLF-2024-03';
  const currency = invoice?.currency || 'USD';
  const amount = Number(invoice?.amountNative || invoice?.amountUsd || 450000);
  const taxRate = Number(invoice?.taxPercent ?? invoice?.taxRate ?? (currency === 'AED' ? 5 : currency === 'SAR' ? 15 : currency === 'INR' ? 18 : 0));
  const taxAmount = (amount * taxRate) / 100;
  const totalWithTax = amount + taxAmount;
  const status = invoice?.status || 'Pending';
  const isPaid = status === 'Paid';
  const isVoid = status === 'Void' || Boolean(invoice?.isVoid);
  const voidReason = invoice?.voidReason || '';
  const milestone = invoice?.milestone || 'Cloud Telemetry Pipeline & IoT Analytics Services';
  const receivedUsd = Number(invoice?.receivedUsd || 0);
  const balanceUsd = Number(invoice?.balanceUsd ?? (amount - receivedUsd));

  // Determine localized operating entity and remittance bank details based on currency / country
  const isUae = currency === 'AED' || invoice?.country?.includes('UAE');
  const isKsa = currency === 'SAR' || invoice?.country?.includes('KSA') || invoice?.country?.includes('Saudi');
  const isIndia = currency === 'INR' || invoice?.country?.includes('India');

  const entityInfo = isUae ? {
    companyName: 'VOLVITECH ENTERPRISE SOLUTIONS FZ-LLC',
    address: 'Standard Chartered Tower, Level 18, Downtown Dubai, United Arab Emirates',
    taxLabel: 'FTA TRN',
    taxId: '10028941200003',
    bankName: 'First Abu Dhabi Bank (FAB)',
    accountName: 'Volvitech Enterprise Solutions FZ-LLC',
    iban: 'AE030260000109284719201',
    swift: 'FABUAEADXXX',
    taxType: 'UAE VAT Law (Cabinet Decision No. 52)'
  } : isKsa ? {
    companyName: 'VOLVITECH SAUDI ARABIA LLC',
    address: 'King Fahd Road, Al Olaya District, Riyadh 12214, Kingdom of Saudi Arabia',
    taxLabel: 'CR / ZATCA Tax ID',
    taxId: '310294819200003',
    bankName: 'Al Rajhi Bank Riyadh (Corporate Desk)',
    accountName: 'Volvitech Saudi Arabia LLC',
    iban: 'SA44800004421092837192',
    swift: 'RJHIUSMSXXX',
    taxType: 'KSA ZATCA Phase-2 E-Invoicing Standard'
  } : isIndia ? {
    companyName: 'VOLVITECH INDIA PVT LTD',
    address: 'Manyata Tech Park, Block G3, Outer Ring Road, Bengaluru, Karnataka 560045',
    taxLabel: 'GSTIN / PAN',
    taxId: '29AABCV9912K1Z8 / AABCV9912K',
    bankName: 'HDFC Bank Bengaluru (Corporate Banking)',
    accountName: 'Volvitech India Private Limited',
    iban: 'A/C 50200018920194 (IFSC: HDFC0001024)',
    swift: 'HDFCINBBXXX',
    taxType: 'Indian Goods & Services Tax Act, 2017'
  } : {
    companyName: 'VOLVITECH US CORP',
    address: '1209 Orange Street, Wilmington, New Castle County, DE 19801, United States',
    taxLabel: 'Delaware Corp EIN',
    taxId: 'US-EIN-12-889021',
    bankName: 'JPMorgan Chase Bank N.A. New York',
    accountName: 'Volvitech US Corp Global Treasury',
    iban: 'A/C 48920188102 (ABA Routing: 021000021)',
    swift: 'CHASUS33XXX',
    taxType: 'US Corporate Commercial SOW & Sales Duty'
  };

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
          #invoice-print-container, #invoice-print-container * {
            visibility: visible;
          }
          #invoice-print-container {
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
              <span className="material-symbols-outlined text-amber-400 text-[20px]">receipt_long</span>
              <span className="text-xs font-bold tracking-wide uppercase text-gray-200">
                Official Tax Invoice Specimen — {invNum}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isVoid
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : isPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              }`}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95"
                title="Print or Save Invoice as PDF"
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

          {/* Printable Invoice Sheet */}
          <div id="invoice-print-container" className="p-8 sm:p-10 space-y-6 bg-white text-gray-800 font-sans relative">
            {/* Watermark for Void or Paid */}
            {isVoid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                <span className="text-8xl font-black text-rose-700 uppercase tracking-widest rotate-[-25deg] border-8 border-rose-700 px-8 py-4 rounded-3xl">
                  VOID
                </span>
              </div>
            )}
            {isPaid && !isVoid && (
              <div className="absolute right-12 top-24 pointer-events-none opacity-20">
                <span className="text-4xl font-black text-emerald-700 uppercase tracking-wider border-4 border-emerald-700 px-4 py-1.5 rounded-xl rotate-[-12deg] inline-block">
                  PAID & SETTLED
                </span>
              </div>
            )}

            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-200 pb-6">
              <div>
                <div className="text-xl sm:text-2xl font-black text-blue-900 font-display tracking-tight">
                  {entityInfo.companyName}
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed">
                  {entityInfo.address}<br />
                  <span className="font-semibold text-gray-700">{entityInfo.taxLabel}:</span> <span className="font-mono text-gray-900 font-semibold">{entityInfo.taxId}</span><br />
                  Corporate Treasury Desk: <span className="text-blue-600 font-medium">treasury@volvitech.com</span>
                </p>
              </div>
              <div className="text-left sm:text-right sm:min-w-max">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">
                  Commercial Tax Invoice
                </span>
                <div className="mt-3 space-y-1 text-xs">
                  <div><span className="text-gray-400">Invoice #:</span> <span className="font-mono font-bold text-gray-900">{invNum}</span></div>
                  <div><span className="text-gray-400">Tax Point Date:</span> <span className="font-mono font-medium text-gray-800">{issueDate}</span></div>
                  <div><span className="text-gray-400">Payment Due:</span> <span className="font-mono font-bold text-rose-600">{dueDate}</span></div>
                  <div><span className="text-gray-400">Client PO Ref:</span> <span className="font-mono font-semibold text-blue-600">{linkedPo}</span></div>
                </div>
              </div>
            </div>

            {/* Billed To / Settlement Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4.5 rounded-xl border border-gray-200/80 text-xs">
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Billed To (Client SOW)</p>
                <p className="font-bold text-sm text-gray-900">{client}</p>
                <p className="text-gray-500 mt-1 leading-relaxed">
                  Accounts Payable & Institutional SOW Oversight<br />
                  Region: <span className="font-semibold text-gray-800">{invoice?.country || 'Institutional Client'}</span><br />
                  Settlement Currency: <span className="font-mono font-bold text-blue-700">{currency}</span>
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Statutory Compliance & Status</p>
                <div className="space-y-1 text-gray-600">
                  <div><span className="text-gray-400">Jurisdiction:</span> <span className="font-medium text-gray-900">{entityInfo.taxType}</span></div>
                  <div><span className="text-gray-400">Applied Tax Rate:</span> <span className="font-bold text-emerald-700 font-mono">{taxRate}%</span></div>
                  <div><span className="text-gray-400">Invoice Status:</span> <span className="font-bold text-gray-900">{status}</span></div>
                  {isVoid && voidReason && (
                    <div className="text-rose-600 font-semibold pt-0.5">
                      <span className="text-rose-400">Void Reason:</span> {voidReason}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Line</th>
                    <th className="py-2.5 px-4">Milestone Scope / Service Description</th>
                    <th className="py-2.5 px-4 w-24 font-mono text-center">SAC / HSN</th>
                    <th className="py-2.5 px-4 text-right">Taxable ({currency})</th>
                    <th className="py-2.5 px-4 text-right w-20">Tax %</th>
                    <th className="py-2.5 px-4 text-right">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-400 text-center">01</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{milestone}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Contract milestone settlement against Client PO Ref: {linkedPo}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500 text-center">998314</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-800">
                      {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {taxRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                      {totalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Remittance Wire Details & Financial Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs space-y-1.5">
                <p className="font-bold text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">account_balance</span>
                  <span>Official Bank Wire Remittance Coordinates</span>
                </p>
                <div className="text-gray-600 text-[11px] space-y-0.5 pt-1">
                  <div><span className="text-gray-400">Bank Name:</span> <span className="font-medium text-gray-900">{entityInfo.bankName}</span></div>
                  <div><span className="text-gray-400">Beneficiary:</span> <span className="font-semibold text-gray-900">{entityInfo.accountName}</span></div>
                  <div><span className="text-gray-400">IBAN / Account:</span> <span className="font-mono font-bold text-blue-800">{entityInfo.iban}</span></div>
                  <div><span className="text-gray-400">SWIFT / BIC:</span> <span className="font-mono font-semibold text-gray-800">{entityInfo.swift}</span></div>
                  <div><span className="text-gray-400">Remittance Ref:</span> <span className="font-mono font-bold text-indigo-700">{invNum}</span></div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {isIndia && taxRate > 0 ? (
                  <>
                    <div className="flex justify-between text-gray-500 text-[11px] pl-3">
                      <span>• CGST ({(taxRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono text-gray-800">
                        {currency} {(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px] pl-3">
                      <span>• SGST ({(taxRate / 2).toFixed(1)}%):</span>
                      <span className="font-mono text-gray-800">
                        {currency} {(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax / VAT ({taxRate}%):</span>
                    <span className="font-mono font-semibold text-gray-900">
                      {currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                  <span>Grand Total Payable:</span>
                  <span className="font-mono text-blue-700 font-extrabold text-base">
                    {currency} {totalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {receivedUsd > 0 && (
                  <div className="pt-2 border-t border-dashed border-gray-200 text-xs space-y-1">
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Receipts Cleared So Far:</span>
                      <span className="font-mono">${receivedUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono">${balanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-gray-400 text-right pt-1">
                  Electronic Tax Invoice issued by Volvitech Financial Operations Suite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SampleInvoiceModal;
