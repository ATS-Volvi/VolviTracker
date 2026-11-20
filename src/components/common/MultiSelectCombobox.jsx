import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * MultiSelectCombobox
 * A modern, searchable multi-select dropdown with chips/badges,
 * live search filtering, checkbox selection, and select/clear all.
 *
 * Props:
 * - values: string[] (array of selected item identifiers/names)
 * - onChange: (newValues: string[], selectedObjects?: any[]) => void
 * - options: Array<string | { id?: string, name?: string, label?: string, poNumber?: string, subtitle?: string, [key: string]: any }>
 * - placeholder?: string
 * - noneOptionLabel?: string (e.g. "No project", "Not linked")
 * - disabled?: boolean
 * - required?: boolean
 * - className?: string
 * - badgeColor?: 'blue' | 'indigo' | 'emerald' | 'gray'
 * - allowCustom?: boolean
 * - emptyMessage?: string
 * - icon?: string
 */
export const MultiSelectCombobox = ({
  values = [],
  onChange,
  options = [],
  placeholder = 'Select options...',
  noneOptionLabel = 'None',
  disabled = false,
  required = false,
  className = '',
  badgeColor = 'blue',
  allowCustom = false,
  emptyMessage = 'No matching items found',
  icon = null
}) => {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize options to objects: { id, name, subtitle, raw }
  const normalizedOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const opt of options) {
      if (!opt) continue;
      const id = typeof opt === 'object' ? (opt.id || opt.poNumber || opt.name || opt.label || '') : opt;
      const name = typeof opt === 'object' ? (opt.name || opt.poNumber || opt.label || opt.projectName || opt.id || '') : opt;
      if (!name) continue;
      const key = String(id || name).trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: String(id || name).trim(),
          name: String(name).trim(),
          subtitle: typeof opt === 'object' ? (opt.subtitle || opt.clientName || '') : '',
          raw: opt
        });
      }
    }
    return list;
  }, [options]);

  // Ensure values is an array of strings
  const selectedValues = useMemo(() => {
    if (!values) return [];
    if (Array.isArray(values)) return values.map(v => String(v).trim());
    if (typeof values === 'string') {
      if (!values.trim() || values === 'No project' || values === 'Not linked' || values === 'None') return [];
      return values.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [values]);

  // Filter based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.name.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const emitChange = (newVals) => {
    if (!onChange) return;
    const selectedObjs = newVals.map(val => {
      const match = normalizedOptions.find(o => o.id === val || o.name === val);
      return match ? match.raw : { id: val, name: val };
    });
    onChange(newVals, selectedObjs);
  };

  const toggleOption = (opt) => {
    const val = opt.id || opt.name;
    const isCurrentlySelected = selectedValues.some(v => v === val || v === opt.name);
    let updated;
    if (isCurrentlySelected) {
      updated = selectedValues.filter(v => v !== val && v !== opt.name);
    } else {
      updated = [...selectedValues, val];
    }
    emitChange(updated);
  };

  const removeSingleValue = (valToRemove, e) => {
    if (e) e.stopPropagation();
    const updated = selectedValues.filter(v => v !== valToRemove);
    emitChange(updated);
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    emitChange([]);
  };

  const handleSelectAll = (e) => {
    if (e) e.stopPropagation();
    const allVals = normalizedOptions.map(o => o.id || o.name);
    emitChange(allVals);
  };

  const handleAddCustom = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (!selectedValues.includes(trimmed)) {
      emitChange([...selectedValues, trimmed]);
    }
    setSearchQuery('');
  };

  // Badge theme colors
  const badgeClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  }[badgeColor] || 'bg-blue-50 text-blue-700 border-blue-200/80';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`w-full min-h-10 px-3 py-1.5 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition shadow-2xs font-medium ${
          disabled
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 pr-1">
          {icon && (
            <span className="material-symbols-outlined text-gray-400 text-[18px] shrink-0">
              {icon}
            </span>
          )}

          {selectedValues.length === 0 ? (
            <span className="text-gray-400 select-none py-1 truncate">
              {placeholder}
            </span>
          ) : (
            selectedValues.map((val) => {
              const matched = normalizedOptions.find(o => o.id === val || o.name === val);
              const label = matched ? matched.name : val;
              return (
                <span
                  key={val}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${badgeClasses} max-w-[200px] truncate`}
                >
                  <span className="truncate">{label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeSingleValue(val, e)}
                      className="text-gray-400 hover:text-rose-600 rounded-sm p-0.2 transition cursor-pointer shrink-0"
                      title={`Remove ${label}`}
                    >
                      <span className="material-symbols-outlined text-[13px] block">close</span>
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition cursor-pointer"
              title="Clear all"
            >
              <span className="material-symbols-outlined text-[15px] block">close</span>
            </button>
          )}
          <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 block ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
            expand_more
          </span>
        </div>
      </div>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          required={required && selectedValues.length === 0}
          value={selectedValues.join(',')}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-slide-up text-left">
          {/* Search Box Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/80">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-7 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-[11px] pt-1.5 px-1 font-semibold text-gray-500">
              <span className="text-gray-600">
                {selectedValues.length === 0 ? 'None selected' : `${selectedValues.length} selected`}
              </span>
              <div className="flex items-center gap-2">
                {selectedValues.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Select all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {/* "None" option (e.g. No project / Not linked) */}
            <button
              type="button"
              onClick={handleClearAll}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                selectedValues.length === 0
                  ? 'bg-gray-100 text-gray-900 font-bold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[15px] text-gray-400">block</span>
                <span>{noneOptionLabel}</span>
              </div>
              {selectedValues.length === 0 && (
                <span className="material-symbols-outlined text-[15px] text-gray-700">check</span>
              )}
            </button>

            <div className="h-px bg-gray-100 my-1" />

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.some(v => v === opt.id || v === opt.name);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Checkbox indicator */}
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[13px] font-bold block leading-none">
                            check
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="truncate font-semibold">{opt.name}</span>
                        {opt.subtitle && (
                          <span className="text-[10px] text-gray-400 truncate mt-0.5 font-normal">
                            {opt.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{emptyMessage}</p>
                {allowCustom && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Add "{searchQuery.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer action bar */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400">
              Click items to toggle
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectCombobox;
