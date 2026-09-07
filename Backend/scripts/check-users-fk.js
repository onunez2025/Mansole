const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDbConnection } = require('../src/config/db');

async function checkFKs() {
  const pool = await getDbConnection();
  const fks = await pool.request().query(`
    SELECT 
      OBJECT_NAME(f.parent_object_id) AS TableName,
      COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColName,
      OBJECT_NAME(f.referenced_object_id) AS RefTableName,
      COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS RefColName
    FROM sys.foreign_keys AS f
    INNER JOIN sys.foreign_key_columns AS fc 
      ON f.OBJECT_ID = fc.constraint_object_id
    WHERE OBJECT_NAME(f.referenced_object_id) = 'Users'
  `);
  console.log('FKs referencing Users:', fks.recordset);
  process.exit(0);
}

checkFKs().catch(e => { console.error(e); process.exit(1); });
