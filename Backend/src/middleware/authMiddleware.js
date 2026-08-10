const { verifyToken } = require('../utils/jwt');

/**
 * Middleware: Verificar que el usuario esté autenticado
 * Extrae token del header Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware: Verificar permisos específicos
 * Uso: router.post('/users', checkPermission('mansole.users.create'), ...)
 */
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = userPermissions.includes(requiredPermission) ||
                         userPermissions.includes('*'); // * = admin (todos los permisos)

    if (!hasPermission) {
      console.warn(`Access Denied: User ${req.user.userId} tried to access ${requiredPermission}`);
      return res.status(403).json({ error: 'Permiso denegado', required: requiredPermission });
    }

    next();
  };
}

/**
 * Middleware: Verificar rol específico
 * Uso: router.delete('/roles/:id', checkRole('Administrador'), ...)
 */
function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.roleId !== requiredRole && requiredRole !== 'ANY') {
      return res.status(403).json({ error: 'Rol insuficiente' });
    }

    next();
  };
}

/**
 * Middleware: Logging de auditoría
 * Registra todas las acciones en la tabla Audit_Logs
 */
function auditLog(action, tableName) {
  return async (req, res, next) => {
    // Guardar información original de request
    res.on('finish', async () => {
      try {
        if (!req.user) return;

        const { sql, getDbConnection } = require('../config/db');
        const pool = await getDbConnection();

        const newValues = req.body ? JSON.stringify(req.body) : null;
        const recordId = req.params.id ? parseInt(req.params.id) : null;

        await pool.request()
          .input('userId', sql.Int, req.user.userId)
          .input('username', sql.NVarChar, req.user.username)
          .input('action', sql.NVarChar, action)
          .input('tableName', sql.NVarChar, tableName)
          .input('recordId', sql.Int, recordId)
          .input('recordType', sql.NVarChar, tableName)
          .input('newValues', sql.NVarChar, newValues)
          .input('ipAddress', sql.NVarChar, req.ip)
          .input('userAgent', sql.NVarChar, req.get('user-agent'))
          .input('status', sql.NVarChar, res.statusCode < 400 ? 'Success' : 'Failed')
          .query(`
            INSERT INTO MANSOLE.Audit_Logs (User_Id, Username, Action, Table_Name, Record_Id, Record_Type, New_Values, IP_Address, User_Agent, Status)
            VALUES (@userId, @username, @action, @tableName, @recordId, @recordType, @newValues, @ipAddress, @userAgent, @status)
          `);
      } catch (error) {
        console.error('Audit log error:', error);
        // No fallar la request por auditoría
      }
    });

    next();
  };
}

/**
 * Middleware: Rate limiting simple (en memoria)
 * Para producción usar redis-express-rate-limit
 */
const loginAttempts = new Map();

function rateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const attempts = loginAttempts.get(key) || [];

    // Limpiar intentos viejos
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Intenta más tarde.'
      });
    }

    loginAttempts.set(key, recentAttempts);
    next();
  };
}

module.exports = {
  authenticateToken,
  checkPermission,
  checkRole,
  auditLog,
  rateLimit
};
