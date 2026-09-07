import React, { useState } from 'react';
import { Shield, UserCheck, Lock, ArrowRight, AlertCircle, Zap, Activity, Check } from 'lucide-react';
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
      roleBadge: 'Control Total',
      roleDescription: 'Acceso irrestricto, matriz RBAC, canibalización de repuestos y reprogramaciones.',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      icon: <Shield size={18} />
    },
    {
      id: 'supervisor',
      name: 'Roberto Supervisor',
      email: 'supervisor@gruposole.com',
      role: 'Supervisor',
      roleBadge: 'Supervisión',
      roleDescription: 'Reprogramar preventivos, aprobar órdenes de trabajo cerradas y consultar IA.',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: <UserCheck size={18} />
    },
    {
      id: 'tecnico',
      name: 'Juan Pérez',
      email: 'tecnico@gruposole.com',
      role: 'Técnico de Planta',
      roleBadge: 'Técnico de Campo',
      roleDescription: 'Ejecutar OTs, consumo de repuestos con trazabilidad $0 e informe de fallas.',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: <Zap size={18} />
    },
    {
      id: 'operador',
      name: 'Ana Vásquez',
      email: 'operador@gruposole.com',
      role: 'Operador de Línea',
      roleBadge: 'Línea Producción',
      roleDescription: 'Reportar averías imprevistas y visualizar el estado de máquinas en su CECO.',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-600',
      icon: <Activity size={18} />
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">GRUPO SOLE</span>
            <span className="text-xs text-slate-500 font-medium">CMMS Industrial v4.2</span>
          </div>
        </div>

        <button
          onClick={onNavigateToLanding}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 shadow-xs flex items-center gap-1.5"
        >
          ← Portal informativo
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        {/* Formulario de Login (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              Acceso Seguro Corporativo
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa tus credenciales o selecciona un perfil rápido para ingresar de inmediato.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <input 
                type="email" 
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                placeholder="usuario@gruposole.com"
                value={email} 
                onChange={e => { setEmail(e.target.value); setSelectedRole(null); }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
                <span className="text-xs text-slate-400">Demo: 123</span>
              </div>
              <input 
                type="password" 
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                placeholder="••••••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Acceder a la Plataforma</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Azure SQL Activo
            </span>
            <span>Cifrado TLS 1.3</span>
          </div>
        </div>

        {/* Demostración de Roles RBAC en 1-Clic (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Perfiles de Demostración & Auditoría RBAC</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Haz clic en cualquier perfil para cargar sus credenciales o pulsa <strong>Entrar</strong> para ingresar directamente con sus permisos:
            </p>
          </div>

          <div className="space-y-3">
            {knownAccounts.map((account) => {
              const isSelected = selectedRole === account.id || email === account.email;
              return (
                <div
                  key={account.id}
                  onClick={() => handlePickAccount(account, false)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white flex items-center gap-4 ${
                    isSelected 
                      ? 'border-slate-900 ring-2 ring-slate-900/5 shadow-sm' 
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${account.iconBg}`}>
                    {account.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-slate-900 text-sm truncate">{account.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${account.badgeStyle}`}>
                        {account.roleBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {account.roleDescription}
                    </p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {account.email}
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickAccount(account, true);
                      }}
                      disabled={isLoading}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        isSelected 
                          ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? 'Entrar →' : 'Seleccionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Contraseña estándar de prueba para todos los usuarios:</span>
            <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900">123</code>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-4 text-center text-xs text-slate-400">
        © 2026 Grupo SOLE — División Rinnai Perú • Sistema de Gestión de Mantenimiento Asistido
      </footer>
    </div>
  );
}
