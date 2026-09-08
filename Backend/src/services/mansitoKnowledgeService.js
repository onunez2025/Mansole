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

/**
 * Analiza la consulta en lenguaje natural e identifica las tablas pertinentes y ejecuta consultas específicas
 */
async function queryDatabaseForMansito(userQuery, currentUser = null) {
  const lower = (userQuery || '').toLowerCase().trim();
  const pool = await getDbConnection();

  const result = {
    tablesConsulted: [],
    contextText: '',
    dataSummary: {},
    primaryDomain: 'general'
  };

  // Helper para buscar palabras clave o códigos
  const extractSearchTerm = (text) => {
    const codeMatch = text.match(/[a-zA-Z]{2,10}-[\w\d.-]+/);
    if (codeMatch) return codeMatch[0];
    return null;
  };

  const specificCode = extractSearchTerm(userQuery);

  // 1. DOMINIO: ÓRDENES DE TRABAJO (OTs, pendientes, correctivos, paradas, averías)
  const isWorkOrder = /\b(ot|ots|orden|ordenes|correctivo|falla|averia|parada|downtime)\b/i.test(lower) ||
                      lower.includes('pendiente') || lower.includes('sin cerrar') || lower.includes('abierta') ||
                      lower.includes('en progreso') || lower.includes('iniciad');

  // 2. DOMINIO: REPUESTOS / STOCK / ALMACÉN / KARDEX / CANIBALIZACIÓN
  const isSparePart = /\b(repuesto|repuestos|stock|inventario|almacen|kardex|canibal|pieza|piezas)\b/i.test(lower);

  // 3. DOMINIO: ACTIVOS / MÁQUINAS / EQUIPOS / CECO / PRENSAS / HORNOS
  const isAsset = /\b(activo|activos|maquina|maquinas|equipo|equipos|prensa|horno|linea|ceco|marca|modelo|serie)\b/i.test(lower);

  // 4. DOMINIO: USUARIOS / TÉCNICOS / HORAS / ASIGNACIONES
  const isUser = /\b(usuario|usuarios|tecnico|tecnicos|mecanico|electricista|quien|personal|horas)\b/i.test(lower) ||
                 lower.includes('asignad') || lower.includes('pedro') || lower.includes('admin') || lower.includes('carlos');

  // 5. DOMINIO: CRONOGRAMA PREVENTIVO / CALENDARIO / PLANIFICACIÓN
  const isPreventive = /\b(preventivo|preventivos|cronograma|calendario|programad|rutina|frecuencia)\b/i.test(lower);

  // 6. DOMINIO: INDICADORES / KPIS / DISPONIBILIDAD / MTBF / MTTR
  const isKPI = /\b(indicador|indicadores|kpi|kpis|disponibil|mtbf|mttr|eficiencia|rendimiento)\b/i.test(lower);

  // 7. DOMINIO: ARCHIVOS / FOTOS / MANUALES / ADJUNTOS
  const isAttachment = /\b(foto|fotos|imagen|adjunto|adjuntos|manual|manuales|documento|archivo|blob)\b/i.test(lower);

  // 8. DOMINIO: AUDITORÍA / TRAZABILIDAD
  const isAudit = /\b(auditoria|log|logs|cambio|cambios|modifico|elimino|borro|trazabilidad)\b/i.test(lower);

  // --- EJECUCIÓN DINÁMICA SEGÚN DOMINIO ---

  if (isWorkOrder || isKPI || specificCode?.startsWith('OT-')) {
    result.tablesConsulted.push('MANSOLE.WorkOrders', 'MANSOLE.Assets');
    result.primaryDomain = 'workorders';

    const statusRes = await pool.request().query(`
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
    `);
    const kpis = statusRes.recordset[0] || {};
    result.dataSummary.kpis = kpis;

    let otQuery = `
      SELECT TOP 12
        w.Code, w.Type, w.Priority, w.Status, w.ScheduledDate, w.ExecutionDate,
        ISNULL(w.DowntimeMinutes, 0) as Downtime, w.Description,
        ast.Code as AssetCode, ast.Name as AssetName, ar.Name as AreaName
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets ast ON w.AssetId = ast.Id
      LEFT JOIN MANSOLE.Areas ar ON w.AreaId = ar.Id
    `;

    if (specificCode) {
      otQuery += ` WHERE w.Code LIKE '%${specificCode}%' ORDER BY w.Id DESC`;
    } else if (lower.includes('falla') || lower.includes('parada') || lower.includes('downtime')) {
      otQuery += ` WHERE w.DowntimeMinutes > 0 ORDER BY w.DowntimeMinutes DESC`;
    } else if (lower.includes('critica') || lower.includes('urgente') || lower.includes('alta')) {
      otQuery += ` WHERE w.Priority IN ('Crítica', 'Alta') ORDER BY w.Id DESC`;
    } else {
      otQuery += ` WHERE w.Status NOT IN ('Cerrada', 'Cancelada', 'Finalizada') ORDER BY w.Id DESC`;
    }

    const otRes = await pool.request().query(otQuery);
    result.dataSummary.workOrders = otRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.WorkOrders (con JOIN a MANSOLE.Assets y MANSOLE.Areas) ===
- Total OTs: ${kpis.TotalOTs || 0}
- OTs Activas / Sin Cerrar: ${kpis.ActiveOTs || 0} (Pendientes: ${kpis.OpenOTs || 0}, En Progreso: ${kpis.InProgressOTs || 0}, Iniciadas en Planta: ${kpis.StartedPlantOTs || 0}, Espera Repuestos: ${kpis.WaitingPartsOTs || 0})
- OTs Completadas: ${(Number(kpis.ClosedOTs) || 0) + (Number(kpis.FinishedOTs) || 0)} (Finalizadas: ${kpis.FinishedOTs || 0}, Cerradas: ${kpis.ClosedOTs || 0})
- Correctivos: ${kpis.Correctives || 0} | Preventivos: ${kpis.Preventives || 0} | Críticas: ${kpis.CriticalOTs || 0}
- Tiempo de Parada Total: ${kpis.TotalDowntimeMinutes || 0} minutos
- Muestra de Órdenes Relevantes (${result.dataSummary.workOrders.length}):
${result.dataSummary.workOrders.map(o => `  * [${o.Code}] ${o.Type} | Estado: ${o.Status} | Prioridad: ${o.Priority} | Activo: [${o.AssetCode}] ${o.AssetName} | Parada: ${o.Downtime} min | Desc: "${o.Description || 'Sin detalle'}"`).join('\n')}
`;
  }

  if (isSparePart) {
    result.tablesConsulted.push('MANSOLE.SpareParts', 'MANSOLE.InventoryTransactions');
    result.primaryDomain = 'spareparts';

    const partsRes = await pool.request().query(`
      SELECT TOP 15
        sp.Code, sp.Name, sp.Description, sp.UnitOfMeasure, sp.CurrentStock, sp.MinStock,
        sp.Location, sp.UnitCost, sp.Condition,
        CASE WHEN sp.CurrentStock <= sp.MinStock THEN 'Crítico' ELSE 'Normal' END as StockStatus
      FROM MANSOLE.SpareParts sp
      ORDER BY (sp.CurrentStock - sp.MinStock) ASC, sp.Name ASC
    `);
    result.dataSummary.spareParts = partsRes.recordset || [];

    const canibRes = await pool.request().query(`
      SELECT TOP 8
        sp.Code, sp.Name, t.Quantity, t.UnitCost, t.Reference, t.Reason, t.Date
      FROM MANSOLE.InventoryTransactions t
      JOIN MANSOLE.SpareParts sp ON t.SparePartId = sp.Id
      WHERE t.Reason LIKE '%Canibal%' OR t.UnitCost = 0
      ORDER BY t.Id DESC
    `);
    result.dataSummary.cannibalized = canibRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.SpareParts y MANSOLE.InventoryTransactions ===
- Repuestos Críticos o de Bajo Stock (${result.dataSummary.spareParts.length} listados):
${result.dataSummary.spareParts.map(p => `  * [${p.Code}] ${p.Name} | Stock: ${p.CurrentStock} ${p.UnitOfMeasure} (Mín: ${p.MinStock}) | Ubicación: ${p.Location || 'Almacén'} | Costo: $${Number(p.UnitCost || 0).toFixed(2)} USD | Alerta: ${p.StockStatus}`).join('\n')}

- Repuestos Canibalizados Registrados a $0.00 USD (${result.dataSummary.cannibalized.length} recientes):
${result.dataSummary.cannibalized.length > 0 ? result.dataSummary.cannibalized.map(c => `  * [${c.Code}] ${c.Name} x${c.Quantity} a $0 USD | Motivo: ${c.Reason} | Fecha: ${c.Date}`).join('\n') : '  *(Sin canibalizaciones recientes)*'}
`;
  }

  if (isAsset) {
    result.tablesConsulted.push('MANSOLE.Assets', 'MANSOLE.Areas', 'MANSOLE.CeCoste');
    result.primaryDomain = 'assets';

    const assetsRes = await pool.request().query(`
      SELECT TOP 15
        a.Code, a.Name, a.Brand, a.Model, a.SerialNumber, a.Status, a.AcquisitionDate,
        ar.Name as AreaName, ar.CostCenterCode,
        ce.CeCosteDescripcion, ce.Gerencia,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrders w WHERE w.AssetId = a.Id AND w.Status NOT IN ('Cerrada', 'Cancelada', 'Finalizada')) as ActiveOTs
      FROM MANSOLE.Assets a
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      LEFT JOIN MANSOLE.CeCoste ce ON ar.CostCenterCode = ce.CeCoste
      ORDER BY ActiveOTs DESC, a.Name ASC
    `);
    result.dataSummary.assets = assetsRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.Assets, MANSOLE.Areas y MANSOLE.CeCoste ===
- Parque de Activos y Maquinarias de Planta (${result.dataSummary.assets.length} listados):
${result.dataSummary.assets.map(a => `  * [${a.Code}] ${a.Name} | Marca: ${a.Brand || 'N/A'} Mod: ${a.Model || 'N/A'} | Serie: ${a.SerialNumber || 'S/N'} | Estado: ${a.Status || 'Operativo'} | Área: ${a.AreaName || 'General'} (CECO: ${a.CostCenterCode || 'N/A'} - ${a.CeCosteDescripcion || 'Planta'}) | OTs Activas: ${a.ActiveOTs}`).join('\n')}
`;
  }

  if (isUser) {
    result.tablesConsulted.push('MANSOLE.Users', 'MANSOLE.Roles', 'MANSOLE.WorkOrderTasks', 'MANSOLE.WorkOrderTechnicians');
    result.primaryDomain = 'users';

    const usersRes = await pool.request().query(`
      SELECT 
        u.Id, CONCAT(u.FirstName, ' ', u.LastName) as FullName, u.Email, u.IsActive,
        r.Name as RoleName,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrders w WHERE w.CreatedByUserId = u.Id) as CreatedOTs,
        (SELECT COUNT(*) FROM MANSOLE.WorkOrderTasks wt WHERE wt.TechnicianName LIKE CONCAT('%', u.FirstName, '%') OR wt.TechnicianName LIKE CONCAT('%', u.LastName, '%')) as CompletedTasks,
        (SELECT ISNULL(SUM(wt.DurationMinutes), 0) FROM MANSOLE.WorkOrderTasks wt WHERE wt.TechnicianName LIKE CONCAT('%', u.FirstName, '%') OR wt.TechnicianName LIKE CONCAT('%', u.LastName, '%')) as TotalWorkMinutes
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
      ORDER BY u.Id ASC
    `);
    result.dataSummary.users = usersRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.Users, MANSOLE.Roles, MANSOLE.WorkOrderTasks ===
- Personal, Técnicos y Roles Registrados:
${result.dataSummary.users.map(u => `  * [ID ${u.Id}] ${u.FullName} | Rol: ${u.RoleName || 'Personal'} | Email: ${u.Email} | Estado: ${u.IsActive ? 'Activo' : 'Inactivo'} | OTs Creadas: ${u.CreatedOTs} | Tareas Registradas: ${u.CompletedTasks} | Horas Registradas: ${(u.TotalWorkMinutes / 60).toFixed(1)}h`).join('\n')}
`;
  }

  if (isPreventive) {
    result.tablesConsulted.push('MANSOLE.AssetActivities', 'MANSOLE.Assets', 'MANSOLE.Activities');
    result.primaryDomain = 'preventive';

    const prevRes = await pool.request().query(`
      SELECT TOP 15
        ast.Code as AssetCode, ast.Name as AssetName,
        act.Name as ActivityName, act.EstimatedMinutes,
        sc.FrequencyType, sc.FrequencyValue, sc.NextDueDate, sc.LastExecutionDate
      FROM MANSOLE.AssetActivities sc
      JOIN MANSOLE.Assets ast ON sc.AssetId = ast.Id
      JOIN MANSOLE.Activities act ON sc.ActivityId = act.Id
      ORDER BY sc.NextDueDate ASC
    `);
    result.dataSummary.schedule = prevRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.AssetActivities, MANSOLE.Assets, MANSOLE.Activities ===
- Cronograma Preventivo y Próximos Mantenimientos Programados:
${result.dataSummary.schedule.map(s => `  * [${s.AssetCode}] ${s.AssetName} -> Rutina: "${s.ActivityName}" (${s.EstimatedMinutes || 30}m) | Frecuencia: Cada ${s.FrequencyValue} ${s.FrequencyType} | Próximo Vencimiento: ${s.NextDueDate ? new Date(s.NextDueDate).toLocaleDateString('es-PE') : 'Programado'} | Última: ${s.LastExecutionDate ? new Date(s.LastExecutionDate).toLocaleDateString('es-PE') : 'Nunca'}`).join('\n')}
`;
  }

  if (isAttachment) {
    result.tablesConsulted.push('MANSOLE.Attachments');
    result.primaryDomain = 'attachments';

    const attRes = await pool.request().query(`
      SELECT TOP 10
        Id, EntityType, EntityId, FileName, BlobUrl, UploadedAt
      FROM MANSOLE.Attachments
      ORDER BY Id DESC
    `);
    result.dataSummary.attachments = attRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.Attachments ===
- Archivos y Evidencias en Azure Blob Storage (${result.dataSummary.attachments.length}):
${result.dataSummary.attachments.map(att => `  * [${att.EntityType} #${att.EntityId}] ${att.FileName} | Subido: ${att.UploadedAt ? new Date(att.UploadedAt).toLocaleDateString('es-PE') : 'N/A'}`).join('\n')}
`;
  }

  if (isAudit) {
    result.tablesConsulted.push('MANSOLE.AuditLogs', 'MANSOLE.Users');
    result.primaryDomain = 'audit';

    const auditRes = await pool.request().query(`
      SELECT TOP 10
        al.Action, al.Entity, al.Timestamp, al.Details,
        CONCAT(u.FirstName, ' ', u.LastName) as UserName
      FROM MANSOLE.AuditLogs al
      LEFT JOIN MANSOLE.Users u ON al.UserId = u.Id
      ORDER BY al.Id DESC
    `);
    result.dataSummary.auditLogs = auditRes.recordset || [];

    result.contextText += `
=== TABLA CONSULTADA: MANSOLE.AuditLogs ===
- Trazabilidad y Acciones Recientes en el Sistema:
${result.dataSummary.auditLogs.map(a => `  * [${a.Timestamp ? new Date(a.Timestamp).toLocaleString('es-PE') : 'N/A'}] Usuario ${a.UserName || 'Sistema'}: Acción "${a.Action}" sobre ${a.Entity} (${a.Details || 'Sin detalles'})`).join('\n')}
`;
  }

  // Fallback si no hubo coincidencia temática
  if (result.tablesConsulted.length === 0) {
    result.tablesConsulted.push('MANSOLE.WorkOrders', 'MANSOLE.Assets', 'MANSOLE.SpareParts');
    const genKpis = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalOTs,
        SUM(CASE WHEN Status NOT IN ('Cerrada', 'Cancelada', 'Finalizada') THEN 1 ELSE 0 END) as ActiveOTs
      FROM MANSOLE.WorkOrders
    `);
    result.dataSummary.kpis = genKpis.recordset[0] || {};
    result.contextText += `
=== RESUMEN GENERAL DE PLANTAS Y TABLAS DE MANSOLE ===
- OTs Registradas: ${result.dataSummary.kpis.TotalOTs || 0} (Activas: ${result.dataSummary.kpis.ActiveOTs || 0})
- Módulos y tablas disponibles para consultar: MANSOLE.WorkOrders, MANSOLE.Assets, MANSOLE.SpareParts, MANSOLE.AssetActivities, MANSOLE.Users, MANSOLE.Areas, MANSOLE.CeCoste.
`;
  }

  result.tablesConsulted = [...new Set(result.tablesConsulted)];
  return result;
}

module.exports = {
  SCHEMA_TABLES,
  queryDatabaseForMansito
};
