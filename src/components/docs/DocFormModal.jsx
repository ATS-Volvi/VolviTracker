import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MarkdownRenderer from './MarkdownRenderer';

const PRESET_CATEGORIES = [
  'Engineering',
  'HR & Policies',
  'Product',
  'Design',
  'Operations & SOP',
  'Security & Compliance',
  'General',
  'Other (Custom)'
];

export const DocFormModal = ({ isOpen, onClose, initialDoc = null, onSave }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isEditing = Boolean(initialDoc && initialDoc.id);

  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [customCategory, setCustomCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialDoc) {
      setTitle(initialDoc.title || '');
      const cat = initialDoc.category || 'General';
      if (PRESET_CATEGORIES.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('Other (Custom)');
        setCustomCategory(cat);
      }
      setSummary(initialDoc.summary || '');
      setContent(initialDoc.content || '');
      setTags(Array.isArray(initialDoc.tags) ? initialDoc.tags : []);
      setExternalUrl(initialDoc.externalUrl || '');
      setIsPinned(Boolean(initialDoc.isPinned));
      setAttachment(initialDoc.attachment || null);
      setActiveTab('write');
    } else {
      setTitle('');
      setCategory('Engineering');
      setCustomCategory('');
      setSummary('');
      setContent('');
      setTags(['guidelines']);
      setExternalUrl('');
      setIsPinned(false);
      setAttachment(null);
      setActiveTab('write');
    }
  }, [initialDoc, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Insert markdown syntax helper
  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || placeholder;
    const replacement = `${before}${selectedText}${after}`;

    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setContent(nextVal);

    // Reset selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/^[#,]/, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // 10MB limit check
    if (file.size > 10 * 1024 * 1024) {
      addToast('File exceeds 10MB limit. Please choose a smaller file.', 'error');
      return;
    }

    // Auto-suggest title if blank
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: new Date().toISOString()
      });
      addToast(`Attached file "${file.name}"`, 'success');
    };
    reader.readAsDataURL(file);

    // If file is text or markdown, read text for quick import
    const ext = file.name.split('.').pop().toLowerCase();
    if (['md', 'markdown', 'txt', 'json', 'csv'].includes(ext)) {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        const text = e.target.result;
        if (!content.trim()) {
          setContent(text);
          addToast('Auto-imported text into document editor', 'info');
        }
      };
      textReader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addToast('Attachment removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a document title', 'error');
      return;
    }

    const finalContent = content.trim() || (attachment ? `*Document attachment uploaded: **${attachment.name}** (${formatFileSize(attachment.size)})*` : '');

    if (!finalContent) {
      addToast('Please provide document content or upload a document file', 'error');
      return;
    }

    const finalCategory = category === 'Other (Custom)'
      ? (customCategory.trim() || 'General')
      : category;

    setIsSubmitting(true);

    try {
      const docPayload = {
        title: title.trim(),
        category: finalCategory,
        summary: summary.trim() || title.trim().slice(0, 100),
        content: finalContent,
        tags,
        externalUrl: externalUrl.trim(),
        isPinned,
        attachment: attachment || null,
        authorId: initialDoc?.authorId || user?.id || '1',
        authorName: initialDoc?.authorName || user?.fullName || 'Anonymous',
        authorAvatar: initialDoc?.authorAvatar || user?.avatar || '',
        authorRole: initialDoc?.authorRole || user?.role || 'Member',
        updatedAt: new Date().toISOString()
      };

      if (!isEditing) {
        docPayload.createdAt = new Date().toISOString();
      }

      await onSave(docPayload);
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Failed to save document. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-xs">
              📄
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {isEditing ? 'Edit Document' : 'Create New Document'}
              </h2>
              <p className="text-xs text-gray-500">
                Share guidelines, technical specs, SOPs, or policies with the entire team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engineering Onboarding & PR Checklist"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-base font-semibold"
            />
          </div>

          {/* Category & Pin Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category / Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {category === 'Other (Custom)' && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="input-field mt-2 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Pin to Top
              </label>
              <label className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition bg-white">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-800">Feature this doc</span>
                  <p className="text-[11px] text-gray-500">Pinned docs appear prominently at the top</p>
                </div>
              </label>
            </div>
          </div>

          {/* Brief Summary */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Summary / Excerpt (Optional)
            </label>
            <input
              type="text"
              placeholder="A brief 1-line overview displayed on search cards..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          {/* Tags & External Resource URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tags (Press Enter or comma)
              </label>
              <input
                type="text"
                placeholder="e.g. git, review, onboarding..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="input-field text-xs"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-600 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                External Resource URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://docs.google.com/... or Figma link"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* Upload Document / Attachment Spot */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Upload Document File (Optional)
              </label>
              <span className="text-[11px] text-gray-400 font-normal">PDF, DOCX, XLSX, TXT, MD, etc. (max 10MB)</span>
            </div>

            {attachment ? (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    {attachment.name.toLowerCase().endsWith('.pdf') ? '📕'
                      : attachment.name.match(/\.(docx?|rtf)$/i) ? '📘'
                      : attachment.name.match(/\.(xlsx?|csv)$/i) ? '📊'
                      : attachment.name.match(/\.(png|jpg|jpeg|webp)$/i) ? '🖼️'
                      : '📄'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{attachment.name}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{formatFileSize(attachment.size)} • Attached & ready to publish</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200 flex items-center gap-1"
                    title="Remove attachment"
                  >
                    <span>✕</span>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/70 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.png,.jpg,.jpeg"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs">
                    📁
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    Click to browse or drag and drop document file
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Upload any PDF, Word document, spreadsheet, markdown, or plain text file
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Content Editor with Markdown Toolbar & Preview Tab */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Document Body (Markdown Supported) {attachment ? <span className="text-gray-400 font-normal lowercase">(optional with attachment)</span> : <span className="text-rose-500">*</span>}
              </label>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'write' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'preview' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {/* Markdown Quick-Actions Toolbar (only shown in Write mode) */}
            {activeTab === 'write' && (
              <div className="flex flex-wrap items-center gap-1 p-1.5 bg-gray-50 border border-b-0 border-gray-200 rounded-t-lg text-xs text-gray-600">
                <button
                  type="button"
                  title="Heading 1"
                  onClick={() => insertMarkdown('# ', '', 'Heading 1')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-bold"
                >
                  H1
                </button>
                <button
                  type="button"
                  title="Heading 2"
                  onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-bold"
                >
                  H2
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onClick={() => insertMarkdown('### ', '', 'Heading 3')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-bold"
                >
                  H3
                </button>
                <span className="w-px h-4 bg-gray-300 mx-1"></span>
                <button
                  type="button"
                  title="Bold"
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-bold"
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  className="px-2 py-1 hover:bg-gray-200 rounded italic"
                >
                  I
                </button>
                <button
                  type="button"
                  title="Inline Code"
                  onClick={() => insertMarkdown('`', '`', 'code')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-mono text-[11px]"
                >
                  &lt;&gt;
                </button>
                <span className="w-px h-4 bg-gray-300 mx-1"></span>
                <button
                  type="button"
                  title="Bullet List"
                  onClick={() => insertMarkdown('- ', '', 'List item')}
                  className="px-2 py-1 hover:bg-gray-200 rounded"
                >
                  • List
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onClick={() => insertMarkdown('1. ', '', 'Numbered item')}
                  className="px-2 py-1 hover:bg-gray-200 rounded"
                >
                  1. List
                </button>
                <button
                  type="button"
                  title="Quote"
                  onClick={() => insertMarkdown('> ', '', 'Important note or quote')}
                  className="px-2 py-1 hover:bg-gray-200 rounded italic"
                >
                  &ldquo; Quote
                </button>
                <button
                  type="button"
                  title="Code Block"
                  onClick={() => insertMarkdown('```bash\n', '\n```', '# code commands')}
                  className="px-2 py-1 hover:bg-gray-200 rounded font-mono text-[11px]"
                >
                  ``` Code
                </button>
                <button
                  type="button"
                  title="Link"
                  onClick={() => insertMarkdown('[', '](https://example.com)', 'Link Title')}
                  className="px-2 py-1 hover:bg-gray-200 rounded underline"
                >
                  Link
                </button>
                <button
                  type="button"
                  title="Table"
                  onClick={() => insertMarkdown('| Col 1 | Col 2 |\n| :--- | :--- |\n| Val 1 | Val 2 |\n', '')}
                  className="px-2 py-1 hover:bg-gray-200 rounded"
                >
                  Table
                </button>
              </div>
            )}

            {activeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                required
                rows={12}
                placeholder="Write your document content here in Markdown format..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-200 rounded-b-lg px-4 py-3 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed bg-white"
              />
            ) : (
              <div className="border border-gray-200 rounded-lg p-5 bg-white min-h-[300px] max-h-[450px] overflow-y-auto custom-scrollbar">
                <MarkdownRenderer content={content} />
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs font-semibold px-5 py-2 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? 'Save Changes' : 'Publish Document'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocFormModal;
