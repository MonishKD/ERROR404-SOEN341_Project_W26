// authService.js
// This file contains the authentication logic for user login and registration.
import bcrypt from 'bcrypt';
import { prisma } from '../database/prisma.js';

export async function login(email, password) {
  email = email.trim().toLowerCase();
  const user = await prisma.users.findUnique({
    where: { email },
  });
  // If no user is found with the provided email, throw an error
  if (!user) {
    throw new Error('User not found');
  }
  // Compare the provided password with the stored password hash using bcrypt
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new Error('Invalid password');
  }
  // For demo purposes, we return a simple token.
  const token = `token_${user.username}_${Date.now()}`;
  return { token, user: { userID: user.username, email: user.email } };
}

export async function register(userID, password, email) {
  const username = userID.trim();
  email = email.trim().toLowerCase();

  const existingByEmail = await prisma.users.findUnique({
    where: { email },
  });
  if (existingByEmail) {
    throw new Error('Email is already in use by another account!');
  }

  const existingUser = await prisma.users.findUnique({
    where: { username },
  });
  if (existingUser) {
    throw new Error('This username already exists. Please choose a different one.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.users.create({
    data: {
      username,
      email,
      password_hash: passwordHash,
    },
  });

  return { message: 'User registered successfully! Welcome to MealMajor!' };
}