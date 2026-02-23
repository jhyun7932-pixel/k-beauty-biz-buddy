-- ============================================================
-- Fix: products 테이블 company_id NOT NULL 제약 해제
-- ============================================================
-- 문제:
--   database_setup.sql에 company_id NOT NULL이 정의되어 있어
--   프론트엔드에서 company_id 없이 INSERT 시 실패함.
--   (buyers와 동일한 구조적 문제)
-- 해결:
--   company_id를 nullable로 변경.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'products'
      AND column_name  = 'company_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN company_id DROP NOT NULL;
    RAISE NOTICE 'products.company_id: NOT NULL 제약 제거 완료';
  ELSE
    RAISE NOTICE 'products.company_id: NOT NULL 제약 없음 (변경 불필요)';
  END IF;
END;
$$;
