import React from 'react';
import { Search, AlertCircle } from 'lucide-react';

export function Input({
  error,
  icon: Icon,
  type = 'text',
  className = '',
  id,
  label,
  required,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const descId = `${inputId}-desc`;

  const describedBy = [
    ariaDescribedBy,
    error ? errorId : null,
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="requerido">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true">
            <Icon size={18} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`w-full px-4 py-2.5 text-sm border rounded-md transition-smooth bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-error-300 focus:outline-none focus:ring-2 focus:ring-error-200'
              : 'border-neutral-200 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900'
          } disabled:bg-neutral-50 disabled:cursor-not-allowed`}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500" aria-hidden="true">
            <AlertCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-xs text-error-600 dark:text-error-400 flex items-center gap-1" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function SearchInput({ className = '', ...props }) {
  return (
    <Input
      type="search"
      icon={Search}
      placeholder="Buscar..."
      aria-label="Buscar en la plataforma"
      className={className}
      {...props}
    />
  );
}

export function FormGroup({ label, error, children, required, className = '' }) {
  const groupId = `form-group-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2" id={groupId}>
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="requerido">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-error-600 dark:text-error-400 flex items-center gap-1" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
