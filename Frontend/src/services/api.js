import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKENS_KEY = 'tokens';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s para conexiones Azure SQL
});

/* ------------------------------------------------------------------ *
 * Sesión: tokens en localStorage + refresco proactivo antes de expirar
 * para evitar llamadas con token vencido (401 en consola DevTools).
 * ------------------------------------------------------------------ */

export function isTokenExpired(token, bufferSeconds = 30) {
  if (!token) return true;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp * 1000 - bufferSeconds * 1000);
  } catch {
    return true;
  }
}

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

let refreshPromise = null;

async function getValidAccessToken() {
  const tokens = getTokens();
  if (!tokens) return null;

  // Si el access token aún es vigente (con 30s de margen), usarlo directamente
  if (tokens.accessToken && !isTokenExpired(tokens.accessToken)) {
    return tokens.accessToken;
  }

  // Si no hay refresh token o el refresh token también expiró, limpiar sesión
  if (!tokens.refreshToken || isTokenExpired(tokens.refreshToken, 0)) {
    setTokens(null);
    return null;
  }

  // Evitar múltiples llamadas concurrentes a /auth/refresh
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: tokens.refreshToken
      });
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn
      });
      return data.accessToken;
    } catch {
      notifySessionExpired();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Adjuntar el access token válido a cada petición (refrescando proactivamente si expiró)
client.interceptors.request.use(async (config) => {
  const isAuthCall = ['/auth/login', '/auth/refresh'].some(p => String(config.url || '').includes(p));
  if (isAuthCall) {
    return config;
  }

  const validToken = await getValidAccessToken();
  if (validToken) {
    config.headers.Authorization = `Bearer ${validToken}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response.data,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const isNoRefreshCall = ['/auth/login', '/auth/refresh'].some(p => String(original.url || '').includes(p));

    // Fallback reactivo por si el token fue invalidado en backend
    if (status === 401 && !original._retried && !isNoRefreshCall) {
      original._retried = true;
      const validToken = await getValidAccessToken();
      if (validToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${validToken}` };
        return client(original);
      }
      notifySessionExpired();
    }

    if (status !== 401) {
      console.error('❌ API Error:', error.message, error.response?.data);
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
  getKPIs:       async (params) => await client.get('/kpi', { params }),
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
  closeWorkOrder:          async (id) => await client.put(`/workorders/${id}/close`),
  reprogramSchedule:       async (id, newDueDate, reason) => await client.put(`/schedule/${id}/reprogram`, { newDueDate, reason }),

  // === DELETE (Eliminar) ===
  deleteAsset:         async (id) => await client.delete(`/assets/${id}`),
  deleteInventoryItem: async (id) => await client.delete(`/inventory/${id}`),
  deleteActivity:      async (id) => await client.delete(`/activities/${id}`),
  deleteScheduleEntry: async (id) => await client.delete(`/schedule/${id}`),

  // === Tareas de la Orden de Trabajo (Control de Tiempos & Catálogo) ===
  getOrderTasks:       async (orderId) => await client.get(`/workorders/${orderId}/tasks`),
  addOrderTask:        async (orderId, data) => await client.post(`/workorders/${orderId}/tasks`, data),
  startOrderTask:      async (taskId, technicianName) => await client.put(`/workorders/tasks/${taskId}/start`, { technicianName }),
  finishOrderTask:     async (taskId, comments) => await client.put(`/workorders/tasks/${taskId}/finish`, { comments }),
  deleteOrderTask:     async (taskId) => await client.delete(`/workorders/tasks/${taskId}`),

  // === Repuestos Consumidos por Tarea (Almacén & Control de Costos) ===
  getWorkOrderSpareParts:   async (orderId) => await client.get(`/workorders/${orderId}/spareparts`),
  addTaskSparePart:         async (taskId, data) => await client.post(`/workorders/tasks/${taskId}/spareparts`, data),
  deleteWorkOrderSparePart: async (id) => await client.delete(`/workorders/spareparts/${id}`),

  // === IA ===
  diagnoseWithAI: async (assetName, symptom, assetCode) =>
    await client.post('/ai/diagnose', { assetName, symptom, assetCode }),
  askMansito: async (question, history = [], currentUser = null) =>
    await client.post('/ai/mansito', { question, history, currentUser }),

  // === Catálogos Maestros (CRUD) ===
  getCatalogAreas:        async () => await client.get('/catalogs/areas'),
  createCatalogArea:     async (data) => await client.post('/catalogs/areas', data),
  updateCatalogArea:     async (id, data) => await client.put(`/catalogs/areas/${id}`, data),
  deleteCatalogArea:     async (id) => await client.delete(`/catalogs/areas/${id}`),

  getCatalogCategories:   async () => await client.get('/catalogs/categories'),
  createCatalogCategory: async (data) => await client.post('/catalogs/categories', data),
  updateCatalogCategory: async (id, data) => await client.put(`/catalogs/categories/${id}`, data),
  deleteCatalogCategory: async (id) => await client.delete(`/catalogs/categories/${id}`),

  getCatalogCostCenters:   async () => await client.get('/catalogs/cost-centers'),
  createCatalogCostCenter: async (data) => await client.post('/catalogs/cost-centers', data),
  updateCatalogCostCenter: async (code, data) => await client.put(`/catalogs/cost-centers/${code}`, data),
  deleteCatalogCostCenter: async (code) => await client.delete(`/catalogs/cost-centers/${code}`),

  // === Adjuntos / Documentos en Azure Blob Storage (Manuales, Planos, Evidencias) ===
  getAttachments:   async (entityType, entityId) => await client.get(`/attachments/${entityType}/${entityId}`),
  uploadAttachment: async (formData, onProgress) => await client.post('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  deleteAttachment: async (id) => await client.delete(`/attachments/${id}`),
};

