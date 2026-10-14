import React, { useState, useEffect, useRef, useMemo } from 'react';
import { loadFinanceData } from '../financeData';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthString = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
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

const GenerateInvoiceModal = ({
  isOpen,
  onClose,
  onSave,
  clientPos = [],
  projects = [],
  clients = [],
  exchangeRates = {},
  existingInvoices = []
}) => {
  const fileInputRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Fallbacks if data is not passed via props
  const fallbackData = useMemo(() => {
    if (!isOpen) return { clientPos: [], projects: [], clients: [], invoices: [], exchangeRates: {} };
    try {
      const stored = loadFinanceData();
      return {
        clientPos: stored.clientPos || [],
        projects: stored.projects || [],
        clients: stored.masterDirectory?.filter(d => d.category === 'Client') || [],
        invoices: stored.invoices || [],
        exchangeRates: stored.exchangeRates || { USD: 1, AED: 3.67, SAR: 3.75, INR: 83.2 }
      };
    } catch {
      return { clientPos: [], projects: [], clients: [], invoices: [], exchangeRates: {} };
    }
  }, [isOpen]);

  const clientPosList = clientPos && clientPos.length > 0 ? clientPos : fallbackData.clientPos;
  const projectsList = projects && projects.length > 0 ? projects : fallbackData.projects;
  const clientsList = clients && clients.length > 0 ? clients : fallbackData.clients;
  const invoicesList = existingInvoices && existingInvoices.length > 0 ? existingInvoices : fallbackData.invoices;
  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackData.exchangeRates;

  // Form states matching screenshot
  const [selectedProject, setSelectedProject] = useState('No project');
  const [selectedClientPoId, setSelectedClientPoId] = useState('Not linked');
  const [selectedPaymentMilestone, setSelectedPaymentMilestone] = useState('');

  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceValue, setInvoiceValue] = useState(0);
  const [invoiceValueTax, setInvoiceValueTax] = useState(0);
  const [invoicingDate, setInvoicingDate] = useState(getLocalDateString());
  const [month, setMonth] = useState(getMonthString(getLocalDateString()));
  const [clientLocation, setClientLocation] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);
  const [importExport, setImportExport] = useState('Export');
  const [currency, setCurrency] = useState('USD');
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [amountReceivedSoFar, setAmountReceivedSoFar] = useState(0);
  const [poDate, setPoDate] = useState(getLocalDateString());
  const [poValue, setPoValue] = useState(0);
  const [milestonesText, setMilestonesText] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [paidDate, setPaidDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
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

  // Filtered locations
  const availableLocations = useMemo(() => {
    const map = new Map();
    LOCATION_PRESETS.forEach(loc => map.set(loc.value.toLowerCase(), loc));
    clientsList.forEach(c => {
      if (c.country && !map.has(c.country.toLowerCase())) {
        map.set(c.country.toLowerCase(), { value: c.country, label: c.country, flag: '🌐' });
      }
    });
    return Array.from(map.values());
  }, [clientsList]);

  const filteredLocations = useMemo(() => {
    if (!clientLocation.trim()) return availableLocations;
    const q = clientLocation.toLowerCase();
    return availableLocations.filter(loc =>
      loc.label.toLowerCase().includes(q) || loc.value.toLowerCase().includes(q)
    );
  }, [clientLocation, availableLocations]);

  // Generate default invoice number on modal open
  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear();
      const count = (invoicesList.length || 0) + 1;
      const typeCode = importExport === 'Export' ? 'EXP' : 'DOM';
      const autoNum = `VOL-${typeCode}-INV-${year}${String(count).padStart(3, '0')}`;
      setInvoiceNumber(autoNum);
      const today = getLocalDateString();
      setInvoicingDate(today);
      setMonth(getMonthString(today));
      setPaidDate(today);
    }
  }, [isOpen]);

  // Keep month in sync when invoicingDate changes
  const handleInvoicingDateChange = (val) => {
    setInvoicingDate(val);
    setMonth(getMonthString(val));
  };

  // Keep invoice number prefix in sync if importExport changes and user hasn't heavily customized
  const handleImportExportChange = (val) => {
    setImportExport(val);
    const typeCode = val === 'Export' ? 'EXP' : val === 'Domestic' ? 'DOM' : 'IMP';
    if (invoiceNumber.startsWith('VOL-')) {
      const parts = invoiceNumber.split('-');
      if (parts.length >= 4) {
        setInvoiceNumber(`VOL-${typeCode}-${parts.slice(2).join('-')}`);
      }
    }
  };

  // Find currently selected Client PO
  const activePo = useMemo(() => {
    if (!selectedClientPoId || selectedClientPoId === 'Not linked') return null;
    return clientPosList.find(p => p.id === selectedClientPoId || p.poNumber === selectedClientPoId) || null;
  }, [selectedClientPoId, clientPosList]);

  // Available milestones from selected Client PO
  const availableMilestones = useMemo(() => {
    if (!activePo || !activePo.milestones || activePo.milestones.length === 0) return [];
    return activePo.milestones;
  }, [activePo]);

  // When Client PO changes: autofill metadata
  const handleClientPoChange = (poId) => {
    setSelectedClientPoId(poId);
    setSelectedPaymentMilestone('');

    if (poId === 'Not linked') {
      return;
    }

    const po = clientPosList.find(p => p.id === poId || p.poNumber === poId);
    if (po) {
      if (po.clientName) setClientName(po.clientName);
      if (po.location || po.country) setClientLocation(po.location || po.country);
      if (po.currency) setCurrency(po.currency);
      if (po.importExport) setImportExport(po.importExport);
      if (po.poDate || po.issueDate) setPoDate(po.poDate || po.issueDate);
      if (po.totalValueNative || po.poValue) setPoValue(po.totalValueNative || po.poValue || 0);

      // Auto-match project if PO has one
      if (po.linkedProject || po.projectName) {
        const foundProj = projectsList.find(pr =>
          pr.projectName === po.linkedProject ||
          pr.name === po.linkedProject ||
          pr.projectCode === po.linkedProject ||
          pr.id === po.linkedProject
        );
        if (foundProj) {
          setSelectedProject(foundProj.projectCode || foundProj.name || foundProj.id);
        }
      }

      // Default invoice value to remaining native or half
      const remain = po.remainingNative || (po.totalValueNative ? po.totalValueNative * 0.2 : 0);
      if (remain > 0) {
        setInvoiceValue(remain);
        setInvoiceValueTax(remain);
      }
    }
  };

  // When Payment Milestone changes: autofill amounts & description
  const handleMilestoneSelect = (milestoneKey) => {
    setSelectedPaymentMilestone(milestoneKey);
    if (!milestoneKey || milestoneKey === 'Custom' || milestoneKey === 'Pick a client PO first') return;

    const m = availableMilestones.find((item, idx) => `ms-${idx}` === milestoneKey || item.name === milestoneKey);
    if (m) {
      const amt = parseFloat(m.amount) || 0;
      setInvoiceValue(amt);
      setInvoiceValueTax(amt);
      const totalCount = availableMilestones.length;
      const mIdx = availableMilestones.indexOf(m) + 1;
      setMilestonesText(`M${mIdx} of ${totalCount} — ${m.name}`);
    }
  };

  // Invoice value changes
  const handleInvoiceValueChange = (val) => {
    const num = parseFloat(val) || 0;
    setInvoiceValue(num);
    // If tax value was tracking exactly or was 0, track standard 1:1 or maintain tax difference
    setInvoiceValueTax(num);
    if (paymentReceived) {
      setAmountReceivedSoFar(num);
    }
  };

  // Invoice value + tax changes
  const handleInvoiceValueTaxChange = (val) => {
    const num = parseFloat(val) || 0;
    setInvoiceValueTax(num);
    if (paymentReceived) {
      setAmountReceivedSoFar(num);
    }
  };

  // Payment received checkbox toggle
  const handlePaymentReceivedToggle = (checked) => {
    setPaymentReceived(checked);
    if (checked) {
      const fullVal = invoiceValueTax > 0 ? invoiceValueTax : invoiceValue;
      setAmountReceivedSoFar(fullVal);
      if (!paidDate) setPaidDate(getLocalDateString());
    }
  };

  // File upload handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setAttachedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  // Rate conversion for preview
  const rate = rates[currency] || 1;
  const numInvoiceVal = parseFloat(invoiceValueTax) || parseFloat(invoiceValue) || 0;
  const totalValUsd = currency === 'USD' ? numInvoiceVal : numInvoiceVal / (rate || 1);
  const numReceived = parseFloat(amountReceivedSoFar) || 0;
  const receivedUsd = currency === 'USD' ? numReceived : numReceived / (rate || 1);
  const balanceNative = Math.max(0, numInvoiceVal - numReceived);
  const balanceUsd = Math.max(0, totalValUsd - receivedUsd);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Determine payment settlement status
    const isFullyPaid = paymentReceived || (numInvoiceVal > 0 && numReceived >= numInvoiceVal);
    const invoiceStatus = isFullyPaid
      ? 'Paid'
      : numReceived > 0
      ? 'Partially Paid'
      : 'Pending';

    // Calculate due date
    const dDate = new Date(invoicingDate || new Date());
    dDate.setDate(dDate.getDate() + (parseInt(paymentTermDays) || 30));
    const dueDateStr = getLocalDateString(dDate);

    const cleanPoNum = activePo ? activePo.poNumber : selectedClientPoId !== 'Not linked' ? selectedClientPoId : '';

    onSave({
      id: `INV-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `VOL-EXP-INV-${Date.now()}`,
      linkedPo: cleanPoNum,
      clientName: clientName.trim() || (activePo?.clientName || 'Client Account'),
      country: clientLocation.trim() || (activePo?.country || 'USA 🇺🇸'),
      clientLocation: clientLocation.trim(),
      issueDate: invoicingDate,
      invoicingDate,
      month: month.trim() || getMonthString(invoicingDate),
      dueDate: dueDateStr,
      paymentTermDays: parseInt(paymentTermDays) || 30,
      amountNative: numInvoiceVal,
      invoiceValue: parseFloat(invoiceValue) || 0,
      invoiceValueTax: numInvoiceVal,
      currency,
      amountUsd: Math.round(totalValUsd * 100) / 100,
      amountReceivedSoFar: numReceived,
      receivedUsd: Math.round(receivedUsd * 100) / 100,
      balanceNative,
      balanceUsd: Math.round(balanceUsd * 100) / 100,
      status: invoiceStatus,
      isPaid: isFullyPaid,
      paidDate: isFullyPaid ? (paidDate || invoicingDate) : null,
      importExport,
      poDate,
      poValue: parseFloat(poValue) || 0,
      milestone: milestonesText.trim() || selectedPaymentMilestone || 'Invoice Milestone Delivery',
      milestones: milestonesText.trim(),
      linkedProject: selectedProject !== 'No project' ? selectedProject : (activePo?.linkedProject || ''),
      projectName: selectedProject !== 'No project' ? selectedProject : (activePo?.projectName || ''),
      notes: notes.trim(),
      attachedDocuments: attachedFiles.map(f => ({
        id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: f.name,
        size: f.size ? `${Math.round(f.size / 1024)} KB` : '1.2 MB',
        type: f.type || 'application/pdf',
        uploadDate: invoicingDate
      }))
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 animate-fade-in text-left">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header - Matches screenshot styling */}
        <div className="px-7 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80 shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">New client invoice</h3>
              <p className="text-xs text-gray-500 mt-1 leading-normal">
                All values are stored against your account only.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-7 sm:p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Card: Project Traceability */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">Project traceability</h4>
              <p className="text-[11.5px] text-gray-500 mt-0.5 leading-normal">
                Start here — picking a PO and milestone fills in the rest. Everything stays editable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                  PROJECT
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
                >
                  <option value="No project">No project</option>
                  {projectsList.map(pr => (
                    <option key={pr.id || pr.projectCode} value={pr.projectCode || pr.name || pr.id}>
                      {pr.projectCode ? `${pr.projectCode} — ` : ''}{pr.name || pr.projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                  CLIENT PO
                </label>
                <select
                  value={selectedClientPoId}
                  onChange={(e) => handleClientPoChange(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-medium"
                >
                  <option value="Not linked">Not linked</option>
                  {clientPosList.map(po => (
                    <option key={po.id || po.poNumber} value={po.id || po.poNumber}>
                      {po.poNumber} — {po.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PAYMENT MILESTONE
              </label>
              <select
                value={selectedPaymentMilestone}
                onChange={(e) => handleMilestoneSelect(e.target.value)}
                disabled={!activePo || availableMilestones.length === 0}
                className={`w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs ${
                  !activePo ? 'text-gray-400 bg-gray-50/50 cursor-not-allowed' : ''
                }`}
              >
                {!activePo ? (
                  <option value="">Pick a client PO first</option>
                ) : availableMilestones.length === 0 ? (
                  <option value="">No milestones found in this PO (Custom)</option>
                ) : (
                  <>
                    <option value="">Select a payment milestone...</option>
                    {availableMilestones.map((m, idx) => (
                      <option key={idx} value={`ms-${idx}`}>
                        {m.name || `Milestone ${idx + 1}`} ({m.percent ? `${m.percent}% · ` : ''}{currency} {(m.amount || 0).toLocaleString()})
                      </option>
                    ))}
                    <option value="Custom">Custom / Ad-hoc Milestone</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Main Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {/* Row 1: Client Name & Invoice Number */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                CLIENT NAME
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Expertise Contracting"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                INVOICE NUMBER
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="VOL-EXP-INV-2026002"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            {/* Row 2: Invoice Value & Invoice Value + Tax */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                INVOICE VALUE
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={invoiceValue}
                onChange={(e) => handleInvoiceValueChange(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                INVOICE VALUE + TAX
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={invoiceValueTax}
                onChange={(e) => handleInvoiceValueTaxChange(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            {/* Row 3: Invoicing Date & Month */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                INVOICING DATE
              </label>
              <input
                type="date"
                required
                value={invoicingDate}
                onChange={(e) => handleInvoicingDateChange(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                MONTH
              </label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="Oct 2026"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium"
              />
            </div>

            {/* Row 4: Client Location & Import / Export */}
            <div className="relative" ref={locationDropdownRef}>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                CLIENT LOCATION
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientLocation}
                  onChange={(e) => {
                    setClientLocation(e.target.value);
                    setLocationOpen(true);
                  }}
                  onFocus={() => setLocationOpen(true)}
                  placeholder="e.g. Riyadh, Saudi Arabia"
                  className="w-full h-11 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setLocationOpen(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {locationOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                  </span>
                </button>
              </div>

              {locationOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-50 animate-fade-in">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setClientLocation(loc.value);
                          setLocationOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-blue-50/70 flex items-center justify-between transition group"
                      >
                        <span className="font-medium text-gray-800 group-hover:text-blue-700">{loc.label}</span>
                        <span className="text-base">{loc.flag}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400 italic">
                      Press enter to use custom location "{clientLocation}"
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
                onChange={(e) => handleImportExportChange(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              >
                <option value="Export">Export</option>
                <option value="Import">Import</option>
                <option value="Domestic">Domestic</option>
              </select>
            </div>

            {/* Row 5: Currency & Payment Term (Days) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-medium"
              >
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
                <option value="CAD">CAD</option>
                <option value="QAR">QAR</option>
                <option value="KWD">KWD</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PAYMENT TERM (DAYS)
              </label>
              <input
                type="number"
                min="0"
                value={paymentTermDays}
                onChange={(e) => setPaymentTermDays(e.target.value)}
                placeholder="30"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-medium"
              />
            </div>

            {/* Row 6: Amount Received So Far (Full Width) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                AMOUNT RECEIVED SO FAR
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={amountReceivedSoFar}
                onChange={(e) => setAmountReceivedSoFar(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
              <p className="text-[11px] text-gray-500 mt-1.5 leading-normal">
                For part payments. Ticking "Payment received" counts it as fully paid.
              </p>
            </div>

            {/* Row 7: PO Date & PO Value */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PO DATE
              </label>
              <input
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.target.value)}
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono"
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
                value={poValue}
                onChange={(e) => setPoValue(e.target.value)}
                placeholder="0"
                className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs font-mono font-bold"
              />
            </div>

            {/* Row 8: Milestones Textarea (Full Width) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                MILESTONES
              </label>
              <textarea
                rows={2}
                value={milestonesText}
                onChange={(e) => setMilestonesText(e.target.value)}
                placeholder="e.g. M2 of 3 — first delivery"
                className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs resize-none"
              />
            </div>

            {/* Row 9: Payment Received Checkbox & Paid Date */}
            <div className="sm:col-span-2 p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={paymentReceived}
                  onChange={(e) => handlePaymentReceivedToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-xs font-bold text-gray-900">
                  Payment received
                </span>
              </label>

              <div className="flex items-center gap-3">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  PAID DATE
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  disabled={!paymentReceived}
                  className={`h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 font-mono transition shadow-2xs ${
                    !paymentReceived ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              NOTES
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment instructions, bank wire details, or additional remarks..."
              className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs resize-none"
            />
          </div>

          {/* Document Attachment Hub */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              ATTACH INVOICE DOCUMENT / STATEMENT OF WORK
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50/50 hover:bg-blue-50/20 rounded-2xl p-4 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center gap-1.5 text-gray-500">
                <span className="material-symbols-outlined text-[26px] text-gray-400 group-hover:text-blue-600 transition">
                  upload_file
                </span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">
                  Click or drag files here to attach
                </span>
                <span className="text-[10px] text-gray-400">
                  PDF, DOCX, XLSX or scanned tax invoices up to 25MB
                </span>
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-800 font-medium"
                  >
                    <span className="material-symbols-outlined text-[15px] text-blue-600">description</span>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-rose-600 ml-1 p-0.5 rounded transition"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-gray-500">
              {currency !== 'USD' && numInvoiceVal > 0 && (
                <span>
                  USD Equivalent: <strong className="font-mono text-gray-900">${Math.round(totalValUsd).toLocaleString()}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-xs flex items-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-[17px]">receipt_long</span>
                <span>Save Client Invoice</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateInvoiceModal;
