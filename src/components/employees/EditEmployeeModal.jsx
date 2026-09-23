import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../widgets/Avatar';

const ROLE_SUGGESTIONS = [
  'Product Lead',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Designer',
  'Project Manager',
  'QA Engineer',
  'DevOps Engineer',
  'Data Analyst'
];

const EditEmployeeModal = ({ isOpen, onClose, employee, onSave, onDelete }) => {
  const { addToast } = useToast();
  const { employees = [] } = useData();
  const { isAdmin: isCurrentUserAdmin } = useAuth();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Designation dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [showAddCustomInput, setShowAddCustomInput] = useState(false);
  const [newCustomRoleInput, setNewCustomRoleInput] = useState('');
  const [customDesignations, setCustomDesignations] = useState(() => {
    try {
      const saved = localStorage.getItem('volvi_custom_designations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setShowAddCustomInput(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Combine default suggestions + employee existing roles + user added custom roles
  const allDesignations = useMemo(() => {
    const pool = [
      ...ROLE_SUGGESTIONS,
      ...(employees || []).map(e => e.role),
      ...(customDesignations || []),
      role
    ];
    const seen = new Set();
    const result = [];
    for (const item of pool) {
      const clean = (item || '').trim();
      if (!clean) continue;
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(clean);
      }
    }
    return result;
  }, [employees, customDesignations, role]);

  // Filtered by search query
  const filteredDesignations = useMemo(() => {
    const q = roleSearchQuery.trim().toLowerCase();
    if (!q) return allDesignations;
    return allDesignations.filter(d => d.toLowerCase().includes(q));
  }, [allDesignations, roleSearchQuery]);

  const handleAddCustomRole = (customRoleName) => {
    const clean = (customRoleName || '').trim();
    if (!clean) return;

    // Check if not already in custom designations
    if (!customDesignations.some(r => r.toLowerCase() === clean.toLowerCase())) {
      const nextCustom = [...customDesignations, clean];
      setCustomDesignations(nextCustom);
      try {
        localStorage.setItem('volvi_custom_designations', JSON.stringify(nextCustom));
      } catch (e) {
        console.error('Failed to save custom designation:', e);
      }
    }

    setRole(clean);
    setRoleSearchQuery('');
    setNewCustomRoleInput('');
    setShowAddCustomInput(false);
    setIsDropdownOpen(false);
    addToast(`Added "${clean}" to designations list`, 'success', 2500);
  };

  useEffect(() => {
    if (isOpen && employee) {
      setFullName(employee.fullName || '');
      setRole((employee.role || '').toLowerCase() === 'admin' ? 'Software Engineer' : (employee.role || ''));
      setAvatar(employee.avatar || '');
      setIsAdminChecked(employee.isAdmin === true || (employee.role || '').toLowerCase() === 'admin');
      setError('');
      setIsDropdownOpen(false);
      setRoleSearchQuery('');
      setShowAddCustomInput(false);
      setNewCustomRoleInput('');
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    let cleanRole = role.trim();

    if (!cleanName) {
      setError('Please enter employee full name.');
      return;
    }

    if (!cleanRole) {
      setError('Please select or add an employee designation/role.');
      return;
    }

    // Safety check: ensure at least one admin exists if revoking admin status
    if (isCurrentUserAdmin && !isAdminChecked) {
      const wasAdmin = employee.isAdmin === true || (employee.role || '').toLowerCase() === 'admin';
      if (wasAdmin) {
        const remainingAdmins = (employees || []).filter(
          e => (e.isAdmin === true || (e.role || '').toLowerCase() === 'admin') && e.id !== employee.id
        );
        if (remainingAdmins.length === 0) {
          setError('Cannot remove admin status: At least one administrator account must be retained.');
          return;
        }
      }
    }

    if (!isAdminChecked && cleanRole.toLowerCase() === 'admin') {
      cleanRole = 'Member';
    }

    // If cleanRole is custom and not yet saved, save it to persistent custom list
    if (!customDesignations.some(r => r.toLowerCase() === cleanRole.toLowerCase()) &&
        !ROLE_SUGGESTIONS.some(r => r.toLowerCase() === cleanRole.toLowerCase())) {
      const nextCustom = [...customDesignations, cleanRole];
      setCustomDesignations(nextCustom);
      try {
        localStorage.setItem('volvi_custom_designations', JSON.stringify(nextCustom));
      } catch (err) {
        console.error(err);
      }
    }

    setSaving(true);
    try {
      await onSave({
        fullName: cleanName,
        role: cleanRole,
        avatar: avatar.trim() || employee.avatar,
        isAdmin: isCurrentUserAdmin ? isAdminChecked : Boolean(employee.isAdmin)
      });
      addToast(`Updated properties for ${cleanName}!`, 'success');
      onClose();
    } catch {
      setError('Failed to update employee properties.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-slide-up text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Employee Details</h3>
              <p className="text-xs text-gray-500">Update name, designation, and profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/80 mb-4">
          <Avatar
            src={avatar || employee.avatar}
            alt={fullName || employee.fullName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-900 truncate">
              {fullName || 'Employee Name'}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md truncate">
                {role || 'Designation'}
              </span>
              <span className="text-[11px] text-gray-500 truncate">{employee.email}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amara Patel"
              className="input-field text-sm"
              required
            />
          </div>

          {/* Designation / Role Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Designation / Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">Select or add custom</span>
            </div>

            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                if (!isDropdownOpen) {
                  setRoleSearchQuery('');
                  setShowAddCustomInput(false);
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-left text-sm text-gray-900 shadow-2xs hover:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${role ? 'bg-purple-600' : 'bg-gray-300'}`} />
                <span className={role ? 'font-medium text-gray-900 truncate' : 'text-gray-400'}>
                  {role || 'Select employee designation...'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-purple-600' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Dropdown Menu Panel */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in text-left">
                {/* Search Box */}
                <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                  <div className="relative">
                    <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 1114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={roleSearchQuery}
                      onChange={(e) => setRoleSearchQuery(e.target.value)}
                      placeholder="Search designations..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                      autoFocus
                    />
                    {roleSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setRoleSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* List of Designations */}
                <div className="max-h-48 overflow-y-auto py-1 divide-y divide-gray-50">
                  {filteredDesignations.length > 0 ? (
                    filteredDesignations.map((d) => {
                      const isSelected = role === d;
                      const isCustom = customDesignations.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setRole(d);
                            setIsDropdownOpen(false);
                            setRoleSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-purple-50 text-purple-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{d}</span>
                            {isCustom && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 font-medium px-1.5 py-0.5 rounded-md shrink-0">
                                custom
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-3 px-4 text-center text-xs text-gray-400">
                      No matching designations found
                    </div>
                  )}

                  {/* Inline quick-create if search query doesn't match any existing designation */}
                  {roleSearchQuery.trim() &&
                    !allDesignations.some(
                      (d) => d.toLowerCase() === roleSearchQuery.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={() => handleAddCustomRole(roleSearchQuery)}
                        className="w-full text-left px-3 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-medium bg-purple-50/40 border-t border-purple-100 transition"
                      >
                        <span className="w-5 h-5 rounded-md bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                          +
                        </span>
                        <span className="truncate">
                          Add <strong>"{roleSearchQuery.trim()}"</strong> as custom designation
                        </span>
                      </button>
                    )}
                </div>

                {/* Bottom Add Custom Designation bar */}
                <div className="p-2 border-t border-gray-100 bg-gray-50">
                  {!showAddCustomInput ? (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomInput(true)}
                      className="w-full text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-purple-50 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Custom Designation</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCustomRoleInput}
                        onChange={(e) => setNewCustomRoleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRole(newCustomRoleInput);
                          }
                        }}
                        placeholder="Enter custom designation..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomRole(newCustomRoleInput)}
                        disabled={!newCustomRoleInput.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg transition shrink-0 disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCustomInput(false);
                          setNewCustomRoleInput('');
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick role pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Designer', 'Software Engineer', 'Product Lead', 'Project Manager'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    role === r
                      ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Email (Read-only / identifier) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={employee.email || ''}
              disabled
              className="input-field text-sm bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Email is used for system identification & login.
            </p>
          </div>

          {/* Avatar URL (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Profile Picture URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="input-field text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=0070F3&color=fff&bold=true`;
                  setAvatar(url);
                }}
                className="btn-ghost text-xs py-2 px-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 shrink-0"
                title="Generate avatar from current name"
              >
                Auto Avatar
              </button>
            </div>
          </div>

          {/* Administrator Privileges Toggle (Admin Only) */}
          {isCurrentUserAdmin && (
            <div className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isAdminChecked ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-200 text-gray-500'
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900">Administrator Privileges</span>
                      {isAdminChecked ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded border border-purple-200/60">
                          Admin Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">
                          Standard Member
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {isAdminChecked
                        ? 'This account has full administrative access across the platform.'
                        : 'Toggle on to grant administrator permissions to this employee.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAdminChecked}
                  onClick={() => {
                    if (isAdminChecked) {
                      const allAdmins = (employees || []).filter(
                        e => (e.isAdmin === true || (e.role || '').toLowerCase() === 'admin') && e.id !== employee.id
                      );
                      if (allAdmins.length === 0) {
                        addToast('Cannot remove admin status: At least one administrator account must be retained.', 'warning', 4000);
                        return;
                      }
                    }
                    setIsAdminChecked(!isAdminChecked);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isAdminChecked ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isAdminChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2.5">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                disabled={saving}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                title="Delete this employee account"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Account</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-ghost text-xs py-2 px-4 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-5 font-semibold flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
