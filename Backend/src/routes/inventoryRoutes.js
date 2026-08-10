const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

function normalizeItem(item, idx) {
  const obj = {};
  for (let k in item) {
    obj[k] = item[k];
    const camel = k.charAt(0).toLowerCase() + k.slice(1);
    if (obj[camel] === undefined) obj[camel] = item[k];
  }
  obj.id = obj.id || obj.Id || idx + 1;
  obj.unitCost = Number(obj.unitCost !== undefined ? obj.unitCost : (obj.UnitCost !== undefined ? obj.UnitCost : 0));
  obj.currentStock = Number(obj.currentStock !== undefined ? obj.currentStock : (obj.CurrentStock !== undefined ? obj.CurrentStock : 0));
  obj.minStock = Number(obj.minStock !== undefined ? obj.minStock : (obj.MinStock !== undefined ? obj.MinStock : 0));
  obj.name = obj.name || obj.Name || 'Repuesto SOLE';
  obj.code = obj.code || obj.Code || `REP-${idx + 100}`;
  obj.location = obj.location || obj.Location || 'Almacén Central';
  obj.unitOfMeasure = obj.unitOfMeasure || obj.UnitOfMeasure || 'Pieza';
  obj.condition = obj.condition || obj.Condition || (obj.unitCost === 0 ? 'Reusado' : 'Nuevo');
  return obj;
}

// GET /api/inventory (Catálogo en MANSOLE normalizado)
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT * FROM MANSOLE.SpareParts ORDER BY Name');
    res.json(result.recordset.map((r, idx) => normalizeItem(r, idx)));
  } catch (e) {
    res.status(500).json({ error: 'Error cargando inventario desde SQL', details: e.message });
  }
});

// GET /api/inventory/transactions (Historial en MANSOLE)
router.get('/transactions', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const query = `
      SELECT t.*, s.Name as SparePartName, s.Code as SparePartCode
      FROM MANSOLE.InventoryTransactions t
      JOIN MANSOLE.SpareParts s ON t.SparePartId = s.Id
      ORDER BY t.Date DESC
    `;
    const result = await pool.request().query(query);
    res.json(result.recordset.map((r, idx) => normalizeItem(r, idx)));
  } catch (e) {
    res.status(500).json({ error: 'Error cargando historial de transacciones desde SQL', details: e.message });
  }
});

// POST /api/inventory/transaction
router.post('/transaction', async (req, res) => {
  const { sparePartId, transactionType, reason, quantity, unitCost, reference, newPart } = req.body;
  try {
    let partId = sparePartId;
    const pool = await getDbConnection();
    if (!partId && newPart) {
      const insertPartQuery = `
        INSERT INTO MANSOLE.SpareParts (Code, Name, Description, UnitOfMeasure, CurrentStock, MinStock, Location, UnitCost, Condition)
        VALUES (@code, @name, @desc, @uom, 0, @minStock, @location, @cost, @condition);
        SELECT SCOPE_IDENTITY() AS Id;
      `;
      const pRes = await pool.request()
        .input('code', sql.NVarChar, newPart.code || `CANIB-${Date.now()}`)
        .input('name', sql.NVarChar, newPart.name)
        .input('desc', sql.NVarChar, newPart.description || '')
        .input('uom', sql.NVarChar, newPart.unitOfMeasure || 'Pieza')
        .input('minStock', sql.Decimal(10,2), newPart.minStock || 0)
        .input('location', sql.NVarChar, newPart.location || 'Almacén Canibalización')
        .input('cost', sql.Decimal(12,2), unitCost || 0)
        .input('condition', sql.NVarChar, reason === 'Canibalización' ? 'Reusado' : 'Nuevo')
        .query(insertPartQuery);
      partId = pRes.recordset[0].Id;
    }

    const qty = parseFloat(quantity || 0);
    const cost = parseFloat(unitCost || 0);
    const stockChange = transactionType === 'IN' ? qty : -qty;

    const txQuery = `
      INSERT INTO MANSOLE.InventoryTransactions (SparePartId, TransactionType, Reason, Quantity, UnitCost, Reference)
      VALUES (@partId, @type, @reason, @qty, @cost, @ref);
      UPDATE MANSOLE.SpareParts SET CurrentStock = CurrentStock + @stockChange WHERE Id = @partId;
    `;
    await pool.request()
      .input('partId', sql.Int, partId)
      .input('type', sql.NVarChar, transactionType)
      .input('reason', sql.NVarChar, reason)
      .input('qty', sql.Decimal(10,2), qty)
      .input('cost', sql.Decimal(12,2), cost)
      .input('ref', sql.NVarChar, reference || '')
      .input('stockChange', sql.Decimal(10,2), stockChange)
      .query(txQuery);

    res.status(201).json({ message: 'Transacción e impacto de stock registrados en Azure SQL (MANSOLE)' });
  } catch (e) {
    console.error('Error insertando inventario:', e.message);
    res.status(500).json({ error: 'Error registrando transacción de inventario', details: e.message });
  }
});

