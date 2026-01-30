// profileService.js
// Handles viewing + updating username, email, diet preferences, allergies

//Helper function to validate email format
function isValidEmail(email) {
  // Simple check 
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

async function getProfile(token) {
  // TODO: DB lookup by token

  // Temporary profile data for Sprint 1 demo
  return {
    userId: "demo",
    username: "demoUser",
    email: "demo@example.com",
    dietPreferences: [],
    allergies: [],
  };
}

async function updateProfile(token, updates) {
  // Only allow specific fields to be updated (prevents random updates)
  const allowed = ["username", "email", "dietPreferences", "allergies"];
  const cleanUpdates = {};

  // Copy only allowed fields from the request into cleanUpdates
  for (const key of allowed) {
    if (updates[key] !== undefined) cleanUpdates[key] = updates[key];
  }

  // Basic validation
  if (cleanUpdates.email && !isValidEmail(cleanUpdates.email)) {
    return { ok: false, status: 400, message: "Invalid email format" };
  }

  if (cleanUpdates.dietPreferences && !Array.isArray(cleanUpdates.dietPreferences)) {
    return { ok: false, status: 400, message: "dietPreferences must be an array" };
  }

  if (cleanUpdates.allergies && !Array.isArray(cleanUpdates.allergies)) {
    return { ok: false, status: 400, message: "allergies must be an array" };
  }

  // TODO: update DB using token + cleanUpdates

  return { ok: true, message: "Profile updated", updatedFields: Object.keys(cleanUpdates) };
}

module.exports = { getProfile, updateProfile };
