const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { getDbConnection, sql } = require('../config/db');

// GET /api/workorders (Listado de OTs desde SQL Server MANSOLE)
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT
        w.Id, w.Code, w.AssetId, w.Type, w.Priority, w.ScheduledDate,
        w.ExecutionDate, w.DowntimeMinutes, w.PreDowntimeMinutes, w.Description, w.Status,
        w.LaborCost, w.TotalCost,
        a.Code as AssetCode, a.Name as AssetName,
        ar.Name as AreaName, ar.CostCenterCode
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets a ON w.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      ORDER BY w.Id DESC
    `;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (e) {
    console.error('Error fetching work orders:', e.message);
    res.status(500).json({ error: 'Error consultando OTs', details: e.message });
  }
});

// GET /api/workorders/:id (Detalle de una OT con sus tareas y repuestos reales)
router.get('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const request = pool.request();
    const isNumeric = !isNaN(req.params.id);
    const query = `
      SELECT
        w.Id, w.Code, w.AssetId, w.Type, w.Priority, w.ScheduledDate,
        w.ExecutionDate, w.DowntimeMinutes, w.PreDowntimeMinutes, w.Description, w.Status,
        w.LaborCost, w.TotalCost,
        a.Code as AssetCode, a.Name as AssetName,
        ar.Name as AreaName, ar.CostCenterCode
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets a ON w.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      WHERE ${isNumeric ? 'w.Id = @ParamId' : 'w.Code = @ParamCode'}
    `;
    
    if (isNumeric) request.input('ParamId', sql.Int, parseInt(req.params.id));
    else request.input('ParamCode', sql.VarChar, req.params.id);

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'OT no encontrada' });
    
    const ot = result.recordset[0];
    
    // Consultar tareas de la OT desde MANSOLE.WorkOrderTasks vinculadas al catálogo MANSOLE.Activities
    const tasksQuery = `
      SELECT 
        wt.Id, wt.WorkOrderId, wt.ActivityId, wt.IsCompleted, wt.Comments,
        wt.StartedAt, wt.CompletedAt, wt.DurationMinutes, wt.TechnicianName, wt.Status,
        act.Name as ActivityName, act.Type as ActivityType, act.EstimatedMinutes
      FROM MANSOLE.WorkOrderTasks wt
      LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
      WHERE wt.WorkOrderId = @WorkOrderId
      ORDER BY wt.Id ASC
    `;
    const tasksResult = await pool.request()
      .input('WorkOrderId', sql.Int, ot.Id)
      .query(tasksQuery);

    ot.tasks = tasksResult.recordset;
    ot.technicians = [{ name: 'Juan Perez (Técnico Asignado)', hours: 3.5 }];

    // Consultar repuestos consumidos reales por tarea desde MANSOLE.WorkOrderSpareParts
    const sparePartsQuery = `
      SELECT 
        wsp.Id, wsp.WorkOrderId, wsp.TaskId, wsp.SparePartId, wsp.Quantity, wsp.UnitCost,
        (wsp.Quantity * wsp.UnitCost) as TotalCost,
        sp.Code as SparePartCode, sp.Name as SparePartName, sp.UnitOfMeasure, sp.Condition,
        wt.TechnicianName,
        act.Name as ActivityName
      FROM MANSOLE.WorkOrderSpareParts wsp
      LEFT JOIN MANSOLE.SpareParts sp ON wsp.SparePartId = sp.Id
      LEFT JOIN MANSOLE.WorkOrderTasks wt ON wsp.TaskId = wt.Id
      LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
      WHERE wsp.WorkOrderId = @WorkOrderId
      ORDER BY wsp.Id DESC
    `;
    const sparePartsResult = await pool.request()
      .input('WorkOrderId', sql.Int, ot.Id)
      .query(sparePartsQuery);

    ot.spareParts = sparePartsResult.recordset.map(p => ({
      id: p.Id,
      taskId: p.TaskId,
      sparePartId: p.SparePartId,
      code: p.SparePartCode,
      name: p.SparePartName,
      quantity: Number(p.Quantity),
      unitCost: Number(p.UnitCost),
      totalCost: Number(p.TotalCost),
      cost: Number(p.TotalCost),
      unitOfMeasure: p.UnitOfMeasure,
      condition: p.Condition,
      technicianName: p.TechnicianName,
      activityName: p.ActivityName
    }));
    
    res.json(ot);
  } catch (e) {
    console.error('Error obteniendo OT:', e);
    res.status(500).json({ error: 'Error obteniendo OT', details: e.message });
  }
});

// GET /api/workorders/:id/tasks (Obtener lista de tareas de la OT)
router.get('/:id/tasks', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT 
        wt.Id, wt.WorkOrderId, wt.ActivityId, wt.IsCompleted, wt.Comments,
        wt.StartedAt, wt.CompletedAt, wt.DurationMinutes, wt.TechnicianName, wt.Status,
        act.Name as ActivityName, act.Type as ActivityType, act.EstimatedMinutes
      FROM MANSOLE.WorkOrderTasks wt
      LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
      WHERE wt.WorkOrderId = @WorkOrderId
      ORDER BY wt.Id ASC
    `;
    const result = await pool.request()
      .input('WorkOrderId', sql.Int, parseInt(req.params.id))
      .query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo tareas de la OT', details: err.message });
  }
});

