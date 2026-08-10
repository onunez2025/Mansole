import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export function Alert({ variant = 'info', title, description, closeable = false, onClose, className = '' }) {
  const icons = {
    success: <CheckCircle2 size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const styles = {
    success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-700 dark:text-success-400',
    error: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-700 dark:text-error-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-700 dark:text-warning-400',
    info: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800 text-info-700 dark:text-info-400',
  };

  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${styles[variant]} ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      {closeable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-smooth"
          aria-label="Cerrar alerta"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
