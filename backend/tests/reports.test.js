const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
require('./setup');

describe('GET /reports', () => {
  let token1, token2, userId1, userId2;

  beforeEach(async () => {
    const res1 = await request(app)
      .post('/auth/register')
      .send({
        name: 'Report User',
        email: 'report@example.com',
        password: 'password123',
      });
    token1 = res1.body.token;
    userId1 = res1.body.UserID;

    const res2 = await request(app)
      .post('/auth/register')
      .send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
    token2 = res2.body.token;
    userId2 = res2.body.UserID;

    // Insert workouts for User 1:
    // 1 today (within both weekly and monthly)
    // 1 15 days ago (within monthly, outside weekly)
    // 1 45 days ago (outside both)
    await pool.query(
      `INSERT INTO "Workout" ("UserID", "exercise_type", "duration_min", "calories_burned", "workout_date") VALUES
       ($1, 'Running', 30, 300, CURRENT_DATE),
       ($1, 'Cycling', 45, 400, CURRENT_DATE - INTERVAL '15 days'),
       ($1, 'Walking', 60, 200, CURRENT_DATE - INTERVAL '45 days'),
       ($2, 'Swimming', 60, 500, CURRENT_DATE)`,
      [userId1, userId2]
    );
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app).get('/reports?period=weekly');
    expect(res.status).toBe(401);
  });

  it('should return 400 on invalid period', async () => {
    const res1 = await request(app)
      .get('/reports')
      .set('Authorization', `Bearer ${token1}`);
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .get('/reports?period=yearly')
      .set('Authorization', `Bearer ${token1}`);
    expect(res2.status).toBe(400);
  });

  it('should return weekly report with total_workouts and total_calories', async () => {
    const res = await request(app)
      .get('/reports?period=weekly')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_workouts', 1);
    expect(res.body).toHaveProperty('total_calories', 300);
    expect(res.body).toHaveProperty('start_date');
    expect(res.body).toHaveProperty('end_date');
  });

  it('should return monthly report with total_workouts and total_calories', async () => {
    const res = await request(app)
      .get('/reports?period=monthly')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_workouts', 2);
    expect(res.body).toHaveProperty('total_calories', 700);
    expect(res.body).toHaveProperty('start_date');
    expect(res.body).toHaveProperty('end_date');
  });
});
