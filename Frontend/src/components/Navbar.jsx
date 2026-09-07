import React from 'react';
import { Bell, Search, Menu, X, Database } from 'lucide-react';

export default function Navbar({ currentUser, activeTabTitle, onToggleMobileMenu, isMobileOpen }) {
  return (
    <header className="h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-40 flex items-center justify-between gap-4">
      {/* Botón Hamburguesa Móvil + Título de la vista activa */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Menú de Navegación"
          aria-label="Abrir menú de navegación"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
            {activeTabTitle}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none">
            Rinnai Perú • Planta Industrial
          </p>
        </div>
      </div>

      {/* Acciones del Navbar y Telemetría */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Indicador SQL Server / Azure Telemetry */}
        <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>Azure SQL Online</span>
        </div>

        {/* Buscador Rápido */}
        <div className="relative hidden md:block w-56 lg:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en el sistema..." 
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </kbd>
        </div>

        {/* Alertas y Notificaciones */}
        <button 
          className="relative p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Notificaciones"
        >
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
