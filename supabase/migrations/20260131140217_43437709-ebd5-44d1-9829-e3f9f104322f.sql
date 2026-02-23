-- Add unique constraint on workspace_id for onboarding_context to allow upsert
ALTER TABLE public.onboarding_context ADD CONSTRAINT onboarding_context_workspace_id_unique UNIQUE (workspace_id);

-- Also add unique constraint for user_id if we need to use upsert by user
ALTER TABLE public.onboarding_context ADD CONSTRAINT onboarding_context_user_id_unique UNIQUE (user_id);