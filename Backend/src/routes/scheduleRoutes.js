const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

// GET /api/schedule (Cronograma en MANSOLE)
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT sc.*, a.Code as AssetCode, a.Name as AssetName, ar.Name as AreaName, ar.CostCenterCode, act.Name as ActivityName, act.EstimatedMinutes
      FROM MANSOLE.AssetActivities sc
      LEFT JOIN MANSOLE.Assets a ON sc.AssetId = a.Id
      LEFT JOIN MANSOLE.Areas ar ON sc.AreaId = ar.Id OR a.AreaId = ar.Id
      JOIN MANSOLE.Activities act ON sc.ActivityId = act.Id
      ORDER BY sc.NextDueDate ASC
    `;
    const result = await pool.request().query(query);
    
    // Add logic for Próximo a Vencer / Vencido dynamically in code instead of SQL to ensure accurate TimeZone logic
    const now = new Date();
    const enriched = result.recordset.map(item => {
      if (!item.NextDueDate) return { ...item, status: 'Programado' };
      const due = new Date(item.NextDueDate);
      let status = 'Programado';
      if (due < now) status = 'Vencido';
      else if ((due - now) <= 3 * 24 * 3600 * 1000) status = 'Próximo a Vencer';
      return { ...item, status };
    });
    
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: 'Error cargando cronograma desde Azure SQL', details: e.message });
  }
});

// PUT /api/schedule/:id/reprogram (Reprogramar en MANSOLE)
router.put('/:id/reprogram', async (req, res) => {
  const { newDueDate, reason } = req.body;
  const { id } = req.params;
  
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('date', sql.Date, new Date(newDueDate))
      .query('UPDATE MANSOLE.AssetActivities SET NextDueDate = @date WHERE Id = @id');

    res.json({ message: 'Fecha de cronograma reprogramada con éxito en Azure SQL', id, newDueDate, reason });
  } catch (e) {
    res.status(500).json({ error: 'Error al reprogramar actividad', details: e.message });
  }
});

// POST /api/schedule (Programar nueva en MANSOLE)
router.post('/', async (req, res) => {
  const { assetId, areaId, activityId, frequencyType, frequencyValue, nextDueDate } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.AssetActivities (AssetId, AreaId, ActivityId, FrequencyType, FrequencyValue, NextDueDate)
      VALUES (@assetId, @areaId, @activityId, @type, @val, @due);
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const result = await pool.request()
      .input('assetId', sql.Int, assetId || null)
      .input('areaId', sql.Int, areaId || null)
      .input('activityId', sql.Int, activityId)
      .input('type', sql.NVarChar, frequencyType || 'Mensual')
      .input('val', sql.Int, frequencyValue || 1)
      .input('due', sql.Date, new Date(nextDueDate))
      .query(query);

    res.status(201).json({ id: result.recordset[0].Id, message: 'Actividad preventiva programada en Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al programar actividad preventiva', details: e.message });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.AssetActivities WHERE Id = @id');
    res.json({ message: 'Entrada de cronograma eliminada de Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar entrada de cronograma', details: e.message });
  }
});

module.exports = router;
