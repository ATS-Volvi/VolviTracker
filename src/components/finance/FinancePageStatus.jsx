import React from 'react';

export const FinanceLoadingSpinner = ({ message = 'Loading finance records from database...' }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
    <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
  </div>
);

export const FinanceErrorBanner = ({ error, onRetry }) => (
  <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-200 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="text-xl">⚠️</span>
      <div>
        <h4 className="text-sm font-semibold text-rose-100">Unable to load finance suite data</h4>
        <p className="text-xs text-rose-300/80 mt-0.5">{error || 'Network error communicating with PostgreSQL server.'}</p>
      </div>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
      >
        Retry Loading
      </button>
    )}
  </div>
);
