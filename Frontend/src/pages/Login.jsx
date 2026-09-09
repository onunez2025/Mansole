import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, ArrowRight, AlertCircle, CheckCircle2, User, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import IndustrialBackground from '../components/IndustrialBackground';

import { CURRENT_VERSION } from '../data/changelogData';

export default function Login({ onNavigateToLanding, onBackToLanding }) {
  const handleBack = onNavigateToLanding || onBackToLanding;
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
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden text-slate-900">
      {/* Fondo Animado Industrial (Partículas, Nodos IoT, Auroras de Energía y Cuadrícula) */}
      <IndustrialBackground />

      {/* Barra superior */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-white/20 flex items-center justify-center text-white font-black text-lg shadow-lg ring-2 ring-cyan-500/30">
            S
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight block leading-tight drop-shadow-sm">
              GRUPO SOLE
            </span>
            <span className="text-xs text-cyan-400 font-semibold tracking-wide">
              CMMS Industrial {CURRENT_VERSION}
            </span>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2 transition-all backdrop-blur-md shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          ← Regresar al Inicio
        </button>
      </header>

      {/* Tarjeta de Login Central */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="bg-white/95 backdrop-blur-2xl border border-white/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),0_0_40px_rgba(56,189,248,0.15)] relative overflow-hidden"
        >
          {/* Línea superior con resplandor cyan */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white mb-3.5 shadow-md ring-1 ring-white/30">
              <Shield size={22} className="text-cyan-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Acceso a Planta</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa tus credenciales autorizadas de Grupo SOLE
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 shadow-2xs"
            >
              <AlertCircle size={17} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuario o Correo
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 transition-all bg-white"
                  placeholder="admin o admin@gruposole.com"
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)}
                />
                <User size={16} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-slate-900 transition-all font-mono bg-white"
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
              className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-indigo-950/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
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

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Azure SQL Activo
            </span>
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 size={13} className="text-blue-600" />
              Cifrado Bcrypt & JWT
            </span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 text-center text-xs text-slate-400/90 z-10 font-medium drop-shadow-sm">
        © 2026 Grupo SOLE — División Rinnai Perú • Sistema de Gestión de Mantenimiento de Planta
      </footer>
    </div>
  );
}

