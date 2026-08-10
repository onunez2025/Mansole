const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDbConnection, sql } = require('../config/db');
const { generateTokens, verifyToken } = require('../utils/jwt');
const {
  authenticateToken, rateLimit, auditLog, checkPermission, checkRole
} = require('../middleware/authMiddleware');
const { getPermissionsForRole, ALL_PERMISSIONS } = require('../config/permissions');

/**
 * Consulta base de usuario contra el esquema real de MANSOLE.Users
 * (Id, FirstName, LastName, Email, PasswordHash, RoleId, IsActive, CreatedAt).
 */
const USER_SELECT = `
  SELECT
    u.Id, u.Email, u.FirstName, u.LastName, u.IsActive, u.PasswordHash,
    u.RoleId, r.Name AS RoleName
  FROM MANSOLE.Users u
  LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
`;

/** Normaliza una fila de Users al shape que consume el frontend. */
function toPublicUser(row) {
  return {
    id: row.Id,
    email: row.Email,
    name: [row.FirstName, row.LastName].filter(Boolean).join(' ').trim(),
    roleId: row.RoleId,
    role: row.RoleName || null,
    isActive: !!row.IsActive,
    permissions: getPermissionsForRole(row.RoleName)
  };
}

/**
 * POST /api/auth/login
 * Autenticar usuario con email y contraseña
 */
router.post('/login', rateLimit(5, 15 * 60 * 1000), async (req, res) => {
  // Se acepta `username` como alias histórico, pero el identificador es el email.
  const email = req.body.email || req.body.username;
  const { password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password requeridos' });
    }

    const pool = await getDbConnection();

    const userResult = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query(`${USER_SELECT} WHERE LOWER(u.Email) = @email`);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const row = userResult.recordset[0];

    // Verificar contraseña. Un hash ausente o corrupto nunca debe autenticar.
    const storedHash = row.PasswordHash || '';
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, storedHash);
    } catch {
      validPassword = false;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!row.IsActive) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
    }

    const user = toPublicUser(row);
    const tokens = generateTokens(user, user.permissions);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al autenticar' });
  }
});

