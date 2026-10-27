import React from 'react';

export default function DossierStakeholdersTab({
  company,
  stakeholdersList,
  onOpenAddStakeholder,
  onDeleteStakeholder,
  isAdmin
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[22px]">contacts</span>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-display">Designated Key Stakeholders & Contacts</h2>
            <p className="text-xs text-gray-400">Authorized personnel, procurement leads, and corporate officers for {company.name}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddStakeholder}
          className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Add Stakeholder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stakeholdersList.map((s, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 text-xs relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {s.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {idx === 0 && (
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">{s.role}</div>
                </div>
              </div>

              {idx > 0 && isAdmin && (
                <button
                  type="button"
                  onClick={() => onDeleteStakeholder(idx)}
                  className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                  title="Admin only: Remove contact"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 text-[11px] pt-1 border-t border-gray-200/60">
              {s.email && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
                  <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline truncate">
                    {s.email}
                  </a>
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="material-symbols-outlined text-[14px] text-gray-400">call</span>
                  <span className="font-mono">{s.phone}</span>
                </div>
              )}
              {s.dept && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="material-symbols-outlined text-[14px] text-gray-400">business</span>
                  <span>{s.dept}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
