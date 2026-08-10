import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar tokens del localStorage al montar
  useEffect(() => {
    const storedTokens = localStorage.getItem('tokens');
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens);
        setTokens(parsed);
        // Verificar que el token siga siendo válido
        fetchCurrentUser(parsed.accessToken);
      } catch (err) {
        console.error('Error parsing stored tokens:', err);
        localStorage.removeItem('tokens');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Obtener usuario actual
  const fetchCurrentUser = async (accessToken) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('No autorizado');
      }

      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching current user:', err);
      setUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el login');
      }

      const data = await response.json();
      const newTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn
      };

      setTokens(newTokens);
      setUser(data.user);
      localStorage.setItem('tokens', JSON.stringify(newTokens));

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (tokens?.accessToken) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
    }
  }, [tokens]);

  // Verificar permiso
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (!permission) return true;

    // '*' significa acceso de administrador a todo
    return user.permissions?.includes(permission) || user.permissions?.includes('*') || false;
  }, [user]);

  // Verificar módulo
  const hasModule = useCallback((module) => {
    if (!user) return false;
    return user.permissions?.some(p => p.startsWith(`mansole.${module}.`)) || false;
  }, [user]);

  const value = {
    user,
    tokens,
    isLoading,
    error,
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
