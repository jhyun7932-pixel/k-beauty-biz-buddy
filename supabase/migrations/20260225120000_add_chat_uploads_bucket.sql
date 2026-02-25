-- chat-uploads 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-uploads',
  'chat-uploads',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: 유저별 폴더 격리 (업로드)
CREATE POLICY "Users can upload to their folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: 유저별 폴더 격리 (읽기)
CREATE POLICY "Users can read their uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role도 접근 가능 (Edge Function에서 사용)
CREATE POLICY "Service role full access to chat-uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'chat-uploads'
    AND auth.role() = 'service_role'
  );
