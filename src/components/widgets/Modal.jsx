import React, { useEffect } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  headerActions = null,
  footer = null,
  noPadding = false,
  containerClassName = ''
}) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" onClick={onClose}>
      <div
        className={`card w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl transition-all animate-slide-up overflow-hidden ${containerClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 rounded-lg hover:bg-gray-100 transition"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        </div>
        <div className={`flex flex-col flex-1 min-h-0 ${noPadding ? 'overflow-hidden' : 'p-6 overflow-y-auto'}`}>
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
