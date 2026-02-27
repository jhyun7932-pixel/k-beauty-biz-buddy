-- companies 테이블 완전 재구성 (누락 컬럼 전체 보완)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS tel TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS business_no TEXT,
  ADD COLUMN IF NOT EXISTS ceo_name TEXT,
  ADD COLUMN IF NOT EXISTS customs_code TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS seal_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- UNIQUE 제약
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_user_id_key'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- RLS 활성화
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (없으면 추가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'companies' AND policyname = 'Users can manage own company'
  ) THEN
    CREATE POLICY "Users can manage own company"
    ON companies FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 스키마 캐시 강제 리프레시
NOTIFY pgrst, 'reload schema';
