import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api, getTokens, setTokens } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // isInitializing: restaurando la sesión guardada al arrancar la app.
  // isLoading: hay un login en curso. Son distintos a propósito — si App.jsx
  // reaccionara a isLoading desmontaría el formulario de login y perdería el error.
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restaurar sesión al montar: si hay tokens guardados, validarlos contra el backend.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getTokens()?.accessToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const data = await api.me();
        if (!cancelled) setUser(data.user);
      } catch {
        // Token vencido o revocado: sesión limpia, sin ruido para el usuario.
        setTokens(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  // El interceptor de api.js avisa cuando el refresh falla.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setError('Tu sesión expiró. Vuelve a iniciar sesión.');
    };

    window.addEventListener('auth:session-expired', onExpired);
    return () => window.removeEventListener('auth:session-expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);

      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn
      });
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (err) {
      // El backend responde 401/403/429 con { error }; si no hay respuesta, es red caída.
      const message = err.response?.data?.error
        || (err.response ? 'Error al iniciar sesión' : 'No se pudo conectar con el servidor');
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getTokens()?.accessToken) await api.logout();
    } catch {
      // Da igual si el backend no responde: la sesión local se cierra igual.
    } finally {
      setTokens(null);
      setUser(null);
      setError(null);
    }
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (!permission) return true;

    const permissions = user.permissions || [];
    return permissions.includes('*') || permissions.includes(permission);
  }, [user]);

  const hasModule = useCallback((module) => {
    if (!user) return false;

    const permissions = user.permissions || [];
    // '*' es el comodín de administrador: da acceso a todos los módulos.
    return permissions.includes('*') || permissions.some(p => p.startsWith(`mansole.${module}.`));
  }, [user]);

  const value = {
    user,
    isInitializing,
    isLoading,
    error,
    clearError: () => setError(null),
    login,
    logout,
    hasPermission,
    hasModule,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
