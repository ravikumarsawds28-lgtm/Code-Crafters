const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigrations(targetPool = pool, retries = 5, delay = 2000) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  for (let i = 0; i < retries; i++) {
    try {
      await targetPool.query(schemaSql);
      console.log('Database migrations completed successfully.');
      return;
    } catch (err) {
      console.error(`Database migration attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
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
