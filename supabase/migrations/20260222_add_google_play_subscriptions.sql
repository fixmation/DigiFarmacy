-- Add subscription support to DigiFarmacy
-- Migration: Add subscriptions and purchase events tables

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_type TEXT NOT NULL CHECK (business_type IN ('pharmacy', 'laboratory')),
  sku_id TEXT NOT NULL,
  purchase_token TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  renewal_date TIMESTAMP WITH TIME ZONE,
  is_auto_renew BOOLEAN DEFAULT true,
  price_amount_micros BIGINT NOT NULL,
  currency_code TEXT DEFAULT 'LKR',
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  google_response JSONB,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for common queries
  CONSTRAINT unique_active_subscription_per_user UNIQUE(user_id, business_type) WHERE status = 'ACTIVE'
);

-- Create purchase events audit log table
CREATE TABLE public.purchase_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('PURCHASE', 'RENEWAL', 'CANCELLATION', 'PAUSE', 'RESUME', 'REFUND')),
  event_data JSONB,
  google_notification_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alter profiles table to add subscription reference
ALTER TABLE public.profiles
ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
ADD COLUMN subscription_status TEXT CHECK (subscription_status IN ('ACTIVE', 'INACTIVE', 'PAUSED', 'EXPIRED')),
ADD COLUMN subscription_renewed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expiry_date ON public.subscriptions(expiry_date);
CREATE INDEX idx_subscriptions_business_type ON public.subscriptions(business_type);
CREATE INDEX idx_subscriptions_sku_id ON public.subscriptions(sku_id);
CREATE INDEX idx_purchase_events_subscription_id ON public.purchase_events(subscription_id);
CREATE INDEX idx_purchase_events_user_id ON public.purchase_events(user_id);
CREATE INDEX idx_purchase_events_type ON public.purchase_events(event_type);
CREATE INDEX idx_purchase_events_processed_at ON public.purchase_events(processed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'developer_admin')
    )
  );

-- RLS Policies for purchase events
CREATE POLICY "Users can view purchase events for their subscriptions" ON public.purchase_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.subscriptions WHERE id = subscription_id
    )
  );

CREATE POLICY "Admins can view all purchase events" ON public.purchase_events
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'developer_admin')
    )
  );

-- Create function to update subscription status automatically
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profiles subscription_status based on subscriptions table
  UPDATE public.profiles
  SET subscription_status = CASE 
    WHEN NEW.status = 'ACTIVE' AND NEW.expiry_date > CURRENT_TIMESTAMP THEN 'ACTIVE'
    WHEN NEW.expiry_date <= CURRENT_TIMESTAMP THEN 'EXPIRED'
    ELSE NEW.status
  END,
  subscription_id = NEW.id,
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER subscription_status_update AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_status();

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid 
    AND status = 'ACTIVE' 
    AND expiry_date > CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log purchase events
CREATE OR REPLACE FUNCTION log_purchase_event(
  p_subscription_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB,
  p_notification_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.purchase_events (
    subscription_id,
    user_id,
    event_type,
    event_data,
    google_notification_id
  ) VALUES (
    p_subscription_id,
    p_user_id,
    p_event_type,
    p_event_data,
    p_notification_id
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
