import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Se muestra dentro del shell cuando el rol no tiene permiso sobre el módulo.
 * La app navega por estado (no hay router), así que no hay "volver atrás":
 * el usuario cambia de módulo desde el sidebar.
 */
export default function AccessDeniedPage() {
  const { logout, isAuthenticated, user } = useAuth();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '420px', padding: '24px'
    }}>
      <div className="siatc-card" style={{ maxWidth: '460px', textAlign: 'center', padding: '36px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', background: '#FDF1F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <Shield size={34} color="#DF2935" />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1C1E', marginBottom: '8px' }}>
          Acceso Denegado
        </h2>

        <p style={{ fontSize: '14px', color: '#515254', marginBottom: '6px' }}>
          Tu rol no tiene permisos sobre este módulo.
        </p>

        <p style={{ fontSize: '13px', color: '#8A919E', marginBottom: '24px' }}>
          {isAuthenticated
            ? `Sesión iniciada como ${user?.name || user?.email} (${user?.role || 'sin rol'}). Contacta al administrador si crees que es un error.`
            : 'Debes iniciar sesión para continuar.'}
        </p>

        {isAuthenticated && (
          <button onClick={logout} className="btn btn-secondary" style={{ margin: '0 auto' }}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        )}

        <p style={{ fontSize: '11px', color: '#B0B5BD', marginTop: '28px', fontFamily: 'monospace' }}>
          Error 403 — Forbidden
        </p>
      </div>
    </div>
  );
}
