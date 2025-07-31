-- This script provides the final fix for the signup error.
-- It replaces the previous trigger function with a more robust version.

-- 1. Drop the old function and trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the corrected function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  -- It's safer to read the email directly from the auth.users table
  -- using the id of the newly created user.
  user_email text;
BEGIN
  -- Get the email from the auth.users table
  SELECT email INTO user_email FROM auth.users WHERE id = new.id;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    user_email, -- Use the email variable we just fetched
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'role')::user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();