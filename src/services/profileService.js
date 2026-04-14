// profileService.js

// This file contains the service functions for handling profile-related operations such as fetching and updating user profiles, checking profile completion status, and updating health metrics.
 
import { prisma } from '../database/prisma.js';
import jwt from 'jsonwebtoken';

// Helper function to validate email format
function isValidEmail(email) {
  // Simple check 
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

function parseStoredList(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getProfile(userId) {

  const user = await prisma.users.findUnique({
    where: { id: parseInt(userId) },
  });

  if (!user) throw new Error('User not found');

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    dietPreferences: parseStoredList(user.diet_preferences),
    allergies: parseStoredList(user.allergies),
    cookingSkill: user.cookingSkill || '',
    mealPrepTime: user.mealPrepTime || '',
    budgetRange: user.budgetRange || '',
    age: user.age || '',
    weight: user.weight || '',
    height: user.height || '',
  };
}

// This function updates the user's profile based on the provided token and updates object. 
export async function updateProfile(userId, updates) {

  const allowed = ["firstName", "lastName", "email", "dietPreferences", "allergies", "cookingSkill", "mealPrepTime", "budgetRange", "age", "weight", "height"];
  const cleanUpdates = {};

  // Copy only allowed fields from the request into cleanUpdates
  for (const key of allowed) {
    if (updates[key] !== undefined) cleanUpdates[key] = updates[key];
  }

  // Basic validation
  if (cleanUpdates.email) {
    cleanUpdates.email = normalizeEmail(cleanUpdates.email);
    if (!isValidEmail(cleanUpdates.email)) {
      return { ok: false, status: 400, message: "Invalid email format" };
    }
  }

  if (cleanUpdates.dietPreferences && !Array.isArray(cleanUpdates.dietPreferences)) {
    return { ok: false, status: 400, message: "dietPreferences must be an array" };
  }

  if (cleanUpdates.allergies && !Array.isArray(cleanUpdates.allergies)) {
    return { ok: false, status: 400, message: "allergies must be an array" };
  }

  const validCookingSkills = ['beginner', 'intermediate', 'advanced', 'expert'];
  const validMealPrepTimes = ['quick', 'moderate', 'extended', 'elaborate', 'any'];
  const validBudgetRanges = ['low', 'medium', 'high'];

  if (cleanUpdates.cookingSkill && !validCookingSkills.includes(cleanUpdates.cookingSkill)) {
    return { ok: false, status: 400, message: "Invalid cooking skill value. Must be one of: beginner, intermediate, advanced, expert" };
  }

  if (cleanUpdates.mealPrepTime && !validMealPrepTimes.includes(cleanUpdates.mealPrepTime)) {
    return { ok: false, status: 400, message: "Invalid meal prep time value. Must be one of: quick, moderate, extended, elaborate, any" };
  }

  if (cleanUpdates.budgetRange && !validBudgetRanges.includes(cleanUpdates.budgetRange)) {
    return { ok: false, status: 400, message: "Invalid budget range value. Must be one of: low, medium, high" };
  }


  // Prepare the data for Prisma update
  const prismaData = {};

  if (cleanUpdates.firstName !== undefined) {
    prismaData.firstName = cleanUpdates.firstName.trim();
  }

  if (cleanUpdates.lastName !== undefined) {
    prismaData.lastName = cleanUpdates.lastName.trim();
  }

  // Update fullName if either first or last name changed
  if (cleanUpdates.firstName !== undefined || cleanUpdates.lastName !== undefined) {
    // Get current user data to know the other name field
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { firstName: true, lastName: true }
    });

    const newFirstName = cleanUpdates.firstName !== undefined ? cleanUpdates.firstName.trim() : user.firstName;
    const newLastName = cleanUpdates.lastName !== undefined ? cleanUpdates.lastName.trim() : user.lastName;
    prismaData.fullName = `${newFirstName} ${newLastName}`.trim();
  }

  if (cleanUpdates.email !== undefined) {
    prismaData.email = cleanUpdates.email;
  }

  if (cleanUpdates.age !== undefined) {
    prismaData.age = cleanUpdates.age ? parseInt(cleanUpdates.age) : null;
  }

  if (cleanUpdates.weight !== undefined) {
    prismaData.weight = cleanUpdates.weight ? parseFloat(cleanUpdates.weight) : null;
  }

  if (cleanUpdates.height !== undefined) {
    prismaData.height = cleanUpdates.height ? parseFloat(cleanUpdates.height) : null;
  }

  if (cleanUpdates.dietPreferences !== undefined) {
    prismaData.diet_preferences = cleanUpdates.dietPreferences.join(", ");
  }

  if (cleanUpdates.allergies !== undefined) {
    prismaData.allergies = cleanUpdates.allergies.join(", ");
  }

  if (cleanUpdates.cookingSkill !== undefined) {
    prismaData.cookingSkill = cleanUpdates.cookingSkill;
  }

  if (cleanUpdates.mealPrepTime !== undefined) {
    prismaData.mealPrepTime = cleanUpdates.mealPrepTime;
  }

  if (cleanUpdates.budgetRange !== undefined) {
    prismaData.budgetRange = cleanUpdates.budgetRange;
  }

  // Attempt to update the user's profile in the database
  try {
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: prismaData,
    });
  } catch (error) {
    console.error('Update error:', error);
    if (error.code === 'P2002') {
      return { ok: false, status: 409, message: 'Email already in use' };
    }
    return { ok: false, status: 500, message: error.message };
  }

  return { ok: true, message: "Profile updated", updatedFields: Object.keys(cleanUpdates) };
}