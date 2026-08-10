import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AccessDeniedPage from '../pages/AccessDeniedPage';

export default function ProtectedRoute({
  permission,
  module,
  children,
  fallback = <AccessDeniedPage />
}) {
  const { hasPermission, hasModule, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-neutral-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback;
  }

  // Verificar permiso específico
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Verificar módulo
  if (module && !hasModule(module)) {
    return fallback;
  }

  return children;
}
