const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('POST /auth/login', () => {
  beforeEach(async () => {
    // Register a user first
    await request(app)
      .post('/auth/register')
      .send({
        name: 'Bob Jones',
        email: 'bob@example.com',
        password: 'password123',
      });
  });

  it('should login with valid credentials and return 200 with token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should return 401 on incorrect password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
