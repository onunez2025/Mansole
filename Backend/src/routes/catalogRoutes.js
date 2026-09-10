const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

/* =========================================================================
   1. CATÁLOGO DE ÁREAS DE PLANTA (MANSOLE.Areas)
   ========================================================================= */

// GET /api/catalogs/areas
router.get('/areas', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT a.Id, a.CompanyId, a.Name, a.CostCenterCode, a.Description,
             (SELECT COUNT(*) FROM MANSOLE.Assets WHERE AreaId = a.Id) as AssetCount
      FROM MANSOLE.Areas a
      ORDER BY a.Name ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error GET /catalogs/areas:', err);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
});

// POST /api/catalogs/areas
router.post('/areas', async (req, res) => {
  const { name, costCenterCode, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del área es requerido' });
  }
  try {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('costCenterCode', sql.NVarChar, costCenterCode ? costCenterCode.trim() : 'CECO-SOL-101')
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .input('companyId', sql.Int, 1)
      .query(`
        INSERT INTO MANSOLE.Areas (CompanyId, Name, CostCenterCode, Description)
        OUTPUT INSERTED.Id
        VALUES (@companyId, @name, @costCenterCode, @description)
      `);
    res.status(201).json({ id: result.recordset[0].Id, message: 'Área creada con éxito' });
  } catch (err) {
    console.error('Error POST /catalogs/areas:', err);
    res.status(500).json({ error: 'Error al crear área' });
  }
});

// PUT /api/catalogs/areas/:id
router.put('/areas/:id', async (req, res) => {
  const { name, costCenterCode, description } = req.body;
  const { id } = req.params;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del área es requerido' });
  }
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('name', sql.NVarChar, name.trim())
      .input('costCenterCode', sql.NVarChar, costCenterCode ? costCenterCode.trim() : 'CECO-SOL-101')
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .query(`
        UPDATE MANSOLE.Areas
        SET Name = @name, CostCenterCode = @costCenterCode, Description = @description
        WHERE Id = @id
      `);
    res.json({ message: 'Área actualizada con éxito' });
  } catch (err) {
    console.error('Error PUT /catalogs/areas/:id:', err);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
});

// DELETE /api/catalogs/areas/:id
router.delete('/areas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getDbConnection();
    const countCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COUNT(*) as count FROM MANSOLE.Assets WHERE AreaId = @id');
    
    if (countCheck.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el área porque contiene ${countCheck.recordset[0].count} activo(s) asignado(s). Reasigne primero las máquinas.` 
      });
    }

    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM MANSOLE.Areas WHERE Id = @id');

    res.json({ message: 'Área eliminada con éxito' });
  } catch (err) {
    console.error('Error DELETE /catalogs/areas/:id:', err);
    res.status(500).json({ error: 'Error al eliminar área' });
  }
});

/* =========================================================================
   2. CATÁLOGO DE CATEGORÍAS DE ACTIVOS (MANSOLE.AssetCategories)
   ========================================================================= */

// GET /api/catalogs/categories
router.get('/categories', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT c.Id, c.Name, c.Description,
             (SELECT COUNT(*) FROM MANSOLE.Assets WHERE CategoryId = c.Id) as AssetCount
      FROM MANSOLE.AssetCategories c
      ORDER BY c.Name ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error GET /catalogs/categories:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST /api/catalogs/categories
router.post('/categories', async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }
  try {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .query(`
        INSERT INTO MANSOLE.AssetCategories (Name, Description)
        OUTPUT INSERTED.Id
        VALUES (@name, @description)
      `);
    res.status(201).json({ id: result.recordset[0].Id, message: 'Categoría creada con éxito' });
  } catch (err) {
    console.error('Error POST /catalogs/categories:', err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PUT /api/catalogs/categories/:id
router.put('/categories/:id', async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .query(`
        UPDATE MANSOLE.AssetCategories
        SET Name = @name, Description = @description
        WHERE Id = @id
      `);
    res.json({ message: 'Categoría actualizada con éxito' });
  } catch (err) {
    console.error('Error PUT /catalogs/categories/:id:', err);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE /api/catalogs/categories/:id
router.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getDbConnection();
    const countCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COUNT(*) as count FROM MANSOLE.Assets WHERE CategoryId = @id');

    if (countCheck.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría porque contiene ${countCheck.recordset[0].count} activo(s) asociado(s).` 
      });
    }

    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM MANSOLE.AssetCategories WHERE Id = @id');

    res.json({ message: 'Categoría eliminada con éxito' });
  } catch (err) {
    console.error('Error DELETE /catalogs/categories/:id:', err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

/* =========================================================================
   3. CATÁLOGO DE CENTROS DE COSTO (MANSOLE.CeCoste)
   ========================================================================= */

// GET /api/catalogs/cost-centers
router.get('/cost-centers', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT CeCoste, CeCosteDescripcion, Gerencia, Area, Responsable, Observaciones
      FROM MANSOLE.CeCoste
      ORDER BY CeCoste ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error GET /catalogs/cost-centers:', err);
    res.status(500).json({ error: 'Error al obtener centros de costo' });
  }
});

