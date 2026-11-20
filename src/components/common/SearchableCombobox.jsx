import React, { useState, useRef, useEffect, useMemo } from 'react';

/**
 * SearchableCombobox
 * An input that acts as both a freeform text input and a searchable dropdown.
 *
 * Props:
 * - value: string (current value)
 * - onChange: (val: string, selectedItem?: object) => void
 * - options: Array<string | { id?: string, name: string, subtitle?: string, [key: string]: any }>
 * - placeholder?: string
 * - disabled?: boolean
 * - required?: boolean
 * - className?: string
 * - inputClassName?: string
 * - dropdownClassName?: string
 * - emptyMessage?: string
 * - allowCustom?: boolean (default: true)
 * - icon?: string
 */
export const SearchableCombobox = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select or type to search...',
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  emptyMessage = 'No matches found',
  allowCustom = true,
  icon = null
}) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Normalize options to objects: { id, name, subtitle, raw }
  const normalizedOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const opt of options) {
      if (!opt) continue;
      const name = typeof opt === 'string' ? opt.trim() : (opt.name || opt.label || opt.clientName || opt.supplierName || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: typeof opt === 'object' && opt.id ? opt.id : name,
          name,
          subtitle: typeof opt === 'object' ? (opt.subtitle || [opt.country, opt.classification, opt.category].filter(Boolean).join(' · ')) : '',
          raw: opt
        });
      }
    }
    return list;
  }, [options]);

  // Filter based on query
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.name.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  }, [normalizedOptions, query]);

  // Sync query when value changes externally while closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(value || '');
    }
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);
    if (allowCustom && onChange) {
      onChange(val);
    }
  };

  const handleFocus = () => {
    setQuery(value || '');
    setIsOpen(true);
  };

  const handleSelect = (item) => {
    const selectedName = typeof item === 'string' ? item : item.name;
    setQuery(selectedName);
    setIsOpen(false);
    if (onChange) {
      onChange(selectedName, typeof item === 'object' ? item.raw : null);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          required={required}
          value={isOpen ? query : (value || '')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`w-full h-10 ${icon ? 'pl-9' : 'pl-3'} pr-8 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!isOpen) {
              setQuery(value || '');
              setIsOpen(true);
              inputRef.current?.focus();
            } else {
              setIsOpen(false);
            }
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          title="Toggle options"
        >
          <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 block ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>
      </div>

      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 scrollbar-thin animate-fadeIn ${dropdownClassName}`}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = (value || '').trim().toLowerCase() === opt.name.toLowerCase();
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-semibold">{opt.name}</span>
                    {opt.subtitle && (
                      <span className="text-[10px] text-gray-400 truncate mt-0.5">
                        {opt.subtitle}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px] text-blue-600 shrink-0">check</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{emptyMessage}</p>
              {allowCustom && query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Use "{query.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { MultiSelectCombobox } from './MultiSelectCombobox';
export default SearchableCombobox;
