-- Migration to auto-create user record on auth signup

-- Drop the restrictive policy that only allows superadmin to insert users
DROP POLICY IF EXISTS "Superadmin can insert users" ON users;

-- Create a policy that allows authenticated users to insert their own record
CREATE POLICY "Users can insert their own record on signup"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Superadmin can also insert users (for manual user creation)
CREATE POLICY "Superadmin can insert any user"
  ON users FOR INSERT
  WITH CHECK (is_superadmin());

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, church_id)
  VALUES (
    NEW.id,
    NEW.email,
    'member', -- Default role for new signups
    NULL      -- No church assigned yet
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-create public.users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill existing auth.users that don't have a public.users record
-- This helps with any existing users who signed up before this migration
INSERT INTO public.users (id, email, role, church_id)
SELECT
  au.id,
  au.email,
  'member' as role,
  NULL as church_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
