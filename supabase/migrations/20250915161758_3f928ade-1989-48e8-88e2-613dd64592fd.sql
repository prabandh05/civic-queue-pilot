-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  citizen_id TEXT,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create counters table for service points
CREATE TABLE public.counters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  officer_id UUID REFERENCES public.profiles(id),
  officer_name TEXT,
  is_active BOOLEAN DEFAULT true,
  services TEXT[] DEFAULT ARRAY['general'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tokens table for queue management
CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number INTEGER NOT NULL,
  citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  citizen_name TEXT NOT NULL,
  citizen_phone TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'general',
  time_slot TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_time TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'no-show', 'cancelled')),
  priority BOOLEAN DEFAULT false,
  counter_id INTEGER REFERENCES public.counters(id),
  called_at TIMESTAMP WITH TIME ZONE,
  served_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for SMS/WhatsApp tracking
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.tokens(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sms', 'whatsapp', 'push')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue_stats table for analytics
CREATE TABLE public.queue_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_tokens INTEGER DEFAULT 0,
  completed_tokens INTEGER DEFAULT 0,
  avg_wait_time_minutes INTEGER DEFAULT 0,
  avg_service_time_minutes INTEGER DEFAULT 0,
  peak_queue_size INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Officers can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

CREATE POLICY "Anyone can create profile on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for counters
CREATE POLICY "Anyone can view active counters" ON public.counters
  FOR SELECT USING (is_active = true);

CREATE POLICY "Officers can manage counters" ON public.counters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

-- RLS Policies for tokens  
CREATE POLICY "Citizens can view their own tokens" ON public.tokens
  FOR SELECT USING (citizen_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Citizens can create their own tokens" ON public.tokens
  FOR INSERT WITH CHECK (citizen_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Officers can view all tokens" ON public.tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

CREATE POLICY "Officers can update all tokens" ON public.tokens
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their token notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tokens t 
      JOIN public.profiles p ON t.citizen_id = p.id 
      WHERE t.id = token_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Officers can view all notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for queue_stats
CREATE POLICY "Anyone can view queue stats" ON public.queue_stats
  FOR SELECT USING (true);

CREATE POLICY "Officers can manage queue stats" ON public.queue_stats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
  );

-- Create indexes for better performance
CREATE INDEX idx_tokens_status ON public.tokens(status);
CREATE INDEX idx_tokens_citizen_id ON public.tokens(citizen_id);
CREATE INDEX idx_tokens_created_at ON public.tokens(created_at);
CREATE INDEX idx_tokens_counter_id ON public.tokens(counter_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Create function to auto-generate token numbers
CREATE OR REPLACE FUNCTION public.generate_token_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1 
    INTO next_number 
    FROM public.tokens 
    WHERE DATE(created_at) = CURRENT_DATE;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_counters_updated_at
  BEFORE UPDATE ON public.counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_queue_stats_updated_at
  BEFORE UPDATE ON public.queue_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default counters
INSERT INTO public.counters (name, officer_name, is_active, services) VALUES
('Counter 1', 'Available', true, ARRAY['general', 'license', 'registration']),
('Counter 2', 'Available', true, ARRAY['general', 'license', 'registration']),
('Counter 3', 'Available', true, ARRAY['general', 'license', 'registration']);

-- Enable realtime for live updates
ALTER TABLE public.tokens REPLICA IDENTITY FULL;
ALTER TABLE public.counters REPLICA IDENTITY FULL;
ALTER TABLE public.queue_stats REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.counters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_stats;