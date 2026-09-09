const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

/**
 * Helper para formatear minutos a formato HH:MM
 */
function formatMinutesToHHMM(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0:00';
  const mins = Math.round(totalMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${m < 10 ? '0' : ''}${m}`;
}

// =========================================================================
// 1. REPORTE GENERAL: HISTORIAL DE HORAS DE MANTENIMIENTO (FORMATO CONSUMAN)
// GET /api/reports/maintenance-history
// =========================================================================
router.get('/maintenance-history', async (req, res) => {
  const { startDate, endDate, type, assetId, areaId } = req.query;

  try {
    const pool = await getDbConnection();
    const request = pool.request();

    let whereClauses = [];

    // Filtro de rango de fechas (por ScheduledDate o ExecutionDate o CreatedAt)
    if (startDate) {
      request.input('startDate', sql.Date, new Date(startDate));
      whereClauses.push('(w.ScheduledDate >= @startDate OR w.ExecutionDate >= @startDate OR w.CreatedAt >= @startDate)');
    }

    if (endDate) {
      request.input('endDate', sql.Date, new Date(endDate));
      whereClauses.push('(w.ScheduledDate <= @endDate OR w.ExecutionDate <= @endDate OR w.CreatedAt <= @endDate)');
    }

    if (type && type !== 'Todos') {
      request.input('type', sql.VarChar, type);
      whereClauses.push('w.Type = @type');
    }

    if (assetId && assetId !== 'Todos') {
      request.input('assetId', sql.Int, parseInt(assetId));
      whereClauses.push('w.AssetId = @assetId');
    }

    if (areaId && areaId !== 'Todos') {
      request.input('areaId', sql.Int, parseInt(areaId));
      whereClauses.push('(w.AreaId = @areaId OR a.AreaId = @areaId)');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT
        w.Id as WorkOrderId,
        w.Code as OrderCode,
        w.Type as OrderType,
        w.Priority as OrderPriority,
        w.Status as OrderStatus,
        w.ScheduledDate,
        w.ExecutionDate,
        w.CreatedAt,
        ISNULL(w.DowntimeMinutes, 0) as DowntimeMinutes,
        w.Description as OrderDescription,
        
        a.Id as AssetId,
        ISNULL(a.Code, 'GEN-00') as AssetCode,
        ISNULL(a.Name, 'Equipamiento General') as AssetName,
        a.Brand,
        a.Model,
        a.SerialNumber,
        
        ar.Id as AreaId,
        ISNULL(ar.Name, 'Área General') as AreaName,
        ISNULL(ar.CostCenterCode, 'CECO-GEN') as CostCenterCode,

        -- Tareas asociadas a la OT
        wt.Id as TaskId,
        wt.Comments as TaskComments,
        ISNULL(wt.DurationMinutes, 0) as TaskDurationMinutes,
        wt.TechnicianName,
        wt.Status as TaskStatus,
        wt.IsCompleted as TaskCompleted,
        
        act.Name as ActivityName,
        act.Type as ActivityType,

        -- Usuario creador
        CONCAT(u.FirstName, ' ', u.LastName) as CreatedByName
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets a ON w.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON (w.AreaId = ar.Id OR a.AreaId = ar.Id)
      LEFT JOIN MANSOLE.WorkOrderTasks wt ON w.Id = wt.WorkOrderId
      LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
      LEFT JOIN MANSOLE.Users u ON w.CreatedByUserId = u.Id
      ${whereSql}
      ORDER BY a.Name ASC, a.Code ASC, w.Id DESC, wt.Id ASC
    `;

    const result = await request.query(query);
    const rows = result.recordset || [];

    // Agrupar jerárquicamente por ACTIVO (estilo ConsuMan)
    const assetMap = new Map();
    let totalMinutesPlant = 0;
    const processedOrdersSet = new Set();

    rows.forEach(row => {
      const assetKey = row.AssetId || `asset-${row.AssetCode}`;
      
      if (!assetMap.has(assetKey)) {
        const layoutPath = `PLANTA CALLAO / NAVE DE PRODUCCION / PLANTA SOLE / ${row.AreaName?.toUpperCase() || 'PLANTA GENERAL'} / ${row.AssetName?.toUpperCase()}`;
        assetMap.set(assetKey, {
          assetId: row.AssetId,
          assetCode: row.AssetCode,
          assetName: row.AssetName,
          brand: row.Brand,
          model: row.Model,
          serialNumber: row.SerialNumber,
          areaName: row.AreaName,
          costCenterCode: row.CostCenterCode,
          layout: layoutPath,
          totalMinutes: 0,
          totalHoursFormatted: '0:00',
          ordersMap: new Map(),
          orders: []
        });
      }

      const assetObj = assetMap.get(assetKey);
      const orderKey = row.WorkOrderId;

      if (!assetObj.ordersMap.has(orderKey)) {
        processedOrdersSet.add(orderKey);

        const emissionDate = row.CreatedAt || row.ScheduledDate || row.ExecutionDate;
        assetObj.ordersMap.set(orderKey, {
          workOrderId: row.WorkOrderId,
          orderCode: row.OrderCode,
          orderType: row.OrderType,
          orderPriority: row.OrderPriority,
          orderStatus: row.OrderStatus,
          emissionDate: emissionDate ? new Date(emissionDate).toISOString() : null,
          scheduledDate: row.ScheduledDate ? new Date(row.ScheduledDate).toISOString().split('T')[0] : null,
          executionDate: row.ExecutionDate ? new Date(row.ExecutionDate).toISOString().split('T')[0] : null,
          downtimeMinutes: row.DowntimeMinutes,
          observations: row.OrderDescription || 'Mantenimiento registrado en planta',
          createdByName: row.CreatedByName,
          totalOrderMinutes: 0,
          tasks: []
        });
      }

      const orderObj = assetObj.ordersMap.get(orderKey);

      // Si tiene una tarea vinculada
      if (row.TaskId) {
        const taskDuration = Number(row.TaskDurationMinutes) || 0;
        orderObj.totalOrderMinutes += taskDuration;
        assetObj.totalMinutes += taskDuration;
        totalMinutesPlant += taskDuration;

        orderObj.tasks.push({
          taskId: row.TaskId,
          activityName: row.ActivityName || 'Intervención de Mantenimiento',
          activityType: row.ActivityType || row.OrderType,
          component: row.ActivityType || 'SISTEMA GENERAL',
          durationMinutes: taskDuration,
          durationFormatted: formatMinutesToHHMM(taskDuration),
          technicianName: row.TechnicianName || 'Técnico de Planta',
          comments: row.TaskComments || 'Actividad completada conforme a procedimiento.',
          isCompleted: row.TaskCompleted,
          status: row.TaskStatus
        });
      }
    });

    // Si una orden no tenía tareas específicas, computar su DowntimeMinutes o un mínimo estimado
    assetMap.forEach(asset => {
      asset.orders = Array.from(asset.ordersMap.values()).map(order => {
        if (order.tasks.length === 0) {
          const fallbackMins = order.downtimeMinutes > 0 ? order.downtimeMinutes : 60; // 1 hora base
          asset.totalMinutes += fallbackMins;
          totalMinutesPlant += fallbackMins;
          order.totalOrderMinutes = fallbackMins;
          order.tasks.push({
            taskId: `gen-${order.workOrderId}`,
            activityName: order.observations?.slice(0, 40) || 'Mantenimiento en planta',
            activityType: order.orderType,
            component: 'EQUIPAMIENTO',
            durationMinutes: fallbackMins,
            durationFormatted: formatMinutesToHHMM(fallbackMins),
            technicianName: order.createdByName || 'Técnico de Turno',
            comments: order.observations || 'Sin detalle de tareas individuales',
            isCompleted: true,
            status: order.orderStatus
          });
        }
        order.totalHoursFormatted = formatMinutesToHHMM(order.totalOrderMinutes);
        return order;
      });

      asset.totalHoursFormatted = formatMinutesToHHMM(asset.totalMinutes);
      delete asset.ordersMap; // Limpiar mapa temporal
    });

    const assetsArray = Array.from(assetMap.values());

    res.json({
      title: 'Historial de Hs de Mantenimiento',
      company: 'GRUPO SOLE CORPORACIÓN RINNAI',
      plant: 'PLANTA CALLAO / PLANTA METUSA',
      period: {
        startDate: startDate || (rows.length > 0 ? '2026-08-01' : new Date().toISOString().split('T')[0]),
        endDate: endDate || new Date().toISOString().split('T')[0]
      },
      generatedAt: new Date().toISOString(),
      totalAssetsCount: assetsArray.length,
      totalOrdersCount: processedOrdersSet.size,
      totalMinutesPlant,
      totalHoursPlantFormatted: formatMinutesToHHMM(totalMinutesPlant),
      assets: assetsArray
    });
  } catch (err) {
    console.error('Error generando reporte de historial de mantenimiento:', err);
    res.status(500).json({ error: 'Error al consultar historial de mantenimiento' });
  }
});


