-- companies.user_id에 UNIQUE 제약 추가 (1 user = 1 company)
-- SettingsPage upsert 및 fetchUserContext 정확성 보장

-- 기존 중복 데이터 정리 (가장 최신 row만 남김)
DELETE FROM public.companies a
USING public.companies b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- UNIQUE 제약 추가
ALTER TABLE public.companies
  ADD CONSTRAINT companies_user_id_unique UNIQUE (user_id);
