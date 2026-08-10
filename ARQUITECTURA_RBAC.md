# 🔐 Arquitectura RBAC - Sistema de Usuarios, Roles y Permisos (Mansole CMMS)

Análisis comparativo con SIATC-Console y plan de implementación.

---

## 📊 Comparativa: SIATC-Console vs Mansole

### SIATC-Console (Actual)
```
APLICACIONES: CONSOLE, FLOW, EBM, FSM, VAL, TCTRL, LIQ, CXG, LOOPCHAT, SUPPORT, TEC, DEV

Estructura USUARIOS:
  - id, username, email, full_name, password_hash
  - role_id (FK → ROLES)
  - management_id (FK → MANAGEMENTS)
  - apps (CSV: "CONSOLE,FLOW,EBM")
  - is_active
  - created_at, updated_at

Estructura ROLES:
  - id, name, apps (CSV: "CONSOLE,FLOW")
  - permissions[] (array de permisos por app)
  
Estructura PERMISOS:
  - Predefinidos por App (ej: console.users, flow.tickets.view)
  - Organizados en GRUPOS por funcionalidad
  - Sistema de fallback a demo data

Modelo de Control:
  - Usuario → Role → [Apps, Permissions]
  - Permisos gestionados por aplicación
  - Hook: hasPermission('console.users') para validar en UI
```

### Mansole CMMS (Propuesto)
```
APLICACIONES: MANSOLE-CMMS (single app)

Estructura USUARIOS:
  - Id, Name, Email, Username
  - Password_Hash, Status (Activo/Inactivo)
  - RoleId (FK → Roles)
  - CreatedDate, UpdatedDate
  
Estructura ROLES:
  - Id, Name, Description
  - Permissions[] (array de permisos)
  - Status (Activo/Inactivo)

Estructura PERMISOS:
  - Id, Code, Name, Group (Módulo)
  - PermissionType (View, Create, Edit, Delete, Approve)
  - Module (WorkOrders, Assets, Inventory, Schedule, Activities, Users, Reports)
```

---

## 🎯 Módulos Mansole y Permisos Recomendados

### Módulo: ÓRDENES DE TRABAJO (Work Orders)
```
Permisos:
  ✓ mansole.workorders.view          - Ver listado de OTs
  ✓ mansole.workorders.create        - Crear nueva OT
  ✓ mansole.workorders.edit          - Editar OT existente
  ✓ mansole.workorders.delete        - Eliminar OT
  ✓ mansole.workorders.assign        - Asignar técnicos
  ✓ mansole.workorders.close         - Cerrar/Finalizar OT
  ✓ mansole.workorders.export_pdf    - Exportar acta de OT
  ✓ mansole.workorders.ai_diagnosis  - Ver diagnóstico IA
```

### Módulo: GESTIÓN DE ACTIVOS
```
Permisos:
  ✓ mansole.assets.view              - Ver catálogo de activos
  ✓ mansole.assets.create            - Registrar nuevo activo
  ✓ mansole.assets.edit              - Editar datos del activo
  ✓ mansole.assets.delete            - Eliminar activo
  ✓ mansole.assets.status_change     - Cambiar estado (Operativo/Mantenimiento/Riesgo)
  ✓ mansole.assets.view_history      - Ver historial de mantenimiento
```

### Módulo: CRONOGRAMA PREVENTIVO
```
Permisos:
  ✓ mansole.schedule.view            - Ver cronograma
  ✓ mansole.schedule.create          - Crear actividad preventiva
  ✓ mansole.schedule.edit            - Editar cronograma
  ✓ mansole.schedule.reprogram       - Reprogramar fechas
  ✓ mansole.schedule.execute         - Marcar como ejecutado
```

### Módulo: REPUESTOS Y ALMACÉN
```
Permisos:
  ✓ mansole.inventory.view           - Ver catálogo de repuestos
  ✓ mansole.inventory.create         - Agregar nuevo repuesto
  ✓ mansole.inventory.edit           - Editar información
  ✓ mansole.inventory.delete         - Eliminar del catálogo
  ✓ mansole.inventory.stock_adjust   - Ajustar stock
  ✓ mansole.inventory.stock_audit    - Realizar auditoría de stock
  ✓ mansole.inventory.canibalizar    - Marcar como canibalizado
```

### Módulo: CATÁLOGO DE ACTIVIDADES
```
Permisos:
  ✓ mansole.activities.view          - Ver catálogo
  ✓ mansole.activities.create        - Crear nueva actividad
  ✓ mansole.activities.edit          - Editar actividad
  ✓ mansole.activities.delete        - Eliminar actividad
```

