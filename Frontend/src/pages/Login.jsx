import React, { useState } from 'react';
import { Shield, UserCheck, Lock, ArrowRight, CheckCircle2, AlertCircle, Terminal, Cpu, Zap, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login({ onNavigateToLanding }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const knownAccounts = [
    {
      id: 'admin',
      name: 'Carlos Admin',
      email: 'admin@gruposole.com',
      role: 'Administrador',
      roleBadge: 'CONTROL TOTAL',
      roleDescription: 'Acceso Total, Matriz RBAC, Canibalización $0 y Reprogramación',
      badgeColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.3)',
      icon: <Shield size={20} color="#38BDF8" />
    },
    {
      id: 'supervisor',
      name: 'Roberto Supervisor',
      email: 'supervisor@gruposole.com',
      role: 'Supervisor',
      roleBadge: 'SUPERVISIÓN',
      roleDescription: 'Reprogramar fechas preventivo, aprobar OTs y consultar IA',
      badgeColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.3)',
      icon: <UserCheck size={20} color="#10B981" />
    },
    {
      id: 'tecnico',
      name: 'Juan Pérez',
      email: 'tecnico@gruposole.com',
      role: 'Técnico de Planta',
      roleBadge: 'CAMPO / TÉCNICO',
      roleDescription: 'Ejecutar OTs, reportar canibalizaciones al $0 y diagnóstico IA',
      badgeColor: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.3)',
      icon: <Zap size={20} color="#F59E0B" />
    },
    {
      id: 'operador',
      name: 'Ana Vásquez',
      email: 'operador@gruposole.com',
      role: 'Operador de Línea',
      roleBadge: 'LÍNEA PRODUCCIÓN',
      roleDescription: 'Reporte rápido de averías y visualización de estatus de su Área/CECO',
      badgeColor: '#A855F7',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      icon: <Activity size={20} color="#A855F7" />
    }
  ];

  const handleManualLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor ingresa o selecciona credenciales válidas.');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handlePickAccount = (account, autoSubmit = false) => {
    setEmail(account.email);
    setPassword('123');
    setSelectedRole(account.id);
    setError('');

    if (autoSubmit) {
      login(account.email, '123').then(res => {
        if (!res.success) setError(res.error);
      });
    }
  };

  return (
    <div className="cyber-bg cyber-grid" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Luces ambientales holográficas */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      {/* Top Banner de Telemetría */}
      <div style={{
        maxWidth: '1080px',
        width: '100%',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 10px #10B981'
          }} />
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94A3B8', letterSpacing: '1px' }}>
            NODO CENTRAL: LIMA-NORTE // STATUS: OPERACIONAL // TLS 1.3
          </span>
        </div>
        <button
          onClick={onNavigateToLanding}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38BDF8',
            fontSize: '12px',
            fontFamily: 'monospace',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← PORTAL INSTITUCIONAL
        </button>
      </div>

      <div style={{ 
        maxWidth: '1080px', 
        width: '100%', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
        gap: '28px',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Terminal de Acceso Manual */}
        <div className="cyber-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '22px',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.4)'
            }}>
              S
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.5px' }}>GRUPO SOLE</h2>
                <span className="cyber-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>CMMS v4.2</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.8px', fontFamily: 'monospace' }}>
                TERMINAL DE AUTENTICACIÓN SEGURA
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px', lineHeight: '1.5' }}>
            Ingrese sus credenciales de red corporativas o seleccione un perfil demo autenticado a la derecha.
          </p>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#F87171', 
              borderRadius: '8px', 
              fontSize: '13px', 
              marginBottom: '20px', 
              display: 'flex', 
              gap: '10px', 
              alignItems: 'center',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleManualLogin} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                Identificador Corporativo (@gruposole.com)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="admin@gruposole.com"
                  value={email} 
                  onChange={e => { setEmail(e.target.value); setSelectedRole(null); }}
                  style={{
                    background: '#0B1120',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '100%',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                Clave de Seguridad RBAC
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••••••"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    background: '#0B1120',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#F8FAFC',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '100%',
                    letterSpacing: '2px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-cyber"
              disabled={isLoading}
              style={{ 
                marginTop: 'auto', 
                padding: '14px', 
                fontSize: '15px', 
                justifyContent: 'center',
                width: '100%'
              }}
            >
              {isLoading ? (
                <>Verificando Firma Criptográfica...</>
              ) : (
                <>
                  <Lock size={16} /> Autenticar en Plataforma <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
              AZURE SQL POOL: ACTIVO
            </span>
            <span style={{ fontSize: '11px', color: '#10B981', fontFamily: 'monospace' }}>
              TIEMPO RESPUESTA: &lt;16ms
            </span>
          </div>
        </div>

        {/* Matriz de Acceso Rápido Demo en 1-Clic */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Cpu size={16} color="#38BDF8" />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>
                ACCESO RÁPIDO PARA AUDITORÍA RBAC
              </span>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              Seleccione Rol Operativo
            </h3>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              Haga clic para auto-rellenar las credenciales (contraseña genérica <code style={{ color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>123</code>) o pulse "Ingresar" directamente:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {knownAccounts.map((p) => {
              const isSelected = selectedRole === p.id || email === p.email;
              return (
                <div
                  key={p.id}
                  onClick={() => handlePickAccount(p, false)}
                  className="cyber-card"
                  style={{ 
                    padding: '16px 20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    cursor: 'pointer',
                    borderColor: isSelected ? p.badgeColor : 'rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.6)',
                    boxShadow: isSelected ? `0 0 20px ${p.glowColor}` : 'none',
                    transform: isSelected ? 'translateX(4px)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Seleccionar ${p.name}`}
                >
                  <div style={{ 
                    width: '46px', 
                    height: '46px', 
                    borderRadius: '10px', 
                    background: isSelected ? p.glowColor : 'rgba(255, 255, 255, 0.05)', 
                    border: `1px solid ${isSelected ? p.badgeColor : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {p.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ color: '#FFFFFF', fontSize: '15px' }}>{p.name}</strong>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: '800', 
                        color: p.badgeColor, 
                        border: `1px solid ${p.badgeColor}`, 
                        padding: '1px 6px', 
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {p.roleBadge}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0, lineHeight: 1.3 }}>
                      {p.roleDescription}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickAccount(p, true);
                      }}
                      disabled={isLoading}
                      style={{
                        background: isSelected ? p.badgeColor : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#0B1120' : '#E2E8F0',
                        fontWeight: '800',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ENTRAR →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
