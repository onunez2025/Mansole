const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDbConnection, sql } = require('../config/db');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { authenticateToken, rateLimit, auditLog } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/login
 * Autenticar usuario con username/email y contraseña
 */
router.post('/login', rateLimit(5, 15 * 60 * 1000), auditLog('LOGIN', 'Users'), async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password requeridos' });
    }

    const pool = await getDbConnection();

    // Obtener usuario y sus permisos
    const userResult = await pool.request()
      .input('username', sql.NVarChar, username.toLowerCase())
      .query(`
        SELECT
          u.Id, u.Username, u.Email, u.Name, u.Status, u.Password_Hash,
          u.Role_Id, r.Name as RoleName,
          STRING_AGG(p.Code, ',') as Permissions
        FROM MANSOLE.Users u
        LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
        LEFT JOIN MANSOLE.Role_Permissions rp ON r.Id = rp.Role_Id
        LEFT JOIN MANSOLE.Permissions p ON rp.Permission_Id = p.Id
        WHERE LOWER(u.Username) = @username
        GROUP BY u.Id, u.Username, u.Email, u.Name, u.Status, u.Password_Hash,
                 u.Role_Id, r.Name
      `);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.recordset[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.Password_Hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que el usuario esté activo
    if (user.Status !== 'Activo') {
      return res.status(403).json({ error: `Usuario ${user.Status}. Contacta al administrador.` });
    }

    // Parsear permisos
    const permissions = user.Permissions ? user.Permissions.split(',').filter(Boolean) : [];

    // Generar tokens
    const tokens = generateTokens(user, permissions);

    // Actualizar último login
    await pool.request()
      .input('userId', sql.Int, user.Id)
      .query('UPDATE MANSOLE.Users SET Last_Login = GETDATE() WHERE Id = @userId');

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        name: user.Name,
        role: user.RoleName,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al autenticar', details: error.message });
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
      .query(`
        SELECT
          u.Id, u.Username, u.Email, u.Name, u.Role_Id,
          STRING_AGG(p.Code, ',') as Permissions
        FROM MANSOLE.Users u
        LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
        LEFT JOIN MANSOLE.Role_Permissions rp ON r.Id = rp.Role_Id
        LEFT JOIN MANSOLE.Permissions p ON rp.Permission_Id = p.Id
        WHERE u.Id = @userId
        GROUP BY u.Id, u.Username, u.Email, u.Name, u.Role_Id
      `);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    const permissions = user.Permissions ? user.Permissions.split(',').filter(Boolean) : [];
    const tokens = generateTokens(user, permissions);

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
      .query(`
        SELECT
          u.Id, u.Username, u.Email, u.Name, u.Status, u.Role_Id, r.Name as RoleName,
          STRING_AGG(p.Code, ',') as Permissions
        FROM MANSOLE.Users u
        LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
        LEFT JOIN MANSOLE.Role_Permissions rp ON r.Id = rp.Role_Id
        LEFT JOIN MANSOLE.Permissions p ON rp.Permission_Id = p.Id
        WHERE u.Id = @userId
        GROUP BY u.Id, u.Username, u.Email, u.Name, u.Status, u.Role_Id, r.Name
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    const permissions = user.Permissions ? user.Permissions.split(',').filter(Boolean) : [];

    res.json({
      success: true,
      user: {
        id: user.Id,
        username: user.Username,
        email: user.Email,
        name: user.Name,
        status: user.Status,
        role: user.RoleName,
        permissions: permissions
      }
    });
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
      .query('SELECT Password_Hash FROM MANSOLE.Users WHERE Id = @userId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    const validPassword = await bcrypt.compare(currentPassword, user.Password_Hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('userId', sql.Int, req.user.userId)
      .input('passwordHash', sql.NVarChar, hashedNewPassword)
      .query('UPDATE MANSOLE.Users SET Password_Hash = @passwordHash WHERE Id = @userId');

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña', details: error.message });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query(`
      SELECT u.Id, u.Name, u.Email, u.Username, u.Status, u.Role_Id, r.Name as RoleName
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.Role_Id = r.Id
    `);
    const users = result.recordset.map(u => ({
      id: u.Id, name: u.Name, email: u.Email, username: u.Username,
      role: u.RoleName, isActive: u.Status === 'Activo', status: u.Status
    }));
    res.json(users);
  } catch(e) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// POST /api/auth/users
router.post('/users', async (req, res) => {
  const { name, email, role, isActive } = req.body;
  try {
    const pool = await getDbConnection();
    const roleResult = await pool.request().input('roleName', sql.NVarChar, role).query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');
    let roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].Id : 3;
    const defaultPass = await bcrypt.hash('Sole2026!', 10);
    const username = email.split('@')[0];
    const status = isActive ? 'Activo' : 'Suspendido';

    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('username', sql.NVarChar, username)
      .input('pass', sql.NVarChar, defaultPass)
      .input('roleId', sql.Int, roleId)
      .input('status', sql.NVarChar, status)
      .query(`
        INSERT INTO MANSOLE.Users (Name, Email, Username, Password_Hash, Role_Id, Status)
        VALUES (@name, @email, @username, @pass, @roleId, @status)
      `);
    res.status(201).json({ message: 'User created' });
  } catch(e) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// PUT /api/auth/users/:id
router.put('/users/:id', async (req, res) => {
  const { name, email, role, isActive } = req.body;
  try {
    const pool = await getDbConnection();
    const roleResult = await pool.request().input('roleName', sql.NVarChar, role).query('SELECT Id FROM MANSOLE.Roles WHERE Name = @roleName');
    let roleId = roleResult.recordset.length > 0 ? roleResult.recordset[0].Id : 3;
    const status = isActive ? 'Activo' : 'Suspendido';
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('roleId', sql.Int, roleId)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE MANSOLE.Users SET Name=@name, Email=@email, Role_Id=@roleId, Status=@status
        WHERE Id=@id
      `);
    res.json({ message: 'User updated' });
  } catch(e) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// PUT /api/auth/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  const { isActive } = req.body;
  try {
    const pool = await getDbConnection();
    const status = isActive ? 'Activo' : 'Suspendido';
    await pool.request().input('id', sql.Int, req.params.id).input('status', sql.NVarChar, status)
      .query('UPDATE MANSOLE.Users SET Status=@status WHERE Id=@id');
    res.json({ message: 'Status updated' });
  } catch(e) {
    res.status(500).json({ error: 'Error updating status' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM MANSOLE.Users WHERE Id=@id');
    res.json({ message: 'User deleted' });
  } catch(e) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// GET /api/auth/roles
router.get('/roles', async (req, res) => {
  try {
    const pool = await getDbConnection();
    const result = await pool.request().query('SELECT Id, Name, Description FROM MANSOLE.Roles');
    res.json(result.recordset);
  } catch(e) {
    res.status(500).json({ error: 'Error fetching roles' });
  }
});

// POST /api/auth/roles
router.post('/roles', async (req, res) => {
  const { name, description } = req.body;
  try {
    const pool = await getDbConnection();
    await pool.request().input('name', sql.NVarChar, name).input('desc', sql.NVarChar, description)
      .query('INSERT INTO MANSOLE.Roles (Name, Description) VALUES (@name, @desc)');
    res.status(201).json({ message: 'Role created' });
  } catch(e) {
    res.status(500).json({ error: 'Error creating role' });
  }
});

// DELETE /api/auth/roles/:id
router.delete('/roles/:id', async (req, res) => {
  try {
    const pool = await getDbConnection();
    await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM MANSOLE.Roles WHERE Id=@id');
    res.json({ message: 'Role deleted' });
  } catch(e) {
    res.status(500).json({ error: 'Error deleting role' });
  }
});

module.exports = router;
