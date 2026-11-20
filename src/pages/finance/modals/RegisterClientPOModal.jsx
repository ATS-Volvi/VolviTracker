import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { loadFinanceData } from '../financeData';
import { convertToUsd, getExchangeRate, DEFAULT_EXCHANGE_RATES } from '../financeCalcs';
import { DataContext } from '../../../context/DataContext';
import { SearchableCombobox } from '../../../components/common/SearchableCombobox';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOneMonthLaterString = (d = new Date()) => {
  const target = new Date(d);
  target.setMonth(target.getMonth() + 1);
  return getLocalDateString(target);
};

const LOCATION_PRESETS = [
  { value: 'Dubai, UAE', label: 'Dubai, UAE', flag: '🇦🇪' },
  { value: 'Abu Dhabi, UAE', label: 'Abu Dhabi, UAE', flag: '🇦🇪' },
  { value: 'Riyadh, Saudi Arabia', label: 'Riyadh, Saudi Arabia', flag: '🇸🇦' },
  { value: 'Jeddah, Saudi Arabia', label: 'Jeddah, Saudi Arabia', flag: '🇸🇦' },
  { value: 'New York, USA', label: 'New York, USA', flag: '🇺🇸' },
  { value: 'San Francisco, USA', label: 'San Francisco, USA', flag: '🇺🇸' },
  { value: 'Chicago, USA', label: 'Chicago, USA', flag: '🇺🇸' },
  { value: 'London, UK', label: 'London, UK', flag: '🇬🇧' },
  { value: 'Mumbai, India', label: 'Mumbai, India', flag: '🇮🇳' },
  { value: 'Bengaluru, India', label: 'Bengaluru, India', flag: '🇮🇳' },
  { value: 'Delhi NCR, India', label: 'Delhi NCR, India', flag: '🇮🇳' },
  { value: 'Hyderabad, India', label: 'Hyderabad, India', flag: '🇮🇳' },
  { value: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
  { value: 'Frankfurt, Germany', label: 'Frankfurt, Germany', flag: '🇩🇪' },
  { value: 'Doha, Qatar', label: 'Doha, Qatar', flag: '🇶🇦' },
  { value: 'Kuwait City, Kuwait', label: 'Kuwait City, Kuwait', flag: '🇰🇼' },
  { value: 'Toronto, Canada', label: 'Toronto, Canada', flag: '🇨🇦' },
];

const RegisterClientPOModal = ({
  isOpen,
  onClose,
  onSave,
  clients = [],
  projects = [],
  exchangeRates = {},
  existingPos = []
}) => {
  const fileInputRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const clientDropdownRef = useRef(null);

  // Fallbacks if data is not passed via props
  const fallbackData = useMemo(() => {
    if (!isOpen) return { clients: [], projects: [], exchangeRates: {} };
    try {
      const stored = loadFinanceData();
      return {
        clients: stored.masterDirectory?.filter(d => d.category === 'Client') || [],
        projects: stored.projects || [],
        exchangeRates: stored.exchangeRates || DEFAULT_EXCHANGE_RATES
      };
    } catch {
      return { clients: [], projects: [], exchangeRates: {} };
    }
  }, [isOpen]);

  // Access live tracker projects from DataContext
  const dataCtx = useContext(DataContext);
  const liveTrackerProjects = dataCtx?.projects || [];

  // All tracker projects (e.g. CRM, ATS, TMS 365, VolviTracker, Client Portal Modernization, etc.)
  const projectsList = useMemo(() => {
    const pool = (Array.isArray(projects) && projects.length > 0)
      ? projects
      : ((Array.isArray(liveTrackerProjects) && liveTrackerProjects.length > 0)
        ? liveTrackerProjects
        : (fallbackData.projects || []));

    const seen = new Set();
    const result = [];
    for (const p of pool) {
      if (!p) continue;
      const key = String(p.id || p.name || p.projectName);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    }
    return result;
  }, [projects, liveTrackerProjects, fallbackData.projects]);

  const clientsList = clients && clients.length > 0 ? clients : fallbackData.clients;
  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackData.exchangeRates;

  // Searchable project dropdown states
  const projectDropdownRef = useRef(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  const filteredProjectsList = useMemo(() => {
    const q = projectSearchQuery.trim().toLowerCase();
    if (!q) return projectsList;
    return projectsList.filter(p => {
      const name = String(p.name || p.projectName || '').toLowerCase();
      const client = String(p.clientName || '').toLowerCase();
      const code = String(p.projectCode || p.id || '').toLowerCase();
      return name.includes(q) || client.includes(q) || code.includes(q);
    });
  }, [projectsList, projectSearchQuery]);

  const handleSelectProject = (proj) => {
    if (!proj || proj === 'No project') {
      setLinkedProject('No project');
      setProjectSearchQuery('');
      setProjectDropdownOpen(false);
      return;
    }
    const projTitle = typeof proj === 'string' ? proj : (proj.name || proj.projectName || proj.id);
    setLinkedProject(projTitle);
    setProjectSearchQuery('');
    setProjectDropdownOpen(false);
    const matched = typeof proj === 'object' ? proj : projectsList.find(p => (p.name || p.projectName || p.id) === projTitle);
    if (matched && matched.clientName && !clientName) {
      setClientName(matched.clientName);
    }
  };

  // Form states matching the exact layout & fields
  const [clientName, setClientName] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(getLocalDateString());
  const [poValue, setPoValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('Open');
  const [location, setLocation] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [importExport, setImportExport] = useState('Export');
  const [expectedCompletion, setExpectedCompletion] = useState(getOneMonthLaterString());
  const [linkedProject, setLinkedProject] = useState('No project');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target)) {
        setClientDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available unique clients for searchable dropdown
  const availableClients = useMemo(() => {
    const map = new Map();
    clientsList.forEach(c => {
      const name = c.name?.trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          id: c.id || name,
          name: name,
          country: c.country || '',
          currency: c.currency || '',
          classification: c.classification || '',
          contactPerson: c.contactPerson || ''
        });
      }
    });
    (existingPos || []).forEach(po => {
      const name = po.clientName?.trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          id: name,
          name: name,
          country: po.location || '',
          currency: po.currency || '',
          classification: po.importExport || '',
          contactPerson: ''
        });
      }
    });
    (projectsList || []).forEach(pr => {
      const name = pr.clientName?.trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          id: `prj-${name}`,
          name: name,
          country: '',
          currency: '',
          classification: pr.name ? `Project: ${pr.name}` : '',
          contactPerson: pr.pocName || ''
        });
      }
    });
    return Array.from(map.values());
  }, [clientsList, existingPos, projectsList]);

  // Filtered clients for searchable dropdown
  const filteredClients = useMemo(() => {
    if (!clientName || !clientName.trim()) return availableClients;
    const q = clientName.toLowerCase().trim();
    return availableClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.country && c.country.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  }, [clientName, availableClients]);

  const handleSelectClient = (selectedClient) => {
    setClientName(selectedClient.name);
    if (selectedClient.country) {
      setLocation(selectedClient.country);
    }
    if (selectedClient.currency) {
      setCurrency(selectedClient.currency);
    }
    if (selectedClient.classification) {
      setImportExport(selectedClient.classification === 'Domestic' ? 'Domestic' : 'Export');
    }
    setClientDropdownOpen(false);
  };

  // Filtered locations for dropdown combobox
  const availableLocations = useMemo(() => {
    const map = new Map();
    LOCATION_PRESETS.forEach(loc => map.set(loc.value.toLowerCase(), loc));
    clientsList.forEach(c => {
      if (c.country && !map.has(c.country.toLowerCase())) {
        map.set(c.country.toLowerCase(), {
          value: c.country,
          label: c.country,
          flag: c.flag || '📍'
        });
      }
    });
    return Array.from(map.values());
  }, [clientsList]);

  const filteredLocations = useMemo(() => {
    if (!location || !location.trim()) return availableLocations;
    const q = location.toLowerCase();
    return availableLocations.filter(loc =>
      loc.label.toLowerCase().includes(q) || loc.value.toLowerCase().includes(q)
    );
  }, [location, availableLocations]);

  // Initialize and reset on modal open: input boxes empty by default
  useEffect(() => {
    if (isOpen) {
      setPoNumber('');
      setClientName('');
      setPoDate(getLocalDateString());
      setPoValue('');
      setCurrency('USD');
      setStatus('Open');
      setLocation('');
      setImportExport('Export');
      setExpectedCompletion(getOneMonthLaterString());
      setLinkedProject('No project');
      setNotes('');
      setMilestones([]);
      setAttachedFiles([]);
      setClientDropdownOpen(false);
      setLocationOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numPoValue = parseFloat(poValue) || 0;

  // Add Milestone handler
  const handleAddMilestone = () => {
    const nextIdx = milestones.length + 1;
    const currentTotal = milestones.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
    const remaining = Math.max(0, numPoValue - currentTotal);
    const suggestedAmt = remaining > 0 ? remaining : (numPoValue > 0 ? Math.round(numPoValue / nextIdx) : 0);
    const suggestedPct = numPoValue > 0 ? Math.min(100, Math.round((suggestedAmt / numPoValue) * 100)) : 0;

    setMilestones(prev => [
      ...prev,
      {
        id: `ms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `Milestone ${nextIdx}: Delivery Phase`,
        type: '%',
        percent: suggestedPct,
        amount: suggestedAmt
      }
    ]);
  };

  const handleUpdateMilestone = (id, field, val) => {
    setMilestones(prev => prev.map(m => {
      if (m.id !== id) return m;

      if (field === 'name') {
        return { ...m, name: val };
      }

      if (field === 'type') {
        return { ...m, type: val };
      }

      if (field === 'percent') {
        const pct = parseFloat(val) || 0;
        const amt = Math.round((numPoValue * (pct / 100)) * 100) / 100;
        return { ...m, percent: val, amount: amt };
      }

      if (field === 'amount') {
        const amt = parseFloat(val) || 0;
        const pct = numPoValue > 0 ? Math.round((amt / numPoValue) * 100) : 0;
        return { ...m, amount: val, percent: pct };
      }

      return m;
    }));
  };

  const handleRemoveMilestone = (id) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // File upload handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Milestone totals
  const totalMilestonesAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  const totalMilestonesPercent = numPoValue > 0 ? Math.round((totalMilestonesAmount / numPoValue) * 100) : 0;
  const isMilestonesBalanced = numPoValue > 0 ? Math.abs(totalMilestonesAmount - numPoValue) <= 1 : true;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedProj = projectsList.find(p => p.id === linkedProject || p.name === linkedProject || p.projectName === linkedProject);
    const projectName = selectedProj ? (selectedProj.projectName || selectedProj.name) : (linkedProject !== 'No project' ? linkedProject : '');

    const rate = getExchangeRate(currency, rates);
    const totalValUsd = convertToUsd(numPoValue, currency, rates);

    const finalizedMilestones = milestones.length > 0
      ? milestones.map((m, idx) => ({
          name: m.name || `Milestone ${idx + 1}`,
          amount: parseFloat(m.amount) || (numPoValue / milestones.length),
          status: 'Unbilled'
        }))
      : [
          {
            name: 'Full Contract Delivery',
            amount: numPoValue,
            status: 'Unbilled'
          }
        ];

    const flag = currency === 'INR' ? '🇮🇳' :
                 currency === 'AED' ? '🇦🇪' :
                 currency === 'SAR' ? '🇸🇦' :
                 currency === 'EUR' ? '🇪🇺' :
                 currency === 'GBP' ? '🇬🇧' : '🇺🇸';

    const country = location.includes(',') ? location.split(',').pop().trim() :
                    currency === 'INR' ? 'India' :
                    currency === 'AED' ? 'UAE' :
                    currency === 'SAR' ? 'KSA' :
                    currency === 'EUR' ? 'Europe' :
                    currency === 'GBP' ? 'UK' : 'USA';

    onSave({
      id: `CPO-${Date.now()}`,
      poNumber: poNumber.trim() || `VOL-CPO-${Date.now()}`,
      issueDate: poDate,
      clientName: clientName.trim() || 'Client Account',
      flag,
      country,
      location: location.trim(),
      importExport,
      expectedCompletion,
      linkedProject: linkedProject !== 'No project' ? linkedProject : '',
      projectName,
      scope: projectName ? `${projectName}` : (notes.trim() || `Client Order ${poNumber.trim()}`),
      totalValueNative: numPoValue,
      currency,
      exchangeRate: rate,
      totalValueUsd: Math.round(totalValUsd * 100) / 100,
      invoicedNative: 0,
      drawdownPercent: 0,
      remainingNative: numPoValue,
      remainingPercent: 100,
      terms: notes.trim() || 'Net 30',
      status: status || 'Open',
      notes: notes.trim(),
      attachedDocuments: attachedFiles.map(f => ({
        id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: f.name,
        size: f.size ? `${Math.round(f.size / 1024)} KB` : '1.2 MB',
        type: f.type || 'application/pdf',
        uploadDate: poDate
      })),
      milestones: finalizedMilestones
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header - Matches standard compact modal styling */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">post_add</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">New Client PO</h3>
              <p className="text-xs text-gray-500">Invoices can be mapped to this order from the invoice form.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs scrollbar-thin">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            {/* Row 1: Client Name & PO Number */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                CLIENT NAME
              </label>
              <SearchableCombobox
                value={clientName}
                onChange={(val, item) => {
                  setClientName(val);
                  if (item) {
                    handleSelectClient(item);
                  }
                }}
                options={availableClients}
                placeholder="Select or enter client name"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                PO NUMBER
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. VOL-CPO-2026001"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-medium"
              />
            </div>

            {/* Row 2: PO Date & PO Value */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                PO DATE
              </label>
              <input
                type="date"
                required
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                PO VALUE
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={poValue}
                onChange={(e) => setPoValue(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            {/* Row 3: Currency & Status */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Partially Invoiced">Partially Invoiced</option>
                <option value="Fully Invoiced">Fully Invoiced</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Row 4: Location & Import / Export */}
            <div className="relative" ref={locationDropdownRef}>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                LOCATION
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setLocationOpen(true);
                  }}
                  onFocus={() => setLocationOpen(true)}
                  placeholder="Select or enter location"
                  className="w-full h-10 pl-3 pr-9 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setLocationOpen(prev => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="Toggle location options"
                >
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 block ${locationOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Dropdown Menu */}
              {locationOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1 scrollbar-thin animate-fadeIn">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => {
                      const isSelected = location.trim().toLowerCase() === loc.value.toLowerCase();
                      return (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => {
                            setLocation(loc.value);
                            setLocationOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm leading-none">{loc.flag}</span>
                            <span>{loc.label}</span>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[14px] text-blue-600">check</span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-2.5 text-center">
                      <p className="text-xs text-gray-400 mb-1.5">No matching preset</p>
                      <button
                        type="button"
                        onClick={() => setLocationOpen(false)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Keep custom "{location}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                IMPORT / EXPORT
              </label>
              <select
                value={importExport}
                onChange={(e) => setImportExport(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="Export">Export</option>
                <option value="Import">Import</option>
                <option value="Domestic">Domestic</option>
              </select>
            </div>

            {/* Row 5: Expected Completion & Project */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                EXPECTED COMPLETION
              </label>
              <input
                type="date"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            <div className="relative" ref={projectDropdownRef}>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                PROJECT
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={projectDropdownOpen ? projectSearchQuery : (linkedProject === 'No project' ? '' : linkedProject)}
                  onChange={(e) => {
                    setProjectSearchQuery(e.target.value);
                    setProjectDropdownOpen(true);
                  }}
                  onFocus={() => setProjectDropdownOpen(true)}
                  placeholder={linkedProject !== 'No project' ? linkedProject : "Search or select project..."}
                  className="w-full h-10 pl-3 pr-8 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setProjectDropdownOpen(prev => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="Toggle project list"
                >
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 block ${projectDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Searchable Dropdown Menu */}
              {projectDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1 scrollbar-thin animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => handleSelectProject('No project')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                      linkedProject === 'No project'
                        ? 'bg-gray-100 text-gray-900 font-bold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-gray-400">block</span>
                      <span>No project</span>
                    </div>
                    {linkedProject === 'No project' && (
                      <span className="material-symbols-outlined text-[14px] text-gray-600">check</span>
                    )}
                  </button>

                  <div className="h-px bg-gray-100 my-1" />

                  {filteredProjectsList.length > 0 ? (
                    filteredProjectsList.map((pr) => {
                      const projTitle = pr.name || pr.projectName || pr.id;
                      const isSelected = linkedProject === projTitle;
                      return (
                        <button
                          key={pr.id || projTitle}
                          type="button"
                          onClick={() => handleSelectProject(pr)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="truncate font-semibold">{projTitle}</span>
                            {(pr.clientName || pr.status) && (
                              <span className="text-[10px] text-gray-400 truncate mt-0.5">
                                {[pr.clientName ? `Client: ${pr.clientName}` : null, pr.status ? `Status: ${pr.status}` : null].filter(Boolean).join(' · ')}
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
                      <p className="text-xs text-gray-500 mb-1">No matching project found</p>
                      {projectSearchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setLinkedProject(projectSearchQuery.trim());
                            setProjectDropdownOpen(false);
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          Use "{projectSearchQuery.trim()}"
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Payment Milestones */}
          <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-3 my-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">
                  Payment Milestones
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Enter a % or an amount. Total must equal the PO value.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="self-start sm:self-auto px-4 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add milestone</span>
              </button>
            </div>

            {/* Milestones List */}
            {milestones.length === 0 ? (
              <div className="text-center py-6 px-6 border border-dashed border-gray-200 rounded-xl bg-white text-gray-400 text-xs leading-relaxed">
                No milestones defined. Click <strong className="text-blue-600 font-semibold">+ Add milestone</strong> to structure milestone billing.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {/* Column Headers for Alignment */}
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">Milestone Description</div>
                  <div className="col-span-2 text-center">Type</div>
                  <div className="col-span-2 text-right">Value</div>
                  <div className="col-span-2 text-right pr-2">Amount ({currency})</div>
                </div>

                {milestones.map((ms, idx) => (
                  <div
                    key={ms.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-2xs"
                  >
                    <div className="sm:col-span-1 text-center font-bold text-gray-400 text-xs">
                      #{idx + 1}
                    </div>

                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={ms.name}
                        onChange={(e) => handleUpdateMilestone(ms.id, 'name', e.target.value)}
                        placeholder="Milestone description"
                        className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Mode selector */}
                    <div className="sm:col-span-2 flex items-center justify-center">
                      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleUpdateMilestone(ms.id, 'type', '%')}
                          className={`px-2.5 py-1 rounded-md transition ${ms.type === '%' ? 'bg-white shadow-2xs text-blue-600 font-extrabold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMilestone(ms.id, 'type', 'amount')}
                          className={`px-2.5 py-1 rounded-md transition ${ms.type === 'amount' ? 'bg-white shadow-2xs text-blue-600 font-extrabold' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                          {currency}
                        </button>
                      </div>
                    </div>

                    {/* Value Input */}
                    <div className="sm:col-span-2">
                      {ms.type === '%' ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={ms.percent}
                            onChange={(e) => handleUpdateMilestone(ms.id, 'percent', e.target.value)}
                            placeholder="0"
                            className="w-full h-9 px-2.5 text-xs border border-gray-200 rounded-lg text-right pr-6 focus:outline-hidden focus:border-blue-500 font-mono"
                          />
                          <span className="absolute right-2 top-2 text-gray-400 text-xs pointer-events-none">%</span>
                        </div>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={ms.amount}
                          onChange={(e) => handleUpdateMilestone(ms.id, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full h-9 px-2.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-hidden focus:border-blue-500 font-mono font-medium"
                        />
                      )}
                    </div>

                    {/* Computed Summary & Delete */}
                    <div className="sm:col-span-2 flex items-center justify-between pl-1">
                      <span className="text-right text-xs font-mono font-bold text-gray-800 truncate">
                        {(parseFloat(ms.amount) || 0).toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(ms.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2 shrink-0 cursor-pointer"
                        title="Remove milestone"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Milestone validation summary */}
                <div className={`flex items-center justify-between text-xs px-4 py-2.5 rounded-xl border ${
                  isMilestonesBalanced
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/80 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2 font-medium">
                    <span className="material-symbols-outlined text-[18px]">
                      {isMilestonesBalanced ? 'check_circle' : 'warning'}
                    </span>
                    <span>
                      Allocated: <strong>{currency} {totalMilestonesAmount.toLocaleString()}</strong> ({totalMilestonesPercent}%)
                    </span>
                  </div>
                  <div>
                    {isMilestonesBalanced ? (
                      <span className="font-bold text-emerald-700">Balanced with PO Value</span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Diff: {currency} {Math.abs(numPoValue - totalMilestonesAmount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terms, deliverables, payment milestones notes..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs resize-y min-h-[76px]"
            />
          </div>

          {/* Section: Attach PO document */}
          <div className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2.5 my-1">
            <div>
              <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">
                Attach PO Document
              </h4>
              <p className="text-xs text-gray-500 mt-0.5 leading-normal">
                Optional · PDF or image up to 10 MB each. Files upload when you save.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,image/*,.xlsx,.docx"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-gray-500">upload_file</span>
                <span>Choose Files</span>
              </button>
              <span className="text-xs text-gray-500">
                {attachedFiles.length === 0 ? 'no files selected' : `${attachedFiles.length} file(s) selected`}
              </span>
            </div>

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 font-medium shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] text-blue-600">attach_file</span>
                    <span className="max-w-[200px] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      className="text-gray-400 hover:text-rose-600 transition ml-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            <span>Save Purchase Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterClientPOModal;
