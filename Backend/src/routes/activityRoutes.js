const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

// GET /api/activities (Catálogo en MANSOLE)
router.get('/', async (req, res) => {
  const { categoryId, areaId } = req.query;
  try {
    const pool = await getDbConnection();
    let query = `
      SELECT DISTINCT a.* 
      FROM MANSOLE.Activities a
      LEFT JOIN MANSOLE.ActivityCategories ac ON a.Id = ac.ActivityId
      LEFT JOIN MANSOLE.ActivityAreas aa ON a.Id = aa.ActivityId
      WHERE 1=1
    `;
    const request = pool.request();
    if (categoryId) {
      query += ` AND ac.CategoryId = @categoryId`;
      request.input('categoryId', sql.Int, categoryId);
    }
    if (areaId) {
      query += ` OR aa.AreaId = @areaId`;
      request.input('areaId', sql.Int, areaId);
    }
    query += ' ORDER BY a.Type, a.Name';
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al consultar catálogo de actividades', details: e.message });
  }
});

// POST /api/activities (Crear nueva en MANSOLE)
router.post('/', async (req, res) => {
  const { name, type, estimatedMinutes, resources, categoryIds, areaIds } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.Activities (Name, Type, EstimatedMinutes, Resources)
      VALUES (@name, @type, @est, @res);
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('type', sql.NVarChar, type || 'Mecánico')
      .input('est', sql.Int, estimatedMinutes || 30)
      .input('res', sql.NVarChar, resources || '')
      .query(query);

    const newId = result.recordset[0].Id;
    if (Array.isArray(categoryIds)) {
      for (let catId of categoryIds) {
        await pool.request().input('actId', sql.Int, newId).input('catId', sql.Int, catId)
          .query('INSERT INTO MANSOLE.ActivityCategories (ActivityId, CategoryId) VALUES (@actId, @catId)');
      }
    }
    if (Array.isArray(areaIds)) {
      for (let aId of areaIds) {
        await pool.request().input('actId', sql.Int, newId).input('areaId', sql.Int, aId)
          .query('INSERT INTO MANSOLE.ActivityAreas (ActivityId, AreaId) VALUES (@actId, @areaId)');
      }
    }
    res.status(201).json({ id: newId, message: 'Actividad registrada correctamente en Azure SQL' });
  } catch (e) {
    res.status(500).json({ error: 'Error al insertar actividad maestra', details: e.message });
  }
});

// PUT /api/activities/:id (Actualizar actividad)
router.put('/:id', async (req, res) => {
  const { name, type, estimatedMinutes, resources } = req.body;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('type', sql.NVarChar, type)
      .input('est', sql.Int, estimatedMinutes)
      .input('res', sql.NVarChar, resources)
      .query(`
        UPDATE MANSOLE.Activities 
        SET Name=@name, Type=@type, EstimatedMinutes=@est, Resources=@res
        WHERE Id=@id
      `);
    res.json({ message: 'Actividad actualizada' });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar actividad', details: e.message });
  }
});

// DELETE /api/activities/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.Activities WHERE Id = @id');
    res.json({ message: 'Actividad eliminada de Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar actividad', details: e.message });
  }
});

module.exports = router;
