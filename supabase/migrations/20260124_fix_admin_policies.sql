-- Fix admin policies to ensure admins can read audit_logs and user_roles

-- Add UPDATE policy for audit_logs (if needed for future operations)
DROP POLICY IF EXISTS "Admins can update audit logs" ON public.audit_logs;
CREATE POLICY "Admins can update audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add UPDATE policy for user_roles (already exists but ensure it's there)
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add SELECT policy for audit_logs if it doesn't exist
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Add DELETE policy for audit_logs (for future cleanup)
DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.audit_logs;
CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure profiles table has UPDATE policy for users to save their name
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add admins can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
