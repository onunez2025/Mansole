import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, FileQuestion, Package, AlertCircle } from 'lucide-react';
import { Button } from './Button';

const icons = {
  empty: Inbox,
  notfound: FileQuestion,
  noresults: Package,
  error: AlertCircle,
};

export function EmptyState({
  type = 'empty',
  title,
  description,
  action,
  onAction,
  className = '',
}) {
  const Icon = icons[type] || icons.empty;

  const colors = {
    empty: 'text-neutral-400',
    notfound: 'text-warning-500',
    noresults: 'text-info-500',
    error: 'text-error-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}
    >
      <div className={`mb-4 ${colors[type]}`}>
        <Icon size={48} className="opacity-40" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title || 'Sin datos'}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-6">
        {description || 'No hay nada que mostrar en este momento'}
      </p>
      {action && (
        <Button variant="primary" onClick={onAction}>
          {action}
        </Button>
      )}
    </motion.div>
  );
}

export function LoadingSpinner({ size = 'md', text = 'Cargando...' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} border-3 border-neutral-200 dark:border-neutral-700 border-t-primary-500 rounded-full`}
    />
  );
}

export function LoadingContainer({ children, isLoading, size = 'md' }) {
  if (!isLoading) return children;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size={size} />
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">Cargando datos...</p>
    </div>
  );
}
