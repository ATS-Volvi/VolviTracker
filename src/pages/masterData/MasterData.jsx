import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { fetchFinanceData, loadFinanceData, saveFinanceData, subscribeFinanceData } from '../finance/financeData';
import FinanceBrowserImportBanner from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import AddEntityModal from './modals/AddEntityModal';
import UploadVaultModal from './modals/UploadVaultModal';
import CompanyDossier from './CompanyDossier';

// Subcomponents
import MasterDataHeader from './components/MasterDataHeader';
import MasterDataKpis from './components/MasterDataKpis';
import MasterDataTabs from './components/MasterDataTabs';
import MasterEntityTable from './components/MasterEntityTable';
import EntityInspector from './components/EntityInspector';
import VaultTab from './components/VaultTab';
import MasterPosTab from './components/MasterPosTab';
import DeleteEntityModal from './components/DeleteEntityModal';
import DeletePoModal from './components/DeletePoModal';

const MasterData = () => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(() => loadFinanceData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await fetchFinanceData();
      setData(fetched);
    } catch (err) {
      console.error('Failed to load master directory finance data:', err);
      setError(err?.message || 'Failed to load master directory data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const masterDirectory = data.masterDirectory || [];
  const vaultDocs = data.vault || [];
  const clientPos = data.clientPos || [];
  const supplierPos = data.supplierPos || [];
  const totalPoCount = clientPos.length + supplierPos.length;

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

      return true;
    });
  }, [masterDirectory, activeSegment, searchTerm]);

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
      <MasterDataHeader
        activeSegment={activeSegment}
        exportRegistry={exportRegistry}
        onOpenUploadVault={() => setUploadVaultOpen(true)}
        onOpenAddSupplier={handleOpenAddSupplier}
        onOpenAddClient={handleOpenAddClient}
      />

      {/* Admin Browser Storage Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Error state */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading Master Directory and Document Vault..." />
      ) : (
        <>
          {/* Top Summary KPI Scorecard Grid */}
          <MasterDataKpis
            masterDirectory={masterDirectory}
            clientCount={clientCount}
            supplierCount={supplierCount}
            kycComplianceStats={kycComplianceStats}
            vaultVolumeStats={vaultVolumeStats}
            currencyStats={currencyStats}
            handleSelectSegment={handleSelectSegment}
          />

          {/* Main Grid: Directory Table + 360 Entity Inspector Side Panel */}
          {activeSegment !== 'VAULT' && activeSegment !== 'POS' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left / Center: Interactive Master Table */}
              <div className="xl:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <MasterDataTabs
                    activeSegment={activeSegment}
                    handleSelectSegment={handleSelectSegment}
                    clientCount={clientCount}
                    supplierCount={supplierCount}
                    vaultDocsCount={vaultDocs.length}
                    totalPoCount={totalPoCount}
                  />

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

                <MasterEntityTable
                  filteredEntities={filteredEntities}
                  selectedEntityId={selectedEntityId}
                  setSelectedEntityId={setSelectedEntityId}
                  activeSegment={activeSegment}
                  clientCount={clientCount}
                  supplierCount={supplierCount}
                  isAdmin={isAdmin}
                  setEntityToDelete={setEntityToDelete}
                  handleOpenCompanyDossier={handleOpenCompanyDossier}
                />
              </div>

              {/* Right: 360 Entity Quick-Inspector Side Panel */}
              <EntityInspector
                selectedEntity={selectedEntity}
                inspectorTab={inspectorTab}
                setInspectorTab={setInspectorTab}
                onOpenUploadVault={() => setUploadVaultOpen(true)}
                onOpenCompanyDossier={handleOpenCompanyDossier}
                setEntityToDelete={setEntityToDelete}
                addToast={addToast}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {/* Document Vault Tab */}
          {activeSegment === 'VAULT' && (
            <VaultTab
              vaultDocs={vaultDocs}
              clientCount={clientCount}
              supplierCount={supplierCount}
              totalPoCount={totalPoCount}
              handleSelectSegment={handleSelectSegment}
              onOpenUploadVault={() => setUploadVaultOpen(true)}
              addToast={addToast}
            />
          )}

          {/* Master PO List Tab */}
          {activeSegment === 'POS' && (
            <MasterPosTab
              allMasterPos={allMasterPos}
              filteredMasterPos={filteredMasterPos}
              poMetrics={poMetrics}
              clientCount={clientCount}
              supplierCount={supplierCount}
              vaultDocsCount={vaultDocs.length}
              totalPoCount={totalPoCount}
              handleSelectSegment={handleSelectSegment}
              exportRegistry={exportRegistry}
              poFilterType={poFilterType}
              setPoFilterType={setPoFilterType}
              poSearchTerm={poSearchTerm}
              setPoSearchTerm={setPoSearchTerm}
              poStatusFilter={poStatusFilter}
              setPoStatusFilter={setPoStatusFilter}
              poCurrencyFilter={poCurrencyFilter}
              setPoCurrencyFilter={setPoCurrencyFilter}
              setPoToDelete={setPoToDelete}
            />
          )}
        </>
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
      <DeleteEntityModal
        entityToDelete={entityToDelete}
        onClose={() => setEntityToDelete(null)}
        onConfirmDelete={() => {
          handleDeleteCompany(entityToDelete.id, entityToDelete.name);
          setEntityToDelete(null);
        }}
      />

      {/* CONFIRM DELETE PURCHASE ORDER MODAL (ADMIN ONLY) */}
      <DeletePoModal
        poToDelete={poToDelete}
        onClose={() => setPoToDelete(null)}
        onConfirmDelete={() => handleDeletePo(poToDelete)}
      />
    </div>
  );
};

export default MasterData;
