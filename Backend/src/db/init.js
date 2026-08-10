const fs = require('fs');
const path = require('path');
const { getDbConnection } = require('../config/db');

async function initDatabase() {
  console.log('⏳ Inicializando base de datos CMMS Grupo SOLE (Azure SQL Server / MANSOLE)...');
  try {
    const pool = await getDbConnection();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Dividir el script por directivas GO del estándar SQL Server
    const statements = sqlScript
      .split(/^\s*GO\s*$/im)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await pool.request().query(statement);
          console.log(`✅ Lote DDL ${i + 1}/${statements.length} ejecutado correctamente.`);
        } catch (err) {
          console.error(`❌ Error al ejecutar el lote ${i + 1}:`, err.message);
          console.error(`--- Lote problemático ---:\n`, statement);
          throw err;
        }
    }

    console.log('🎉 ¡Esquema DDL MANSOLE y datos iniciales (Seeding) importados exitosamente en Azure!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal durante la inicialización de la base de datos:', error.message);
    process.exit(1);
  }
}

initDatabase();
