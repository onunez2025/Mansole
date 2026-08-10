import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // Aumentado a 15s para conexiones Azure SQL lentas
});

// Interceptor de respuesta
client.interceptors.response.use(
  response => response.data,
  error => {
    console.error('❌ API Error:', error.message, error.response?.data);
    return Promise.reject(error);
  }
);

export const api = {
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
