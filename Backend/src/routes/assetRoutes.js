const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

// GET /api/assets (Listado completo con jerarquía y CECO en esquema MANSOLE)
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT a.*, c.Name as CategoryName, ar.Name as AreaName, ar.CostCenterCode
      FROM MANSOLE.Assets a
      LEFT JOIN MANSOLE.AssetCategories c ON a.CategoryId = c.Id
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      ORDER BY a.Name
    `;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (e) {
    console.error('Error GET assets:', e.message);
    res.status(500).json({ error: 'Error de conexión a la Base de Datos', details: e.message });
  }
});

// GET /api/assets/areas (Listado de Áreas y sus CECOs en MANSOLE)
router.get('/areas', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.Areas ORDER BY CostCenterCode');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar áreas', details: e.message });
  }
});

// GET /api/assets/categories (Listado de Categorías de máquinas en MANSOLE)
router.get('/categories', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.AssetCategories ORDER BY Name');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar categorías', details: e.message });
  }
});

// POST /api/assets (Crear nuevo activo en Azure SQL MANSOLE)
router.post('/', async (req, res) => {
  const { code, name, categoryId, brand, model, serialNumber, areaId, acquisitionDate, status, parentAssetId } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.Assets (Code, Name, CategoryId, Brand, Model, SerialNumber, AreaId, AcquisitionDate, Status, ParentAssetId)
      VALUES (@code, @name, @categoryId, @brand, @model, @serialNumber, @areaId, @acquisitionDate, @status, @parentAssetId);
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const result = await pool.request()
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, name)
      .input('categoryId', sql.Int, categoryId ? parseInt(categoryId) : null)
      .input('brand', sql.NVarChar, brand || '')
      .input('model', sql.NVarChar, model || '')
      .input('serialNumber', sql.NVarChar, serialNumber || '')
      .input('areaId', sql.Int, areaId ? parseInt(areaId) : null)
      .input('acquisitionDate', sql.Date, acquisitionDate ? new Date(acquisitionDate) : null)
      .input('status', sql.NVarChar, status || 'Operativo')
      .input('parentAssetId', sql.Int, parentAssetId ? parseInt(parentAssetId) : null)
      .query(query);

    res.status(201).json({ id: result.recordset[0].Id, code, message: 'Activo registrado exitosamente en Azure SQL' });
  } catch (e) {
    console.error('Error POST asset:', e.message);
    res.status(500).json({ error: 'Error al insertar activo', details: e.message });
  }
});

// PUT /api/assets/:id (Edición completa del activo)
router.put('/:id', async (req, res) => {
  const { code, name, brand, model, serialNumber, areaId, categoryId, status } = req.body;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('code', sql.NVarChar, code)
      .input('name', sql.NVarChar, name)
      .input('brand', sql.NVarChar, brand || '')
      .input('model', sql.NVarChar, model || '')
      .input('serialNumber', sql.NVarChar, serialNumber || '')
      .input('areaId', sql.Int, areaId ? parseInt(areaId) : null)
      .input('categoryId', sql.Int, categoryId ? parseInt(categoryId) : null)
      .input('status', sql.NVarChar, status || 'Operativo')
      .query(`
        UPDATE MANSOLE.Assets
        SET Code=@code, Name=@name, Brand=@brand, Model=@model,
            SerialNumber=@serialNumber, AreaId=@areaId, CategoryId=@categoryId, Status=@status
        WHERE Id=@id
      `);
    res.json({ message: 'Activo actualizado en Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar activo', details: e.message });
  }
});

// PUT /api/assets/:id/status (Actualizar estado en MANSOLE)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE MANSOLE.Assets SET Status = @status WHERE Id = @id');
    res.json({ message: 'Estado actualizado en Azure SQL Server (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar estado', details: e.message });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.Assets WHERE Id = @id');
    res.json({ message: 'Activo eliminado de Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar activo', details: e.message });
  }
});

module.exports = router;
