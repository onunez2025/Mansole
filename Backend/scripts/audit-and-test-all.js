/**
 * Audit and Test Script for MANSOLE CMMS Platform
 * Tests DB connection, table counts, auth login, and all backend API endpoints.
 */
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');
const { generateTokens } = require('../src/utils/jwt');
const { getPermissionsForRole, ALL_PERMISSIONS } = require('../src/config/permissions');

async function main() {
  console.log('=====================================================');
  console.log('🔍 INICIANDO AUDITORÍA Y VERIFICACIÓN DEL SISTEMA CMMS');
  console.log('=====================================================\n');

  const report = {
    dbConnection: false,
    tables: {},
    usersCount: 0,
    rolesCount: 0,
    permissionsCount: 0,
    endpointsTested: [],
    issuesFound: []
  };

  // 1. Conexión a Base de Datos
  let pool;
  try {
    pool = await getDbConnection();
    report.dbConnection = true;
    console.log('✅ 1. Conexión a Azure SQL Server: EXITOSA');
  } catch (err) {
    console.error('❌ 1. Conexión a Azure SQL Server: FALLÓ -', err.message);
    report.issuesFound.push(`Error de BD: ${err.message}`);
    process.exit(1);
  }

  // 2. Verificar Tablas y Registros
  console.log('\n--- 2. Verificación de Tablas del Esquema MANSOLE ---');
  const tablesToCheck = [
    'Users', 'Roles', 'Permissions', 'Role_Permissions',
    'Assets', 'AssetCategories', 'Areas', 'SpareParts', 'InventoryTransactions',
    'WorkOrders', 'Activities', 'AssetActivities', 'AuditLogs'
  ];

  for (const table of tablesToCheck) {
    try {
      const res = await pool.request().query(`SELECT COUNT(*) AS count FROM MANSOLE.${table}`);
      const count = res.recordset[0].count;
      report.tables[table] = count;
      console.log(`  - MANSOLE.${table.padEnd(20)} : ${count} registro(s)`);
    } catch (err) {
      report.tables[table] = `ERROR: ${err.message}`;
      console.log(`  - MANSOLE.${table.padEnd(20)} : ⚠️ NO EXISTE o ERROR (${err.message})`);
      report.issuesFound.push(`Tabla MANSOLE.${table}: ${err.message}`);
    }
  }

  // 3. Probar Login y Autenticación
  console.log('\n--- 3. Prueba de Autenticación de Usuarios ---');
  const testEmail = 'admin@gruposole.com';
  const testPass = '123';

  const userRes = await pool.request()
    .input('email', sql.NVarChar, testEmail)
    .query(`
      SELECT u.Id, u.Email, u.FirstName, u.LastName, u.IsActive, u.PasswordHash, u.RoleId, r.Name AS RoleName
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
      WHERE LOWER(u.Email) = @email
    `);

  if (userRes.recordset.length === 0) {
    console.error(`❌ Usuario de prueba ${testEmail} no encontrado en MANSOLE.Users`);
    report.issuesFound.push(`Usuario ${testEmail} no existe`);
  } else {
    const userRow = userRes.recordset[0];
    const match = await bcrypt.compare(testPass, userRow.PasswordHash || '');
    if (match) {
      console.log(`✅ Login para ${testEmail} con clave '${testPass}': CONTRASEÑA VÁLIDA`);
    } else {
      console.error(`❌ Login para ${testEmail} con clave '${testPass}': CONTRASEÑA INVÁLIDA`);
      report.issuesFound.push(`Contraseña para ${testEmail} no coincide con hash`);
    }
  }

  // 4. Probar Endpoints de API Express
  console.log('\n--- 4. Prueba de Endpoints del Backend ---');
  const express = require('express');
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());
  app.use('/api/auth', require('../src/routes/authRoutes'));
  app.use('/api/assets', require('../src/routes/assetRoutes'));
  app.use('/api/inventory', require('../src/routes/inventoryRoutes'));
  app.use('/api/workorders', require('../src/routes/workOrderRoutes'));
  app.use('/api/activities', require('../src/routes/activityRoutes'));
  app.use('/api/schedule', require('../src/routes/scheduleRoutes'));
  app.use('/api/users', require('../src/routes/usersRoutes'));
  app.use('/api/kpi', require('../src/routes/kpiRoutes'));
  app.use('/api/ai', require('../src/routes/aiRoutes'));

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    const http = require('http');

    function makeRequest(method, pathStr, headers = {}, body = null) {
      return new Promise((resolve) => {
        const url = new URL(pathStr, baseUrl);
        const req = http.request(url, { method, headers }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch (e) {}
            resolve({ status: res.statusCode, headers: res.headers, data: json || data });
          });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    // 4.1 Login por HTTP
    const loginRes = await makeRequest('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
      email: testEmail,
      password: testPass
    });

    if (loginRes.status === 200 && loginRes.data?.accessToken) {
      console.log(`  - POST /api/auth/login : ✅ HTTP 200 (Token obtenido)`);
      const token = loginRes.data.accessToken;
      const authHeader = { 'Authorization': `Bearer ${token}` };

      // Endpoints a probar con Token
      const endpointsToTest = [
        { method: 'GET', path: '/api/auth/me', name: 'Perfil de Usuario Actual' },
        { method: 'GET', path: '/api/auth/users', name: 'Lista de Usuarios' },
        { method: 'GET', path: '/api/auth/roles', name: 'Lista de Roles' },
        { method: 'GET', path: '/api/assets', name: 'Lista de Activos' },
        { method: 'GET', path: '/api/assets/categories', name: 'Categorías de Activos' },
        { method: 'GET', path: '/api/assets/areas', name: 'Áreas de Planta' },
        { method: 'GET', path: '/api/inventory', name: 'Lista de Repuestos/Inventario' },
        { method: 'GET', path: '/api/inventory/transactions', name: 'Transacciones de Inventario' },
        { method: 'GET', path: '/api/workorders', name: 'Órdenes de Trabajo' },
        { method: 'GET', path: '/api/activities', name: 'Catálogo de Actividades' },
        { method: 'GET', path: '/api/schedule', name: 'Cronograma Preventivo' },
        { method: 'GET', path: '/api/kpi/dashboard', name: 'Indicadores KPI Dashboard' }
      ];

      for (const ep of endpointsToTest) {
        const res = await makeRequest(ep.method, ep.path, authHeader);
        if (res.status === 200) {
          const itemCount = Array.isArray(res.data) ? res.data.length : (res.data ? Object.keys(res.data).length : 0);
          console.log(`  - ${ep.method} ${ep.path.padEnd(28)} : ✅ HTTP 200 (${ep.name} - ${itemCount} elementos)`);
        } else {
          console.log(`  - ${ep.method} ${ep.path.padEnd(28)} : ❌ HTTP ${res.status} - ${JSON.stringify(res.data)}`);
          report.issuesFound.push(`Endpoint ${ep.path}: HTTP ${res.status} - ${JSON.stringify(res.data)}`);
        }
      }

    } else {
      console.error(`  - POST /api/auth/login : ❌ HTTP ${loginRes.status}`, loginRes.data);
      report.issuesFound.push(`Error en login HTTP: status ${loginRes.status}`);
    }

    server.close();

    console.log('\n=====================================================');
    console.log('📋 RESUMEN DE HALLAZGOS Y ESTADO DEL SISTEMA');
    console.log('=====================================================');
    if (report.issuesFound.length === 0) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE SIN ERRORES!');
    } else {
      console.log(`⚠️ Se encontraron ${report.issuesFound.length} problema(s):`);
      report.issuesFound.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });
    }

    process.exit(0);
  });
}

main().catch((e) => {
  console.error('❌ Error no controlado en la auditoría:', e);
  process.exit(1);
});
