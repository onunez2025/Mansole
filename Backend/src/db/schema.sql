-- ====================================================================
-- SCRIPT DDL DE BASE DE DATOS AZURE SQL SERVER - ESQUEMA MANSOLE
-- ====================================================================

-- 0. Crear el esquema MANSOLE si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'MANSOLE')
BEGIN
    EXEC('CREATE SCHEMA MANSOLE');
END;
GO

-- 1. Eliminar tablas existentes en el esquema MANSOLE en orden inverso a sus dependencias
IF OBJECT_ID('MANSOLE.AuditLogs', 'U') IS NOT NULL DROP TABLE MANSOLE.AuditLogs;
IF OBJECT_ID('MANSOLE.Attachments', 'U') IS NOT NULL DROP TABLE MANSOLE.Attachments;
IF OBJECT_ID('MANSOLE.WorkOrderSpareParts', 'U') IS NOT NULL DROP TABLE MANSOLE.WorkOrderSpareParts;
IF OBJECT_ID('MANSOLE.WorkOrderTasks', 'U') IS NOT NULL DROP TABLE MANSOLE.WorkOrderTasks;
IF OBJECT_ID('MANSOLE.WorkOrderTechnicians', 'U') IS NOT NULL DROP TABLE MANSOLE.WorkOrderTechnicians;
IF OBJECT_ID('MANSOLE.WorkOrders', 'U') IS NOT NULL DROP TABLE MANSOLE.WorkOrders;
IF OBJECT_ID('MANSOLE.AssetActivities', 'U') IS NOT NULL DROP TABLE MANSOLE.AssetActivities;
IF OBJECT_ID('MANSOLE.ActivityAreas', 'U') IS NOT NULL DROP TABLE MANSOLE.ActivityAreas;
IF OBJECT_ID('MANSOLE.ActivityCategories', 'U') IS NOT NULL DROP TABLE MANSOLE.ActivityCategories;
IF OBJECT_ID('MANSOLE.Activities', 'U') IS NOT NULL DROP TABLE MANSOLE.Activities;
IF OBJECT_ID('MANSOLE.InventoryTransactions', 'U') IS NOT NULL DROP TABLE MANSOLE.InventoryTransactions;
IF OBJECT_ID('MANSOLE.AssetSpareParts', 'U') IS NOT NULL DROP TABLE MANSOLE.AssetSpareParts;
IF OBJECT_ID('MANSOLE.SpareParts', 'U') IS NOT NULL DROP TABLE MANSOLE.SpareParts;
IF OBJECT_ID('MANSOLE.Assets', 'U') IS NOT NULL DROP TABLE MANSOLE.Assets;
IF OBJECT_ID('MANSOLE.AssetCategories', 'U') IS NOT NULL DROP TABLE MANSOLE.AssetCategories;
IF OBJECT_ID('MANSOLE.Users', 'U') IS NOT NULL DROP TABLE MANSOLE.Users;
IF OBJECT_ID('MANSOLE.Roles', 'U') IS NOT NULL DROP TABLE MANSOLE.Roles;
IF OBJECT_ID('MANSOLE.Areas', 'U') IS NOT NULL DROP TABLE MANSOLE.Areas;
IF OBJECT_ID('MANSOLE.Companies', 'U') IS NOT NULL DROP TABLE MANSOLE.Companies;
GO

-- ====================================================================
-- CREACIÓN DE TABLAS BAJO ESQUEMA MANSOLE
-- ====================================================================

