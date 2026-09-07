const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigrations(targetPool = pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await targetPool.query(schemaSql);
    console.log('Database migrations completed successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
    throw err;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
