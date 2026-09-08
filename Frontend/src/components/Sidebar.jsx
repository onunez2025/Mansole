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
  GitPullRequest
} from 'lucide-react';
import { CURRENT_VERSION } from '../data/changelogData';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, hasModule, isMobileOpen, onCloseMobile, onOpenChangelog }) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard size={18} /> },
    { id: 'workOrders', label: 'Órdenes de Trabajo (OT)', icon: <Hammer size={18} />, badge: 'Principal', module: 'workorders' },
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
        <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                GRUPO SOLE
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  CMMS Industrial
                </p>
                <button
                  onClick={onOpenChangelog}
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
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
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Status de Conexión */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Planta Lima-Norte</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        {/* Navegación por Módulos */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navegación
          </div>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className={isActive ? 'text-slate-900' : 'text-slate-400'}>
                  {item.icon}
                </div>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tarjeta de Asistente IA */}
          <div className="pt-4 mt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Asistente IA</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Diagnóstico de fallas y recomendaciones de mantenimiento integradas en OTs.
              </p>
            </div>
          </div>
        </nav>

        {/* Acceso directo a Novedades / Changelog */}
        <div className="px-3 py-2 border-t border-slate-200/80 bg-slate-50/60">
          <button
            onClick={onOpenChangelog}
            className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white hover:shadow-2xs transition-all cursor-pointer group"
            title="Historial de versiones y Pull Requests publicados"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <GitPullRequest size={13} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Novedades & Releases</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/70">
              {CURRENT_VERSION}
            </span>
          </button>
        </div>

        {/* Pie de Sidebar: Perfil y Logout */}
        <div className="p-3 border-t border-slate-200/80 bg-white">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.name || 'Usuario'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser?.role || 'Operador'}
                </div>
              </div>
            </div>

            <button 
              onClick={onLogout} 
              title="Cerrar sesión" 
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
