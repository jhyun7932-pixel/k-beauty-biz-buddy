-- 기존 companies 테이블 완전 재설계
-- 1. 기존 테이블 백업 후 재생성
DROP TABLE IF EXISTS companies CASCADE;

CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- 기본 정보
  company_name TEXT NOT NULL DEFAULT '',
  ceo_name TEXT DEFAULT '',
  business_no TEXT DEFAULT '',
  customs_code TEXT DEFAULT '',
  address TEXT DEFAULT '',

  -- 연락처
  contact_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  tel TEXT DEFAULT '',

  -- 은행 정보 (JSONB)
  bank_info JSONB DEFAULT '{"bank_name":"","account_no":"","swift_code":""}',

  -- 이미지
  logo_url TEXT DEFAULT '',
  seal_url TEXT DEFAULT '',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own company"
ON companies FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_companies_user_id ON companies(user_id);

-- 스키마 캐시 리프레시
NOTIFY pgrst, 'reload schema';
