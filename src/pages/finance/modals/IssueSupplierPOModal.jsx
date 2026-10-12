import React, { useState, useEffect, useRef, useMemo } from 'react';
import { loadFinanceData } from '../financeData';

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

const IssueSupplierPOModal = ({
  isOpen,
  onClose,
  onSave,
  projects = [],
  vendors = [],
  clientPos = [],
  exchangeRates = {},
  existingPos = []
}) => {
  const fileInputRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Fallbacks if data is not passed via props
  const fallbackData = useMemo(() => {
    if (!isOpen) return { vendors: [], projects: [], clientPos: [], exchangeRates: {} };
    try {
      const stored = loadFinanceData();
      return {
        vendors: stored.masterDirectory?.filter(d => d.category === 'Supplier') || [],
        projects: stored.projects || [],
        clientPos: stored.clientPos || [],
        exchangeRates: stored.exchangeRates || { USD: 1, AED: 3.67, SAR: 3.75, INR: 83.2 }
      };
    } catch {
      return { vendors: [], projects: [], clientPos: [], exchangeRates: {} };
    }
  }, [isOpen]);

  const vendorsList = vendors && vendors.length > 0 ? vendors : fallbackData.vendors;
  const projectsList = projects && projects.length > 0 ? projects : fallbackData.projects;
  const clientPosList = clientPos && clientPos.length > 0 ? clientPos : fallbackData.clientPos;
  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackData.exchangeRates;

  // Form states matching the exact layout & fields
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(getLocalDateString());
  const [poValue, setPoValue] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('Open');
  const [location, setLocation] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [importExport, setImportExport] = useState('Export');
  const [expectedCompletion, setExpectedCompletion] = useState(getOneMonthLaterString());
  const [linkedProject, setLinkedProject] = useState('No project');
  const [forClientPo, setForClientPo] = useState('No linked client PO');
  const [notes, setNotes] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered locations for dropdown combobox
  const availableLocations = useMemo(() => {
    const map = new Map();
    LOCATION_PRESETS.forEach(loc => map.set(loc.value.toLowerCase(), loc));
    vendorsList.forEach(v => {
      if (v.country && !map.has(v.country.toLowerCase())) {
        map.set(v.country.toLowerCase(), {
          value: v.country,
          label: v.country,
          flag: v.flag || '📍'
        });
      }
    });
    return Array.from(map.values());
  }, [vendorsList]);

  const filteredLocations = useMemo(() => {
    if (!location || !location.trim()) return availableLocations;
    const q = location.toLowerCase();
    return availableLocations.filter(loc =>
      loc.label.toLowerCase().includes(q) || loc.value.toLowerCase().includes(q)
    );
  }, [location, availableLocations]);

  // Initialize and reset on modal open
  useEffect(() => {
    if (isOpen) {
      const currentYear = new Date().getFullYear();
      const seq = existingPos && existingPos.length > 0
        ? String(existingPos.length + 1).padStart(3, '0')
        : '002';
      setPoNumber(`VOL-PO-${currentYear}${seq}`);
      setSupplierName(vendorsList[0]?.name || '');
      setPoDate(getLocalDateString());
      setPoValue(0);
      setCurrency('USD');
      setStatus('Open');
      setLocation(vendorsList[0]?.country || 'Dubai, UAE');
      setImportExport('Export');
      setExpectedCompletion(getOneMonthLaterString());
      setLinkedProject(projectsList[0]?.id || 'No project');
      setForClientPo(clientPosList[0]?.poNumber ? `${clientPosList[0].poNumber} — ${clientPosList[0].clientName}` : 'No linked client PO');
      setNotes('');
      setAttachedFiles([]);

      // Default sample milestones matching the screenshot (PO Issuance + Milestone 2..5)
      setMilestones([
        { id: 'ms-1', name: 'PO Issuance', percent: 20, amount: 0, date: getLocalDateString() },
        { id: 'ms-2', name: 'Milestone 2', percent: 20, amount: 0, date: getOneMonthLaterString() },
        { id: 'ms-3', name: 'Milestone 3', percent: 20, amount: 0, date: getOneMonthLaterString(new Date(Date.now() + 60 * 86400000)) },
        { id: 'ms-4', name: 'Milestone 4', percent: 20, amount: 0, date: getOneMonthLaterString(new Date(Date.now() + 120 * 86400000)) },
        { id: 'ms-5', name: 'Milestone 5', percent: 20, amount: 0, date: getOneMonthLaterString(new Date(Date.now() + 180 * 86400000)) },
      ]);
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
    const suggestedPct = numPoValue > 0 ? Math.min(100, Math.round((suggestedAmt / numPoValue) * 100)) : 20;

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + nextIdx);

    setMilestones(prev => [
      ...prev,
      {
        id: `ms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: `Milestone ${nextIdx}`,
        percent: suggestedPct,
        amount: suggestedAmt,
        date: getLocalDateString(targetDate)
      }
    ]);
  };

  // Copy milestones from selected Client PO
  const handleCopyFromClientPo = () => {
    let sourcePo = null;
    if (forClientPo && forClientPo !== 'No linked client PO') {
      const poNum = forClientPo.split('—')[0].trim();
      sourcePo = clientPosList.find(p => p.poNumber === poNum || forClientPo.includes(p.poNumber));
    }
    if (!sourcePo && clientPosList.length > 0) {
      sourcePo = clientPosList[0];
    }

    if (sourcePo && sourcePo.milestones && sourcePo.milestones.length > 0) {
      const sourceCount = sourcePo.milestones.length;
      const splitPct = Math.round((100 / sourceCount) * 10) / 10;
      const splitAmt = numPoValue > 0 ? Math.round((numPoValue / sourceCount) * 100) / 100 : 0;

      const newMilestones = sourcePo.milestones.map((m, idx) => {
        const d = new Date();
        d.setMonth(d.getMonth() + idx + 1);
        return {
          id: `ms-copied-${Date.now()}-${idx}`,
          name: m.name || `Milestone ${idx + 1}`,
          percent: m.percent || splitPct,
          amount: numPoValue > 0 ? Math.round((numPoValue * ((m.percent || splitPct) / 100)) * 100) / 100 : (m.amount || splitAmt),
          date: m.date || getLocalDateString(d)
        };
      });
      setMilestones(newMilestones);
    }
  };

  const handleUpdateMilestone = (id, field, val) => {
    setMilestones(prev => prev.map(m => {
      if (m.id !== id) return m;

      if (field === 'name') {
        return { ...m, name: val };
      }

      if (field === 'date') {
        return { ...m, date: val };
      }

      if (field === 'percent') {
        const pct = parseFloat(val) || 0;
        const amt = numPoValue > 0 ? Math.round((numPoValue * (pct / 100)) * 100) / 100 : 0;
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

  // When PO Value changes, update milestone amounts based on their percentages
  const handlePoValueChange = (newVal) => {
    setPoValue(newVal);
    const parsedVal = parseFloat(newVal) || 0;
    setMilestones(prev => prev.map(m => {
      const pct = parseFloat(m.percent) || 0;
      const newAmt = parsedVal > 0 ? Math.round((parsedVal * (pct / 100)) * 100) / 100 : 0;
      return { ...m, amount: newAmt };
    }));
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
  const isMilestonesBalanced = numPoValue > 0 ? Math.abs(totalMilestonesAmount - numPoValue) <= 1 : true;

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedProj = projectsList.find(p => p.id === linkedProject);
    const projectName = selectedProj ? (selectedProj.projectName || selectedProj.name) : '';

    const rate = rates[currency] || (
      currency === 'AED' ? 3.67 :
      currency === 'SAR' ? 3.75 :
      currency === 'INR' ? 83.2 :
      currency === 'EUR' ? 0.92 :
      currency === 'GBP' ? 0.79 : 1.0
    );
    const totalValUsd = currency === 'USD' ? numPoValue : (numPoValue / rate);

    const finalizedMilestones = milestones.length > 0
      ? milestones.map((m, idx) => ({
          name: m.name || `Milestone ${idx + 1}`,
          percent: parseFloat(m.percent) || 0,
          amount: parseFloat(m.amount) || 0,
          date: m.date || poDate,
          status: 'Unbilled'
        }))
      : [
          {
            name: 'Full Contract Procurement',
            percent: 100,
            amount: numPoValue,
            date: expectedCompletion,
            status: 'Unbilled'
          }
        ];

    const cleanClientPoNum = forClientPo && forClientPo !== 'No linked client PO'
      ? forClientPo.split('—')[0].trim()
      : '';

    onSave({
      id: `SPO-${Date.now()}`,
      poNumber: poNumber.trim() || `VOL-PO-${Date.now()}`,
      supplierName: supplierName.trim() || 'Vendor Account',
      entity: 'Volvitech Tech FZ-LLC',
      origin: importExport === 'Domestic' ? 'Domestic' : `${importExport} / ${location.trim() || 'International'}`,
      taxId: 'TAX-' + Math.floor(100000 + Math.random() * 900000),
      issueDate: poDate,
      date: poDate,
      currency,
      committedNative: numPoValue,
      committedUsd: Math.round(totalValUsd * 100) / 100,
      totalValueNative: numPoValue,
      totalValueUsd: Math.round(totalValUsd * 100) / 100,
      billedUsd: 0,
      billedPercent: 0,
      remainingUsd: Math.round(totalValUsd * 100) / 100,
      remainingNative: numPoValue,
      terms: notes.trim() || 'Net 30',
      status: status || 'Open',
      location: location.trim(),
      importExport,
      expectedCompletion,
      linkedProject: linkedProject !== 'No project' ? linkedProject : '',
      projectName,
      linkedClientPo: cleanClientPoNum,
      notes: notes.trim(),
      attachedDocuments: attachedFiles.map(f => ({
        id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: f.name,
        size: f.size ? `${Math.round(f.size / 1024)} KB` : '1.2 MB',
        type: f.type || 'application/pdf',
        uploadDate: poDate
      })),
      milestones: finalizedMilestones,
      items: finalizedMilestones.map(m => ({
        desc: m.name,
        qty: 1,
        unitPrice: m.amount,
        total: m.amount
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 animate-fade-in text-left">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header - Spacious & Uncongested */}
        <div className="px-7 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/80 shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">shopping_cart_checkout</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">New PO to supplier</h3>
              <p className="text-xs text-gray-500 mt-1 leading-normal">
                Invoices can be mapped to this order from the invoice form.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 sm:px-8 py-7 space-y-6 text-xs scrollbar-thin">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Row 1: Supplier Name & PO Number */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                SUPPLIER NAME
              </label>
              <input
                type="text"
                required
                list="registered-suppliers-list"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Select or enter supplier name"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
              <datalist id="registered-suppliers-list">
                {vendorsList.map(v => (
                  <option key={v.id || v.name} value={v.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PO NUMBER
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="VOL-PO-2026002"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-medium"
              />
            </div>

            {/* Row 2: PO Date & PO Value */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PO DATE
              </label>
              <input
                type="date"
                required
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PO VALUE
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={poValue}
                onChange={(e) => handlePoValueChange(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            {/* Row 3: Currency & Status */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
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
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Partially Invoiced">Partially Invoiced</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Row 4: Location (Text Input + Dropdown Combobox) & Import / Export */}
            <div className="relative" ref={locationDropdownRef}>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
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
                  className="w-full h-11 pl-4 pr-11 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setLocationOpen(prev => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  title="Toggle location options"
                >
                  <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 block ${locationOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Dropdown Menu */}
              {locationOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 scrollbar-thin animate-fadeIn">
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
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base leading-none">{loc.flag}</span>
                            <span>{loc.label}</span>
                          </div>
                          {isSelected && (
                            <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center">
                      <p className="text-xs text-gray-400 mb-2">No matching preset</p>
                      <button
                        type="button"
                        onClick={() => setLocationOpen(false)}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Keep custom "{location}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                IMPORT / EXPORT
              </label>
              <select
                value={importExport}
                onChange={(e) => setImportExport(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="Export">Export</option>
                <option value="Import">Import</option>
                <option value="Domestic">Domestic</option>
              </select>
            </div>

            {/* Row 5: Expected Completion & Project */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                EXPECTED COMPLETION
              </label>
              <input
                type="date"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PROJECT
              </label>
              <select
                value={linkedProject}
                onChange={(e) => setLinkedProject(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="No project">No project</option>
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectName || p.name || p.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 6: FOR CLIENT PO */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                FOR CLIENT PO
              </label>
              <select
                value={forClientPo}
                onChange={(e) => setForClientPo(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="No linked client PO">No linked client PO</option>
                {clientPosList.map(cpo => (
                  <option key={cpo.id || cpo.poNumber} value={`${cpo.poNumber} — ${cpo.clientName}`}>
                    {cpo.poNumber} — {cpo.clientName} ({cpo.currency} {cpo.totalValueNative?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Payment Milestones */}
          <div className="p-6 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-4 my-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">
                  Payment milestones
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  Enter a % or an amount. Total must equal the PO value.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyFromClientPo}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                  title="Copy milestone breakdown from the linked Client PO"
                >
                  <span className="material-symbols-outlined text-[15px] text-blue-600">content_copy</span>
                  <span>Copy from client PO</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3.5 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Add milestone</span>
                </button>
              </div>
            </div>

            {/* Milestones List */}
            {milestones.length === 0 ? (
              <div className="text-center py-6 px-6 border border-dashed border-gray-200 rounded-xl bg-white text-gray-400 text-xs leading-relaxed">
                No milestones defined. Click <strong className="text-blue-600 font-semibold">+ Add milestone</strong> or <strong className="text-gray-700 font-semibold">Copy from client PO</strong> to structure supplier milestone billing.
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                {/* Column Headers for Alignment */}
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3">
                  <div className="col-span-4">Milestone Description</div>
                  <div className="col-span-2 text-right">Percent (%)</div>
                  <div className="col-span-3 text-right">Amount ({currency})</div>
                  <div className="col-span-2 text-center">Due Date</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {milestones.map((ms, idx) => (
                  <div
                    key={ms.id || idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-2xs"
                  >
                    {/* Milestone Name */}
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={ms.name}
                        onChange={(e) => handleUpdateMilestone(ms.id, 'name', e.target.value)}
                        placeholder={`Milestone ${idx + 1}`}
                        className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-medium"
                      />
                    </div>

                    {/* Percent */}
                    <div className="sm:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={ms.percent}
                          onChange={(e) => handleUpdateMilestone(ms.id, 'percent', e.target.value)}
                          placeholder="20"
                          className="w-full h-9 px-2.5 pr-6 text-xs border border-gray-200 rounded-lg text-right focus:outline-hidden focus:border-blue-500 font-mono font-medium"
                        />
                        <span className="absolute right-2 top-2 text-gray-400 text-xs pointer-events-none">%</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={ms.amount}
                        onChange={(e) => handleUpdateMilestone(ms.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="w-full h-9 px-2.5 text-xs border border-gray-200 rounded-lg text-right focus:outline-hidden focus:border-blue-500 font-mono font-medium"
                      />
                    </div>

                    {/* Date */}
                    <div className="sm:col-span-2">
                      <input
                        type="date"
                        value={ms.date || poDate}
                        onChange={(e) => handleUpdateMilestone(ms.id, 'date', e.target.value)}
                        className="w-full h-9 px-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Remove */}
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(ms.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove milestone"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Milestone validation summary: Total X of Y */}
                <div className={`flex items-center justify-between text-xs px-4 py-2.5 rounded-xl border ${
                  isMilestonesBalanced
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/80 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="material-symbols-outlined text-[18px]">
                      {isMilestonesBalanced ? 'check_circle' : 'info'}
                    </span>
                    <span>
                      Total <strong>{totalMilestonesAmount.toFixed(2)}</strong> of <strong>{numPoValue.toFixed(2)}</strong>
                    </span>
                  </div>
                  <div>
                    {isMilestonesBalanced ? (
                      <span className="font-bold text-emerald-700">Matched with PO Value</span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Remaining: {(numPoValue - totalMilestonesAmount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Notes */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              NOTES
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery terms, supplier ratecard, SLA deliverables..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs resize-y min-h-[76px]"
            />
          </div>

          {/* Section: Attach PO document */}
          <div className="p-6 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3.5 my-2">
            <div>
              <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">
                Attach PO Document
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-normal">
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
                className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 rounded-xl text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-gray-500">upload_file</span>
                <span>Choose Files</span>
              </button>
              <span className="text-xs text-gray-500">
                {attachedFiles.length === 0 ? 'no files selected' : `${attachedFiles.length} file(s) selected`}
              </span>
            </div>

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1.5">
                {attachedFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 font-medium shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] text-indigo-600">attach_file</span>
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
        <div className="px-7 sm:px-8 py-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">check</span>
            <span>Save Purchase Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueSupplierPOModal;
