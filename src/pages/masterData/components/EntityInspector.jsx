import React from 'react';

export default function EntityInspector({
  selectedEntity,
  inspectorTab,
  setInspectorTab,
  onOpenUploadVault,
  onOpenCompanyDossier,
  setEntityToDelete,
  addToast,
  isAdmin
}) {
  return (
    <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
      {selectedEntity ? (
        <>
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border-b border-gray-100 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
                  selectedEntity.category === 'Client' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  {selectedEntity.avatarText || 'EN'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-sm">{selectedEntity.name}</h3>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-gray-700 font-semibold">{selectedEntity.id}</span>
                    <span>•</span>
                    <span className={selectedEntity.category === 'Client' ? 'text-blue-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {selectedEntity.category} ({selectedEntity.classification || 'Direct'})
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{selectedEntity.country}</p>
                </div>
              </div>
            </div>

            {/* 3 Quick Micro-KPIs */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                <div className="text-[10px] uppercase font-bold text-gray-400">Lifetime Billed</div>
                <div className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedEntity.lifetimeBilled || '$1.2M'}</div>
                <div className="text-[10px] text-emerald-600 font-medium">100% Reconciled</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                <div className="text-[10px] uppercase font-bold text-gray-400">Credit Cap</div>
                <div className="text-sm font-extrabold text-blue-600 mt-0.5">{selectedEntity.creditLimit || '$250k'}</div>
                <div className="text-[10px] text-gray-400 font-medium">Terms: {selectedEntity.creditTerms}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                <div className="text-[10px] uppercase font-bold text-gray-400">Avg Settlement</div>
                <div className="text-sm font-extrabold text-emerald-600 mt-0.5">{selectedEntity.avgDso || '32 Days'}</div>
                <div className="text-[10px] text-emerald-600 font-medium">Within terms</div>
              </div>
            </div>
          </div>

          {/* Sub-tabs inside Inspector */}
          <div className="flex items-center px-4 bg-gray-50 border-b border-gray-100 text-xs font-bold">
            <button
              onClick={() => setInspectorTab('OVERVIEW')}
              className={`py-2.5 px-3 border-b-2 transition ${
                inspectorTab === 'OVERVIEW'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Overview & Banking
            </button>
            <button
              onClick={() => setInspectorTab('VAULT')}
              className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1 ${
                inspectorTab === 'VAULT'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Attached Docs ({selectedEntity.attachedDocs?.length || selectedEntity.docsCount || 0})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[500px]">
            {inspectorTab === 'OVERVIEW' && (
              <>
                {/* Tax & Credentials */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Tax & Regulatory Credentials</span>
                    {selectedEntity.amlScreened && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[11px]">verified</span>
                        <span>AML Cleared</span>
                      </span>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Tax ID / Sovereign ID:</span>
                      <span className="font-mono font-bold text-gray-900 flex items-center gap-1">
                        {selectedEntity.taxId}
                        <span className="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span>
                      </span>
                    </div>
                    {selectedEntity.globalEntityId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-indigo-600">corporate_fare</span>
                          <span>Global Entity ID:</span>
                        </span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 text-[11px]">
                          {selectedEntity.globalEntityId}
                        </span>
                      </div>
                    )}
                    {selectedEntity.taxAuthority && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Issuing Authority:</span>
                        <span className="font-semibold text-gray-800 text-[11px] truncate max-w-[170px]" title={selectedEntity.taxAuthority}>
                          {selectedEntity.taxAuthority}
                        </span>
                      </div>
                    )}
                    {selectedEntity.registrationNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Reg / CR / CIN:</span>
                        <span className="font-mono font-semibold text-gray-800">{selectedEntity.registrationNumber}</span>
                      </div>
                    )}
                    {selectedEntity.kycStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">KYC Standing:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedEntity.kycStatus.toLowerCase().includes('verified')
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedEntity.kycStatus.toLowerCase().includes('pending')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedEntity.kycStatus}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Regulatory Status:</span>
                      <span className="font-medium text-gray-800">{selectedEntity.taxDescription || 'Active Verified'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Base Currency:</span>
                      <span className="font-bold text-blue-600 font-mono">{selectedEntity.currency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Credit Terms:</span>
                      <span className="font-medium text-gray-800">{selectedEntity.creditTerms}</span>
                    </div>
                  </div>
                </div>

                {/* Banking & Remittance Details */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Banking & Wire Remittance Details
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Bank Name:</span>
                      <span className="font-semibold text-gray-900">{selectedEntity.bankDetails?.bankName || 'JPMorgan Chase'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Account / IBAN:</span>
                      <span className="font-mono text-gray-800 font-semibold">{selectedEntity.bankDetails?.accountNumber || '0091829011'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">SWIFT / BIC:</span>
                      <span className="font-mono text-gray-800 font-bold uppercase">{selectedEntity.bankDetails?.swiftIban || 'CHASUS33XXX'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Routing / IFSC:</span>
                      <span className="font-mono text-gray-800">{selectedEntity.bankDetails?.routing || '021000021'}</span>
                    </div>
                  </div>
                </div>

                {/* Designated Stakeholders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Designated Key Stakeholders ({Array.isArray(selectedEntity.stakeholders) && selectedEntity.stakeholders.length > 0 ? selectedEntity.stakeholders.length : 1})
                    </div>
                  </div>

                  {Array.isArray(selectedEntity.stakeholders) && selectedEntity.stakeholders.length > 0 ? (
                    <div className="space-y-2">
                      {selectedEntity.stakeholders.map((s, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900">{s.name || 'Contact Person'}</span>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {s.role || (idx === 0 ? 'Lead Contact' : 'Commercial POC')}
                            </span>
                          </div>
                          {s.email && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-500">Email:</span>
                              <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline">
                                {s.email}
                              </a>
                            </div>
                          )}
                          {s.phone && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-700">{s.phone}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Lead Contact:</span>
                        <span className="font-semibold text-gray-900">{selectedEntity.contactPerson || 'Marcus Vance'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Email:</span>
                        <a href={`mailto:${selectedEntity.contactEmail || 'contact@entity.com'}`} className="text-blue-600 hover:underline">
                          {selectedEntity.contactEmail || selectedEntity.contact}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-700">{selectedEntity.contactPhone || '+1 555-0100'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {inspectorTab === 'VAULT' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-gray-700">Dossier Documents in Vault</span>
                  <button
                    type="button"
                    onClick={onOpenUploadVault}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + Upload File
                  </button>
                </div>

                {(selectedEntity.attachedDocs || []).length > 0 ? (
                  <div className="space-y-2">
                    {selectedEntity.attachedDocs.map((doc, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[20px] text-red-500">picture_as_pdf</span>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{doc.name}</div>
                            <div className="text-[10px] text-gray-400">{doc.category} · {doc.size} · Valid till {doc.expiry}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToast(`Opening preview for ${doc.name}`, 'info')}
                          className="p-1 rounded-md text-gray-400 hover:text-blue-600"
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                    No direct documents attached. Use "Upload File" to attach licenses or MSAs.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenCompanyDossier(selectedEntity.id)}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center justify-center gap-1.5 shadow-xs transition text-xs"
              title={`Open full dedicated dossier for ${selectedEntity.name}`}
            >
              <span className="material-symbols-outlined text-[16px]">folder_shared</span>
              <span>Company Dossier & Docs</span>
            </button>

            <button
              type="button"
              onClick={onOpenUploadVault}
              className="py-2 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Attach</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setEntityToDelete(selectedEntity)}
                className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 font-bold text-rose-700 flex items-center justify-center gap-1 transition text-xs active:scale-95"
                title="Admin only: Delete Entity"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-600">delete_forever</span>
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-gray-400">
          Select an entity from the ledger to view 360 master details
        </div>
      )}
    </div>
  );
}
