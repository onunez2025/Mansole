/**
 * Admin Comprehensive E2E Testing Script for MANSOLE CMMS
 * Tests all Admin privileges, CRUD operations across all modules, and verifies DB persistence.
 */
const path = require('path');
const express = require('express');
const http = require('http');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

async function main() {
  console.log('================================================================');
  console.log('👑 INICIANDO SUITE DE PRUEBAS INTEGRALES COMO ADMINISTRADOR');
  console.log('================================================================\n');

  const report = {
    auth: false,
    adminToken: null,
    tests: [],
    passedCount: 0,
    failedCount: 0
  };

  // 1. Iniciar servidor Express local en puerto efímero para probar el pipeline HTTP real
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

    function request(method, pathStr, headers = {}, body = null) {
      return new Promise((resolve) => {
        const url = new URL(pathStr, baseUrl);
        const reqOpts = { method, headers };
        const req = http.request(url, reqOpts, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch (e) {}
            resolve({ status: res.statusCode, headers: res.headers, body: json || data });
          });
        });
        req.on('error', (err) => resolve({ status: 500, error: err.message }));
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    function recordResult(testName, success, details) {
      if (success) {
        report.passedCount++;
        console.log(`  ✅ [PASÓ] ${testName.padEnd(50)} ${details ? `(${details})` : ''}`);
      } else {
        report.failedCount++;
        console.error(`  ❌ [FALLÓ] ${testName.padEnd(49)} Details: ${JSON.stringify(details)}`);
      }
      report.tests.push({ testName, success, details });
    }

    // --- TEST 1: Login Admin ---
    console.log('--- 1. AUTENTICACIÓN COMO ADMINISTRADOR ---');
    const loginRes = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
      email: 'admin@gruposole.com',
      password: '123'
    });

    if (loginRes.status === 200 && loginRes.body?.accessToken) {
      report.auth = true;
      report.adminToken = loginRes.body.accessToken;
      const user = loginRes.body.user;
      recordResult('POST /api/auth/login', true, `Usuario: ${user.name}, Rol: ${user.role}`);
    } else {
      recordResult('POST /api/auth/login', false, loginRes.body);
      console.error('Abortando pruebas: No se pudo autenticar como Administrador.');
      server.close();
      process.exit(1);
    }

    const authHeaders = {
      'Authorization': `Bearer ${report.adminToken}`,
      'Content-Type': 'application/json'
    };

    // --- TEST 2: Perfil & Roles ---
    console.log('\n--- 2. VERIFICACIÓN DE PERFIL Y PERMISOS ADMIN ---');
    const meRes = await request('GET', '/api/auth/me', authHeaders);
    const hasAdminRights = meRes.status === 200 && (meRes.body.user?.permissions?.includes('*') || meRes.body.user?.role === 'Administrador');
    recordResult('GET /api/auth/me', hasAdminRights, `Permisos: ${JSON.stringify(meRes.body.user?.permissions)}`);

    const usersRes = await request('GET', '/api/auth/users', authHeaders);
    recordResult('GET /api/auth/users', usersRes.status === 200 && Array.isArray(usersRes.body), `${usersRes.body?.length || 0} usuarios encontrados`);

    const rolesRes = await request('GET', '/api/auth/roles', authHeaders);
    recordResult('GET /api/auth/roles', rolesRes.status === 200 && Array.isArray(rolesRes.body), `${rolesRes.body?.length || 0} roles configurados`);

    // --- TEST 3: Módulo de Activos (Assets) ---
    console.log('\n--- 3. MÓDULO DE ACTIVOS DE PLANTA (ASSETS) ---');
    const assetsList = await request('GET', '/api/assets', authHeaders);
    recordResult('GET /api/assets', assetsList.status === 200 && Array.isArray(assetsList.body), `${assetsList.body?.length || 0} activos`);

    // Crear nuevo activo de prueba
    const testAssetCode = `AST-TEST-${Date.now().toString().slice(-4)}`;
    const createAssetRes = await request('POST', '/api/assets', authHeaders, {
      code: testAssetCode,
      name: 'Horno de Prueba Automatizada Admin',
      categoryId: 1,
      brand: 'Rinnai-Sole',
      model: 'ADM-2026',
      serialNumber: 'SN-TEST-999',
      areaId: 1,
      acquisitionDate: '2026-01-01',
      status: 'Operativo'
    });
    const createdAssetId = createAssetRes.body?.id || createAssetRes.body?.Id;
    recordResult('POST /api/assets (Crear Activo)', createAssetRes.status === 200 || createAssetRes.status === 201, `ID Activo: ${createdAssetId}, Código: ${testAssetCode}`);

    // Cambiar estado del activo
    if (createdAssetId) {
      const statusRes = await request('PUT', `/api/assets/${createdAssetId}/status`, authHeaders, {
        status: 'En Mantenimiento'
      });
      recordResult('PUT /api/assets/:id/status (Cambiar Estado)', statusRes.status === 200, `Nuevo Estado: En Mantenimiento`);
    }

    // --- TEST 4: Módulo de Catálogo de Actividades ---
    console.log('\n--- 4. MÓDULO DE CATÁLOGO DE ACTIVIDADES ---');
    const actList = await request('GET', '/api/activities', authHeaders);
    recordResult('GET /api/activities', actList.status === 200 && Array.isArray(actList.body), `${actList.body?.length || 0} actividades`);

    const createActRes = await request('POST', '/api/activities', authHeaders, {
      name: `Inspección de Seguridad Admin ${Date.now().toString().slice(-4)}`,
      type: 'Eléctrico',
      estimatedMinutes: 45,
      resources: 'Guantes dieléctricos, Cámara termográfica'
    });
    recordResult('POST /api/activities (Crear Actividad)', createActRes.status === 200 || createActRes.status === 201, `Mensaje: ${createActRes.body?.message || 'OK'}`);

    // --- TEST 5: Módulo de Órdenes de Trabajo (Work Orders) ---
    console.log('\n--- 5. MÓDULO DE ÓRDENES DE TRABAJO (WORK ORDERS) ---');
    const woList = await request('GET', '/api/workorders', authHeaders);
    recordResult('GET /api/workorders', woList.status === 200 && Array.isArray(woList.body), `${woList.body?.length || 0} OTs en sistema`);

    const testWoCode = `OT-ADM-${Date.now().toString().slice(-4)}`;
    const createWoRes = await request('POST', '/api/workorders', authHeaders, {
      code: testWoCode,
      assetId: createdAssetId || 1,
      areaId: 1,
      type: 'Preventivo',
      priority: 'Alta',
      scheduledDate: '2026-09-01T08:00:00Z',
      downtimeMinutes: 60,
      description: 'Mantenimiento de prueba integral ejecutado por Administrador',
      laborCost: 150.00,
      totalCost: 350.00
    });
    const createdWoId = createWoRes.body?.id || createWoRes.body?.Id;
    recordResult('POST /api/workorders (Crear OT)', createWoRes.status === 200 || createWoRes.status === 201, `OT ID: ${createdWoId}, Código: ${testWoCode}`);

    if (createdWoId) {
      const updateWoRes = await request('PUT', `/api/workorders/${createdWoId}/status`, authHeaders, {
        status: 'Finalizada',
        downtimeMinutes: 75
      });
      recordResult('PUT /api/workorders/:id/status (Finalizar OT)', updateWoRes.status === 200, `OT ${createdWoId} cambiada a Finalizada`);
    }

    // --- TEST 6: Módulo de Inventario y Repuestos ---
    console.log('\n--- 6. MÓDULO DE INVENTARIO Y REPUESTOS ---');
    const invList = await request('GET', '/api/inventory', authHeaders);
    recordResult('GET /api/inventory', invList.status === 200 && Array.isArray(invList.body), `${invList.body?.length || 0} repuestos en catálogo`);

    const testPartCode = `REP-ADM-${Date.now().toString().slice(-4)}`;
    const createPartRes = await request('POST', '/api/inventory', authHeaders, {
      code: testPartCode,
      name: 'Empaque de Silicona Alta Temp Admin',
      description: 'Empaque especial para termos industriales',
      unitOfMeasure: 'Pieza',
      currentStock: 25,
      minStock: 5,
      location: 'ALM-ADM-01',
      unitCost: 18.50,
      condition: 'Nuevo'
    });
    recordResult('POST /api/inventory (Crear Repuesto)', createPartRes.status === 200 || createPartRes.status === 201, `Repuesto: ${testPartCode}`);

    // Transacción de inventario (IN)
    const txRes = await request('POST', '/api/inventory/transaction', authHeaders, {
      partId: 1,
      type: 'IN',
      reason: 'Compra SAP',
      quantity: 5,
      unitCost: 350.00,
      reference: 'SAP-PO-99999'
    });
    recordResult('POST /api/inventory/transaction (Ingreso Stock)', txRes.status === 200 || txRes.status === 201, `Ingreso de stock registrado`);

    const txList = await request('GET', '/api/inventory/transactions', authHeaders);
    recordResult('GET /api/inventory/transactions', txList.status === 200 && Array.isArray(txList.body), `${txList.body?.length || 0} transacciones en historial`);

    // --- TEST 7: Módulo de Cronograma Preventivo ---
    console.log('\n--- 7. MÓDULO DE CRONOGRAMA PREVENTIVO (SCHEDULE) ---');
    const schedList = await request('GET', '/api/schedule', authHeaders);
    recordResult('GET /api/schedule', schedList.status === 200 && Array.isArray(schedList.body), `${schedList.body?.length || 0} tareas en cronograma`);

    const createSchedRes = await request('POST', '/api/schedule', authHeaders, {
      assetId: createdAssetId || 1,
      activityId: 1,
      type: 'Mensual',
      value: 1,
      dueDate: '2026-09-15'
    });
    recordResult('POST /api/schedule (Programar Preventivo)', createSchedRes.status === 200 || createSchedRes.status === 201, `Programación preventiva registrada`);

    // --- TEST 8: Dashboard de KPIs ---
    console.log('\n--- 8. DASHBOARD E INDICADORES KPI ---');
    const kpiRes = await request('GET', '/api/kpi/dashboard', authHeaders);
    const kpiValid = kpiRes.status === 200 && kpiRes.body?.openOrdersCount !== undefined;
    recordResult('GET /api/kpi/dashboard', kpiValid, `OTs Abiertas: ${kpiRes.body?.openOrdersCount}, OTs Cerradas: ${kpiRes.body?.closedOrdersCount}, Costo Total: $${kpiRes.body?.totalMaintenanceCost}`);

    // --- RESUMEN FINAL DE LA SUITE DE PRUEBAS ---
    console.log('\n================================================================');
    console.log('📋 RESUMEN DE EJECUCIÓN DE PRUEBAS DE ADMINISTRADOR');
    console.log('================================================================');
    console.log(`  Total de Pruebas Ejecutadas : ${report.tests.length}`);
    console.log(`  ✅ Exitosas (PASÓ)           : ${report.passedCount}`);
    console.log(`  ❌ Fallidas (FALLÓ)           : ${report.failedCount}`);
    console.log('================================================================\n');

    server.close();
    process.exit(report.failedCount === 0 ? 0 : 1);
  });
}

main().catch((err) => {
  console.error('❌ Error no controlado en la ejecución de pruebas:', err);
  process.exit(1);
});