-- 1. Empresas
CREATE TABLE MANSOLE.Companies (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    TaxId NVARCHAR(50) NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2. Áreas (Centros de Costo - CECO)
CREATE TABLE MANSOLE.Areas (
    Id INT PRIMARY KEY IDENTITY(1,1),
    CompanyId INT NULL REFERENCES MANSOLE.Companies(Id),
    Name NVARCHAR(100) NOT NULL,
    CostCenterCode NVARCHAR(50) NOT NULL,
    Description NVARCHAR(255) NULL
);
GO

-- 3. Roles del Sistema
CREATE TABLE MANSOLE.Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- 4. Usuarios
CREATE TABLE MANSOLE.Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    RoleId INT NOT NULL REFERENCES MANSOLE.Roles(Id),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 5. Categorías de Activos (Máquinas)
CREATE TABLE MANSOLE.AssetCategories (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);
GO

-- 6. Activos (Máquinas y Componentes)
CREATE TABLE MANSOLE.Assets (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(150) NOT NULL,
    CategoryId INT NULL REFERENCES MANSOLE.AssetCategories(Id),
    Brand NVARCHAR(50) NULL,
    Model NVARCHAR(50) NULL,
    SerialNumber NVARCHAR(100) NULL,
    AreaId INT NULL REFERENCES MANSOLE.Areas(Id),
    AcquisitionDate DATE NULL,
    Status NVARCHAR(50) DEFAULT 'Operativo', -- Operativo, En Mantenimiento, Fuera de Servicio, Dado de Baja
    ParentAssetId INT NULL REFERENCES MANSOLE.Assets(Id),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 7. Repuestos y Almacén (Con soporte para Condición: Nuevo / Reusado por Canibalización)
CREATE TABLE MANSOLE.SpareParts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(150) NOT NULL,
    Description NVARCHAR(300) NULL,
    UnitOfMeasure NVARCHAR(20) DEFAULT 'Unidad',
    CurrentStock DECIMAL(10,2) DEFAULT 0,
    MinStock DECIMAL(10,2) DEFAULT 0,
    Location NVARCHAR(100) NULL,
    UnitCost DECIMAL(12,2) DEFAULT 0,
    Condition NVARCHAR(50) DEFAULT 'Nuevo'
);
GO

-- 8. Relación Activos - Repuestos (Repuestos Críticos)
CREATE TABLE MANSOLE.AssetSpareParts (
    AssetId INT REFERENCES MANSOLE.Assets(Id),
    SparePartId INT REFERENCES MANSOLE.SpareParts(Id),
    IsCritical BIT DEFAULT 0,
    PRIMARY KEY (AssetId, SparePartId)
);
GO

-- 9. Transacciones de Inventario (Soporta ingresos por Canibalización sin orden SAP)
CREATE TABLE MANSOLE.InventoryTransactions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    SparePartId INT REFERENCES MANSOLE.SpareParts(Id),
    TransactionType NVARCHAR(20) NOT NULL, -- 'IN', 'OUT'
    Reason NVARCHAR(100) NOT NULL, -- 'Compra SAP', 'Canibalización', 'Hallazgo', 'Consumo OT', 'Ajuste'
    Quantity DECIMAL(10,2) NOT NULL,
    UnitCost DECIMAL(12,2) NOT NULL,
    Date DATETIME DEFAULT GETDATE(),
    UserId INT NULL REFERENCES MANSOLE.Users(Id),
    Reference NVARCHAR(150) NULL
);
GO

-- 10. Catálogo de Actividades Maestro
CREATE TABLE MANSOLE.Activities (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50) DEFAULT 'Mecánico',
    EstimatedMinutes INT DEFAULT 30,
    Resources NVARCHAR(300) NULL
);
GO

-- 11. Relación Actividades por Categoría de Máquina
CREATE TABLE MANSOLE.ActivityCategories (
    ActivityId INT REFERENCES MANSOLE.Activities(Id),
    CategoryId INT REFERENCES MANSOLE.AssetCategories(Id),
    PRIMARY KEY (ActivityId, CategoryId)
);
GO

-- 12. Relación Actividades externas por Área (CECO)
CREATE TABLE MANSOLE.ActivityAreas (
    ActivityId INT REFERENCES MANSOLE.Activities(Id),
    AreaId INT REFERENCES MANSOLE.Areas(Id),
    PRIMARY KEY (ActivityId, AreaId)
);
GO

-- 13. Actividades por Activo / Área (Plan de Mantenimiento Preventivo y Frecuencias)
CREATE TABLE MANSOLE.AssetActivities (
    Id INT PRIMARY KEY IDENTITY(1,1),
    AssetId INT NULL REFERENCES MANSOLE.Assets(Id),
    AreaId INT NULL REFERENCES MANSOLE.Areas(Id),
    ActivityId INT NOT NULL REFERENCES MANSOLE.Activities(Id),
    FrequencyType NVARCHAR(30) NOT NULL, -- 'Diaria', 'Semanal', 'Mensual', 'Anual', 'Horómetro'
    FrequencyValue INT NOT NULL DEFAULT 1,
    NextDueDate DATE NOT NULL,
    LastExecutionDate DATE NULL
);
GO

-- 14. Órdenes de Trabajo (OT) con soporte para Área (CECO), Activos y Diagnóstico Asistido IA
CREATE TABLE MANSOLE.WorkOrders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Code NVARCHAR(50) NOT NULL UNIQUE,
    AssetId INT NULL REFERENCES MANSOLE.Assets(Id),
    AreaId INT NULL REFERENCES MANSOLE.Areas(Id),
    Type NVARCHAR(50) NOT NULL, -- 'Preventivo', 'Correctivo'
    Priority NVARCHAR(50) DEFAULT 'Normal',
    ScheduledDate DATETIME NOT NULL,
    ExecutionDate DATETIME NULL,
    DowntimeMinutes INT DEFAULT 0,
    Description NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) DEFAULT 'Pendiente',
    LaborCost DECIMAL(12,2) DEFAULT 0,
    TotalCost DECIMAL(12,2) DEFAULT 0,
    AiDiagnosis NVARCHAR(MAX) NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    CreatedByUserId INT NULL REFERENCES MANSOLE.Users(Id)
);
GO