/**
 * POST /api/auth/refresh
 * Refrescar access token usando refresh token
 */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const pool = await getDbConnection();
    const userResult = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`${USER_SELECT} WHERE u.Id = @userId`);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const row = userResult.recordset[0];

    // Un usuario desactivado no puede renovar su sesión.
    if (!row.IsActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    const user = toPublicUser(row);
    const tokens = generateTokens(user, user.permissions);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

/**
 * GET /api/auth/me
 * Obtener usuario actual y sus permisos
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = await getDbConnection();
    const userResult = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query(`${USER_SELECT} WHERE u.Id = @userId`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const row = userResult.recordset[0];

    if (!row.IsActive) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    res.json({ success: true, user: toPublicUser(row) });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Error al obtener usuario', details: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout (frontend debe eliminar tokens)
 */
router.post('/logout', authenticateToken, auditLog('LOGOUT', 'Users'), async (req, res) => {
  res.json({ success: true, message: 'Logout exitoso' });
});

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 */
router.post('/change-password', authenticateToken, auditLog('CHANGE_PASSWORD', 'Users'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const pool = await getDbConnection();
    const userResult = await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .query('SELECT PasswordHash FROM MANSOLE.Users WHERE Id = @userId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(currentPassword, userResult.recordset[0].PasswordHash || '');
    } catch {
      validPassword = false;
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('passwordHash', sql.NVarChar, hashedNewPassword)
      .query('UPDATE MANSOLE.Users SET PasswordHash = @passwordHash WHERE Id = @userId');

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

/* ------------------------------------------------------------------ *
 * Administración de usuarios y roles.
 * Contra el esquema real: MANSOLE.Users
 * (Id, FirstName, LastName, Email, PasswordHash, RoleId, IsActive)
 * y MANSOLE.Roles (Id, Name).
 * ------------------------------------------------------------------ */

/** 'Roberto Gómez Díaz' -> { firstName: 'Roberto', lastName: 'Gómez Díaz' } */
function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ')
  };
}

// GET /api/auth/users
router.get('/users', authenticateToken, checkPermission('mansole.users.view'), async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT u.Id, u.FirstName, u.LastName, u.Email, u.IsActive, u.RoleId, r.Name AS RoleName
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
      ORDER BY u.FirstName, u.LastName
    `);

    res.json(result.recordset.map((u) => ({
      id: u.Id,
      name: [u.FirstName, u.LastName].filter(Boolean).join(' ').trim(),
      email: u.Email,
      role: u.RoleName || 'Sin Rol',
      isActive: !!u.IsActive,
      status: u.IsActive ? 'Activo' : 'Suspendido'
    })));
  } catch (e) {
    console.error('Error GET /api/auth/users:', e.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/auth/users
router.post('/users', authenticateToken, checkPermission('mansole.users.create'),
  auditLog('CREATE_USER', 'Users'), async (req, res) => {
  const { name, email, role, isActive } = req.body;

  try {
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email requeridos' });
    }

    const pool = await getDbConnection();
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, role)
      .query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ error: `Rol desconocido: ${role}` });
    }

    // Contraseña inicial aleatoria que nadie conoce: la cuenta queda inutilizable
    // hasta que un administrador le asigne una con scripts/set-password.js.
    const unusablePassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const { firstName, lastName } = splitName(name);

    await pool.request()
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email)
      .input('pass', sql.NVarChar, unusablePassword)
      .input('roleId', sql.Int, roleResult.recordset[0].Id)
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        INSERT INTO MANSOLE.Users (FirstName, LastName, Email, PasswordHash, RoleId, IsActive)
        VALUES (@firstName, @lastName, @email, @pass, @roleId, @isActive)
      `);

    res.status(201).json({
      message: 'Usuario creado',
      note: `Sin contraseña utilizable. Asignar con: node scripts/set-password.js ${email}`
    });
  } catch (e) {
    console.error('Error POST /api/auth/users:', e.message);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/auth/users/:id
router.put('/users/:id', authenticateToken, checkPermission('mansole.users.edit'),
  auditLog('UPDATE_USER', 'Users'), async (req, res) => {
  const { name, email, role, isActive } = req.body;

  try {
    const pool = await getDbConnection();
    const roleResult = await pool.request()
      .input('roleName', sql.NVarChar, role)
      .query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');

    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ error: `Rol desconocido: ${role}` });
    }

    const { firstName, lastName } = splitName(name);

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('firstName', sql.NVarChar, firstName)
      .input('lastName', sql.NVarChar, lastName)
      .input('email', sql.NVarChar, email)
      .input('roleId', sql.Int, roleResult.recordset[0].Id)
      .input('isActive', sql.Bit, isActive ? 1 : 0)
      .query(`
        UPDATE MANSOLE.Users
        SET FirstName = @firstName, LastName = @lastName, Email = @email,
            RoleId = @roleId, IsActive = @isActive
        WHERE Id = @id
      `);

    res.json({ message: 'Usuario actualizado' });
  } catch (e) {
    console.error('Error PUT /api/auth/users/:id:', e.message);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PUT /api/auth/users/:id/status
router.put('/users/:id/status', authenticateToken, checkPermission('mansole.users.edit'),
  auditLog('TOGGLE_USER_STATUS', 'Users'), async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('isActive', sql.Bit, req.body.isActive ? 1 : 0)
      .query('UPDATE MANSOLE.Users SET IsActive = @isActive WHERE Id = @id');

    res.json({ message: 'Estado actualizado' });
  } catch (e) {
    console.error('Error PUT /api/auth/users/:id/status:', e.message);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', authenticateToken, checkPermission('mansole.users.delete'),
  auditLog('DELETE_USER', 'Users'), async (req, res) => {
  try {
    // Evitar que un administrador se borre a sí mismo y deje el sistema sin acceso.
    if (Number(req.params.id) === Number(req.user.userId)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const pool = await getDbConnection();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.Users WHERE Id = @id');

    res.json({ message: 'Usuario eliminado' });
  } catch (e) {
    console.error('Error DELETE /api/auth/users/:id:', e.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/auth/roles
router.get('/roles', authenticateToken, checkPermission('mansole.users.view'), async (req, res) => {
  try {
    const pool = await getDbConnection();
    // MANSOLE.Roles solo tiene Id y Name; el conteo sale del mapa de permisos.
    const result = await pool.request().query('SELECT Id, Name FROM MANSOLE.Roles ORDER BY Id');

    res.json(result.recordset.map((r) => {
      const perms = getPermissionsForRole(r.Name);
      return {
        id: r.Id,
        name: r.Name,
        permissionCount: perms.includes('*') ? ALL_PERMISSIONS.length : perms.length
      };
    }));
  } catch (e) {
    console.error('Error GET /api/auth/roles:', e.message);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// POST /api/auth/roles
router.post('/roles', authenticateToken, checkRole('Administrador'),
  auditLog('CREATE_ROLE', 'Roles'), async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Nombre de rol requerido' });
    }

    const pool = await getDbConnection();
    await pool.request()
      .input('name', sql.NVarChar, req.body.name)
      .query('INSERT INTO MANSOLE.Roles (Name) VALUES (@name)');

    res.status(201).json({
      message: 'Rol creado',
      note: 'Sin permisos hasta agregarlo a ROLE_PERMISSIONS en Backend/src/config/permissions.js'
    });
  } catch (e) {
    console.error('Error POST /api/auth/roles:', e.message);
    res.status(500).json({ error: 'Error al crear rol' });
  }
});

// DELETE /api/auth/roles/:id
router.delete('/roles/:id', authenticateToken, checkRole('Administrador'),
  auditLog('DELETE_ROLE', 'Roles'), async (req, res) => {
  try {
    const pool = await getDbConnection();
    const inUse = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS n FROM MANSOLE.Users WHERE RoleId = @id');

    if (inUse.recordset[0].n > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: ${inUse.recordset[0].n} usuario(s) tienen este rol`
      });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM MANSOLE.Roles WHERE Id = @id');

    res.json({ message: 'Rol eliminado' });
  } catch (e) {
    console.error('Error DELETE /api/auth/roles/:id:', e.message);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
});

module.exports = router;
