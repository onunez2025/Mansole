import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const baseStyles = 'inline-flex items-center gap-1 font-semibold rounded-full';

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variants = {
    neutral: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300',
    success: 'bg-success-50 text-success-700 border border-success-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    info: 'bg-info-50 text-info-700 border border-info-200',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
