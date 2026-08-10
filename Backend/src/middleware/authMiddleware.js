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

    // Un refresh token no sirve para autenticar peticiones normales.
    if (decoded.type === 'refresh') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware: Verificar permisos específicos
 * Uso: router.post('/users', authenticateToken, checkPermission('mansole.users.create'), ...)
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
      console.warn(`Access Denied: User ${req.user.userId} intentó acceder a ${requiredPermission}`);
      return res.status(403).json({ error: 'Permiso denegado', required: requiredPermission });
    }

    next();
  };
}

/**
 * Middleware: Verificar rol específico por nombre
 * Uso: router.delete('/roles/:id', authenticateToken, checkRole('Administrador'), ...)
 */
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // El token guarda el nombre del rol en `role` (roleId es el entero).
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Rol insuficiente', required: allowedRoles });
    }

    next();
  };
}

/**
 * Middleware: Logging de auditoría en MANSOLE.AuditLogs
 * Columnas reales: Id, UserId, Action, Entity, Timestamp, Details
 */
function auditLog(action, entity) {
  return (req, res, next) => {
    res.on('finish', async () => {
      try {
        // Sin usuario autenticado no hay a quién atribuir la acción.
        if (!req.user) return;

        const { sql, getDbConnection } = require('../config/db');
        const pool = await getDbConnection();

        const details = JSON.stringify({
          status: res.statusCode,
          result: res.statusCode < 400 ? 'Success' : 'Failed',
          recordId: req.params.id ? String(req.params.id) : null,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });

        await pool.request()
          .input('userId', sql.Int, req.user.userId)
          .input('action', sql.NVarChar, action)
          .input('entity', sql.NVarChar, entity)
          .input('details', sql.NVarChar, details)
          .query(`
            INSERT INTO MANSOLE.AuditLogs (UserId, Action, Entity, Timestamp, Details)
            VALUES (@userId, @action, @entity, GETDATE(), @details)
          `);
      } catch (error) {
        // La auditoría nunca debe tumbar la request.
        console.error('Audit log error:', error.message);
      }
    });

    next();
  };
}

/**
 * Middleware: Rate limiting en memoria contra fuerza bruta.
 * Solo cuenta intentos FALLIDOS (401/403); un login correcto no consume cuota.
 * Para producción multi-instancia hace falta un store compartido (Redis).
 */
const failedAttempts = new Map();

function rateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    const recent = (failedAttempts.get(key) || []).filter((time) => now - time < windowMs);

    if (recent.length >= maxAttempts) {
      failedAttempts.set(key, recent);
      const retryAfter = Math.ceil((windowMs - (now - recent[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Demasiados intentos fallidos. Intenta más tarde.',
        retryAfterSeconds: retryAfter
      });
    }

    // Registrar el intento solo si termina en fallo de credenciales.
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        const current = (failedAttempts.get(key) || []).filter((time) => now - time < windowMs);
        current.push(Date.now());
        failedAttempts.set(key, current);
      } else if (res.statusCode < 400) {
        failedAttempts.delete(key); // login correcto limpia el historial
      }
    });

    failedAttempts.set(key, recent);
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
