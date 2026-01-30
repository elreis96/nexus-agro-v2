-- Fix overly permissive INSERT policy
-- Remove the permissive policy and replace with a proper one

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Only authenticated users with admin role OR the system itself can insert
-- For edge functions, we'll use service_role which bypasses RLS entirely
-- So we only need the admin policy for manual insertions
-- The previous admin policy already handles this case