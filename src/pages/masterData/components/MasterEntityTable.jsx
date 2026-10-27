import React, { useState } from 'react';

export default function MasterEntityTable({
  filteredEntities,
  selectedEntityId,
  setSelectedEntityId,
  activeSegment,
  clientCount,
  supplierCount,
  isAdmin,
  setEntityToDelete,
  handleOpenCompanyDossier
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(filteredEntities.length / pageSize) || 1;
  const paginatedEntities = filteredEntities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Legal Entity / Company Name</th>
              <th className="py-3 px-4">Country & Sovereign Jurisdiction</th>
              <th className="py-3 px-4">Designated Key Stakeholders</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredEntities.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">folder_off</span>
                  <p className="text-sm font-semibold text-gray-700">No {activeSegment === 'SUPPLIERS' ? 'suppliers' : 'clients'} found</p>
                  <p className="text-xs text-gray-400 mt-1">Try clearing filters or register a new {activeSegment === 'SUPPLIERS' ? 'supplier' : 'client'}</p>
                </td>
              </tr>
            ) : (
              paginatedEntities.map((ent) => {
                const isSelected = selectedEntityId === ent.id;
                const primaryStakeholder = Array.isArray(ent.stakeholders) && ent.stakeholders.length > 0 ? ent.stakeholders[0] : null;
                const contactName = ent.contactPerson || primaryStakeholder?.name || 'Lead Contact';
                const contactRole = primaryStakeholder?.role || 'Primary Contact';
                const contactPhone = ent.contactPhone || primaryStakeholder?.phone || '';

                return (
                  <tr
                    key={ent.id}
                    onClick={() => setSelectedEntityId(ent.id)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/60 ring-1 ring-blue-500/20'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {/* 1. Legal Entity / Company Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          ent.category === 'Client'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {ent.avatarText || 'EN'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                            <span>{ent.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                            <span className="font-mono text-gray-500 font-semibold">{ent.id}</span>
                            <span>•</span>
                            <span className={ent.category === 'Client' ? 'text-blue-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                              {ent.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Country & Sovereign Jurisdiction */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{ent.country}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-gray-400">
                          {ent.classification === 'Domestic' ? 'home' : 'public'}
                        </span>
                        <span>{ent.classification || 'International'} Jurisdiction</span>
                      </div>
                    </td>

                    {/* 3. Designated Key Stakeholders */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{contactName}</span>
                        {Array.isArray(ent.stakeholders) && ent.stakeholders.length > 1 && (
                          <span
                            className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full border border-blue-200"
                            title={`${ent.stakeholders.length} Stakeholders registered`}
                          >
                            +{ent.stakeholders.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                        <span className="text-gray-600 font-medium">{contactRole}</span>
                        {contactPhone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-gray-400">{contactPhone}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 4. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEntityToDelete(ent);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title={`Admin only: Delete ${ent.name} from Master Directory`}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCompanyDossier(ent.id);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                          title={`Open ${ent.name} Docs & Text Info`}
                        >
                          <span className="material-symbols-outlined text-[18px]">folder</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCompanyDossier(ent.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                          title={`Inspect ${ent.name} Full Dossier`}
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Showing {paginatedEntities.length} of {filteredEntities.length} ({activeSegment === 'SUPPLIERS' ? supplierCount : clientCount} total)</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Previous Page"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="font-semibold text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Next Page"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </>
  );
}
