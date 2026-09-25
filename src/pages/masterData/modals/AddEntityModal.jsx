import React, { useState, useEffect, useRef, useMemo } from 'react';

const INITIAL_COUNTRIES = [
  { name: 'India', flag: '🇮🇳', code: 'IN', display: 'India (India 🇮🇳)' },
  { name: 'United States', flag: '🇺🇸', code: 'US', display: 'United States (USA 🇺🇸)' },
  { name: 'United Arab Emirates', flag: '🇦🇪', code: 'AE', display: 'United Arab Emirates (UAE 🇦🇪)' },
  { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA', display: 'Saudi Arabia (KSA 🇸🇦)' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'GB', display: 'United Kingdom (UK 🇬🇧)' },
  { name: 'Singapore', flag: '🇸🇬', code: 'SG', display: 'Singapore (Singapore 🇸🇬)' },
  { name: 'Germany', flag: '🇩🇪', code: 'DE', display: 'Germany (Germany 🇩🇪)' },
  { name: 'France', flag: '🇫🇷', code: 'FR', display: 'France (France 🇫🇷)' },
  { name: 'Canada', flag: '🇨🇦', code: 'CA', display: 'Canada (Canada 🇨🇦)' },
  { name: 'Australia', flag: '🇦🇺', code: 'AU', display: 'Australia (Australia 🇦🇺)' },
  { name: 'Japan', flag: '🇯🇵', code: 'JP', display: 'Japan (Japan 🇯🇵)' },
  { name: 'China', flag: '🇨🇳', code: 'CN', display: 'China (China 🇨🇳)' },
  { name: 'Qatar', flag: '🇶🇦', code: 'QA', display: 'Qatar (Qatar 🇶🇦)' },
  { name: 'Kuwait', flag: '🇰🇼', code: 'KW', display: 'Kuwait (Kuwait 🇰🇼)' },
  { name: 'Oman', flag: '🇴🇲', code: 'OM', display: 'Oman (Oman 🇴🇲)' },
  { name: 'Bahrain', flag: '🇧🇭', code: 'BH', display: 'Bahrain (Bahrain 🇧🇭)' },
  { name: 'Egypt', flag: '🇪🇬', code: 'EG', display: 'Egypt (Egypt 🇪🇬)' },
  { name: 'Netherlands', flag: '🇳🇱', code: 'NL', display: 'Netherlands (Netherlands 🇳🇱)' },
  { name: 'Switzerland', flag: '🇨🇭', code: 'CH', display: 'Switzerland (Switzerland 🇨🇭)' },
  { name: 'Spain', flag: '🇪🇸', code: 'ES', display: 'Spain (Spain 🇪🇸)' },
  { name: 'Italy', flag: '🇮🇹', code: 'IT', display: 'Italy (Italy 🇮🇹)' },
  { name: 'Ireland', flag: '🇮🇪', code: 'IE', display: 'Ireland (Ireland 🇮🇪)' },
  { name: 'Sweden', flag: '🇸🇪', code: 'SE', display: 'Sweden (Sweden 🇸🇪)' },
  { name: 'Norway', flag: '🇳🇴', code: 'NO', display: 'Norway (Norway 🇳🇴)' },
  { name: 'Denmark', flag: '🇩🇰', code: 'DK', display: 'Denmark (Denmark 🇩🇰)' },
  { name: 'South Africa', flag: '🇿🇦', code: 'ZA', display: 'South Africa (South Africa 🇿🇦)' },
  { name: 'Brazil', flag: '🇧🇷', code: 'BR', display: 'Brazil (Brazil 🇧🇷)' },
  { name: 'Mexico', flag: '🇲🇽', code: 'MX', display: 'Mexico (Mexico 🇲🇽)' },
  { name: 'Malaysia', flag: '🇲🇾', code: 'MY', display: 'Malaysia (Malaysia 🇲🇾)' },
  { name: 'Indonesia', flag: '🇮🇩', code: 'ID', display: 'Indonesia (Indonesia 🇮🇩)' },
  { name: 'Turkey', flag: '🇹🇷', code: 'TR', display: 'Turkey (Turkey 🇹🇷)' },
  { name: 'South Korea', flag: '🇰🇷', code: 'KR', display: 'South Korea (South Korea 🇰🇷)' },
  { name: 'New Zealand', flag: '🇳🇿', code: 'NZ', display: 'New Zealand (New Zealand 🇳🇿)' },
  { name: 'Thailand', flag: '🇹🇭', code: 'TH', display: 'Thailand (Thailand 🇹🇭)' },
  { name: 'Vietnam', flag: '🇻🇳', code: 'VN', display: 'Vietnam (Vietnam 🇻🇳)' },
  { name: 'Poland', flag: '🇵🇱', code: 'PL', display: 'Poland (Poland 🇵🇱)' },
  { name: 'Portugal', flag: '🇵🇹', code: 'PT', display: 'Portugal (Portugal 🇵🇹)' },
  { name: 'Belgium', flag: '🇧🇪', code: 'BE', display: 'Belgium (Belgium 🇧🇪)' },
  { name: 'Austria', flag: '🇦🇹', code: 'AT', display: 'Austria (Austria 🇦🇹)' },
  { name: 'Greece', flag: '🇬🇷', code: 'GR', display: 'Greece (Greece 🇬🇷)' },
  { name: 'Israel', flag: '🇮🇱', code: 'IL', display: 'Israel (Israel 🇮🇱)' },
  { name: 'Philippines', flag: '🇵🇭', code: 'PH', display: 'Philippines (Philippines 🇵🇭)' },
  { name: 'Kenya', flag: '🇰🇪', code: 'KE', display: 'Kenya (Kenya 🇰🇪)' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'NG', display: 'Nigeria (Nigeria 🇳🇬)' },
  { name: 'Argentina', flag: '🇦🇷', code: 'AR', display: 'Argentina (Argentina 🇦🇷)' },
  { name: 'Chile', flag: '🇨🇱', code: 'CL', display: 'Chile (Chile 🇨🇱)' },
  { name: 'Colombia', flag: '🇨🇴', code: 'CO', display: 'Colombia (Colombia 🇨🇴)' },
];

const CountrySearchSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState(() => {
    try {
      const saved = localStorage.getItem('volvitech_custom_countries');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingNames = new Set(INITIAL_COUNTRIES.map(c => c.name.toLowerCase()));
        const customOnly = parsed.filter(c => !existingNames.has(c.name.toLowerCase()));
        return [...INITIAL_COUNTRIES, ...customOnly];
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_COUNTRIES;
  });

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const q = searchQuery.toLowerCase().trim();
    return countries.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.code.toLowerCase().includes(q) ||
           c.display.toLowerCase().includes(q)
    );
  }, [countries, searchQuery]);

  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return countries.some(c => c.name.toLowerCase() === q || c.display.toLowerCase() === q);
  }, [countries, searchQuery]);

  const handleSelectCountry = (countryObj) => {
    onChange(countryObj.display);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAddNewCountry = (customName) => {
    if (!customName.trim()) return;
    const trimmed = customName.trim();
    const existing = countries.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleSelectCountry(existing);
      return;
    }
    const code = trimmed.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GL';
    const newCountry = {
      name: trimmed,
      flag: '🌐',
      code,
      display: `${trimmed} (${trimmed} 🌐)`
    };

    const updated = [newCountry, ...countries];
    setCountries(updated);
    try {
      const customOnly = updated.filter(c => !INITIAL_COUNTRIES.some(init => init.name.toLowerCase() === c.name.toLowerCase()));
      localStorage.setItem('volvitech_custom_countries', JSON.stringify(customOnly));
    } catch (e) {
      console.error(e);
    }

    onChange(newCountry.display);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Find currently selected country display
  const currentSelection = useMemo(() => {
    if (!value) return countries[0];
    return countries.find(
      c => c.display === value ||
           c.name.toLowerCase() === value.toLowerCase() ||
           value.toLowerCase().includes(c.name.toLowerCase())
    ) || {
      name: value,
      flag: '🌐',
      code: 'GL',
      display: value
    };
  }, [countries, value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 font-medium mb-1">
        Country & Sovereign Jurisdiction *
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className={`w-full px-3.5 py-2.5 border rounded-xl flex items-center justify-between text-left transition font-medium bg-white text-xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-gray-200 hover:border-gray-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-base leading-none">{currentSelection.flag || '🌐'}</span>
          <span className="text-gray-900 font-semibold truncate">{currentSelection.display}</span>
        </div>
        <span
          className="material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 shrink-0"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        >
          expand_more
        </span>
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 space-y-1.5 max-h-80 flex flex-col">
          {/* Search Input Field */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-gray-400 text-[18px]">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search or type new country name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredCountries.length > 0 && hasExactMatch) {
                    handleSelectCountry(filteredCountries[0]);
                  } else if (searchQuery.trim()) {
                    handleAddNewCountry(searchQuery);
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              className="w-full text-xs pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Add Option when user types a non-exact match */}
          {searchQuery.trim() && !hasExactMatch && (
            <button
              type="button"
              onClick={() => handleAddNewCountry(searchQuery)}
              className="w-full px-3 py-2 text-left bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition flex items-center justify-between group border border-blue-200/70"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-[18px] text-blue-600">add_circle</span>
                <span className="truncate">Add <strong>"{searchQuery.trim()}"</strong> as new country</span>
              </div>
              <span className="text-[10px] bg-blue-200/60 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
                New
              </span>
            </button>
          )}

          {/* List of Countries */}
          <div className="overflow-y-auto max-h-52 divide-y divide-gray-50 space-y-0.5 pr-0.5">
            {filteredCountries.map((c, index) => {
              const isSelected = value === c.display || value === c.name;
              return (
                <button
                  key={`${c.name}-${index}`}
                  type="button"
                  onClick={() => handleSelectCountry(c)}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded font-semibold">
                      {c.code}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">
                      check
                    </span>
                  )}
                </button>
              );
            })}

            {filteredCountries.length === 0 && (
              <div className="p-3 text-center text-gray-400 text-xs">
                <p>No matching country found</p>
                {searchQuery.trim() && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Press <strong>Enter</strong> or click above to add it.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AddEntityModal = ({
  isOpen,
  onClose,
  onSave,
  defaultCategory = 'Client'
}) => {
  const [category, setCategory] = useState(defaultCategory); // 'Client' | 'Supplier'

  // Ensure category stays synced with defaultCategory prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory || 'Client');
      setName('');
      setDepartment('');
      setCompanyMail('');
      setStakeholders([
        {
          name: '',
          email: '',
          phone: '',
          role: 'Primary Contact'
        }
      ]);
    }
  }, [isOpen, defaultCategory]);
  const [classification, setClassification] = useState('Domestic'); // 'Domestic' | 'International'
  const [name, setName] = useState('');
  const [country, setCountry] = useState('India 🇮🇳');
  const [department, setDepartment] = useState('');
  const [companyMail, setCompanyMail] = useState('');
  const [stakeholders, setStakeholders] = useState([
    {
      name: '',
      email: '',
      phone: '',
      role: 'Primary Contact'
    }
  ]);

  const handleAddStakeholder = () => {
    setStakeholders(prev => [
      ...prev,
      {
        name: '',
        email: '',
        phone: '',
        role: prev.length === 1 ? 'Billing / Finance' : prev.length === 2 ? 'Technical POC' : 'Commercial Stakeholder'
      }
    ]);
  };

  const handleRemoveStakeholder = (index) => {
    if (stakeholders.length <= 1) return;
    setStakeholders(prev => prev.filter((_, i) => i !== index));
  };

  const handleStakeholderChange = (index, field, value) => {
    setStakeholders(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const [currency, setCurrency] = useState('USD');
  const [creditTerms, setCreditTerms] = useState('Net 30');
  const [creditLimit, setCreditLimit] = useState('$250,000');
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftIban, setSwiftIban] = useState('');
  const [routing, setRouting] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate avatar text (first letter of first two words)
    const words = name.trim().split(' ');
    const avatarText = (words[0][0] + (words[1] ? words[1][0] : words[0][1] || '')).toUpperCase();

    // Generate Entity ID based on country and category
    const getCountryPrefix = (cStr) => {
      if (!cStr) return 'GL';
      if (cStr.includes('USA') || cStr.includes('United States')) return 'US';
      if (cStr.includes('UAE') || cStr.includes('United Arab Emirates')) return 'AE';
      if (cStr.includes('India')) return 'IN';
      if (cStr.includes('KSA') || cStr.includes('Saudi Arabia')) return 'SA';
      if (cStr.includes('UK') || cStr.includes('United Kingdom')) return 'GB';
      if (cStr.includes('Singapore')) return 'SG';
      if (cStr.includes('Germany')) return 'DE';
      if (cStr.includes('France')) return 'FR';
      if (cStr.includes('Canada')) return 'CA';
      if (cStr.includes('Australia')) return 'AU';
      if (cStr.includes('Japan')) return 'JP';
      const match = cStr.match(/\(([A-Z]{2,3})\b/);
      if (match) return match[1].slice(0, 2);
      const clean = cStr.replace(/[^a-zA-Z]/g, '').toUpperCase();
      return clean.slice(0, 2) || 'GL';
    };
    const countryPrefix = getCountryPrefix(country);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const idPrefix = category === 'Supplier' ? 'SU' : 'CL';
    const entityId = `${idPrefix}-${countryPrefix}-${randomCode}`;

    // Designated key stakeholders logic
    const firstNonEmpty = stakeholders.find(s => s.name?.trim() || s.email?.trim()) || stakeholders[0] || {};
    const leadContactPerson = firstNonEmpty.name?.trim() || 'Operations Lead';
    const leadContactEmail = firstNonEmpty.email?.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const leadContactPhone = firstNonEmpty.phone?.trim() || '+1 555-0100';

    const cleanStakeholders = stakeholders
      .filter(s => s.name?.trim() || s.email?.trim() || s.phone?.trim())
      .map((s, idx) => ({
        name: s.name?.trim() || `Stakeholder #${idx + 1}`,
        email: s.email?.trim() || leadContactEmail,
        phone: s.phone?.trim() || leadContactPhone,
        role: s.role?.trim() || (idx === 0 ? 'Primary Contact' : 'Commercial Stakeholder')
      }));

    const finalStakeholders = cleanStakeholders.length > 0 ? cleanStakeholders : [
      {
        name: leadContactPerson,
        email: leadContactEmail,
        phone: leadContactPhone,
        role: 'Primary Contact'
      }
    ];

    const newEntity = {
      id: entityId,
      name: name.trim(),
      category,
      classification,
      country,
      avatarText,
      department: department.trim() || 'Procurement & Strategic Sourcing',
      companyMail: companyMail.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      taxId: `${countryPrefix}-TAX-${randomCode}`,
      taxDescription: 'Verified Regulatory Filing',
      contactPerson: leadContactPerson,
      contactEmail: leadContactEmail,
      contactPhone: leadContactPhone,
      contact: `${leadContactPerson} (${leadContactEmail})`,
      stakeholders: finalStakeholders,
      creditTerms: `${creditTerms} (Direct)`,
      creditLimit: creditLimit.trim() || '$100,000',
      currency,
      activePoVolume: `${currency === 'INR' ? '₹' : currency === 'AED' ? 'AED ' : currency === 'SAR' ? 'SAR ' : '$'}0`,
      activePoCount: 0,
      compliance: 'Verified',
      docsCount: 1,
      lifetimeBilled: '$0.00',
      unbilledCap: creditLimit.trim() || '$100,000',
      avgDso: '30 Days',
      bankDetails: {
        bankName: bankName.trim() || 'Global Commercial Banking',
        accountNumber: accountNumber.trim() || '0091829011',
        swiftIban: swiftIban.trim() || 'COMMUS33XXX',
        routing: routing.trim() || '0100010'
      },
      attachedDocs: [
        {
          name: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Agreement.pdf`,
          size: '1.4 MB',
          category: 'MSA',
          expiry: '2026-12-31'
        }
      ]
    };

    onSave(newEntity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-slide-up my-auto overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5.5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/90 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${category === 'Client' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              <span className="material-symbols-outlined text-[24px]">
                {category === 'Client' ? 'person_add' : 'domain_add'}
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-display tracking-tight leading-snug">
                Register new {category === 'Client' ? 'Client' : 'Supplier'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-7 sm:p-8 overflow-y-auto space-y-6 text-left text-xs">
          {/* Entity Type & Classification Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200/70">
            <div>
              <label className="block text-gray-700 font-semibold mb-1.5">Entity Type *</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCategory('Client')}
                  className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    category === 'Client'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  <span>Client (Sales)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('Supplier')}
                  className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    category === 'Supplier'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>Supplier (Vendor)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1.5">Geographic Classification *</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setClassification('Domestic')}
                  className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    classification === 'Domestic'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  <span>Domestic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClassification('International')}
                  className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    classification === 'International'
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">public</span>
                  <span>International</span>
                </button>
              </div>
            </div>
          </div>

          {/* Basic Entity Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-[16px]">corporate_fare</span>
              <span>General Entity Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Legal Entity / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder={category === 'Client' ? "e.g. Apex Corporation LLC" : "e.g. CloudTech Systems FZ-LLC"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium bg-white"
                />
              </div>

              <CountrySearchSelect
                value={country}
                onChange={setCountry}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Procurement & Strategic Sourcing"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Company Mail</label>
                <input
                  type="email"
                  placeholder="e.g. corporate@company.com"
                  value={companyMail}
                  onChange={(e) => setCompanyMail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* Designated Key Stakeholders */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-[16px]">contacts</span>
                <span>Designated Key Stakeholders</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {stakeholders.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={handleAddStakeholder}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">person_add</span>
                <span>Add Stakeholder</span>
              </button>
            </div>

            <div className="space-y-3">
              {stakeholders.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3 transition hover:border-gray-300 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-gray-800">
                        {idx === 0 ? 'Lead Stakeholder (Primary POC)' : `Additional Stakeholder #${idx + 1}`}
                      </span>
                      {idx === 0 ? (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Primary
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-200 text-gray-600 px-2.5 py-0.5 rounded-full">
                          Secondary
                        </span>
                      )}
                    </div>

                    {stakeholders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStakeholder(idx)}
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition flex items-center gap-1 text-[10px] font-semibold"
                        title="Remove Stakeholder"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-[11px]">
                        Contact Person Name {idx === 0 && '*'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Marcus Vance"
                        value={s.name}
                        onChange={(e) => handleStakeholderChange(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-[11px]">
                        Business Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. m.vance@company.com"
                        value={s.email}
                        onChange={(e) => handleStakeholderChange(idx, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-[11px]">
                        Direct Phone / Mobile
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 415 555-0192"
                        value={s.phone}
                        onChange={(e) => handleStakeholderChange(idx, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-[11px]">
                        Role / Designation
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Procurement Lead"
                        value={s.role}
                        onChange={(e) => handleStakeholderChange(idx, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddStakeholder}
              className="w-full py-3 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl text-blue-600 hover:text-blue-700 bg-blue-50/30 hover:bg-blue-50/70 transition flex items-center justify-center gap-1.5 font-bold text-xs shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>+ Add Another Key Stakeholder</span>
            </button>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 ${
                category === 'Client' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Register new {category}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntityModal;
