-- companies 테이블에 관세부호, 대표자명, 로고/직인 URL 컬럼 추가
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS customs_code TEXT,
ADD COLUMN IF NOT EXISTS ceo_name TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS seal_url TEXT;
