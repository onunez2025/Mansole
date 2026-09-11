import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Boxes, 
  ClipboardList, 
  CalendarClock, 
  Hammer, 
  Bot,
  Users,
  LogOut,
  X,
  Sparkles,
  Settings,
  GitPullRequest,
  FileText
} from 'lucide-react';
import { CURRENT_VERSION } from '../data/changelogData';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, hasModule, isMobileOpen, onCloseMobile, onOpenChangelog }) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard size={18} /> },
    { id: 'workOrders', label: 'Órdenes de Trabajo (OT)', icon: <Hammer size={18} />, badge: 'Principal', module: 'workorders' },
    { id: 'reports', label: 'Reportes & Historial', icon: <FileText size={18} />, module: 'workorders', badge: 'Nuevo' },
    { id: 'schedule', label: 'Cronograma Preventivo', icon: <CalendarClock size={18} />, module: 'schedule' },
    { id: 'assets', label: 'Activos y CECOs', icon: <Wrench size={18} />, module: 'assets' },
    { id: 'inventory', label: 'Repuestos / Almacén', icon: <Boxes size={18} />, module: 'inventory' },
    { id: 'activities', label: 'Catálogo Actividades', icon: <ClipboardList size={18} />, module: 'activities' },
    { id: 'catalogs', label: 'Configuración & Catálogos', icon: <Settings size={18} />, module: 'assets', badge: 'Admin' },
    { id: 'users', label: 'Usuarios & RBAC', icon: <Users size={18} />, module: 'users' }
  ];

  // Ocultar los módulos que el rol no puede abrir
  const menuItems = hasModule
    ? allMenuItems.filter(item => !item.module || hasModule(item.module))
    : allMenuItems;

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Telón oscuro para celular/tableta */}
      <div 
        className={`sidebar-backdrop ${isMobileOpen ? 'open' : ''}`} 
        onClick={onCloseMobile} 
      />

      <aside className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        {/* Branding Grupo SOLE */}
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                GRUPO SOLE
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                  CMMS Industrial
                </p>
                <button
                  onClick={onOpenChangelog}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                  title="Ver qué hay de nuevo en esta versión"
                >
                  {CURRENT_VERSION}
                </button>
              </div>
            </div>
          </div>

          {/* Botón cerrar para vista móvil */}
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Status de Conexión */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Planta Lima-Norte</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        {/* Navegación por Módulos */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navegación
          </div>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </div>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tarjeta de Asistente IA */}
          <div className="pt-4 mt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 mb-1">
                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Asistente IA</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Diagnóstico de fallas y recomendaciones de mantenimiento integradas en OTs.
              </p>
            </div>
          </div>
        </nav>

        {/* Acceso directo a Novedades / Changelog */}
        <div className="px-3 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60">
          <button
            onClick={onOpenChangelog}
            className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs transition-all cursor-pointer group"
            title="Historial de versiones y Pull Requests publicados"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <GitPullRequest size={13} className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Novedades & Releases</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200/70 dark:border-indigo-800/70">
              {CURRENT_VERSION}
            </span>
          </button>
        </div>

        {/* Pie de Sidebar: Perfil y Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser?.name || 'Usuario'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser?.role || 'Operador'}
                </div>
              </div>
            </div>

            <button 
              onClick={onLogout} 
              title="Cerrar sesión" 
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors flex-shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
