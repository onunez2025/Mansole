const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

// GET /api/assets (Listado completo con jerarquía y CECO en esquema MANSOLE)
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT a.*, c.Name as CategoryName, ar.Name as AreaName, ar.CostCenterCode,
             l.Name as LocationName
      FROM MANSOLE.Assets a
      LEFT JOIN MANSOLE.AssetCategories c ON a.CategoryId = c.Id
      LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
      LEFT JOIN MANSOLE.Locations l ON a.LocationId = l.Id
      ORDER BY a.Name
    `;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (e) {
    console.error('Error GET assets:', e.message);
    res.status(500).json({ error: 'Error de conexión a la Base de Datos' });
  }
});

// GET /api/assets/areas (Listado de Áreas y sus CECOs en MANSOLE)
router.get('/areas', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.Areas ORDER BY CostCenterCode');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar áreas' });
  }
});

// GET /api/assets/categories (Listado de Categorías de máquinas en MANSOLE)
router.get('/categories', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.AssetCategories ORDER BY Name');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar categorías' });
  }
});

// GET /api/assets/locations (Listado de Ubicaciones físicas en MANSOLE)
router.get('/locations', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.Locations ORDER BY Name');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar ubicaciones' });
  }
});

// GET /api/assets/public-qr/:code (Consulta rápida sin login al escanear QR con celular)
router.get('/public-qr/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const pool = await getDbConnection();
    const assetRes = await pool.request()
      .input('code', sql.NVarChar, code)
      .query(`
        SELECT a.Id, a.Code, a.Name, a.Brand, a.Model, a.SerialNumber, a.Status, a.ImageUrl,
               c.Name as CategoryName, ar.Name as AreaName, ar.CostCenterCode,
               l.Name as LocationName
        FROM MANSOLE.Assets a
        LEFT JOIN MANSOLE.AssetCategories c ON a.CategoryId = c.Id
        LEFT JOIN MANSOLE.Areas ar ON a.AreaId = ar.Id
        LEFT JOIN MANSOLE.Locations l ON a.LocationId = l.Id
        WHERE a.Code = @code OR CAST(a.Id AS NVARCHAR) = @code
      `);

    if (assetRes.recordset.length === 0) {
      return res.status(404).json({ error: 'Máquina o activo no encontrado' });
    }

    const asset = assetRes.recordset[0];

    const otRes = await pool.request()
      .input('assetId', sql.Int, asset.Id)
      .query(`
        SELECT w.Id, w.Code, w.Description, w.MaintenanceType, w.Priority, w.Status,
               w.AssignedTo, w.CreatedAt, w.ScheduledStartDate, w.ScheduledEndDate,
               u.FullName as AssignedTechnicianName
        FROM MANSOLE.WorkOrders w
        LEFT JOIN MANSOLE.Users u ON w.AssignedTo = u.Id
        WHERE w.AssetId = @assetId AND w.Status IN ('Abierta', 'Pendiente', 'En Progreso', 'En Proceso', 'En Pausa', 'Asignada')
        ORDER BY CASE WHEN w.Priority = 'Critica' OR w.Priority = 'Crítica' THEN 1 WHEN w.Priority = 'Alta' THEN 2 ELSE 3 END, w.CreatedAt DESC
      `);

    res.json({
      asset,
      pendingWorkOrders: otRes.recordset
    });
  } catch (err) {
    console.error('Error GET /public-qr/:code:', err);
    res.status(500).json({ error: 'Error al consultar datos de escaneo QR' });
  }
});

// POST /api/assets (Crear nuevo activo en Azure SQL MANSOLE)
router.post('/', async (req, res) => {
  const { code, name, categoryId, brand, model, serialNumber, areaId, locationId, location, acquisitionDate, status, parentAssetId, imageUrl } = req.body;
  try {
    const pool = await getDbConnection();
    const query = `
      INSERT INTO MANSOLE.Assets (Code, Name, CategoryId, Brand, Model, SerialNumber, AreaId, LocationId, Location, AcquisitionDate, Status, ParentAssetId, ImageUrl)
      VALUES (@code, @name, @categoryId, @brand, @model, @serialNumber, @areaId, @locationId, @location, @acquisitionDate, @status, @parentAssetId, @imageUrl);
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
      .input('locationId', sql.Int, locationId ? parseInt(locationId) : null)
      .input('location', sql.NVarChar, location || '')
      .input('acquisitionDate', sql.Date, acquisitionDate ? new Date(acquisitionDate) : null)
      .input('status', sql.NVarChar, status || 'Operativo')
      .input('parentAssetId', sql.Int, parentAssetId ? parseInt(parentAssetId) : null)
      .input('imageUrl', sql.NVarChar, imageUrl || '')
      .query(query);

    res.status(201).json({ id: result.recordset[0].Id, code, message: 'Activo registrado exitosamente en Azure SQL' });
  } catch (e) {
    console.error('Error POST asset:', e.message);
    res.status(500).json({ error: 'Error al insertar activo' });
  }
});

// PUT /api/assets/:id (Edición completa del activo)
router.put('/:id', async (req, res) => {
  const { code, name, brand, model, serialNumber, areaId, locationId, location, categoryId, status, imageUrl } = req.body;
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
      .input('locationId', sql.Int, locationId ? parseInt(locationId) : null)
      .input('location', sql.NVarChar, location || '')
      .input('categoryId', sql.Int, categoryId ? parseInt(categoryId) : null)
      .input('status', sql.NVarChar, status || 'Operativo')
      .input('imageUrl', sql.NVarChar, imageUrl || '')
      .query(`
        UPDATE MANSOLE.Assets
        SET Code=@code, Name=@name, Brand=@brand, Model=@model,
            SerialNumber=@serialNumber, AreaId=@areaId, LocationId=@locationId, Location=@location,
            CategoryId=@categoryId, Status=@status, ImageUrl=@imageUrl
        WHERE Id=@id
      `);
    res.json({ message: 'Activo actualizado en Azure SQL (MANSOLE)' });
  } catch (e) {
    console.error('Error PUT asset:', e.message);
    res.status(500).json({ error: 'Error al actualizar activo' });
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
    res.status(500).json({ error: 'Error al actualizar estado' });
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
    res.status(500).json({ error: 'Error al eliminar activo' });
  }
});

module.exports = router;
