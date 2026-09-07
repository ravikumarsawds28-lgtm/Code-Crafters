const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('GET /workouts', () => {
  let token1, token2;

  beforeEach(async () => {
    // User 1
    const res1 = await request(app)
      .post('/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
      });
    token1 = res1.body.token;

    // User 2
    const res2 = await request(app)
      .post('/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
      });
    token2 = res2.body.token;

    // User 1 workouts
    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Running',
        duration_min: 30,
        sets: 1,
        reps: 1,
        calories_burned: 300,
        workout_date: '2026-09-01',
      });

    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Cycling',
        duration_min: 45,
        sets: 1,
        reps: 1,
        calories_burned: 400,
        workout_date: '2026-09-05',
      });

    // User 2 workout
    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        exercise_type: 'Swimming',
        duration_min: 60,
        sets: 1,
        reps: 1,
        calories_burned: 500,
        workout_date: '2026-09-03',
      });
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app).get('/workouts');
    expect(res.status).toBe(401);
  });

  it('should return workouts for the authenticated user matching contract fields', async () => {
    const res = await request(app)
      .get('/workouts')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    const first = res.body[0];
    expect(first).toHaveProperty('WorkoutID');
    expect(first).toHaveProperty('exercise_type');
    expect(first).toHaveProperty('duration_min');
    expect(first).toHaveProperty('calories_burned');
    expect(first).toHaveProperty('workout_date');
  });

  it('should filter workouts by date_from and date_to', async () => {
    const res = await request(app)
      .get('/workouts?date_from=2026-09-02&date_to=2026-09-06')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].exercise_type).toBe('Cycling');
  });
});
