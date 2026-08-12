/**
 * Script para crear las tablas de RBAC (Permissions y Role_Permissions)
 * e insertar el catálogo de permisos en Azure SQL Server.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');
const { ALL_PERMISSIONS, ROLE_PERMISSIONS } = require('../src/config/permissions');

async function main() {
  console.log('Iniciando inicialización de tablas RBAC en Azure SQL Server...');
  const pool = await getDbConnection();

  // 1. Crear MANSOLE.Permissions si no existe
  await pool.request().query(`
    IF OBJECT_ID('MANSOLE.Permissions', 'U') IS NULL
    BEGIN
      CREATE TABLE MANSOLE.Permissions (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Code NVARCHAR(100) NOT NULL UNIQUE,
        Name NVARCHAR(200) NOT NULL,
        Description NVARCHAR(500),
        Module NVARCHAR(50) NOT NULL,
        Permission_Type NVARCHAR(50),
        Status NVARCHAR(50) DEFAULT 'Activo',
        Created_Date DATETIME2 DEFAULT GETDATE()
      );
      CREATE INDEX idx_perm_module ON MANSOLE.Permissions(Module);
      CREATE INDEX idx_perm_code ON MANSOLE.Permissions(Code);
    END
  `);
  console.log('✅ Tabla MANSOLE.Permissions verificada/creada.');

  // 2. Insertar catálogo de permisos
  for (const permCode of ALL_PERMISSIONS) {
    const parts = permCode.split('.');
    const module = parts[1] || 'general';
    const action = parts[2] || 'view';
    const name = `${action.toUpperCase()} ${module.toUpperCase()}`;

    await pool.request()
      .input('code', sql.NVarChar, permCode)
      .input('name', sql.NVarChar, name)
      .input('module', sql.NVarChar, module)
      .input('type', sql.NVarChar, action)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM MANSOLE.Permissions WHERE Code = @code)
        BEGIN
          INSERT INTO MANSOLE.Permissions (Code, Name, Module, Permission_Type, Status)
          VALUES (@code, @name, @module, @type, 'Activo');
        END
      `);
  }
  console.log(`✅ ${ALL_PERMISSIONS.length} permisos insertados/verificados en MANSOLE.Permissions.`);

  // 3. Crear MANSOLE.Role_Permissions si no existe
  await pool.request().query(`
    IF OBJECT_ID('MANSOLE.Role_Permissions', 'U') IS NULL
    BEGIN
      CREATE TABLE MANSOLE.Role_Permissions (
        Role_Id INT NOT NULL,
        Permission_Id INT NOT NULL,
        Assigned_Date DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (Role_Id, Permission_Id),
        FOREIGN KEY (Role_Id) REFERENCES MANSOLE.Roles(Id) ON DELETE CASCADE,
        FOREIGN KEY (Permission_Id) REFERENCES MANSOLE.Permissions(Id) ON DELETE CASCADE
      );
    END
  `);
  console.log('✅ Tabla MANSOLE.Role_Permissions verificada/creada.');

  // 4. Mapear roles existentes con sus permisos
  const roles = await pool.request().query('SELECT Id, Name FROM MANSOLE.Roles');
  for (const r of roles.recordset) {
    const roleName = r.Name;
    const roleId = r.Id;
    const assignedPerms = ROLE_PERMISSIONS[roleName] || [];

    let permsToAssign = [];
    if (assignedPerms.includes('*')) {
      permsToAssign = ALL_PERMISSIONS;
    } else {
      permsToAssign = assignedPerms;
    }

    for (const permCode of permsToAssign) {
      const permRes = await pool.request()
        .input('code', sql.NVarChar, permCode)
        .query('SELECT Id FROM MANSOLE.Permissions WHERE Code = @code');
      
      if (permRes.recordset.length > 0) {
        const permId = permRes.recordset[0].Id;
        await pool.request()
          .input('roleId', sql.Int, roleId)
          .input('permId', sql.Int, permId)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM MANSOLE.Role_Permissions WHERE Role_Id = @roleId AND Permission_Id = @permId)
            BEGIN
              INSERT INTO MANSOLE.Role_Permissions (Role_Id, Permission_Id) VALUES (@roleId, @permId);
            END
          `);
      }
    }
    console.log(`  - Asignados permisos para el rol "${roleName}" (Id: ${roleId}).`);
  }

  console.log('\n🎉 ¡Tablas de RBAC e inserciones completadas con éxito!');
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error al inicializar RBAC:', e.message);
  process.exit(1);
});
