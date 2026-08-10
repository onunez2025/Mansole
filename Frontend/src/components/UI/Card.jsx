import React from 'react';

export function Card({ children, className = '', elevated = false }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 transition-smooth ${
        elevated
          ? 'shadow-md hover:shadow-lg'
          : 'shadow-sm hover:shadow-md'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl font-bold text-neutral-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-neutral-600 dark:text-neutral-400 mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 ${className}`}>
      {children}
    </div>
  );
}
