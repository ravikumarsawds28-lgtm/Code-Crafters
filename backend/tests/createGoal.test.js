const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('POST /goals', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Dana White',
        email: 'dana@example.com',
        password: 'password123',
      });
    token = res.body.token;
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .post('/goals')
      .send({
        goal_type: 'weight_loss',
        target_value: 70,
        target_date: '2026-12-31',
      });

    expect(res.status).toBe(401);
  });

  it('should create a goal and return 201 with GoalID', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_type: 'weight_loss',
        target_value: 70,
        target_date: '2026-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('GoalID');
    expect(typeof res.body.GoalID).toBe('number');
  });

  it('should return 400 if goal_type is invalid or missing', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        goal_type: 'marathon_running', // invalid goal_type
        target_value: 42,
        target_date: '2026-12-31',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
