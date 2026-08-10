const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Las credenciales viven únicamente en Backend/.env (ignorado por git).
// Nunca poner valores por defecto reales aquí: el archivo sí se versiona.
const requiredEnv = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Faltan variables de entorno de base de datos: ${missingEnv.join(', ')}. ` +
    'Configúralas en el panel de entorno de Easypanel.'
  );
}

const dbConfig = {
  user: (process.env.DB_USER || '').trim(),
  password: (process.env.DB_PASSWORD || '').trim(),
  server: (process.env.DB_SERVER || '').trim(),
  database: (process.env.DB_NAME || process.env.DB_DATABASE || 'soledb-puntoventa').trim(),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'false' ? false : true, // Azure SQL por defecto true
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' ? true : false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 10000
};

let poolPromise = null;

async function getDbConnection() {
  if (poolPromise) {
    return poolPromise;
  }
  try {
    poolPromise = new sql.ConnectionPool(dbConfig).connect();
    const pool = await poolPromise;
    console.log(`✅ Conexión a Azure SQL Server (${dbConfig.database} / MANSOLE) establecida exitosamente.`);
    return pool;
  } catch (err) {
    poolPromise = null;
    console.error('❌ Error al conectar a SQL Server:', err.message);
    throw err;
  }
}

module.exports = {
  sql,
  getDbConnection,
  dbConfig
};
