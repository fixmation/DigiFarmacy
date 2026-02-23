import { Router, Request, Response } from 'express';
import { db } from '../db';
import { emailVerificationTokens, profiles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import {
  generateVerificationToken,
  getTokenExpiration,
  buildVerificationLink,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../services/email';
import { storage } from '../storage';

const router = Router();

/**
 * POST /api/auth/send-verification
 * Send a verification email to the user
 */
router.post('/api/auth/send-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await storage.getProfileByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ success: true, message: 'If email exists, verification has been sent' });
    }

    // Check if already verified
    if (user.status === 'verified') {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate token
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiration();
    const verificationLink = buildVerificationLink(token, email);

    // Store token in storage (using in-memory for now, can use DB later)
    await (storage as any).createEmailVerificationToken({
      userId: user.id,
      email,
      token,
      expiresAt,
    });

    // Send email
    const emailResult = await sendVerificationEmail({
      email,
      userId: user.id,
      token,
      verificationLink,
    });

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    // Get verification token from storage
    const verificationToken = await (storage as any).getEmailVerificationToken(token);

    if (!verificationToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Check if token is expired
    if (new Date(verificationToken.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Check if email matches
    if (verificationToken.email !== email) {
      return res.status(400).json({ error: 'Email does not match token' });
    }

    // Check if already verified
    if (verificationToken.verifiedAt) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Get user
    const user = await storage.getProfile(verificationToken.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user status to verified
    await storage.updateProfile(user.id, {
      status: 'verified',
      preferredLanguage: 'en',
    });

    // Mark token as verified
    await (storage as any).markEmailTokenAsVerified(token);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.fullName);

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: 'verified',
      },
    });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * GET /api/auth/verify-email-status
 * Check if user's email is verified
 */
router.get('/api/auth/verify-email-status', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getProfile(String(req.user.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      isVerified: user.status === 'verified',
      verificationDate: user.status === 'verified' ? new Date() : null,
    });
  } catch (error: any) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getProfile(String(req.user.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.status === 'verified') {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new token
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiration();
    const verificationLink = buildVerificationLink(token, user.email);

    // Store token
    await (storage as any).createEmailVerificationToken({
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
    });

    // Send email
    const emailResult = await sendVerificationEmail({
      email: user.email,
      userId: user.id,
      token,
      verificationLink,
    });

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({
      success: true,
      message: 'Verification email resent',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

export default router;