-- 15. Técnicos Asignados a Orden de Trabajo (Permite >1 técnico por mantenimiento)
CREATE TABLE MANSOLE.WorkOrderTechnicians (
    WorkOrderId INT REFERENCES MANSOLE.WorkOrders(Id),
    UserId INT REFERENCES MANSOLE.Users(Id),
    AssignedHours DECIMAL(5,2) DEFAULT 0,
    PRIMARY KEY (WorkOrderId, UserId)
);
GO

-- 16. Tareas (Checklist) dentro de una OT
CREATE TABLE MANSOLE.WorkOrderTasks (
    Id INT PRIMARY KEY IDENTITY(1,1),
    WorkOrderId INT REFERENCES MANSOLE.WorkOrders(Id),
    ActivityId INT REFERENCES MANSOLE.Activities(Id),
    IsCompleted BIT DEFAULT 0,
    Comments NVARCHAR(300) NULL
);
GO

-- 17. Repuestos utilizados en una OT (Consumo real que imputa al CECO)
CREATE TABLE MANSOLE.WorkOrderSpareParts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    WorkOrderId INT REFERENCES MANSOLE.WorkOrders(Id),
    SparePartId INT REFERENCES MANSOLE.SpareParts(Id),
    Quantity DECIMAL(10,2) NOT NULL,
    UnitCost DECIMAL(12,2) NOT NULL
);
GO

-- 18. Archivos Adjuntos (Fotos, evidencias, Azure Blob Storage)
CREATE TABLE MANSOLE.Attachments (
    Id INT PRIMARY KEY IDENTITY(1,1),
    EntityType NVARCHAR(50) NOT NULL,
    EntityId INT NOT NULL,
    FileName NVARCHAR(255) NOT NULL,
    BlobUrl NVARCHAR(500) NOT NULL,
    UploadedAt DATETIME DEFAULT GETDATE()
);
GO

-- 19. Auditoría
CREATE TABLE MANSOLE.AuditLogs (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NULL REFERENCES MANSOLE.Users(Id),
    Action NVARCHAR(100) NOT NULL,
    Entity NVARCHAR(100) NOT NULL,
    Timestamp DATETIME DEFAULT GETDATE(),
    Details NVARCHAR(MAX) NULL
);
GO

-- ====================================================================
-- SEEDING INICIAL DE DATOS PARA PRODUCCIÓN
-- ====================================================================

INSERT INTO MANSOLE.Companies (Name, TaxId) VALUES ('Grupo SOLE Corporación Rinnai', '20501234567');
GO

DECLARE @CompId INT = (SELECT TOP 1 Id FROM MANSOLE.Companies);
INSERT INTO MANSOLE.Areas (CompanyId, Name, CostCenterCode, Description) VALUES 
(@CompId, 'Área de Ensamblado de Termos', 'CECO-SOL-101', 'Línea principal de montaje de termos eléctricos y a gas'),
(@CompId, 'Área de Metalmecánica y Estampado', 'CECO-SOL-102', 'Prensas y troqueladoras para cubiertas'),
(@CompId, 'Área de Tratamiento Superficial y Pintura', 'CECO-SOL-103', 'Cabinas de pintura electrostática y hornos'),
(@CompId, 'Infraestructural de Planta General', 'CECO-SOL-999', 'Instalaciones comunes y sistemas de aire comprimido');
GO

INSERT INTO MANSOLE.Roles (Name) VALUES ('Administrador'), ('Supervisor'), ('Técnico'), ('Operador');
GO

DECLARE @AdminRoleId INT = (SELECT TOP 1 Id FROM MANSOLE.Roles WHERE Name = 'Administrador');
DECLARE @SuperRoleId INT = (SELECT TOP 1 Id FROM MANSOLE.Roles WHERE Name = 'Supervisor');
DECLARE @TecRoleId INT = (SELECT TOP 1 Id FROM MANSOLE.Roles WHERE Name = 'Técnico');
DECLARE @OperRoleId INT = (SELECT TOP 1 Id FROM MANSOLE.Roles WHERE Name = 'Operador');

