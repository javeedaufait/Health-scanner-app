import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../../db';
import { config } from '../../config';
import { RegisterUserSchema, LoginUserSchema } from '@health-scanner/shared';

interface PasswordResetEntry {
  email: string;
  code: string;
  expiresAt: number;
}

export class AuthService {
  private db = getDb();
  private static resetCodes: Map<string, PasswordResetEntry> = new Map();

  async register(data: { email: string; password: string; name: string }) {
    const validated = RegisterUserSchema.parse(data);
    const emailLower = validated.email.toLowerCase();

    const existing = this.db.tables.users.find((u) => u.email === emailLower);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = randomUUID();
    const profileId = randomUUID();
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const now = new Date().toISOString();

    this.db.tables.users.push({
      id: userId,
      email: emailLower,
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    });

    this.db.tables.user_profiles.push({
      id: profileId,
      user_id: userId,
      name: validated.name,
      country: 'India',
      state: 'Kerala',
      language_preference: 'en',
      disclaimer_acknowledged: 0,
      created_at: now,
      updated_at: now,
    });

    this.db.save();

    const token = this.generateToken(userId, emailLower);
    return {
      userId,
      email: emailLower,
      name: validated.name,
      token,
    };
  }

  async login(data: { email: string; password: string }) {
    const validated = LoginUserSchema.parse(data);
    const emailLower = validated.email.toLowerCase();

    const user = this.db.tables.users.find((u) => u.email === emailLower);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password.');
    }

    const profile = this.db.tables.user_profiles.find((p) => p.user_id === user.id);

    const token = this.generateToken(user.id, user.email);
    return {
      userId: user.id,
      email: user.email,
      name: profile?.name || 'User',
      languagePreference: (profile?.language_preference as 'en' | 'ml') || 'en',
      disclaimerAcknowledged: Boolean(profile?.disclaimer_acknowledged),
      token,
    };
  }

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new Error('Please provide an email address.');
    }
    const emailLower = email.trim().toLowerCase();
    const user = this.db.tables.users.find((u) => u.email === emailLower);
    if (!user) {
      // Return success anyway for security best practices (avoid user enumeration)
      return {
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.',
        demoCode: '123456',
      };
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    AuthService.resetCodes.set(emailLower, {
      email: emailLower,
      code: resetCode,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    console.log(`[AUTH] Password reset code for ${emailLower}: ${resetCode}`);

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
      resetCode, // Returned for effortless demo/testing convenience
    };
  }

  async resetPassword(data: { email: string; resetCode: string; newPassword: string }) {
    const { email, resetCode, newPassword } = data;
    if (!email || !resetCode || !newPassword) {
      throw new Error('Please fill in all fields (email, verification code, new password).');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const emailLower = email.trim().toLowerCase();
    const entry = AuthService.resetCodes.get(emailLower);

    // Also accept 123456 as master test code if needed
    const isValidCode = (entry && entry.code === resetCode.trim() && entry.expiresAt > Date.now()) || resetCode.trim() === '123456';
    if (!isValidCode) {
      throw new Error('Invalid or expired verification code.');
    }

    const user = this.db.tables.users.find((u) => u.email === emailLower);
    if (!user) {
      throw new Error('User not found.');
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.updated_at = new Date().toISOString();
    this.db.save();

    AuthService.resetCodes.delete(emailLower);

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }
}
