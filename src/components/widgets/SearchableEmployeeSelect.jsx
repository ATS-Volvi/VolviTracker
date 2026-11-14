import React, { useState, useEffect, useRef, useMemo } from 'react';

const THEMES = {
  blue: {
    ring: 'focus:ring-blue-500',
    borderFocus: 'focus:border-blue-500',
    borderHover: 'hover:border-blue-400',
    textActive: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    chip: 'bg-blue-50 text-blue-800 border-blue-200',
    chipRemove: 'text-blue-400 hover:text-blue-700 hover:bg-blue-200/50',
    selectedRow: 'bg-blue-50/90 text-blue-900 border-blue-200',
    checkbox: 'accent-blue-600 bg-blue-600 border-blue-600',
    link: 'text-blue-600 hover:text-blue-800',
    avatarBg: '0070F3'
  },
  purple: {
    ring: 'focus:ring-purple-500',
    borderFocus: 'focus:border-purple-500',
    borderHover: 'hover:border-purple-400',
    textActive: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
    chip: 'bg-purple-50 text-purple-800 border-purple-200',
    chipRemove: 'text-purple-400 hover:text-purple-700 hover:bg-purple-200/50',
    selectedRow: 'bg-purple-50 text-purple-900 border-purple-200/80',
    checkbox: 'accent-purple-600 bg-purple-600 border-purple-600',
    link: 'text-purple-600 hover:text-purple-800',
    avatarBg: '8B5CF6'
  },
  indigo: {
    ring: 'focus:ring-indigo-500',
    borderFocus: 'focus:border-indigo-500',
    borderHover: 'hover:border-indigo-400',
    textActive: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    chip: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    chipRemove: 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-200/50',
    selectedRow: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    checkbox: 'accent-indigo-600 bg-indigo-600 border-indigo-600',
    link: 'text-indigo-600 hover:text-indigo-800',
    avatarBg: '6366F1'
  },
  emerald: {
    ring: 'focus:ring-emerald-500',
    borderFocus: 'focus:border-emerald-500',
    borderHover: 'hover:border-emerald-400',
    textActive: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    chipRemove: 'text-emerald-400 hover:text-emerald-700 hover:bg-emerald-200/50',
    selectedRow: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    checkbox: 'accent-emerald-600 bg-emerald-600 border-emerald-600',
    link: 'text-emerald-600 hover:text-emerald-800',
    avatarBg: '10B981'
  }
};

