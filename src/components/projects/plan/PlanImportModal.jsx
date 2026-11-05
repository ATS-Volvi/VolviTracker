import React, { useState } from 'react';
import { importProjectPlan } from '../../../services/projectPlanApi';
import { useToast } from '../../../context/ToastContext';
import { parsePlanWorkbook } from './planWorkbookParser';

export function PlanImportModal({ isOpen, onClose, projectId, onSuccess }) {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [mode, setMode] = useState('merge'); // 'merge' or 'replace'
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg('');
    setIsParsing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const parsed = parsePlanWorkbook(arrayBuffer);
      setParsedData(parsed);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse Excel workbook');
      setParsedData(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await importProjectPlan(projectId, {
        mode,
        sprints: parsedData.sprints,
        tasks: parsedData.tasks,
        gates: parsedData.gates
      });

      if (res.errors && res.errors.length > 0) {
        addToast(`Plan imported with ${res.errors.length} warnings`, 'info');
      } else {
        addToast(`Successfully imported ${parsedData.sprints.length} sprints, ${parsedData.tasks.length} tasks, and ${parsedData.gates.length} gates!`, 'success');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to import project plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Detailed Project Plan</h3>
              <p className="text-xs text-slate-500">Upload an Excel workbook with Detailed Sprint Plan & Stage Gates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center transition bg-slate-50/30">
            <input
              type="file"
              id="plan-excel-upload"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="plan-excel-upload" className="cursor-pointer block space-y-2">
              <span className="material-symbols-outlined text-4xl text-blue-600">cloud_upload</span>
              <div className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Click to upload or drag & drop project plan (.xlsx)'}
              </div>
              <p className="text-xs text-slate-500">
                Supports FMS365 Detailed Project Plan format (Sheets: Detailed Sprint Plan, Stage Gates)
              </p>
            </label>
          </div>

          {isParsing && (
            <div className="text-center py-4 text-xs font-semibold text-blue-600 animate-pulse">
              Parsing Excel sheets and validating rows...
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {parsedData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-center">
                  <div className="text-xs font-semibold text-blue-600">Sprints Detected</div>
                  <div className="text-xl font-black text-blue-900 mt-0.5">{parsedData.sprints.length}</div>
                </div>
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
                  <div className="text-xs font-semibold text-indigo-600">Tasks Detected</div>
                  <div className="text-xl font-black text-indigo-900 mt-0.5">{parsedData.tasks.length}</div>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
                  <div className="text-xs font-semibold text-emerald-600">Stage Gates</div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">{parsedData.gates.length}</div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Import Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${mode === 'merge' ? 'border-blue-500 bg-blue-50/40 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={mode === 'merge'}
                      onChange={() => setMode('merge')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Merge (Upsert)</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Updates matching tasks and codes without deleting existing untouched items. Creates zero duplicates.
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${mode === 'replace' ? 'border-amber-500 bg-amber-50/40 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={mode === 'replace'}
                      onChange={() => setMode('replace')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Replace (Clean slate)</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Wipes existing sprint and gate plan data for this project and re-imports cleanly from the workbook.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quick Preview List */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-40 overflow-y-auto space-y-1 text-xs">
                <div className="font-bold text-slate-700 mb-1">Sprint Schedule Preview:</div>
                {parsedData.sprints.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-800">{s.code} ({s.phase})</span>
                    <span className="text-[11px] text-slate-500">{s.startDate || 'TBD'} → {s.endDate || 'TBD'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedData || isSubmitting}
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer ${
              !parsedData || isSubmitting
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Commit Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanImportModal;
