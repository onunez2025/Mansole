/**
 * Catálogo de permisos y mapa rol -> permisos.
 *
 * Convención de permisos: mansole.<modulo>.<accion>
 *
 * IMPORTANTE: la base tiene DOS fuentes de roles y hay que cubrir las dos.
 *
 *   MANSOLE.UsuariosPerfiles (6 perfiles REALES, 9 usuarios en producción)
 *     Administrador                              (1 usuario)
 *     Coordinador de Mantenimiento y Producción  (1)
 *     Analista de Planeamiento                   (2)
 *     Asistente Mantenimiento                    (1)
 *     Técnico Mecánico                           (2)
 *     Técnico Electricista                       (2)
 *
 *   MANSOLE.Roles (4 roles de demo, los que hoy lee authRoutes)
 *     Administrador, Supervisor, Técnico, Operador
 *
 * Los legados se conservan porque el login actual consulta MANSOLE.Users ->
 * MANSOLE.Roles. Cuando la autenticación pase a MANSOLE.Usuarios se pueden
 * eliminar. Ver ANALISIS_ESQUEMA_BD.md.
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
 * Ejecuta trabajo en planta: cierra OTs, cambia estado de activos y consume
 * repuestos. La especialidad (mecánica o eléctrica) es un dato de la tarea
 * (Tareas.TareaEspecialidad), no un nivel de autorización distinto, así que
 * ambos técnicos comparten permisos.
 */
const PERMISOS_TECNICO = [
  // create: un técnico que detecta una falla debe poder levantar un correctivo.
  p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'edit'),
  p('workorders', 'close'), p('workorders', 'export'),
  p('assets', 'view'), p('assets', 'changestatus'),
  p('schedule', 'view'),
  p('inventory', 'view'), p('inventory', 'cannibalize'),
  p('activities', 'view'),
  // El Dashboard de KPIs es la pantalla de entrada de todos los roles.
  p('reports', 'view')
];

const ROLE_PERMISSIONS = {
  /* ---------- Perfiles reales (MANSOLE.UsuariosPerfiles) ---------- */

  Administrador: ['*'],

  // Jefatura del área: gobierna la operación pero no el maestro de activos
  // ni la eliminación del histórico de OTs.
  'Coordinador de Mantenimiento y Producción': [
    p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'edit'),
    p('workorders', 'assign'), p('workorders', 'close'), p('workorders', 'export'),
    ...all('schedule'),
    p('assets', 'view'), p('assets', 'edit'), p('assets', 'changestatus'),
    p('inventory', 'view'), p('inventory', 'create'), p('inventory', 'edit'),
    p('inventory', 'cannibalize'),
    p('activities', 'view'), p('activities', 'create'), p('activities', 'edit'),
    p('users', 'view'),
    ...all('reports')
  ],

  // Planifica y mide: construye el cronograma preventivo y explota reportes.
  // No ejecuta ni cierra OTs.
  'Analista de Planeamiento': [
    p('workorders', 'view'), p('workorders', 'create'),
    p('workorders', 'assign'), p('workorders', 'export'),
    p('schedule', 'view'), p('schedule', 'create'), p('schedule', 'edit'),
    p('schedule', 'reprogram'),
    p('assets', 'view'),
    p('inventory', 'view'),
    p('activities', 'view'), p('activities', 'create'), p('activities', 'edit'),
    ...all('reports')
  ],

  // Soporte administrativo y almacén: mueve stock, no cierra trabajo técnico.
  'Asistente Mantenimiento': [
    p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'export'),
    p('schedule', 'view'),
    p('assets', 'view'),
    p('inventory', 'view'), p('inventory', 'create'), p('inventory', 'edit'),
    p('inventory', 'cannibalize'),
    p('activities', 'view'),
    p('reports', 'view')
  ],

  'Técnico Mecánico': PERMISOS_TECNICO,
  'Técnico Electricista': PERMISOS_TECNICO,

  /* ---------- Roles legados (MANSOLE.Roles, datos de demo) ----------
   * Los usa el login actual. Eliminar cuando la autenticación pase a
   * MANSOLE.Usuarios / UsuariosPerfiles.
   */

  Supervisor: [
    ...all('workorders'),
    ...all('schedule'),
    p('assets', 'view'), p('assets', 'edit'), p('assets', 'changestatus'),
    p('inventory', 'view'), p('inventory', 'create'), p('inventory', 'edit'),
    p('activities', 'view'), p('activities', 'create'), p('activities', 'edit'),
    p('users', 'view'),
    ...all('reports')
  ],

  'Técnico': PERMISOS_TECNICO,

  Operador: [
    p('workorders', 'view'), p('workorders', 'create'), p('workorders', 'export'),
    p('assets', 'view'),
    p('schedule', 'view'),
    p('inventory', 'view'),
    p('reports', 'view')
  ]
};

/**
 * Red de seguridad: un permiso mal escrito no concede nada y no falla de
 * forma visible, así que se valida al cargar el módulo.
 */
(function validarPermisos() {
  const validos = new Set(ALL_PERMISSIONS);

  for (const [rol, permisos] of Object.entries(ROLE_PERMISSIONS)) {
    const invalidos = permisos.filter((x) => x !== '*' && !validos.has(x));

    if (invalidos.length > 0) {
      throw new Error(
        `[permissions] El rol "${rol}" declara permisos inexistentes: ${invalidos.join(', ')}`
      );
    }
  }
})();

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
