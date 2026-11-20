import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { loadFinanceData } from '../financeData';
import { convertToUsd, getExchangeRate, DEFAULT_EXCHANGE_RATES } from '../financeCalcs';
import { extractInvoiceFromFile } from '../invoiceExtractor';
import { DataContext } from '../../../context/DataContext';
import { SearchableCombobox } from '../../../components/common/SearchableCombobox';
import { MultiSelectCombobox } from '../../../components/common/MultiSelectCombobox';

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
        exchangeRates: stored.exchangeRates || DEFAULT_EXCHANGE_RATES
      };
    } catch {
      return { clientPos: [], projects: [], clients: [], invoices: [], exchangeRates: {} };
    }
  }, [isOpen]);

  // Access live tracker projects from DataContext
  const dataCtx = useContext(DataContext);
  const liveTrackerProjects = dataCtx?.projects || [];

  // All tracker projects (e.g. CRM, ATS, TMS 365, VolviTracker, Client Portal Modernization, etc.)
  const projectsList = useMemo(() => {
    // Prefer tracker projects from context if available, otherwise passed projects prop, then fallback
    const pool = (Array.isArray(liveTrackerProjects) && liveTrackerProjects.length > 0)
      ? liveTrackerProjects
      : (Array.isArray(projects) && projects.length > 0 ? projects : (fallbackData.projects || []));

    // Deduplicate by id/name
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
  }, [liveTrackerProjects, projects, fallbackData.projects]);

  const clientPosList = clientPos && clientPos.length > 0 ? clientPos : fallbackData.clientPos;
  const clientsList = clients && clients.length > 0 ? clients : fallbackData.clients;
  const invoicesList = existingInvoices && existingInvoices.length > 0 ? existingInvoices : fallbackData.invoices;
  const rates = Object.keys(exchangeRates).length > 0 ? exchangeRates : fallbackData.exchangeRates;

  // Multi-select states for Project and Client PO
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedClientPoIds, setSelectedClientPoIds] = useState([]);
  const [selectedPaymentMilestone, setSelectedPaymentMilestone] = useState('');

  // Project options for MultiSelectCombobox
  const projectComboboxOptions = useMemo(() => {
    return projectsList.map(pr => {
      const name = pr.name || pr.projectName || pr.id;
      return {
        id: name,
        name: name,
        subtitle: [pr.clientName ? `Client: ${pr.clientName}` : null, pr.status ? `Status: ${pr.status}` : null].filter(Boolean).join(' · '),
        raw: pr
      };
    });
  }, [projectsList]);

  // Client PO options for MultiSelectCombobox
  const clientPoComboboxOptions = useMemo(() => {
    return clientPosList.map(po => {
      const poNum = po.poNumber || po.id;
      const amt = po.totalValueNative ? `${po.currency || 'USD'} ${Number(po.totalValueNative).toLocaleString()}` : '';
      return {
        id: po.id || poNum,
        name: poNum,
        subtitle: [po.clientName, amt, po.status].filter(Boolean).join(' · '),
        raw: po
      };
    });
  }, [clientPosList]);

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
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionBanner, setExtractionBanner] = useState(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
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

  // Available unique clients for searchable dropdown
  const availableClients = useMemo(() => {
    const map = new Map();
    // 1. From clientsList (Master Directory)
    clientsList.forEach(c => {
      if (c && c.name && c.name.trim()) {
        const key = c.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: c.id || key,
            name: c.name.trim(),
            subtitle: [c.country, c.classification, c.category].filter(Boolean).join(' · '),
            country: c.country,
            location: c.location
          });
        }
      }
    });
    // 2. From projectsList
    projectsList.forEach(p => {
      if (p && p.clientName && p.clientName.trim()) {
        const key = p.clientName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `proj-${p.id || key}`,
            name: p.clientName.trim(),
            subtitle: p.name ? `Project: ${p.name}` : ''
          });
        }
      }
    });
    // 3. From clientPosList
    clientPosList.forEach(po => {
      if (po && po.clientName && po.clientName.trim()) {
        const key = po.clientName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `po-${po.id || key}`,
            name: po.clientName.trim(),
            subtitle: po.poNumber ? `PO: ${po.poNumber}` : ''
          });
        }
      }
    });
    return Array.from(map.values());
  }, [clientsList, projectsList, clientPosList]);

  // Generate default invoice number on modal open
  useEffect(() => {
    if (isOpen) {
      setSelectedProjects([]);
      setSelectedClientPoIds([]);
      setSelectedPaymentMilestone('');
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

  // Find currently selected Client POs
  const activePos = useMemo(() => {
    if (!selectedClientPoIds || selectedClientPoIds.length === 0) return [];
    return clientPosList.filter(p => selectedClientPoIds.includes(p.id) || selectedClientPoIds.includes(p.poNumber));
  }, [selectedClientPoIds, clientPosList]);

  const activePo = activePos[0] || null;

  // Available milestones from selected Client PO(s)
  const availableMilestones = useMemo(() => {
    if (activePos.length === 0) return [];
    const list = [];
    activePos.forEach(po => {
      const ms = po.milestones || [];
      ms.forEach((m, idx) => {
        list.push({
          ...m,
          poNumber: po.poNumber,
          poId: po.id,
          key: `${po.id || po.poNumber}-ms-${idx}`,
          label: activePos.length > 1
            ? `[${po.poNumber}] ${m.name || `Milestone ${idx + 1}`} (${po.currency || 'USD'} ${Number(m.amount || 0).toLocaleString()})`
            : `${m.name || `Milestone ${idx + 1}`} (${po.currency || 'USD'} ${Number(m.amount || 0).toLocaleString()})`
        });
      });
    });
    return list;
  }, [activePos]);

  // When Client POs change: autofill metadata
  const handleClientPosChange = (newPoIds) => {
    setSelectedClientPoIds(newPoIds);
    setSelectedPaymentMilestone('');

    if (!newPoIds || newPoIds.length === 0) {
      return;
    }

    const matchedPos = clientPosList.filter(p => newPoIds.includes(p.id) || newPoIds.includes(p.poNumber));
    if (matchedPos.length > 0) {
      const firstPo = matchedPos[0];
      if (firstPo.clientName && !clientName) setClientName(firstPo.clientName);
      if (firstPo.location || firstPo.country) setClientLocation(firstPo.location || firstPo.country);
      if (firstPo.currency) setCurrency(firstPo.currency);
      if (firstPo.importExport) setImportExport(firstPo.importExport);
      if (firstPo.poDate || firstPo.issueDate) setPoDate(firstPo.poDate || firstPo.issueDate);

      // Sum PO values across selected POs
      const sumPoVal = matchedPos.reduce((sum, p) => sum + (parseFloat(p.totalValueNative || p.poValue) || 0), 0);
      if (sumPoVal > 0) setPoValue(sumPoVal);

      // Auto-match projects from selected POs if none are currently selected
      if (selectedProjects.length === 0) {
        const foundProjects = [];
        matchedPos.forEach(po => {
          const lp = po.linkedProject || po.projectName;
          if (lp && !foundProjects.includes(lp)) {
            foundProjects.push(lp);
          }
        });
        if (foundProjects.length > 0) {
          setSelectedProjects(foundProjects);
        }
      }

      // Default invoice value to remaining native or 20%
      const sumRemain = matchedPos.reduce((sum, p) => sum + (parseFloat(p.remainingNative) || (p.totalValueNative ? p.totalValueNative * 0.2 : 0)), 0);
      if (sumRemain > 0 && invoiceValue === 0) {
        setInvoiceValue(sumRemain);
        setInvoiceValueTax(sumRemain);
      }
    }
  };

  const handleProjectsChange = (newProjects) => {
    setSelectedProjects(newProjects);
    // If clientName is not set, set from first selected project with clientName
    if (!clientName && newProjects.length > 0) {
      for (const pr of newProjects) {
        const matched = projectsList.find(p => (p.name || p.projectName || p.id) === pr);
        if (matched && matched.clientName) {
          setClientName(matched.clientName);
          break;
        }
      }
    }
  };

  // Backward compatibility aliases
  const handleClientPoChange = (poId) => {
    if (!poId || poId === 'Not linked') {
      handleClientPosChange([]);
    } else {
      handleClientPosChange([poId]);
    }
  };

  const handleSelectProject = (proj) => {
    if (!proj || proj === 'No project') {
      handleProjectsChange([]);
    } else {
      const projTitle = typeof proj === 'string' ? proj : (proj.name || proj.projectName || proj.id);
      handleProjectsChange([projTitle]);
    }
  };

  const handleProjectChange = (val) => {
    handleSelectProject(val);
  };

  // When Payment Milestone changes: autofill amounts & description
  const handleMilestoneSelect = (milestoneKey) => {
    setSelectedPaymentMilestone(milestoneKey);
    if (!milestoneKey || milestoneKey === 'Custom' || milestoneKey === 'Pick a client PO first') return;

    const m = availableMilestones.find((item) => item.key === milestoneKey || item.name === milestoneKey);
    if (m) {
      const amt = parseFloat(m.amount) || 0;
      setInvoiceValue(amt);
      setInvoiceValueTax(amt);
      setMilestonesText(m.label || m.name);
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

  // File upload and automatic information extraction handler
  const processFilesAndExtract = async (files) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    setAttachedFiles(prev => [...prev, ...filesArray]);

    const primaryFile = filesArray[0];
    if (!primaryFile) return;

    setIsExtracting(true);
    try {
      const result = await extractInvoiceFromFile(primaryFile, {
        clientsList,
        projectsList,
        clientPosList,
        availableLocations
      });

      if (result && result.extractedCount > 0) {
        const { extracted } = result;

        if (extracted.invoiceNumber) {
          setInvoiceNumber(extracted.invoiceNumber);
        }
        if (extracted.clientName) {
          setClientName(extracted.clientName);
        }
        if (extracted.currency) {
          setCurrency(extracted.currency);
        }
        if (extracted.selectedClientPoId) {
          handleClientPoChange(extracted.selectedClientPoId);
        } else if (extracted.poNumber) {
          // Check if matches an existing PO
          const matchedPo = clientPosList.find(p => p.poNumber === extracted.poNumber);
          if (matchedPo) {
            handleClientPoChange(matchedPo.id || matchedPo.poNumber);
          }
        }
        if (extracted.invoicingDate) {
          handleInvoicingDateChange(extracted.invoicingDate);
        }
        if (extracted.invoiceValue !== undefined) {
          handleInvoiceValueChange(extracted.invoiceValue);
        }
        if (extracted.poDate) {
          setPoDate(extracted.poDate);
        }
        if (extracted.poValue !== undefined) {
          setPoValue(extracted.poValue);
        }
        if (extracted.clientLocation) {
          setClientLocation(extracted.clientLocation);
        }
        if (extracted.importExport) {
          handleImportExportChange(extracted.importExport);
        }
        if (extracted.paymentTermDays) {
          setPaymentTermDays(extracted.paymentTermDays);
        }
        if (extracted.milestonesText) {
          setMilestonesText(extracted.milestonesText);
        }
        if (extracted.notes) {
          setNotes(extracted.notes);
        }
        if (extracted.selectedProject) {
          setSelectedProject(extracted.selectedProject);
        }

        setExtractionBanner({
          count: result.extractedCount,
          fileName: primaryFile.name
        });
      }
    } catch (err) {
      console.warn('Invoice extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesAndExtract(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesAndExtract(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    if (attachedFiles.length <= 1) {
      setExtractionBanner(null);
    }
  };

  if (!isOpen) return null;

  // Rate conversion for preview
  const rate = getExchangeRate(currency, rates);
  const numInvoiceVal = parseFloat(invoiceValueTax) || parseFloat(invoiceValue) || 0;
  const totalValUsd = convertToUsd(numInvoiceVal, currency, rates);
  const numReceived = parseFloat(amountReceivedSoFar) || 0;
  const receivedUsd = convertToUsd(numReceived, currency, rates);
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

    const linkedPoNums = activePos.map(p => p.poNumber).filter(Boolean);
    const cleanPoNum = linkedPoNums.length > 0
      ? linkedPoNums.join(', ')
      : (selectedClientPoIds.length > 0 ? selectedClientPoIds.join(', ') : '');

    const projectStr = selectedProjects.length > 0
      ? selectedProjects.join(', ')
      : (activePos[0]?.linkedProject || activePos[0]?.projectName || '');

    onSave({
      id: `INV-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim() || `VOL-EXP-INV-${Date.now()}`,
      linkedPo: cleanPoNum,
      poNumber: cleanPoNum,
      clientPoNumber: cleanPoNum,
      linkedClientPoId: selectedClientPoIds[0] || '',
      linkedClientPoIds: selectedClientPoIds,
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
      exchangeRate: rate,
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
      linkedProject: projectStr,
      projectName: projectStr,
      linkedProjects: selectedProjects,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-slide-up">
        {/* Header - Matches Image 2 standard */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">receipt_long</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-display">New client invoice</h3>
              <p className="text-xs text-gray-500">All values are stored against your account only.</p>
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

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] text-xs scrollbar-thin">
          {/* 1. Document Attachment Hub & Smart Auto-Extractor (Placed First) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Attach Invoice Document / SOW
                  </h4>
                  <p className="text-[10.5px] text-gray-500">
                    Upload to auto-extract and prefill invoice details
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                <span className="material-symbols-outlined text-[12px] text-blue-600">auto_awesome</span>
                Auto-Extract
              </span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-xl p-3.5 text-center cursor-pointer transition group shadow-2xs"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                  <span className={`material-symbols-outlined text-[20px] ${isExtracting ? 'animate-spin text-blue-600' : ''}`}>
                    {isExtracting ? 'progress_activity' : 'cloud_upload'}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-800 group-hover:text-blue-700">
                  {isExtracting ? (
                    <span className="text-blue-600 font-extrabold animate-pulse">Analyzing document & prefilling invoice...</span>
                  ) : (
                    <span>Click or drag invoice document here</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  PDF, Excel (.xlsx), Word (.docx), CSV, or Scanned Images · Extracts amounts, PO#, dates & client
                </span>
              </div>
            </div>

            {/* Smart Extraction Success Banner */}
            {extractionBanner && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/90 rounded-xl px-3 py-2 text-xs text-emerald-900 shadow-2xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                  <div>
                    <span className="font-bold">Extracted {extractionBanner.count} fields from {extractionBanner.fileName}</span>
                    <p className="text-[10.5px] text-emerald-700 mt-0.5">
                      Invoice fields below were auto-populated. Review or adjust any value as needed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExtractionBanner(null)}
                  className="text-emerald-500 hover:text-emerald-800 p-1 rounded-lg transition"
                  title="Dismiss banner"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Attached file chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {attachedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 font-medium shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] text-blue-600">
                      {file.name?.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' :
                       file.name?.toLowerCase().endsWith('.xlsx') || file.name?.toLowerCase().endsWith('.xls') ? 'table_chart' :
                       'description'}
                    </span>
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-gray-400 hover:text-rose-600 ml-0.5 p-0.5 rounded transition cursor-pointer"
                      title="Remove file"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card: Project Traceability */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
            <div>
              <h4 className="text-sm font-bold text-gray-900 font-display tracking-tight">Project traceability</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-normal">
                Start here — picking a PO and milestone fills in the rest. Everything stays editable.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  PROJECT
                </label>
                <MultiSelectCombobox
                  values={selectedProjects}
                  onChange={handleProjectsChange}
                  options={projectComboboxOptions}
                  placeholder="Search or select project..."
                  noneOptionLabel="No project"
                  allowCustom={true}
                  badgeColor="blue"
                  icon="inventory_2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  CLIENT PO
                </label>
                <MultiSelectCombobox
                  values={selectedClientPoIds}
                  onChange={handleClientPosChange}
                  options={clientPoComboboxOptions}
                  placeholder="Search or select client PO..."
                  noneOptionLabel="Not linked"
                  allowCustom={false}
                  badgeColor="indigo"
                  icon="description"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                PAYMENT MILESTONE
              </label>
              <select
                value={selectedPaymentMilestone}
                onChange={(e) => handleMilestoneSelect(e.target.value)}
                disabled={activePos.length === 0 || availableMilestones.length === 0}
                className={`w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs ${
                  activePos.length === 0 ? 'text-gray-400 bg-gray-50/50 cursor-not-allowed' : ''
                }`}
              >
                {activePos.length === 0 ? (
                  <option value="">Pick a client PO first</option>
                ) : availableMilestones.length === 0 ? (
                  <option value="">No milestones found in selected PO(s) (Custom)</option>
                ) : (
                  <>
                    <option value="">Select a payment milestone...</option>
                    {availableMilestones.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
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
              <SearchableCombobox
                value={clientName}
                onChange={(val, item) => {
                  setClientName(val);
                  if (item && item.country && !clientLocation) {
                    setClientLocation(item.country);
                  }
                }}
                options={availableClients}
                placeholder="e.g. Expertise Contracting"
                required
                inputClassName="h-11 px-4"
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