// POST /api/workorders/:id/tasks (Agregar una tarea desde el Catálogo de Actividades a la OT)
router.post('/:id/tasks', async (req, res) => {
  const { activityId, technicianName, comments } = req.body;
  if (!activityId) {
    return res.status(400).json({ error: 'Debe seleccionar una actividad del catálogo' });
  }
  try {
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.WorkOrderTasks (WorkOrderId, ActivityId, TechnicianName, Comments, Status, IsCompleted)
      OUTPUT INSERTED.Id
      VALUES (@workOrderId, @activityId, @techName, @comments, 'Pendiente', 0)
    `;
    const result = await pool.request()
      .input('workOrderId', sql.Int, parseInt(req.params.id))
      .input('activityId', sql.Int, parseInt(activityId))
      .input('techName', sql.NVarChar, technicianName || 'Técnico de Planta')
      .input('comments', sql.NVarChar, comments || '')
      .query(query);

    res.status(201).json({ id: result.recordset[0].Id, message: 'Tarea agregada a la OT' });
  } catch (err) {
    console.error('Error agregando tarea a la OT:', err);
    res.status(500).json({ error: 'Error al agregar tarea', details: err.message });
  }
});

// PUT /api/workorders/tasks/:taskId/start (Iniciar ejecución de una tarea - Marca StartedAt)
router.put('/tasks/:taskId/start', async (req, res) => {
  const { technicianName } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      UPDATE MANSOLE.WorkOrderTasks
      SET StartedAt = GETDATE(),
          Status = 'En Progreso',
          TechnicianName = ISNULL(@techName, TechnicianName)
      WHERE Id = @taskId
    `;
    await pool.request()
      .input('taskId', sql.Int, parseInt(req.params.taskId))
      .input('techName', sql.NVarChar, technicianName || null)
      .query(query);

    res.json({ message: 'Tarea iniciada. Cronómetro en marcha.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar tarea', details: err.message });
  }
});

