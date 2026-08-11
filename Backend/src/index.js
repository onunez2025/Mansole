const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { getDbConnection } = require('./config/db');
const { requireModule } = require('./middleware/authMiddleware');

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
//
// /api/auth es público por necesidad (login, refresh); cada endpoint de ese
// router se protege por dentro. Todo lo demás exige sesión + permiso de módulo.
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/assets',
  requireModule('assets', [
    // GET /areas y /categories son catálogos de apoyo: basta con ver activos.
    { method: 'PUT', pattern: /^\/\d+\/status$/, action: 'changestatus' }
  ]),
  require('./routes/assetRoutes'));

app.use('/api/inventory',
  requireModule('inventory', [
    { method: 'GET', pattern: /^\/transactions$/, action: 'view' },
    // Registrar consumo o canibalización mueve stock: no es "crear repuesto".
    { method: 'POST', pattern: /^\/transaction$/, action: 'cannibalize' }
  ]),
  require('./routes/inventoryRoutes'));

app.use('/api/workorders',
  requireModule('workorders', [
    { method: 'PUT', pattern: /^\/\d+\/status$/, action: 'close' },
    { method: 'GET', pattern: /^\/\d+\/pdf$/, action: 'export' }
  ]),
  require('./routes/workOrderRoutes'));

app.use('/api/activities', requireModule('activities'), require('./routes/activityRoutes'));

app.use('/api/schedule',
  requireModule('schedule', [
    { method: 'PUT', pattern: /^\/\d+\/reprogram$/, action: 'reprogram' }
  ]),
  require('./routes/scheduleRoutes'));

// /api/users solo redirige al router canónico de /api/auth, que ya valida permisos.
app.use('/api/users', require('./routes/usersRoutes'));

// Los KPIs del dashboard son el reporte base de la plataforma.
app.use('/api/kpi', requireModule('reports'), require('./routes/kpiRoutes'));

// El diagnóstico IA lo consume el técnico sobre una OT.
app.use('/api/ai',
  requireModule('workorders', [
    { method: 'POST', pattern: /^\/diagnose$/, action: 'view' }
  ]),
  require('./routes/aiRoutes'));
const path = require('path');

// Servir Frontend compilado si existe la carpeta public/dist
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Cualquier ruta no-API entrega index.html para SPA React Router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Manejo global de errores 404 (para /api)
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