// =========================================================================
// 2. REPORTE DE ORDEN DE TRABAJO INDIVIDUAL (FICHA TÉCNICA / ACTA DE SERVICIO)
// GET /api/reports/work-order/:id
// =========================================================================
router.get('/work-order/:id', async (req, res) => {
  const isNumeric = !isNaN(req.params.id);
  
  try {
    const pool = await getDbConnection();
    const request = pool.request();

    const query = `
      SELECT
        w.Id, w.Code, w.AssetId, w.Type, w.Priority, w.ScheduledDate,
        w.ExecutionDate, w.CreatedAt,
        ISNULL(w.DowntimeMinutes, 0) as DowntimeMinutes,
        ISNULL(w.PreDowntimeMinutes, 0) as PreDowntimeMinutes,
        w.Description, w.Status,
        ISNULL(w.LaborCost, 0) as LaborCost,
        ISNULL(w.TotalCost, 0) as TotalCost,
        a.Code as AssetCode, a.Name as AssetName, a.Brand, a.Model, a.SerialNumber,
        ar.Name as AreaName, ar.CostCenterCode,
        ce.CeCosteDescripcion, ce.Gerencia,
        CONCAT(u.FirstName, ' ', u.LastName) as CreatedByName,
        u.Email as CreatedByEmail
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets a ON w.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON (w.AreaId = ar.Id OR a.AreaId = ar.Id)
      LEFT JOIN MANSOLE.CeCoste ce ON ar.CostCenterCode = ce.CeCoste
      LEFT JOIN MANSOLE.Users u ON w.CreatedByUserId = u.Id
      WHERE ${isNumeric ? 'w.Id = @ParamId' : 'w.Code = @ParamCode'}
    `;

    if (isNumeric) request.input('ParamId', sql.Int, parseInt(req.params.id));
    else request.input('ParamCode', sql.VarChar, req.params.id);

    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada.' });
    }

    const ot = result.recordset[0];

    // 1. Tareas de campo de la OT
    const tasksRes = await pool.request()
      .input('WorkOrderId', sql.Int, ot.Id)
      .query(`
        SELECT 
          wt.Id, wt.ActivityId, wt.IsCompleted, wt.Comments,
          wt.StartedAt, wt.CompletedAt, ISNULL(wt.DurationMinutes, 0) as DurationMinutes,
          wt.TechnicianName, wt.Status,
          act.Name as ActivityName, act.Type as ActivityType, act.EstimatedMinutes
        FROM MANSOLE.WorkOrderTasks wt
        LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
        WHERE wt.WorkOrderId = @WorkOrderId
        ORDER BY wt.Id ASC
      `);

    ot.tasks = tasksRes.recordset.map(t => ({
      ...t,
      durationFormatted: formatMinutesToHHMM(t.DurationMinutes)
    }));

    // 2. Repuestos y materiales consumidos
    const sparesRes = await pool.request()
      .input('WorkOrderId', sql.Int, ot.Id)
      .query(`
        SELECT 
          wsp.Id, wsp.TaskId, wsp.SparePartId, wsp.Quantity, wsp.UnitCost,
          (wsp.Quantity * wsp.UnitCost) as TotalCost,
          sp.Code as SparePartCode, sp.Name as SparePartName, sp.UnitOfMeasure, sp.Location, sp.Condition,
          wt.TechnicianName,
          act.Name as ActivityName
        FROM MANSOLE.WorkOrderSpareParts wsp
        LEFT JOIN MANSOLE.SpareParts sp ON wsp.SparePartId = sp.Id
        LEFT JOIN MANSOLE.WorkOrderTasks wt ON wsp.TaskId = wt.Id
        LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
        WHERE wsp.WorkOrderId = @WorkOrderId
        ORDER BY wsp.Id ASC
      `);

    ot.spareParts = sparesRes.recordset || [];

    // 3. Cálculos finales
    const totalPartsCost = ot.spareParts.reduce((acc, p) => acc + Number(p.TotalCost || 0), 0);
    const calculatedLaborCost = Number(ot.LaborCost) || 0;
    const finalTotalCost = ot.TotalCost > 0 ? Number(ot.TotalCost) : (calculatedLaborCost + totalPartsCost);
    const totalTaskMinutes = ot.tasks.reduce((acc, t) => acc + Number(t.DurationMinutes || 0), 0);
    const totalRealDowntime = (Number(ot.PreDowntimeMinutes) || 0) + (ot.DowntimeMinutes > 0 ? Number(ot.DowntimeMinutes) : totalTaskMinutes);

    res.json({
      order: {
        ...ot,
        totalPartsCost,
        laborCost: calculatedLaborCost,
        totalCost: finalTotalCost,
        totalTaskMinutes,
        totalTaskHoursFormatted: formatMinutesToHHMM(totalTaskMinutes),
        totalRealDowntime,
        totalDowntimeFormatted: formatMinutesToHHMM(totalRealDowntime)
      }
    });
  } catch (err) {
    console.error('Error obteniendo detalle de OT para reporte:', err);
    res.status(500).json({ error: 'Error al consultar datos de la OT' });
  }
});

module.exports = router;