// POST /api/catalogs/cost-centers
router.post('/cost-centers', async (req, res) => {
  const { ceCoste, ceCosteDescripcion, gerencia, area, responsable, observaciones } = req.body;
  if (!ceCoste || !ceCosteDescripcion) {
    return res.status(400).json({ error: 'Código de CECO y Descripción son requeridos' });
  }
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('ceCoste', sql.NVarChar, ceCoste.trim())
      .input('ceCosteDescripcion', sql.NVarChar, ceCosteDescripcion.trim())
      .input('gerencia', sql.NVarChar, gerencia ? gerencia.trim() : 'G. Producción')
      .input('area', sql.NVarChar, area ? area.trim() : 'Producción')
      .input('responsable', sql.NVarChar, responsable ? responsable.trim() : '')
      .input('observaciones', sql.NVarChar, observaciones ? observaciones.trim() : '')
      .query(`
        INSERT INTO MANSOLE.CeCoste (CeCoste, CeCosteDescripcion, Gerencia, Area, Responsable, Observaciones)
        VALUES (@ceCoste, @ceCosteDescripcion, @gerencia, @area, @responsable, @observaciones)
      `);
    res.status(201).json({ message: 'Centro de costo registrado con éxito' });
  } catch (err) {
    console.error('Error POST /catalogs/cost-centers:', err);
    res.status(500).json({ error: 'Error al registrar centro de costo' });
  }
});

// PUT /api/catalogs/cost-centers/:code
router.put('/cost-centers/:code', async (req, res) => {
  const { ceCosteDescripcion, gerencia, area, responsable, observaciones } = req.body;
  const { code } = req.params;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('ceCoste', sql.NVarChar, code)
      .input('ceCosteDescripcion', sql.NVarChar, ceCosteDescripcion.trim())
      .input('gerencia', sql.NVarChar, gerencia ? gerencia.trim() : 'G. Producción')
      .input('area', sql.NVarChar, area ? area.trim() : 'Producción')
      .input('responsable', sql.NVarChar, responsable ? responsable.trim() : '')
      .input('observaciones', sql.NVarChar, observaciones ? observaciones.trim() : '')
      .query(`
        UPDATE MANSOLE.CeCoste
        SET CeCosteDescripcion = @ceCosteDescripcion,
            Gerencia = @gerencia,
            Area = @area,
            Responsable = @responsable,
            Observaciones = @observaciones
        WHERE CeCoste = @ceCoste
      `);
    res.json({ message: 'Centro de costo actualizado con éxito' });
  } catch (err) {
    console.error('Error PUT /catalogs/cost-centers/:code:', err);
    res.status(500).json({ error: 'Error al actualizar centro de costo' });
  }
});

// DELETE /api/catalogs/cost-centers/:code
router.delete('/cost-centers/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('ceCoste', sql.NVarChar, code)
      .query('DELETE FROM MANSOLE.CeCoste WHERE CeCoste = @ceCoste');
    res.json({ message: 'Centro de costo eliminado con éxito' });
  } catch (err) {
    console.error('Error DELETE /catalogs/cost-centers/:code:', err);
    res.status(500).json({ error: 'Error al eliminar centro de costo' });
  }
});

/* =========================================================================
   4. CATÁLOGO DE UBICACIONES (MANSOLE.Locations)
   ========================================================================= */

// GET /api/catalogs/locations
router.get('/locations', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT l.Id, l.Name, l.Description, l.CreatedAt,
             (SELECT COUNT(*) FROM MANSOLE.Assets WHERE LocationId = l.Id) as AssetCount
      FROM MANSOLE.Locations l
      ORDER BY l.Name ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error GET /catalogs/locations:', err);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
});

// POST /api/catalogs/locations
router.post('/locations', async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la ubicación es requerido' });
  }
  try {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .query(`
        INSERT INTO MANSOLE.Locations (Name, Description)
        OUTPUT INSERTED.Id
        VALUES (@name, @description)
      `);
    res.status(201).json({ id: result.recordset[0].Id, message: 'Ubicación registrada con éxito' });
  } catch (err) {
    console.error('Error POST /catalogs/locations:', err);
    res.status(500).json({ error: 'Error al registrar ubicación' });
  }
});

// PUT /api/catalogs/locations/:id
router.put('/locations/:id', async (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la ubicación es requerido' });
  }
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('name', sql.NVarChar, name.trim())
      .input('description', sql.NVarChar, description ? description.trim() : '')
      .query(`
        UPDATE MANSOLE.Locations
        SET Name = @name, Description = @description
        WHERE Id = @id
      `);
    res.json({ message: 'Ubicación actualizada con éxito' });
  } catch (err) {
    console.error('Error PUT /catalogs/locations/:id:', err);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
});

// DELETE /api/catalogs/locations/:id
router.delete('/locations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getDbConnection();
    const countCheck = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT COUNT(*) as count FROM MANSOLE.Assets WHERE LocationId = @id');

    if (countCheck.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la ubicación porque contiene ${countCheck.recordset[0].count} activo(s) asociado(s).` 
      });
    }

    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('DELETE FROM MANSOLE.Locations WHERE Id = @id');

    res.json({ message: 'Ubicación eliminada con éxito' });
  } catch (err) {
    console.error('Error DELETE /catalogs/locations/:id:', err);
    res.status(500).json({ error: 'Error al eliminar ubicación' });
  }
});

module.exports = router;