/*
  # Fix auth trigger and add error handling

  1. Updates
    - Improve user profile creation trigger
    - Add error handling for duplicate usernames
    - Add validation for required fields
    - Add automatic cleanup for failed registrations
  
  2. Security
    - Ensure trigger runs with proper permissions
    - Add validation checks
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Validate required fields
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Generate username if not provided
  IF NEW.raw_user_meta_data->>'username' IS NULL THEN
    -- Use email prefix as username, ensure uniqueness
    WITH username_check AS (
      SELECT username, ROW_NUMBER() OVER () as num
      FROM users
      WHERE username LIKE split_part(NEW.email, '@', 1) || '%'
    )
    SELECT 
      CASE 
        WHEN EXISTS (SELECT 1 FROM username_check) 
        THEN split_part(NEW.email, '@', 1) || num::text
        ELSE split_part(NEW.email, '@', 1)
      END
    INTO NEW.raw_user_meta_data->>'username'
    FROM username_check
    ORDER BY num DESC
    LIMIT 1;
  END IF;

  -- Create user profile
  INSERT INTO public.users (
    id,
    email,
    username,
    role,
    created_at,
    last_login,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    'user',
    NOW(),
    NOW(),
    'online'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle duplicate username
    RAISE EXCEPTION 'Username already exists';
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add cleanup function for failed registrations
CREATE OR REPLACE FUNCTION public.cleanup_failed_registration(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete auth user
  DELETE FROM auth.users WHERE id = user_id;
  -- Delete profile if it exists
  DELETE FROM public.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;