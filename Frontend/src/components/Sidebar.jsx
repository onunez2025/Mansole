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
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, hasModule, isMobileOpen, onCloseMobile }) {
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

      <aside className={`sidebar-container ${isMobileOpen ? 'open' : ''}`} style={{
        background: '#070B14',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Branding Grupo SOLE - Cyber Industrial */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: '20px',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
            }}>
              S
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.4px', margin: 0 }}>
                GRUPO SOLE
              </h1>
              <p style={{ fontSize: '10px', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.8px', fontFamily: 'monospace', margin: 0 }}>
                CMMS RINNAI // v4.2
              </p>
            </div>
          </div>

          {/* Botón cerrar para vista móvil */}
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="lg:hidden"
              title="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Subheader Status Telemetría */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ 
            padding: '6px 10px', 
            background: 'rgba(15, 23, 42, 0.8)', 
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            fontWeight: '700',
            fontFamily: 'monospace',
            color: '#94A3B8'
          }}>
            <span>NODO LIMA-NORTE</span>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', display: 'inline-block' }} />
              ONLINE
            </span>
          </div>
        </div>

      {/* Navegación por Módulos */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', padding: '0 12px', marginBottom: '8px', letterSpacing: '1px', fontFamily: 'monospace' }}>
          // CONTROL MAESTRO
        </div>
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '8px',
                width: '100%',
                textAlign: 'left',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.03) 100%)' 
                  : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
                borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                boxShadow: isActive ? 'inset 0 0 12px rgba(56, 189, 248, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#38BDF8'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; } }}
            >
              <div style={{ color: isActive ? '#38BDF8' : 'inherit' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', 
                  color: '#FFFFFF', 
                  fontSize: '9px', 
                  fontWeight: '800', 
                  padding: '2px 6px', 
                  borderRadius: '999px',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {item.highlight}
                </span>
              )}
            </button>
          );
        })}

        {/* Separador e IA Asistente */}
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '14px 6px' }} />
        <div style={{ 
          padding: '14px', 
          background: 'rgba(124, 58, 237, 0.1)', 
          borderRadius: '10px', 
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 0 15px rgba(124, 58, 237, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C084FC', fontWeight: '800', fontSize: '12px', marginBottom: '6px', fontFamily: 'monospace' }}>
            <Bot size={16} /> MOTOR IA ACTIVO
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>
            Diagnóstico predictivo de fallas con heurística industrial habilitado en OTs.
          </p>
        </div>
      </nav>

      {/* Pie de Sidebar: Perfil y Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#050810' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '800', 
              fontSize: '14px',
              boxShadow: '0 0 10px rgba(14, 165, 233, 0.3)'
            }}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>{currentUser?.name || 'Carlos Admin'}</div>
              <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '600', display: 'block', fontFamily: 'monospace' }}>
                {currentUser?.role || 'Administrador'}
              </span>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            title="Desconectar sesión y volver al login" 
            style={{ 
              padding: '8px', 
              color: '#64748B', 
              background: 'rgba(255, 255, 255, 0.04)', 
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.06)', 
              cursor: 'pointer', 
              transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  </>
);
}
