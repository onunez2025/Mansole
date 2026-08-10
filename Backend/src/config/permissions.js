/**
 * Catálogo de permisos y mapa rol -> permisos.
 *
 * Los permisos se derivan del rol en código porque las tablas Permissions y
 * Role_Permissions no existen en la base. Toda la lectura de permisos pasa por
 * getPermissionsForRole(), así que migrar a tablas más adelante solo implica
 * cambiar esta función.
 *
 * Convención: mansole.<modulo>.<accion>
 */

const PERMISSIONS = {
  workorders: ['view', 'create', 'edit', 'delete', 'assign', 'close', 'export'],
  assets: ['view', 'create', 'edit', 'delete', 'changestatus'],
  schedule: ['view', 'create', 'edit', 'reprogram', 'delete'],
  inventory: ['view', 'create', 'edit', 'delete', 'cannibalize'],
  activities: ['view', 'create', 'edit', 'delete'],
  users: ['view', 'create', 'edit', 'delete', 'audit'],
  reports: ['view', 'export']
};

/** Construye el código completo: p('workorders', 'view') -> 'mansole.workorders.view' */
function p(module, action) {
  return `mansole.${module}.${action}`;
}

/** Todos los permisos de un módulo. */
function all(module) {
  return PERMISSIONS[module].map((action) => p(module, action));
}

/** Lista plana de todos los permisos existentes. */
const ALL_PERMISSIONS = Object.keys(PERMISSIONS).flatMap(all);

/**
 * Mapa rol -> permisos. Las claves coinciden con MANSOLE.Roles.Name.
 * El comodín '*' equivale a todos los permisos (ver checkPermission).
 */
const ROLE_PERMISSIONS = {
  Administrador: ['*'],

  Supervisor: [
    ...all('workorders'),
    ...all('schedule'),
    p('assets', 'view'), p('assets', 'edit'), p('assets', 'changestatus'),
    p('inventory', 'view'), p('inventory', 'edit'),
    p('activities', 'view'), p('activities', 'create'), p('activities', 'edit'),
    p('users', 'view'),
    ...all('reports')
  ],

  'Técnico': [
    p('workorders', 'view'), p('workorders', 'edit'), p('workorders', 'close'),
    p('assets', 'view'), p('assets', 'changestatus'),
    p('schedule', 'view'),
    p('inventory', 'view'),
    p('activities', 'view')
  ],

  Operador: [
    p('workorders', 'view'), p('workorders', 'create'),
    p('assets', 'view'),
    p('schedule', 'view'),
    p('inventory', 'view'), p('inventory', 'edit'), p('inventory', 'cannibalize'),
    p('activities', 'view')
  ]
};

/**
 * Permisos de un rol. Rol desconocido o nulo => sin permisos (fail closed).
 */
function getPermissionsForRole(roleName) {
  if (!roleName) return [];
  return ROLE_PERMISSIONS[roleName] || [];
}

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole
};
