// passwordResetService.js

// This file contains the service functions for handling password reset functionality. It includes functions to request a password reset, validate reset tokens, and reset the password.

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { prisma } from '../database/prisma.js';

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4002';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Request password reset
export async function requestPasswordReset(email) {
  const user = await prisma.users.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    // Return success even if user not found
    return { 
      success: true, 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    };
  }

  // Delete any existing unused tokens for this user
  await prisma.passwordResetTokens.deleteMany({
    where: { 
      userId: user.id,
      used: false,
    },
  });

  // Create new token (expires in 1 hour)
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await prisma.passwordResetTokens.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Create reset link
  const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;

  // Send email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'MealMajor - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0e9c50;">MealMajor Password Reset</h2>
        <p>Hello ${user.firstName},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; background: #0e9c50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">MealMajor - Your Personal Meal Planner</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
    // Still return success for security
  }

  return { 
    success: true, 
    message: 'If an account exists with this email, you will receive a password reset link.' 
  };
}

// Validate reset token
export async function validateResetToken(token) {
  const resetToken = await prisma.passwordResetTokens.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return { valid: false, message: 'Invalid or expired reset link' };
  }

  if (resetToken.used) {
    return { valid: false, message: 'This reset link has already been used' };
  }

  if (resetToken.expiresAt < new Date()) {
    return { valid: false, message: 'This reset link has expired' };
  }

  return { valid: true, userId: resetToken.userId };
}

// Reset password
export async function resetPassword(token, newPassword) {
  // Validate token
  const validation = await validateResetToken(token);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  await prisma.users.update({
    where: { id: validation.userId },
    data: { password_hash: passwordHash },
  });

  // Mark token as used
  await prisma.passwordResetTokens.update({
    where: { token },
    data: { used: true },
  });

  return { success: true, message: 'Password reset successfully!' };
}
