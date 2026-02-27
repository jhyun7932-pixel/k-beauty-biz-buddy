-- companies 테이블 누락 컬럼 전체 추가
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_no TEXT,
  ADD COLUMN IF NOT EXISTS ceo_name TEXT,
  ADD COLUMN IF NOT EXISTS customs_code TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS seal_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}';

-- user_id UNIQUE 제약 (없으면 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'companies'
    AND constraint_name = 'companies_user_id_key'
  ) THEN
    ALTER TABLE companies
    ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Supabase 스키마 캐시 리프레시
NOTIFY pgrst, 'reload schema';
