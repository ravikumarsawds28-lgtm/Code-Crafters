const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
require('./setup');

describe('GET /health-stats', () => {
  let userWithHeightToken, userWithHeightId;
  let userWithoutHeightToken;

  beforeEach(async () => {
    // User with height
    const res1 = await request(app)
      .post('/auth/register')
      .send({
        name: 'Tall User',
        email: 'tall@example.com',
        password: 'password123',
        height_cm: 180,
      });
    userWithHeightToken = res1.body.token;
    userWithHeightId = res1.body.UserID;

    // Insert weight logs directly into WeightLog table
    await pool.query(
      `INSERT INTO "WeightLog" ("UserID", "weight_kg", "log_date") VALUES
       ($1, 85.0, '2026-08-01'),
       ($1, 81.0, '2026-09-01')`,
      [userWithHeightId]
    );

    // User without height
    const res2 = await request(app)
      .post('/auth/register')
      .send({
        name: 'No Height User',
        email: 'noheight@example.com',
        password: 'password123',
      });
    userWithoutHeightToken = res2.body.token;
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app).get('/health-stats');
    expect(res.status).toBe(401);
  });

  it('should return 404 if no height set', async () => {
    const res = await request(app)
      .get('/health-stats')
      .set('Authorization', `Bearer ${userWithoutHeightToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 200 with bmi, latest_weight, and weight_history', async () => {
    const res = await request(app)
      .get('/health-stats')
      .set('Authorization', `Bearer ${userWithHeightToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('bmi');
    expect(res.body).toHaveProperty('latest_weight');
    expect(res.body).toHaveProperty('weight_history');

    // 81 / (1.8 * 1.8) = 25
    expect(res.body.latest_weight).toBe(81);
    expect(res.body.bmi).toBe(25);
    expect(Array.isArray(res.body.weight_history)).toBe(true);
    expect(res.body.weight_history.length).toBe(2);
    expect(res.body.weight_history[0].weight_kg).toBe(81);
  });
});
