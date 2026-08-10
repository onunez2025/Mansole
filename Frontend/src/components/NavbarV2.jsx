import React from 'react';
import { Bell, Database, ShieldCheck } from 'lucide-react';
import { SearchInput, Badge } from './UI';

export default function NavbarV2({ currentUser, activeTabTitle }) {
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between gap-6">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">
            {activeTabTitle}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Corporación Rinnai • Área Producción & Mantenimiento Industrial
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Database Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-success-50 dark:bg-success-900/20 rounded-full border border-success-200 dark:border-success-800">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-success-700 dark:text-success-400 whitespace-nowrap">
              MSSQL Conectado
            </span>
          </div>

          {/* Search */}
          <SearchInput
            placeholder="Buscar OT, activo..."
            className="hidden md:block w-64"
            aria-label="Buscar en el sistema"
          />

          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            aria-label={`${notificationCount} notificaciones`}
            title="Notificaciones"
          >
            <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Info */}
          <div className="flex items-center gap-2 pl-4 border-l border-neutral-200 dark:border-neutral-700">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-semibold text-neutral-900 dark:text-white">{currentUser?.name}</p>
              <Badge variant="info" size="sm">{currentUser?.role}</Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
