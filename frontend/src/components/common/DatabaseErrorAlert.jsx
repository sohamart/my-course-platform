import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const DatabaseErrorAlert = ({
  message = 'Not connected to database. Please contact developer.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[26px] p-5 sm:p-6 bg-rose-50/95 border border-rose-200 shadow-glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-900">Database Connection Error</h3>
          <p className="text-xs text-rose-700 mt-0.5 font-medium">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};

export default DatabaseErrorAlert;

