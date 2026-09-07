import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Inventory from './pages/Inventory';
import Activities from './pages/Activities';
import Schedule from './pages/Schedule';
import WorkOrders from './pages/WorkOrders';
import Users from './pages/Users';
import Catalogs from './pages/Catalogs';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AccessDeniedPage from './pages/AccessDeniedPage';
import HelpModal from './components/HelpModal';
import { useAuth } from './hooks/useAuth';
import './index.css';

// Módulo -> permiso mínimo para verlo. Debe coincidir con Backend/src/config/permissions.js
const TAB_MODULES = {
  dashboard: null, // visible para cualquier usuario autenticado
  workOrders: 'workorders',
  schedule: 'schedule',
  assets: 'assets',
  inventory: 'inventory',
  activities: 'activities',
  catalogs: 'assets',
  users: 'users'
};

export default function App() {
  const { user, isAuthenticated, isInitializing, logout, hasModule } = useAuth();

  // Vista pública: 'landing' o 'login'. Con sesión activa se muestra el CMMS.
  const [publicView, setPublicView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showGlobalHelp, setShowGlobalHelp] = useState(false);

  // Si el usuario pierde acceso al módulo abierto (logout, cambio de rol), volver al dashboard.
  useEffect(() => {
    const module = TAB_MODULES[activeTab];
    if (isAuthenticated && module && !hasModule(module)) {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, activeTab, hasModule]);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard & KPIs';
      case 'workOrders': return 'Órdenes de Trabajo';
      case 'schedule': return 'Cronograma Preventivo';
      case 'assets': return 'Gestión de Activos';
      case 'inventory': return 'Almacén & Kardex';
      case 'activities': return 'Catálogo de Actividades';
      case 'catalogs': return 'Configuración & Catálogos';
      case 'users': return 'Usuarios & Seguridad';
      default: return 'MANSOLE CMMS';
    }
  };

  const handleLogout = async () => {
    await logout();
    setPublicView('login');
    setActiveTab('dashboard');
    setIsMobileOpen(false);
  };

  // Mientras se valida el token guardado, evitar el parpadeo del landing.
  // Solo en el arranque: durante un login en curso el formulario debe seguir montado.
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#F5F6F8', color: '#515254',
        fontSize: '14px', fontWeight: 600
      }}>
        Verificando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        {publicView === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Landing onNavigateToLogin={() => setPublicView('login')} />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Login onNavigateToLanding={() => setPublicView('landing')} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Renderiza el módulo activo solo si el rol tiene acceso.
  const renderTab = () => {
    const module = TAB_MODULES[activeTab];
    if (module && !hasModule(module)) return <AccessDeniedPage />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard currentUser={user} />;
      case 'workOrders': return <WorkOrders currentUser={user} />;
      case 'schedule': return <Schedule currentUser={user} />;
      case 'assets': return <Assets currentUser={user} />;
      case 'inventory': return <Inventory currentUser={user} />;
      case 'activities': return <Activities currentUser={user} />;
      case 'catalogs': return <Catalogs currentUser={user} />;
      case 'users': return <Users currentUser={user} />;
      default: return <Dashboard currentUser={user} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={user}
        onLogout={handleLogout}
        hasModule={hasModule}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <main className="main-content">
        <Navbar
          currentUser={user}
          activeTabTitle={getTabTitle()}
          isMobileOpen={isMobileOpen}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
          onOpenHelp={() => setShowGlobalHelp(true)}
        />

        <div className="page-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modal Global de Ayuda y Procedimientos */}
      <HelpModal 
        isOpen={showGlobalHelp} 
        onClose={() => setShowGlobalHelp(false)} 
        initialModule={activeTab === 'catalogs' ? 'catalogs' : (activeTab === 'inventory' ? 'inventory' : (activeTab === 'schedule' ? 'schedule' : (activeTab === 'assets' ? 'assets' : 'workOrders')))} 
      />
    </div>
  );
}
