-- Add UPDATE policies for product-labels and onboarding-docs storage buckets

-- product-labels: allow users to update their own files
CREATE POLICY "Users can update own label images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-labels'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- onboarding-docs: allow users to update their own files
CREATE POLICY "Users can update own onboarding docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'onboarding-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);