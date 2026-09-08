const { getDbConnection, sql } = require('../config/db');

/**
 * Diccionario maestro del esquema MANSOLE y metadatos de tablas
 */
const SCHEMA_TABLES = {
  WorkOrders: {
    name: 'MANSOLE.WorkOrders',
    description: 'Órdenes de trabajo, tipo (Correctivo/Preventivo), prioridad, fallas, tiempos de parada (DowntimeMinutes), costos y estados.',
    columns: ['Id', 'Code', 'AssetId', 'AreaId', 'Type', 'Priority', 'ScheduledDate', 'ExecutionDate', 'DowntimeMinutes', 'Description', 'Status', 'LaborCost', 'TotalCost', 'CreatedAt', 'CreatedByUserId']
  },
  WorkOrderTasks: {
    name: 'MANSOLE.WorkOrderTasks',
    description: 'Tareas de campo ejecutadas dentro de cada OT, técnico ejecutor, duración en minutos, cronómetro y observaciones.',
    columns: ['Id', 'WorkOrderId', 'ActivityId', 'IsCompleted', 'Comments', 'StartedAt', 'CompletedAt', 'DurationMinutes', 'TechnicianName', 'Status']
  },
  WorkOrderSpareParts: {
    name: 'MANSOLE.WorkOrderSpareParts',
    description: 'Repuestos y materiales consumidos en órdenes de trabajo, cantidad y costos unitarios.',
    columns: ['Id', 'WorkOrderId', 'SparePartId', 'Quantity', 'UnitCost', 'TaskId']
  },
  WorkOrderTechnicians: {
    name: 'MANSOLE.WorkOrderTechnicians',
    description: 'Técnicos asignados a cada orden de trabajo y horas hombre asignadas.',
    columns: ['WorkOrderId', 'UserId', 'AssignedHours']
  },
  Assets: {
    name: 'MANSOLE.Assets',
    description: 'Catálogo de maquinaria y activos de planta (prensas, hornos, líneas de ensamble), marcas, modelos, series, estados y CECOs.',
    columns: ['Id', 'Code', 'Name', 'CategoryId', 'Brand', 'Model', 'SerialNumber', 'AreaId', 'AcquisitionDate', 'Status', 'CreatedAt']
  },
  Areas: {
    name: 'MANSOLE.Areas',
    description: 'Áreas de producción y soporte (Pintura, Ensamble, Matricería, Troquelado) y códigos de centros de costo.',
    columns: ['Id', 'CompanyId', 'Name', 'CostCenterCode', 'Description']
  },
  CeCoste: {
    name: 'MANSOLE.CeCoste',
    description: 'Centros de Costo (CECO) contables de Grupo SOLE, gerencias, áreas y responsables contables.',
    columns: ['CeCoste', 'CeCosteDescripcion', 'Gerencia', 'Area', 'Responsable', 'Responsable2']
  },
  SpareParts: {
    name: 'MANSOLE.SpareParts',
    description: 'Almacén de repuestos, stock actual, stock mínimo de seguridad, ubicación física en estantes, precios unitarios y condición.',
    columns: ['Id', 'Code', 'Name', 'Description', 'UnitOfMeasure', 'CurrentStock', 'MinStock', 'Location', 'UnitCost', 'Condition']
  },
  InventoryTransactions: {
    name: 'MANSOLE.InventoryTransactions',
    description: 'Kardex de movimientos de repuestos (entradas, salidas por OT, ajustes y canibalización de piezas dadas de baja a $0 USD).',
    columns: ['Id', 'SparePartId', 'TransactionType', 'Reason', 'Quantity', 'UnitCost', 'Date', 'UserId', 'Reference']
  },
  AssetActivities: {
    name: 'MANSOLE.AssetActivities',
    description: 'Cronograma de mantenimiento preventivo planificado por equipo, frecuencia (días, semanas, meses), próxima fecha y última ejecución.',
    columns: ['Id', 'AssetId', 'AreaId', 'ActivityId', 'FrequencyType', 'FrequencyValue', 'NextDueDate', 'LastExecutionDate']
  },
  Activities: {
    name: 'MANSOLE.Activities',
    description: 'Catálogo maestro de actividades estándar de mantenimiento, tiempos estándar estimados y recursos requeridos.',
    columns: ['Id', 'Name', 'Type', 'EstimatedMinutes', 'Resources']
  },
  Users: {
    name: 'MANSOLE.Users',
    description: 'Usuarios del sistema, nombres, correos electrónicos, roles asignados y estado activo/inactivo.',
    columns: ['Id', 'FirstName', 'LastName', 'Email', 'RoleId', 'IsActive', 'CreatedAt']
  },
  Roles: {
    name: 'MANSOLE.Roles',
    description: 'Roles del sistema (Administrador, Supervisor, Técnico Mecánico, Técnico Electricista, Almacenero).',
    columns: ['Id', 'Name']
  },
  AuditLogs: {
    name: 'MANSOLE.AuditLogs',
    description: 'Registro de auditoría y trazabilidad de acciones realizadas por usuarios en la plataforma.',
    columns: ['Id', 'UserId', 'Action', 'Entity', 'Timestamp', 'Details']
  },
  Attachments: {
    name: 'MANSOLE.Attachments',
    description: 'Archivos adjuntos, fotos de averías en planta y manuales técnicos almacenados en Azure Blob Storage.',
    columns: ['Id', 'EntityType', 'EntityId', 'FileName', 'BlobUrl', 'UploadedAt']
  }
};

