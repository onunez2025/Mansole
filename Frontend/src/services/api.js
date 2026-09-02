import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKENS_KEY = 'tokens';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s para conexiones Azure SQL
});

/* ------------------------------------------------------------------ *
 * Sesión: tokens en localStorage + refresh automático ante un 401.
 * ------------------------------------------------------------------ */

export function getTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY)) || null;
  } catch {
    return null;
  }
}

export function setTokens(tokens) {
  if (tokens) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKENS_KEY);
  }
}

/** Avisa a la app que la sesión murió para que vuelva al login. */
function notifySessionExpired() {
  setTokens(null);
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
}

// Adjuntar el access token a cada petición
client.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response.data,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const isNoRefreshCall = ['/auth/login', '/auth/refresh'].some(p => String(original.url || '').includes(p));

    // El access token dura 15 min: ante un 401 se intenta refrescar una sola vez.
    if (status === 401 && !original._retried && !isNoRefreshCall) {
      const tokens = getTokens();

      if (tokens?.refreshToken) {
        original._retried = true;
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken: tokens.refreshToken
          });
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn
          });
          original.headers = { ...original.headers, Authorization: `Bearer ${data.accessToken}` };
          return client(original);
        } catch {
          notifySessionExpired();
          return Promise.reject(error);
        }
      }

      notifySessionExpired();
    }

    if (status !== 401) {
      console.error('❌ API Error:', error.message, error.response?.data);
    } else {
      console.warn('⚠️ Auth 401:', error.message);
    }
    return Promise.reject(error);
  }
);

export const api = {
  // === Autenticación ===
  login:          async (email, password) => await client.post('/auth/login', { email, password }),
  logout:         async () => await client.post('/auth/logout'),
  me:             async () => await client.get('/auth/me'),
  changePassword: async (currentPassword, newPassword) =>
                    await client.post('/auth/change-password', { currentPassword, newPassword }),

  // === Usuarios y roles (administración) ===
  getUsers:          async () => await client.get('/auth/users'),
  createUser:        async (data) => await client.post('/auth/users', data),
  updateUser:        async (id, data) => await client.put(`/auth/users/${id}`, data),
  updateUserStatus:  async (id, isActive) => await client.put(`/auth/users/${id}/status`, { isActive }),
  deleteUser:        async (id) => await client.delete(`/auth/users/${id}`),
  getRoles:          async () => await client.get('/auth/roles'),
  createRole:        async (data) => await client.post('/auth/roles', data),
  deleteRole:        async (id) => await client.delete(`/auth/roles/${id}`),

  // === GET (Lecturas) ===
  getKPIs:       async () => await client.get('/kpi'),
  getAssets:     async () => await client.get('/assets'),
  getAreas:      async () => await client.get('/assets/areas'),
  getCategories: async () => await client.get('/assets/categories'),
  getInventory:  async () => await client.get('/inventory'),
  getActivities: async () => await client.get('/activities'),
  getSchedule:   async () => await client.get('/schedule'),
  getWorkOrders: async () => await client.get('/workorders'),

  // === POST (Crear) ===
  createAsset:          async (data) => await client.post('/assets', data),
  createInventoryItem:  async (data) => await client.post('/inventory', data),
  createActivity:       async (data) => await client.post('/activities', data),
  createWorkOrder:      async (data) => await client.post('/workorders', data),
  createScheduleEntry:  async (data) => await client.post('/schedule', data),

  // === PUT (Editar) ===
  updateAsset:             async (id, data) => await client.put(`/assets/${id}`, data),
  updateAssetStatus:       async (id, data) => await client.put(`/assets/${id}/status`, data),
  updateInventoryItem:     async (id, data) => await client.put(`/inventory/${id}`, data),
  updateActivity:          async (id, data) => await client.put(`/activities/${id}`, data),
  updateWorkOrderStatus:   async (id, data) => await client.put(`/workorders/${id}/status`, data),
  reprogramSchedule:       async (id, newDueDate, reason) => await client.put(`/schedule/${id}/reprogram`, { newDueDate, reason }),

  // === DELETE (Eliminar) ===
  deleteAsset:         async (id) => await client.delete(`/assets/${id}`),
  deleteInventoryItem: async (id) => await client.delete(`/inventory/${id}`),
  deleteActivity:      async (id) => await client.delete(`/activities/${id}`),
  deleteScheduleEntry: async (id) => await client.delete(`/schedule/${id}`),

  // === IA ===
  diagnoseWithAI: async (assetName, symptom, assetCode) =>
    await client.post('/ai/diagnose', { assetName, symptom, assetCode }),
};
