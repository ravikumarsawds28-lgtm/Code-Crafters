const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('POST /workouts', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123',
      });
    token = res.body.token;
  });

  it('should return 401 if unauthorized (no token)', async () => {
    const res = await request(app)
      .post('/workouts')
      .send({
        exercise_type: 'Running',
        duration_min: 30,
        sets: 1,
        reps: 1,
        calories_burned: 300,
        workout_date: '2026-09-01',
      });

    expect(res.status).toBe(401);
  });

  it('should create a workout and return 201 with WorkoutID', async () => {
    const res = await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        exercise_type: 'Running',
        duration_min: 30,
        sets: 1,
        reps: 1,
        calories_burned: 300,
        workout_date: '2026-09-01',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('WorkoutID');
    expect(typeof res.body.WorkoutID).toBe('number');
  });

  it('should return 400 if exercise_type is missing', async () => {
    const res = await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        duration_min: 30,
        sets: 1,
        reps: 1,
        calories_burned: 300,
        workout_date: '2026-09-01',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
