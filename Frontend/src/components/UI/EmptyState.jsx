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

export function CardSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="siatc-card" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '22px 24px' }}>
          <div className="skeleton" style={{ width: '54px', height: '54px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '12px', width: '60%' }} />
            <div className="skeleton" style={{ height: '24px', width: '40%' }} />
            <div className="skeleton" style={{ height: '10px', width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="siatc-card" style={{ padding: '24px' }}>
      <div className="skeleton" style={{ height: '20px', width: '250px', marginBottom: '18px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="skeleton" style={{ height: '36px', flex: c === 1 ? 2 : 1, borderRadius: '6px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderCardSkeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="siatc-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', gap: '18px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '280px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="skeleton" style={{ height: '22px', width: '100px' }} />
              <div className="skeleton" style={{ height: '22px', width: '80px', borderRadius: '999px' }} />
              <div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '999px' }} />
            </div>
            <div className="skeleton" style={{ height: '22px', width: '80%' }} />
            <div className="skeleton" style={{ height: '14px', width: '50%' }} />
          </div>
          <div className="skeleton" style={{ height: '70px', width: '240px', borderRadius: '10px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="skeleton" style={{ height: '40px', width: '120px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '40px', width: '90px', borderRadius: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

