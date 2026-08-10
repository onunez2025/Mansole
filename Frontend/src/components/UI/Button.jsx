import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50 focus-visible:outline-neutral-900 shadow-sm',
    danger: 'bg-error-500 text-white hover:bg-error-700 focus-visible:outline-error-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 focus-visible:outline-primary-500',
    ai: 'bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200 focus-visible:outline-purple-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}
