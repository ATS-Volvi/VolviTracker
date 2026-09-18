import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';

const PRESET_AVATARS = [
  { label: 'Alex', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Marcus', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Elena', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
  { label: 'David', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Sophia', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { label: 'James', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' }
];

const ChangeProfilePictureModal = ({ isOpen, onClose }) => {
  const { user, updateAvatar } = useAuth();
  const { addToast } = useToast();

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'url'
  const fileInputRef = useRef(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && user?.avatar) {
      setSelectedAvatar(user.avatar);
      setError('');
      setUrlInput('');
    }
  }, [isOpen, user?.avatar]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, etc.).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('Image file is too large. Please select a file under 12MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & resize to 256x256 max using canvas
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setSelectedAvatar(dataUrl);
        addToast('Image loaded successfully!', 'info', 2000);
      };
      img.onerror = () => {
        setError('Could not process image file.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setError('Please enter an image URL.');
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setError('');
    setSelectedAvatar(cleanUrl);
    addToast('Avatar URL selected!', 'info', 2000);
  };

  const handleUseInitials = () => {
    const name = user?.fullName || 'User';
    const initialsUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0070F3&color=fff&bold=true&size=256`;
    setSelectedAvatar(initialsUrl);
    setError('');
    addToast('Initials avatar selected!', 'info', 2000);
  };

  const handleSave = async () => {
    if (!selectedAvatar) {
      setError('Please select or upload a profile picture.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = updateAvatar(selectedAvatar);
      if (res && res.success) {
        addToast('Profile picture updated successfully!', 'success');
        onClose();
      } else {
        setError(res?.error || 'Failed to update profile picture.');
      }
    } catch {
      setError('An error occurred while updating profile picture.');
    } finally {
      setSaving(false);
    }
  };

  const isChanged = selectedAvatar && selectedAvatar !== user?.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/60">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Change Profile Picture</h3>
              <p className="text-xs text-gray-500">Update your avatar across the workspace</p>
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

        {/* Live Preview Section */}
        <div className="flex flex-col items-center justify-center py-4 bg-gray-50/70 rounded-2xl border border-gray-100 mb-4">
          <div className="relative group">
            <Avatar
              src={selectedAvatar || user?.avatar}
              alt={user?.fullName || 'Avatar'}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md border border-gray-200"
            />
            {isChanged && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
              </span>
            )}
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs font-semibold text-gray-800">{user?.fullName}</span>
            <p className="text-[11px] text-gray-500">
              {isChanged ? 'Previewing new avatar' : 'Current profile photo'}
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tabs for Avatar Selection */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              activeTab === 'presets'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-lg transition text-center ${
              activeTab === 'url'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Image URL
          </button>
        </div>

        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2.5 py-1">
              {PRESET_AVATARS.map((p, idx) => {
                const isSelected = selectedAvatar === p.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(p.url);
                      setError('');
                    }}
                    className={`relative rounded-full aspect-square overflow-hidden border-2 transition transform hover:scale-105 ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Or use name initials:</span>
              <button
                type="button"
                onClick={handleUseInitials}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition"
              >
                Generate Initials Avatar
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition bg-gray-50/50 hover:bg-blue-50/20 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-gray-700">Click to upload image file</p>
              <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 12MB</p>
            </div>
          </div>
        )}

        {/* Tab 3: Image URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleApplyUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Direct Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="input-field text-xs py-2"
              />
            </div>
            <button
              type="submit"
              className="btn-ghost w-full text-xs py-2 font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/60"
            >
              Preview Image from URL
            </button>
          </form>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-ghost text-xs py-2 px-4 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedAvatar}
            className="btn-primary text-xs py-2 px-5 font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Picture</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeProfilePictureModal;
