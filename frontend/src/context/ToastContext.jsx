import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100/90 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-100/90 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container: Clears bottom nav on mobile (bottom-20), anchored at bottom-6 on desktop */}
      <div className="fixed bottom-20 sm:bottom-6 right-0 sm:right-6 left-0 sm:left-auto mx-auto sm:mx-0 z-[100] max-w-sm sm:max-w-md w-full px-3.5 sm:px-0 pointer-events-none flex flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl flex items-center gap-3 text-neutral-900 ring-1 ring-black/5"
            >
              {getToastIcon(toast.type)}
              <p className="text-xs sm:text-sm font-semibold text-neutral-900 flex-1 leading-snug break-words">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

