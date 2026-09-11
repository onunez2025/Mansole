import { 
  Bell, Search, Menu, X, HelpCircle, AlertTriangle, 
  Clock, CheckCircle2, Info, Trash2, CheckCheck, ExternalLink,
  GitPullRequest, Sun, Moon
} from 'lucide-react';
import { CURRENT_VERSION } from '../data/changelogData';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar({ currentUser, activeTabTitle, onToggleMobileMenu, isMobileOpen, onOpenHelp, onOpenChangelog }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Parada no programada (Urgente)',
      message: 'OT-2026-089 en [PRENSA-01] Prensa Hidráulica 100T Rexroth. Pérdida de presión en línea de estampado.',
      time: 'Hace 8 min',
      type: 'danger',
      read: false,
    },
    {
      id: 2,
      title: 'Mantenimiento Preventivo Próximo',
      message: 'Inspección de quemadores y termocuplas en [HORNO-01] programado para dentro de 48 hrs.',
      time: 'Hace 45 min',
      type: 'warning',
      read: false,
    },
    {
      id: 3,
      title: 'Canibalización $0 Registrada',
      message: 'Reutilización de válvula solenoide 4/3 aprobada con ahorro de $320 USD para CECO-SOL-101.',
      time: 'Hace 2 hrs',
      type: 'success',
      read: false,
    },
    {
      id: 4,
      title: 'Auditoría RBAC de Permisos',
      message: 'Se actualizaron las capacidades operativas para el perfil "Supervisor de Planta".',
      time: 'Hoy 08:30 AM',
      type: 'info',
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={15} className="text-red-600" />;
      case 'warning':
        return <Clock size={15} className="text-amber-600" />;
      case 'success':
        return <CheckCircle2 size={15} className="text-emerald-600" />;
      default:
        return <Info size={15} className="text-blue-600" />;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
      {/* Botón Hamburguesa Móvil + Título de la vista activa */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          title="Menú de Navegación"
          aria-label="Abrir menú de navegación"
        >
          {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
            {activeTabTitle}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block leading-none truncate">
            Rinnai Perú • Planta Industrial
          </p>
        </div>
      </div>

      {/* Acciones del Navbar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Buscador Rápido */}
        <div className="relative hidden lg:block w-52 xl:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en el sistema..." 
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ⌘K
          </kbd>
        </div>

        {/* Conmutador de Modo Claro / Modo Oscuro */}
        <button
          onClick={toggleTheme}
          className={`p-1.5 sm:p-2 rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
            isDark 
              ? 'border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-xs ring-1 ring-amber-400/20' 
              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
          }`}
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDark ? (
            <Sun size={15} className="transition-transform hover:rotate-45" />
          ) : (
            <Moon size={15} className="transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Botón Central de Ayuda y Procedimientos */}
        <button
          onClick={onOpenHelp}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          title="Manual de Procedimientos SOP"
        >
          <HelpCircle size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="hidden sm:inline">Manual SOP</span>
        </button>

        {/* Botón y Badge de Versión / Changelog */}
        <button
          onClick={onOpenChangelog}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-slate-750 text-xs font-semibold transition-all shadow-xs cursor-pointer group"
          title="Registro de Versiones y Pull Requests (Changelog)"
        >
          <GitPullRequest size={14} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{CURRENT_VERSION}</span>
          <span className="hidden xl:inline text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
            Changelog
          </span>
        </button>

        {/* Alertas y Notificaciones con Menú Desplegable Interactivo */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(prev => !prev)}
            className={`relative p-1.5 sm:p-2 rounded-lg border transition-colors flex-shrink-0 cursor-pointer ${
              showNotifications 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
            title="Centro de Notificaciones"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Panel Flotante de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fadeIn">
              {/* Cabecera del Panel */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificaciones</h4>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                      {unreadCount} nuevas
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Al día
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Marcar todas como leídas"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden xs:inline">Leídas</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Lista de Notificaciones */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No hay notificaciones pendientes</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">La planta opera bajo condiciones normales.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 cursor-pointer group relative ${
                        !n.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getTypeBg(n.type)}`}>
                        {getTypeIcon(n.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold truncate ${!n.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded transition-all cursor-pointer shrink-0"
                        title="Eliminar notificación"
                      >
                        <Trash2 size={13} />
                      </button>

                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 absolute right-2.5 top-3" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pie del Panel */}
              <div className="p-2.5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  Monitoreo en vivo de planta • MANSOLE
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
