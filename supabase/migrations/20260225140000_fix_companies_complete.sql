-- companies 테이블 컬럼 정규화
-- SettingsPage ↔ fetchUserContext ↔ AI 시스템 프롬프트 완벽 일치

-- 1) 새 컬럼 추가 (이미 존재하는 컬럼은 IF NOT EXISTS로 안전 처리)
DO $$ BEGIN
  -- company_name: 영문 사명 (기존 name 컬럼 대체)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='company_name') THEN
    ALTER TABLE public.companies ADD COLUMN company_name TEXT;
  END IF;

  -- company_name_ko: 한글 사명 (기존 company_name_kr → ko로 통일)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='company_name_ko') THEN
    ALTER TABLE public.companies ADD COLUMN company_name_ko TEXT;
  END IF;

  -- representative: 대표자명
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='representative') THEN
    ALTER TABLE public.companies ADD COLUMN representative TEXT;
  END IF;

  -- contact_name: 담당자명
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='contact_name') THEN
    ALTER TABLE public.companies ADD COLUMN contact_name TEXT;
  END IF;

  -- contact_title: 담당자 직급
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='contact_title') THEN
    ALTER TABLE public.companies ADD COLUMN contact_title TEXT;
  END IF;

  -- contact_phone 이미 존재할 수 있음
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='contact_phone') THEN
    ALTER TABLE public.companies ADD COLUMN contact_phone TEXT;
  END IF;

  -- contact_email 이미 존재할 수 있음
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='contact_email') THEN
    ALTER TABLE public.companies ADD COLUMN contact_email TEXT;
  END IF;

  -- email_signature: 이메일 서명 텍스트
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='email_signature') THEN
    ALTER TABLE public.companies ADD COLUMN email_signature TEXT;
  END IF;

  -- export_countries: 수출 대상국 배열
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='export_countries') THEN
    ALTER TABLE public.companies ADD COLUMN export_countries TEXT[] DEFAULT '{}';
  END IF;

  -- seal_url: 직인 이미지
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='seal_url') THEN
    ALTER TABLE public.companies ADD COLUMN seal_url TEXT;
  END IF;

  -- signature_url: 서명 이미지
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='signature_url') THEN
    ALTER TABLE public.companies ADD COLUMN signature_url TEXT;
  END IF;
END $$;

-- 2) 기존 name 값 → company_name 으로 복사 (컬럼 존재 시에만)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='name') THEN
    UPDATE public.companies
    SET company_name = name
    WHERE company_name IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- 3) 기존 company_name_kr → company_name_ko 로 복사 (컬럼 존재 시에만)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='company_name_kr') THEN
    UPDATE public.companies
    SET company_name_ko = company_name_kr
    WHERE company_name_ko IS NULL AND company_name_kr IS NOT NULL;
  END IF;
END $$;

-- 4) user_id UNIQUE 제약 (이전 마이그레이션과 중복 방지)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_unique'
  ) THEN
    -- 중복 데이터 정리 (최신 row만 유지)
    DELETE FROM public.companies a
    USING public.companies b
    WHERE a.user_id = b.user_id
      AND a.created_at < b.created_at;

    ALTER TABLE public.companies
      ADD CONSTRAINT companies_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
