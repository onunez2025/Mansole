const express = require('express');
const router = express.Router();
const { getDbConnection, sql } = require('../config/db');

// GET /api/users — Listado desde MANSOLE con JOIN correcto a Roles
router.get('/', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT
        u.Id, u.Name, u.Email, u.Username, u.Status,
        u.Role_Id, r.Name AS RoleName
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
      ORDER BY u.Name ASC
    `);
    const users = result.recordset.map(u => ({
      id: u.Id,
      name: u.Name,
      email: u.Email,
      username: u.Username,
      role: u.RoleName || 'Sin Rol',
      status: u.Status,
      isActive: u.Status === 'Activo'
    }));
    res.json(users);
  } catch (e) {
    console.error('Error GET /api/users:', e.message);
    res.status(500).json({ error: 'Error al obtener usuarios', details: e.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT u.Id, u.Name, u.Email, u.Username, u.Status,
               u.Role_Id, r.Name AS RoleName
        FROM MANSOLE.Users u
        LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
        WHERE u.Id = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const u = result.recordset[0];
    res.json({ id: u.Id, name: u.Name, email: u.Email, username: u.Username, role: u.RoleName, status: u.Status });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuario', details: e.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const { name, email, role, status } = req.body;
  try {
    const pool = await getDbConnection();
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, role)
      .query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');
    const roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].Id : 3;
    const username = (email || '').split('@')[0] || name.replace(/\s/g, '').toLowerCase();
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('username', sql.NVarChar, username)
      .input('roleId', sql.Int, roleId)
      .input('status', sql.NVarChar, status || 'Activo')
      .query(`
        INSERT INTO MANSOLE.Users (Name, Email, Username, Password_Hash, Role_Id, Status)
        VALUES (@name, @email, @username, 'pending_hash', @roleId, @status)
      `);
    res.status(201).json({ message: 'Usuario creado en Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear usuario', details: e.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { name, email, role, status } = req.body;
  try {
    const pool = await getDbConnection();
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, role)
      .query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');
    const roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].Id : 3;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('roleId', sql.Int, roleId)
      .input('status', sql.NVarChar, status || 'Activo')
      .query(`
        UPDATE MANSOLE.Users
        SET Name = @name, Email = @email, Role_Id = @roleId, Status = @status
        WHERE Id = @id
      `);
    res.json({ message: 'Usuario actualizado en Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: e.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.Users WHERE Id = @id');
    res.json({ message: 'Usuario eliminado de Azure SQL (MANSOLE)' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: e.message });
  }
});

module.exports = router;
