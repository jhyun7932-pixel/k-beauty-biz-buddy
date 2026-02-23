-- ============================================================
-- Fix: buyers 테이블 RLS INSERT 정책 명시화 + 제약 조건 안전 처리
-- ============================================================
-- 문제:
--   1. 기존 "FOR ALL USING" 정책은 INSERT의 WITH CHECK를 암묵적으로 처리하므로
--      일부 Supabase 환경에서 INSERT를 차단할 수 있음.
--   2. database_setup.sql에 company_id NOT NULL, company_name NOT NULL이
--      정의되어 있어 해당 컬럼이 실제 DB에 NOT NULL로 존재할 경우
--      프론트에서 company_id를 보내지 않아 INSERT가 실패함.
-- 해결:
--   1. 기존 'FOR ALL' 정책을 제거하고 작업별(SELECT/INSERT/UPDATE/DELETE)
--      정책을 명시적으로 분리 생성.
--   2. company_id, company_name의 NOT NULL 제약이 있을 경우 nullable로 변경.
-- ============================================================

-- ── 1. company_id / company_name NOT NULL 제약 해제 (존재할 경우에만 적용)
-- company_id가 NOT NULL이면 nullable로 변경
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'buyers'
      AND column_name  = 'company_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.buyers ALTER COLUMN company_id DROP NOT NULL;
    RAISE NOTICE 'buyers.company_id: NOT NULL 제약 제거 완료';
  ELSE
    RAISE NOTICE 'buyers.company_id: NOT NULL 제약 없음 (변경 불필요)';
  END IF;
END;
$$;

-- company_name NOT NULL 제약 해제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'buyers'
      AND column_name  = 'company_name'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.buyers ALTER COLUMN company_name DROP NOT NULL;
    RAISE NOTICE 'buyers.company_name: NOT NULL 제약 제거 완료';
  ELSE
    RAISE NOTICE 'buyers.company_name: NOT NULL 제약 없음 (변경 불필요)';
  END IF;
END;
$$;

-- ── 2. 기존 buyers RLS 정책 전부 제거 후 명시적 4-policy 방식으로 재생성
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 (이름이 다를 수 있으므로 가능한 모든 이름 DROP)
DROP POLICY IF EXISTS "Users can CRUD own buyers"        ON public.buyers;
DROP POLICY IF EXISTS "buyers: 본인 데이터 전체 접근"    ON public.buyers;
DROP POLICY IF EXISTS "buyers: 어드민 전체 조회"         ON public.buyers;

-- SELECT: 본인 데이터만 조회
CREATE POLICY "buyers: 본인 SELECT"
  ON public.buyers FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user_id가 로그인한 유저와 일치할 때만 허용
CREATE POLICY "buyers: 본인 INSERT"
  ON public.buyers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 본인 데이터만 수정
CREATE POLICY "buyers: 본인 UPDATE"
  ON public.buyers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 본인 데이터만 삭제
CREATE POLICY "buyers: 본인 DELETE"
  ON public.buyers FOR DELETE
  USING (auth.uid() = user_id);

-- Admin 전체 조회 (선택사항)
CREATE POLICY "buyers: 어드민 SELECT"
  ON public.buyers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
