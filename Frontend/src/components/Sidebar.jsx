import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Boxes, 
  ClipboardList, 
  CalendarClock, 
  Hammer, 
  ShieldCheck,
  Bot,
  Users,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, hasModule }) {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard size={19} /> },
    { id: 'workOrders', label: 'Órdenes de Trabajo (OT)', icon: <Hammer size={19} />, highlight: 'PRO', module: 'workorders' },
    { id: 'schedule', label: 'Cronograma Preventivo', icon: <CalendarClock size={19} />, module: 'schedule' },
    { id: 'assets', label: 'Activos y CECOs', icon: <Wrench size={19} />, module: 'assets' },
    { id: 'inventory', label: 'Repuestos / Almacén', icon: <Boxes size={19} />, module: 'inventory' },
    { id: 'activities', label: 'Catálogo Actividades', icon: <ClipboardList size={19} />, module: 'activities' },
    { id: 'users', label: 'Usuarios & RBAC', icon: <Users size={19} />, module: 'users' }
  ];

  // Ocultar los módulos que el rol no puede abrir. Sin hasModule (uso fuera de
  // AuthProvider) se muestran todos, y el backend sigue siendo quien decide.
  const menuItems = hasModule
    ? allMenuItems.filter(item => !item.module || hasModule(item.module))
    : allMenuItems;

  return (
    <aside style={{
      width: '260px',
      position: 'fixed',
      left: 0,
      top: 0,
      height: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E2E4E9',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '1px 0 3px rgba(5, 15, 26, 0.03)'
    }}>
      {/* Branding Grupo SOLE - SIATC Style */}
      <div style={{ padding: '24px', borderBottom: '1px solid #E2E4E9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#4C5F80',
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: '20px',
            boxShadow: '0 2px 6px rgba(76, 95, 128, 0.2)'
          }}>
            S
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1C1E', letterSpacing: '0.2px' }}>
              GRUPO SOLE
            </h1>
            <p style={{ fontSize: '11px', color: '#4C5F80', fontWeight: '700', letterSpacing: '0.5px' }}>
              CMMS CORPORACIÓN RINNAI
            </p>
          </div>
        </div>
        <div style={{ 
          marginTop: '14px', 
          padding: '6px 10px', 
          background: '#F3F5F9', 
          borderRadius: '6px',
          border: '1px solid #D8DCE5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: '700',
          color: '#4C5F80'
        }}>
          <span>SIATC CLOUD MONOLITH</span>
          <span style={{ color: '#05B169' }}>● ACTIVO</span>
        </div>
      </div>

      {/* Navegación por Módulos */}
      <nav style={{ flex: 1, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#8A919E', textTransform: 'uppercase', padding: '0 12px', marginBottom: '8px', letterSpacing: '0.5px' }}>
          Módulos Operativos
        </div>
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                width: '100%',
                textAlign: 'left',
                background: isActive ? '#E8EEF8' : 'transparent',
                color: isActive ? '#4C5F80' : '#515254',
                fontWeight: isActive ? '700' : '600',
                fontSize: '14px',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                border: isActive ? '1px solid #CCD8ED' : '1px solid transparent'
              }}
              onMouseEnter={(e) => { if (!isActive) e.target.style.background = '#F5F7FA'; }}
              onMouseLeave={(e) => { if (!isActive) e.target.style.background = 'transparent'; }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && (
                <span style={{ background: '#DF2935', color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px' }}>
                  {item.highlight}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador e IA Asistente */}
        <div style={{ height: '1px', background: '#E2E4E9', margin: '12px 6px' }} />
        <div style={{ padding: '12px', background: '#F2EEFE', borderRadius: '10px', border: '1px solid #D5C3FD' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6A35E0', fontWeight: '800', fontSize: '13px', marginBottom: '6px' }}>
            <Bot size={18} /> Asistente IA Activo
          </div>
          <p style={{ fontSize: '11px', color: '#515254', lineHeight: 1.4, margin: 0 }}>
            Diagnóstico predictivo de fallas habilitado en el módulo de Órdenes de Trabajo.
          </p>
        </div>
      </nav>

      {/* Pie de Sidebar: Perfil y Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E4E9', background: '#F9FAFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#4C5F80', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px' }}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A1C1E' }}>{currentUser?.name || 'Carlos Admin'}</div>
              <span style={{ fontSize: '11px', color: '#4C5F80', fontWeight: '700', display: 'block' }}>
                {currentUser?.role || 'Administrador'}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            title="Cerrar Sesión y Volver al Login" 
            style={{ padding: '8px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#DF2935'}
            onMouseLeave={e => e.target.style.color = '#8A919E'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
