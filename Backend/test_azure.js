/**
 * Diagnóstico de conectividad contra Azure SQL.
 * Lee la configuración de Backend/.env — no contiene credenciales.
 *
 * Uso: node test_azure.js
 */
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function testConnection() {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Faltan variables en .env: ${missing.join(', ')}`);
    process.exit(1);
  }

  const config = {
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASSWORD.trim(),
    server: process.env.DB_SERVER.trim(),
    database: process.env.DB_NAME.trim(),
    options: {
      encrypt: true,
      trustServerCertificate: false
    },
    connectionTimeout: 5000
  };

  console.log(`Conectando a ${config.server} / ${config.database} como "${config.user}"...`);

  try {
    const pool = await new sql.ConnectionPool(config).connect();
    console.log('🎉 Conexión establecida correctamente.');
    await pool.close();
    process.exit(0);
  } catch (e) {
    console.error(`❌ Falló la conexión: ${e.message}`);
    console.error('   Revisa credenciales en .env y la regla de firewall de Azure SQL para tu IP.');
    process.exit(1);
  }
}

testConnection();