INSERT INTO MANSOLE.Users (FirstName, LastName, Email, PasswordHash, RoleId) VALUES 
('Carlos', 'Admin', 'admin@gruposole.com', '$2a$10$wE1f/D/.xY8nQgRKh1Kq.G5aKq5Z31nSgR2O/tN8oV/o4iH/kHuq', @AdminRoleId),
('Roberto', 'Gómez', 'supervisor@gruposole.com', '$2a$10$wE1f/D/.xY8nQgRKh1Kq.G5aKq5Z31nSgR2O/tN8oV/o4iH/kHuq', @SuperRoleId),
('Juan', 'Pérez', 'tecnico@gruposole.com', '$2a$10$wE1f/D/.xY8nQgRKh1Kq.G5aKq5Z31nSgR2O/tN8oV/o4iH/kHuq', @TecRoleId),
('Ana', 'Vásquez', 'operador@gruposole.com', '$2a$10$wE1f/D/.xY8nQgRKh1Kq.G5aKq5Z31nSgR2O/tN8oV/o4iH/kHuq', @OperRoleId);
GO

INSERT INTO MANSOLE.AssetCategories (Name, Description) VALUES 
('Prensa Hidráulica', 'Máquinas de alta presión para formado y troquelado'),
('Horno de Secado', 'Hornos para curado de pintura electrostática'),
('Línea Ensambladora', 'Cintas transportadoras y bancos instrumentados de ensamble'),
('Compresor de Aire', 'Generación de aire comprimido industrial');
GO

DECLARE @CatPrensa INT = (SELECT TOP 1 Id FROM MANSOLE.AssetCategories WHERE Name = 'Prensa Hidráulica');
DECLARE @CatHorno INT = (SELECT TOP 1 Id FROM MANSOLE.AssetCategories WHERE Name = 'Horno de Secado');
DECLARE @CatEnsam INT = (SELECT TOP 1 Id FROM MANSOLE.AssetCategories WHERE Name = 'Línea Ensambladora');
DECLARE @AreaMetal INT = (SELECT TOP 1 Id FROM MANSOLE.Areas WHERE CostCenterCode = 'CECO-SOL-102');
DECLARE @AreaPnt INT = (SELECT TOP 1 Id FROM MANSOLE.Areas WHERE CostCenterCode = 'CECO-SOL-103');
DECLARE @AreaEnsam INT = (SELECT TOP 1 Id FROM MANSOLE.Areas WHERE CostCenterCode = 'CECO-SOL-101');

INSERT INTO MANSOLE.Assets (Code, Name, CategoryId, Brand, Model, SerialNumber, AreaId, AcquisitionDate, Status) VALUES 
('PRENSA-01', 'Prensa Hidráulica 200T #1', @CatPrensa, 'Komatsu', 'H200', 'SR-2020-091', @AreaMetal, '2020-05-15', 'Operativo'),
('PRENSA-02', 'Prensa Troquelado Rápido', @CatPrensa, 'Amada', 'AM-500', 'SR-2018-442', @AreaMetal, '2018-11-20', 'Operativo'),
('HORNO-01', 'Horno Curado Continuo Línea A', @CatHorno, 'Bosch Industrial', 'HT-300', 'BS-99881', @AreaPnt, '2021-02-10', 'Operativo'),
('ENSAM-01', 'Cinta Automática de Ensamble Termos', @CatEnsam, 'Siemens', 'FLX-990', 'SM-5412', @AreaEnsam, '2022-08-01', 'Operativo');
GO

INSERT INTO MANSOLE.SpareParts (Code, Name, Description, UnitOfMeasure, CurrentStock, MinStock, Location, UnitCost, Condition) VALUES 
('REP-VLM-001', 'Válvula Proporcional Hidráulica', 'Válvula 24V para prensas 200T', 'Pieza', 4, 2, 'Almacén A - Estante 3', 350.00, 'Nuevo'),
('REP-SENS-002', 'Sensor de Temperatura Termopar Type K', 'Sensor para horno de curado hasta 500C', 'Pieza', 10, 3, 'Almacén B - Cajón 12', 45.50, 'Nuevo'),
('REP-CANIB-003', 'Cilindro Neumático 50mm (Reacondicionado)', 'Componente canibalizado de línea antigua de termos', 'Pieza', 2, 1, 'Almacén Canibalización', 0.00, 'Reusado');
GO

INSERT INTO MANSOLE.Activities (Name, Type, EstimatedMinutes, Resources) VALUES 
('Cambio y purga de aceite hidráulico H-68', 'Mecánico', 120, 'Bomba de purga, recipientes de desecho, equipo EPP'),
('Calibración y verificación de pirómetros / termopares', 'Instrumentación', 45, 'Multímetro calibrador, termómetro láser de patrón'),
('Limpieza exhaustiva y revisión de válvulas neumáticas', 'Mecánico', 60, 'Kit de juntas, desengrasante industrial');
GO
