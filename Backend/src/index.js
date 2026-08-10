const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getDbConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API preliminares de Salud (Health Check)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Disconnected';
  try {
    const pool = await getDbConnection();
    if (pool.connected) dbStatus = 'Connected';
  } catch (error) {
    dbStatus = `Error: ${error.message}`;
  }
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CMMS Grupo SOLE - Backend API',
    database_sqlserver: dbStatus
  });
});

// Rutas de Módulos (Cargando de manera modular)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/workorders', require('./routes/workOrderRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/kpi', require('./routes/kpiRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Manejo global de errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado (404)' });
});

// Manejo global de errores 500
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor (500)', details: err.message });
});

// Arrancar el servidor y cron de mantenimiento preventivo
app.listen(PORT, async () => {
  console.log(`🚀 Servidor CMMS Grupo SOLE ejecutándose en el puerto ${PORT}`);
  console.log(`👉 Verificación del servicio: http://localhost:${PORT}/api/health`);
  
  // Intentar conexión a base de datos
  try {
    await getDbConnection();
  } catch (e) {
    console.log('⚠️ Alerta: El servidor inició pero la base de datos SQL Server aún no es accesible. Verifica el archivo .env o ejecuta npm run init-db cuando configures SQL Server.');
  }
});

module.exports = app;
