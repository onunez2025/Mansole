/**
 * Hashea las contraseñas en texto plano de MANSOLE.Usuarios.
 *
 *   node scripts/hash-usuarios-passwords.js           -> solo reporta (no escribe)
 *   node scripts/hash-usuarios-passwords.js --apply   -> aplica los cambios
 *
 * Es NO DESTRUCTIVO a propósito:
 *   - Crea la columna UsuarioPasswordHash si no existe.
 *   - Escribe ahí el hash bcrypt de la contraseña actual.
 *   - NO borra UsuarioContraseña. Eso lo decides tú después de validar el login,
 *     con el SQL que este script imprime al final.
 *
 * Ojo: hashear una contraseña débil la sigue dejando débil. El reporte marca
 * cuáles hay que reemplazar de todas formas.
 */
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

const APPLY = process.argv.includes('--apply');
const BCRYPT_ROUNDS = 10;
const MIN_SAFE_LENGTH = 8;

async function columnExists(pool, table, column) {
  const r = await pool.request()
    .input('t', sql.NVarChar, table)
    .input('c', sql.NVarChar, column)
    .query(`
      SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'MANSOLE' AND TABLE_NAME = @t AND COLUMN_NAME = @c
    `);
  return r.recordset[0].n > 0;
}

async function main() {
  const pool = await getDbConnection();

  const users = await pool.request().query(`
    SELECT u.UsuarioID, u.UsuarioNombre, u.UsuarioContraseña AS Plain,
           u.UsuarioStatus, p.PerfilNombre
    FROM MANSOLE.Usuarios u
    LEFT JOIN MANSOLE.UsuariosPerfiles p ON u.UsuarioPerfil = p.PerfilID
    ORDER BY u.UsuarioID
  `);

  if (users.recordset.length === 0) {
    console.log('No hay usuarios en MANSOLE.Usuarios.');
    process.exit(0);
  }

  console.log(`\n${users.recordset.length} usuario(s) en MANSOLE.Usuarios\n`);
  console.log('USUARIO'.padEnd(18) + 'PERFIL'.padEnd(42) + 'LARGO'.padEnd(7) + 'ESTADO');
  console.log('-'.repeat(85));

  const weak = [];
  const toHash = [];

  for (const u of users.recordset) {
    const plain = u.Plain || '';
    // Un valor que ya parece bcrypt no debe re-hashearse.
    const alreadyHashed = /^\$2[aby]\$\d{2}\$/.test(plain);
    const length = plain.length;

    let state;
    if (alreadyHashed) {
      state = 'ya hasheada, se omite';
    } else if (length === 0) {
      state = 'sin contraseña, se omite';
    } else {
      state = 'se hasheará';
      toHash.push({ id: u.UsuarioID, plain });
      if (length < MIN_SAFE_LENGTH) weak.push(u.UsuarioID);
    }

    console.log(
      String(u.UsuarioID).padEnd(18) +
      String(u.PerfilNombre || '(sin perfil)').slice(0, 40).padEnd(42) +
      String(length || '-').padEnd(7) +
      state
    );
  }

  if (weak.length > 0) {
    console.log(`\n⚠️  ${weak.length} contraseña(s) con menos de ${MIN_SAFE_LENGTH} caracteres:`);
    console.log(`   ${weak.join(', ')}`);
    console.log('   Hashearlas NO las hace seguras. Hay que reemplazarlas.');
  }

  if (!APPLY) {
    console.log(`\nModo reporte. Para aplicar:\n   node scripts/hash-usuarios-passwords.js --apply\n`);
    process.exit(0);
  }

  // --- Aplicar ---
  if (!(await columnExists(pool, 'Usuarios', 'UsuarioPasswordHash'))) {
    console.log('\nCreando columna MANSOLE.Usuarios.UsuarioPasswordHash...');
    await pool.request().query(
      'ALTER TABLE MANSOLE.Usuarios ADD UsuarioPasswordHash NVARCHAR(255) NULL'
    );
    console.log('  columna creada.');
  } else {
    console.log('\nLa columna UsuarioPasswordHash ya existe.');
  }

  let done = 0;
  for (const { id, plain } of toHash) {
    const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('hash', sql.NVarChar, hash)
      .query('UPDATE MANSOLE.Usuarios SET UsuarioPasswordHash = @hash WHERE UsuarioID = @id');
    done++;
  }

  console.log(`\n✅ ${done} contraseña(s) hasheadas en UsuarioPasswordHash.`);
  console.log('   UsuarioContraseña quedó intacta como respaldo.');
  console.log('\nCuando el login funcione contra la columna nueva, elimina el texto plano:');
  console.log('   ALTER TABLE MANSOLE.Usuarios DROP COLUMN UsuarioContraseña;');

  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
