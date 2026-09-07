import React from 'react';
import { Bell, Search, Database, Menu, X, Activity, Cpu } from 'lucide-react';

export default function Navbar({ currentUser, activeTabTitle, onToggleMobileMenu, isMobileOpen }) {
  return (
    <header className="px-4 md:px-8" style={{
      minHeight: '70px',
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      flexWrap: 'wrap',
      gap: '12px',
      paddingTop: '8px',
      paddingBottom: '8px'
    }}>
      {/* Botón Hamburguesa Móvil + Título de la vista activa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden"
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#38BDF8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            minHeight: '40px'
          }}
          title="Menú de Navegación"
          aria-label="Abrir menú de navegación"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.2px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeTabTitle}</span>
          </h2>
          <p style={{ fontSize: '11px', color: '#38BDF8', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '0.8px', margin: 0 }}>
            // RINNAI PERÚ • PLANTA INDUSTRIAL INDUSTRIAL-01
          </p>
        </div>
      </div>

      {/* Acciones del Navbar y Telemetría */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Indicador SQL Server / Azure Telemetry */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(16, 185, 129, 0.1)', 
          padding: '6px 14px', 
          borderRadius: '999px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px #10B981',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10B981', fontFamily: 'monospace' }}>
            AZURE SQL // 16ms
          </span>
        </div>

        {/* Buscador Rápido de Activo / OT - Cyber Style */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={15} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar OT, activo, CECO..." 
            style={{
              width: '100%',
              padding: '7px 12px 7px 34px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.6)',
              color: '#F8FAFC',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.2)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Alertas de Planta con Badge Holográfico */}
        <button style={{ 
          position: 'relative', 
          padding: '8px 10px', 
          borderRadius: '8px', 
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#94A3B8',
          transition: 'all 0.2s ease'
        }} 
        onMouseEnter={e => { e.currentTarget.style.color = '#38BDF8'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
        title="Notificaciones de OTs y Alertas Críticas"
        >
          <Bell size={17} />
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
            color: 'white',
            fontSize: '9px',
            fontWeight: '900',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
            fontFamily: 'monospace'
          }}>
            3
          </span>
        </button>
      </div>
    </header>
  );
}