// PUT /api/workorders/tasks/:taskId/finish (Finalizar ejecución de una tarea - Marca CompletedAt y calcula DurationMinutes)
router.put('/tasks/:taskId/finish', async (req, res) => {
  const { comments } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      UPDATE MANSOLE.WorkOrderTasks
      SET CompletedAt = GETDATE(),
          Status = 'Completada',
          IsCompleted = 1,
          DurationMinutes = DATEDIFF(MINUTE, ISNULL(StartedAt, GETDATE()), GETDATE()),
          Comments = ISNULL(@comments, Comments)
      WHERE Id = @taskId;

      -- Recalcular automáticamente el tiempo total de parada de la OT
      UPDATE MANSOLE.WorkOrders
      SET DowntimeMinutes = ISNULL(PreDowntimeMinutes, 0) + (
        SELECT ISNULL(SUM(DurationMinutes), 0)
        FROM MANSOLE.WorkOrderTasks
        WHERE WorkOrderId = (SELECT WorkOrderId FROM MANSOLE.WorkOrderTasks WHERE Id = @taskId)
      )
      WHERE Id = (SELECT WorkOrderId FROM MANSOLE.WorkOrderTasks WHERE Id = @taskId);
    `;
    await pool.request()
      .input('taskId', sql.Int, parseInt(req.params.taskId))
      .input('comments', sql.NVarChar, comments || null)
      .query(query);

    res.json({ message: 'Tarea completada. Tiempo registrado con éxito.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al finalizar tarea', details: err.message });
  }
});

// DELETE /api/workorders/tasks/:taskId (Eliminar tarea de la OT)
router.delete('/tasks/:taskId', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      DECLARE @woId INT;
      SELECT @woId = WorkOrderId FROM MANSOLE.WorkOrderTasks WHERE Id = @taskId;
      DELETE FROM MANSOLE.WorkOrderTasks WHERE Id = @taskId;
      IF @woId IS NOT NULL
      BEGIN
        UPDATE MANSOLE.WorkOrders
        SET DowntimeMinutes = ISNULL(PreDowntimeMinutes, 0) + (
          SELECT ISNULL(SUM(DurationMinutes), 0)
          FROM MANSOLE.WorkOrderTasks
          WHERE WorkOrderId = @woId
        )
        WHERE Id = @woId;
      END
    `;
    await pool.request()
      .input('taskId', sql.Int, parseInt(req.params.taskId))
      .query(query);
    res.json({ message: 'Tarea eliminada de la OT' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tarea', details: err.message });
  }
});

// GET /api/workorders/:id/spareparts (Obtener lista de repuestos consumidos en la OT con detalle de tarea)
router.get('/:id/spareparts', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT 
        wsp.Id, wsp.WorkOrderId, wsp.TaskId, wsp.SparePartId, wsp.Quantity, wsp.UnitCost,
        (wsp.Quantity * wsp.UnitCost) as TotalCost,
        sp.Code as SparePartCode, sp.Name as SparePartName, sp.UnitOfMeasure, sp.Condition,
        wt.TechnicianName,
        act.Name as ActivityName
      FROM MANSOLE.WorkOrderSpareParts wsp
      LEFT JOIN MANSOLE.SpareParts sp ON wsp.SparePartId = sp.Id
      LEFT JOIN MANSOLE.WorkOrderTasks wt ON wsp.TaskId = wt.Id
      LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
      WHERE wsp.WorkOrderId = @WorkOrderId
      ORDER BY wsp.Id DESC
    `;
    const result = await pool.request()
      .input('WorkOrderId', sql.Int, parseInt(req.params.id))
      .query(query);

    const parts = result.recordset.map(p => ({
      id: p.Id,
      taskId: p.TaskId,
      sparePartId: p.SparePartId,
      code: p.SparePartCode,
      name: p.SparePartName,
      quantity: Number(p.Quantity),
      unitCost: Number(p.UnitCost),
      totalCost: Number(p.TotalCost),
      cost: Number(p.TotalCost),
      unitOfMeasure: p.UnitOfMeasure,
      condition: p.Condition,
      technicianName: p.TechnicianName,
      activityName: p.ActivityName
    }));

    res.json(parts);
  } catch (err) {
    console.error('Error obteniendo repuestos de la OT:', err);
    res.status(500).json({ error: 'Error obteniendo repuestos de la OT', details: err.message });
  }
});

// POST /api/workorders/tasks/:taskId/spareparts (Asignar consumo de repuesto a una tarea de la OT)
router.post('/tasks/:taskId/spareparts', async (req, res) => {
  const { sparePartId, quantity } = req.body;
  const taskId = parseInt(req.params.taskId);
  const qty = parseFloat(quantity);

  if (!sparePartId || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Debe especificar un repuesto válido y una cantidad mayor a cero.' });
  }

  try {
    const pool = await getDbConnection();

    // 1. Validar que la tarea exista y obtener su OT
    const taskRes = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT wt.Id, wt.WorkOrderId, wt.TechnicianName, wt.Status as TaskStatus, wt.IsCompleted,
               wo.Code as OrderCode, wo.Status as OrderStatus, act.Name as ActivityName
        FROM MANSOLE.WorkOrderTasks wt
        INNER JOIN MANSOLE.WorkOrders wo ON wt.WorkOrderId = wo.Id
        LEFT JOIN MANSOLE.Activities act ON wt.ActivityId = act.Id
        WHERE wt.Id = @taskId
      `);

    if (taskRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o no pertenece a una OT válida.' });
    }

    const task = taskRes.recordset[0];
    const workOrderId = task.WorkOrderId;

    // Control de Proceso Industrial: Bloquear si la tarea ya está finalizada o la OT cerrada
    if (task.IsCompleted || task.TaskStatus === 'Completada') {
      return res.status(400).json({ 
        error: 'Operación no permitida: La tarea ya fue completada y cerrada. No se pueden imputar repuestos a una tarea finalizada.' 
      });
    }

    if (task.OrderStatus === 'Finalizada' || task.OrderStatus === 'Cerrada') {
      return res.status(400).json({ 
        error: 'Operación no permitida: La Orden de Trabajo ya ha sido finalizada o cerrada.' 
      });
    }

    // 2. Obtener datos del repuesto en catálogo
    const partRes = await pool.request()
      .input('sparePartId', sql.Int, parseInt(sparePartId))
      .query('SELECT Id, Code, Name, CurrentStock, UnitCost, Condition, UnitOfMeasure FROM MANSOLE.SpareParts WHERE Id = @sparePartId');

    if (partRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Repuesto no encontrado en el inventario.' });
    }

    const part = partRes.recordset[0];

    // Validar stock disponible
    if (part.CurrentStock < qty) {
      return res.status(400).json({ 
        error: `Stock insuficiente en almacén. Disponible: ${part.CurrentStock} ${part.UnitOfMeasure || 'und'}, solicitado: ${qty}` 
      });
    }

    const unitCost = part.Condition === 'Canibalizada' ? 0 : Number(part.UnitCost || 0);

    // 3. Registrar consumo en MANSOLE.WorkOrderSpareParts
    const insertRes = await pool.request()
      .input('workOrderId', sql.Int, workOrderId)
      .input('taskId', sql.Int, taskId)
      .input('sparePartId', sql.Int, part.Id)
      .input('quantity', sql.Decimal(18, 2), qty)
      .input('unitCost', sql.Decimal(18, 2), unitCost)
      .query(`
        INSERT INTO MANSOLE.WorkOrderSpareParts (WorkOrderId, TaskId, SparePartId, Quantity, UnitCost)
        OUTPUT INSERTED.Id
        VALUES (@workOrderId, @taskId, @sparePartId, @quantity, @unitCost)
      `);

    const insertedSparePartId = insertRes.recordset[0].Id;

    // 4. Deducir stock del inventario
    await pool.request()
      .input('sparePartId', sql.Int, part.Id)
      .input('qty', sql.Decimal(18, 2), qty)
      .query(`
        UPDATE MANSOLE.SpareParts 
        SET CurrentStock = CurrentStock - @qty 
        WHERE Id = @sparePartId
      `);

    // 5. Registrar movimiento de auditoría en Kardex (InventoryTransactions)
    const reference = `${task.OrderCode || ('OT #' + workOrderId)} / Tarea: ${task.ActivityName || ('#' + taskId)}`;
    await pool.request()
      .input('sparePartId', sql.Int, part.Id)
      .input('qty', sql.Decimal(18, 2), qty)
      .input('unitCost', sql.Decimal(18, 2), unitCost)
      .input('reference', sql.NVarChar, reference)
      .query(`
        INSERT INTO MANSOLE.InventoryTransactions (SparePartId, TransactionType, Reason, Quantity, UnitCost, Date, Reference)
        VALUES (@sparePartId, 'OUT', 'Consumo OT por Tarea', @qty, @unitCost, GETDATE(), @reference)
      `);

    // 6. Recalcular costo total de la OT (Mano de obra + Total de repuestos de la OT)
    await pool.request()
      .input('workOrderId', sql.Int, workOrderId)
      .query(`
        UPDATE MANSOLE.WorkOrders
        SET TotalCost = ISNULL(LaborCost, 0) + (
          SELECT ISNULL(SUM(Quantity * UnitCost), 0)
          FROM MANSOLE.WorkOrderSpareParts
          WHERE WorkOrderId = @workOrderId
        )
        WHERE Id = @workOrderId
      `);

    res.status(201).json({
      id: insertedSparePartId,
      workOrderId,
      taskId,
      sparePartId: part.Id,
      code: part.Code,
      name: part.Name,
      quantity: qty,
      unitCost,
      totalCost: qty * unitCost,
      message: `Repuesto ${part.Code} asignado exitosamente a la tarea.`
    });
  } catch (err) {
    console.error('Error asignando repuesto a la tarea:', err);
    res.status(500).json({ error: 'Error al asignar repuesto a la tarea', details: err.message });
  }
});