// Cache en memoria para respuestas ultra-rápidas en preguntas sucesivas (TTL 20 segundos)
let cachedSnapshot = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20000;

/**
 * Obtiene una instantánea unificada y completa de todas las tablas principales de MANSOLE
 */
async function getUnifiedDatabaseSnapshot(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSnapshot && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedSnapshot;
  }

  const pool = await getDbConnection();
  const todayStr = new Date().toISOString().split('T')[0];

  const [
    kpisRes,
    assetsRes,
    otRes,
    partsRes,
    usersRes,
    scheduleRes,
    transRes,
    attRes
  ] = await Promise.all([
    // 1. KPIs globales de OTs
    pool.request().query(`
      SELECT 
        COUNT(*) as TotalOTs,
        SUM(CASE WHEN Status IN ('Cerrada') THEN 1 ELSE 0 END) as ClosedOTs,
        SUM(CASE WHEN Status IN ('Finalizada') THEN 1 ELSE 0 END) as FinishedOTs,
        SUM(CASE WHEN Status IN ('En Progreso') THEN 1 ELSE 0 END) as InProgressOTs,
        SUM(CASE WHEN Status IN ('Iniciado en Planta') THEN 1 ELSE 0 END) as StartedPlantOTs,
        SUM(CASE WHEN Status IN ('Pendiente', 'Abierta') THEN 1 ELSE 0 END) as OpenOTs,
        SUM(CASE WHEN Status IN ('Espera Repuestos') THEN 1 ELSE 0 END) as WaitingPartsOTs,
        SUM(CASE WHEN Status NOT IN ('Cerrada', 'Cancelada', 'Finalizada') THEN 1 ELSE 0 END) as ActiveOTs,
        SUM(CASE WHEN Type = 'Correctivo' THEN 1 ELSE 0 END) as Correctives,
        SUM(CASE WHEN Type = 'Preventivo' THEN 1 ELSE 0 END) as Preventives,
        SUM(CASE WHEN Priority = 'Crítica' THEN 1 ELSE 0 END) as CriticalOTs,
        SUM(CASE WHEN Priority = 'Alta' THEN 1 ELSE 0 END) as HighPriorityOTs,
        ISNULL(SUM(DowntimeMinutes), 0) as TotalDowntimeMinutes
      FROM MANSOLE.WorkOrders
    `),

    // 2. Activos de Planta con Área y CECO
    pool.request().query(`
      SELECT 
        a.Id, a.Code, a.Name, a.Brand, a.Model, a.SerialNumber, a.Status,
        ar.Name as AreaName, ar.CostCenterCode,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrders w WHERE w.AssetId = a.Id AND w.Status NOT IN ('Cerrada', 'Cancelada', 'Finalizada')) as ActiveOTs
      FROM MANSOLE.Assets a
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      ORDER BY a.Id ASC
    `),

    // 3. Órdenes de Trabajo (histórico reciente y activas)
    pool.request().query(`
      SELECT 
        w.Id, w.Code, w.Type, w.Priority, w.Status, w.ScheduledDate, w.ExecutionDate,
        ISNULL(w.DowntimeMinutes, 0) as DowntimeMinutes, w.Description,
        ast.Code as AssetCode, ast.Name as AssetName, ar.Name as AreaName,
        CONCAT(u.FirstName, ' ', u.LastName) as CreatedByName
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets ast ON w.AssetId = ast.Id
      LEFT JOIN MANSOLE.Areas ar ON w.AreaId = ar.Id
      LEFT JOIN MANSOLE.Users u ON w.CreatedByUserId = u.Id
      ORDER BY w.Id DESC
    `),

    // 4. Catálogo de Repuestos y Stock
    pool.request().query(`
      SELECT 
        sp.Id, sp.Code, sp.Name, sp.Description, sp.UnitOfMeasure, sp.CurrentStock, sp.MinStock,
        sp.Location, sp.UnitCost, sp.Condition,
        CASE WHEN sp.CurrentStock <= sp.MinStock THEN 'CRITICO' ELSE 'OK' END as AlertStatus
      FROM MANSOLE.SpareParts sp
      ORDER BY sp.Id ASC
    `),

    // 5. Usuarios, Técnicos y Desempeño
    pool.request().query(`
      SELECT 
        u.Id, CONCAT(u.FirstName, ' ', u.LastName) as FullName, u.Email, u.IsActive,
        r.Name as RoleName,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrders w WHERE w.CreatedByUserId = u.Id) as CreatedOTs,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrderTasks wt WHERE wt.TechnicianName LIKE CONCAT('%', u.FirstName, '%') OR wt.TechnicianName LIKE CONCAT('%', u.LastName, '%')) as CompletedTasks,
        (SELECT ISNULL(SUM(wt.DurationMinutes), 0) FROM MANSOLE.WorkOrderTasks wt WHERE wt.TechnicianName LIKE CONCAT('%', u.FirstName, '%') OR wt.TechnicianName LIKE CONCAT('%', u.LastName, '%')) as TotalWorkMinutes
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
      ORDER BY u.Id ASC
    `),

    // 6. Cronograma Preventivo Planificado
    pool.request().query(`
      SELECT 
        ast.Code as AssetCode, ast.Name as AssetName,
        act.Name as ActivityName, act.EstimatedMinutes,
        sc.FrequencyType, sc.FrequencyValue, sc.NextDueDate, sc.LastExecutionDate
      FROM MANSOLE.AssetActivities sc
      JOIN MANSOLE.Assets ast ON sc.AssetId = ast.Id
      JOIN MANSOLE.Activities act ON sc.ActivityId = act.Id
      ORDER BY sc.NextDueDate ASC
    `),

    // 7. Movimientos de Kardex e Inventario
    pool.request().query(`
      SELECT TOP 20
        t.Id, sp.Code as SpareCode, sp.Name as SpareName,
        t.TransactionType, t.Reason, t.Quantity, t.UnitCost, t.Date, t.Reference
      FROM MANSOLE.InventoryTransactions t
      JOIN MANSOLE.SpareParts sp ON t.SparePartId = sp.Id
      ORDER BY t.Id DESC
    `),

    // 8. Archivos y Evidencias
    pool.request().query(`
      SELECT TOP 10
        Id, EntityType, EntityId, FileName, BlobUrl, UploadedAt
      FROM MANSOLE.Attachments
      ORDER BY Id DESC
    `)
  ]);

  const kpis = kpisRes.recordset[0] || {};
  const assets = assetsRes.recordset || [];
  const ots = otRes.recordset || [];
  const parts = partsRes.recordset || [];
  const users = usersRes.recordset || [];
  const schedule = scheduleRes.recordset || [];
  const trans = transRes.recordset || [];
  const attachments = attRes.recordset || [];

  // Construir snapshot estructurado y compacto
  let text = `=== BASE DE DATOS COMPLETA EN VIVO: MANSOLE CMMS (GRUPO SOLE) ===\n`;
  text += `FECHA DE CONSULTA: ${todayStr}\n\n`;

  text += `--- 1. INDICADORES GLOBALES DE PLANTA (MANSOLE.WorkOrders) ---\n`;
  text += `* Total OTs: ${kpis.TotalOTs || 0}\n`;
  text += `* OTs Activas / Sin Cerrar: ${kpis.ActiveOTs || 0} (Pendientes: ${kpis.OpenOTs || 0}, En Progreso: ${kpis.InProgressOTs || 0}, Iniciadas en Planta: ${kpis.StartedPlantOTs || 0}, Espera Repuestos: ${kpis.WaitingPartsOTs || 0})\n`;
  text += `* OTs Completadas: ${(Number(kpis.ClosedOTs) || 0) + (Number(kpis.FinishedOTs) || 0)} (Cerradas: ${kpis.ClosedOTs || 0}, Finalizadas: ${kpis.FinishedOTs || 0})\n`;
  text += `* Correctivos: ${kpis.Correctives || 0} | Preventivos: ${kpis.Preventives || 0} | Prioridad Crítica: ${kpis.CriticalOTs || 0} | Prioridad Alta: ${kpis.HighPriorityOTs || 0}\n`;
  text += `* Tiempo Total de Parada Acumulado: ${kpis.TotalDowntimeMinutes || 0} minutos\n\n`;

  text += `--- 2. PARQUE COMPLETO DE ACTIVOS (${assets.length} equipos en MANSOLE.Assets) ---\n`;
  assets.forEach(a => {
    text += `* [${a.Code}] ${a.Name} | Área: ${a.AreaName || 'General'} (CECO: ${a.CostCenterCode || 'N/A'}) | Marca: ${a.Brand || 'N/A'} | Modelo: ${a.Model || 'N/A'} | Serie: ${a.SerialNumber || 'N/A'} | Estado: ${a.Status || 'Operativo'} | OTs Activas: ${a.ActiveOTs}\n`;
  });
  text += `\n`;

  text += `--- 3. ÓRDENES DE TRABAJO REGISTRADAS (${ots.length} órdenes en MANSOLE.WorkOrders) ---\n`;
  ots.forEach(o => {
    const progDate = o.ScheduledDate ? new Date(o.ScheduledDate).toISOString().split('T')[0] : 'N/A';
    text += `* [${o.Code}] ${o.Type} (${o.Priority}) | Estado: ${o.Status} | Activo: [${o.AssetCode}] ${o.AssetName} | Área: ${o.AreaName} | Creado por: ${o.CreatedByName || 'N/A'} | Parada: ${o.DowntimeMinutes}m | Prog: ${progDate} | Detalle: "${o.Description || 'Sin detalle'}"\n`;
  });
  text += `\n`;

  text += `--- 4. CATÁLOGO DE REPUESTOS Y STOCK (${parts.length} repuestos en MANSOLE.SpareParts) ---\n`;
  parts.forEach(p => {
    text += `* [${p.Code}] ${p.Name} | Stock: ${p.CurrentStock} ${p.UnitOfMeasure} (Mín: ${p.MinStock}) [${p.AlertStatus}] | Ubic: ${p.Location || 'Almacén'} | Costo Unitario: $${Number(p.UnitCost || 0).toFixed(2)} USD | Condición: ${p.Condition}\n`;
  });
  text += `\n`;

  text += `--- 5. EQUIPO Y PERSONAL (${users.length} usuarios en MANSOLE.Users y MANSOLE.Roles) ---\n`;
  users.forEach(u => {
    text += `* [ID ${u.Id}] ${u.FullName} | Rol: ${u.RoleName || 'Personal'} | Email: ${u.Email} | Estado: ${u.IsActive ? 'Activo' : 'Inactivo'} | OTs Creadas: ${u.CreatedOTs} | Tareas Registradas: ${u.CompletedTasks} | Horas Registradas: ${(u.TotalWorkMinutes / 60).toFixed(1)}h\n`;
  });
  text += `\n`;

  text += `--- 6. CRONOGRAMA DE MANTENIMIENTO PREVENTIVO (${schedule.length} rutinas en MANSOLE.AssetActivities) ---\n`;
  schedule.forEach(s => {
    const nextDate = s.NextDueDate ? new Date(s.NextDueDate).toISOString().split('T')[0] : 'Programado';
    const lastDate = s.LastExecutionDate ? new Date(s.LastExecutionDate).toISOString().split('T')[0] : 'Nunca';
    text += `* [${s.AssetCode}] ${s.AssetName} -> Rutina: "${s.ActivityName}" (${s.EstimatedMinutes || 30}m) | Frecuencia: Cada ${s.FrequencyValue} ${s.FrequencyType} | Próximo Vencimiento: ${nextDate} | Última: ${lastDate}\n`;
  });
  text += `\n`;

  text += `--- 7. MOVIMIENTOS RECIENTES DE KARDEX (${trans.length} en MANSOLE.InventoryTransactions) ---\n`;
  trans.forEach(t => {
    const tDate = t.Date ? new Date(t.Date).toISOString().split('T')[0] : 'N/A';
    text += `* [${tDate}] [${t.SpareCode}] ${t.SpareName} | Tipo: ${t.TransactionType} | Cant: ${t.Quantity} | Costo: $${Number(t.UnitCost || 0).toFixed(2)} USD | Motivo: ${t.Reason} | Ref: ${t.Reference || 'N/A'}\n`;
  });
  text += `\n`;

  if (attachments.length > 0) {
    text += `--- 8. ARCHIVOS ADJUNTOS Y MANUALES (${attachments.length} en MANSOLE.Attachments) ---\n`;
    attachments.forEach(att => {
      text += `* [${att.EntityType} #${att.EntityId}] ${att.FileName} (Blob: ${att.BlobUrl})\n`;
    });
  }

  const allTables = [
    'MANSOLE.WorkOrders',
    'MANSOLE.Assets',
    'MANSOLE.SpareParts',
    'MANSOLE.Users',
    'MANSOLE.AssetActivities',
    'MANSOLE.InventoryTransactions',
    'MANSOLE.Areas',
    'MANSOLE.CeCoste'
  ];

  cachedSnapshot = {
    tablesConsulted: allTables,
    contextText: text,
    dataSummary: {
      kpis,
      assets,
      workOrders: ots,
      spareParts: parts,
      users,
      schedule,
      transactions: trans,
      attachments
    },
    primaryDomain: 'unified'
  };

  lastCacheTime = now;
  return cachedSnapshot;
}

/**
 * Función wrapper compatible con la interfaz anterior
 */
async function queryDatabaseForMansito(userQuery, currentUser = null) {
  return await getUnifiedDatabaseSnapshot(false);
}

module.exports = {
  SCHEMA_TABLES,
  getUnifiedDatabaseSnapshot,
  queryDatabaseForMansito
};
