import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Avatar } from '../../../components/widgets/Avatar';
import MasterDataTabs from './MasterDataTabs';
import CreateUserModal from '../../../components/employees/CreateUserModal';
import EditEmployeeModal from '../../../components/employees/EditEmployeeModal';

export default function EmployeesTab({
  clientCount,
  supplierCount,
  vaultDocsCount,
  totalPoCount,
  handleSelectSegment
}) {
  const { employees = [], updateEmployee, removeEmployee } = useData();
  const empList = Array.isArray(employees) ? employees : [];
  const { isAdmin, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'INTERNAL' | 'CLIENT' | 'SUPPLIER'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      supplier
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
        const idMatch = String(e.id || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || roleMatch || orgMatch || idMatch;
      }

      return true;
    });
  }, [empList, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Actions
  const handleConfirmDelete = async () => {
    if (!employeeToDelete || !isAdmin) return;
    setIsDeleting(true);
    try {
      if (removeEmployee) {
        await removeEmployee(employeeToDelete.id);
      }
      addToast(`Account for ${employeeToDelete.fullName} has been permanently deleted.`, 'info', 3000);
      setEmployeeToDelete(null);
    } catch (err) {
      addToast(err?.message || 'Failed to delete employee account.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (updatedFields) => {
    if (!employeeToEdit) return;
    try {
      if (updateEmployee) {
        await updateEmployee(employeeToEdit.id, updatedFields);
      }
      addToast(`Profile for ${updatedFields.fullName || employeeToEdit.fullName} updated successfully.`, 'success');
      setEmployeeToEdit(null);
    } catch (err) {
      addToast(err?.message || 'Failed to update user profile.', 'error');
    }
  };

  return (
    <div id="employees-section" className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6 space-y-5 animate-fade-in text-left">
      {/* 1. Master Data Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <MasterDataTabs
          activeSegment="EMPLOYEES"
          handleSelectSegment={handleSelectSegment}
          clientCount={clientCount}
          supplierCount={supplierCount}
          employeeCount={counts.all}
          vaultDocsCount={vaultDocsCount}
          totalPoCount={totalPoCount}
        />

        <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium pr-1">
          <span className="material-symbols-outlined text-[15px]">badge</span>
          <span>Role-Based Access Control & Directory</span>
        </div>
      </div>

      {/* 2. Header with Title and Create User CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-gray-900 font-display">Team & Users Directory</h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              <span className="material-symbols-outlined text-[13px] text-purple-600">verified_user</span>
              Admin Control
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Authoritative master directory of internal team members, client contacts, and supplier users.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Create User</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Classification Segment Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>All Users</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700 font-bold">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('INTERNAL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'INTERNAL'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-blue-700'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">apartment</span>
            <span>Internal Staff</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFilter === 'INTERNAL' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              {counts.internal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('CLIENT');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'CLIENT'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-emerald-700'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">handshake</span>
            <span>Clients</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFilter === 'CLIENT' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {counts.client}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter('SUPPLIER');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'SUPPLIER'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-gray-600 hover:text-amber-700'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            <span>Suppliers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeFilter === 'SUPPLIER' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {counts.supplier}
            </span>
          </button>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, role, email, org..."
              className="text-xs pl-8 pr-7 py-2 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-full"
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

          {/* View Toggle */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-[18px]">view_list</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Users Content: List View (Table) or Grid View */}
      {filteredList.length === 0 ? (
        <div className="p-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <span className="material-symbols-outlined text-gray-300 text-[42px]">group_off</span>
          <p className="text-sm font-semibold text-gray-700 mt-2">No users found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {searchQuery ? `No matches for "${searchQuery}" in this category.` : 'No users registered under this classification.'}
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition"
            >
              + Create User
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ================= LIST VIEW (TABLE) ================= */
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">User / Member</th>
                  <th className="py-3 px-4">Role & Designation</th>
                  <th className="py-3 px-4">Classification & Organization</th>
                  <th className="py-3 px-4">User ID & Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedList.map((e) => {
                  const isUserAdmin = e.isAdmin === true || (e.role || '').toLowerCase() === 'admin';
                  const isSelf = user && (String(user.id) === String(e.id) || (user.email && e.email && user.email.toLowerCase() === e.email.toLowerCase()));
                  const userType = e.userType || 'internal';
                  const extType = e.externalType || 'client';
                  const org = e.organization || (userType === 'internal' ? 'Volvitech' : '');

                  return (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/employee/${e.id}`)}
                      className="hover:bg-slate-50/90 transition cursor-pointer group"
                    >
                      {/* User / Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={e.avatar} alt={e.fullName} className="h-9 w-9 shrink-0 rounded-full ring-1 ring-gray-100" />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate flex items-center gap-1.5">
                              <span>{e.fullName}</span>
                              {isSelf && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full border border-blue-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                              {e.email || 'No email registered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Designation */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-800">
                            {e.role || 'Member'}
                          </span>
                          {isUserAdmin && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Classification & Organization */}
                      <td className="py-3.5 px-4">
                        {userType === 'internal' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/80">
                            <span className="material-symbols-outlined text-[13px] shrink-0">apartment</span>
                            <span>Internal • {org || 'Volvitech'}</span>
                          </span>
                        ) : extType === 'client' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200/80">
                            <span className="material-symbols-outlined text-[13px] shrink-0">handshake</span>
                            <span>Client: {org || 'Client Company'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200/80">
                            <span className="material-symbols-outlined text-[13px] shrink-0">inventory_2</span>
                            <span>Supplier: {org || 'Supplier Partner'}</span>
                          </span>
                        )}
                      </td>

                      {/* User ID & Access */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400">ID:</span>
                          <span className="text-gray-700 font-semibold">{String(e.id).slice(0, 10)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(evt) => evt.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/employee/${e.id}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Profile"
                          >
                            <span className="material-symbols-outlined text-[17px]">visibility</span>
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEmployeeToEdit(e)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit User"
                            >
                              <span className="material-symbols-outlined text-[17px]">edit</span>
                            </button>
                          )}

                          {isAdmin && !isSelf && (
                            <button
                              type="button"
                              onClick={() => setEmployeeToDelete(e)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Account"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-bold text-gray-700">{filteredList.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-gray-700">{Math.min(currentPage * pageSize, filteredList.length)}</span> of{' '}
              <span className="font-bold text-gray-700">{filteredList.length}</span> users
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= GRID VIEW (CARDS) ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {paginatedList.map(e => {
            const isUserAdmin = e.isAdmin === true || (e.role || '').toLowerCase() === 'admin';
            const isSelf = user && (String(user.id) === String(e.id) || (user.email && e.email && user.email.toLowerCase() === e.email.toLowerCase()));
            const userType = e.userType || 'internal';
            const extType = e.externalType || 'client';
            const org = e.organization || (userType === 'internal' ? 'Volvitech' : '');

            return (
              <div
                key={e.id}
                onClick={() => navigate(`/employee/${e.id}`)}
                className="flex flex-col justify-between rounded-xl border border-gray-100 p-3.5 text-left hover:bg-slate-50 hover:border-purple-200 transition shadow-2xs group relative bg-white cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <Avatar src={e.avatar} alt={e.fullName} className="h-11 w-11 shrink-0 rounded-full" />
                    <div className="flex items-center gap-1.5" onClick={(evt) => evt.stopPropagation()}>
                      {isUserAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200/80 shrink-0">
                          Admin
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setEmployeeToEdit(e)}
                          className="opacity-0 group-hover:opacity-100 hover:bg-amber-50 text-gray-400 hover:text-amber-600 p-1 rounded-lg transition"
                          title={`Edit ${e.fullName}`}
                        >
                          <span className="material-symbols-outlined text-[17px] leading-none">edit</span>
                        </button>
                      )}
                      {isAdmin && !isSelf && (
                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(e)}
                          className="opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-gray-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title={`Delete ${e.fullName}`}
                        >
                          <span className="material-symbols-outlined text-[17px] leading-none">delete</span>
                        </button>
                      )}
                    </div>
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
              </div>
            );
          })}
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          // Reactively updates via DataContext
        }}
      />

      {/* Edit User Modal */}
      {employeeToEdit && (
        <EditEmployeeModal
          isOpen={Boolean(employeeToEdit)}
          employee={employeeToEdit}
          onClose={() => setEmployeeToEdit(null)}
          onSave={handleSaveEdit}
          onDelete={() => {
            const target = employeeToEdit;
            setEmployeeToEdit(null);
            setEmployeeToDelete(target);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full p-6 animate-slide-up text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Employee Account</h3>
                <p className="text-xs text-rose-600 font-semibold">Admin authorization required</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl mb-4 text-xs text-gray-700 leading-relaxed">
              Are you sure you want to permanently delete the account for <strong className="text-gray-900 font-bold">{employeeToDelete.fullName}</strong> (<span className="text-gray-600 font-mono text-[11px]">{employeeToDelete.email}</span>)?
              <p className="mt-2 text-[11px] text-rose-700 font-medium">
                ⚠️ This user will be immediately revoked from the workspace and will no longer be able to log in.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
