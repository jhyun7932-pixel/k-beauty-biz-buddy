-- companies.user_id UNIQUE 제약 확실히 보장
-- 이전 마이그레이션에서 이미 추가되었을 수 있으므로 IF NOT EXISTS 사용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname IN ('companies_user_id_key','companies_user_id_unique')
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS companies_user_id_idx ON companies(user_id);
