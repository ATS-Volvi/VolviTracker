import React from 'react';

export const ProgressBar = ({ progress }) => {
  const pct = Math.max(0, Math.min(100, Math.round((progress || 0) * 100)));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 tabular-nums w-9 text-right">{pct}%</span>
    </div>
  );
};