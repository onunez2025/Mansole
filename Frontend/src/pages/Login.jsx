import React, { useState } from 'react';
import { Shield, UserCheck, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess, onNavigateToLanding }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Perfiles Demo Precargados para Evaluación Rápida en 1 Clic
  const demoProfiles = [
    {
      name: 'Carlos Admin',
      email: 'admin@gruposole.com',
      role: 'Administrador',
      roleDescription: 'Acceso Total, Matriz RBAC, Canibalización $0 y Reprogramación',
      badgeClass: 'badge-info',
      avatarColor: '#4C5F80'
    },
    {
      name: 'Roberto Supervisor',
      email: 'supervisor@gruposole.com',
      role: 'Supervisor de Planta',
      roleDescription: 'Reprogramar fechas preventivo, aprobar OTs y consultar IA',
      badgeClass: 'badge-success',
      avatarColor: '#05B169'
    },
    {
      name: 'Juan Pérez (Técnico)',
      email: 'tecnico@gruposole.com',
      role: 'Técnico',
      roleDescription: 'Ejecutar OTs, reportar canibalizaciones al $0 y diagnóstico IA',
      badgeClass: 'badge-warning',
      avatarColor: '#E58D14'
    },
    {
      name: 'Ana Vásquez',
      email: 'operador@gruposole.com',
      role: 'Operario de Máquina',
      roleDescription: 'Solo solicitar incidencias y ver estado operativa de su Área/CECO',
      badgeClass: 'badge-danger',
      avatarColor: '#DF2935'
    }
  ];

  const handleManualLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor ingresa tus credenciales corporativas.');
      return;
    }

    const found = demoProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (found) {
      onLoginSuccess(found);
    } else {
      // Login genérico como supervisor por defecto en demostración
      onLoginSuccess({
        name: email.split('@')[0],
        email: email,
        role: 'Supervisor de Planta',
        badgeClass: 'badge-info'
      });
    }
  };

  const handleQuickLogin = (profile) => {
    onLoginSuccess(profile);
  };

  return (
    <div style={{ 
      background: '#F9FAFB', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px' 
    }}>
      <div style={{ maxWidth: '960px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* Caja Izquierda: Login Manual SIATC */}
        <div className="siatc-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              background: '#4C5F80',
              color: '#FFFFFF',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '22px'
            }}>
              S
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1C1E' }}>GRUPO SOLE</h2>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#4C5F80', letterSpacing: '0.5px' }}>
                ACCESO AL SISTEMA CMMS
              </span>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#515254', marginBottom: '24px' }}>
            Ingresa con tu cuenta de red o selecciona un usuario demo a la derecha para auditar permisos RBAC.
          </p>

          {error && (
            <div style={{ padding: '12px', background: '#FDF1F2', color: '#DF2935', borderRadius: '8px', fontSize: '13px', marginBottom: '18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleManualLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="form-group">
              <label>Correo Corporativo (@gruposole.com)</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@gruposole.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Contraseña de Red SIATC</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 'auto', padding: '12px', fontSize: '15px' }}>
              Iniciar Sesión Seguro <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={onNavigateToLanding} style={{ fontSize: '13px', color: '#4C5F80', fontWeight: '600', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Volver al Landing Institucional
            </button>
          </div>
        </div>

        {/* Caja Derecha: Selector de Perfiles Demo RBAC en 1-Clic */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4C5F80', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ⚡ Pruebas de Evaluación Rápida
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1C1E', marginTop: '4px' }}>
              Selecciona un Rol de Trabajo
            </h3>
            <p style={{ fontSize: '14px', color: '#515254', marginTop: '4px' }}>
              Haz clic sobre cualquier perfil para iniciar sesión inmediatamente con ese nivel de privilegios y evaluar la matriz de permisos (RBAC):
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {demoProfiles.map((p, idx) => (
              <div 
                key={idx}
                onClick={() => handleQuickLogin(p)}
                className="siatc-card"
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  cursor: 'pointer',
                  border: '1px solid #E2E4E9',
                  transition: 'all 0.2s'
                }}
                title={`Entrar con un clic como ${p.role}`}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: p.avatarColor, 
                  color: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <strong style={{ color: '#1A1C1E', fontSize: '15px' }}>{p.name}</strong>
                    <span className={`badge ${p.badgeClass}`}>{p.role}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    {p.roleDescription}
                  </p>
                </div>
                <div style={{ color: '#4C5F80', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Entrar →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
