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
        w.ExecutionDate, w.DowntimeMinutes, w.Description, w.Status,
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

// GET /api/workorders/:id (Detalle de una OT)
router.get('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const request = pool.request();
    // Soporte para buscar por Id o Code
    const isNumeric = !isNaN(req.params.id);
    const query = `
      SELECT
        w.Id, w.Code, w.AssetId, w.Type, w.Priority, w.ScheduledDate,
        w.ExecutionDate, w.DowntimeMinutes, w.Description, w.Status,
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
    
    // Arrays simulados porque no tenemos tablas de detalle profundo aún, pero la cabecera es 100% SQL
    ot.technicians = [{ name: 'Juan Perez (Técnico Asignado)', hours: 3.5 }];
    ot.spareParts = [{ code: 'REP-GEN-01', name: 'Kit de Repuestos Genérico', quantity: 1, cost: (ot.TotalCost - ot.LaborCost) }];
    ot.tasks = [{ name: 'Checklist de seguridad y aislamiento (LOTO)', completed: true }, { name: 'Intervención mecánica / eléctrica', completed: ot.Status === 'Finalizada' }];
    
    res.json(ot);
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo OT', details: e.message });
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
  const { status, downtimeMinutes } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      UPDATE MANSOLE.WorkOrders 
      SET Status = @Status, 
          DowntimeMinutes = ISNULL(@DowntimeMinutes, DowntimeMinutes),
          ExecutionDate = CASE WHEN @Status = 'Finalizada' THEN GETDATE() ELSE ExecutionDate END
      WHERE Id = @Id
    `;
    const request = pool.request();
    request.input('Status', sql.VarChar, status);
    request.input('DowntimeMinutes', sql.Int, downtimeMinutes ? parseInt(downtimeMinutes) : null);
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
        w.ExecutionDate, w.DowntimeMinutes, w.Description, w.Status,
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
       .text(`Downtime: ${ot.DowntimeMinutes || 0} minutos`, 380, doc.y - 12);
    
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

