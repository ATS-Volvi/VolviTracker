import React from 'react';

export default function DossierAddStakeholderModal({
  isOpen,
  onClose,
  companyName,
  onSubmit,
  newStakeholder,
  setNewStakeholder
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">person_add</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">Add Key Stakeholder</h3>
              <p className="text-xs text-gray-500">Designating contact for {companyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Henderson"
              value={newStakeholder.name}
              onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Designation / Role</label>
            <input
              type="text"
              placeholder="e.g. Head of Strategic Procurement"
              value={newStakeholder.role}
              onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Email</label>
              <input
                type="email"
                placeholder="alex@company.com"
                value={newStakeholder.email}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Phone</label>
              <input
                type="text"
                placeholder="+1 555-0199"
                value={newStakeholder.phone}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Department</label>
            <input
              type="text"
              placeholder="e.g. Finance & Treasury"
              value={newStakeholder.dept}
              onChange={(e) => setNewStakeholder({ ...newStakeholder, dept: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save Stakeholder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
