import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { loadFinanceData, saveFinanceData, subscribeFinanceData } from '../finance/financeData';
import AddEntityModal from './modals/AddEntityModal';
import UploadVaultModal from './modals/UploadVaultModal';
import CompanyDossier from './CompanyDossier';

const MasterData = () => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(() => loadFinanceData());
  
  // Modals state
  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [addEntityCategory, setAddEntityCategory] = useState('Client');
  const [uploadVaultOpen, setUploadVaultOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [poToDelete, setPoToDelete] = useState(null);
  
  // Selected entity for 360 inspector
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  // Dedicated Company Dossier View State (from route /master-data/:companyId or query param or button click)
  const [viewingCompanyId, setViewingCompanyId] = useState(() => companyId || searchParams.get('companyId') || null);

  useEffect(() => {
    if (companyId) {
      setViewingCompanyId(companyId);
    }
  }, [companyId]);

  // Filters state from URL or default
  const paramTab = searchParams.get('tab')?.toUpperCase();
  const initialSegment = paramTab === 'SUPPLIERS' || paramTab === 'SUPPLIER' ? 'SUPPLIERS' :
    paramTab === 'VAULT' ? 'VAULT' :
    paramTab === 'POS' || paramTab === 'PO' ? 'POS' : 'CLIENTS';

  const [activeSegment, setActiveSegment] = useState(initialSegment); // 'CLIENTS' | 'SUPPLIERS' | 'VAULT' | 'POS'

  const handleSelectSegment = (seg) => {
    setActiveSegment(seg);
    setSearchParams(seg === 'CLIENTS' ? {} : { tab: seg.toLowerCase() });

    // Auto-select first matching entity when switching tabs
    if (seg === 'CLIENTS') {
      const firstClient = masterDirectory.find(e => e.category === 'Client');
      if (firstClient && (!selectedEntity || selectedEntity.category !== 'Client')) {
        setSelectedEntityId(firstClient.id);
      }
    } else if (seg === 'SUPPLIERS') {
      const firstSupplier = masterDirectory.find(e => e.category === 'Supplier');
      if (firstSupplier && (!selectedEntity || selectedEntity.category !== 'Supplier')) {
        setSelectedEntityId(firstSupplier.id);
      }
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterTerms, setFilterTerms] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyExpiring, setOnlyExpiring] = useState(false);

  // Vault Category Filter
  const [vaultCategory, setVaultCategory] = useState('ALL');
  const [vaultEntityFilter, setVaultEntityFilter] = useState('');

  // PO Master List Filter States
  const [poFilterType, setPoFilterType] = useState('ALL'); // 'ALL' | 'CLIENT' | 'SUPPLIER'
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poCurrencyFilter, setPoCurrencyFilter] = useState('ALL');

  // Inspector tab
  const [inspectorTab, setInspectorTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'POS' | 'VAULT'

  // Subscribe to updates from other pages / tabs
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  const masterDirectory = data.masterDirectory || [];
  const vaultDocs = data.vault || [];
  const clientPos = data.clientPos || [];
  const supplierPos = data.supplierPos || [];
  const totalPoCount = clientPos.length + supplierPos.length;

  // Default selected entity
  useEffect(() => {
    if (!selectedEntityId && masterDirectory.length > 0) {
      const defaultEnt = activeSegment === 'SUPPLIERS'
        ? masterDirectory.find(e => e.category === 'Supplier')
        : masterDirectory.find(e => e.category === 'Client');
      setSelectedEntityId(defaultEnt ? defaultEnt.id : masterDirectory[0].id);
    }
  }, [masterDirectory, selectedEntityId, activeSegment]);

  const selectedEntity = useMemo(() => {
    return masterDirectory.find(e => e.id === selectedEntityId) || masterDirectory[0] || null;
  }, [masterDirectory, selectedEntityId]);

  // Filtered entities
  const filteredEntities = useMemo(() => {
    return masterDirectory.filter(ent => {
      // Segment filter
      if (activeSegment === 'CLIENTS' && ent.category !== 'Client') return false;
      if (activeSegment === 'SUPPLIERS' && ent.category !== 'Supplier') return false;

      // Text search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = ent.name.toLowerCase().includes(query);
        const matchId = ent.id.toLowerCase().includes(query);
        const matchDept = (ent.department || '').toLowerCase().includes(query);
        const matchMail = (ent.companyMail || '').toLowerCase().includes(query);
        const matchContact = (ent.contactPerson || ent.contact || '').toLowerCase().includes(query);
        const matchEmail = (ent.contactEmail || '').toLowerCase().includes(query);
        const matchCountry = (ent.country || '').toLowerCase().includes(query);
        if (!matchName && !matchId && !matchDept && !matchMail && !matchContact && !matchEmail && !matchCountry) return false;
      }

      // Region
      if (filterRegion && !ent.country.toLowerCase().includes(filterRegion.toLowerCase())) return false;

      // Terms
      if (filterTerms && !ent.creditTerms.toLowerCase().includes(filterTerms.toLowerCase())) return false;

      // Currency
      if (filterCurrency && ent.currency !== filterCurrency) return false;

      // Verified KYC
      if (onlyVerified && !ent.compliance?.toLowerCase().includes('verified')) return false;

      // Expiring
      if (onlyExpiring && !ent.compliance?.toLowerCase().includes('expir')) return false;

      return true;
    });
  }, [masterDirectory, activeSegment, searchTerm, filterRegion, filterTerms, filterCurrency, onlyVerified, onlyExpiring]);

  // Filtered vault docs
  const filteredVaultDocs = useMemo(() => {
    return vaultDocs.filter(doc => {
      if (vaultCategory !== 'ALL' && doc.category !== vaultCategory) return false;
      if (vaultEntityFilter && !doc.entityName.toLowerCase().includes(vaultEntityFilter.toLowerCase())) return false;
      return true;
    });
  }, [vaultDocs, vaultCategory, vaultEntityFilter]);

  // Client and supplier counts
  const clientCount = useMemo(() => masterDirectory.filter(d => d.category === 'Client').length, [masterDirectory]);
  const supplierCount = useMemo(() => masterDirectory.filter(d => d.category === 'Supplier').length, [masterDirectory]);

  // Dynamic KPI: KYC & Compliance Standing
  const kycComplianceStats = useMemo(() => {
    if (!masterDirectory.length) return { rate: '100.0', verifiedCount: 0, renewalCount: 0, grade: 'Audit Grade', gradeColor: 'bg-emerald-100 text-emerald-800' };

    const renewalList = masterDirectory.filter(e => {
      const comp = (e.compliance || '').toLowerCase();
      return comp.includes('expir') || comp.includes('renew') || comp.includes('pend') || comp.includes('action');
    });

    const renewalCount = renewalList.length;
    const verifiedCount = masterDirectory.length - renewalCount;
    const rawRate = (verifiedCount / masterDirectory.length) * 100;
    const rate = rawRate.toFixed(1);

    let grade = 'Audit Grade';
    let gradeColor = 'bg-emerald-100 text-emerald-800';
    if (rawRate < 75) {
      grade = 'Action Req';
      gradeColor = 'bg-amber-100 text-amber-800';
    } else if (rawRate < 95) {
      grade = 'Compliant';
      gradeColor = 'bg-blue-100 text-blue-800';
    }

    return {
      rate,
      verifiedCount,
      renewalCount,
      grade,
      gradeColor
    };
  }, [masterDirectory]);

  // Dynamic KPI: Contract Vault Volume (Central Vault Docs + Company Attached Docs)
  const vaultVolumeStats = useMemo(() => {
    const directAttachedCount = masterDirectory.reduce((sum, ent) => sum + (ent.attachedDocs?.length || ent.docsCount || 0), 0);
    const centralVaultCount = vaultDocs.length;
    const totalFiles = centralVaultCount + directAttachedCount;

    return {
      totalFiles,
      directAttachedCount,
      centralVaultCount
    };
  }, [masterDirectory, vaultDocs]);

  // Dynamic KPI: Multi-Currency Distribution
  const currencyStats = useMemo(() => {
    const counts = {};
    masterDirectory.forEach(e => {
      const curr = e.currency || 'USD';
      counts[curr] = (counts[curr] || 0) + 1;
    });

    const total = masterDirectory.length || 1;
    const palette = [
      { bg: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-700' },
      { bg: 'bg-indigo-600', dot: 'bg-indigo-600', text: 'text-indigo-700' },
      { bg: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-700' },
      { bg: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
      { bg: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-700' },
      { bg: 'bg-rose-500', dot: 'bg-rose-500', text: 'text-rose-700' }
    ];

    const list = Object.entries(counts)
      .map(([curr, count], idx) => ({
        currency: curr,
        count,
        percent: Math.max(5, Math.round((count / total) * 100)),
        colors: palette[idx % palette.length]
      }))
      .sort((a, b) => b.count - a.count);

    return {
      uniqueCount: list.length,
      list
    };
  }, [masterDirectory]);

  // Master PO Registry Aggregation (Client POs - AR & Supplier POs - AP)
  const allMasterPos = useMemo(() => {
    const clients = (data.clientPos || []).map(cpo => ({
      ...cpo,
      uniqueKey: `client-${cpo.id || cpo.poNumber}`,
      type: 'client',
      typeLabel: 'Client PO (AR)',
      counterparty: cpo.clientName,
      scopeOrProject: cpo.scope || cpo.projectName || 'Client Engagement',
      valueNative: cpo.totalValueNative || cpo.totalValueUsd || 0,
      valueUsd: cpo.totalValueUsd || 0,
      billedPercent: cpo.drawdownPercent ?? (cpo.totalValueNative ? Math.round(((cpo.invoicedNative || 0) / cpo.totalValueNative) * 100) : 0),
      billedNative: cpo.invoicedNative || 0,
      remainingNative: cpo.remainingNative || 0,
      terms: cpo.terms || 'Net 30',
      status: cpo.status || 'Active',
      date: cpo.issueDate || '—',
      currency: cpo.currency || 'USD',
      flag: cpo.flag || '🌐',
      financeLink: '/finance/client'
    }));

    const suppliers = (data.supplierPos || []).map(spo => ({
      ...spo,
      uniqueKey: `supplier-${spo.id || spo.poNumber}`,
      type: 'supplier',
      typeLabel: 'Supplier PO (AP)',
      counterparty: spo.supplierName,
      scopeOrProject: spo.linkedProject ? `Project ${spo.linkedProject}` : (spo.items?.[0]?.desc || 'Procurement Order'),
      valueNative: spo.committedNative || spo.committedUsd || 0,
      valueUsd: spo.committedUsd || 0,
      billedPercent: spo.billedPercent ?? (spo.committedUsd ? Math.round(((spo.billedUsd || 0) / spo.committedUsd) * 100) : 0),
      billedNative: spo.billedUsd || 0,
      remainingNative: spo.remainingUsd || 0,
      terms: spo.terms || 'Net 30',
      status: spo.status || 'Active',
      date: spo.issueDate || spo.date || '—',
      currency: spo.currency || 'USD',
      flag: spo.origin?.includes('India') ? '🇮🇳' : spo.origin?.includes('Ireland') ? '🇮🇪' : spo.origin?.includes('Norway') ? '🇳🇴' : spo.origin?.includes('KSA') ? '🇸🇦' : '🌐',
      financeLink: '/finance/supplier'
    }));

    return [...clients, ...suppliers];
  }, [data.clientPos, data.supplierPos]);

  // Filtered Master POs
  const filteredMasterPos = useMemo(() => {
    return allMasterPos.filter(po => {
      if (poFilterType === 'CLIENT' && po.type !== 'client') return false;
      if (poFilterType === 'SUPPLIER' && po.type !== 'supplier') return false;
      if (poStatusFilter !== 'ALL' && po.status !== poStatusFilter) return false;
      if (poCurrencyFilter !== 'ALL' && po.currency !== poCurrencyFilter) return false;
      if (poSearchTerm) {
        const q = poSearchTerm.toLowerCase();
        const matchPoNum = (po.poNumber || '').toLowerCase().includes(q);
        const matchParty = (po.counterparty || '').toLowerCase().includes(q);
        const matchScope = (po.scopeOrProject || '').toLowerCase().includes(q);
        const matchTerms = (po.terms || '').toLowerCase().includes(q);
        if (!matchPoNum && !matchParty && !matchScope && !matchTerms) return false;
      }
      return true;
    });
  }, [allMasterPos, poFilterType, poStatusFilter, poCurrencyFilter, poSearchTerm]);

  // Dynamic PO Registry KPIs
  const poMetrics = useMemo(() => {
    const clientValUsd = (data.clientPos || []).reduce((sum, p) => sum + (p.totalValueUsd || 0), 0);
    const supplierValUsd = (data.supplierPos || []).reduce((sum, p) => sum + (p.committedUsd || 0), 0);
    const netSpread = clientValUsd - supplierValUsd;
    return {
      totalCount: allMasterPos.length,
      clientCount: (data.clientPos || []).length,
      supplierCount: (data.supplierPos || []).length,
      clientValUsd,
      supplierValUsd,
      netSpread,
    };
  }, [allMasterPos, data.clientPos, data.supplierPos]);

  // Handlers
  const handleOpenAddClient = () => {
    setAddEntityCategory('Client');
    setAddEntityOpen(true);
  };

  const handleOpenAddSupplier = () => {
    setAddEntityCategory('Supplier');
    setAddEntityOpen(true);
  };

  const handleSaveEntity = (newEntity) => {
    const nextDirectory = [newEntity, ...masterDirectory];

    // Syndicate attached documents to global vault if not already present
    const newVaultItems = (newEntity.attachedDocs || []).map((doc, idx) => ({
      id: doc.id || `DOC-V-${Date.now()}-${idx}`,
      title: doc.name,
      category: doc.category || 'KYC',
      entityName: newEntity.name,
      fileType: doc.name.toLowerCase().endsWith('.pdf') ? 'PDF' : doc.name.toLowerCase().match(/\.(png|jpg|jpeg)$/) ? 'IMG' : 'DOC',
      size: doc.size || '1.2 MB',
      updatedDate: doc.uploadDate || new Date().toISOString().split('T')[0],
      expiryDate: (doc.expiry || '').replace('Valid till ', '') || '2027-12-31',
      hash: doc.hash || `sha256:${Math.random().toString(36).substring(2, 9)}...`,
      tags: ['KYC', newEntity.name, newEntity.category, 'Verified'],
      url: doc.fileUrl || '#'
    }));

    const nextVault = [...newVaultItems, ...vaultDocs];
    const nextData = {
      ...data,
      masterDirectory: nextDirectory,
      vault: nextVault
    };
    setData(nextData);
    saveFinanceData(nextData);
    setSelectedEntityId(newEntity.id);
    addToast(`${newEntity.category} Master "${newEntity.name}" registered successfully!`, 'success');
  };

  const handleUploadVaultDoc = (newDoc, targetEntityName) => {
    const nextVault = [newDoc, ...vaultDocs];
    // Also attach to target entity docs list if found
    const nextDirectory = masterDirectory.map(ent => {
      if (ent.name === targetEntityName) {
        return {
          ...ent,
          docsCount: (ent.docsCount || 0) + 1,
          attachedDocs: [
            ...(ent.attachedDocs || []),
            {
              name: newDoc.title,
              size: newDoc.size,
              category: newDoc.category,
              expiry: newDoc.expiryDate
            }
          ]
        };
      }
      return ent;
    });

    const nextData = {
      ...data,
      masterDirectory: nextDirectory,
      vault: nextVault
    };
    setData(nextData);
    saveFinanceData(nextData);
    addToast(`Document "${newDoc.title}" encrypted and committed to Vault!`, 'success');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterRegion('');
    setFilterTerms('');
    setFilterCurrency('');
    setOnlyVerified(false);
    setOnlyExpiring(false);
  };

  const exportRegistry = () => {
    try {
      const mapEntityToRow = (ent) => ({
        'Entity ID': ent.id || '',
        'Company / Legal Name': ent.name || '',
        'Category': ent.category || '',
        'Department': ent.department || '',
        'Country / Region': ent.country || '',
        'Corporate Email': ent.companyMail || '',
        'Contact Person': ent.contactPerson || ent.contact || '',
        'Contact Email': ent.contactEmail || '',
        'Contact Phone': ent.contactPhone || '',
        'Tax / CR / TRN ID': ent.taxId || '',
        'Tax Description': ent.taxDescription || '',
        'Settlement Currency': ent.currency || '',
        'Payment Terms': ent.creditTerms || '',
        'Credit Limit': ent.creditLimit || '',
        'Compliance Standing': ent.compliance || 'Active Verified',
        'Active PO Volume': ent.activePoVolume || '0',
        'Active PO Count': ent.activePoCount ?? 0,
        'Lifetime Billed': ent.lifetimeBilled || '',
        'Bank Name': ent.bankDetails?.bankName || '',
        'Account / IBAN': ent.bankDetails?.accountNumber || ent.bankDetails?.swiftIban || '',
        'SWIFT Code': ent.bankDetails?.swiftIban || '',
        'Routing Code': ent.bankDetails?.routing || '',
        'Attached Docs Count': ent.docsCount ?? (ent.attachedDocs?.length || 0),
      });

      const mapDocToRow = (doc) => ({
        'Document ID': doc.id || '',
        'Document Title': doc.title || '',
        'Associated Entity': doc.entityName || '',
        'Category': doc.category || '',
        'File Size': doc.size || '',
        'File Type': doc.fileType || 'PDF',
        'Execution / Issue Date': doc.updatedDate || '',
        'Validity / Expiry': doc.expiryDate || 'Active',
        'Cryptographic Hash': doc.hash || '',
      });

      const setColWidths = (ws, rows) => {
        if (!rows || rows.length === 0) return;
        const colKeys = Object.keys(rows[0]);
        ws['!cols'] = colKeys.map(key => {
          let maxLen = key.length;
          for (const r of rows) {
            const val = r[key];
            if (val !== null && val !== undefined) {
              maxLen = Math.max(maxLen, String(val).length);
            }
          }
          return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
        });
      };

      const allRows = masterDirectory.map(mapEntityToRow);
      const clientRows = masterDirectory.filter(e => e.category === 'Client').map(mapEntityToRow);
      const supplierRows = masterDirectory.filter(e => e.category === 'Supplier').map(mapEntityToRow);
      const vaultRows = vaultDocs.map(mapDocToRow);

      const workbook = XLSX.utils.book_new();

      const wsAll = XLSX.utils.json_to_sheet(allRows);
      setColWidths(wsAll, allRows);
      XLSX.utils.book_append_sheet(workbook, wsAll, 'Master Directory');

      const wsClients = XLSX.utils.json_to_sheet(clientRows);
      setColWidths(wsClients, clientRows);
      XLSX.utils.book_append_sheet(workbook, wsClients, 'Clients');

      const wsSuppliers = XLSX.utils.json_to_sheet(supplierRows);
      setColWidths(wsSuppliers, supplierRows);
      XLSX.utils.book_append_sheet(workbook, wsSuppliers, 'Suppliers');

      if (vaultRows.length > 0) {
        const wsVault = XLSX.utils.json_to_sheet(vaultRows);
        setColWidths(wsVault, vaultRows);
        XLSX.utils.book_append_sheet(workbook, wsVault, 'Document Vault');
      }

      if (allMasterPos.length > 0) {
        const poRows = allMasterPos.map(po => ({
          'PO Number': po.poNumber,
          'Classification': po.typeLabel,
          'Counterparty': po.counterparty,
          'Scope / Project': po.scopeOrProject,
          'Currency': po.currency,
          'Contract Value (Native)': po.valueNative,
          'Contract Value (USD)': po.valueUsd,
          'Billed / Drawdown %': `${po.billedPercent}%`,
          'Status': po.status,
          'Payment Terms': po.terms,
          'Issue Date': po.date,
        }));
        const wsPos = XLSX.utils.json_to_sheet(poRows);
        setColWidths(wsPos, poRows);
        XLSX.utils.book_append_sheet(workbook, wsPos, 'Purchase Orders Master');
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Volvitech_Master_Registry_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, filename);
      addToast(`Registry exported as Excel (${filename})`, 'success');
    } catch (err) {
      console.error('Error exporting registry to Excel:', err);
      addToast('Failed to export Excel file. Please try again.', 'error');
    }
  };

  // Lookup company for dedicated dossier page
  const companyForDossier = useMemo(() => {
    if (!viewingCompanyId) return null;
    return masterDirectory.find(
      e => e.id === viewingCompanyId || e.name.toLowerCase() === viewingCompanyId.toLowerCase()
    ) || null;
  }, [masterDirectory, viewingCompanyId]);

  const handleOpenCompanyDossier = (entId) => {
    setViewingCompanyId(entId);
    navigate(`/master-data/${entId}`);
  };

  const handleCloseCompanyDossier = () => {
    setViewingCompanyId(null);
    navigate(activeSegment === 'SUPPLIERS' ? '/master-data?tab=suppliers' : '/master-data');
  };

  const handleUpdateCompany = (updatedCompany) => {
    const nextDirectory = masterDirectory.map(e => e.id === updatedCompany.id ? updatedCompany : e);
    const nextData = {
      ...data,
      masterDirectory: nextDirectory
    };
    setData(nextData);
    saveFinanceData(nextData);
  };

  const handleDeleteCompany = (entityId, entityName) => {
    if (!isAdmin) {
      addToast('Unauthorized: Only administrators have permission to delete master entities.', 'error');
      return;
    }
    const targetEntity = masterDirectory.find(e => e.id === entityId);
    const targetName = entityName || targetEntity?.name || 'Entity';

    const nextDirectory = masterDirectory.filter(e => e.id !== entityId);
    const nextVault = vaultDocs.filter(d => (d.entityName || '').toLowerCase() !== targetName.toLowerCase());

    const nextData = {
      ...data,
      masterDirectory: nextDirectory,
      vault: nextVault
    };
    setData(nextData);
    saveFinanceData(nextData);

    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
    }
    if (viewingCompanyId === entityId) {
      setViewingCompanyId(null);
      navigate(activeSegment === 'SUPPLIERS' ? '/master-data?tab=suppliers' : '/master-data');
    }

    addToast(`"${targetName}" has been permanently removed from Master Directory.`, 'info');
  };

  // Handler for Administrative Permanent PO Deletion
  const handleDeletePo = (po) => {
    if (!isAdmin) {
      addToast('Unauthorized: Only administrators have permission to delete Purchase Orders.', 'error');
      return;
    }
    try {
      const nextData = { ...data };
      if (po.type === 'client') {
        nextData.clientPos = (nextData.clientPos || []).filter(
          p => p.id !== po.id && p.poNumber !== po.poNumber
        );
        if (nextData.kpis) {
          nextData.kpis = {
            ...nextData.kpis,
            clientPoTotal: Math.max(0, (nextData.kpis.clientPoTotal || 0) - (po.totalValueUsd || 0)),
          };
        }
      } else {
        nextData.supplierPos = (nextData.supplierPos || []).filter(
          p => p.id !== po.id && p.poNumber !== po.poNumber
        );
        if (nextData.kpis) {
          nextData.kpis = {
            ...nextData.kpis,
            supplierPoCommitted: Math.max(0, (nextData.kpis.supplierPoCommitted || 0) - (po.committedUsd || 0)),
          };
        }
      }
      setData(nextData);
      saveFinanceData(nextData);
      addToast(`Purchase Order "${po.poNumber}" (${po.counterparty}) permanently deleted from master registry.`, 'success');
      setPoToDelete(null);
    } catch (err) {
      console.error('Error deleting Purchase Order:', err);
      addToast('Failed to delete Purchase Order. Please try again.', 'error');
    }
  };

  // Render dedicated Company Dossier page if a company is selected for dossier view
  if (companyForDossier) {
    return (
      <CompanyDossier
        company={companyForDossier}
        onUpdateCompany={handleUpdateCompany}
        onDeleteCompany={handleDeleteCompany}
        onBack={handleCloseCompanyDossier}
        addToast={addToast}
        allVaultDocs={vaultDocs}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Governance & Master Data</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-blue-600 font-bold">Client & Supplier Directory</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display tracking-tight">
              Master Data Directory & Document Vault
            </h1>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Authoritative Registry
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Centralized master governance for Client & Supplier records, credit limits, settlement defaults, bank mandates, and regulatory compliance dossiers.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportRegistry}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Download Excel spreadsheet master data export (.xlsx)"
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
            <span>Export Registry</span>
          </button>

          <button
            onClick={() => setUploadVaultOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">cloud_upload</span>
            <span>Upload to Vault</span>
          </button>

          <button
            onClick={handleOpenAddSupplier}
            className={`px-3.5 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
              activeSegment === 'SUPPLIERS'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                : 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain_add</span>
            <span>+ Add Supplier</span>
          </button>

          <button
            onClick={handleOpenAddClient}
            className={`px-4 py-2 text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95 ${
              activeSegment === 'SUPPLIERS'
                ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-semibold'
                : 'bg-blue-600 hover:bg-blue-700 text-white font-bold'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Add Client</span>
          </button>
        </div>
      </div>

      {/* Top Summary KPI Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Active Entities */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Active Entities</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">{masterDirectory.length}</span>
            <span className="text-xs text-gray-500 font-medium">Entities in Master</span>
          </div>
          <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
            <button
              type="button"
              onClick={() => handleSelectSegment('CLIENTS')}
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
              title="Filter Clients"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span><strong>{clientCount}</strong> Clients</span>
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={() => handleSelectSegment('SUPPLIERS')}
              className="flex items-center gap-1.5 hover:text-emerald-600 transition"
              title="Filter Suppliers"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span><strong>{supplierCount}</strong> Suppliers</span>
            </button>
          </div>
        </div>

        {/* KPI 2: KYC & Compliance Standing */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">KYC & Compliance Standing</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-display tracking-tight">
              {kycComplianceStats.rate}%
            </span>
            <span className={`px-2 py-0.5 rounded-full ${kycComplianceStats.gradeColor} text-[10px] font-bold uppercase tracking-wider`}>
              {kycComplianceStats.grade}
            </span>
          </div>
          <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
            <span className="text-emerald-700 font-semibold">{kycComplianceStats.verifiedCount} Fully Verified</span>
            <span className="text-gray-300">•</span>
            {kycComplianceStats.renewalCount > 0 ? (
              <span className="text-amber-600 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>{kycComplianceStats.renewalCount} Renewal Req.</span>
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>0 Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Contract Vault Volume */}
        <div
          onClick={() => handleSelectSegment('VAULT')}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md cursor-pointer group"
          title="Click to view Document Vault"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600 transition">Contract Vault Volume</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">lock</span>
            </div>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">{vaultVolumeStats.totalFiles}</span>
            <span className="text-xs text-gray-500 font-medium">Encrypted Files</span>
          </div>
          <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-medium text-gray-600">
            <span>{vaultVolumeStats.centralVaultCount} in Vault</span>
            <span className="text-gray-300">•</span>
            <span className="text-indigo-600 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">shield</span>
              <span>{vaultVolumeStats.directAttachedCount} Attached</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Multi-Currency Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Settlement Currencies</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">currency_exchange</span>
            </div>
          </div>
          <div className="my-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900 font-display tracking-tight">
                  {currencyStats.uniqueCount}
                </span>
                <span className="text-xs text-gray-500 font-medium">Currencies Active</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Multi-FX
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-100 flex overflow-hidden">
              {currencyStats.list.map(c => (
                <div
                  key={c.currency}
                  className={`${c.colors.bg} h-full transition-all`}
                  style={{ width: `${c.percent}%` }}
                  title={`${c.currency}: ${c.percent}% (${c.count} entities)`}
                />
              ))}
            </div>
          </div>
          <div className="bg-gray-50/90 border border-gray-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-gray-600 overflow-x-auto gap-1">
            {currencyStats.list.slice(0, 4).map(c => (
              <span key={c.currency} className="flex items-center gap-1 whitespace-nowrap">
                <span className={`w-1.5 h-1.5 rounded-full ${c.colors.dot}`}></span>
                <span className={c.colors.text}>{c.currency}</span> {c.percent}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Directory Table + 360 Entity Inspector Side Panel */}
      {activeSegment !== 'VAULT' && activeSegment !== 'POS' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left / Center: Interactive Master Table (8 Columns on xl) */}
          <div className="xl:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Segment Switcher Tabs: Clients, Suppliers, Document Vault, PO Master List */}
              <div className="inline-flex p-1 bg-gray-200/80 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectSegment('CLIENTS')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    activeSegment === 'CLIENTS'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Clients</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSegment === 'CLIENTS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {clientCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSegment('SUPPLIERS')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    activeSegment === 'SUPPLIERS'
                      ? 'bg-white text-emerald-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>Suppliers</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSegment === 'SUPPLIERS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {supplierCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSegment('VAULT')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    activeSegment === 'VAULT'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                  <span>Document Vault</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSegment === 'VAULT'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {vaultDocs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSegment('POS')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    activeSegment === 'POS'
                      ? 'bg-white text-purple-600 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>PO Master List</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeSegment === 'POS'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    {totalPoCount}
                  </span>
                </button>
              </div>

              {/* Search Box on Table Header */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder={`Search ${activeSegment === 'SUPPLIERS' ? 'suppliers' : 'clients'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Legal Entity / Company Name</th>
                    <th className="py-3 px-4">Country & Sovereign Jurisdiction</th>
                    <th className="py-3 px-4">Designated Key Stakeholders</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredEntities.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">folder_off</span>
                        <p className="text-sm font-semibold text-gray-700">No {activeSegment === 'SUPPLIERS' ? 'suppliers' : 'clients'} found</p>
                        <p className="text-xs text-gray-400 mt-1">Try clearing filters or register a new {activeSegment === 'SUPPLIERS' ? 'supplier' : 'client'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEntities.map((ent) => {
                      const isSelected = selectedEntityId === ent.id;
                      const primaryStakeholder = Array.isArray(ent.stakeholders) && ent.stakeholders.length > 0 ? ent.stakeholders[0] : null;
                      const contactName = ent.contactPerson || primaryStakeholder?.name || 'Lead Contact';
                      const contactRole = primaryStakeholder?.role || 'Primary Contact';
                      const contactPhone = ent.contactPhone || primaryStakeholder?.phone || '';
                      const contactEmail = ent.contactEmail || primaryStakeholder?.email || '';

                      return (
                        <tr
                          key={ent.id}
                          onClick={() => setSelectedEntityId(ent.id)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-50/60 ring-1 ring-blue-500/20'
                              : 'hover:bg-gray-50/80'
                          }`}
                        >
                          {/* 1. Legal Entity / Company Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                ent.category === 'Client'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {ent.avatarText || 'EN'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                                  <span>{ent.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                  <span className="font-mono text-gray-500 font-semibold">{ent.id}</span>
                                  <span>•</span>
                                  <span className={ent.category === 'Client' ? 'text-blue-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                                    {ent.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Country & Sovereign Jurisdiction */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{ent.country}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-gray-400">
                                {ent.classification === 'Domestic' ? 'home' : 'public'}
                              </span>
                              <span>{ent.classification || 'International'} Jurisdiction</span>
                            </div>
                          </td>



                          {/* 5. Designated Key Stakeholders */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{contactName}</span>
                              {Array.isArray(ent.stakeholders) && ent.stakeholders.length > 1 && (
                                <span
                                  className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full border border-blue-200"
                                  title={`${ent.stakeholders.length} Stakeholders registered`}
                                >
                                  +{ent.stakeholders.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                              <span className="text-gray-600 font-medium">{contactRole}</span>
                              {contactPhone && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-gray-400">{contactPhone}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 6. Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEntityToDelete(ent);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title={`Admin only: Delete ${ent.name} from Master Directory`}
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCompanyDossier(ent.id);
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                title={`Open ${ent.name} Docs & Text Info`}
                              >
                                <span className="material-symbols-outlined text-[18px]">folder</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCompanyDossier(ent.id);
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                                title={`Inspect ${ent.name} Full Dossier`}
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredEntities.length} of {activeSegment === 'SUPPLIERS' ? supplierCount : clientCount} {activeSegment === 'SUPPLIERS' ? 'suppliers' : 'clients'}</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold">1</span>
              </div>
            </div>
          </div>

          {/* Right: 360 Entity Quick-Inspector Side Panel (4 Columns on xl) */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
            {selectedEntity ? (
              <>
                {/* Header Banner */}
                <div className="p-5 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border-b border-gray-100 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
                        selectedEntity.category === 'Client' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {selectedEntity.avatarText || 'EN'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-gray-900 text-sm">{selectedEntity.name}</h3>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-gray-700 font-semibold">{selectedEntity.id}</span>
                          <span>•</span>
                          <span className={selectedEntity.category === 'Client' ? 'text-blue-700 font-bold' : 'text-emerald-700 font-bold'}>
                            {selectedEntity.category} ({selectedEntity.classification || 'Direct'})
                          </span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{selectedEntity.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Quick Micro-KPIs */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Lifetime Billed</div>
                      <div className="text-sm font-extrabold text-gray-900 mt-0.5">{selectedEntity.lifetimeBilled || '$1.2M'}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">100% Reconciled</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Credit Cap</div>
                      <div className="text-sm font-extrabold text-blue-600 mt-0.5">{selectedEntity.creditLimit || '$250k'}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Terms: {selectedEntity.creditTerms}</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-gray-100">
                      <div className="text-[10px] uppercase font-bold text-gray-400">Avg Settlement</div>
                      <div className="text-sm font-extrabold text-emerald-600 mt-0.5">{selectedEntity.avgDso || '32 Days'}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Within terms</div>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs inside Inspector */}
                <div className="flex items-center px-4 bg-gray-50 border-b border-gray-100 text-xs font-bold">
                  <button
                    onClick={() => setInspectorTab('OVERVIEW')}
                    className={`py-2.5 px-3 border-b-2 transition ${
                      inspectorTab === 'OVERVIEW'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Overview & Banking
                  </button>
                  <button
                    onClick={() => setInspectorTab('VAULT')}
                    className={`py-2.5 px-3 border-b-2 transition flex items-center gap-1 ${
                      inspectorTab === 'VAULT'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>Attached Docs ({selectedEntity.attachedDocs?.length || selectedEntity.docsCount || 0})</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[500px]">
                  {inspectorTab === 'OVERVIEW' && (
                    <>
                      {/* Tax & Credentials */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Tax & Regulatory Credentials</span>
                          {selectedEntity.amlScreened && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">verified</span>
                              <span>AML Cleared</span>
                            </span>
                          )}
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Tax ID / Sovereign ID:</span>
                            <span className="font-mono font-bold text-gray-900 flex items-center gap-1">
                              {selectedEntity.taxId}
                              <span className="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span>
                            </span>
                          </div>
                          {selectedEntity.globalEntityId && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px] text-indigo-600">corporate_fare</span>
                                <span>Global Entity ID:</span>
                              </span>
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 text-[11px]">
                                {selectedEntity.globalEntityId}
                              </span>
                            </div>
                          )}
                          {selectedEntity.taxAuthority && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Issuing Authority:</span>
                              <span className="font-semibold text-gray-800 text-[11px] truncate max-w-[170px]" title={selectedEntity.taxAuthority}>
                                {selectedEntity.taxAuthority}
                              </span>
                            </div>
                          )}
                          {selectedEntity.registrationNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Reg / CR / CIN:</span>
                              <span className="font-mono font-semibold text-gray-800">{selectedEntity.registrationNumber}</span>
                            </div>
                          )}
                          {selectedEntity.kycStatus && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">KYC Standing:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                selectedEntity.kycStatus.toLowerCase().includes('verified')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : selectedEntity.kycStatus.toLowerCase().includes('pending')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {selectedEntity.kycStatus}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Regulatory Status:</span>
                            <span className="font-medium text-gray-800">{selectedEntity.taxDescription || 'Active Verified'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Base Currency:</span>
                            <span className="font-bold text-blue-600 font-mono">{selectedEntity.currency}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Credit Terms:</span>
                            <span className="font-medium text-gray-800">{selectedEntity.creditTerms}</span>
                          </div>
                        </div>
                      </div>

                      {/* Banking & Remittance Details */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Banking & Wire Remittance Details
                        </div>
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Bank Name:</span>
                            <span className="font-semibold text-gray-900">{selectedEntity.bankDetails?.bankName || 'JPMorgan Chase'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Account / IBAN:</span>
                            <span className="font-mono text-gray-800 font-semibold">{selectedEntity.bankDetails?.accountNumber || '0091829011'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">SWIFT / BIC:</span>
                            <span className="font-mono text-gray-800 font-bold uppercase">{selectedEntity.bankDetails?.swiftIban || 'CHASUS33XXX'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Routing / IFSC:</span>
                            <span className="font-mono text-gray-800">{selectedEntity.bankDetails?.routing || '021000021'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Designated Stakeholders */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Designated Key Stakeholders ({Array.isArray(selectedEntity.stakeholders) && selectedEntity.stakeholders.length > 0 ? selectedEntity.stakeholders.length : 1})
                          </div>
                        </div>

                        {Array.isArray(selectedEntity.stakeholders) && selectedEntity.stakeholders.length > 0 ? (
                          <div className="space-y-2">
                            {selectedEntity.stakeholders.map((s, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-900">{s.name || 'Contact Person'}</span>
                                    {idx === 0 && (
                                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                        Primary
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                    {s.role || (idx === 0 ? 'Lead Contact' : 'Commercial POC')}
                                  </span>
                                </div>
                                {s.email && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-500">Email:</span>
                                    <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline">
                                      {s.email}
                                    </a>
                                  </div>
                                )}
                                {s.phone && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-500">Phone:</span>
                                    <span className="text-gray-700">{s.phone}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Lead Contact:</span>
                              <span className="font-semibold text-gray-900">{selectedEntity.contactPerson || 'Marcus Vance'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Email:</span>
                              <a href={`mailto:${selectedEntity.contactEmail || 'contact@entity.com'}`} className="text-blue-600 hover:underline">
                                {selectedEntity.contactEmail || selectedEntity.contact}
                              </a>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-700">{selectedEntity.contactPhone || '+1 555-0100'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {inspectorTab === 'VAULT' && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-700">Dossier Documents in Vault</span>
                        <button
                          type="button"
                          onClick={() => setUploadVaultOpen(true)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          + Upload File
                        </button>
                      </div>

                      {(selectedEntity.attachedDocs || []).length > 0 ? (
                        <div className="space-y-2">
                          {selectedEntity.attachedDocs.map((doc, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[20px] text-red-500">picture_as_pdf</span>
                                <div>
                                  <div className="font-bold text-gray-900 text-xs">{doc.name}</div>
                                  <div className="text-[10px] text-gray-400">{doc.category} · {doc.size} · Valid till {doc.expiry}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addToast(`Opening preview for ${doc.name}`, 'info')}
                                className="p-1 rounded-md text-gray-400 hover:text-blue-600"
                              >
                                <span className="material-symbols-outlined text-[16px]">download</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                          No direct documents attached. Use "Upload File" to attach licenses or MSAs.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCompanyDossier(selectedEntity.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center justify-center gap-1.5 shadow-xs transition text-xs"
                    title={`Open full dedicated dossier for ${selectedEntity.name}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">folder_shared</span>
                    <span>Company Dossier & Docs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadVaultOpen(true)}
                    className="py-2 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Attach</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setEntityToDelete(selectedEntity)}
                      className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 font-bold text-rose-700 flex items-center justify-center gap-1 transition text-xs active:scale-95"
                      title="Admin only: Delete Entity"
                    >
                      <span className="material-symbols-outlined text-[16px] text-rose-600">delete_forever</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-400">
                Select an entity from the ledger to view 360 master details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrated Enterprise Document Vault & Compliance Dossier - Only displayed when Document Vault segment is selected */}
      {activeSegment === 'VAULT' && (
        <div id="vault-section" className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5 animate-fade-in">
          {/* Navigation Tabs Header when viewing Vault */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="inline-flex p-1 bg-gray-200/80 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => handleSelectSegment('CLIENTS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Clients</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {clientCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('SUPPLIERS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                <span>Suppliers</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {supplierCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('VAULT')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-white text-indigo-600 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                <span>Document Vault</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {vaultDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('POS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>PO Master List</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {totalPoCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium pr-1">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>Encrypted AES-256 Document Repository</span>
            </div>
          </div>

          {/* Header & Cryptographic Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <span className="material-symbols-outlined text-[22px]">folder_special</span>
                </span>
                <h2 className="text-lg font-bold text-gray-900 font-display">
                  Entity Document Vault & Regulatory Dossier
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cryptographically authenticated, zero-alteration document store with automated expiration alerts for trade licenses, MSAs, and VAT registrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">lock</span>
                <span>AES-256 Storage Encrypted</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                <span className="material-symbols-outlined text-[14px] text-blue-600">fingerprint</span>
                <span>Immutable SHA-256 Checksums</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                <span className="material-symbols-outlined text-[14px]">fact_check</span>
                <span>100% Tax / Audit Ready</span>
              </span>
            </div>
          </div>

          {/* Drag & Drop Upload Simulation Zone */}
          <div
            onClick={() => setUploadVaultOpen(true)}
            className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 text-center hover:bg-blue-50/30 hover:border-blue-300 transition cursor-pointer group"
          >
            <div className="max-w-md mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <span className="material-symbols-outlined text-[26px]">cloud_upload</span>
              </div>
              <h4 className="mt-2.5 font-bold text-gray-900 text-sm">
                Drop Master Agreements, Trade Licenses, or VAT Certificates Here
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Supports multi-page PDF, signed TIFF, and audit images up to 50MB per entity. Automatic SHA-256 integrity sealing.
              </p>
              <button
                type="button"
                className="mt-3 px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-blue-600 font-bold text-xs shadow-xs hover:bg-gray-50 transition"
              >
                Browse Computer Files
              </button>
            </div>
          </div>

          {/* Category Filter Tabs for Vault */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {[
                { id: 'ALL', label: `All Docs (${vaultDocs.length})` },
                { id: 'MSA', label: 'Master Service Agreements (MSA)' },
                { id: 'License', label: 'Trade Licenses & CR' },
                { id: 'Tax', label: 'Tax Exemption & VAT' },
                { id: 'Banking', label: 'Bank Verification & Mandates' },
                { id: 'NDA', label: 'NDAs & Audits' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setVaultCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    vaultCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {vaultEntityFilter && (
              <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                <span>Filtered by: <strong className="text-blue-600">{vaultEntityFilter}</strong></span>
                <button
                  type="button"
                  onClick={() => setVaultEntityFilter('')}
                  className="text-gray-400 hover:text-red-500 ml-1 underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Vault Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVaultDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 hover:bg-white hover:shadow-md transition flex flex-col justify-between text-xs min-w-0 overflow-hidden"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2.5 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[22px]">description</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 leading-snug line-clamp-2 break-words text-xs" title={doc.title}>
                          {doc.title}
                        </h4>
                        <div className="text-[11px] text-gray-400 mt-1 truncate">
                          {doc.entityName ? (
                            <>
                              <span className="text-blue-700 font-semibold">{doc.entityName}</span>
                              <span className="mx-1">·</span>
                            </>
                          ) : null}
                          <span>{doc.size || 'PDF'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0 tracking-wide">
                      AUTHENTICATED
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-1.5 pt-2 border-t border-gray-200/60">
                    <div className="flex items-center justify-between gap-2 text-gray-500">
                      <span className="shrink-0">Category:</span>
                      <span className="font-semibold text-gray-800 truncate text-right">{doc.category || 'General'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-gray-500">
                      <span className="shrink-0">Execution / Issue:</span>
                      <span className="font-mono text-gray-800 shrink-0">{doc.updatedDate || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-gray-500">
                      <span className="shrink-0">Validity Expiry:</span>
                      <span className="font-mono text-emerald-700 font-semibold shrink-0">{doc.expiryDate || 'Active'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-gray-500">
                      <span className="shrink-0">Verification Hash:</span>
                      <span 
                        className="font-mono text-[10px] text-gray-400 truncate max-w-[140px] text-right" 
                        title={doc.hash || 'sha256:verified_secure'}
                      >
                        {doc.hash || 'sha256:verified_secure'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-200/60">
                  <span className="text-[10px] text-gray-400 truncate mr-2">Verified by <strong>Controller</strong></span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => addToast(`Opening preview for ${doc.title}`, 'info')}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition"
                      title="Preview"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addToast(`Downloading official PDF for ${doc.title}`, 'success')}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                      title="Download PDF"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enterprise Purchase Order (PO) Master Registry - Only displayed when PO Master List segment is selected */}
      {activeSegment === 'POS' && (
        <div id="po-master-section" className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6 animate-fade-in text-left">
          {/* Navigation Tabs Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="inline-flex p-1 bg-gray-200/80 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => handleSelectSegment('CLIENTS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Clients</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {clientCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('SUPPLIERS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                <span>Suppliers</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {supplierCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('VAULT')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
              >
                <span className="material-symbols-outlined text-[16px]">folder_zip</span>
                <span>Document Vault</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-700">
                  {vaultDocs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegment('POS')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-white text-purple-600 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>PO Master List</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  {totalPoCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/finance/client"
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                <span>Register Client PO</span>
              </Link>
              <Link
                to="/finance/supplier"
                className="px-3.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/70 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                <span>Issue Supplier PO</span>
              </Link>
            </div>
          </div>

          {/* Section Title & Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 font-display">
                    Purchase Order (PO) Master Registry
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Centralized master ledger of all Client Purchase Orders (AR revenue contracts) and Supplier Purchase Orders (AP vendor commitments). Inspect details and manage PO lifecycle with administrative delete privileges.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Ledger Synchronized</span>
              </span>
              <button
                type="button"
                onClick={exportRegistry}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition shadow-2xs flex items-center gap-1.5"
                title="Download complete registry export (.xlsx)"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
                <span>Export POs</span>
              </button>
            </div>
          </div>

          {/* Mini PO Summary Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Total PO Contracts</span>
                <span className="material-symbols-outlined text-[18px] text-gray-400">inventory_2</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 font-display tracking-tight">
                {poMetrics.totalCount}
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-2 font-medium">
                <span className="text-blue-600 font-bold">{poMetrics.clientCount} Client (AR)</span>
                <span>•</span>
                <span className="text-purple-600 font-bold">{poMetrics.supplierCount} Supplier (AP)</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
                <span>Client PO Value (AR)</span>
                <span className="material-symbols-outlined text-[18px] text-blue-500">arrow_downward</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-900 font-display tracking-tight">
                ${poMetrics.clientValUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-blue-600 font-medium">
                Revenue bookings across {poMetrics.clientCount} clients
              </div>
            </div>

            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-purple-700 font-semibold">
                <span>Supplier PO Value (AP)</span>
                <span className="material-symbols-outlined text-[18px] text-purple-500">arrow_upward</span>
              </div>
              <div className="text-2xl font-extrabold text-purple-900 font-display tracking-tight">
                ${poMetrics.supplierValUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-purple-600 font-medium">
                Procurement commitments across {poMetrics.supplierCount} vendors
              </div>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>Net PO Spread</span>
                <span className="material-symbols-outlined text-[18px] text-emerald-500">account_balance</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 font-display tracking-tight">
                ${poMetrics.netSpread.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                {poMetrics.clientValUsd > 0 ? `${((poMetrics.netSpread / poMetrics.clientValUsd) * 100).toFixed(1)}% Gross contract margin` : 'Balanced backlog'}
              </div>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
            {/* Sub-type Filter Pills */}
            <div className="inline-flex p-1 bg-white rounded-xl shadow-2xs border border-gray-100 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPoFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  poFilterType === 'ALL'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                All POs ({allMasterPos.length})
              </button>
              <button
                type="button"
                onClick={() => setPoFilterType('CLIENT')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  poFilterType === 'CLIENT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                <span>Client POs ({poMetrics.clientCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPoFilterType('SUPPLIER')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  poFilterType === 'SUPPLIER'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                <span>Supplier POs ({poMetrics.supplierCount})</span>
              </button>
            </div>

            {/* Search and Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search PO#, company, project..."
                  value={poSearchTerm}
                  onChange={(e) => setPoSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 w-48 sm:w-64"
                />
                {poSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setPoSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-gray-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="Partially Invoiced">Partially Invoiced</option>
                <option value="Fully Invoiced">Fully Invoiced</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Open">Open</option>
                <option value="Active Drawdown">Active Drawdown</option>
                <option value="Bill Overdue">Bill Overdue</option>
              </select>

              {/* Currency Filter */}
              <select
                value={poCurrencyFilter}
                onChange={(e) => setPoCurrencyFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-gray-700 font-medium"
              >
                <option value="ALL">All FX</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="SAR">SAR</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Master PO Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">PO Number & Date</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Counterparty</th>
                  <th className="py-3 px-3">Scope / Project</th>
                  <th className="py-3 px-3 text-right">Contract Value</th>
                  <th className="py-3 px-3">Drawdown / Billed</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Terms</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredMasterPos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No Purchase Orders Found</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                          {poSearchTerm || poFilterType !== 'ALL' || poStatusFilter !== 'ALL' || poCurrencyFilter !== 'ALL'
                            ? 'No PO contracts match your active filter criteria. Try resetting filters.'
                            : 'No Purchase Orders are currently registered in the system.'}
                        </p>
                        {(poSearchTerm || poFilterType !== 'ALL' || poStatusFilter !== 'ALL' || poCurrencyFilter !== 'ALL') && (
                          <button
                            type="button"
                            onClick={() => {
                              setPoFilterType('ALL');
                              setPoSearchTerm('');
                              setPoStatusFilter('ALL');
                              setPoCurrencyFilter('ALL');
                            }}
                            className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMasterPos.map((po) => {
                    const isClient = po.type === 'client';
                    return (
                      <tr
                        key={po.uniqueKey}
                        className="hover:bg-purple-50/20 transition-colors group"
                      >
                        {/* PO Number & Date */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 font-mono text-[11px] group-hover:text-purple-700 transition">
                            {po.poNumber}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            <span>{po.date}</span>
                          </div>
                        </td>

                        {/* Classification */}
                        <td className="py-3.5 px-3">
                          {isClient ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                              <span>Client PO (AR)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                              <span>Supplier PO (AP)</span>
                            </span>
                          )}
                        </td>

                        {/* Counterparty */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <span>{po.flag}</span>
                            <span>{po.counterparty}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {isClient ? (po.country || 'International') : (po.origin || 'Vendor')}
                          </div>
                        </td>

                        {/* Scope / Project */}
                        <td className="py-3.5 px-3 max-w-[220px]">
                          <div className="text-gray-700 font-medium truncate" title={po.scopeOrProject}>
                            {po.scopeOrProject}
                          </div>
                          {po.linkedClientPo && (
                            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                              Ref: {po.linkedClientPo}
                            </div>
                          )}
                        </td>

                        {/* Contract Value */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-bold text-gray-900">
                            {po.currency} {Number(po.valueNative || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            ≈ ${Number(po.valueUsd || 0).toLocaleString()}
                          </div>
                        </td>

                        {/* Drawdown / Billed */}
                        <td className="py-3.5 px-3 min-w-[130px]">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-600 mb-1">
                            <span>{po.billedPercent}%</span>
                            <span className="text-gray-400">
                              {po.currency} {Number(po.billedNative || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                po.billedPercent >= 100
                                  ? 'bg-emerald-500'
                                  : isClient
                                  ? 'bg-blue-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, po.billedPercent))}%` }}
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              po.status === 'Fully Invoiced' || po.status === 'Fulfilled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.status === 'Partially Invoiced' || po.status === 'Active Drawdown'
                                ? 'bg-blue-100 text-blue-800'
                                : po.status === 'Bill Overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>

                        {/* Terms */}
                        <td className="py-3.5 px-3">
                          <span className="text-gray-600 font-medium text-[11px] bg-gray-100/80 px-2 py-0.5 rounded-md">
                            {po.terms}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View in dedicated finance page */}
                            <Link
                              to={po.financeLink}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title={`View in Finance (${isClient ? 'Client Side' : 'Supplier Side'})`}
                            >
                              <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                            </Link>

                            {/* Delete PO Button */}
                            <button
                              type="button"
                              onClick={() => setPoToDelete(po)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition active:scale-95"
                              title={`Delete Purchase Order ${po.poNumber}`}
                              aria-label={`Delete Purchase Order ${po.poNumber}`}
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>
              Showing <strong>{filteredMasterPos.length}</strong> of <strong>{allMasterPos.length}</strong> Purchase Orders in Master Registry
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{poMetrics.clientCount} AR Contracts</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{poMetrics.supplierCount} AP Contracts</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEntityModal
        isOpen={addEntityOpen}
        onClose={() => setAddEntityOpen(false)}
        onSave={handleSaveEntity}
        defaultCategory={addEntityCategory}
      />

      <UploadVaultModal
        isOpen={uploadVaultOpen}
        onClose={() => setUploadVaultOpen(false)}
        onUpload={handleUploadVaultDoc}
        entities={masterDirectory}
      />

      {/* CONFIRM DELETE ENTITY MODAL (ADMIN ONLY) */}
      {entityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-slide-up">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Delete {entityToDelete.category || 'Entity'} from Master Directory?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-gray-900">{entityToDelete.name}</strong> ({entityToDelete.id})? All associated dossier documents, notes, regulatory credentials, and records will be purged.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[16px] shrink-0 mt-0.5">admin_panel_settings</span>
                <span>
                  <strong>Administrator Action:</strong> This action cannot be undone. Only users with the Admin role can delete entities from the Master Directory.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEntityToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteCompany(entityToDelete.id, entityToDelete.name);
                    setEntityToDelete(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                  <span>Permanently Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PURCHASE ORDER MODAL (ADMIN ONLY) */}
      {poToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-rose-100 animate-slide-up">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Delete Purchase Order {poToDelete.poNumber}?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to permanently delete Purchase Order <strong className="text-gray-900">{poToDelete.poNumber}</strong> for <strong className="text-gray-900">{poToDelete.counterparty}</strong>?
                </p>
              </div>

              {/* PO Details Summary Card */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Classification:</span>
                  <span className="font-semibold text-gray-900">{poToDelete.typeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Counterparty:</span>
                  <span className="font-semibold text-gray-900">{poToDelete.counterparty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Scope / Project:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[200px]">{poToDelete.scopeOrProject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contract Value:</span>
                  <span className="font-bold text-gray-900">{poToDelete.currency} {Number(poToDelete.valueNative || 0).toLocaleString()} (~${Number(poToDelete.valueUsd || 0).toLocaleString()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drawdown / Billed:</span>
                  <span className="font-semibold text-gray-900">{poToDelete.billedPercent}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[16px] shrink-0 mt-0.5">admin_panel_settings</span>
                <span>
                  <strong>Administrator Action:</strong> This action cannot be undone. Only users with the Admin role can permanently delete Purchase Orders from the Master Registry.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPoToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePo(poToDelete)}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                  <span>Permanently Delete PO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterData;
