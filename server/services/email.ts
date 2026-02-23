import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase email service not fully configured. Email verification will be limited.');
}

// Initialize Supabase client with service role key
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface EmailVerificationData {
  email: string;
  userId: string;
  token: string;
  verificationLink: string;
}

export interface EmailServiceResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiration (24 hours from now)
 */
export function getTokenExpiration(): Date {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

/**
 * Build the email verification link
 */
export function buildVerificationLink(token: string, email: string): string {
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  return `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
}

/**
 * Send verification email via Supabase
 */
export async function sendVerificationEmail(
  data: EmailVerificationData
): Promise<EmailServiceResponse> {
  try {
    console.log(`[Email Service] Sending verification email to ${data.email}`);

    // For development, log the verification link
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email Service] Verification link: ${data.verificationLink}`);
      console.log(`[Email Service] Token: ${data.token}`);
    }

    // If Supabase service is configured, use it
    if (supabase) {
      try {
        // Call Supabase auth admin API to send email
        // Note: You'll need to set up custom email templates in Supabase
        const emailResponse = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: data.email,
          password: Math.random().toString(36).slice(-8),
        });

        if (emailResponse.error) {
          console.error('[Email Service] Supabase error:', emailResponse.error);
          // Continue with fallback
        } else {
          console.log('[Email Service] Email sent via Supabase');
          return {
            success: true,
            messageId: emailResponse.data?.user?.id,
          };
        }
      } catch (supabaseError) {
        console.error('[Email Service] Supabase connection error:', supabaseError);
        // Continue with fallback
      }
    }

    // Fallback: In development mode, just log it. In production, implement actual email service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email Service] Development mode - Email would be sent to ${data.email}`);
      console.log(`[Email Service] Verification URL: ${data.verificationLink}`);
      return {
        success: true,
        messageId: data.token,
      };
    }

    // Production without email service configured
    console.warn('[Email Service] Email service not configured for production');
    return {
      success: false,
      error: 'Email service not configured',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Error sending email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<EmailServiceResponse> {
  try {
    console.log(`[Email Service] Sending welcome email to ${email}`);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Email Service] Welcome email for ${fullName} (${email})`);
      return {
        success: true,
        messageId: 'dev-welcome-' + Date.now(),
      };
    }

    return {
      success: false,
      error: 'Email service not configured',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Error sending welcome email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export default {
  generateVerificationToken,
  getTokenExpiration,
  buildVerificationLink,
  sendVerificationEmail,
  sendWelcomeEmail,
};
