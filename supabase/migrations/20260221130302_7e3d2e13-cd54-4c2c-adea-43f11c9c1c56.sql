
-- Fix the overly permissive INSERT policy - only allow inserts where user_id matches auth.uid() or from trigger (security definer)
DROP POLICY "System can insert notifications" ON public.notifications;

-- Since the trigger runs as SECURITY DEFINER it bypasses RLS, so we can restrict client inserts
CREATE POLICY "Users can insert own notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
