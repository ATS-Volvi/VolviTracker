import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DossierHeader from './dossier/DossierHeader';
import DossierCompanyBanner from './dossier/DossierCompanyBanner';
import DossierTabsNav from './dossier/DossierTabsNav';
import DossierDocsTab from './dossier/DossierDocsTab';
import DossierNotesTab from './dossier/DossierNotesTab';
import DossierStakeholdersTab from './dossier/DossierStakeholdersTab';
import DossierBankingTab from './dossier/DossierBankingTab';
import DossierUploadModal from './dossier/DossierUploadModal';
import DossierPreviewModal from './dossier/DossierPreviewModal';
import DossierAddStakeholderModal from './dossier/DossierAddStakeholderModal';
import DossierDeleteModal from './dossier/DossierDeleteModal';

const CompanyDossier = ({
  company,
  onUpdateCompany,
  onDeleteCompany,
  onBack,
  addToast,
  allVaultDocs = []
}) => {
  const { isAdmin } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('DOCS'); // 'DOCS' | 'TEXT_INFO' | 'STAKEHOLDERS' | 'BANKING'

  // Documents state
  const attachedDocs = useMemo(() => {
    const directDocs = company.attachedDocs || [];
    const matchedVault = allVaultDocs
      .filter(vd => vd.entityName && vd.entityName.toLowerCase() === company.name.toLowerCase())
      .map(vd => ({
        id: vd.id,
        name: vd.title || 'Regulatory Filing.pdf',
        size: vd.size || '1.5 MB',
        category: vd.category || 'Vault',
        expiry: vd.expiryDate || 'Active',
        uploadDate: vd.updatedDate || new Date().toISOString().split('T')[0],
        notes: vd.notes || '',
        isFromVault: true
      }));

    const combined = [...directDocs];
    matchedVault.forEach(vd => {
      if (!combined.some(d => d.name === vd.name)) {
        combined.push(vd);
      }
    });
    return combined;
  }, [company.attachedDocs, company.name, allVaultDocs]);

  // Document Filters
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');
  const [docSearch, setDocSearch] = useState('');

  // Upload Doc Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('MSA');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocFileSize, setNewDocFileSize] = useState('');

  // Text info state
  const [overviewNotes, setOverviewNotes] = useState(company.overviewNotes || company.notes || '');
  const [isSavingOverview, setIsSavingOverview] = useState(false);

  // Team Notes / Activity Feed
  const [notesList, setNotesList] = useState(
    Array.isArray(company.textNotesList)
      ? company.textNotesList
      : [
          {
            id: 'n-1',
            text: `Initial master registry onboarded for ${company.name}. Regulatory credentials and standard settlement terms (${company.creditTerms || 'Net 30'}) verified.`,
            author: 'Compliance Officer',
            date: '2026-09-20 10:30 AM'
          },
          {
            id: 'n-2',
            text: `Commercial correspondence mail registered as ${company.companyMail || 'contact@entity.com'}. Primary department designated as "${company.department || 'Procurement'}".`,
            author: 'Operations Lead',
            date: '2026-09-22 03:15 PM'
          }
        ]
  );
  const [newNoteInput, setNewNoteInput] = useState('');

  // Custom Key-Value Text Fields
  const [customFields, setCustomFields] = useState(
    Array.isArray(company.customFields)
      ? company.customFields
      : [
          { id: 'cf-1', label: 'Assigned Account Lead', value: 'Sarah Lin (Global Accounts)' },
          { id: 'cf-2', label: 'Operational Dispatch Hub', value: `${company.country || 'Global'} Regional Centre` },
          { id: 'cf-3', label: 'Special Invoicing Instructions', value: 'Include PO Reference on header of all billings' }
        ]
  );
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  // Banking Details
  const [bankingData, setBankingData] = useState({
    bankName: company.bankDetails?.bankName || 'JPMorgan Chase & Co.',
    accountNumber: company.bankDetails?.accountNumber || '0091829011',
    swiftIban: company.bankDetails?.swiftIban || 'CHASUS33XXX',
    routing: company.bankDetails?.routing || '021000021',
    remittanceNotes: company.bankDetails?.remittanceNotes || 'Direct wire settlements accepted in native currency.'
  });

  // Stakeholders
  const [stakeholdersList, setStakeholdersList] = useState(
    Array.isArray(company.stakeholders) && company.stakeholders.length > 0
      ? company.stakeholders
      : [
          {
            name: company.contactPerson || 'Lead Contact',
            role: 'Lead Commercial Point of Contact',
            email: company.contactEmail || company.companyMail || '',
            phone: company.contactPhone || '+1 555-0100',
            dept: company.department || 'Procurement'
          }
        ]
  );
  const [isAddStakeholderOpen, setIsAddStakeholderOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    dept: ''
  });

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // Handlers for Uploading Extra Document
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewDocFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setNewDocFileSize(`${sizeMB} MB`);
      if (!newDocTitle) {
        setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSaveNewDoc = (e) => {
    e.preventDefault();
    const docTitle = newDocTitle.trim() || newDocFileName.trim() || 'Additional_Dossier_Document.pdf';
    const docSize = newDocFileSize || `${(Math.random() * 2 + 0.8).toFixed(1)} MB`;

    const newDocItem = {
      id: `doc-${Date.now()}`,
      name: docTitle.endsWith('.pdf') ? docTitle : `${docTitle}.pdf`,
      size: docSize,
      category: newDocCategory,
      expiry: newDocExpiry ? `Valid till ${newDocExpiry}` : 'Active / Permanent',
      uploadDate: new Date().toISOString().split('T')[0],
      notes: newDocNotes.trim(),
      hash: `sha256:${Math.random().toString(36).substring(2, 9)}...`
    };

    const nextAttached = [newDocItem, ...(company.attachedDocs || [])];
    const updatedCompany = {
      ...company,
      attachedDocs: nextAttached,
      docsCount: nextAttached.length
    };

    onUpdateCompany(updatedCompany);
    if (addToast) addToast(`Extra document "${docTitle}" added for ${company.name}`, 'success');

    // Reset modal
    setNewDocTitle('');
    setNewDocCategory('MSA');
    setNewDocExpiry('');
    setNewDocNotes('');
    setNewDocFileName('');
    setNewDocFileSize('');
    setIsUploadModalOpen(false);
  };

  const handleDeleteDoc = (docToDelete) => {
    if (!isAdmin) {
      if (addToast) addToast('Unauthorized: Only administrators have permission to delete documents.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${docToDelete.name}" from ${company.name}'s dossier?`)) return;

    const nextAttached = (company.attachedDocs || []).filter(d => d.name !== docToDelete.name && d.id !== docToDelete.id);
    const updatedCompany = {
      ...company,
      attachedDocs: nextAttached,
      docsCount: nextAttached.length
    };

    onUpdateCompany(updatedCompany);
    if (addToast) addToast(`Document "${docToDelete.name}" removed from company dossier`, 'info');
  };

  const handleDownloadDoc = (doc) => {
    const content = `VOLVITECH ENTERPRISE REPOSITORY\n` +
      `Entity: ${company.name} (${company.id})\n` +
      `Document: ${doc.name}\n` +
      `Category: ${doc.category}\n` +
      `Validity: ${doc.expiry}\n` +
      `Upload Date: ${doc.uploadDate || 'N/A'}\n` +
      `Cryptographic Hash: ${doc.hash || 'sha256:verified'}\n` +
      `Remarks: ${doc.notes || 'Official registered document under sovereign jurisdiction.'}\n\n` +
      `[CONFIDENTIAL & PROPRIETARY DOSSIER ARCHIVE]`;

    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    if (addToast) addToast(`Downloading "${doc.name}"...`, 'info');
  };

  // Handlers for Overview Notes
  const handleSaveOverviewNotes = () => {
    setIsSavingOverview(true);
    const updatedCompany = {
      ...company,
      overviewNotes: overviewNotes,
      notes: overviewNotes
    };
    onUpdateCompany(updatedCompany);
    setTimeout(() => {
      setIsSavingOverview(false);
      if (addToast) addToast(`Overview notes saved for ${company.name}`, 'success');
    }, 300);
  };

  // Handlers for Team Notes
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;

    const newNoteObj = {
      id: `note-${Date.now()}`,
      text: newNoteInput.trim(),
      author: 'Compliance & Sourcing Team',
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const nextNotes = [newNoteObj, ...notesList];
    setNotesList(nextNotes);
    const updatedCompany = {
      ...company,
      textNotesList: nextNotes
    };
    onUpdateCompany(updatedCompany);
    setNewNoteInput('');
    if (addToast) addToast('New note logged to company dossier', 'success');
  };

  const handleDeleteNote = (noteId) => {
    if (!isAdmin) {
      if (addToast) addToast('Unauthorized: Only administrators have permission to delete notes.', 'error');
      return;
    }
    const nextNotes = notesList.filter(n => n.id !== noteId);
    setNotesList(nextNotes);
    const updatedCompany = {
      ...company,
      textNotesList: nextNotes
    };
    onUpdateCompany(updatedCompany);
    if (addToast) addToast('Note deleted', 'info');
  };

  // Handlers for Custom Text Fields
  const handleAddCustomField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return;

    const newField = {
      id: `cf-${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim()
    };

    const nextFields = [...customFields, newField];
    setCustomFields(nextFields);
    const updatedCompany = {
      ...company,
      customFields: nextFields
    };
    onUpdateCompany(updatedCompany);
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
    if (addToast) addToast(`Custom field "${newField.label}" added`, 'success');
  };

  const handleDeleteCustomField = (fieldId) => {
    if (!isAdmin) {
      if (addToast) addToast('Unauthorized: Only administrators have permission to delete fields.', 'error');
      return;
    }
    const nextFields = customFields.filter(f => f.id !== fieldId);
    setCustomFields(nextFields);
    const updatedCompany = {
      ...company,
      customFields: nextFields
    };
    onUpdateCompany(updatedCompany);
    if (addToast) addToast('Field removed', 'info');
  };

  // Handlers for Banking Details
  const handleSaveBanking = (e) => {
    e.preventDefault();
    const updatedCompany = {
      ...company,
      bankDetails: {
        ...company.bankDetails,
        ...bankingData
      }
    };
    onUpdateCompany(updatedCompany);
    if (addToast) addToast(`Banking & wire remittance info saved for ${company.name}`, 'success');
  };

  // Handlers for Stakeholders
  const handleAddStakeholder = (e) => {
    e.preventDefault();
    if (!newStakeholder.name.trim()) return;

    const nextStakeholders = [
      ...stakeholdersList,
      {
        name: newStakeholder.name.trim(),
        role: newStakeholder.role.trim() || 'Commercial Stakeholder',
        email: newStakeholder.email.trim() || company.companyMail || '',
        phone: newStakeholder.phone.trim() || '',
        dept: newStakeholder.dept.trim() || company.department || 'Operations'
      }
    ];

    setStakeholdersList(nextStakeholders);
    const updatedCompany = {
      ...company,
      stakeholders: nextStakeholders
    };
    onUpdateCompany(updatedCompany);
    setNewStakeholder({ name: '', role: '', email: '', phone: '', dept: '' });
    setIsAddStakeholderOpen(false);
    if (addToast) addToast(`Contact "${newStakeholder.name}" added to stakeholders`, 'success');
  };

  const handleDeleteStakeholder = (idx) => {
    if (!isAdmin) {
      if (addToast) addToast('Unauthorized: Only administrators have permission to delete stakeholders.', 'error');
      return;
    }
    const nextStakeholders = stakeholdersList.filter((_, i) => i !== idx);
    setStakeholdersList(nextStakeholders);
    const updatedCompany = {
      ...company,
      stakeholders: nextStakeholders
    };
    onUpdateCompany(updatedCompany);
    if (addToast) addToast('Stakeholder removed', 'info');
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return attachedDocs.filter(doc => {
      if (docCategoryFilter !== 'ALL' && doc.category !== docCategoryFilter) return false;
      if (docSearch) {
        const q = docSearch.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchCat = (doc.category || '').toLowerCase().includes(q);
        const matchNotes = (doc.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchNotes) return false;
      }
      return true;
    });
  }, [attachedDocs, docCategoryFilter, docSearch]);

  const isClient = company.category === 'Client';

  return (
    <div className="w-full min-h-screen bg-[#FBFBFC] px-4 sm:px-8 py-6 space-y-6 text-left animate-fade-in">
      {/* Top Breadcrumb & Navigation */}
      <DossierHeader
        company={company}
        isAdmin={isAdmin}
        isClient={isClient}
        onBack={onBack}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenAddNote={() => {
          setActiveTab('TEXT_INFO');
          const el = document.getElementById('company-notes-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenDeleteModal={() => setShowDeleteModal(true)}
      />

      {/* Main Company Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
        <DossierCompanyBanner
          company={company}
          isClient={isClient}
          attachedDocsCount={attachedDocs.length}
          notesCount={notesList.length}
        />

        {/* Tab Navigation for this Company */}
        <DossierTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          attachedDocsCount={attachedDocs.length}
          notesCount={notesList.length + customFields.length}
          stakeholdersCount={stakeholdersList.length}
        />
      </div>

      {/* TAB 1: EXTRA DOCUMENTS & VAULT */}
      {activeTab === 'DOCS' && (
        <DossierDocsTab
          filteredDocs={filteredDocs}
          docCategoryFilter={docCategoryFilter}
          setDocCategoryFilter={setDocCategoryFilter}
          docSearch={docSearch}
          setDocSearch={setDocSearch}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onPreviewDoc={setPreviewDoc}
          onDownloadDoc={handleDownloadDoc}
          onDeleteDoc={handleDeleteDoc}
          isAdmin={isAdmin}
        />
      )}

      {/* TAB 2: TEXT INFO & NOTES */}
      {activeTab === 'TEXT_INFO' && (
        <DossierNotesTab
          company={company}
          overviewNotes={overviewNotes}
          setOverviewNotes={setOverviewNotes}
          isSavingOverview={isSavingOverview}
          onSaveOverviewNotes={handleSaveOverviewNotes}
          notesList={notesList}
          newNoteInput={newNoteInput}
          setNewNoteInput={setNewNoteInput}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          customFields={customFields}
          isAddingField={isAddingField}
          setIsAddingField={setIsAddingField}
          newFieldLabel={newFieldLabel}
          setNewFieldLabel={setNewFieldLabel}
          newFieldValue={newFieldValue}
          setNewFieldValue={setNewFieldValue}
          onAddCustomField={handleAddCustomField}
          onDeleteCustomField={handleDeleteCustomField}
          isAdmin={isAdmin}
        />
      )}

      {/* TAB 3: KEY STAKEHOLDERS */}
      {activeTab === 'STAKEHOLDERS' && (
        <DossierStakeholdersTab
          company={company}
          stakeholdersList={stakeholdersList}
          onOpenAddStakeholder={() => setIsAddStakeholderOpen(true)}
          onDeleteStakeholder={handleDeleteStakeholder}
          isAdmin={isAdmin}
        />
      )}

      {/* TAB 4: BANKING & WIRE REMITTANCE */}
      {activeTab === 'BANKING' && (
        <DossierBankingTab
          bankingData={bankingData}
          setBankingData={setBankingData}
          onSaveBanking={handleSaveBanking}
        />
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      <DossierUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        companyName={company.name}
        onSubmit={handleSaveNewDoc}
        newDocTitle={newDocTitle}
        setNewDocTitle={setNewDocTitle}
        newDocCategory={newDocCategory}
        setNewDocCategory={setNewDocCategory}
        newDocExpiry={newDocExpiry}
        setNewDocExpiry={setNewDocExpiry}
        newDocNotes={newDocNotes}
        setNewDocNotes={setNewDocNotes}
        newDocFileName={newDocFileName}
        newDocFileSize={newDocFileSize}
        onFileSelect={handleFileSelect}
      />

      {/* ADD STAKEHOLDER MODAL */}
      <DossierAddStakeholderModal
        isOpen={isAddStakeholderOpen}
        onClose={() => setIsAddStakeholderOpen(false)}
        companyName={company.name}
        onSubmit={handleAddStakeholder}
        newStakeholder={newStakeholder}
        setNewStakeholder={setNewStakeholder}
      />

      {/* DOCUMENT PREVIEW MODAL */}
      <DossierPreviewModal
        previewDoc={previewDoc}
        companyName={company.name}
        onClose={() => setPreviewDoc(null)}
        onDownloadDoc={handleDownloadDoc}
      />

      {/* CONFIRM DELETE ENTITY MODAL (ADMIN ONLY) */}
      <DossierDeleteModal
        isOpen={showDeleteModal}
        company={company}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={() => {
          if (!isAdmin) {
            if (addToast) addToast('Unauthorized: Only administrators can delete master entities.', 'error');
            return;
          }
          setShowDeleteModal(false);
          if (onDeleteCompany) {
            onDeleteCompany(company.id, company.name);
          }
        }}
      />
    </div>
  );
};

export default CompanyDossier;
