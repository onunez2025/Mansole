-- =====================================================
-- MANSOLE CMMS - RBAC Schema (Roles & Permissions)
-- Database: soledb-puntoventa
-- Schema: MANSOLE
-- =====================================================

-- ===== 1. DROP EXISTING TABLES (si existen) =====
IF OBJECT_ID('MANSOLE.Role_Permissions', 'U') IS NOT NULL DROP TABLE MANSOLE.Role_Permissions;
IF OBJECT_ID('MANSOLE.Permissions', 'U') IS NOT NULL DROP TABLE MANSOLE.Permissions;
IF OBJECT_ID('MANSOLE.Roles', 'U') IS NOT NULL DROP TABLE MANSOLE.Roles;
IF OBJECT_ID('MANSOLE.Audit_Logs', 'U') IS NOT NULL DROP TABLE MANSOLE.Audit_Logs;

-- Actualizar la tabla Users si es necesario
-- IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'MANSOLE' AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'role_id')
-- BEGIN
--   -- Ya existe role_id, no hacer nada
-- END
-- ELSE
-- BEGIN
--   -- Agregar columna role_id a Users si no existe
--   ALTER TABLE MANSOLE.Users ADD role_id INT NULL;
-- END

-- ===== 2. CREATE ROLES TABLE =====
CREATE TABLE MANSOLE.Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Activo', -- Activo, Inactivo
    Is_System TINYINT DEFAULT 0, -- 1 = Role predefinido del sistema (no se puede eliminar)
    Created_Date DATETIME2 DEFAULT GETDATE(),
    Updated_Date DATETIME2 DEFAULT GETDATE(),
    INDEX idx_status (Status),
    INDEX idx_name (Name)
);

-- ===== 3. CREATE PERMISSIONS TABLE =====
CREATE TABLE MANSOLE.Permissions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(100) NOT NULL UNIQUE, -- ej: "mansole.users.view"
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Module NVARCHAR(50) NOT NULL, -- WorkOrders, Assets, Inventory, Schedule, Activities, Users, Reports
    Permission_Type NVARCHAR(50), -- View, Create, Edit, Delete, Approve, Export, Execute, Close
    Status NVARCHAR(50) DEFAULT 'Activo',
    Created_Date DATETIME2 DEFAULT GETDATE(),
    INDEX idx_module (Module),
    INDEX idx_code (Code),
    INDEX idx_status (Status)
);

-- ===== 4. CREATE ROLE_PERMISSIONS JUNCTION TABLE =====
CREATE TABLE MANSOLE.Role_Permissions (
    Role_Id INT NOT NULL,
    Permission_Id INT NOT NULL,
    Assigned_Date DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (Role_Id, Permission_Id),
    FOREIGN KEY (Role_Id) REFERENCES MANSOLE.Roles(Id) ON DELETE CASCADE,
    FOREIGN KEY (Permission_Id) REFERENCES MANSOLE.Permissions(Id) ON DELETE CASCADE,
    INDEX idx_role (Role_Id),
    INDEX idx_permission (Permission_Id)
);

-- ===== 5. CREATE AUDIT_LOGS TABLE =====
CREATE TABLE MANSOLE.Audit_Logs (
    Id BIGINT PRIMARY KEY IDENTITY(1,1),
    User_Id INT,
    Username NVARCHAR(100),
    Action NVARCHAR(200), -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ACTIVATE, DEACTIVATE, etc
    Table_Name NVARCHAR(100),
    Record_Id INT,
    Record_Type NVARCHAR(100), -- User, Role, WorkOrder, Asset, etc
    Old_Values NVARCHAR(MAX), -- JSON format
    New_Values NVARCHAR(MAX), -- JSON format
    IP_Address NVARCHAR(50),
    User_Agent NVARCHAR(500),
    Status NVARCHAR(20), -- Success, Failed
    Error_Message NVARCHAR(MAX),
    Timestamp DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (User_Id) REFERENCES MANSOLE.Users(Id) ON DELETE SET NULL,
    INDEX idx_user (User_Id),
    INDEX idx_timestamp (Timestamp),
    INDEX idx_action (Action),
    INDEX idx_table (Table_Name)
);

-- ===== 6. INSERT PREDEFINED ROLES =====
INSERT INTO MANSOLE.Roles (Name, Description, Status, Is_System)
VALUES
    ('Administrador', 'Acceso completo a todas las funciones del sistema', 'Activo', 1),
    ('Supervisor de Mantenimiento', 'Supervisar OTs, técnicos y cronograma preventivo', 'Activo', 1),
    ('Técnico de Mantenimiento', 'Ejecutar órdenes de trabajo asignadas', 'Activo', 1),
    ('Almacenero', 'Gestionar repuestos e inventario', 'Activo', 1),
    ('Analista de Reportes', 'Ver y exportar reportes', 'Activo', 1);

-- ===== 7. INSERT PERMISSIONS =====

