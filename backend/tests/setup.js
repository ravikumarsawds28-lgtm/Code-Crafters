process.env.NODE_ENV = 'test';

const { pool } = require('../src/config/db');
const { runMigrations } = require('../src/db/migrate');

beforeAll(async () => {
  await runMigrations(pool);
});

beforeEach(async () => {
  await pool.query('TRUNCATE "Workout", "WeightLog", "Goal", "Reminder", "User" RESTART IDENTITY CASCADE;');
});

afterAll(async () => {
  await pool.end();
});

module.exports = { pool };
