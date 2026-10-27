import React, { useState, useEffect } from 'react';
import { apiUpdateExchangeRates, saveFinanceData, loadFinanceData } from '../../../services/financeApi';

const DEFAULT_CURRENCY_CONFIG = [
  { code: 'USD', name: 'US Dollar', symbol: '$', type: 'Anchor Base', fixed: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', type: 'Fixed Peg (3.6725)', fixed: false },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', type: 'Fixed Peg (3.7500)', fixed: false },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', type: 'Floating RBI Reference', fixed: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', type: 'Floating BoE Reference', fixed: false },
  { code: 'EUR', name: 'Euro', symbol: '€', type: 'Floating ECB Reference', fixed: false },
];

export default function ExchangeRatesPanelModal({
  isOpen,
  onClose,
  exchangeRates = {},
  exchangeRatesList = [],
  isAdmin = false,
  onSaveRates
}) {
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rates, setRates] = useState({
    USD: 1.0,
    AED: 3.6725,
    SAR: 3.7500,
    INR: 83.20,
    GBP: 0.79,
    EUR: 0.92,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const merged = {
        USD: 1.0,
        AED: exchangeRates.AED ?? 3.6725,
        SAR: exchangeRates.SAR ?? 3.7500,
        INR: exchangeRates.INR ?? 83.20,
        GBP: exchangeRates.GBP ?? 0.79,
        EUR: exchangeRates.EUR ?? 0.92,
      };
      setRates(merged);
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, exchangeRates]);

  if (!isOpen) return null;

  const handleRateChange = (code, val) => {
    if (code === 'USD') return; // USD is locked anchor
    setRates(prev => ({ ...prev, [code]: val }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Forbidden: Only administrators can update organizational exchange rates.');
      return;
    }

    // Validate rates
    const parsedRates = { USD: 1.0 };
    for (const [code, val] of Object.entries(rates)) {
      if (code === 'USD') continue;
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        setErrorMsg(`Invalid exchange rate for ${code}. Rate must be a positive number.`);
        return;
      }
      parsedRates[code] = num;
    }

    if (!effectiveDate) {
      setErrorMsg('Please select an effective date.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      // 1. Call backend authenticated API
      const res = await apiUpdateExchangeRates({
        rates: parsedRates,
        effectiveDate,
      });

      // 2. Update cached local state
      const currentStored = loadFinanceData();
      const updatedRatesList = (currentStored.exchangeRatesList || []).filter(
        item => !parsedRates[item.currency]
      );
      for (const [c, r] of Object.entries(parsedRates)) {
        updatedRatesList.push({
          currency: c,
          rate: r,
          effectiveDate,
          updatedAt: new Date().toISOString()
        });
      }

      const nextData = {
        ...currentStored,
        exchangeRates: parsedRates,
        exchangeRatesList: updatedRatesList
      };
      saveFinanceData(nextData);

      if (onSaveRates) {
        onSaveRates(parsedRates, effectiveDate);
      }

      setSuccessMsg('Exchange rates successfully updated with effective date ' + effectiveDate);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('[Exchange Rates Panel] Save failed:', err);
      // Fallback: update frontend state even if offline
      const currentStored = loadFinanceData();
      const nextData = {
        ...currentStored,
        exchangeRates: parsedRates
      };
      saveFinanceData(nextData);
      if (onSaveRates) {
        onSaveRates(parsedRates, effectiveDate);
      }
      setSuccessMsg('Rates saved locally.');
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-slide-up flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-gray-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 font-display">Treasury Exchange Rates Panel</h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-gray-500">Configure corporate base conversion rates with historical pinning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Admin Authorization Guard */}
        {!isAdmin ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Administrator Access Required</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Only users with administrator privileges can edit organizational treasury exchange rates.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5 flex-1">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Historical Immutability Guarantee Banner */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <span className="material-symbols-outlined text-[16px] text-blue-600">history_toggle_off</span>
                <span>Historical Rates Locked & Preserved</span>
              </div>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                Existing invoices, client POs, and payment records permanently retain the historical rate
                captured at transaction time. Modifying rates below establishes new conversion baselines for
                transactions recorded from this effective date onward.
              </p>
            </div>

            {/* Effective Date Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-gray-500">calendar_month</span>
                <span>Effective Date for New Transactions</span>
              </label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={e => setEffectiveDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-gray-400">
                Sets the timestamp for the updated rate schedule in corporate financial reporting.
              </p>
            </div>

            {/* Currency Rates Table */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Exchange Rates (Native Currency per 1.00 USD)</span>
                <span className="text-[11px] text-gray-400 font-normal">Base: USD ($) = 1.0000</span>
              </label>

              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {DEFAULT_CURRENCY_CONFIG.map(cur => (
                  <div
                    key={cur.code}
                    className={`p-3 flex items-center justify-between gap-3 text-xs ${
                      cur.fixed ? 'bg-gray-50/70' : 'bg-white hover:bg-gray-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-[140px]">
                      <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                        {cur.symbol} {cur.code}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-800 text-xs">{cur.name}</div>
                        <div className="text-[10px] text-gray-400">{cur.type}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">1 USD =</span>
                      <input
                        type="number"
                        step="any"
                        disabled={cur.fixed}
                        value={cur.fixed ? '1.0000' : (rates[cur.code] ?? '')}
                        onChange={e => handleRateChange(cur.code, e.target.value)}
                        className={`w-28 px-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border transition ${
                          cur.fixed
                            ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-900 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                        }`}
                      />
                      <span className="font-medium text-gray-500 text-xs min-w-[28px]">{cur.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Saving Rates...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Update Exchange Rates</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
