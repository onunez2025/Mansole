import React, { useState } from 'react';
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
import './index.css';

export default function App() {
  // Estado de navegación institucional: 'landing', 'login', o 'app'
  const [currentView, setCurrentView] = useState('landing');
  
  // Usuario autenticado por defecto (Se puede cambiar en 1-clic desde el Login)
  const [currentUser, setCurrentUser] = useState({
    name: 'Carlos Admin',
    email: 'admin@gruposole.com',
    role: 'Administrador'
  });

  // Módulo activo dentro del CMMS
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('app');
    setActiveTab('dashboard'); // Entrar al dashboard por defecto al hacer login
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  // Renderizar Landing Page
  if (currentView === 'landing') {
    return <Landing onNavigateToLogin={() => setCurrentView('login')} />;
  }

  // Renderizar Pantalla de Login con Cuentas Demo en 1-Clic
  if (currentView === 'login') {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateToLanding={() => setCurrentView('landing')} 
      />
    );
  }

  // Renderizar Plataforma Interna CMMS (SIATC Monolith)
  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <Navbar 
          currentUser={currentUser} 
          activeTabTitle={getTabTitle()} 
        />
        
        <div className="page-container">
          {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} />}
          {activeTab === 'workOrders' && <WorkOrders currentUser={currentUser} />}
          {activeTab === 'schedule' && <Schedule currentUser={currentUser} />}
          {activeTab === 'assets' && <Assets currentUser={currentUser} />}
          {activeTab === 'inventory' && <Inventory currentUser={currentUser} />}
          {activeTab === 'activities' && <Activities currentUser={currentUser} />}
          {activeTab === 'users' && <Users currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
}
