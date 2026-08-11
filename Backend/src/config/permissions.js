/**
 * Catálogo de permisos y mapa rol -> permisos.
 *
 * Las claves de ROLE_PERMISSIONS DEBEN coincidir exactamente con
 * MANSOLE.Roles.Name tal como están en el schema.sql:
 *   'Administrador', 'Supervisor', 'Técnico', 'Operador'
 *
 * Convención de permisos: mansole.<modulo>.<accion>
 */

const PERMISSIONS = {
  workorders: ['view', 'create', 'edit', 'delete', 'assign', 'close', 'export'],
  assets:     ['view', 'create', 'edit', 'delete', 'changestatus'],
  schedule:   ['view', 'create', 'edit', 'reprogram', 'delete'],
  inventory:  ['view', 'create', 'edit', 'delete', 'cannibalize'],
  activities: ['view', 'create', 'edit', 'delete'],
  users:      ['view', 'create', 'edit', 'delete', 'audit'],
  reports:    ['view', 'export']
};

/** p('workorders', 'view') -> 'mansole.workorders.view' */
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
 * Mapa rol -> permisos.
 * Las claves deben coincidir EXACTAMENTE con MANSOLE.Roles.Name.
 *
 * Roles en producción (según schema.sql e INSERT inicial):
 *   'Administrador', 'Supervisor', 'Técnico', 'Operador'
 */
const ROLE_PERMISSIONS = {
  Administrador: ['*'],

  Supervisor: [
    ...all('workorders'),
    ...all('schedule'),
    p('assets', 'view'), p('assets', 'edit'), p('assets', 'changestatus'),
    p('inventory', 'view'), p('inventory', 'create'), p('inventory', 'edit'),
    p('activities', 'view'), p('activities', 'create'), p('activities', 'edit'),
    p('users', 'view'),
    ...all('reports')
  ],

  'Técnico': [
    p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'edit'), p('workorders', 'close'), p('workorders', 'export'),
    p('assets', 'view'), p('assets', 'changestatus'),
    p('schedule', 'view'),
    p('inventory', 'view'), p('inventory', 'create'), p('inventory', 'cannibalize'),
    p('activities', 'view'),
    // El Dashboard de KPIs es la pantalla de entrada de todos los roles.
    p('reports', 'view')
  ],

  Operador: [
    p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'export'),
    p('assets', 'view'),
    p('schedule', 'view'),
    p('inventory', 'view'),
    p('reports', 'view')
  ]
};

/**
 * Permisos de un rol. Rol desconocido o nulo => sin permisos (fail closed).
 * getPermissionsForRole es tolerante a variantes tipográficas del nombre de rol
 * para evitar que un error de capitalización deje a un usuario sin acceso.
 */
function getPermissionsForRole(roleName) {
  if (!roleName) return [];

  // Búsqueda exacta primero
  if (ROLE_PERMISSIONS[roleName]) return ROLE_PERMISSIONS[roleName];

  // Búsqueda tolerante: normaliza tildes comunes y compara en minúsculas
  const normalize = (s) => (s || '')
    .toLowerCase()
    .replace(/é/g, 'e').replace(/á/g, 'a').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');

  const normInput = normalize(roleName);

  for (const [key, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if (normalize(key) === normInput) return perms;
  }

  // No encontrado: sin permisos (fail closed)
  console.warn(`[permissions] Rol desconocido: "${roleName}". Sin permisos asignados.`);
  return [];
}

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRole
};
