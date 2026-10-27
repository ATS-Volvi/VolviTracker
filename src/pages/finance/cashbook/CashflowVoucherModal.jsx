import React from 'react';
import { formatCurrency } from './cashbookHelpers';

export default function CashflowVoucherModal({
  selectedTxn,
  onClose,
  toUsd
}) {
  if (!selectedTxn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">receipt_long</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">
                Voucher Slip {selectedTxn.voucherNo}
              </h3>
              <p className="text-xs text-gray-500">Official cash & bank journal audit receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Voucher Amount</div>
              <div className="text-xl font-extrabold text-gray-900 font-mono mt-0.5">
                {formatCurrency(selectedTxn.amountNative, selectedTxn.currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">USD Value</div>
              <div className="text-sm font-bold text-emerald-600 font-mono mt-0.5">
                ${(selectedTxn.amountUsd || toUsd(selectedTxn.amountNative, selectedTxn.currency)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Payee / Beneficiary / Partner</div>
              <div className="font-bold text-gray-900 mt-0.5">{selectedTxn.counterparty || 'Corporate Treasury'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Transaction Date</div>
              <div className="font-semibold text-gray-800 mt-0.5">{selectedTxn.date}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Bank / Cash Account</div>
              <div className="font-semibold text-gray-800 mt-0.5">{selectedTxn.accountName}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Operating Entity</div>
              <div className="font-semibold text-gray-800 mt-0.5">{selectedTxn.entity}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Document Reference / PO / Inv</div>
              <div className="font-mono text-gray-800 mt-0.5">{selectedTxn.linkedInvoice || selectedTxn.linkedPo || selectedTxn.reference || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Payment Mode</div>
              <div className="font-semibold text-gray-800 mt-0.5">{selectedTxn.paymentMode}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Accounting Category</div>
              <div className="font-semibold text-gray-800 mt-0.5">{selectedTxn.category}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Audit Status</div>
              <div className="font-semibold text-emerald-700 mt-0.5">{selectedTxn.status}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase">Particulars / Narration</div>
            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-800 font-medium mt-1">
              {selectedTxn.description}
            </div>
          </div>

          {selectedTxn.notes && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Auditor Remarks</div>
              <div className="p-2.5 bg-blue-50/50 text-blue-900 rounded-xl mt-1">
                {selectedTxn.notes}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
}
