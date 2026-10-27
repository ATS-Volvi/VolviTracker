import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../widgets/Avatar';
import CreateUserModal from './CreateUserModal';

export const EmployeesGrid = () => {
  const { employees } = useData();
  const empList = Array.isArray(employees) ? employees : [];
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'INTERNAL' | 'CLIENT' | 'SUPPLIER'
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Counts
  const counts = useMemo(() => {
    let internal = 0;
    let client = 0;
    let supplier = 0;

    empList.forEach(e => {
      const type = e.userType || 'internal';
      if (type === 'internal') {
        internal++;
      } else if (e.externalType === 'supplier') {
        supplier++;
      } else {
        client++;
      }
    });

    return {
      all: empList.length,
      internal,
      client,
      supplier,
      external: client + supplier
    };
  }, [empList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return empList.filter(e => {
      const userType = e.userType || 'internal';
      const extType = e.externalType || 'client';

      if (activeFilter === 'INTERNAL' && userType !== 'internal') return false;
      if (activeFilter === 'CLIENT' && (userType !== 'external' || extType !== 'client')) return false;
      if (activeFilter === 'SUPPLIER' && (userType !== 'external' || extType !== 'supplier')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (e.fullName || '').toLowerCase().includes(q);
        const emailMatch = (e.email || '').toLowerCase().includes(q);
        const roleMatch = (e.role || '').toLowerCase().includes(q);
        const orgMatch = (e.organization || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || roleMatch || orgMatch;
      }

      return true;
    });
  }, [empList, activeFilter, searchQuery]);

  // If not admin, do not render employee directory
  if (!isAdmin) return null;

  return (
    <>
      <section className="card p-5 space-y-4">
        {/* Header with Title and Create User CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900">Team & Users Directory</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              <span className="material-symbols-outlined text-[13px] text-purple-600">verified_user</span>
              Admin Control
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segment Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>All Users</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('INTERNAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'INTERNAL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">apartment</span>
              <span>Internal Staff</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === 'INTERNAL' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {counts.internal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('CLIENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'CLIENT'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">handshake</span>
              <span>Clients</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === 'CLIENT' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {counts.client}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('SUPPLIER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'SUPPLIER'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              <span>Suppliers</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === 'SUPPLIER' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {counts.supplier}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, org..."
              className="input w-full text-xs py-1.5 pl-8 pr-3"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <span className="material-symbols-outlined text-gray-300 text-[40px]">group_off</span>
            <p className="text-sm font-semibold text-gray-700 mt-2">No users found</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {searchQuery ? `No matches for "${searchQuery}" in this category.` : 'No users registered under this classification.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 btn-ghost text-xs py-1.5 px-3 border border-gray-200 font-semibold"
            >
              + Create User
            </button>
          </div>
        ) : (
          /* Users Grid Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredList.map(e => {
              const isUserAdmin = e.isAdmin === true || (e.role || '').toLowerCase() === 'admin';
              const userType = e.userType || 'internal';
              const extType = e.externalType || 'client';
              const org = e.organization || (userType === 'internal' ? 'Volvitech' : '');

              return (
                <button
                  key={e.id}
                  onClick={() => navigate(`/employee/${e.id}`)}
                  className="flex flex-col justify-between rounded-xl border border-gray-100 p-3.5 text-left hover:bg-slate-50 hover:border-purple-200 transition shadow-2xs group relative bg-white"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <Avatar src={e.avatar} alt={e.fullName} className="h-11 w-11 shrink-0 rounded-full" />
                      {isUserAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200/80 shrink-0">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="truncate font-semibold text-sm text-gray-900 group-hover:text-purple-700 transition block">
                        {e.fullName}
                      </span>
                      <span className="inline-block truncate text-[11px] font-medium text-gray-500 mt-0.5">
                        {e.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Brand Tag Pill at bottom */}
                  <div className="pt-2.5 mt-2.5 border-t border-gray-100 flex items-center justify-between">
                    {userType === 'internal' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/80 truncate max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">apartment</span>
                        <span className="truncate">Internal • {org || 'Volvitech'}</span>
                      </span>
                    ) : extType === 'client' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200/80 truncate max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">handshake</span>
                        <span className="truncate">Client: {org || 'Client'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/80 truncate max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">inventory_2</span>
                        <span className="truncate">Supplier: {org || 'Supplier'}</span>
                      </span>
                    )}

                    <span className="material-symbols-outlined text-gray-300 group-hover:text-purple-600 text-[16px] transition shrink-0 ml-1">
                      chevron_right
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          // List updates reactively via DataContext
        }}
      />
    </>
  );
};

export default EmployeesGrid;