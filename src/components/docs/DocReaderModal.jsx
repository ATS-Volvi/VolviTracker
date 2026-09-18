import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../widgets/Avatar';
import MarkdownRenderer from './MarkdownRenderer';

export const DocReaderModal = ({
  isOpen,
  onClose,
  doc,
  onEdit,
  onDelete,
  onTogglePin
}) => {
  const { user, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const canModify = isAdmin || String(user?.id) === String(doc.authorId);

  // Calculate estimated reading time
  const wordCount = doc.content ? doc.content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(doc.content || '');
    setCopiedContent(true);
    addToast('Document content copied to clipboard!', 'success');
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/docs?id=${encodeURIComponent(doc.id)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast('Document link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const blob = new Blob([doc.content || ''], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    addToast(`Downloaded ${filename}`, 'info');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      onDelete(doc.id);
      addToast('Document deleted successfully', 'info');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {doc.category || 'General'}
            </span>
            {doc.isPinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                <span>📌</span> Pinned
              </span>
            )}
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">
              • {readTimeMin} min read
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Action buttons */}
            <button
              type="button"
              onClick={handleCopyContent}
              title="Copy markdown text"
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200 flex items-center gap-1"
            >
              {copiedContent ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200 flex items-center gap-1"
            >
              {copiedLink ? (
                <span className="text-emerald-600">Link Copied!</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Download markdown file"
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(doc.id)}
                title={doc.isPinned ? 'Unpin document' : 'Pin document'}
                className={`p-1.5 rounded-lg transition border ${
                  doc.isPinned
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-gray-200'
                }`}
              >
                📌
              </button>
            )}

            {canModify && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(doc);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200"
                >
                  Delete
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition text-lg leading-none ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Reader Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 custom-scrollbar">
          {/* Document Header Info */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {doc.title}
            </h1>

            {doc.summary && (
              <p className="mt-2 text-sm sm:text-base text-gray-500 font-normal leading-relaxed">
                {doc.summary}
              </p>
            )}

            {/* Author and Metadata Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <Avatar
                  src={doc.authorAvatar}
                  alt={doc.authorName}
                  className="h-9 w-9 object-cover ring-2 ring-blue-500/20"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900 leading-tight">
                    {doc.authorName || 'Team Member'}
                  </div>
                  <div className="text-[11px] text-gray-500 leading-tight">
                    {doc.authorRole || 'Contributor'}
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-gray-400">
                {doc.createdAt && (
                  <div>Published: <span className="text-gray-600 font-medium">{formatDate(doc.createdAt)}</span></div>
                )}
                {doc.updatedAt && doc.updatedAt !== doc.createdAt && (
                  <div>Updated: <span className="text-gray-600 font-medium">{formatDate(doc.updatedAt)}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Uploaded File Attachment Banner if attached */}
          {doc.attachment && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs">
                  {doc.attachment.name?.toLowerCase().endsWith('.pdf') ? '📕'
                    : doc.attachment.name?.match(/\.(docx?|rtf)$/i) ? '📘'
                    : doc.attachment.name?.match(/\.(xlsx?|csv)$/i) ? '📊'
                    : doc.attachment.name?.match(/\.(png|jpg|jpeg|webp)$/i) ? '🖼️'
                    : '📄'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {doc.attachment.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      {doc.attachment.name?.split('.').pop() || 'FILE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Attached Document File • {formatFileSize(doc.attachment.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {doc.attachment.dataUrl && (
                  <a
                    href={doc.attachment.dataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                  >
                    <span>View / Open</span>
                    <span>↗</span>
                  </a>
                )}
                {doc.attachment.dataUrl && (
                  <a
                    href={doc.attachment.dataUrl}
                    download={doc.attachment.name}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download File</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* External Resource Banner if available */}
          {doc.externalUrl && (
            <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-blue-900">
                <span className="text-base">🔗</span>
                <div>
                  <span className="font-semibold">Associated External Resource:</span>
                  <p className="text-[11px] text-blue-700 truncate max-w-md">{doc.externalUrl}</p>
                </div>
              </div>
              <a
                href={doc.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition shrink-0"
              >
                <span>Open Link</span>
                <span>↗</span>
              </a>
            </div>
          )}

          {/* Rendered Document Body */}
          <div className="py-2">
            <MarkdownRenderer content={doc.content} />
          </div>

          {/* Tags footer */}
          {Array.isArray(doc.tags) && doc.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tags:</span>
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocReaderModal;
