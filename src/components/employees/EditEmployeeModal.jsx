import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';

const ROLE_SUGGESTIONS = [
  'Admin',
  'Product Lead',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'UI/UX Designer',
  'Designer',
  'Project Manager',
  'QA Engineer',
  'DevOps Engineer',
  'Data Analyst'
];

const EditEmployeeModal = ({ isOpen, onClose, employee, onSave }) => {
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      setFullName(employee.fullName || '');
      setRole(employee.role || '');
      setAvatar(employee.avatar || '');
      setError('');
    }
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanRole = role.trim();

    if (!cleanName) {
      setError('Please enter employee full name.');
      return;
    }

    if (!cleanRole) {
      setError('Please enter employee designation/role.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        fullName: cleanName,
        role: cleanRole,
        avatar: avatar.trim() || employee.avatar
      });
      addToast(`Updated properties for ${cleanName}!`, 'success');
      onClose();
    } catch {
      setError('Failed to update employee properties.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-slide-up text-left">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Employee Details</h3>
              <p className="text-xs text-gray-500">Update name, designation, and profile</p>
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

        {/* Live Preview Bar */}
        <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/80 mb-4">
          <Avatar
            src={avatar || employee.avatar}
            alt={fullName || employee.fullName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-gray-900 truncate">
              {fullName || 'Employee Name'}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md truncate">
                {role || 'Designation'}
              </span>
              <span className="text-[11px] text-gray-500 truncate">{employee.email}</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amara Patel"
              className="input-field text-sm"
              required
            />
          </div>

          {/* Designation / Role */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Designation / Role <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-gray-400">Type or pick from list</span>
            </div>
            <div className="relative">
              <input
                type="text"
                list="designation-suggestions"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Designer"
                className="input-field text-sm"
                required
              />
              <datalist id="designation-suggestions">
                {ROLE_SUGGESTIONS.map((r, i) => (
                  <option key={i} value={r} />
                ))}
              </datalist>
            </div>

            {/* Quick role pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Designer', 'Software Engineer', 'Product Lead', 'Admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                    role === r
                      ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Email (Read-only / identifier) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={employee.email || ''}
              disabled
              className="input-field text-sm bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Email is used for system identification & login.
            </p>
          </div>

          {/* Avatar URL (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Profile Picture URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="input-field text-xs py-2 flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=0070F3&color=fff&bold=true`;
                  setAvatar(url);
                }}
                className="btn-ghost text-xs py-2 px-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 shrink-0"
                title="Generate avatar from current name"
              >
                Auto Avatar
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-ghost text-xs py-2 px-4 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs py-2 px-5 font-semibold flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
