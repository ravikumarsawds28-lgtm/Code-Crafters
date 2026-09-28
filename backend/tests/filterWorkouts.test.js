const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('GET /workouts filter tests', () => {
  let token1, token2;

  beforeEach(async () => {
    // Register User 1
    const res1 = await request(app)
      .post('/auth/register')
      .send({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
      });
    token1 = res1.body.token;

    // Register User 2
    const res2 = await request(app)
      .post('/auth/register')
      .send({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
      });
    token2 = res2.body.token;

    // User 1 logs workouts of multiple exercise types across several dates
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
        workout_date: '2026-09-03',
      });

    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Running',
        duration_min: 35,
        sets: 1,
        reps: 1,
        calories_burned: 350,
        workout_date: '2026-09-05',
      });

    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Swimming',
        duration_min: 60,
        sets: 1,
        reps: 1,
        calories_burned: 500,
        workout_date: '2026-09-07',
      });

    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Running',
        duration_min: 40,
        sets: 1,
        reps: 1,
        calories_burned: 420,
        workout_date: '2026-09-09',
      });

    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Cycling',
        duration_min: 50,
        sets: 1,
        reps: 1,
        calories_burned: 450,
        workout_date: '2026-09-11',
      });

    // User 2 logs a workout (to verify user isolation)
    await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        exercise_type: 'Running',
        duration_min: 25,
        sets: 1,
        reps: 1,
        calories_burned: 250,
        workout_date: '2026-09-05',
      });
  });

  it('should return all workouts for user ordered newest first when no filters are applied (existing behavior unchanged)', async () => {
    const res = await request(app)
      .get('/workouts')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(6);

    // Verify contract fields
    const first = res.body[0];
    expect(first).toHaveProperty('WorkoutID');
    expect(first).toHaveProperty('exercise_type');
    expect(first).toHaveProperty('duration_min');
    expect(first).toHaveProperty('calories_burned');
    expect(first).toHaveProperty('workout_date');

    // Verify ordering: newest first
    const dates = res.body.map((w) => w.workout_date);
    expect(dates).toEqual([
      '2026-09-11',
      '2026-09-09',
      '2026-09-07',
      '2026-09-05',
      '2026-09-03',
      '2026-09-01',
    ]);
  });

  it('should filter workouts by exercise_type only and order newest first', async () => {
    const res = await request(app)
      .get('/workouts?exercise_type=Running')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);

    // All should be Running
    res.body.forEach((workout) => {
      expect(workout.exercise_type).toBe('Running');
    });

    // Ordered newest first
    const dates = res.body.map((w) => w.workout_date);
    expect(dates).toEqual(['2026-09-09', '2026-09-05', '2026-09-01']);
  });

  it('should filter workouts by date range only and order newest first', async () => {
    const res = await request(app)
      .get('/workouts?date_from=2026-09-03&date_to=2026-09-07')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);

    const dates = res.body.map((w) => w.workout_date);
    expect(dates).toEqual(['2026-09-07', '2026-09-05', '2026-09-03']);

    const exercises = res.body.map((w) => w.exercise_type);
    expect(exercises).toEqual(['Swimming', 'Running', 'Cycling']);
  });

  it('should filter workouts by both exercise_type and date range together and order newest first', async () => {
    const res = await request(app)
      .get('/workouts?exercise_type=Running&date_from=2026-09-03&date_to=2026-09-07')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    expect(res.body[0].exercise_type).toBe('Running');
    expect(res.body[0].workout_date).toBe('2026-09-05');
  });

  it('should return an empty list when exercise_type does not match any logged workouts', async () => {
    const res = await request(app)
      .get('/workouts?exercise_type=Yoga')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
