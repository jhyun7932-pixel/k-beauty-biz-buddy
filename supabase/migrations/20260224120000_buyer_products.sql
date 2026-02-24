-- ============================================================
-- Migration: buyer_products 연결 테이블 생성
--            buyers 테이블에 channel_type, payment_terms, currency 컬럼 추가
-- Date: 2026-02-24
-- ============================================================

-- 1. buyers 테이블에 신규 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE buyers
  ADD COLUMN IF NOT EXISTS channel_type TEXT CHECK (channel_type IN ('online', 'offline', 'wholesale', 'direct')),
  ADD COLUMN IF NOT EXISTS payment_terms TEXT CHECK (payment_terms IN ('tt', 'lc', 'other')),
  ADD COLUMN IF NOT EXISTS currency TEXT CHECK (currency IN ('USD', 'EUR', 'JPY', 'CNY', 'KRW'));

-- 2. buyer_products 연결 테이블 생성
CREATE TABLE IF NOT EXISTS buyer_products (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_price DECIMAL(10, 2),          -- 바이어별 특별 단가 (nullable)
  moq          INTEGER,                 -- 최소주문수량 (nullable)
  status       TEXT NOT NULL DEFAULT 'offering'
               CHECK (status IN ('offering', 'negotiating', 'contracted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)          -- 동일 바이어-제품 쌍은 1개만
);

-- 3. RLS 활성화
ALTER TABLE buyer_products ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
CREATE POLICY "Users can view own buyer_products"
  ON buyer_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buyer_products"
  ON buyer_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own buyer_products"
  ON buyer_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own buyer_products"
  ON buyer_products FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_buyer_products_buyer_id   ON buyer_products(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_products_product_id ON buyer_products(product_id);
CREATE INDEX IF NOT EXISTS idx_buyer_products_user_id    ON buyer_products(user_id);
