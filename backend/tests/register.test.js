const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('POST /auth/register', () => {
  it('should register a new user and return 201 with UserID and token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('UserID');
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.UserID).toBe('number');
    expect(typeof res.body.token).toBe('string');
  });

  it('should return 409 if email already exists', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        name: 'Alice Smith',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Alice Duplicate',
        email: 'duplicate@example.com',
        password: 'password456',
      });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});
