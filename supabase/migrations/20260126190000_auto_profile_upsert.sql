-- Ensure profiles are auto-created/updated when a new auth user is registered
-- Assumes table public.profiles(user_id uuid primary key, email text, nome text, created_at timestamptz, updated_at timestamptz)

-- Drop old trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS handle_new_user_profile ON auth.users;

-- (Re)create helper function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        nome = COALESCE(EXCLUDED.nome, public.profiles.nome),
        updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
CREATE TRIGGER handle_new_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user_profile();
