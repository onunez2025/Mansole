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

function resetRateLimits() {
  failedAttempts.clear();
}

function rateLimit(maxAttempts = 15, windowMs = 3 * 60 * 1000) {
  return (req, res, next) => {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
    const identifier = (req.body?.email || req.body?.username || '').toLowerCase();
    const key = `${rawIp}_${identifier}`;
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

/* ------------------------------------------------------------------ *
 * Protección a nivel de módulo.
 *
 * Deriva el permiso del método HTTP para no repetir checkPermission en
 * cada handler: GET->view, POST->create, PUT/PATCH->edit, DELETE->delete.
 * Las rutas que no encajan en ese patrón se declaran como overrides.
 * ------------------------------------------------------------------ */

const METHOD_ACTIONS = {
  GET: 'view',
  POST: 'create',
  PUT: 'edit',
  PATCH: 'edit',
  DELETE: 'delete'
};

/**
 * Resuelve la acción de una request. `overrides` es una lista de
 * { method, pattern, action } donde pattern se prueba contra la ruta
 * relativa al punto de montaje (ej. '/12/reprogram').
 */
function resolveAction(req, overrides) {
  const match = overrides.find(
    (o) => o.method === req.method && o.pattern.test(req.path)
  );

  return match ? match.action : METHOD_ACTIONS[req.method];
}

/**
 * Middleware de módulo: exige sesión válida y el permiso correspondiente.
 * Uso: app.use('/api/assets', requireModule('assets'), assetRoutes)
 */
function requireModule(module, overrides = []) {
  return [
    authenticateToken,
    (req, res, next) => {
      const action = resolveAction(req, overrides);

      // Método no contemplado: denegar en vez de dejar pasar sin permiso.
      if (!action) {
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
      }

      return checkPermission(`mansole.${module}.${action}`)(req, res, next);
    }
  ];
}

module.exports = {
  authenticateToken,
  checkPermission,
  checkRole,
  auditLog,
  rateLimit,
  resetRateLimits,
  requireModule
};
