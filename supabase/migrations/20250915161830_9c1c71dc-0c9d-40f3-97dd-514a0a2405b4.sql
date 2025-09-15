-- Fix security warnings by setting search_path for functions

-- Update generate_token_number function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;