// POST /api/inventory (Nuevo ítem estático sin transacción inmediata)
router.post('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const insertPartQuery = `
      INSERT INTO MANSOLE.SpareParts (Code, Name, Description, UnitOfMeasure, CurrentStock, MinStock, Location, UnitCost, Condition)
      VALUES (@code, @name, @desc, @uom, @current, @minStock, @location, @cost, @condition);
      SELECT SCOPE_IDENTITY() AS Id;
    `;
    const pRes = await pool.request()
      .input('code', sql.NVarChar, req.body.code || `REP-${Date.now()}`)
      .input('name', sql.NVarChar, req.body.name)
      .input('desc', sql.NVarChar, req.body.description || '')
      .input('uom', sql.NVarChar, req.body.unitOfMeasure || 'Pieza')
      .input('current', sql.Decimal(10,2), parseFloat(req.body.currentStock || 0))
      .input('minStock', sql.Decimal(10,2), parseFloat(req.body.minStock || 0))
      .input('location', sql.NVarChar, req.body.location || 'Almacén')
      .input('cost', sql.Decimal(12,2), parseFloat(req.body.unitCost || 0))
      .input('condition', sql.NVarChar, req.body.condition || 'Nuevo')
      .query(insertPartQuery);
    
    res.status(201).json({ id: pRes.recordset[0].Id, message: 'Repuesto registrado en Azure SQL' });
  } catch (e) {
    res.status(500).json({ error: 'Error registrando repuesto', details: e.message });
  }
});

// PUT /api/inventory/:id (Actualizar repuesto)
router.put('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, req.body.name)
      .input('desc', sql.NVarChar, req.body.description || '')
      .input('uom', sql.NVarChar, req.body.unitOfMeasure || 'Pieza')
      .input('current', sql.Decimal(10,2), parseFloat(req.body.currentStock || 0))
      .input('minStock', sql.Decimal(10,2), parseFloat(req.body.minStock || 0))
      .input('location', sql.NVarChar, req.body.location || 'Almacén')
      .input('cost', sql.Decimal(12,2), parseFloat(req.body.unitCost || 0))
      .input('condition', sql.NVarChar, req.body.condition || 'Nuevo')
      .query(`
        UPDATE MANSOLE.SpareParts
        SET Name=@name, Description=@desc, UnitOfMeasure=@uom,
            CurrentStock=@current, MinStock=@minStock, Location=@location,
            UnitCost=@cost, Condition=@condition
        WHERE Id=@id
      `);
    res.json({ message: 'Repuesto actualizado en Azure SQL' });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar repuesto', details: e.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.SpareParts WHERE Id = @id');
    res.json({ message: 'Repuesto eliminado de Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar repuesto', details: e.message });
  }
});

module.exports = router;
