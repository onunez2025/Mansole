import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              S
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">GRUPO SOLE</h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 font-semibold mt-1">CMMS CORPORACIÓN</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">Plataforma de Gestión de Mantenimiento</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Iniciar Sesión</h2>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-2.5 pr-12 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Credenciales de Prueba:</p>
            <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Admin:</span>
                <span className="ml-2 text-neutral-700 dark:text-neutral-300">admin / password123</span>
              </div>
              <div>
                <span className="text-neutral-500 dark:text-neutral-400">Supervisor:</span>
                <span className="ml-2 text-neutral-700 dark:text-neutral-300">supervisor / password123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-8">
          © 2026 Grupo SOLE. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
