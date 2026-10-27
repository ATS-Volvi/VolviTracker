import React from 'react';

export default function DossierBankingTab({
  bankingData,
  setBankingData,
  onSaveBanking
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-[22px]">account_balance</span>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">Banking Mandates & Wire Remittance Information</h2>
            <p className="text-xs text-gray-400">Official bank accounts, clearing codes, and wire transfer instructions</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveBanking}
          className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>Save Banking Info</span>
        </button>
      </div>

      <form onSubmit={onSaveBanking} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Financial Institution / Bank Name</label>
          <input
            type="text"
            value={bankingData.bankName}
            onChange={(e) => setBankingData({ ...bankingData, bankName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Account Number / IBAN</label>
          <input
            type="text"
            value={bankingData.accountNumber}
            onChange={(e) => setBankingData({ ...bankingData, accountNumber: e.target.value })}
            className="w-full px-3 py-2 font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">SWIFT / BIC Identifier</label>
          <input
            type="text"
            value={bankingData.swiftIban}
            onChange={(e) => setBankingData({ ...bankingData, swiftIban: e.target.value })}
            className="w-full px-3 py-2 font-mono uppercase border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Routing Code / Sort / IFSC</label>
          <input
            type="text"
            value={bankingData.routing}
            onChange={(e) => setBankingData({ ...bankingData, routing: e.target.value })}
            className="w-full px-3 py-2 font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 font-semibold mb-1">Special Remittance & Wire Instructions</label>
          <textarea
            rows={3}
            value={bankingData.remittanceNotes}
            onChange={(e) => setBankingData({ ...bankingData, remittanceNotes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="Include intermediary bank details, currency requirements, or invoice memo guidelines..."
          />
        </div>
      </form>
    </div>
  );
}
