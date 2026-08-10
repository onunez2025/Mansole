import React from 'react';
import { Bell, Search, Database, ShieldCheck, User, CheckCircle2 } from 'lucide-react';

export default function Navbar({ currentUser, activeTabTitle }) {
  return (
    <header style={{
      height: '74px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E4E9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 36px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      boxShadow: '0 1px 3px rgba(5, 15, 26, 0.03)'
    }}>
      {/* Título de la vista activa */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E', letterSpacing: '-0.2px' }}>
          {activeTabTitle}
        </h2>
        <p style={{ fontSize: '12px', color: '#8A919E', fontWeight: '500' }}>
          Corporación Rinnai • Área Producción & Mantenimiento Industrial
        </p>
      </div>

      {/* Acciones del Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Indicador SQL Server / Azure */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: '#E7F9F0', 
          padding: '6px 14px', 
          borderRadius: '999px',
          border: '1px solid #B8EBD1'
        }}>
          <Database size={15} color="#05B169" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#05B169' }}>
            MSSQL / Azure Blob: Conectado
          </span>
        </div>

        {/* Buscador Rápido de Activo / OT */}
        <div style={{ position: 'relative', width: '250px' }}>
          <Search size={16} color="#8A919E" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar OT, máquina o CECO..." 
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #E2E4E9',
              background: '#F9FAFB',
              color: '#1A1C1E',
              fontSize: '13px',
              fontWeight: '500'
            }}
          />
        </div>

        {/* Alertas de Planta */}
        <button style={{ 
          position: 'relative', 
          padding: '10px', 
          borderRadius: '8px', 
          background: '#F9FAFB',
          border: '1px solid #E2E4E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }} title="Notificaciones de OTs y Cronograma">
          <Bell size={18} color="#4C5F80" />
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#DF2935',
            color: 'white',
            fontSize: '10px',
            fontWeight: '800',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            3
          </span>
        </button>
      </div>
    </header>
  );
}
