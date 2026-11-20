import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { fetchFinanceData, loadFinanceData, saveFinanceData, subscribeFinanceData } from '../finance/financeData';
import FinanceBrowserImportBanner from '../../components/finance/FinanceBrowserImportBanner';
import { FinanceLoadingSpinner, FinanceErrorBanner } from '../../components/finance/FinancePageStatus';
import AddEntityModal from './modals/AddEntityModal';
import UploadVaultModal from './modals/UploadVaultModal';
import CompanyDossier from './CompanyDossier';

// Subcomponents
import MasterDataHeader from './components/MasterDataHeader';
import MasterEntityTable from './components/MasterEntityTable';
import EntityInspector from './components/EntityInspector';
import EmployeesTab from './components/EmployeesTab';
import DeleteEntityModal from './components/DeleteEntityModal';

const MasterData = ({ fixedSegment }) => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const { employees = [] } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companyId } = useParams();
  const location = useLocation();
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

  // Selected entity for 360 inspector
  const [selectedEntityId, setSelectedEntityId] = useState(null);

  // Dedicated Company Dossier View State (from route /master-data/:companyId or query param or button click)
  const [viewingCompanyId, setViewingCompanyId] = useState(() => companyId || searchParams.get('companyId') || null);

  useEffect(() => {
    if (companyId) {
      setViewingCompanyId(companyId);
    }
  }, [companyId]);

  // Determine active segment from props, path, or query param
  const currentPath = location.pathname.toLowerCase();
  const segmentFromPath = useMemo(() => {
    if (fixedSegment) return fixedSegment;
    if (currentPath.includes('/master-data/clients') || currentPath.includes('/master-data/client')) return 'CLIENTS';
    if (currentPath.includes('/master-data/suppliers') || currentPath.includes('/master-data/supplier')) return 'SUPPLIERS';
    if (currentPath.includes('/master-data/user-management') || currentPath.includes('/master-data/users') || currentPath.includes('/master-data/employees')) return 'EMPLOYEES';
    return null;
  }, [fixedSegment, currentPath]);

  const paramTab = searchParams.get('tab')?.toUpperCase();
  const initialSegment = segmentFromPath || (
    paramTab === 'SUPPLIERS' || paramTab === 'SUPPLIER' ? 'SUPPLIERS' :
    paramTab === 'EMPLOYEES' || paramTab === 'EMPLOYEE' || paramTab === 'USERS' || paramTab === 'TEAM' ? 'EMPLOYEES' :
    'CLIENTS'
  );

  const [activeSegment, setActiveSegment] = useState(initialSegment); // 'CLIENTS' | 'SUPPLIERS' | 'EMPLOYEES'

  useEffect(() => {
    if (segmentFromPath) {
      setActiveSegment(segmentFromPath);
    }
  }, [segmentFromPath]);

  const masterDirectory = data.masterDirectory || [];
  const vaultDocs = data.vault || [];

  const handleSelectSegment = (seg) => {
    setActiveSegment(seg);
    if (seg === 'CLIENTS') {
      navigate('/master-data/clients');
    } else if (seg === 'SUPPLIERS') {
      navigate('/master-data/suppliers');
    } else if (seg === 'EMPLOYEES') {
      navigate('/master-data/user-management');
    }

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

  // Inspector tab
  const [inspectorTab, setInspectorTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'POS' | 'VAULT'

  // Subscribe to updates from other pages / tabs
  useEffect(() => {
    const unsub = subscribeFinanceData((updatedData) => {
      setData(updatedData);
    });
    return unsub;
  }, []);

  // Default and synchronized selected entity matching activeSegment
  useEffect(() => {
    if (!masterDirectory.length) return;

    const currentEnt = masterDirectory.find(e => e.id === selectedEntityId);
    const expectedCategory = activeSegment === 'SUPPLIERS' ? 'Supplier' : activeSegment === 'CLIENTS' ? 'Client' : null;

    if (!expectedCategory) return;

    if (!currentEnt || currentEnt.category !== expectedCategory) {
      const firstMatching = masterDirectory.find(e => e.category === expectedCategory);
      if (firstMatching) {
        setSelectedEntityId(firstMatching.id);
      }
    }
  }, [masterDirectory, selectedEntityId, activeSegment]);

  const selectedEntity = useMemo(() => {
    const ent = masterDirectory.find(e => e.id === selectedEntityId);
    const expectedCategory = activeSegment === 'SUPPLIERS' ? 'Supplier' : activeSegment === 'CLIENTS' ? 'Client' : null;

    if (ent && (!expectedCategory || ent.category === expectedCategory)) {
      return ent;
    }
    if (expectedCategory) {
      return masterDirectory.find(e => e.category === expectedCategory) || null;
    }
    return ent || masterDirectory[0] || null;
  }, [masterDirectory, selectedEntityId, activeSegment]);

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
    navigate(activeSegment === 'SUPPLIERS' ? '/master-data/suppliers' : '/master-data/clients');
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
      navigate(activeSegment === 'SUPPLIERS' ? '/master-data/suppliers' : '/master-data/clients');
    }

    addToast(`"${targetName}" has been permanently removed from Master Directory.`, 'info');
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
        onOpenAddSupplier={handleOpenAddSupplier}
        onOpenAddClient={handleOpenAddClient}
      />

      {/* Admin Browser Storage Import Banner */}
      <FinanceBrowserImportBanner onImportSuccess={setData} />

      {/* Error state */}
      {error && <FinanceErrorBanner error={error} onRetry={loadData} />}

      {isLoading ? (
        <FinanceLoadingSpinner message="Loading Master Directory..." />
      ) : (
        <>
          {/* Main Grid: Directory Table + 360 Entity Inspector Side Panel */}
          {activeSegment !== 'EMPLOYEES' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left / Center: Interactive Master Table */}
              <div className="xl:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-[19px] ${
                      activeSegment === 'SUPPLIERS' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {activeSegment === 'SUPPLIERS' ? 'local_shipping' : 'person'}
                    </span>
                    <span className="text-sm font-bold text-gray-900 font-display">
                      {activeSegment === 'SUPPLIERS' ? 'Suppliers Registry' : 'Clients Registry'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      activeSegment === 'SUPPLIERS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {activeSegment === 'SUPPLIERS' ? supplierCount : clientCount}
                    </span>
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

          {/* Team & Users Directory Tab (List View) */}
          {activeSegment === 'EMPLOYEES' && (
            <EmployeesTab
              clientCount={clientCount}
              supplierCount={supplierCount}
              handleSelectSegment={handleSelectSegment}
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
    </div>
  );
};

export default MasterData;
