-- ================================================================
-- Fix: RLS 무한 재귀(42P17) + has_role 함수 없음(42883) 완전 수정
-- ================================================================
-- 배경:
--   live DB는 database_setup.sql로 구성됨.
--   - profiles.role 컬럼에 역할 직접 저장 (별도 user_roles 테이블 없음)
--   - has_role() 함수가 정의되지 않았음
--
-- 원인 1 (42883): has_role() 함수 미존재
-- 원인 2 (42P17): profiles 테이블 어드민 정책이 profiles 자신을 재귀 조회
--
--   CREATE POLICY "profiles: 어드민 전체 조회" ON public.profiles
--     FOR SELECT USING (
--       EXISTS (SELECT 1 FROM public.profiles p   <-- profiles가 profiles를 조회!
--               WHERE p.id = auth.uid() AND p.role = 'admin')
--     );
--
-- 해결:
--   Step 1. SECURITY DEFINER 함수 has_role() 생성
--           → 함수 내부는 RLS를 우회하므로 재귀 없음
--   Step 2. 모든 테이블의 어드민 정책을 has_role() 사용으로 교체
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- STEP 1: has_role() 함수 생성
--   SECURITY DEFINER = 함수 소유자(postgres) 권한으로 실행
--                      → RLS 완전 우회 → 재귀 불가
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;


-- ════════════════════════════════════════════════════════════════
-- STEP 2: 재귀를 유발하는 어드민 정책 전부 교체
-- ════════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────
-- 핵심 원인: 이 정책이 profiles 안에서 profiles를 재조회
DROP POLICY IF EXISTS "profiles: 어드민 전체 조회"  ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "profiles: 어드민 전체 조회"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── companies ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies: 어드민 전체 조회"  ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;

CREATE POLICY "companies: 어드민 전체 조회"
  ON public.companies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── products ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products: 어드민 전체 조회"  ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

CREATE POLICY "products: 어드민 전체 조회"
  ON public.products FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── buyers ───────────────────────────────────────────────────────
-- 이전 마이그레이션(20260222000000)에서 추가된 정책 포함 전부 제거
DROP POLICY IF EXISTS "buyers: 어드민 전체 조회"  ON public.buyers;
DROP POLICY IF EXISTS "buyers: 어드민 SELECT"    ON public.buyers;
DROP POLICY IF EXISTS "Admins can view all buyers" ON public.buyers;

CREATE POLICY "buyers: 어드민 SELECT"
  ON public.buyers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── deals ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "deals: 어드민 전체 조회"  ON public.deals;
DROP POLICY IF EXISTS "deals: 어드민 SELECT"    ON public.deals;
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;

CREATE POLICY "deals: 어드민 SELECT"
  ON public.deals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── documents ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "documents: 어드민 전체 조회"  ON public.documents;
DROP POLICY IF EXISTS "documents: 어드민 SELECT"    ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;

CREATE POLICY "documents: 어드민 SELECT"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── compliance_rules ─────────────────────────────────────────────
DROP POLICY IF EXISTS "compliance_rules: 어드민만 수정"   ON public.compliance_rules;
DROP POLICY IF EXISTS "Admins can manage compliance rules" ON public.compliance_rules;

CREATE POLICY "compliance_rules: 어드민만 수정"
  ON public.compliance_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
