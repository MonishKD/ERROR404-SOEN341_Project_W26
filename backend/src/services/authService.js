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
  const token = `token_${user.id}_${Date.now()}`;
  return { token, user: { firstName: user.firstName, lastName: user.lastName, email: user.email } };
}

export async function register(firstName, lastName, password, email) {
  const firstName = (firstName[0].toUpperCase() + firstName.slice(1).toLowerCase()).trim();
  const lastName = lastName.trim();
  email = email.trim().toLowerCase();

  const existingByEmail = await prisma.users.findUnique({
    where: { email },
  });
  if (existingByEmail) {
    throw new Error('Email is already in use by another account!');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.users.create({
    data: {
      firstName: firstName,
      lastName: lastName,
      email,
      password_hash: passwordHash,
    },
  });

  return { message: 'User registered successfully! Welcome to MealMajor!' };
}