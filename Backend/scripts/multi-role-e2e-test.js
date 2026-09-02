/**
 * Multi-Role & Complete Workflow E2E Test Suite for MANSOLE CMMS
 * Tests all 4 system roles (Admin, Supervisor, Técnico, Operador) for RBAC enforcement and operational workflows.
 */
const path = require('path');
const express = require('express');
const http = require('http');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection } = require('../src/config/db');

async function main() {
  console.log('================================================================');
  console.log('🧪 INICIANDO BATERÍA DE PRUEBAS DE ROLES Y FLUJOS OPERATIVOS');
  console.log('================================================================\n');

  const report = {
    rolesTested: [],
    rbacEnforcements: [],
    workflows: [],
    passed: 0,
    failed: 0
  };

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

    function record(category, testName, success, details) {
      if (success) {
        report.passed++;
        console.log(`  ✅ [${category}] ${testName.padEnd(45)} ${details ? `(${details})` : ''}`);
      } else {
        report.failed++;
        console.error(`  ❌ [${category}] ${testName.padEnd(44)} Details: ${JSON.stringify(details)}`);
      }
    }

    // --- PARTE 1: PRUEBAS DE AUTENTICACIÓN Y ROLES (RBAC) ---
    console.log('--- 1. AUDITORÍA DE ACCESO POR ROLES (RBAC) ---');
    const credentials = [
      { role: 'Administrador', email: 'admin@gruposole.com', pass: '123' },
      { role: 'Supervisor', email: 'supervisor@gruposole.com', pass: '123' },
      { role: 'Técnico', email: 'tecnico@gruposole.com', pass: '123' },
      { role: 'Operador', email: 'operador@gruposole.com', pass: '123' }
    ];

    const tokens = {};

    for (const cred of credentials) {
      const res = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, {
        email: cred.email,
        password: cred.pass
      });

      if (res.status === 200 && res.body?.accessToken) {
        tokens[cred.role] = res.body.accessToken;
        const permsCount = res.body.user?.permissions?.length || 0;
        record('AUTH', `Login ${cred.role}`, true, `Email: ${cred.email}, Permisos: ${permsCount}`);
      } else {
        record('AUTH', `Login ${cred.role}`, false, res.body);
      }
    }

    // --- PARTE 2: VERIFICACIÓN DE RESTRICCIONES DE SEGURIDAD (SECURITY ENFORCEMENT) ---
    console.log('\n--- 2. VERIFICACIÓN DE RESTRICCIONES Y PERMISOS DENEGADOS (RBAC ENFORCEMENT) ---');

    // 2.1 Un Operador intentando ver lista de Usuarios (Debe requerir permiso mansole.users.view)
    if (tokens['Operador']) {
      const opUsersRes = await request('GET', '/api/auth/users', { 'Authorization': `Bearer ${tokens['Operador']}` });
      const isDenied = opUsersRes.status === 403 || opUsersRes.status === 401;
      record('RBAC', 'Operador intentando ver Usuarios', isDenied, `HTTP Status: ${opUsersRes.status} (Acceso Denegado esperado)`);
    }

    // 2.2 Un Técnico intentando ver Usuarios
    if (tokens['Técnico']) {
      const tecUsersRes = await request('GET', '/api/auth/users', { 'Authorization': `Bearer ${tokens['Técnico']}` });
      const isDenied = tecUsersRes.status === 403 || tecUsersRes.status === 401;
      record('RBAC', 'Técnico intentando ver Usuarios', isDenied, `HTTP Status: ${tecUsersRes.status} (Acceso Denegado esperado)`);
    }

    // 2.3 Un Administrador si puede ver Usuarios
    if (tokens['Administrador']) {
      const admUsersRes = await request('GET', '/api/auth/users', { 'Authorization': `Bearer ${tokens['Administrador']}` });
      record('RBAC', 'Administrador consultando Usuarios', admUsersRes.status === 200, `${admUsersRes.body?.length || 0} usuarios leídos`);
    }

    // --- PARTE 3: FLUJO OPERATIVO E2E DE MANTENIMIENTO ---
    console.log('\n--- 3. FLUJO OPERATIVO COMPLETO DE MANTENIMIENTO ---');

    const adminHeaders = { 'Authorization': `Bearer ${tokens['Administrador']}`, 'Content-Type': 'application/json' };
    const tecHeaders = { 'Authorization': `Bearer ${tokens['Técnico']}`, 'Content-Type': 'application/json' };

    // 3.1 Supervisor / Admin crea OT
    const woCode = `OT-E2E-${Date.now().toString().slice(-4)}`;
    const createWo = await request('POST', '/api/workorders', adminHeaders, {
      code: woCode,
      assetId: 1,
      areaId: 1,
      type: 'Correctivo',
      priority: 'Alta',
      scheduledDate: new Date().toISOString(),
      downtimeMinutes: 45,
      description: 'Prueba E2E: Ruido anormal en rodamiento de prensa',
      laborCost: 120,
      totalCost: 280
    });
    const woId = createWo.body?.id || createWo.body?.Id;
    record('WORKFLOW', '1. Creación de OT Correctiva', createWo.status === 200 || createWo.status === 201, `OT Code: ${woCode}, ID: ${woId}`);

    // 3.2 Técnico inicia la OT en Planta
    if (woId && tokens['Técnico']) {
      const startWo = await request('PUT', `/api/workorders/${woId}/status`, tecHeaders, {
        status: 'Iniciado en Planta',
        downtimeMinutes: 60
      });
      record('WORKFLOW', '2. Técnico cambia estado a "Iniciado en Planta"', startWo.status === 200, `Estado actualizado`);

      // 3.3 Técnico finaliza la OT
      const closeWo = await request('PUT', `/api/workorders/${woId}/status`, tecHeaders, {
        status: 'Finalizada',
        downtimeMinutes: 75
      });
      record('WORKFLOW', '3. Técnico finaliza la OT', closeWo.status === 200, `OT ${woId} marcada como Finalizada`);
    }

    // --- PARTE 4: FLUJO OPERATIVO DE ALMACÉN E INVENTARIO ---
    console.log('\n--- 4. FLUJO OPERATIVO DE INVENTARIO Y CANIBALIZACIÓN ---');

    // 4.1 Ingreso por Compra SAP (IN)
    const stockIn = await request('POST', '/api/inventory/transaction', adminHeaders, {
      sparePartId: 1,
      transactionType: 'IN',
      reason: 'Compra SAP',
      quantity: 10,
      unitCost: 350.00,
      reference: 'SAP-REC-88888'
    });
    record('INVENTORY', '1. Ingreso de stock por Compra SAP', stockIn.status === 200 || stockIn.status === 201, `+10 unidades agregadas`);

    // 4.2 Consumo de Repuesto por OT (OUT)
    const stockOut = await request('POST', '/api/inventory/transaction', adminHeaders, {
      sparePartId: 1,
      transactionType: 'OUT',
      reason: 'Consumo OT',
      quantity: 2,
      unitCost: 350.00,
      reference: woCode
    });
    record('INVENTORY', '2. Salida de stock imputada a OT', stockOut.status === 200 || stockOut.status === 201, `-2 unidades consumidas`);

    // 4.3 Canibalización al $0 (Reusado)
    const cannibalize = await request('POST', '/api/inventory/transaction', adminHeaders, {
      sparePartId: 3,
      transactionType: 'IN',
      reason: 'Canibalización',
      quantity: 1,
      unitCost: 0.00,
      reference: 'CANIB-EQUIPO-ANTIGUO'
    });
    record('INVENTORY', '3. Registro de pieza canibalizada ($0)', cannibalize.status === 200 || cannibalize.status === 201, `Pieza reusada ingresada a costo $0`);

    // --- PARTE 5: IMPACTO EN DASHBOARD KPI ---
    console.log('\n--- 5. VERIFICACIÓN DE IMPACTO EN DASHBOARD KPI ---');
    const kpiRes = await request('GET', '/api/kpi/dashboard', adminHeaders);
    const kpiOk = kpiRes.status === 200 && (kpiRes.body?.openOrdersCount !== undefined);
    const totalWos = (kpiRes.body?.openOrdersCount || 0) + (kpiRes.body?.closedOrdersCount || 0);
    record('KPI', 'Consulta de KPIs actualizados', kpiOk, `Total OTs en Sistema: ${totalWos}, OTs Cerradas: ${kpiRes.body?.closedOrdersCount}`);

    // --- RESUMEN FINAL ---
    console.log('\n================================================================');
    console.log('📋 RESUMEN GENERAL DE BATERÍA DE PRUEBAS');
    console.log('================================================================');
    console.log(`  Total de Pruebas Ejecutadas : ${report.passed + report.failed}`);
    console.log(`  ✅ Exitosas (PASÓ)           : ${report.passed}`);
    console.log(`  ❌ Fallidas (FALLÓ)           : ${report.failed}`);
    console.log('================================================================\n');

    server.close();
    process.exit(report.failed === 0 ? 0 : 1);
  });
}

main().catch((err) => {
  console.error('❌ Error no controlado durante las pruebas:', err);
  process.exit(1);
});
