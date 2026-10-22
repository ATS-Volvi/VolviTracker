import React, { useState, useMemo } from 'react';
import { useToast } from '../../context/ToastContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { hashPassword } from '../../utils/crypto';
import { getFinanceData } from '../../pages/finance/financeData';
import { Avatar } from '../widgets/Avatar';

const INTERNAL_ROLE_SUGGESTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Project Manager',
  'UI/UX Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Finance Specialist',
  'Operations Lead',
  'Data Analyst'
];

const CLIENT_ROLE_SUGGESTIONS = [
  'Client Representative',
  'VP Global Procurement',
  'Procurement Specialist',
  'Technical Delivery Lead',
  'Finance & Billing Director',
  'Project Sponsor',
  'Account Executive',
  'Contract Manager'
];

const SUPPLIER_ROLE_SUGGESTIONS = [
  'Vendor Manager',
  'Key Account Lead',
  'Technical Consultant',
  'Billing Operations Lead',
  'Supply Chain Coordinator',
  'Hardware Delivery Specialist',
  'Customer Success Lead'
];

export const CreateUserModal = ({ isOpen, onClose, onCreated }) => {
  const { addToast } = useToast();
  const { employees = [], addEmployee } = useData();
  const { isAdmin } = useAuth();

  // Master directory companies for quick suggestion
  const { clientCompanies, supplierCompanies } = useMemo(() => {
    try {
      const fData = getFinanceData();
      const mDir = Array.isArray(fData.masterDirectory) ? fData.masterDirectory : [];
      const clients = Array.from(new Set(
        mDir.filter(e => e.category === 'Client').map(e => e.name).filter(Boolean)
      ));
      const suppliers = Array.from(new Set(
        mDir.filter(e => e.category === 'Supplier').map(e => e.name).filter(Boolean)
      ));
      return { clientCompanies: clients, supplierCompanies: suppliers };
    } catch {
      return { clientCompanies: [], supplierCompanies: [] };
    }
  }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('internal'); // 'internal' | 'external'
  const [externalType, setExternalType] = useState('client'); // 'client' | 'supplier'
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [customAvatar, setCustomAvatar] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculated avatar preview
  const resolvedAvatar = useMemo(() => {
    if (customAvatar.trim()) return customAvatar.trim();
    const cleanName = fullName.trim() || 'New User';
    const bg = userType === 'internal' ? '0070F3' : (externalType === 'client' ? '059669' : 'D97706');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${bg}&color=fff&bold=true`;
  }, [customAvatar, fullName, userType, externalType]);

  // Handle switching user type
  const handleSelectUserType = (type) => {
    setUserType(type);
    setError('');
    if (type === 'internal') {
      setRole('Software Engineer');
      setOrganization('Volvitech');
    } else {
      setIsAdminChecked(false);
      setRole(externalType === 'client' ? 'Client Representative' : 'Vendor Manager');
      setOrganization(externalType === 'client' ? (clientCompanies[0] || 'NexaCorp International Ltd.') : (supplierCompanies[0] || 'Amazon Web Services'));
    }
  };

  const handleSelectExternalType = (extType) => {
    setExternalType(extType);
    setError('');
    if (extType === 'client') {
      setRole('Client Representative');
      if (!organization || supplierCompanies.includes(organization)) {
        setOrganization(clientCompanies[0] || 'NexaCorp International Ltd.');
      }
    } else {
      setRole('Vendor Manager');
      if (!organization || clientCompanies.includes(organization)) {
        setOrganization(supplierCompanies[0] || 'Amazon Web Services');
      }
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
    addToast('Generated random temporary password', 'info', 2000);
  };

  if (!isOpen || !isAdmin) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    let cleanRole = role.trim();
    const cleanOrg = userType === 'internal' ? 'Volvitech' : organization.trim();

    if (!cleanName) {
      setError('Please enter the user\'s full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (userType === 'external' && !cleanOrg) {
      setError(`Please specify the organization/company name for this ${externalType === 'client' ? 'client' : 'supplier'}.`);
      return;
    }

    if (!cleanRole) {
      setError('Please enter a role or designation.');
      return;
    }

    // Check for duplicate email
    const emailExists = (employees || []).some(
      emp => (emp.email || '').toLowerCase().trim() === cleanEmail
    );
    if (emailExists) {
      setError(`An account with email "${cleanEmail}" already exists in the system.`);
      return;
    }

    setSubmitting(true);
    try {
      const passwordHash = await hashPassword(cleanPassword);
      const isUserAdmin = userType === 'internal' ? isAdminChecked : false;

      const newUserData = {
        fullName: cleanName,
        email: cleanEmail,
        role: cleanRole,
        avatar: resolvedAvatar,
        passwordHash,
        isAdmin: isUserAdmin,
        userType,
        externalType: userType === 'external' ? externalType : null,
        organization: cleanOrg
      };

      const created = await addEmployee(newUserData);

      const brandLabel = userType === 'internal'
        ? 'Internal Staff (Volvitech)'
        : `External Partner (${externalType === 'client' ? 'Client' : 'Supplier'}: ${cleanOrg})`;

      addToast(`Created user "${cleanName}" as ${brandLabel}!`, 'success', 3500);

      if (onCreated) {
        onCreated(created);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('An error occurred while creating the user account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeSuggestions = userType === 'internal'
    ? INTERNAL_ROLE_SUGGESTIONS
    : (externalType === 'client' ? CLIENT_ROLE_SUGGESTIONS : SUPPLIER_ROLE_SUGGESTIONS);

  const activeCompanySuggestions = externalType === 'client' ? clientCompanies : supplierCompanies;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full p-6 animate-slide-up text-left my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <span className="material-symbols-outlined text-[22px]">person_add</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create New User</h3>
              <p className="text-xs text-gray-500">Configure user account and brand classification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. BRANDING & USER CLASSIFICATION SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              User Brand & Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Internal Card */}
              <button
                type="button"
                onClick={() => handleSelectUserType('internal')}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  userType === 'internal'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      userType === 'internal' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">apartment</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Internal</h4>
                      <p className="text-[11px] text-gray-500">From our company</p>
                    </div>
                  </div>
                  {userType === 'internal' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                    🏢 Volvitech Staff
                  </span>
                </div>
              </button>

              {/* External Card */}
              <button
                type="button"
                onClick={() => handleSelectUserType('external')}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  userType === 'external'
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      userType === 'external' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="material-symbols-outlined text-[18px]">hub</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">External</h4>
                      <p className="text-[11px] text-gray-500">Supplier or Client</p>
                    </div>
                  </div>
                  {userType === 'external' && (
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100/80 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    🤝 External Partner
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. EXTERNAL SPECIFICS (IF EXTERNAL) */}
          {userType === 'external' && (
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-3.5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  External Entity Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectExternalType('client')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      externalType === 'client'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">handshake</span>
                    <span>Client Partner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectExternalType('supplier')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      externalType === 'supplier'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span>Supplier Vendor</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Organization / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="external-companies-list"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder={externalType === 'client' ? 'e.g., NexaCorp International Ltd.' : 'e.g., Amazon Web Services'}
                  className="input w-full text-xs py-2 px-3 bg-white"
                />
                <datalist id="external-companies-list">
                  {activeCompanySuggestions.map((comp, idx) => (
                    <option key={idx} value={comp} />
                  ))}
                </datalist>

                {activeCompanySuggestions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] text-gray-500 font-medium block mb-1">
                      Quick select from registered {externalType === 'client' ? 'clients' : 'suppliers'}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCompanySuggestions.slice(0, 4).map((comp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setOrganization(comp)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                            organization === comp
                              ? 'bg-purple-100 border-purple-300 text-purple-800 font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {comp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. USER CREDENTIALS & PROFILE */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Marcus Vance"
                className="input w-full text-xs py-2 px-3"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={userType === 'internal' ? 'user@volvitech.com' : 'contact@partnercompany.com'}
                className="input w-full text-xs py-2 px-3"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">key</span>
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters (used for initial sign in)"
                  className="input w-full text-xs py-2 px-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Designation / Role */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Designation / Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                list="modal-role-suggestions"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Select or enter title..."
                className="input w-full text-xs py-2 px-3"
              />
              <datalist id="modal-role-suggestions">
                {activeSuggestions.map((r, i) => (
                  <option key={i} value={r} />
                ))}
              </datalist>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {activeSuggestions.slice(0, 4).map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition ${
                      role === r
                        ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Privileges Toggle (Only for Internal Users) */}
            {userType === 'internal' && (
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={isAdminChecked}
                    onChange={(e) => setIsAdminChecked(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Grant Administrator Privileges (Admin)
                    </span>
                    <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                      Enables full system management, finances, master records, and team oversight.
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* 4. LIVE BRANDING BADGE PREVIEW */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Live Brand Preview
            </span>
            <div className="flex items-center gap-3">
              <Avatar src={resolvedAvatar} alt={fullName || 'Preview'} className="w-10 h-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-gray-900 truncate">
                    {fullName.trim() || 'New User Name'}
                  </span>
                  {isAdminChecked && userType === 'internal' && (
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{role || 'Role'}</p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {userType === 'internal' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      <span className="material-symbols-outlined text-[12px]">apartment</span>
                      Internal • Volvitech
                    </span>
                  ) : externalType === 'client' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="material-symbols-outlined text-[12px]">handshake</span>
                      External • Client: {organization.trim() || 'Client Company'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                      External • Supplier: {organization.trim() || 'Supplier Company'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-ghost text-xs py-2 px-4 rounded-xl font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-xs py-2 px-5 rounded-xl font-semibold flex items-center gap-1.5 shadow-xs"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating User...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>Create User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
