
-- Add company_info and precision_score to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS precision_score integer DEFAULT 10;

-- Create onboarding-docs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-docs', 'onboarding-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload to their own folder
CREATE POLICY "Users can upload own onboarding docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'onboarding-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can view their own docs
CREATE POLICY "Users can view own onboarding docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: users can delete their own docs
CREATE POLICY "Users can delete own onboarding docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'onboarding-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