### Módulo: GESTIÓN DE USUARIOS & SEGURIDAD
```
Permisos:
  ✓ mansole.users.view               - Listar usuarios
  ✓ mansole.users.create             - Crear usuario
  ✓ mansole.users.edit               - Editar usuario
  ✓ mansole.users.delete             - Eliminar usuario
  ✓ mansole.users.activate           - Activar/Desactivar
  ✓ mansole.users.reset_password     - Resetear contraseña
  ✓ mansole.roles.manage             - Gestionar roles
  ✓ mansole.security.audit_logs      - Ver bitácora de auditoría
```

### Módulo: REPORTES Y ANALÍTICA
```
Permisos:
  ✓ mansole.reports.kpi              - Ver KPIs
  ✓ mansole.reports.export           - Exportar reportes
  ✓ mansole.reports.custom           - Crear reportes personalizados
```

---

## 🗄️ Esquema SQL Actualizado (MANSOLE)

### Tabla: Users (Actualizada)
```sql
CREATE TABLE MANSOLE.Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    Username NVARCHAR(100) UNIQUE NOT NULL,
    Password_Hash NVARCHAR(MAX) NOT NULL,
    Role_Id INT NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Activo', -- Activo, Inactivo, Suspendido
    Created_Date DATETIME DEFAULT GETDATE(),
    Updated_Date DATETIME DEFAULT GETDATE(),
    Last_Login DATETIME NULL,
    FOREIGN KEY (Role_Id) REFERENCES MANSOLE.Roles(Id)
);
```

### Tabla: Roles (Nueva)
```sql
CREATE TABLE MANSOLE.Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Activo',
    Created_Date DATETIME DEFAULT GETDATE(),
    Updated_Date DATETIME DEFAULT GETDATE(),
    Is_System TINYINT DEFAULT 0 -- 1 = Role predefinido del sistema
);
```

### Tabla: Permissions (Nueva)
```sql
CREATE TABLE MANSOLE.Permissions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(100) NOT NULL UNIQUE, -- ej: "mansole.users.view"
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Module NVARCHAR(50) NOT NULL, -- WorkOrders, Assets, Inventory, Users, Reports, etc
    Permission_Type NVARCHAR(50), -- View, Create, Edit, Delete, Approve, Export
    Status NVARCHAR(50) DEFAULT 'Activo',
    Created_Date DATETIME DEFAULT GETDATE()
);
```

### Tabla: Role_Permissions (Nueva - Relación N:N)
```sql
CREATE TABLE MANSOLE.Role_Permissions (
    Role_Id INT NOT NULL,
    Permission_Id INT NOT NULL,
    PRIMARY KEY (Role_Id, Permission_Id),
    FOREIGN KEY (Role_Id) REFERENCES MANSOLE.Roles(Id) ON DELETE CASCADE,
    FOREIGN KEY (Permission_Id) REFERENCES MANSOLE.Permissions(Id) ON DELETE CASCADE
);
```

### Tabla: Audit_Logs (Nueva)
```sql
CREATE TABLE MANSOLE.Audit_Logs (
    Id INT PRIMARY KEY IDENTITY(1,1),
    User_Id INT NOT NULL,
    Action NVARCHAR(200), -- CREATE, UPDATE, DELETE, LOGIN, etc
    Table_Name NVARCHAR(100),
    Record_Id INT,
    Old_Values NVARCHAR(MAX), -- JSON
    New_Values NVARCHAR(MAX), -- JSON
    IP_Address NVARCHAR(50),
    Timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (User_Id) REFERENCES MANSOLE.Users(Id)
);
```

---

## 👥 Roles Predefinidos para Mansole

### 1. Administrador del Sistema
```
Permisos: TODOS
Descripción: Acceso completo a todas las funciones
Usuarios: 1-2 personas
```

### 2. Supervisor de Mantenimiento
```
Permisos:
  ✓ Crear, editar, cerrar OTs
  ✓ Ver y editar cronograma
  ✓ Asignar técnicos
  ✓ Ver reportes KPI
  ✗ Gestionar usuarios
  ✗ Eliminar OTs
```

### 3. Técnico de Mantenimiento
```
Permisos:
  ✓ Ver OTs asignadas
  ✓ Actualizar estado de OT
  ✓ Registrar horas y materiales
  ✓ Ver cronograma
  ✗ Crear OTs
  ✗ Eliminar datos
  ✗ Ver datos de otros técnicos
```

### 4. Almacenero
```
Permisos:
  ✓ Ver catálogo de repuestos
  ✓ Ajustar stock
  ✓ Realizar auditorías
  ✓ Registrar movimientos
  ✗ Crear OTs
  ✗ Gestionar usuarios
```

