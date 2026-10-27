import React, { useState } from 'react';
import { isExtraPaymentTxn, isSalaryTxn, isVendorOutflowTxn, formatCurrency } from './cashbookHelpers';

export default function CashflowLedgerTable({
  transactions,
  accounts,
  rawTransactionsCount,
  activeCompany,
  streamFilter,
  extraCategoryFilter,
  statusFilter,
  accountFilter,
  txnSearchQuery,
  setStreamFilter,
  setExtraCategoryFilter,
  setStatusFilter,
  setAccountFilter,
  setTxnSearchQuery,
  handleSelectCompany,
  handleToggleReconcile,
  handleDeleteTransaction,
  setSelectedTxnForDetail
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const paginatedTransactions = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
      {/* Ledger Toolbar & Filters */}
      <div className="p-4 border-b border-gray-200/80 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 font-display">
              {activeCompany ? `${activeCompany.name} — Cashflow Ledger` : 'Comprehensive Cashflow Ledger'}
            </h3>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {transactions.length} Entries
            </span>
          </div>

          {/* Stream Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs font-bold overflow-x-auto scrollbar-none">
            <button
              onClick={() => { setStreamFilter('all'); setExtraCategoryFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                streamFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Movements ({rawTransactionsCount})
            </button>

            <button
              onClick={() => { setStreamFilter('Inflow'); setExtraCategoryFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                streamFilter === 'Inflow'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              <span>Inflows (Receipts)</span>
            </button>

            <button
              onClick={() => { setStreamFilter('Vendor'); setExtraCategoryFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                streamFilter === 'Vendor'
                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-rose-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span>
              <span>Vendor Outflows</span>
            </button>

            <button
              onClick={() => { setStreamFilter('Extra'); setExtraCategoryFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                streamFilter === 'Extra'
                  ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-purple-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">payments</span>
              <span>Extra Payments (Salaries & OpEx)</span>
            </button>

            <button
              onClick={() => { setStreamFilter('Transfer'); setExtraCategoryFilter('all'); setCurrentPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                streamFilter === 'Transfer'
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-blue-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">sync_alt</span>
              <span>Transfers</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={txnSearchQuery}
              onChange={(e) => { setTxnSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search salary, vendor, ref, voucher..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Bank Account */}
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-medium focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Bank Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.accountName} ({a.currency})</option>
            ))}
          </select>

          {/* Extra Category Sub-Filter if Extra is selected */}
          {streamFilter === 'Extra' && (
            <select
              value={extraCategoryFilter}
              onChange={(e) => { setExtraCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 border border-purple-200 bg-purple-50/50 rounded-xl text-purple-900 text-xs font-bold focus:outline-hidden"
            >
              <option value="all">All Extra Payments</option>
              <option value="Salary">Salaries & Employee Payroll</option>
              <option value="Rent">Office Rent & Facilities</option>
              <option value="Cloud">Cloud & IT Infrastructure</option>
              <option value="Tax">Taxes & Statutory Duties</option>
            </select>
          )}

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-medium focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="Reconciled">Reconciled</option>
            <option value="Cleared">Cleared</option>
            <option value="Pending">Pending</option>
          </select>

          {activeCompany && (
            <button
              onClick={() => handleSelectCompany('ALL')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 ml-auto"
            >
              <span>Clear Company Filter</span>
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Date & Voucher</th>
              <th className="py-3 px-3">Stream / Classification</th>
              <th className="py-3 px-4">Payee / Partner / Employee</th>
              <th className="py-3 px-3">Doc Ref / PO / Run</th>
              <th className="py-3 px-4">Particulars & Narration</th>
              <th className="py-3 px-3">Bank A/C & Mode</th>
              <th className="py-3 px-3 text-right">Outflow (Debit)</th>
              <th className="py-3 px-3 text-right">Inflow (Credit)</th>
              <th className="py-3 px-3 text-right">Net Running Cash USD</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-[36px] text-gray-300 block mb-2">
                    payments
                  </span>
                  <p className="font-semibold text-gray-600">No transactions found for this cashflow filter</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try recording a new Inflow, Vendor Outflow, or Extra Payment</p>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => {
                const isInflow = txn.type === 'Inflow';
                const isVendor = isVendorOutflowTxn(txn);
                const isExtra = isExtraPaymentTxn(txn);
                const isSalary = isSalaryTxn(txn);
                const isTransfer = txn.type === 'Transfer';
                const docRef = txn.linkedInvoice || txn.linkedPo || txn.reference || '—';

                return (
                  <tr
                    key={txn.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Date & Voucher */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{txn.date}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-0.5">{txn.voucherNo}</div>
                    </td>

                    {/* Stream Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isInflow && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                          <span>Inflow (Receipt)</span>
                        </span>
                      )}
                      {isVendor && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                          <span className="material-symbols-outlined text-[12px]">shopping_cart_checkout</span>
                          <span>Vendor Outflow</span>
                        </span>
                      )}
                      {isExtra && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isSalary
                            ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                            : 'bg-amber-50 text-amber-800 border-amber-200/60'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {isSalary ? 'badge' : 'payments'}
                          </span>
                          <span>{isSalary ? 'Salary Payment' : 'Extra Payment'}</span>
                        </span>
                      )}
                      {isTransfer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                          <span className="material-symbols-outlined text-[12px]">sync_alt</span>
                          <span>Transfer</span>
                        </span>
                      )}
                    </td>

                    {/* Payee / Partner / Employee */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-bold text-gray-900 truncate" title={txn.counterparty}>
                        {txn.counterparty || 'Corporate Treasury'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">
                        {txn.entity}
                      </div>
                    </td>

                    {/* Doc Ref */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                        {docRef}
                      </span>
                    </td>

                    {/* Particulars */}
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-medium text-gray-900 line-clamp-1" title={txn.description}>
                        {txn.description}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        <span className="bg-gray-100 px-1.5 py-0.2 rounded font-medium text-gray-600">
                          {txn.category}
                        </span>
                      </div>
                    </td>

                    {/* Bank A/C & Mode */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-gray-900 font-semibold truncate max-w-[140px]" title={txn.accountName}>
                        {txn.accountName}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[140px] mt-0.5">
                        {txn.paymentMode}
                      </div>
                    </td>

                    {/* Outflow (Debit) */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {isVendor ? (
                        <span className="text-rose-600">
                          -{formatCurrency(txn.amountNative, txn.currency)}
                        </span>
                      ) : isExtra ? (
                        <span className="text-purple-600">
                          -{formatCurrency(txn.amountNative, txn.currency)}
                        </span>
                      ) : isTransfer ? (
                        <span className="text-blue-600">
                          -{formatCurrency(txn.amountNative, txn.currency)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Inflow (Credit) */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {isInflow ? (
                        <span className="text-emerald-600">
                          +{formatCurrency(txn.amountNative, txn.currency)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Net Running Cash USD */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={txn.runningNetBalanceUsd >= 0 ? 'text-gray-900' : 'text-rose-600'}>
                        {txn.runningNetBalanceUsd >= 0 ? '+' : ''}${Number(txn.runningNetBalanceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleReconcile(txn.id)}
                        title="Click to toggle Reconciled status"
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer hover:opacity-80 ${
                          txn.status === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : txn.status === 'Cleared'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {txn.status === 'Reconciled' ? 'check_circle' : txn.status === 'Cleared' ? 'done' : 'hourglass_top'}
                        </span>
                        <span>{txn.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedTxnForDetail(txn)}
                          className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Voucher Slip"
                        >
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(txn.id, txn.voucherNo)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Voucher"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {transactions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <span>Showing</span>
            <span className="font-semibold text-gray-900">
              {Math.min((currentPage - 1) * pageSize + 1, transactions.length)}
            </span>
            <span>to</span>
            <span className="font-semibold text-gray-900">
              {Math.min(currentPage * pageSize, transactions.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-gray-900">{transactions.length}</span>
            <span>entries</span>
            <span className="text-gray-300">|</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-700"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              title="First Page"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
            >
              Prev
            </button>
            <span className="px-3 py-1 font-semibold text-gray-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 font-medium"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
