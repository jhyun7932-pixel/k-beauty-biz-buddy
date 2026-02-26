-- companies 테이블 누락 컬럼 보완
-- phone, email, bank_info, certifications 추가

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS bank_info JSONB,
  ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';

-- user_id unique 제약 확인 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname IN ('companies_user_id_key', 'companies_user_id_unique')
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- RLS 정책 확인
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_insert_own" ON public.companies;
DROP POLICY IF EXISTS "companies_update_own" ON public.companies;
DROP POLICY IF EXISTS "companies_delete_own" ON public.companies;

CREATE POLICY "companies_select_own" ON public.companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "companies_insert_own" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companies_update_own" ON public.companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "companies_delete_own" ON public.companies
  FOR DELETE USING (auth.uid() = user_id);
