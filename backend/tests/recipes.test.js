import request from 'supertest';
import app from '../src/server.js';
import { prisma } from '../src/database/prisma.js';

let authToken;
let userId;
let testRecipeId;

const getUniqueEmail = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;

beforeAll(async () => {
  // Register test user
  const email = getUniqueEmail('recipe-test');
  await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'Recipe',
      lastName: 'Tester',
      email: email,
      password: 'RecipeTest123'
    });

  // Login to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: email,
      password: 'RecipeTest123'
    });

  authToken = loginRes.body.token;
  
  // Extract userId from token
  try {
    const tokenParts = authToken.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    userId = payload.userId;
  } catch (error) {
    console.error('Token parsing error:', error);
  }
});

afterAll(async () => {
  try {
    if (userId) {
      // Delete recipes owned by user
      await prisma.recipes.deleteMany({
        where: { ownerId: userId }
      }).catch(() => {});

      // Delete user
      await prisma.users.delete({
        where: { id: userId }
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
  await prisma.$disconnect();
});

describe('Sprint 2 - US.5: Create Recipes', () => {
  test('POST /api/recipes - Create recipe with valid data', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Pasta Carbonara',
        ingredients: ['pasta', 'eggs', 'bacon', 'cheese'],
        prep_time: 20,
        prep_steps: ['Boil pasta', 'Cook bacon', 'Mix eggs and cheese', 'Combine all'],
        cost: 'Low',
        difficulty: 'Easy',
        dietary_tags: ['Vegetarian'],
        allergens: ['dairy']
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Pasta Carbonara');
    testRecipeId = res.body.id;
  });

  test('POST /api/recipes - Reject without authentication', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({
        name: 'No Auth Recipe',
        ingredients: ['ingredient1'],
        prep_time: 30,
        prep_steps: ['step1'],
        cost: 'Medium',
        difficulty: 'Medium'
      });

    expect(res.status).toBe(401);
  });

  test('POST /api/recipes - Create recipe with minimal data (name only)', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Simple Recipe'
      });

    // Your API allows creating recipes with just a name
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Simple Recipe');
  });
});

describe('Sprint 2 - US.7: Edit Recipes', () => {
  let recipeToEdit;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Original Recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        prep_time: 30,
        prep_steps: ['step1', 'step2'],
        cost: 'Medium',
        difficulty: 'Medium'
      });
    recipeToEdit = res.body.id;
  });

  test('PUT /api/recipes/:id - Update recipe with valid data', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeToEdit}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Recipe Name',
        cost: 'High',
        difficulty: 'Hard'
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Recipe Name');
  });

  test('PUT /api/recipes/:id - Reject without authentication', async () => {
    const res = await request(app)
      .put(`/api/recipes/${recipeToEdit}`)
      .send({
        name: 'Unauthorized Update'
      });

    expect(res.status).toBe(401);
  });

  test('PUT /api/recipes/:id - Return 404 for non-existent recipe', async () => {
    const res = await request(app)
      .put('/api/recipes/99999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Ghost Recipe'
      });

    expect(res.status).toBe(404);
  });
});

describe('Sprint 2 - US.7: Delete Recipes', () => {
  let recipeToDelete;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Recipe to Delete',
        ingredients: ['ingredient1'],
        prep_time: 20,
        prep_steps: ['step1'],
        cost: 'Low',
        difficulty: 'Easy'
      });
    recipeToDelete = res.body.id;
  });

  test('DELETE /api/recipes/:id - Delete recipe successfully', async () => {
    const res = await request(app)
      .delete(`/api/recipes/${recipeToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  test('DELETE /api/recipes/:id - Reject without authentication', async () => {
    const res = await request(app)
      .delete(`/api/recipes/${recipeToDelete}`);

    expect(res.status).toBe(401);
  });

  test('DELETE /api/recipes/:id - Return 404 for non-existent recipe', async () => {
    const res = await request(app)
      .delete('/api/recipes/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});