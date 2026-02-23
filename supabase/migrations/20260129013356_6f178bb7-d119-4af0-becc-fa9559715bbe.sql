-- Storage 버킷 생성: 제품 라벨 이미지용
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-labels', 'product-labels', false);

-- Storage 버킷 생성: 회사 로고용
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Storage 버킷 생성: 공유 패키지용
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-packages', 'shared-packages', true);

-- product-labels 버킷 정책: 인증된 사용자만 자신의 파일 접근
CREATE POLICY "Users can upload own label images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-labels' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own label images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-labels' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own label images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-labels' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- company-logos 버킷 정책: 공개 읽기, 인증된 사용자만 업로드
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload own company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- shared-packages 버킷 정책: 공개 읽기
CREATE POLICY "Anyone can view shared packages"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-packages');

CREATE POLICY "Users can upload shared packages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shared-packages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);