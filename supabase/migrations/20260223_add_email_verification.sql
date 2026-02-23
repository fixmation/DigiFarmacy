-- Email Verification Tokens Table
-- This table stores verification tokens for email confirmation
-- Tokens expire after 24 hours

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Create index on user_id for finding tokens by user
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Add email_verified column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

-- Create unique constraint on email in profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE(email);
  END IF;
END
$$;