-- WORK ORDERS
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.workorders.view', 'Ver Órdenes de Trabajo', 'Ver listado de todas las OTs', 'WorkOrders', 'View', 'Activo'),
    ('mansole.workorders.create', 'Crear OT', 'Crear nueva orden de trabajo', 'WorkOrders', 'Create', 'Activo'),
    ('mansole.workorders.edit', 'Editar OT', 'Modificar datos de OT existente', 'WorkOrders', 'Edit', 'Activo'),
    ('mansole.workorders.delete', 'Eliminar OT', 'Eliminar orden de trabajo', 'WorkOrders', 'Delete', 'Activo'),
    ('mansole.workorders.assign', 'Asignar Técnicos', 'Asignar técnicos a una OT', 'WorkOrders', 'Edit', 'Activo'),
    ('mansole.workorders.close', 'Cerrar OT', 'Finalizar orden de trabajo', 'WorkOrders', 'Approve', 'Activo'),
    ('mansole.workorders.export', 'Exportar PDF', 'Exportar acta de OT a PDF', 'WorkOrders', 'Export', 'Activo'),
    ('mansole.workorders.ai_diagnosis', 'Ver Diagnóstico IA', 'Ver análisis de diagnóstico por IA', 'WorkOrders', 'View', 'Activo');

-- ASSETS
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.assets.view', 'Ver Activos', 'Ver catálogo de activos', 'Assets', 'View', 'Activo'),
    ('mansole.assets.create', 'Crear Activo', 'Registrar nuevo activo', 'Assets', 'Create', 'Activo'),
    ('mansole.assets.edit', 'Editar Activo', 'Modificar datos del activo', 'Assets', 'Edit', 'Activo'),
    ('mansole.assets.delete', 'Eliminar Activo', 'Eliminar registro de activo', 'Assets', 'Delete', 'Activo'),
    ('mansole.assets.status_change', 'Cambiar Estado', 'Cambiar estado del activo', 'Assets', 'Edit', 'Activo'),
    ('mansole.assets.history', 'Ver Historial', 'Ver historial de mantenimiento del activo', 'Assets', 'View', 'Activo');

-- SCHEDULE (Cronograma Preventivo)
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.schedule.view', 'Ver Cronograma', 'Ver cronograma preventivo', 'Schedule', 'View', 'Activo'),
    ('mansole.schedule.create', 'Crear Cronograma', 'Crear nueva actividad preventiva', 'Schedule', 'Create', 'Activo'),
    ('mansole.schedule.edit', 'Editar Cronograma', 'Modificar cronograma', 'Schedule', 'Edit', 'Activo'),
    ('mansole.schedule.reprogram', 'Reprogramar', 'Cambiar fecha de próxima ejecución', 'Schedule', 'Edit', 'Activo'),
    ('mansole.schedule.execute', 'Ejecutar', 'Marcar como ejecutado', 'Schedule', 'Approve', 'Activo');

-- INVENTORY (Repuestos y Almacén)
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.inventory.view', 'Ver Inventario', 'Ver catálogo de repuestos', 'Inventory', 'View', 'Activo'),
    ('mansole.inventory.create', 'Crear Repuesto', 'Agregar nuevo repuesto al catálogo', 'Inventory', 'Create', 'Activo'),
    ('mansole.inventory.edit', 'Editar Repuesto', 'Modificar información del repuesto', 'Inventory', 'Edit', 'Activo'),
    ('mansole.inventory.delete', 'Eliminar Repuesto', 'Eliminar del catálogo', 'Inventory', 'Delete', 'Activo'),
    ('mansole.inventory.stock_adjust', 'Ajustar Stock', 'Ajustar cantidades de stock', 'Inventory', 'Edit', 'Activo'),
    ('mansole.inventory.stock_audit', 'Auditar Stock', 'Realizar auditoría de inventario', 'Inventory', 'View', 'Activo'),
    ('mansole.inventory.canibalizar', 'Marcar Canibalizado', 'Marcar como canibalizado o reusado', 'Inventory', 'Edit', 'Activo');

-- ACTIVITIES (Catálogo de Actividades)
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.activities.view', 'Ver Actividades', 'Ver catálogo de actividades de mantenimiento', 'Activities', 'View', 'Activo'),
    ('mansole.activities.create', 'Crear Actividad', 'Crear nueva actividad', 'Activities', 'Create', 'Activo'),
    ('mansole.activities.edit', 'Editar Actividad', 'Modificar actividad', 'Activities', 'Edit', 'Activo'),
    ('mansole.activities.delete', 'Eliminar Actividad', 'Eliminar actividad', 'Activities', 'Delete', 'Activo');

-- USERS (Gestión de Usuarios y Seguridad)
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.users.view', 'Ver Usuarios', 'Listar usuarios del sistema', 'Users', 'View', 'Activo'),
    ('mansole.users.create', 'Crear Usuario', 'Crear nuevo usuario', 'Users', 'Create', 'Activo'),
    ('mansole.users.edit', 'Editar Usuario', 'Modificar datos de usuario', 'Users', 'Edit', 'Activo'),
    ('mansole.users.delete', 'Eliminar Usuario', 'Eliminar usuario del sistema', 'Users', 'Delete', 'Activo'),
    ('mansole.users.activate', 'Activar/Desactivar', 'Activar o desactivar usuario', 'Users', 'Edit', 'Activo'),
    ('mansole.users.reset_password', 'Resetear Contraseña', 'Forzar cambio de contraseña', 'Users', 'Edit', 'Activo'),
    ('mansole.roles.manage', 'Gestionar Roles', 'Crear, editar, eliminar roles y permisos', 'Users', 'Edit', 'Activo'),
    ('mansole.audit.view', 'Ver Auditoría', 'Ver bitácora de cambios del sistema', 'Users', 'View', 'Activo');

