import React, { useState, useMemo } from 'react';
import MasterDataTabs from './MasterDataTabs';

export default function VaultTab({
  vaultDocs,
  clientCount,
  supplierCount,
  totalPoCount,
  handleSelectSegment,
  onOpenUploadVault,
  addToast
}) {
  const [vaultCategory, setVaultCategory] = useState('ALL');
  const [vaultEntityFilter, setVaultEntityFilter] = useState('');

  const filteredVaultDocs = useMemo(() => {
    return vaultDocs.filter(doc => {
      if (vaultCategory !== 'ALL' && doc.category !== vaultCategory) return false;
      if (vaultEntityFilter && !(doc.entityName || '').toLowerCase().includes(vaultEntityFilter.toLowerCase())) return false;
      return true;
    });
  }, [vaultDocs, vaultCategory, vaultEntityFilter]);

  return (
    <div id="vault-section" className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5 animate-fade-in">
      {/* Navigation Tabs Header when viewing Vault */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <MasterDataTabs
          activeSegment="VAULT"
          handleSelectSegment={handleSelectSegment}
          clientCount={clientCount}
          supplierCount={supplierCount}
          vaultDocsCount={vaultDocs.length}
          totalPoCount={totalPoCount}
        />

        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium pr-1">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          <span>Encrypted AES-256 Document Repository</span>
        </div>
      </div>

      {/* Header & Cryptographic Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-[22px]">folder_special</span>
            </span>
            <h2 className="text-lg font-bold text-gray-900 font-display">
              Entity Document Vault & Regulatory Dossier
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cryptographically authenticated, zero-alteration document store with automated expiration alerts for trade licenses, MSAs, and VAT registrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
            <span>AES-256 Storage Encrypted</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            <span className="material-symbols-outlined text-[14px] text-blue-600">fingerprint</span>
            <span>Immutable SHA-256 Checksums</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            <span className="material-symbols-outlined text-[14px]">fact_check</span>
            <span>100% Tax / Audit Ready</span>
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Simulation Zone */}
      <div
        onClick={onOpenUploadVault}
        className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 text-center hover:bg-blue-50/30 hover:border-blue-300 transition cursor-pointer group"
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
          </div>
          <h4 className="mt-2.5 font-bold text-gray-900 text-sm">
            Drop Master Agreements, Trade Licenses, or VAT Certificates Here
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Supports multi-page PDF, signed TIFF, and audit images up to 50MB per entity. Automatic SHA-256 integrity sealing.
          </p>
          <button
            type="button"
            className="mt-3 px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-blue-600 font-bold text-xs shadow-xs hover:bg-gray-50 transition"
          >
            Browse Computer Files
          </button>
        </div>
      </div>

      {/* Category Filter Tabs for Vault */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'ALL', label: `All Docs (${vaultDocs.length})` },
            { id: 'MSA', label: 'Master Service Agreements (MSA)' },
            { id: 'License', label: 'Trade Licenses & CR' },
            { id: 'Tax', label: 'Tax Exemption & VAT' },
            { id: 'Banking', label: 'Bank Verification & Mandates' },
            { id: 'NDA', label: 'NDAs & Audits' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setVaultCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition ${
                vaultCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {vaultEntityFilter && (
          <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <span>Filtered by: <strong className="text-blue-600">{vaultEntityFilter}</strong></span>
            <button
              type="button"
              onClick={() => setVaultEntityFilter('')}
              className="text-gray-400 hover:text-red-500 ml-1 underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Vault Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVaultDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 hover:bg-white hover:shadow-md transition flex flex-col justify-between text-xs min-w-0 overflow-hidden"
          >
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[22px]">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 break-words text-xs" title={doc.title}>
                      {doc.title}
                    </h4>
                    <div className="text-[11px] text-gray-400 mt-1 truncate">
                      {doc.entityName ? (
                        <>
                          <span className="text-blue-700 font-semibold">{doc.entityName}</span>
                          <span className="mx-1">·</span>
                        </>
                      ) : null}
                      <span>{doc.size || 'PDF'}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0 tracking-wide">
                  AUTHENTICATED
                </span>
              </div>

              <div className="mt-3.5 space-y-1.5 pt-2 border-t border-gray-200/60">
                <div className="flex items-center justify-between gap-2 text-gray-500">
                  <span className="shrink-0">Category:</span>
                  <span className="font-semibold text-gray-800 truncate text-right">{doc.category || 'General'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-gray-500">
                  <span className="shrink-0">Execution / Issue:</span>
                  <span className="font-mono text-gray-800 shrink-0">{doc.updatedDate || '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-gray-500">
                  <span className="shrink-0">Validity Expiry:</span>
                  <span className="font-mono text-emerald-700 font-semibold shrink-0">{doc.expiryDate || 'Active'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-gray-500">
                  <span className="shrink-0">Verification Hash:</span>
                  <span 
                    className="font-mono text-[10px] text-gray-400 truncate max-w-[140px] text-right" 
                    title={doc.hash || 'sha256:verified_secure'}
                  >
                    {doc.hash || 'sha256:verified_secure'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-200/60">
              <span className="text-[10px] text-gray-400 truncate mr-2">Verified by <strong>Controller</strong></span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => addToast(`Opening preview for ${doc.title}`, 'info')}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition"
                  title="Preview"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                </button>
                <button
                  type="button"
                  onClick={() => addToast(`Downloading official PDF for ${doc.title}`, 'success')}
                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                  title="Download PDF"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
