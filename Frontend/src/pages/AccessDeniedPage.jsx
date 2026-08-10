import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Acceso Denegado
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400 mb-2">
          No tienes permisos para acceder a esta sección
        </p>

        <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-8">
          {isAuthenticated
            ? 'Contacta al administrador si crees que es un error'
            : 'Debes iniciar sesión para continuar'}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          )}
        </div>

        {/* Error Code */}
        <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-12 font-mono">
          Error 403 - Forbidden
        </p>
      </div>
    </div>
  );
}
