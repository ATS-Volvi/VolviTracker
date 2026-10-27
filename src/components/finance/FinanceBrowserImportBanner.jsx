import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasBrowserFinanceData, importFromLocalStorage } from '../../services/financeApi';

export const FinanceBrowserImportBanner = ({ onImportSuccess }) => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [hasData, setHasData] = useState(() => hasBrowserFinanceData());
  const [isImporting, setIsImporting] = useState(false);

  if (!isAdmin || !hasData) {
    return null;
  }

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const imported = await importFromLocalStorage();
      addToast('Successfully imported finance data from browser storage into PostgreSQL database!', 'success');
      setHasData(false);
      if (onImportSuccess) {
        onImportSuccess(imported);
      }
    } catch (err) {
      console.error('[Import Error]:', err);
      addToast(err.message || 'Failed to import finance data from browser storage', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 px-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <h4 className="text-sm font-semibold text-amber-300">Local Browser Finance Data Detected</h4>
          <p className="text-xs text-amber-200/80">
            You have finance suite data saved in this browser's localStorage. Upload it to the persistent PostgreSQL database now so it is never lost.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleImport}
        disabled={isImporting}
        className="self-end sm:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-all shadow-md hover:shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap cursor-pointer"
      >
        {isImporting ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>Importing to Database...</span>
          </>
        ) : (
          <>
            <span>🚀 Import from this browser</span>
          </>
        )}
      </button>
    </div>
  );
};

export default FinanceBrowserImportBanner;
