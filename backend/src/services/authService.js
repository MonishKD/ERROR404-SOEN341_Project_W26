// authService.js
//This file contains the logic for logging a user in and registering a new user.


// Requiring bcrypt for password hashing and Database for user data management
const bcrypt = require('bcrypt');
const Database = require('../database/database');

// Login function to authenticate a user
async function login(email, password) {
  email = email.trim().toLowerCase();
  const db = new Database();
  await db.connect();

  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Compare provided password with stored password hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }
    // For demo purposes, returning a dummy token and user info
    const token = `token_${user.username}_${Date.now()}`;
    return { token, user: { userID: user.username, email: user.email } };
  } finally {
    await db.close();
  }
}
// Register function to create a new user
async function register(userID, password, email) {
  email = email.trim().toLowerCase();
  const db = new Database();
  await db.connect();

  try {
    // Check if email is already in use
    const existingByEmail = await db.findUserByEmail(email);
    if (existingByEmail) {
      throw new Error('Email is already in use by another account!');
    }
    // Check if username is already taken
    const existingUser = await db.findUserByUsername(userID);
    if (existingUser) {
      throw new Error('This username already exists. Please choose a different one.');
    }
    // Hash the password before storing
    const passwordHash = await bcrypt.hash(password, 10);
    await db.createUser(userID, email, passwordHash);

    // Return success message
    return { message: "User registered successfully! Welcome to MealMajor!" };
  } finally {
    await db.close();
  }
}

module.exports = { login, register };
