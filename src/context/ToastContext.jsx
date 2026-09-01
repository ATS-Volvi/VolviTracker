import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-up transition-all ${
              toast.type === 'success'
                ? 'bg-gray-900 text-white border-gray-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : toast.type === 'ai'
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white border-indigo-700'
                : 'bg-white text-gray-900 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <span className="text-emerald-400">✓</span>}
              {toast.type === 'ai' && <span className="text-amber-300">✨</span>}
              {toast.type === 'error' && <span className="text-rose-400">✕</span>}
              {toast.type === 'info' && <span className="text-blue-400">ℹ</span>}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  return ctx || { addToast: () => {} };
};
