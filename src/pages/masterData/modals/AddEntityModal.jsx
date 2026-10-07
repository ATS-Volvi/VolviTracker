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
        className={`w-full px-3.5 py-2.5 border rounded-xl flex items-center justify-between text-left transition font-medium bg-white text-xs ${isOpen
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
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-center justify-between ${isSelected
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

  // KYC & Regulatory Credentials State (Global & Multi-Jurisdiction)
  const [taxScheme, setTaxScheme] = useState('AUTO'); // 'AUTO' | 'VAT' | 'EIN' | 'GST' | 'CR' | 'LEI' | 'CUSTOM'
  const [taxIdInput, setTaxIdInput] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [globalEntityId, setGlobalEntityId] = useState(''); // LEI (ISO 17442) or D-U-N-S
  const [taxAuthority, setTaxAuthority] = useState(''); // e.g. IRS, HMRC, FTA, IRAS, CRA, etc.
  const [amlScreened, setAmlScreened] = useState(true);
  const [uboVerified, setUboVerified] = useState(true);
  const [taxResidencyActive, setTaxResidencyActive] = useState(true);
  const [kycStatus, setKycStatus] = useState('Verified'); // 'Verified' | 'Pending Verification' | 'Under Review'
  const [kycExpiry, setKycExpiry] = useState('');
  const [isPermanentKyc, setIsPermanentKyc] = useState(true);
  const [uploadedKycDocs, setUploadedKycDocs] = useState([]);
  const [isManualDocEntryOpen, setIsManualDocEntryOpen] = useState(false);
  const [manualDocTitle, setManualDocTitle] = useState('');
  const [manualDocCategory, setManualDocCategory] = useState('KYC / Regulatory Filing');
  const [manualDocRef, setManualDocRef] = useState('');
  const [manualDocExpiry, setManualDocExpiry] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Ensure category and form state stay synced when modal opens
  useEffect(() => {
    if (isOpen) {
      setCategory(defaultCategory || 'Client');
      setName('');
      setTaxScheme('AUTO');
      setTaxIdInput('');
      setRegistrationNumber('');
      setGlobalEntityId('');
      setTaxAuthority('');
      setAmlScreened(true);
      setUboVerified(true);
      setTaxResidencyActive(true);
      setKycStatus('Verified');
      setKycExpiry('');
      setIsPermanentKyc(true);
      setUploadedKycDocs([]);
      setIsManualDocEntryOpen(false);
      setManualDocTitle('');
      setManualDocCategory('KYC / Regulatory Filing');
      setManualDocRef('');
      setManualDocExpiry('');
      setStakeholders([
        {
          name: '',
          email: '',
          phone: '',
          dept: '',
          department: '',
          role: 'Primary Contact'
        }
      ]);
    }
  }, [isOpen, defaultCategory]);
  const [classification, setClassification] = useState('Domestic'); // 'Domestic' | 'International'
  const [name, setName] = useState('');
  const [country, setCountry] = useState('India 🇮🇳');
  const [stakeholders, setStakeholders] = useState([
    {
      name: '',
      email: '',
      phone: '',
      dept: '',
      department: '',
      role: 'Primary Contact'
    }
  ]);

  // Comprehensive Dynamic Global Tax and Regulatory Identifier Resolution
  const taxInfo = useMemo(() => {
    // If the user selected a dedicated standard scheme:
    if (taxScheme === 'VAT') {
      return {
        standardName: 'VAT / VIES / TRN (Global & European Regime)',
        label: 'VAT Registration / VIES / TRN No.',
        placeholder: 'e.g. GB 982 1204 11 or DE 302910291 or FR 82 123456789',
        badge: 'VAT / VIES',
        regLabel: 'Commercial / Trade Registry (CR / Kbis / HRB)',
        regPlaceholder: 'e.g. HRB 102941 or RCS Paris 892 102 921',
        defaultAuthority: 'National Value Added Tax Administration / VIES'
      };
    }
    if (taxScheme === 'EIN') {
      return {
        standardName: 'US Federal Tax (IRS EIN / W-9 / W-8BEN-E)',
        label: 'Federal Tax ID (EIN / SSN / W-9 / W-8BEN-E)',
        placeholder: 'e.g. 12-3456789 (9-digit Federal EIN)',
        badge: 'US IRS EIN',
        regLabel: 'State Entity / File Number',
        regPlaceholder: 'e.g. DE-7849102-C (Delaware Division of Corps)',
        defaultAuthority: 'Internal Revenue Service (IRS)'
      };
    }
    if (taxScheme === 'GST') {
      return {
        standardName: 'GST / HST / ABN Corporate Tax Standard',
        label: 'GSTIN / HST / ABN / Tax ID',
        placeholder: 'e.g. 27AAPCU9603R1ZM (GSTIN) or 53 004 085 616 (ABN)',
        badge: 'GST / HST / ABN',
        regLabel: 'Corporate Registration / CIN / ACN',
        regPlaceholder: 'e.g. U72200MH2021PTC123456 or ACN 004 085 616',
        defaultAuthority: 'National Tax Administration (CRA / ATO / GSTN / IRAS)'
      };
    }
    if (taxScheme === 'CR') {
      return {
        standardName: 'Commercial Registry / Chamber of Commerce',
        label: 'Commercial Registration (CR / Trade License)',
        placeholder: 'e.g. CR-1010829102 or CN-1029482 or Kbis 892 102',
        badge: 'Commercial Reg.',
        regLabel: 'Sovereign Tax / Fiscal Identification No.',
        regPlaceholder: 'e.g. TAX-FISCAL-ID-90218',
        defaultAuthority: 'Ministry of Commerce / Chamber of Commerce'
      };
    }
    if (taxScheme === 'LEI') {
      return {
        standardName: 'Global LEI (ISO 17442) & D-U-N-S® Standard',
        label: 'Legal Entity Identifier (LEI - ISO 17442)',
        placeholder: 'e.g. 5493006MHB84DD0ZWV18 (20-character LEI)',
        badge: 'GLEIF LEI',
        regLabel: 'D-U-N-S® 9-Digit Global Number',
        regPlaceholder: 'e.g. 01-234-5678 (Dun & Bradstreet)',
        defaultAuthority: 'Global Legal Entity Identifier Foundation (GLEIF)'
      };
    }
    if (taxScheme === 'CUSTOM') {
      return {
        standardName: 'Custom Sovereign / National Business Identifier',
        label: 'Sovereign Tax Identifier / National Business ID',
        placeholder: 'e.g. SOVEREIGN-TAX-982103',
        badge: 'National Sovereign',
        regLabel: 'Government Registration / License No.',
        regPlaceholder: 'e.g. REG-SOVEREIGN-9921',
        defaultAuthority: 'National Ministry of Finance / Tax Authority'
      };
    }

    // Default: 'AUTO' - automatically detect based on selected Country
    const c = (country || '').toLowerCase();
    if (c.includes('united states') || c.includes('usa')) {
      return {
        standardName: 'United States (IRS / Federal EIN)',
        label: 'Federal Tax ID (EIN / SSN / W-9 / W-8BEN-E)',
        placeholder: 'e.g. 12-3456789 (9-digit Federal EIN)',
        badge: 'US IRS EIN',
        regLabel: 'State Entity / File Number',
        regPlaceholder: 'e.g. DE-7849102-C (Delaware Corps)',
        defaultAuthority: 'Internal Revenue Service (IRS)'
      };
    }
    if (c.includes('uae') || c.includes('united arab emirates')) {
      return {
        standardName: 'United Arab Emirates (FTA TRN / DED)',
        label: 'Tax Registration Number (TRN)',
        placeholder: 'e.g. 10028941200003 (15-digit TRN)',
        badge: 'UAE FTA TRN',
        regLabel: 'Commercial License / DED / CR No.',
        regPlaceholder: 'e.g. CN-1029482 or CR-98124',
        defaultAuthority: 'Federal Tax Authority (FTA UAE)'
      };
    }
    if (c.includes('saudi') || c.includes('ksa')) {
      return {
        standardName: 'Saudi Arabia (ZATCA VAT / CR)',
        label: 'ZATCA VAT Registration No.',
        placeholder: 'e.g. 310123456700003 (15-digit VAT)',
        badge: 'ZATCA VAT',
        regLabel: 'Commercial Registration (CR No.)',
        regPlaceholder: 'e.g. CR-1010829102',
        defaultAuthority: 'Zakat, Tax and Customs Authority (ZATCA)'
      };
    }
    if (c.includes('kingdom') || c.includes('uk') || c.includes('britain')) {
      return {
        standardName: 'United Kingdom (HMRC VAT / Companies House)',
        label: 'HMRC VAT / Corporate Tax No. (UTR)',
        placeholder: 'e.g. GB 123 4567 89 or 10-digit UTR',
        badge: 'UK VAT / UTR',
        regLabel: 'Companies House Reg No.',
        regPlaceholder: 'e.g. 09812401',
        defaultAuthority: 'HM Revenue & Customs (HMRC)'
      };
    }
    if (c.includes('singapore')) {
      return {
        standardName: 'Singapore (IRAS GST / ACRA UEN)',
        label: 'GST Registration No. / Tax UEN',
        placeholder: 'e.g. 201812345M or M90382910X',
        badge: 'Singapore UEN',
        regLabel: 'ACRA Registration Number',
        regPlaceholder: 'e.g. 201812345M',
        defaultAuthority: 'Inland Revenue Authority of Singapore (IRAS)'
      };
    }
    if (c.includes('germany') || c.includes('deutschland')) {
      return {
        standardName: 'Germany (USt-IdNr. / Handelsregister)',
        label: 'Umsatzsteuer-ID (USt-IdNr.) / Steuernummer',
        placeholder: 'e.g. DE 123456789',
        badge: 'EU VAT / DE',
        regLabel: 'Handelsregister / HRB Nummer',
        regPlaceholder: 'e.g. HRB 123456 (Amtsgericht)',
        defaultAuthority: 'Bundeszentralamt für Steuern (BZSt)'
      };
    }
    if (c.includes('france')) {
      return {
        standardName: 'France (Numéro TVA / SIREN / RCS)',
        label: 'Numéro de TVA Intracommunautaire',
        placeholder: 'e.g. FR 32 123456789',
        badge: 'TVA / SIREN',
        regLabel: 'Numéro SIREN / RCS',
        regPlaceholder: 'e.g. 123 456 789 RCS Paris',
        defaultAuthority: 'Direction Générale des Finances Publiques (DGFiP)'
      };
    }
    if (c.includes('canada')) {
      return {
        standardName: 'Canada (CRA Business Number / GST/HST)',
        label: 'Business Number (BN) / GST/HST Registration',
        placeholder: 'e.g. 123456789 RT 0001',
        badge: 'Canada CRA',
        regLabel: 'Corporation Number / Registry ID',
        regPlaceholder: 'e.g. 1234567-8',
        defaultAuthority: 'Canada Revenue Agency (CRA)'
      };
    }
    if (c.includes('australia')) {
      return {
        standardName: 'Australia (ABN / ATO / ASIC)',
        label: 'Australian Business Number (ABN / GST)',
        placeholder: 'e.g. 51 824 753 556',
        badge: 'Australian ABN',
        regLabel: 'Australian Company Number (ACN / ASIC)',
        regPlaceholder: 'e.g. 004 085 616',
        defaultAuthority: 'Australian Taxation Office (ATO)'
      };
    }
    if (c.includes('netherlands') || c.includes('holland')) {
      return {
        standardName: 'Netherlands (BTW-ID / KVK)',
        label: 'Btw-identificatienummer (BTW-ID)',
        placeholder: 'e.g. NL 823456789B01',
        badge: 'NL BTW / VIES',
        regLabel: 'KVK-nummer (Kamer van Koophandel)',
        regPlaceholder: 'e.g. 81293847',
        defaultAuthority: 'Belastingdienst'
      };
    }
    if (c.includes('switzerland') || c.includes('swiss')) {
      return {
        standardName: 'Switzerland (UID / MWST / Commercial Reg.)',
        label: 'UID / TVA / MWST Number',
        placeholder: 'e.g. CHE-123.456.789 TVA',
        badge: 'Swiss UID',
        regLabel: 'Federal Commercial Registry (RC)',
        regPlaceholder: 'e.g. CH-020.3.000.123-4',
        defaultAuthority: 'Eidgenössische Steuerverwaltung (ESTV)'
      };
    }
    if (c.includes('japan')) {
      return {
        standardName: 'Japan (National Corporate Number / NTA)',
        label: 'Corporate Number (Houjin Bangou - 13 Digits)',
        placeholder: 'e.g. 1234567890123',
        badge: 'Japan NTA',
        regLabel: 'Invoice Registration No. (T+13 Digits)',
        regPlaceholder: 'e.g. T1234567890123',
        defaultAuthority: 'National Tax Agency Japan (NTA)'
      };
    }
    if (c.includes('china')) {
      return {
        standardName: 'China (Unified Social Credit Code / USCC)',
        label: 'Unified Social Credit Code (USCC - 18 Digits)',
        placeholder: 'e.g. 91310000771829103X',
        badge: 'China USCC',
        regLabel: 'AIC Business License Registry No.',
        regPlaceholder: 'e.g. 310000400123456',
        defaultAuthority: 'State Taxation Administration (STA)'
      };
    }
    if (c.includes('qatar')) {
      return {
        standardName: 'Qatar (General Tax Authority / CR)',
        label: 'Tax Identification Number (TIN / GTA)',
        placeholder: 'e.g. 000012345600001',
        badge: 'Qatar TIN',
        regLabel: 'Commercial Registration (CR No.)',
        regPlaceholder: 'e.g. CR-109281',
        defaultAuthority: 'General Tax Authority (GTA Qatar)'
      };
    }
    if (c.includes('brazil')) {
      return {
        standardName: 'Brazil (CNPJ / Receita Federal)',
        label: 'Cadastro Nacional da Pessoa Jurídica (CNPJ)',
        placeholder: 'e.g. 12.345.678/0001-90',
        badge: 'Brazil CNPJ',
        regLabel: 'NIRE / Junta Comercial Reg.',
        regPlaceholder: 'e.g. 35.123.456.789',
        defaultAuthority: 'Receita Federal do Brasil'
      };
    }
    if (c.includes('india')) {
      return {
        standardName: 'India (GSTIN / ROC CIN)',
        label: 'GSTIN / Corporate Tax ID',
        placeholder: 'e.g. 27AAPCU9603R1ZM (15-digit GSTIN)',
        badge: 'GSTIN / PAN',
        regLabel: 'CIN / ROC Registration No.',
        regPlaceholder: 'e.g. U72200MH2021PTC123456',
        defaultAuthority: 'Goods & Services Tax Network (GSTN / CBIC)'
      };
    }
    // Universal Global Fallback for any client worldwide
    return {
      standardName: 'Global Sovereign Standard (Cross-Border)',
      label: 'Sovereign Tax Identifier / VAT / Fiscal ID',
      placeholder: 'e.g. TAX-REG-982103 or Sovereign VAT/EIN',
      badge: 'Global Tax / VAT',
      regLabel: 'Commercial License / Business Reg. No.',
      regPlaceholder: 'e.g. REG-8829103 or Trade License',
      defaultAuthority: 'Ministry of Finance / Sovereign Tax Authority'
    };
  }, [country, taxScheme]);

  const handleProcessFiles = (files) => {
    if (!files || !files.length) return;
    const newDocs = Array.from(files).map((file, idx) => {
      let sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      if (file.size < 1024 * 1024) {
        sizeStr = `${Math.max(1, Math.round(file.size / 1024))} KB`;
      }

      const lowerName = file.name.toLowerCase();
      let cat = 'KYC / Regulatory';
      if (lowerName.includes('gst') || lowerName.includes('vat') || lowerName.includes('tax')) {
        cat = 'Tax / GST Certificate';
      } else if (lowerName.includes('license') || lowerName.includes('cr') || lowerName.includes('trade')) {
        cat = 'Commercial Trade License';
      } else if (lowerName.includes('inc') || lowerName.includes('coi') || lowerName.includes('cin')) {
        cat = 'Certificate of Incorporation';
      } else if (lowerName.includes('pan') || lowerName.includes('w9') || lowerName.includes('w8')) {
        cat = 'Tax ID / PAN / W-9';
      } else if (lowerName.includes('msa') || lowerName.includes('contract')) {
        cat = 'MSA / Contract';
      }

      let fileUrl = null;
      try {
        fileUrl = URL.createObjectURL(file);
      } catch {
        // ignore
      }

      return {
        id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: sizeStr,
        category: cat,
        expiry: isPermanentKyc ? 'Active / Permanent' : (kycExpiry ? `Valid till ${kycExpiry}` : 'Active / Permanent'),
        uploadDate: new Date().toISOString().split('T')[0],
        fileUrl,
        hash: `sha256:${Math.random().toString(36).substring(2, 9)}...`,
        isKyc: true
      };
    });

    setUploadedKycDocs(prev => [...prev, ...newDocs]);
  };

  const handleFileInputChange = (e) => {
    handleProcessFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveKycDoc = (docId) => {
    setUploadedKycDocs(prev => prev.filter(d => d.id !== docId));
  };

  const handleAddManualDoc = (e) => {
    if (e) e.preventDefault();
    const title = manualDocTitle.trim() || `${name.trim() || 'Entity'}_${manualDocCategory.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const docItem = {
      id: `doc-manual-${Date.now()}`,
      name: title.endsWith('.pdf') ? title : `${title}.pdf`,
      size: `${(Math.random() * 1.5 + 0.5).toFixed(1)} MB`,
      category: manualDocCategory,
      refNumber: manualDocRef.trim(),
      expiry: isPermanentKyc ? 'Active / Permanent' : (manualDocExpiry ? `Valid till ${manualDocExpiry}` : 'Active / Permanent'),
      uploadDate: new Date().toISOString().split('T')[0],
      hash: `sha256:${Math.random().toString(36).substring(2, 9)}...`,
      isKyc: true,
      isManualRecord: true
    };
    setUploadedKycDocs(prev => [...prev, docItem]);
    setManualDocTitle('');
    setManualDocRef('');
    setManualDocExpiry('');
    setIsManualDocEntryOpen(false);
  };

  const handleQuickAddTemplate = (categoryName, sampleSuffix) => {
    const entityNameClean = name.trim() ? name.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Company';
    const docItem = {
      id: `doc-quick-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${entityNameClean}_${sampleSuffix}.pdf`,
      size: `${(Math.random() * 1.2 + 0.8).toFixed(1)} MB`,
      category: categoryName,
      expiry: isPermanentKyc ? 'Active / Permanent' : (kycExpiry ? `Valid till ${kycExpiry}` : 'Dec 31, 2027'),
      uploadDate: new Date().toISOString().split('T')[0],
      hash: `sha256:${Math.random().toString(36).substring(2, 9)}...`,
      isKyc: true
    };
    setUploadedKycDocs(prev => [...prev, docItem]);
  };

  const handleAddStakeholder = () => {
    setStakeholders(prev => [
      ...prev,
      {
        name: '',
        email: '',
        phone: '',
        dept: '',
        department: '',
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
      if (field === 'dept' || field === 'department') {
        next[index] = { ...next[index], dept: value, department: value };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
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
      .filter(s => s.name?.trim() || s.email?.trim() || s.phone?.trim() || s.dept?.trim() || s.department?.trim())
      .map((s, idx) => ({
        name: s.name?.trim() || `Stakeholder #${idx + 1}`,
        email: s.email?.trim() || leadContactEmail,
        phone: s.phone?.trim() || leadContactPhone,
        dept: s.dept?.trim() || s.department?.trim() || '',
        department: s.department?.trim() || s.dept?.trim() || '',
        role: s.role?.trim() || (idx === 0 ? 'Primary Contact' : 'Commercial Stakeholder')
      }));

    const leadDept = cleanStakeholders[0]?.dept || cleanStakeholders[0]?.department || '';

    const finalStakeholders = cleanStakeholders.length > 0 ? cleanStakeholders : [
      {
        name: leadContactPerson,
        email: leadContactEmail,
        phone: leadContactPhone,
        dept: '',
        department: '',
        role: 'Primary Contact'
      }
    ];

    // Determine final Tax ID
    const finalTaxId = taxIdInput.trim() || `${countryPrefix}-TAX-${randomCode}`;

    // Compile all attached docs
    const allAttachedDocs = [...uploadedKycDocs];
    if (allAttachedDocs.length === 0) {
      if (taxIdInput.trim() || registrationNumber.trim()) {
        allAttachedDocs.push({
          id: `doc-kyc-filing-${Date.now()}`,
          name: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Official_KYC_Filing.pdf`,
          size: '1.2 MB',
          category: 'KYC / Regulatory',
          expiry: isPermanentKyc ? 'Active / Permanent' : (kycExpiry ? `Valid till ${kycExpiry}` : 'Active / Permanent'),
          uploadDate: new Date().toISOString().split('T')[0],
          hash: `sha256:${Math.random().toString(36).substring(2, 9)}...`,
          isKyc: true
        });
      }
      allAttachedDocs.push({
        id: `doc-msa-${Date.now()}`,
        name: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Agreement.pdf`,
        size: '1.4 MB',
        category: 'MSA',
        expiry: '2026-12-31'
      });
    } else {
      if (!allAttachedDocs.some(d => (d.category || '').includes('MSA'))) {
        allAttachedDocs.push({
          id: `doc-msa-${Date.now()}`,
          name: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Agreement.pdf`,
          size: '1.4 MB',
          category: 'MSA',
          expiry: '2026-12-31'
        });
      }
    }

    const newEntity = {
      id: entityId,
      name: name.trim(),
      category,
      classification,
      country,
      avatarText,
      department: leadDept || (category === 'Client' ? 'Procurement & Strategic Sourcing' : 'Platform & Technical Operations'),
      companyMail: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      taxId: finalTaxId,
      registrationNumber: registrationNumber.trim(),
      globalEntityId: globalEntityId.trim(),
      taxAuthority: taxAuthority.trim() || taxInfo.defaultAuthority,
      taxScheme,
      amlScreened,
      uboVerified,
      taxDescription: kycStatus === 'Verified' ? 'Verified Regulatory Filing' : `${kycStatus} Filing`,
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
      compliance: kycStatus,
      kycStatus: kycStatus,
      kycDetails: {
        taxId: finalTaxId,
        registrationNumber: registrationNumber.trim(),
        globalEntityId: globalEntityId.trim(),
        taxAuthority: taxAuthority.trim() || taxInfo.defaultAuthority,
        taxScheme,
        amlScreened,
        uboVerified,
        status: kycStatus,
        expiry: isPermanentKyc ? 'Active / Permanent' : (kycExpiry || 'Active'),
        docsCount: allAttachedDocs.length
      },
      docsCount: allAttachedDocs.length,
      lifetimeBilled: '$0.00',
      unbilledCap: creditLimit.trim() || '$100,000',
      avgDso: '30 Days',
      bankDetails: {
        bankName: bankName.trim() || 'Global Commercial Banking',
        accountNumber: accountNumber.trim() || '0091829011',
        swiftIban: swiftIban.trim() || 'COMMUS33XXX',
        routing: routing.trim() || '0100010'
      },
      attachedDocs: allAttachedDocs
    };

    onSave(newEntity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-100 animate-slide-up my-auto overflow-hidden isolate">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="px-7 py-5.5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/90 shrink-0 rounded-t-3xl">
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
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="p-7 sm:p-8 overflow-y-auto flex-1 space-y-6 text-left text-xs modal-scrollbar">
            {/* Entity Type & Classification Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-gray-50/70 rounded-2xl border border-gray-200/70">
              <div>
                <label className="block text-gray-700 font-semibold mb-1.5">Entity Type *</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCategory('Client')}
                    className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${category === 'Client'
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
                    className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${category === 'Supplier'
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
                    className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${classification === 'Domestic'
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
                    className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${classification === 'International'
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
            </div>

            {/* KYC & Regulatory Credentials & Document Upload Section */}
            <div className="space-y-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">verified_user</span>
                  <div>
                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                      KYC & Regulatory Compliance
                    </h3>
                    <p className="text-[10px] text-gray-400">Fill in regulatory registration details or upload KYC verification documents</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {uploadedKycDocs.length} {uploadedKycDocs.length === 1 ? 'Doc Attached' : 'Docs Attached'}
                  </span>
                </div>
              </div>

              {/* KYC Input Fields (Spot to fill it out) */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3.5">
                {/* Global Tax Regime / Identifier Standard Selector */}
                <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-200/60">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-blue-600">public</span>
                      <span>Regulatory Standard & Jurisdiction Format</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">
                      {taxInfo.standardName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs">
                    {[
                      { id: 'AUTO', label: 'Auto (Country Detect)', icon: 'auto_awesome' },
                      { id: 'VAT', label: 'VAT / VIES / TRN', icon: 'receipt_long' },
                      { id: 'EIN', label: 'US EIN / W-9 / W-8', icon: 'gavel' },
                      { id: 'GST', label: 'GST / HST / ABN', icon: 'payments' },
                      { id: 'CR', label: 'Commercial Reg. / Kbis', icon: 'store' },
                      { id: 'LEI', label: 'Global LEI / D-U-N-S®', icon: 'corporate_fare' },
                      { id: 'CUSTOM', label: 'Custom Sovereign ID', icon: 'pin' },
                    ].map(scheme => (
                      <button
                        key={scheme.id}
                        type="button"
                        onClick={() => setTaxScheme(scheme.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${taxScheme === scheme.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">{scheme.icon}</span>
                        <span>{scheme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 1: Primary Tax Identifier & Commercial Registration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-700 font-medium text-[11px] flex items-center gap-1">
                        <span>{taxInfo.label}</span>
                      </label>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100/70 text-blue-700 px-1.5 py-0.2 rounded font-mono">
                        {taxInfo.badge}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder={taxInfo.placeholder}
                      value={taxIdInput}
                      onChange={(e) => setTaxIdInput(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-700 font-medium text-[11px]">
                        {taxInfo.regLabel}
                      </label>
                      <span className="text-[9px] text-gray-400">Registry / License</span>
                    </div>
                    <input
                      type="text"
                      placeholder={taxInfo.regPlaceholder}
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Row 2: Global Corporate Identifiers & Sovereign Tax Authority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-700 font-medium text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-indigo-600">corporate_fare</span>
                        <span>Global Entity ID (LEI / D-U-N-S®)</span>
                      </label>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200/50">
                        ISO 17442 / D&B
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 5493006MHB84DD0ZWV18 or 12-345-6789"
                      value={globalEntityId}
                      onChange={(e) => setGlobalEntityId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-700 font-medium text-[11px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-blue-600">account_balance</span>
                        <span>Issuing Sovereign Tax Authority</span>
                      </label>
                      <span className="text-[9px] text-gray-400">Jurisdiction Body</span>
                    </div>
                    <input
                      type="text"
                      placeholder={taxInfo.defaultAuthority}
                      value={taxAuthority}
                      onChange={(e) => setTaxAuthority(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Row 3: Status and Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5 text-[11px]">
                      KYC Verification Standing
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setKycStatus('Verified')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition flex items-center justify-center gap-1 ${kycStatus === 'Verified'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>Verified</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKycStatus('Pending Verification')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition flex items-center justify-center gap-1 ${kycStatus === 'Pending Verification'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
                        <span>Pending</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKycStatus('Under Review')}
                        className={`py-1.5 px-2 rounded-lg font-bold text-[10px] transition flex items-center justify-center gap-1 ${kycStatus === 'Under Review'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">sync</span>
                        <span>Review</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-gray-700 font-medium text-[11px]">
                        Document Expiry / Validity
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isPermanentKyc}
                          onChange={(e) => setIsPermanentKyc(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span>No Expiry / Permanent</span>
                      </label>
                    </div>
                    {isPermanentKyc ? (
                      <div className="w-full px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-[15px]">all_inclusive</span>
                        <span>Permanent Valid Regulatory Credential</span>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={kycExpiry}
                        onChange={(e) => setKycExpiry(e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-xs"
                      />
                    )}
                  </div>
                </div>

                {/* Row 4: International Compliance & Sanctions Screening */}
                <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-emerald-600 text-[13px]">policy</span>
                      <span>International Compliance & Screening</span>
                    </span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded font-bold border border-emerald-200/60">
                      Global Standards (OFAC / UN / EU)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    <label className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/70 border border-gray-200/60 cursor-pointer transition select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={amlScreened}
                        onChange={(e) => setAmlScreened(e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-gray-800 truncate">AML & Sanctions Cleared</span>
                        <span className="text-[9px] text-gray-400 truncate">OFAC / EU / UN check</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/70 border border-gray-200/60 cursor-pointer transition select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={uboVerified}
                        onChange={(e) => setUboVerified(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-gray-800 truncate">UBO Documented</span>
                        <span className="text-[9px] text-gray-400 truncate">Beneficial ownership</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50/80 hover:bg-gray-100/70 border border-gray-200/60 cursor-pointer transition select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={taxResidencyActive}
                        onChange={(e) => setTaxResidencyActive(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-gray-800 truncate">Tax Treaty / TRC Form</span>
                        <span className="text-[9px] text-gray-400 truncate">W-8 / W-9 / Residency</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* KYC Document Upload Option */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-blue-600 text-[15px]">upload_file</span>
                    <span>Upload KYC Documents</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsManualDocEntryOpen(!isManualDocEntryOpen)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isManualDocEntryOpen ? 'remove' : 'add'}
                    </span>
                    <span>{isManualDocEntryOpen ? 'Close Manual Entry' : 'Manual Document Entry'}</span>
                  </button>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Drag & Drop Upload Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-4 rounded-2xl border-2 border-dashed transition text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 group ${isDragOver
                      ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                      : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50/20 shadow-2xs'
                    }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition shadow-2xs">
                    <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                      Click to browse files or drag & drop here
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Supports PDF, Images (PNG, JPG), Word documents up to 25MB
                    </p>
                  </div>
                </div>

                {/* Universal Quick Template Presets for International Documents */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 mr-1">Global Templates:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Tax Residency / W-8 / W-9', 'Tax_Residency_TRC_W8_Certificate')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-blue-600">add</span>
                    <span>TRC / W-8BEN-E / W-9</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Certificate of Incorporation', 'Certificate_of_Incorporation_Kbis')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-purple-600">add</span>
                    <span>COI / Kbis / ACRA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Commercial Trade License', 'Commercial_Register_Trade_License')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">add</span>
                    <span>Trade License / CR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('Global LEI / D-U-N-S Report', 'Global_LEI_DUNS_Verification')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-indigo-600">add</span>
                    <span>Global LEI / D-U-N-S</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('AML & Sanctions Screening', 'AML_Sanctions_UBO_Screening_Report')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-amber-50 hover:text-amber-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-amber-600">add</span>
                    <span>AML / UBO Dossier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddTemplate('VAT / GST Registration', 'VAT_GST_Registration_Certificate')}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 font-semibold text-[10px] transition border border-gray-200/80 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px] text-teal-600">add</span>
                    <span>VAT / GST Certificate</span>
                  </button>
                </div>

                {/* Manual Document Fill-out Drawer */}
                {isManualDocEntryOpen && (
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2.5 animate-slide-up">
                    <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-blue-600">edit_document</span>
                        <span>Fill Out Document Details Manually</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsManualDocEntryOpen(false)}
                        className="text-gray-400 hover:text-gray-600 text-[14px]"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">Document Title / Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Tax_Residency_Certificate.pdf"
                          value={manualDocTitle}
                          onChange={(e) => setManualDocTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">Category</label>
                        <select
                          value={manualDocCategory}
                          onChange={(e) => setManualDocCategory(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-xs font-medium"
                        >
                          <option value="KYC / Regulatory Filing">KYC / Regulatory Filing</option>
                          <option value="Tax Residency Certificate (TRC / W-8 / W-9)">Tax Residency Certificate (TRC / W-8 / W-9)</option>
                          <option value="VAT / GST Registration Certificate">VAT / GST Registration Certificate</option>
                          <option value="Certificate of Incorporation / Kbis / ACRA">Certificate of Incorporation / Kbis / ACRA</option>
                          <option value="Commercial Registry / Trade License">Commercial Registry / Trade License (CR)</option>
                          <option value="Global LEI / D-U-N-S Extract">Global LEI / D-U-N-S Extract</option>
                          <option value="AML & Sanctions Screening Dossier">AML & Sanctions Screening Dossier</option>
                          <option value="Ultimate Beneficial Owner (UBO) Declaration">Ultimate Beneficial Owner (UBO) Declaration</option>
                          <option value="Bank Mandate / Letter">Bank Confirmation Letter</option>
                          <option value="Power of Attorney / Board Resolution">Power of Attorney / Board Resolution</option>
                          <option value="MSA / Contract">MSA / Master Agreement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">Ref / Document Number</label>
                        <input
                          type="text"
                          placeholder="e.g. REF-2025-9910"
                          value={manualDocRef}
                          onChange={(e) => setManualDocRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsManualDocEntryOpen(false)}
                        className="px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-100 text-[11px] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualDoc}
                        className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_circle</span>
                        <span>+ Attach Document Record</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Uploaded / Attached Documents Preview List */}
                {uploadedKycDocs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Attached Verification Documents ({uploadedKycDocs.length})
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {uploadedKycDocs.map((doc) => {
                        const isPdf = doc.name.toLowerCase().endsWith('.pdf');
                        const isImg = doc.name.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/);
                        return (
                          <div
                            key={doc.id}
                            className="p-2.5 bg-white rounded-xl border border-gray-200/90 shadow-2xs flex items-center justify-between gap-2 transition hover:border-blue-200"
                          >
                            <div className="flex items-center gap-2.5 truncate min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? 'bg-red-50 text-red-600' : isImg ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <span className="material-symbols-outlined text-[16px]">
                                  {isPdf ? 'picture_as_pdf' : isImg ? 'image' : 'description'}
                                </span>
                              </div>
                              <div className="truncate min-w-0 text-left">
                                <div className="font-bold text-gray-900 text-xs truncate" title={doc.name}>
                                  {doc.name}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                  <span className="font-semibold text-blue-600">{doc.category}</span>
                                  <span>•</span>
                                  <span>{doc.size}</span>
                                  <span>•</span>
                                  <span className="text-emerald-700 font-medium">{doc.expiry}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
                                  title="Preview Document"
                                >
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveKycDoc(doc.id)}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                title="Remove document"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            Department
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Procurement & Sourcing"
                            value={s.dept || s.department || ''}
                            onChange={(e) => handleStakeholderChange(idx, 'dept', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                          />
                        </div>
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

          </div>

          {/* Pinned Form Actions Footer */}
          <div className="px-7 py-4 sm:px-8 sm:py-4.5 border-t border-gray-100 flex items-center justify-end gap-2.5 bg-gray-50/90 shrink-0 rounded-b-3xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 ${category === 'Client' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
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
