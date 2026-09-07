const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

async function main() {
  console.log('--- CONFIGURANDO USUARIO ADMINISTRADOR ÚNICO ---');
  const pool = await getDbConnection();

  const NEW_PASSWORD = 'sole12345,';
  const BCRYPT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, BCRYPT_ROUNDS);
  console.log(`Hash generado para "${NEW_PASSWORD}": ${passwordHash}`);

  // 1. Obtener o asegurar el rol Administrador
  const roleResult = await pool.request().query("SELECT Id, Name FROM MANSOLE.Roles WHERE Name = 'Administrador'");
  let adminRoleId = 1;
  if (roleResult.recordset.length > 0) {
    adminRoleId = roleResult.recordset[0].Id;
  }

  // 2. Verificar usuario ID 1
  const user1 = await pool.request().query("SELECT Id, Email FROM MANSOLE.Users WHERE Id = 1");
  let targetAdminId = 1;

  if (user1.recordset.length > 0) {
    // Actualizar usuario 1 con la nueva clave y datos
    await pool.request()
      .input('id', sql.Int, 1)
      .input('firstName', sql.NVarChar, 'Administrador')
      .input('lastName', sql.NVarChar, 'General')
      .input('email', sql.NVarChar, 'admin@gruposole.com')
      .input('hash', sql.NVarChar, passwordHash)
      .input('roleId', sql.Int, adminRoleId)
      .query(`
        UPDATE MANSOLE.Users 
        SET FirstName = @firstName,
            LastName = @lastName,
            Email = @email,
            PasswordHash = @hash,
            RoleId = @roleId,
            IsActive = 1
        WHERE Id = @id
      `);
    console.log('✅ Usuario ID 1 actualizado como Administrador con clave "sole12345,"');
    targetAdminId = 1;
  } else {
    // Crear usuario admin
    const insertRes = await pool.request()
      .input('firstName', sql.NVarChar, 'Administrador')
      .input('lastName', sql.NVarChar, 'General')
      .input('email', sql.NVarChar, 'admin@gruposole.com')
      .input('hash', sql.NVarChar, passwordHash)
      .input('roleId', sql.Int, adminRoleId)
      .query(`
        INSERT INTO MANSOLE.Users (FirstName, LastName, Email, PasswordHash, RoleId, IsActive, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES (@firstName, @lastName, @email, @hash, @roleId, 1, GETDATE())
      `);
    targetAdminId = insertRes.recordset[0].Id;
    console.log(`✅ Usuario Admin creado con ID: ${targetAdminId}`);
  }

  // 3. Reasignar referencias foráneas de otros usuarios hacia el admin
  const otherUsers = await pool.request()
    .input('adminId', sql.Int, targetAdminId)
    .query("SELECT Id, Email FROM MANSOLE.Users WHERE Id != @adminId");

  console.log(`Encontrados ${otherUsers.recordset.length} otros usuarios para limpiar.`);

  for (const u of otherUsers.recordset) {
    const uid = u.Id;
    console.log(`Reasignando dependencias de usuario ${uid} (${u.Email}) al admin (${targetAdminId})...`);

    // Actualizar posibles tablas referenciadas
    const tablesToUpdate = [
      { table: 'MANSOLE.WorkOrders', col: 'CreatedByUserId' },
      { table: 'MANSOLE.WorkOrderTechnicians', col: 'UserId' },
      { table: 'MANSOLE.MaintenanceRecord', col: 'AssignedTechnicianId' },
      { table: 'MANSOLE.MaintenanceRecord', col: 'SupervisorId' },
      { table: 'MANSOLE.MaintenanceRecord', col: 'CompletedByUserId' },
      { table: 'MANSOLE.InventoryTransactions', col: 'UserId' },
      { table: 'MANSOLE.AuditLogs', col: 'UserId' },
      { table: 'MANSOLE.Areas', col: 'ResponsibleId' },
      { table: 'MANSOLE.Assets', col: 'AssignedToUserId' },
      { table: 'MANSOLE.ActionPlans', col: 'ResponsibleUserId' },
      { table: 'MANSOLE.Observations', col: 'AssignedUserId' }
    ];

    for (const item of tablesToUpdate) {
      try {
        await pool.request()
          .input('adminId', sql.Int, targetAdminId)
          .input('oldId', sql.Int, uid)
          .query(`UPDATE ${item.table} SET ${item.col} = @adminId WHERE ${item.col} = @oldId`);
      } catch (err) {
        // Puede que la tabla no tenga registros o columna sea opcional
      }
    }

    // Ahora intentar eliminar el usuario de prueba
    try {
      await pool.request()
        .input('uid', sql.Int, uid)
        .query("DELETE FROM MANSOLE.Users WHERE Id = @uid");
      console.log(`🗑️ Eliminado usuario ID ${uid} (${u.Email})`);
    } catch (delErr) {
      console.log(`⚠️ No se pudo eliminar usuario ID ${uid} debido a restricciones, desactivando: ${delErr.message}`);
      await pool.request()
        .input('uid', sql.Int, uid)
        .query("UPDATE MANSOLE.Users SET IsActive = 0, Email = 'inactivo_' + CAST(Id AS NVARCHAR) + '@gruposole.com' WHERE Id = @uid");
    }
  }

  // 4. Verificar usuarios finales en la BD
  const finalUsers = await pool.request().query(`
    SELECT u.Id, u.FirstName, u.LastName, u.Email, u.IsActive, r.Name AS RoleName
    FROM MANSOLE.Users u
    LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
  `);
  console.log('\n--- USUARIOS FINALES EN LA BASE DE DATOS ---');
  console.table(finalUsers.recordset);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