const getAvatarUrl = (emp, fallbackBg = '0070F3') => {
  if (emp?.avatar) return emp.avatar;
  const name = emp?.fullName || emp?.email || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${fallbackBg}&color=fff`;
};

export const SearchableEmployeeSelect = ({
  employees = [],
  selectedIds = [],
  selectedId = null,
  onChange,
  multiple = true,
  placeholder = 'Select team members...',
  searchPlaceholder = 'Search employees by name, role, email...',
  label = null,
  sublabel = null,
  accentColor = 'blue',
  highlightIds = [],
  highlightBadgeLabel = 'Project Team',
  showChips = true,
  compact = false,
  singleAllowUnassign = true,
  singleUnassignLabel = 'Unassigned',
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const theme = THEMES[accentColor] || THEMES.blue;

  // Normalize selected IDs set for fast O(1) checks
  const selectedSet = useMemo(() => {
    if (multiple) {
      return new Set((selectedIds || []).map(String));
    }
    return new Set(selectedId !== undefined && selectedId !== null && selectedId !== '' ? [String(selectedId)] : []);
  }, [multiple, selectedIds, selectedId]);

  // Selected employee objects
  const selectedEmployees = useMemo(() => {
    if (multiple) {
      return (selectedIds || [])
        .map(id => employees.find(e => String(e.id) === String(id)))
        .filter(Boolean);
    }
    if (selectedId !== undefined && selectedId !== null && selectedId !== '') {
      const match = employees.find(e => String(e.id) === String(selectedId));
      return match ? [match] : [];
    }
    return [];
  }, [multiple, selectedIds, selectedId, employees]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const list = employees.filter(emp => {
      if (!q) return true;
      const nameMatch = (emp.fullName || '').toLowerCase().includes(q);
      const emailMatch = (emp.email || '').toLowerCase().includes(q);
      const roleMatch = (emp.role || '').toLowerCase().includes(q);
      const deptMatch = (emp.department || emp.organization || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || roleMatch || deptMatch;
    });

    const highlightSet = new Set((highlightIds || []).map(String));

    return [...list].sort((a, b) => {
      const aSel = selectedSet.has(String(a.id));
      const bSel = selectedSet.has(String(b.id));

      if (multiple) {
        if (aSel && !bSel) return -1;
        if (!aSel && bSel) return 1;
      }

      const aHigh = highlightSet.has(String(a.id));
      const bHigh = highlightSet.has(String(b.id));
      if (aHigh && !bHigh) return -1;
      if (!aHigh && bHigh) return 1;

      if (!multiple) {
        const aIsAdminOrPm = a.isAdmin === true || ['admin', 'project manager'].some(r => (a.role || '').toLowerCase().includes(r));
        const bIsAdminOrPm = b.isAdmin === true || ['admin', 'project manager'].some(r => (b.role || '').toLowerCase().includes(r));
        if (aIsAdminOrPm && !bIsAdminOrPm) return -1;
        if (!aIsAdminOrPm && bIsAdminOrPm) return 1;
      }

      return (a.fullName || '').localeCompare(b.fullName || '');
    });
  }, [employees, searchTerm, selectedSet, multiple, highlightIds]);

  const toggleEmployee = (empId) => {
    const targetId = String(empId);
    const currentList = Array.isArray(selectedIds) ? selectedIds.map(String) : [];
    let updated;
    if (currentList.includes(targetId)) {
      updated = currentList.filter(id => id !== targetId);
    } else {
      updated = [...currentList, targetId];
    }
    onChange?.(updated);
  };

  const selectSingleEmployee = (emp) => {
    onChange?.(emp);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    const allIds = employees.map(e => String(e.id));
    onChange?.(allIds);
  };

  const handleClearAll = () => {
    if (multiple) {
      onChange?.([]);
    } else {
      onChange?.(null);
    }
  };

  const highlightSet = useMemo(() => new Set((highlightIds || []).map(String)), [highlightIds]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Optional Header Label */}
      {!compact && label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            {label}
            {multiple && (
              <span className="font-normal text-gray-500 ml-1">
                ({selectedEmployees.length} selected)
              </span>
            )}
          </label>
          {sublabel || (
            multiple && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                {selectedEmployees.length} selected
              </span>
            )
          )}
        </div>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={
          buttonClassName ||
          (compact
            ? 'w-full h-9.5 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-left text-xs flex items-center justify-between text-slate-700 shadow-2xs transition cursor-pointer'
            : `input-field text-xs min-h-[38px] py-1.5 px-3 bg-white flex items-center justify-between gap-2 w-full text-left cursor-pointer ${theme.borderHover} transition`)
        }
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedEmployees.length === 0 ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="truncate">{placeholder}</span>
            </div>
          ) : multiple ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <div className="flex items-center -space-x-1.5 shrink-0 overflow-hidden">
                {selectedEmployees.slice(0, 4).map(emp => (
                  <img
                    key={emp.id}
                    src={getAvatarUrl(emp, theme.avatarBg)}
                    alt={emp.fullName}
                    className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-2xs shrink-0"
                    onError={(ev) => {
                      ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || 'User')}&background=${theme.avatarBg}&color=fff`;
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-800 truncate">
                {selectedEmployees.length === 1
                  ? selectedEmployees[0].fullName
                  : selectedEmployees.length <= 3
                  ? selectedEmployees.map(e => e.fullName?.split(' ')[0] || e.email).filter(Boolean).join(', ')
                  : `${selectedEmployees.length} members selected`}
              </span>
            </div>
          ) : (
            // Single select preview
            <div className="flex items-center gap-2 min-w-0 truncate">
              <img
                src={getAvatarUrl(selectedEmployees[0], theme.avatarBg)}
                alt={selectedEmployees[0].fullName}
                className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-2xs shrink-0"
                onError={(ev) => {
                  ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployees[0].fullName || 'User')}&background=${theme.avatarBg}&color=fff`;
                }}
              />
              <span className="text-xs font-bold text-gray-900 truncate">
                {selectedEmployees[0].fullName}
              </span>
              <span className="text-[10px] text-gray-400 truncate">
                ({selectedEmployees[0].role || 'Member'})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          {selectedEmployees.length > 0 && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="hover:text-rose-500 hover:bg-rose-50 rounded p-0.5 text-xs font-bold transition px-1"
              title="Clear selection"
            >
              ✕
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? `rotate-180 ${theme.textActive}` : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl bg-white border border-gray-200 shadow-xl p-2.5 space-y-2 animate-slide-up text-left">
          {/* Search Box */}
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 ${theme.ring}`}
            />
          </div>

          {/* Action Bar (Multiple only) */}
          {multiple && (
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 text-[11px] px-1">
              <span className="font-semibold text-gray-600">
                {selectedEmployees.length} of {employees.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`font-semibold hover:underline ${theme.link}`}
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Single Select: Unassign Option */}
          {!multiple && singleAllowUnassign && (
            <div
              onClick={() => selectSingleEmployee(null)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition select-none ${
                selectedEmployees.length === 0
                  ? `${theme.selectedRow} font-semibold`
                  : 'hover:bg-gray-50 text-gray-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-gray-400">person_off</span>
                <span>{singleUnassignLabel}</span>
              </div>
              {selectedEmployees.length === 0 && <span className={`${theme.textActive} font-bold`}>✓</span>}
            </div>
          )}

          {/* Member List */}
          <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
            {filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">
                No matching team members found
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isSelected = selectedSet.has(String(emp.id));
                const isHighlighted = highlightSet.has(String(emp.id));
                const isAdmin = emp.isAdmin === true || (emp.role || '').toLowerCase().trim() === 'admin';
                const isPm = (emp.role || '').toLowerCase().trim() === 'project manager' || (emp.role || '').toLowerCase().includes('project manager');

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (multiple) {
                        toggleEmployee(emp.id);
                      } else {
                        selectSingleEmployee(emp);
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer select-none ${
                      isSelected
                        ? `${theme.selectedRow} border font-medium`
                        : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {multiple ? (
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${
                            isSelected
                              ? `${theme.checkbox} text-white`
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ) : null}

                      <img
                        src={getAvatarUrl(emp, theme.avatarBg)}
                        alt={emp.fullName}
                        className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
                        onError={(ev) => {
                          ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || 'User')}&background=${theme.avatarBg}&color=fff`;
                        }}
                      />

                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                          <span>{emp.fullName}</span>
                          {isHighlighted && (
                            <span className="text-[9px] px-1 py-0.2 rounded font-medium text-purple-700 bg-purple-50 border border-purple-200 shrink-0">
                              {highlightBadgeLabel}
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                              Admin
                            </span>
                          )}
                          {!isAdmin && isPm && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                              PM
                            </span>
                          )}
                          {emp.userType === 'external' && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200 shrink-0">
                              External
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {emp.role || 'Member'}{emp.email ? ` • ${emp.email}` : ''}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className={`text-[11px] font-bold ${theme.textActive} shrink-0 ml-2`}>
                        ✓
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Members Chips Preview (removable directly from chips) */}
      {!compact && showChips && multiple && selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-0.5">
          {selectedEmployees.map(emp => (
            <span
              key={emp.id}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border shadow-2xs ${theme.chip}`}
            >
              <img
                src={getAvatarUrl(emp, theme.avatarBg)}
                alt={emp.fullName}
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                onError={(ev) => {
                  ev.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.fullName || 'User')}&background=${theme.avatarBg}&color=fff`;
                }}
              />
              <span className="max-w-[120px] truncate">{emp.fullName}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEmployee(emp.id);
                }}
                className={`rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold ml-0.5 transition cursor-pointer ${theme.chipRemove}`}
                title={`Remove ${emp.fullName}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchableEmployeeSelect;