// DELETE /api/workorders/spareparts/:id (Eliminar consumo de repuesto y reintegrar stock al almacén)
router.delete('/spareparts/:id', async (req, res) => {
  const recordId = parseInt(req.params.id);
  try {
    const pool = await getDbConnection();

    // 1. Obtener datos del registro a eliminar
    const itemRes = await pool.request()
      .input('id', sql.Int, recordId)
      .query(`
        SELECT wsp.Id, wsp.WorkOrderId, wsp.SparePartId, wsp.Quantity, wsp.UnitCost, 
               wo.Code as OrderCode, wo.Status as OrderStatus, sp.Code as SparePartCode
        FROM MANSOLE.WorkOrderSpareParts wsp
        LEFT JOIN MANSOLE.WorkOrders wo ON wsp.WorkOrderId = wo.Id
        LEFT JOIN MANSOLE.SpareParts sp ON wsp.SparePartId = sp.Id
        WHERE wsp.Id = @id
      `);

    if (itemRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Registro de repuesto consumido no encontrado.' });
    }

    const item = itemRes.recordset[0];
    const { WorkOrderId, SparePartId, Quantity, UnitCost, OrderCode, SparePartCode, OrderStatus } = item;

    if (OrderStatus === 'Finalizada' || OrderStatus === 'Cerrada') {
      return res.status(400).json({ error: 'Operación no permitida: La Orden de Trabajo ya ha sido finalizada o cerrada.' });
    }

    // 2. Restituir stock en SpareParts
    await pool.request()
      .input('sparePartId', sql.Int, SparePartId)
      .input('qty', sql.Decimal(18, 2), Quantity)
      .query(`
        UPDATE MANSOLE.SpareParts
        SET CurrentStock = CurrentStock + @qty
        WHERE Id = @sparePartId
      `);

    // 3. Registrar transacción inversa de auditoría en Kardex
    const reference = `Anulación de consumo en ${OrderCode || ('OT #' + WorkOrderId)} (Reg. #${recordId})`;
    await pool.request()
      .input('sparePartId', sql.Int, SparePartId)
      .input('qty', sql.Decimal(18, 2), Quantity)
      .input('unitCost', sql.Decimal(18, 2), UnitCost)
      .input('reference', sql.NVarChar, reference)
      .query(`
        INSERT INTO MANSOLE.InventoryTransactions (SparePartId, TransactionType, Reason, Quantity, UnitCost, Date, Reference)
        VALUES (@sparePartId, 'IN', 'Devolución Consumo OT', @qty, @unitCost, GETDATE(), @reference)
      `);

    // 4. Eliminar el registro
    await pool.request()
      .input('id', sql.Int, recordId)
      .query('DELETE FROM MANSOLE.WorkOrderSpareParts WHERE Id = @id');

    // 5. Recalcular costo total de la OT
    await pool.request()
      .input('workOrderId', sql.Int, WorkOrderId)
      .query(`
        UPDATE MANSOLE.WorkOrders
        SET TotalCost = ISNULL(LaborCost, 0) + (
          SELECT ISNULL(SUM(Quantity * UnitCost), 0)
          FROM MANSOLE.WorkOrderSpareParts
          WHERE WorkOrderId = @workOrderId
        )
        WHERE Id = @workOrderId
      `);

    res.json({ message: `Repuesto ${SparePartCode || ''} devuelto al stock del almacén con éxito.` });
  } catch (err) {
    console.error('Error eliminando repuesto consumido:', err);
    res.status(500).json({ error: 'Error al eliminar repuesto de la OT', details: err.message });
  }
});

