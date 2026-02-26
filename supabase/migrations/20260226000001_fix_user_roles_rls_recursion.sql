-- =====================================================
-- user_roles RLS 무한 재귀 완전 수정
-- 원인: policy가 user_roles를 조회하여 권한 확인 →
--       user_roles 조회 시 다시 policy 발동 → 무한루프
-- 해결: security definer 함수로 RLS 우회
-- =====================================================

-- 1. 기존 user_roles 정책 전부 삭제
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Deny direct role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
-- 이름이 다를 수 있으므로 모든 정책 삭제
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'user_roles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.policyname);
  END LOOP;
END $$;

-- 2. RLS 비활성화 후 재활성화 (초기화)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. 무한 재귀 없는 안전한 역할 확인 함수 생성
--    SECURITY DEFINER = RLS를 우회하여 직접 조회 (재귀 방지)
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id
  LIMIT 1;
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- 4. 새로운 안전한 RLS 정책 생성
--    (user_roles를 직접 조회하지 않고 함수 사용)

-- 본인 행은 항상 조회 가능
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- admin만 전체 조회 가능 (함수로 재귀 방지)
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 본인 행 insert (초기 등록)
CREATE POLICY "user_roles_insert_own"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- admin만 update/delete 가능
CREATE POLICY "user_roles_update_admin"
  ON public.user_roles
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles
  FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Edge Function용 service_role은 RLS 자동 우회 (별도 설정 불필요)

-- 6. 기존 코드에서 user_roles 조회하는 뷰/함수도 수정
--    is_admin 체크 함수가 있으면 재귀 없이 수정
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$;