-- REPORTS (Reportes y Analítica)
INSERT INTO MANSOLE.Permissions (Code, Name, Description, Module, Permission_Type, Status)
VALUES
    ('mansole.reports.kpi', 'Ver KPIs', 'Ver indicadores de desempeño', 'Reports', 'View', 'Activo'),
    ('mansole.reports.export', 'Exportar Reportes', 'Exportar datos a Excel/PDF', 'Reports', 'Export', 'Activo'),
    ('mansole.reports.custom', 'Reportes Personalizados', 'Crear reportes propios', 'Reports', 'Create', 'Activo');

-- ===== 8. ASSIGN PERMISSIONS TO PREDEFINED ROLES =====

-- ADMINISTRADOR - ALL PERMISSIONS
INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id)
SELECT r.Id, p.Id FROM MANSOLE.Roles r, MANSOLE.Permissions p
WHERE r.Name = 'Administrador';

-- SUPERVISOR DE MANTENIMIENTO - Most permissions except Users management
INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id)
SELECT r.Id, p.Id FROM MANSOLE.Roles r, MANSOLE.Permissions p
WHERE r.Name = 'Supervisor de Mantenimiento'
AND p.Code IN (
    'mansole.workorders.view', 'mansole.workorders.create', 'mansole.workorders.edit',
    'mansole.workorders.assign', 'mansole.workorders.close', 'mansole.workorders.export',
    'mansole.assets.view', 'mansole.assets.edit', 'mansole.assets.status_change', 'mansole.assets.history',
    'mansole.schedule.view', 'mansole.schedule.create', 'mansole.schedule.edit', 'mansole.schedule.reprogram', 'mansole.schedule.execute',
    'mansole.inventory.view', 'mansole.inventory.stock_audit',
    'mansole.activities.view',
    'mansole.reports.kpi', 'mansole.reports.export'
);

-- TÉCNICO DE MANTENIMIENTO - Limited permissions
INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id)
SELECT r.Id, p.Id FROM MANSOLE.Roles r, MANSOLE.Permissions p
WHERE r.Name = 'Técnico de Mantenimiento'
AND p.Code IN (
    'mansole.workorders.view', 'mansole.workorders.edit', 'mansole.workorders.export',
    'mansole.assets.view', 'mansole.assets.history',
    'mansole.schedule.view', 'mansole.schedule.execute',
    'mansole.inventory.view',
    'mansole.activities.view',
    'mansole.reports.kpi'
);

-- ALMACENERO - Inventory focused
INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id)
SELECT r.Id, p.Id FROM MANSOLE.Roles r, MANSOLE.Permissions p
WHERE r.Name = 'Almacenero'
AND p.Code IN (
    'mansole.workorders.view',
    'mansole.inventory.view', 'mansole.inventory.create', 'mansole.inventory.edit', 'mansole.inventory.stock_adjust',
    'mansole.inventory.stock_audit', 'mansole.inventory.canibalizar',
    'mansole.activities.view',
    'mansole.reports.kpi', 'mansole.reports.export'
);

-- ANALISTA DE REPORTES - Reports and read-only access
INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id)
SELECT r.Id, p.Id FROM MANSOLE.Roles r, MANSOLE.Permissions p
WHERE r.Name = 'Analista de Reportes'
AND p.Code IN (
    'mansole.workorders.view', 'mansole.workorders.export',
    'mansole.assets.view', 'mansole.assets.history',
    'mansole.schedule.view',
    'mansole.inventory.view',
    'mansole.activities.view',
    'mansole.reports.kpi', 'mansole.reports.export', 'mansole.reports.custom'
);

-- ===== 9. VERIFY INSTALLATION =====
PRINT '✅ RBAC Schema created successfully!'
PRINT ''
PRINT 'Roles created:'
SELECT '  - ' + Name AS Role FROM MANSOLE.Roles;
PRINT ''
PRINT 'Permissions by Module:'
SELECT '  [' + Module + '] ' + Name AS Permission FROM MANSOLE.Permissions ORDER BY Module, Name;
PRINT ''
PRINT 'Role Permissions Summary:'
SELECT r.Name AS Role, COUNT(p.Id) AS Permission_Count
FROM MANSOLE.Roles r
LEFT JOIN MANSOLE.Role_Permissions rp ON r.Id = rp.Role_Id
LEFT JOIN MANSOLE.Permissions p ON rp.Permission_Id = p.Id
GROUP BY r.Id, r.Name
ORDER BY Permission_Count DESC;