// POST /api/workorders (Creación de OT Preventiva o Correctiva con múltiples técnicos)
router.post('/', async (req, res) => {
  const { assetId, assetCode, assetName, areaName, costCenterCode, type, priority, scheduledDate, description, downtimeMinutes, technicians, spareParts } = req.body;
  
  try {
    const pool = await getDbConnection();
    
    let labor = 0;
    if (Array.isArray(technicians)) {
      technicians.forEach(t => labor += (parseFloat(t.hours || 0) * 30)); // $30/hora estándar
    }
    let partsCost = 0;
    if (Array.isArray(spareParts)) {
      spareParts.forEach(p => partsCost += parseFloat(p.cost || p.unitCost || 0));
    }
    const totalCost = labor + partsCost;

    // Generar código autoincremental
    const countResult = await pool.request().query("SELECT ISNULL(MAX(Id), 0) as maxId FROM MANSOLE.WorkOrders");
    const newId = countResult.recordset[0].maxId + 1;
    const code = type === 'Preventivo' ? `OT-PREV-00${newId}` : `OT-CORR-00${newId}`;
    
    // Si no enviaron assetId, buscamos por Code temporalmente o dejamos Null
    let finalAssetId = assetId ? parseInt(assetId) : null;
    
    const query = `
      INSERT INTO MANSOLE.WorkOrders (
        Code, AssetId, Type, Priority, ScheduledDate, DowntimeMinutes, 
        Description, Status, LaborCost, TotalCost
      ) 
      OUTPUT INSERTED.Id
      VALUES (
        @Code, @AssetId, @Type, @Priority, @ScheduledDate, @DowntimeMinutes,
        @Description, 'Iniciado en Planta', @LaborCost, @TotalCost
      )
    `;
    const request = pool.request();
    request.input('Code', sql.VarChar, code);
    request.input('AssetId', sql.Int, finalAssetId);
    request.input('Type', sql.VarChar, type || 'Correctivo');
    request.input('Priority', sql.VarChar, priority || 'Media');
    request.input('ScheduledDate', sql.DateTime, scheduledDate ? new Date(scheduledDate) : new Date());
    request.input('DowntimeMinutes', sql.Int, downtimeMinutes ? parseInt(downtimeMinutes) : 0);
    request.input('Description', sql.NVarChar, description || 'Sin descripción');
    request.input('LaborCost', sql.Decimal(18,2), labor);
    request.input('TotalCost', sql.Decimal(18,2), totalCost);
    
    const result = await request.query(query);
    const insertedId = result.recordset[0].Id;
    
    res.status(201).json({ id: insertedId, code, message: 'Orden de trabajo creada con éxito en Azure SQL' });
  } catch (error) {
    console.error('Error insertando OT:', error);
    res.status(500).json({ error: 'Error al crear la OT', details: error.message });
  }
});

