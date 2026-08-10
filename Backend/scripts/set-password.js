/**
 * Asigna una contraseña a un usuario de MANSOLE.Users.
 *
 * Uso:
 *   node scripts/set-password.js admin@gruposole.com
 *
 * La contraseña se pide por consola (no se ve al escribir), no se pasa como
 * argumento y no queda en el historial del shell. Solo se guarda el hash bcrypt.
 */
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection, sql } = require('../src/config/db');

const MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

/** Lee de stdin sin imprimir lo tecleado. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Silenciar el eco de la terminal mientras se escribe la contraseña.
    const onData = (char) => {
      if (['\n', '\r', ''].includes(char.toString())) {
        process.stdin.removeListener('data', onData);
      } else {
        process.stdout.write('\x1B[2K\x1B[200D' + question);
      }
    };

    process.stdout.write(question);
    process.stdin.on('data', onData);

    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Uso: node scripts/set-password.js <email>');
    console.error('Ej.: node scripts/set-password.js admin@gruposole.com');
    process.exit(1);
  }

  const pool = await getDbConnection();

  const found = await pool.request()
    .input('email', sql.NVarChar, email.toLowerCase())
    .query(`
      SELECT u.Id, u.FirstName, u.LastName, u.Email, u.IsActive, r.Name AS RoleName
      FROM MANSOLE.Users u
      LEFT JOIN MANSOLE.Roles r ON u.RoleId = r.Id
      WHERE LOWER(u.Email) = @email
    `);

  if (found.recordset.length === 0) {
    console.error(`❌ No existe ningún usuario con el email "${email}".`);
    process.exit(1);
  }

  const user = found.recordset[0];
  const fullName = [user.FirstName, user.LastName].filter(Boolean).join(' ');
  console.log(`Usuario: ${fullName} <${user.Email}>`);
  console.log(`Rol: ${user.RoleName || 'Sin rol'} | Activo: ${user.IsActive ? 'sí' : 'no'}\n`);

  const password = await askHidden('Nueva contraseña: ');
  const confirm = await askHidden('Confirmar contraseña: ');

  if (password !== confirm) {
    console.error('❌ Las contraseñas no coinciden.');
    process.exit(1);
  }

  if (password.length < MIN_LENGTH) {
    console.error(`❌ La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await pool.request()
    .input('id', sql.Int, user.Id)
    .input('hash', sql.NVarChar, hash)
    .query('UPDATE MANSOLE.Users SET PasswordHash = @hash WHERE Id = @id');

  console.log(`\n✅ Contraseña actualizada para ${user.Email}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
