-- Create function to create initial admin user
CREATE OR REPLACE FUNCTION public.create_initial_admin(
  admin_email text,
  admin_password text,
  admin_name text,
  admin_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    RAISE NOTICE 'Admin user already exists';
    RETURN;
  END IF;
  
  -- Insert admin directly into profiles (this will be used when a manual admin is created)
  INSERT INTO profiles (
    id,
    user_id, 
    full_name,
    phone,
    role
  ) VALUES (
    gen_random_uuid(),
    gen_random_uuid(), -- Temporary placeholder, will be updated when real user signs up
    admin_name,
    admin_phone,
    'admin'
  );
  
  RAISE NOTICE 'Initial admin setup prepared. Please sign up with email: %', admin_email;
END;
$$;

-- Create a function to upgrade a user to admin
CREATE OR REPLACE FUNCTION public.make_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can grant admin privileges';
  END IF;
  
  -- Update target user to admin
  UPDATE profiles 
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Set first user with email admin@queue.com as admin (you can change this email)
-- This will automatically make the first user who signs up with this email an admin
CREATE OR REPLACE FUNCTION public.auto_admin_first_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first admin setup (no existing admins)
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    -- Check if email matches admin email pattern or is the first user
    IF NEW.email = 'admin@queue.com' OR 
       (SELECT COUNT(*) FROM auth.users) = 1 THEN
      -- Set metadata to make this user admin
      NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign admin to first user or admin email
DROP TRIGGER IF EXISTS auto_admin_trigger ON auth.users;
CREATE TRIGGER auto_admin_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_admin_first_user();