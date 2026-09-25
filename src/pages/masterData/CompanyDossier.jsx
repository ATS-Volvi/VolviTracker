import React, { useState, useMemo } from 'react';

const CompanyDossier = ({
  company,
  onUpdateCompany,
  onBack,
  addToast,
  allVaultDocs = []
}) => {
  const [activeTab, setActiveTab] = useState('DOCS'); // 'DOCS' | 'TEXT_INFO' | 'STAKEHOLDERS' | 'BANKING'

  // Documents state
  const attachedDocs = useMemo(() => {
    const directDocs = company.attachedDocs || [];
    // Also include any docs from global vault matching this entity name that aren't already included
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

    // Combine avoiding exact duplicates by name
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
    // Generate realistic file download
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 shadow-2xs transition flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Directory"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Directory</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <span>Master Data</span>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            <span className={isClient ? 'text-blue-600 font-bold' : 'text-emerald-600 font-bold'}>
              {company.category}s
            </span>
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
            <span className="text-gray-900 font-bold truncate max-w-xs">{company.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">cloud_upload</span>
            <span>Attach Extra Document</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('TEXT_INFO');
              const el = document.getElementById('company-notes-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px] text-gray-500">edit_note</span>
            <span>Add Text Note</span>
          </button>
        </div>
      </div>

      {/* Main Company Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xs shrink-0 ${
              isClient ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {company.avatarText || company.name.substring(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-gray-900 font-display tracking-tight">
                  {company.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isClient ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {company.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 font-mono">
                  {company.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{company.compliance || 'Active Verified'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <span className="material-symbols-outlined text-[15px] text-gray-400">public</span>
                  <span>{company.country}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <span className="material-symbols-outlined text-[15px] text-gray-400">domain</span>
                  <span>{company.department || 'Enterprise Accounts'}</span>
                </span>
                <span>•</span>
                <a
                  href={`mailto:${company.companyMail || company.contactEmail}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <span className="material-symbols-outlined text-[15px] text-gray-400">mail</span>
                  <span>{company.companyMail || company.contactEmail || `contact@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 shrink-0">
            <div className="px-3 py-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Documents</div>
              <div className="text-base font-black text-gray-900 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-blue-600">folder_open</span>
                <span>{attachedDocs.length}</span>
              </div>
            </div>

            <div className="px-3 py-1 border-l border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Notes & Logs</div>
              <div className="text-base font-black text-gray-900 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">notes</span>
                <span>{notesList.length}</span>
              </div>
            </div>

            <div className="px-3 py-1 border-l border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Currency</div>
              <div className="text-base font-black text-blue-600 font-mono mt-0.5">
                {company.currency || 'USD'}
              </div>
            </div>

            <div className="px-3 py-1 border-l border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase">Settlement Terms</div>
              <div className="text-xs font-bold text-gray-800 mt-1 truncate max-w-[100px]" title={company.creditTerms}>
                {company.creditTerms || 'Net 30'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation for this Company */}
        <div className="flex items-center gap-2 border-b border-gray-100 pt-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('DOCS')}
            className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'DOCS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">folder_special</span>
            <span>Attached Documents & Files</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'DOCS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {attachedDocs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEXT_INFO')}
            className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'TEXT_INFO'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">description</span>
            <span>Text Info & Notes</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'TEXT_INFO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {notesList.length + customFields.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAKEHOLDERS')}
            className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'STAKEHOLDERS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">badge</span>
            <span>Key Stakeholders</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
              {stakeholdersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BANKING')}
            className={`pb-3 px-4 transition flex items-center gap-2 border-b-2 ${
              activeTab === 'BANKING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">account_balance</span>
            <span>Banking & Remittance</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EXTRA DOCUMENTS & VAULT */}
      {activeTab === 'DOCS' && (
        <div className="space-y-5">
          {/* Docs Control Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              {['ALL', 'MSA', 'License', 'Tax', 'Banking', 'NDA', 'Custom'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    docCategoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                  }`}
                >
                  {cat === 'ALL' ? 'All Documents' : cat}
                </button>
              ))}
            </div>

            {/* Search and Upload */}
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search attached docs..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocs.map((doc, idx) => {
                const isPdf = doc.name.toLowerCase().endsWith('.pdf');
                const isExcel = doc.name.toLowerCase().includes('xls') || doc.name.toLowerCase().includes('sheet');
                const isWord = doc.name.toLowerCase().includes('doc');

                return (
                  <div
                    key={doc.id || idx}
                    className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-4 group min-w-0 overflow-hidden"
                  >
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isPdf ? 'bg-red-50 text-red-600' : isExcel ? 'bg-emerald-50 text-emerald-600' : isWord ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <span className="material-symbols-outlined text-[24px]">
                              {isPdf ? 'picture_as_pdf' : isExcel ? 'table_chart' : isWord ? 'description' : 'draft'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-xs leading-snug line-clamp-2 break-words group-hover:text-blue-600 transition" title={doc.name}>
                              {doc.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1 truncate">
                              <span className="font-medium text-gray-600">{doc.category || 'General'}</span>
                              <span>•</span>
                              <span>{doc.size || '1.2 MB'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                          {doc.category || 'Dossier'}
                        </span>
                      </div>

                      {/* Expiry and Validity Status */}
                      <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-[11px] space-y-1">
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Status / Expiration:</span>
                          <span className={`font-semibold ${
                            (doc.expiry || '').toLowerCase().includes('expir')
                              ? 'text-amber-600 font-bold'
                              : 'text-emerald-700'
                          }`}>
                            {doc.expiry || 'Active / Verified'}
                          </span>
                        </div>
                        {doc.uploadDate && (
                          <div className="flex items-center justify-between text-gray-400 text-[10px]">
                            <span>Attached On:</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                        )}
                        {doc.notes && (
                          <div className="text-[10px] text-gray-600 italic pt-1 border-t border-gray-200/60 line-clamp-2">
                            "{doc.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="text-[11px] font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 transition"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        <span>Inspect</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Download Document"
                        >
                          <span className="material-symbols-outlined text-[17px]">download</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete from Dossier"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">folder_off</span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">No Documents Found</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No documents match your filter. Click "Upload Document" to attach official contracts, licenses, or custom files.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-2 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                + Attach New Document
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEXT INFO & NOTES */}
      {activeTab === 'TEXT_INFO' && (
        <div id="company-notes-section" className="space-y-6">
          {/* Section A: Long-form Company Overview & Instructions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">feed</span>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 font-display">Company Overview & Operational Instructions</h2>
                  <p className="text-xs text-gray-400">Keep general background, relationship history, delivery procedures, and account rules</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveOverviewNotes}
                disabled={isSavingOverview}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isSavingOverview ? 'Saving...' : 'Save Overview Text'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={overviewNotes}
              onChange={(e) => setOverviewNotes(e.target.value)}
              placeholder={`Write text information for ${company.name} here... (e.g. key vendor agreements, escalation matrix, custom invoicing terms, branch addresses)`}
              className="w-full text-xs p-3.5 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed bg-gray-50/50"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section B: Team Notes & Activity Feed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">sticky_note_2</span>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 font-display">Team Notes & Activity Log</h2>
                      <p className="text-[11px] text-gray-400">Chronological timestamped notes and operational memos</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {notesList.length} Notes
                  </span>
                </div>

                {/* Add New Note Box */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Type an internal note or update for this company..."
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNoteInput.trim()}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Post Note</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {notesList.map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          <span>{note.author}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-[10px]">{note.date}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                            title="Delete note"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section C: Custom Key-Value Text Fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">tune</span>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 font-display">Custom Metadata & Text Fields</h2>
                    <p className="text-[11px] text-gray-400">Keep specific company properties, tags, and key-value info</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingField(true)}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Add Field</span>
                </button>
              </div>

              {/* Add Field Inline Form */}
              {isAddingField && (
                <form onSubmit={handleAddCustomField} className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[11px]">Field Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Account Manager"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1 text-[11px]">Field Text Value</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins (HQ)"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFieldLabel.trim() || !newFieldValue.trim()}
                      className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Save Field
                    </button>
                  </div>
                </form>
              )}

              {/* Fields List */}
              <div className="space-y-2">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs group"
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase text-gray-400">{field.label}</div>
                      <div className="font-semibold text-gray-900 mt-0.5">{field.value}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(field.id)}
                      className="p-1 rounded-md text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                      title="Remove field"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEY STAKEHOLDERS */}
      {activeTab === 'STAKEHOLDERS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">contacts</span>
              <div>
                <h2 className="text-base font-bold text-gray-900 font-display">Designated Key Stakeholders & Contacts</h2>
                <p className="text-xs text-gray-400">Authorized personnel, procurement leads, and corporate officers for {company.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStakeholderOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Add Stakeholder</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stakeholdersList.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 text-xs relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium">{s.role}</div>
                    </div>
                  </div>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStakeholder(idx)}
                      className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                      title="Remove contact"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px] pt-1 border-t border-gray-200/60">
                  {s.email && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
                      <a href={`mailto:${s.email}`} className="text-blue-600 hover:underline truncate">
                        {s.email}
                      </a>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="material-symbols-outlined text-[14px] text-gray-400">call</span>
                      <span className="font-mono">{s.phone}</span>
                    </div>
                  )}
                  {s.dept && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="material-symbols-outlined text-[14px] text-gray-400">business</span>
                      <span>{s.dept}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BANKING & WIRE REMITTANCE */}
      {activeTab === 'BANKING' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">account_balance</span>
              <div>
                <h2 className="text-base font-bold text-gray-900 font-display">Banking Mandates & Wire Remittance Information</h2>
                <p className="text-xs text-gray-400">Official bank accounts, clearing codes, and wire transfer instructions</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveBanking}
              className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Banking Info</span>
            </button>
          </div>

          <form onSubmit={handleSaveBanking} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">Financial Institution / Bank Name</label>
              <input
                type="text"
                value={bankingData.bankName}
                onChange={(e) => setBankingData({ ...bankingData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Account Number / IBAN</label>
              <input
                type="text"
                value={bankingData.accountNumber}
                onChange={(e) => setBankingData({ ...bankingData, accountNumber: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">SWIFT / BIC Identifier</label>
              <input
                type="text"
                value={bankingData.swiftIban}
                onChange={(e) => setBankingData({ ...bankingData, swiftIban: e.target.value })}
                className="w-full px-3 py-2 font-mono uppercase border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">Routing Code / Sort / IFSC</label>
              <input
                type="text"
                value={bankingData.routing}
                onChange={(e) => setBankingData({ ...bankingData, routing: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-1">Special Remittance & Wire Instructions</label>
              <textarea
                rows={3}
                value={bankingData.remittanceNotes}
                onChange={(e) => setBankingData({ ...bankingData, remittanceNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Include intermediary bank details, currency requirements, or invoice memo guidelines..."
              />
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">upload_file</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">Attach Extra Document</h3>
                  <p className="text-xs text-gray-500">Adding to {company.name}'s dedicated dossier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewDoc} className="p-6 space-y-4 text-xs">
              {/* File Dropzone */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Choose File</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-blue-500 transition bg-gray-50/50">
                  <input
                    type="file"
                    id="company-doc-file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="company-doc-file" className="cursor-pointer block space-y-1">
                    <span className="material-symbols-outlined text-gray-400 text-[32px]">cloud_upload</span>
                    <div className="text-xs font-bold text-blue-600">
                      {newDocFileName || 'Click to browse files (PDF, DOCX, XLSX, PNG)'}
                    </div>
                    {newDocFileSize && (
                      <div className="text-[10px] text-gray-500 font-medium">Selected size: {newDocFileSize}</div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Registry Certificate 2026"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Category *</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="MSA">MSA / Contract</option>
                    <option value="License">Commercial License / CR</option>
                    <option value="Tax">Tax Exemption / VAT</option>
                    <option value="Banking">Banking Mandate</option>
                    <option value="NDA">Mutual NDA</option>
                    <option value="Custom">Custom / Extra Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={newDocExpiry}
                    onChange={(e) => setNewDocExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Notes / Description for this Document</label>
                <textarea
                  rows={2}
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="e.g. Executed and stamped by Managing Director on Sept 25th"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition"
                >
                  Save to Company Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAKEHOLDER MODAL */}
      {isAddStakeholderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">person_add</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">Add Key Stakeholder</h3>
                  <p className="text-xs text-gray-500">Designating contact for {company.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStakeholderOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddStakeholder} className="p-6 space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={newStakeholder.name}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Designation / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Head of Strategic Procurement"
                  value={newStakeholder.role}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="alex@company.com"
                    value={newStakeholder.email}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0199"
                    value={newStakeholder.phone}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Finance & Treasury"
                  value={newStakeholder.dept}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, dept: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddStakeholderOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Stakeholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-slide-up text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">description</span>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-display">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-500">Attached to {company.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Document Category:</span>
                  <span className="font-bold text-gray-900">{previewDoc.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">File Size:</span>
                  <span className="font-mono text-gray-800">{previewDoc.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Validity / Status:</span>
                  <span className="font-semibold text-emerald-600">{previewDoc.expiry}</span>
                </div>
                {previewDoc.uploadDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uploaded On:</span>
                    <span className="text-gray-700">{previewDoc.uploadDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Integrity Signature:</span>
                  <span className="font-mono text-[10px] text-gray-500">{previewDoc.hash || 'sha256:verified_ok'}</span>
                </div>
              </div>

              {previewDoc.notes && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs">
                  <div className="font-bold mb-0.5">Notes:</div>
                  <div>{previewDoc.notes}</div>
                </div>
              )}

              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
                <span className="material-symbols-outlined text-[36px] text-gray-400">lock</span>
                <p className="text-xs text-gray-500">
                  Document verified & encrypted under AES-256 vault standard.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadDoc(previewDoc);
                    setPreviewDoc(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDossier;
