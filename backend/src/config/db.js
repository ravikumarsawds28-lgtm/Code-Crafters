const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const dbName = isTest ? 'fitness_log_test' : 'fitness_log';
  connectionString = `postgresql://${process.env.PGUSER || process.env.USER || 'postgres'}:${process.env.PGPASSWORD || ''}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || dbName}`;
}

const useSsl = process.env.DATABASE_URL &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
