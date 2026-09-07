import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, AlertCircle, CheckCircle2, User, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login({ onNavigateToLanding }) {
  const { login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Por favor ingresa tu usuario o correo y contraseña.');
      return;
    }

    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.error || 'Credenciales no reconocidas.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Luces de fondo sutiles */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-100/40 via-indigo-100/30 to-purple-100/30 blur-[100px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[400px] bg-gradient-to-tr from-emerald-100/30 to-teal-100/20 blur-[90px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute inset-0 bg-dot-grid bg-dot-grid-mask pointer-events-none -z-10" />

      {/* Barra superior */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-sm ring-1 ring-slate-950/10">
            S
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">GRUPO SOLE</span>
            <span className="text-xs text-slate-500 font-medium">CMMS Industrial v4.2</span>
          </div>
        </div>

        <button
          onClick={onNavigateToLanding}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-3.5 py-2 transition-all hover:bg-slate-100 shadow-xs flex items-center gap-1.5"
        >
          ← Regresar al Inicio
        </button>
      </header>

      {/* Tarjeta de Login Central */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-slate-800 mb-3.5 border border-slate-200">
              <Shield size={22} className="text-slate-800" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acceso a Planta</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa tus credenciales autorizadas de Grupo SOLE
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
                Usuario o Correo
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  placeholder="admin o admin@gruposole.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)}
                />
                <User size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
                  placeholder="••••••••••••"
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                />
                <KeyRound size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando en Azure SQL...</span>
                </>
              ) : (
                <>
                  <Lock size={15} />
                  <span>Ingresar al Sistema</span>
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
            <span className="flex items-center gap-1">
              <CheckCircle2 size={13} className="text-slate-400" />
              Cifrado Bcrypt & JWT
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 text-center text-xs text-slate-400">
        © 2026 Grupo SOLE — División Rinnai Perú • Sistema de Gestión de Mantenimiento de Planta
      </footer>
    </div>
  );
}
