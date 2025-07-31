-- This script removes the unnecessary trigger and function for handling new user signups.
-- The frontend will now handle profile creation directly.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();