### 5. Analista de Reportes
```
Permisos:
  ✓ Ver reportes
  ✓ Exportar datos
  ✓ Crear reportes personalizados
  ✓ Ver KPIs
  ✗ Editar datos
  ✗ Crear OTs
```

---

## 🔧 Cambios Frontend Necesarios

### Hook: useAuth (React)
```tsx
interface AuthContext {
  user: User;
  hasPermission(code: string): boolean;
  hasRole(roleName: string): boolean;
  hasModule(moduleName: string): boolean;
}

// Uso:
const { hasPermission } = useAuth();

if (!hasPermission('mansole.workorders.edit')) {
  return <AccessDenied />;
}
```

### Componente: ProtectedRoute
```tsx
<ProtectedRoute 
  permission="mansole.users.manage"
  fallback={<AccessDenied />}
>
  <UsersModule />
</ProtectedRoute>
```

### Tabla de Permisos por Botón
```tsx
<Button 
  disabled={!hasPermission('mansole.workorders.create')}
  title={hasPermission('mansole.workorders.create') ? '' : 'Sin permisos'}
>
  Nueva OT
</Button>
```

---

## 🔌 Endpoints Backend Necesarios

```javascript
// Autenticación
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

// Usuarios (protegido: mansole.users.manage)
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
PUT /api/users/:id/activate
PUT /api/users/:id/reset-password

// Roles (protegido: mansole.roles.manage)
GET /api/roles
POST /api/roles
PUT /api/roles/:id
DELETE /api/roles/:id
GET /api/roles/:id/permissions

// Permisos (solo lectura)
GET /api/permissions
GET /api/permissions/by-module/:module

// Bitácora
GET /api/audit-logs
POST /api/audit-logs (automático en cada acción)
```

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos (Semana 1)
- [ ] Crear tablas: Roles, Permissions, Role_Permissions, Audit_Logs
- [ ] Migrar datos de Users a nueva estructura
- [ ] Insertar permisos predefinidos
- [ ] Insertar roles predefinidos

### Fase 2: Backend (Semana 2)
- [ ] Crear middleware de autenticación JWT
- [ ] Implementar endpoints de usuarios y roles
- [ ] Agregar validación de permisos en cada endpoint
- [ ] Implementar logging de auditoría

### Fase 3: Frontend (Semana 2-3)
- [ ] Crear hook useAuth con verificación de permisos
- [ ] Crear componente ProtectedRoute
- [ ] Agregar verificación de permisos en UI (botones, modales)
- [ ] Implementar página de AccessDenied

### Fase 4: Testing (Semana 3)
- [ ] Testing de autenticación
- [ ] Testing de permisos (casos positivos y negativos)
- [ ] Auditoría de seguridad
- [ ] Testing con usuarios reales

---

## 📋 Checklist de Seguridad

- [ ] Todas las contraseñas hasheadas (bcrypt mín 10 rounds)
- [ ] JWT con expiración (15 min acceso, 7 días refresh)
- [ ] CORS configurado correctamente
- [ ] Rate limiting en endpoints de login
- [ ] Validación de permisos en backend (no confiar en frontend)
- [ ] Auditoría de todas las acciones sensibles
- [ ] Protección contra CSRF
- [ ] Headers de seguridad HTTP (CSP, X-Frame-Options, etc)
- [ ] Validación de entrada en todos los campos
- [ ] Logs centralizados de eventos de seguridad

---

## 🎓 Ejemplo: Flujo Completo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. POST /api/auth/login { username, password }
   ↓
3. Backend verifica contraseña + obtiene roles y permisos
   ↓
4. Genera JWT con: { userId, roleId, permissions: [...] }
   ↓
5. Responde con JWT + refresh token
   ↓
6. Frontend almacena JWT en localStorage/sessionStorage
   ↓
7. Cada request incluye JWT en header
   ↓
8. Middleware verifica JWT y extrae permisos
   ↓
9. Endpoint valida permiso específico requerido
   ↓
10. Si OK: ejecuta acción y registra en audit log
    Si NO: retorna 403 Forbidden
```

---

## ✅ Estado Actual vs Futuro

| Aspecto | Actual | Después de Implementar |
|---------|--------|----------------------|
| Auth | ❌ No hay | ✅ JWT + Refresh tokens |
| Roles | ❌ Hardcodeado | ✅ BD dinámica |
| Permisos | ❌ No existe | ✅ Granular por módulo |
| Auditoría | ❌ No existe | ✅ Bitácora completa |
| Seguridad | ⚠️ Básica | ✅ Enterprise-grade |

---

**Siguiente paso:** Implementar Fase 1 - Crear tablas SQL
