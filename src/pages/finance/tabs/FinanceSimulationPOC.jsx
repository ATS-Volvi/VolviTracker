import React, { useState, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext';

const FinanceSimulationPOC = ({ clientPos, supplierPos, exchangeRates }) => {
  const { addToast } = useToast();
  const [currentStage, setCurrentStage] = useState(1);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [hasVarianceInjected, setHasVarianceInjected] = useState(false);

  // Simulation numbers state
  const [clientCap, setClientCap] = useState(650000);
  const [clientBilled, setClientBilled] = useState(325000);
  const [supplierCommitted, setSupplierCommitted] = useState(240000);
  const [supplierBilled, setSupplierBilled] = useState(120000);

  // Auto-run timer
  useEffect(() => {
    let interval = null;
    if (isAutoRunning) {
      interval = setInterval(() => {
        setCurrentStage(prev => {
          if (prev >= 4) {
            setIsAutoRunning(false);
            addToast('End-to-End Simulation completed full cycle!', 'success');
            return 1;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAutoRunning, addToast]);

  const billedPct = Math.round((clientBilled / clientCap) * 100);
  const supplierBilledPct = Math.round((supplierBilled / supplierCommitted) * 100);
  const grossMargin = clientBilled - supplierBilled;
  const grossMarginPct = clientBilled > 0 ? ((grossMargin / clientBilled) * 100).toFixed(1) : 0;

  const handleToggleAuto = () => {
    if (isAutoRunning) {
      setIsAutoRunning(false);
      addToast('Auto simulation paused', 'info');
    } else {
      setIsAutoRunning(true);
      addToast('Auto-cycle started: executing dual-sided workflow...', 'info');
    }
  };

  const handleInjectVariance = () => {
    setHasVarianceInjected(prev => {
      const next = !prev;
      if (next) {
        setSupplierBilled(165000);
        addToast('Out-of-tolerance bill injected! Stage 4 will alert variance discrepancy.', 'warning');
      } else {
        setSupplierBilled(120000);
        addToast('Tolerance normalized to contract ratecard.', 'success');
      }
      return next;
    });
  };

  const handleReset = () => {
    setIsAutoRunning(false);
    setCurrentStage(1);
    setHasVarianceInjected(false);
    setClientCap(650000);
    setClientBilled(325000);
    setSupplierCommitted(240000);
    setSupplierBilled(120000);
    addToast('Simulation ledger reset to initial baseline.', 'info');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Banner / Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Dual-Sided Match POC</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-blue-600 font-bold">Interactive Lifecycle Simulation</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
              End-to-End PO & Treasury Lifecycle Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
              POC Sandbox
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Simulate real-time multi-stage contract mechanics: intake client blanket commitments, map downstream supplier ratecards, automate drawdown invoices, and enforce 3-way variance guards.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleAuto}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
              isAutoRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-gray-900 hover:bg-black text-white'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${isAutoRunning ? 'animate-spin' : ''}`}>
              {isAutoRunning ? 'pause' : 'play_arrow'}
            </span>
            <span>{isAutoRunning ? 'Pause Auto-Cycle' : 'Run Auto-Simulation'}</span>
          </button>

          <button
            onClick={handleInjectVariance}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 active:scale-95 ${
              hasVarianceInjected
                ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-rose-600">bug_report</span>
            <span>{hasVarianceInjected ? 'Clear Variance' : 'Inject Variance (+37%)'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition"
            title="Reset Simulation"
          >
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Connected Interactive Stepper */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              stage: 1,
              title: 'Client PO Intake',
              tag: 'Stage 01',
              metric: 'BPO Active ($650k)',
              icon: 'assignment_turned_in',
              color: 'blue'
            },
            {
              stage: 2,
              title: 'Supplier PO Map',
              tag: 'Stage 02',
              metric: 'Margin Guard 63.1%',
              icon: 'shield',
              color: 'indigo'
            },
            {
              stage: 3,
              title: 'Invoice Drawdown',
              tag: 'Stage 03',
              metric: 'Tranche 2 Ready (50%)',
              icon: 'pending_actions',
              color: 'amber'
            },
            {
              stage: 4,
              title: '3-Way Variance Match',
              tag: 'Stage 04',
              metric: hasVarianceInjected ? 'Variance Flagged (Rate High)' : '4/4 Checks Cleared',
              icon: hasVarianceInjected ? 'warning' : 'fact_check',
              color: hasVarianceInjected ? 'rose' : 'emerald'
            },
          ].map(step => {
            const isActive = currentStage === step.stage;
            return (
              <div
                key={step.stage}
                onClick={() => setCurrentStage(step.stage)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-transparent bg-gray-50/70 hover:bg-gray-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {step.stage}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-gray-400">{step.tag}</div>
                  <div className="text-xs font-bold text-gray-900 truncate">{step.title}</div>
                  <div className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                    step.color === 'rose' ? 'text-rose-600' : step.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    <span className="material-symbols-outlined text-[13px]">{step.icon}</span>
                    <span className="truncate">{step.metric}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual-Sided Cockpit / Margins Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Client Commitment */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Client Blanket Commitment</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold font-mono text-[10px]">USD-BASE</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display">
              ${clientCap.toLocaleString()}
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Drawdown Billed to Date:</span>
                <span className="font-bold font-mono text-gray-900">${clientBilled.toLocaleString()} ({billedPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-200/60 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${billedPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Supplier Procurement Committed */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">Downstream Supplier Ratecard</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold font-mono text-[10px]">COST-MAPPED</span>
            </div>
            <div className="text-2xl font-black text-gray-900 font-display">
              ${supplierCommitted.toLocaleString()}
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Supplier Bills Recorded:</span>
                <span className="font-bold font-mono text-gray-900">${supplierBilled.toLocaleString()} ({supplierBilledPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-indigo-200/60 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, supplierBilledPct)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Realized Gross Margin */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Real-Time Contract Margin</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">SOLVENT</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-display">
              ${grossMargin.toLocaleString()}
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Realized Margin %:</span>
                <span className="font-extrabold text-emerald-700 font-mono">{grossMarginPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-200/60 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, grossMarginPct)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stage Details Inspection Panel */}
        <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {currentStage}
              </span>
              <h3 className="font-bold text-gray-900 text-sm">
                {currentStage === 1 && 'Stage 01: Client Purchase Order Intake & Blanket Cap SOW'}
                {currentStage === 2 && 'Stage 02: Cost-Mapped Supplier PO Issuance & Margin Guard'}
                {currentStage === 3 && 'Stage 03: Automated Milestone Invoice Drawdown Execution'}
                {currentStage === 4 && 'Stage 04: Automated 3-Way Match & Variance Audit Guard'}
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              Simulation Thread: #SIM-{Date.now().toString().slice(-4)}
            </span>
          </div>

          {currentStage === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Client Blanket PO Specifications</div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">Contracting Client:</span><span className="font-bold text-gray-900">NexaCorp International Ltd.</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Master Agreement:</span><span className="font-mono text-blue-600 font-semibold">MSA-VOLVI-2024-V4</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">PO Number:</span><span className="font-mono font-bold text-gray-900">PO-GLF-2024-03</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Authorized Cap:</span><span className="font-bold text-emerald-600">$650,000.00 USD</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Contract Milestones Configured</div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <div className="flex justify-between items-center text-[11px]"><span className="text-gray-600">Tranche 1: Architecture Blueprint (25%)</span><span className="text-emerald-600 font-bold">$162,500 [PAID]</span></div>
                  <div className="flex justify-between items-center text-[11px]"><span className="text-gray-600">Tranche 2: Core Platform Delivery (25%)</span><span className="text-blue-600 font-bold">$162,500 [BILLED]</span></div>
                  <div className="flex justify-between items-center text-[11px]"><span className="text-gray-600">Tranche 3: UAT & Sensor Telemetry (25%)</span><span className="text-gray-400 font-medium">$162,500 [PENDING]</span></div>
                  <div className="flex justify-between items-center text-[11px]"><span className="text-gray-600">Tranche 4: Final Acceptance (25%)</span><span className="text-gray-400 font-medium">$162,500 [UNBILLED]</span></div>
                </div>
              </div>
            </div>
          )}

          {currentStage === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Subcontractor PO Allocation</div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">Designated Supplier:</span><span className="font-bold text-gray-900">Apex Cloud Infrastructure Ltd</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Supplier PO #:</span><span className="font-mono font-bold text-indigo-700">PO-SUP-2024-114</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mapped to Client PO:</span><span className="font-mono text-gray-800">PO-GLF-2024-03</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Committed Ceiling:</span><span className="font-bold text-gray-900">$240,000.00 USD</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Automated Margin Guard Diagnostics</div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex justify-between text-emerald-900"><span className="font-medium">Client Revenue Ceiling:</span><span className="font-bold font-mono">$650,000</span></div>
                  <div className="flex justify-between text-emerald-900"><span className="font-medium">Direct Supplier Committed:</span><span className="font-bold font-mono">$240,000</span></div>
                  <div className="flex justify-between text-emerald-900"><span className="font-bold">Projected Net Margin:</span><span className="font-extrabold font-mono text-emerald-700">$410,000 (63.1%)</span></div>
                  <div className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200">
                    Pre-execution guard check: PASS (Exceeds corporate hurdle rate of 30%).
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStage === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Invoice Drawdown Generator</div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex justify-between"><span className="text-gray-500">Invoice Generated:</span><span className="font-mono font-bold text-blue-600">INV-2024-0042</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tranche Invoiced:</span><span className="font-bold text-gray-900">$162,500.00 USD (Tranche 2)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cumulative Drawdown:</span><span className="font-bold font-mono text-emerald-600">50.0% of Blanket PO</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Remaining Balance:</span><span className="font-mono text-gray-600">$325,000.00 USD</span></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-gray-700">Drawdown Burn Progress</div>
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-700">
                    <span>PO Cap Consumption</span>
                    <span>50% Invoiced</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-100 flex overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '25%' }} title="Paid"></div>
                    <div className="bg-blue-600 h-full" style={{ width: '25%' }} title="Invoiced"></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span className="text-emerald-600 font-semibold">• 25% Paid</span>
                    <span className="text-blue-600 font-semibold">• 25% Invoiced</span>
                    <span className="text-gray-400">• 50% Available</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStage === 4 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10px] font-bold uppercase">1. Purchase Order Match</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">PO-SUP-2024-114</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Rate: $15,000 / mo
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10px] font-bold uppercase">2. Supplier Bill / Invoice</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">INV-APEX-99120</div>
                  <div className={`text-[10px] font-semibold flex items-center gap-1 mt-1 ${
                    hasVarianceInjected ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    <span className="material-symbols-outlined text-[13px]">
                      {hasVarianceInjected ? 'error' : 'check_circle'}
                    </span>
                    {hasVarianceInjected ? 'Billed: $20,500 (+36.7%)' : 'Billed: $15,000 (Exact)'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10px] font-bold uppercase">3. Delivery Acceptance (GRN)</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">GRN-2024-0419</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    100% SOW Delivered
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <div className="text-gray-400 text-[10px] font-bold uppercase">4. Audit Disposition</div>
                  <div className={`text-xs font-bold mt-1 ${
                    hasVarianceInjected ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {hasVarianceInjected ? 'DISCREPANCY ALERT' : 'APPROVED FOR PAYMENT'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {hasVarianceInjected ? 'Hold disbursement & request credit note' : 'Released to AP SWIFT Queue'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceSimulationPOC;
