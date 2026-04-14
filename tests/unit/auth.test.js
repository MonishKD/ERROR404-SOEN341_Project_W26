import request from 'supertest';
import app from '../../src/server.js';
import { prisma } from '../../src/database/prisma.js';

/* This file contains unit tests for the authentication routes (registration and login).
** It uses Jest and Supertest to send HTTP requests to the Express app and verify responses.
** Tests cover successful registration and login, as well as various failure scenarios. 
*/

let authToken;
let userId;

// Generate unique emails with timestamp
const getUniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;

beforeAll(async () => {
  // Simple approach: just proceed without cleanup
  // Tests use unique emails so no conflicts
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Sprint 1 - US.1: User Registration', () => {
  test('POST /api/auth/register - Register new user with valid data', async () => {
    const email = getUniqueEmail('auth-register');
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        password: 'TestPassword123'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/auth/register - Reject duplicate email', async () => {
    const email = getUniqueEmail('auth-duplicate');
    
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        email: email,
        password: 'AnotherPassword123'
      });

    // Second registration with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane2',
        lastName: 'Smith2',
        email: email,
        password: 'AnotherPassword123'
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/auth/register - Reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test'
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('Sprint 1 - US.2: User Login', () => {
  let loginEmail;

  beforeAll(async () => {
    loginEmail = getUniqueEmail('auth-login');
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Login',
        lastName: 'Test',
        email: loginEmail,
        password: 'LoginPassword123'
      });
  });

  test('POST /api/auth/login - Login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: loginEmail,
        password: 'LoginPassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  test('POST /api/auth/login - Reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: loginEmail,
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - Reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent-user-12345@test.com',
        password: 'Password123'
      });

    expect(res.status).toBe(401);
  });
});

describe('Sprint 1 - US.3: Profile Management', () => {
  let profileEmail;

  beforeAll(async () => {
    profileEmail = getUniqueEmail('auth-profile');
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Profile',
        lastName: 'User',
        email: profileEmail,
        password: 'ProfilePassword123'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: profileEmail,
        password: 'ProfilePassword123'
      });
    authToken = loginRes.body.token;
  });

  test('GET /api/profile - Retrieve user profile (authenticated)', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('firstName');
    expect(res.body).toHaveProperty('email');
  });

  test('GET /api/profile - Reject request without authentication', async () => {
    const res = await request(app)
      .get('/api/profile');

    expect(res.status).toBe(401);
  });

  test('PUT /api/profile - Update user profile', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'UpdatedName'
      });

    expect(res.status).toBe(200);
  });

  test('PUT /api/profile - Update dietary preferences', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        dietaryPreferences: ['Vegetarian'],
        allergies: ['peanuts']
      });

    expect(res.status).toBe(200);
  });
});