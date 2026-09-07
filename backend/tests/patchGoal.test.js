const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('PATCH /goals/:id', () => {
  let token1, token2, goalId1;

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

    // Create goal for User 1
    const goalRes = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        goal_type: 'weight_loss',
        target_value: 70,
        target_date: '2026-12-31',
      });
    goalId1 = goalRes.body.GoalID;
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .patch(`/goals/${goalId1}`)
      .send({ current_value: 75, status: 'active' });

    expect(res.status).toBe(401);
  });

  it('should allow owner to update goal and return 200 with updated goal', async () => {
    const res = await request(app)
      .patch(`/goals/${goalId1}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        current_value: 72.5,
        status: 'achieved',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('GoalID', goalId1);
    expect(Number(res.body.current_value)).toBe(72.5);
    expect(res.body.status).toBe('achieved');
  });

  it('should return 404 if goal does not exist', async () => {
    const res = await request(app)
      .patch('/goals/999999')
      .set('Authorization', `Bearer ${token1}`)
      .send({ current_value: 72.5 });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 403 if user is not the owner of the goal', async () => {
    const res = await request(app)
      .patch(`/goals/${goalId1}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ current_value: 80, status: 'abandoned' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});