// PUT /api/workorders/:id/status (Actualizar estado o cerrar OT)
router.put('/:id/status', async (req, res) => {
  const { status, downtimeMinutes, preDowntimeMinutes } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      UPDATE MANSOLE.WorkOrders 
      SET Status = ISNULL(@Status, Status), 
          PreDowntimeMinutes = CASE WHEN @PreDowntimeMinutes IS NOT NULL THEN @PreDowntimeMinutes ELSE PreDowntimeMinutes END,
          DowntimeMinutes = CASE 
            WHEN @DowntimeMinutes IS NOT NULL THEN @DowntimeMinutes 
            ELSE (
              ISNULL(CASE WHEN @PreDowntimeMinutes IS NOT NULL THEN @PreDowntimeMinutes ELSE PreDowntimeMinutes END, 0) + 
              ISNULL((SELECT SUM(DurationMinutes) FROM MANSOLE.WorkOrderTasks WHERE WorkOrderId = @Id), 0)
            ) 
          END,
          ExecutionDate = CASE WHEN @Status = 'Finalizada' THEN GETDATE() ELSE ExecutionDate END
      WHERE Id = @Id
    `;
    const request = pool.request();
    request.input('Status', sql.VarChar, status || null);
    request.input('PreDowntimeMinutes', sql.Int, preDowntimeMinutes !== undefined && preDowntimeMinutes !== null ? parseInt(preDowntimeMinutes) : null);
    request.input('DowntimeMinutes', sql.Int, downtimeMinutes !== undefined && downtimeMinutes !== null ? parseInt(downtimeMinutes) : null);
    request.input('Id', sql.Int, parseInt(req.params.id));
    
    await request.query(query);
    res.json({ message: 'OT actualizada con éxito en Azure SQL' });
  } catch(e) {
    res.status(500).json({ error: 'Error actualizando OT', details: e.message });
  }
});

// GET /api/workorders/:id/pdf (Generación de PDF formal con QuestPDF/PDFKit para acta de mantenimiento)
router.get('/:id/pdf', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const request = pool.request();
    const isNumeric = !isNaN(req.params.id);
    const query = `
      SELECT
        w.Id, w.Code, w.AssetId, w.Type, w.Priority, w.ScheduledDate,
        w.ExecutionDate, w.DowntimeMinutes, w.PreDowntimeMinutes, w.Description, w.Status,
        w.LaborCost, w.TotalCost,
        a.Code as AssetCode, a.Name as AssetName,
        ar.Name as AreaName, ar.CostCenterCode
      FROM MANSOLE.WorkOrders w
      LEFT JOIN MANSOLE.Assets a ON w.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      WHERE ${isNumeric ? 'w.Id = @ParamId' : 'w.Code = @ParamCode'}
    `;
    
    if (isNumeric) request.input('ParamId', sql.Int, parseInt(req.params.id));
    else request.input('ParamCode', sql.VarChar, req.params.id);

    const result = await request.query(query);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'OT no encontrada para exportar' });
    
    const ot = result.recordset[0];

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Acta_${ot.Code}.pdf"`);

    doc.pipe(res);

    // Cabecera formal
    doc.fillColor('#1b365d').fontSize(20).text('GRUPO SOLE CORPORACIÓN RINNAI', { align: 'center', bold: true });
    doc.fontSize(12).fillColor('#555555').text('ÁREA DE PRODUCCIÓN Y MANTENIMIENTO (CMMS)', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#1b365d').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Título de Acta y Estado
    doc.fillColor('#000000').fontSize(16).text(`ACTA DE ORDEN DE TRABAJO: ${ot.Code}`, { align: 'left' });
    doc.fontSize(12).fillColor('#333333').text(`Tipo: ${ot.Type.toUpperCase()}  |  Prioridad: ${ot.Priority}  |  Estado: ${ot.Status}`);
    doc.moveDown(0.5);

    // Datos del CECO y Activo
    doc.rect(50, doc.y, 495, 80).fill('#f0f4f8');
    doc.fillColor('#1b365d').fontSize(11).text('DATOS DEL ACTIVO Y CENTRO DE COSTO (CECO)', 60, doc.y + 10, { bold: true });
    doc.fillColor('#333333').fontSize(10)
       .text(`Activo / Máquina: [${ot.AssetCode || 'GEN'}] ${ot.AssetName || 'Equipamiento General'}`, 60, doc.y + 5)
       .text(`Área de Producción: ${ot.AreaName || 'General'}`, 60, doc.y + 4)
       .text(`Imputación de Gasto (CECO): ${ot.CostCenterCode || 'CECO-GEN'}`, 60, doc.y + 4)
       .text(`Downtime: ${ot.DowntimeMinutes || 0} min (Previo: ${ot.PreDowntimeMinutes || 0}m + Intervención)`, 330, doc.y - 12);
    
    doc.moveDown(3);

    // Descripción de labores
    doc.fillColor('#1b365d').fontSize(12).text('DESCRIPCIÓN DE LA INCIDENCIA O TRABAJO:', 50, doc.y, { underline: true });
    doc.moveDown(0.3);
    doc.fillColor('#000').fontSize(10).text(ot.Description || 'Sin descripción detallada.', { align: 'justify' });
    doc.moveDown(1);

    // Resumen Económico para el CECO
    doc.rect(50, doc.y, 300, 60).fill('#e8f5e9');
    doc.fillColor('#2e7d32').fontSize(11).text('RESUMEN DE COSTOS IMPUTABLES AL CECO', 60, doc.y + 10, { bold: true });
    doc.fillColor('#000').fontSize(10)
       .text(`Costo Mano de Obra: $${Number(ot.LaborCost || 0).toFixed(2)}`, 60, doc.y + 5)
       .text(`Costo Repuestos / Partes: $${Number((ot.TotalCost || 0) - (ot.LaborCost || 0)).toFixed(2)}`, 60, doc.y + 3)
       .text(`COSTO TOTAL OT: $${Number(ot.TotalCost || 0).toFixed(2)} USD`, 60, doc.y + 3, { bold: true });
    
    doc.moveDown(4);

    // Firmas y cierre
    const signY = 680;
    doc.strokeColor('#000').lineWidth(1)
       .moveTo(70, signY).lineTo(230, signY).stroke()
       .moveTo(350, signY).lineTo(510, signY).stroke();

    doc.fillColor('#333').fontSize(10)
       .text('Firma del Técnico Responsable', 85, signY + 10)
       .text('V°B° Supervisor de Mantenimiento', 360, signY + 10);
    
    doc.fontSize(8).fillColor('#999').text(`Generado automáticamente por Antigravity CMMS (Azure SQL) el ${new Date().toLocaleString()}`, 50, 780, { align: 'center' });

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error generando PDF desde Azure SQL', details: e.message });
  }
});

module.exports = router;

