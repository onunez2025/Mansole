/**
 * Script para resetear la contraseña de TODOS los usuarios en MANSOLE.Users a '123'.
 *
 * Uso:
 *   node scripts/reset-all-passwords.js
 */
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

async function main() {
  console.log('Iniciando reseteo de contraseñas a "123"...');
  
  const pool = await getDbConnection();
  const NEW_PASSWORD = '123';
  const BCRYPT_ROUNDS = 10;

  const hash = await bcrypt.hash(NEW_PASSWORD, BCRYPT_ROUNDS);
  console.log(`Hash generado para "${NEW_PASSWORD}": ${hash}`);

  // 1. Actualizar MANSOLE.Users
  const resultUsers = await pool.request()
    .input('hash', sql.NVarChar, hash)
    .query('UPDATE MANSOLE.Users SET PasswordHash = @hash');

  console.log(`✅ Contraseñas actualizadas en MANSOLE.Users: ${resultUsers.rowsAffected[0]} usuarios modificado(s).`);

  // 2. Si existe la tabla MANSOLE.Usuarios (esquema legacy)
  try {
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) AS count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'MANSOLE' AND TABLE_NAME = 'Usuarios'
    `);
    
    if (tableCheck.recordset[0].count > 0) {
      // Verificar columnas en MANSOLE.Usuarios
      const colCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'MANSOLE' AND TABLE_NAME = 'Usuarios'
      `);
      const columns = colCheck.recordset.map(c => c.COLUMN_NAME);

      if (columns.includes('UsuarioPasswordHash')) {
        await pool.request()
          .input('hash', sql.NVarChar, hash)
          .query('UPDATE MANSOLE.Usuarios SET UsuarioPasswordHash = @hash');
        console.log('✅ Contraseñas actualizadas en MANSOLE.Usuarios (UsuarioPasswordHash).');
      }

      if (columns.includes('UsuarioContraseña')) {
        await pool.request()
          .input('pass', sql.NVarChar, NEW_PASSWORD)
          .query('UPDATE MANSOLE.Usuarios SET UsuarioContraseña = @pass');
        console.log('✅ Contraseñas actualizadas en MANSOLE.Usuarios (UsuarioContraseña).');
      }
    }
  } catch (err) {
    console.log('Nota sobre tabla Usuarios legacy:', err.message);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
