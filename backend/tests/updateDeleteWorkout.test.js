const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('PATCH and DELETE /workouts/:id', () => {
  let token1, token2, workoutId1;

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

    // Create a workout for User 1
    const workoutRes = await request(app)
      .post('/workouts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        exercise_type: 'Running',
        duration_min: 30,
        sets: 3,
        reps: 10,
        calories_burned: 300,
        workout_date: '2026-09-01',
      });
    workoutId1 = workoutRes.body.WorkoutID;
  });

  describe('PATCH /workouts/:id', () => {
    it('should return 401 if unauthorized (no token)', async () => {
      const res = await request(app)
        .patch(`/workouts/${workoutId1}`)
        .send({ duration_min: 45 });

      expect(res.status).toBe(401);
    });

    it('should allow owner to update workout and return 200 with updated workout', async () => {
      const res = await request(app)
        .patch(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          exercise_type: 'Cycling',
          duration_min: 45,
          sets: 4,
          reps: 12,
          calories_burned: 400,
          workout_date: '2026-09-02',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('WorkoutID', workoutId1);
      expect(res.body.exercise_type).toBe('Cycling');
      expect(res.body.duration_min).toBe(45);
      expect(res.body.sets).toBe(4);
      expect(res.body.reps).toBe(12);
      expect(res.body.calories_burned).toBe(400);
      expect(res.body.workout_date).toBe('2026-09-02');

      // Verify the update is reflected in the workout list
      const listRes = await request(app)
        .get('/workouts')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.status).toBe(200);
      const updatedWorkout = listRes.body.find((w) => w.WorkoutID === workoutId1);
      expect(updatedWorkout).toBeDefined();
      expect(updatedWorkout.exercise_type).toBe('Cycling');
      expect(updatedWorkout.duration_min).toBe(45);
      expect(updatedWorkout.workout_date).toBe('2026-09-02');
    });

    it('should return 403 when a different user tries to edit the workout', async () => {
      const res = await request(app)
        .patch(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ exercise_type: 'Swimming', duration_min: 60 });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for a non-existent workout when editing', async () => {
      const res = await request(app)
        .patch('/workouts/999999')
        .set('Authorization', `Bearer ${token1}`)
        .send({ duration_min: 45 });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if no fields are provided to update', async () => {
      const res = await request(app)
        .patch(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /workouts/:id', () => {
    it('should return 401 if unauthorized (no token)', async () => {
      const res = await request(app)
        .delete(`/workouts/${workoutId1}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 when a different user tries to delete the workout', async () => {
      const res = await request(app)
        .delete(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for a non-existent workout when deleting', async () => {
      const res = await request(app)
        .delete('/workouts/999999')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should allow owner to delete workout and confirm it returns 404 on a subsequent GET', async () => {
      // Delete the workout
      const deleteRes = await request(app)
        .delete(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(204);

      // Confirm deleted workout returns 404 on subsequent GET
      const getRes = await request(app)
        .get(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(404);

      // Confirm deleted workout does not reappear in the workouts list
      const listRes = await request(app)
        .get('/workouts')
        .set('Authorization', `Bearer ${token1}`);

      expect(listRes.status).toBe(200);
      const foundInList = listRes.body.find((w) => w.WorkoutID === workoutId1);
      expect(foundInList).toBeUndefined();

      // Confirm deleted workout cannot be re-edited (returns 404)
      const patchRes = await request(app)
        .patch(`/workouts/${workoutId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ exercise_type: 'Swimming' });

      expect(patchRes.status).toBe(404);
      expect(patchRes.body).toHaveProperty('error');
    });
  });
});
