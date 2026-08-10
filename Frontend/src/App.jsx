import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Inventory from './pages/Inventory';
import Activities from './pages/Activities';
import Schedule from './pages/Schedule';
import WorkOrders from './pages/WorkOrders';
import Users from './pages/Users';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AccessDeniedPage from './pages/AccessDeniedPage';
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
  users: 'users'
};

export default function App() {
  const { user, isAuthenticated, isInitializing, logout, hasModule } = useAuth();

  // Vista pública: 'landing' o 'login'. Con sesión activa se muestra el CMMS.
  const [publicView, setPublicView] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Si el usuario pierde acceso al módulo abierto (logout, cambio de rol), volver al dashboard.
  useEffect(() => {
    const module = TAB_MODULES[activeTab];
    if (isAuthenticated && module && !hasModule(module)) {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, activeTab, hasModule]);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard de Indicadores y KPIs';
      case 'workOrders': return 'Control de Órdenes de Trabajo (OT) & IA';
      case 'schedule': return 'Cronograma de Mantenimiento Preventivo';
      case 'assets': return 'Gestión de Activos, Áreas y CECOs';
      case 'inventory': return 'Repuestos, Almacén & Canibalización';
      case 'activities': return 'Catálogo Maestro de Actividades';
      case 'users': return 'Gestión de Usuarios & Seguridad RBAC';
      default: return 'Plataforma CMMS Grupo SOLE';
    }
  };

  const handleLogout = async () => {
    await logout();
    setPublicView('login');
    setActiveTab('dashboard');
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
    if (publicView === 'landing') {
      return <Landing onNavigateToLogin={() => setPublicView('login')} />;
    }

    return <Login onNavigateToLanding={() => setPublicView('landing')} />;
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
      />

      <main className="main-content">
        <Navbar
          currentUser={user}
          activeTabTitle={getTabTitle()}
        />

        <div className="page-container">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
