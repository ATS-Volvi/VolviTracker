import React from 'react';

export default function DeleteEntityModal({
  entityToDelete,
  onClose,
  onConfirmDelete
}) {
  if (!entityToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-slide-up">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-bold text-gray-900 font-display">
              Delete {entityToDelete.category || 'Entity'} from Master Directory?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{entityToDelete.name}</strong> ({entityToDelete.id})? All associated dossier documents, notes, regulatory credentials, and records will be purged.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[16px] shrink-0 mt-0.5">admin_panel_settings</span>
            <span>
              <strong>Administrator Action:</strong> This action cannot be undone. Only users with the Admin role can delete entities from the Master Directory.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">delete_forever</span>
              <span>Permanently Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
