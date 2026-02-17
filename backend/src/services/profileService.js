// profileService.js
import { prisma } from '../database/prisma.js';

// Helper function to validate email format
function isValidEmail(email) {
  // Simple check 
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

function parseTokenUsername(token) {
  if (typeof token !== 'string' || !token.startsWith('token_')) return null;
  const rest = token.slice('token_'.length);
  const lastUnderscore = rest.lastIndexOf('_');
  if (lastUnderscore <= 0) return null;
  return rest.slice(0, lastUnderscore);
}

function parseStoredList(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function getProfile(token) {
  const username = parseTokenUsername(token);
  if (!username) throw new Error('Invalid token');

  const user = await prisma.users.findUnique({
    where: { username },
  });
  if (!user) throw new Error('User not found');

  return {
    userId: String(user.id),
    username: user.username,
    email: user.email,
    dietPreferences: parseStoredList(user.diet_preferences),
    allergies: parseStoredList(user.allergies),
  };
}

// This function updates the user's profile based on the provided token and updates object. 
export async function updateProfile(token, updates) {
  const usernameFromToken = parseTokenUsername(token);
  if (!usernameFromToken) {
    return { ok: false, status: 401, message: 'Invalid token' };
  }

  const allowed = ["username", "email", "dietPreferences", "allergies"];
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

  // Prepare the data for Prisma update
  const prismaData = {};
  if (cleanUpdates.username !== undefined) prismaData.username = cleanUpdates.username.trim();
  if (cleanUpdates.email !== undefined) prismaData.email = cleanUpdates.email;
  if (cleanUpdates.dietPreferences !== undefined) {
    prismaData.diet_preferences = cleanUpdates.dietPreferences.join(", ");
  }
  if (cleanUpdates.allergies !== undefined) {
    prismaData.allergies = cleanUpdates.allergies.join(", ");
  }

  // Attempt to update the user's profile in the database
  try {
    await prisma.users.update({
      where: { username: usernameFromToken },
      data: prismaData,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return { ok: false, status: 409, message: 'Username or email already in use' };
    }
    throw error;
  }

  return { ok: true, message: "Profile updated", updatedFields: Object.keys(cleanUpdates) };
}