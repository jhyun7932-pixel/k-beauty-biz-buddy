-- =============================================================================
-- FLONIX (플로닉스) — Supabase Database Setup Script
-- K-Beauty B2B SaaS Export Platform
-- =============================================================================
-- 사용법: Supabase 대시보드 > SQL 편집기에 전체 내용을 붙여넣고 실행하세요.
-- 멱등성(Idempotent): 이미 존재하는 객체는 충돌 없이 건너뜁니다.
--                     몇 번을 실행해도 동일한 결과가 보장됩니다.
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 유사도 검색 (바이어/제품 검색)


-- =============================================================================
-- 1. ENUM TYPES (열거형 타입)
-- =============================================================================
-- CREATE TYPE 은 IF NOT EXISTS를 지원하지 않으므로
-- 예외 처리 블록으로 이미 존재하는 경우 건너뜁니다.
-- =============================================================================

-- 사용자 역할: 일반 사용자 | 관리자 | 파트너(전문가)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('user', 'admin', 'partner');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "app_role" already exists, skipping.';
END $$;

-- 제조 유형: ODM | OEM | 자체 브랜드
DO $$ BEGIN
  CREATE TYPE manufacturing_type AS ENUM ('odm', 'oem', 'own_brand');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "manufacturing_type" already exists, skipping.';
END $$;

-- 바이어 유형: 수입업자 | 유통사 | 리테일러 | 시장 판매자
DO $$ BEGIN
  CREATE TYPE buyer_type AS ENUM ('importer', 'distributor', 'retailer', 'market_seller');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "buyer_type" already exists, skipping.';
END $$;

-- 판매 채널: 도매 | 오프라인 리테일 | 온라인 마켓플레이스 | D2C
DO $$ BEGIN
  CREATE TYPE sales_channel AS ENUM ('wholesale', 'offline_retail', 'online_marketplace', 'd2c');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "sales_channel" already exists, skipping.';
END $$;

-- 무역 단계: 첫 제안 | 샘플 | 본 오더 | 재오더
DO $$ BEGIN
  CREATE TYPE trade_stage AS ENUM ('first_proposal', 'sample', 'main_order', 'reorder');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "trade_stage" already exists, skipping.';
END $$;

-- 딜 진행 단계 (7단계 CRM 파이프라인)
DO $$ BEGIN
  CREATE TYPE deal_status_stage AS ENUM (
    'lead',         -- 잠재 바이어
    'contacted',    -- 연락 완료
    'replied',      -- 회신 받음
    'sample',       -- 샘플 진행 중
    'negotiation',  -- 협상 중
    'won',          -- 성사
    'lost'          -- 실패
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "deal_status_stage" already exists, skipping.';
END $$;

-- 문서 유형
DO $$ BEGIN
  CREATE TYPE doc_type AS ENUM (
    'onepager',              -- 브랜드 원페이저
    'catalog',               -- 제품 카탈로그
    'compliance_snapshot',   -- 규제 컴플라이언스 보고서
    'deal_sheet',            -- 딜 시트
    'pi',                    -- Proforma Invoice
    'contract',              -- 판매 계약서
    'commercial_invoice',    -- 상업 인보이스
    'packing_list',          -- 패킹 리스트
    'email_pack',            -- 이메일 패키지
    'shipping_instructions', -- 선적 지시서
    'expert_request'         -- 전문가 요청서
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "doc_type" already exists, skipping.';
END $$;

-- 문서 상태
DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM (
    'draft',   -- 초안
    'edited',  -- 편집됨
    'final',   -- 확정
    'sent'     -- 발송됨
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "doc_status" already exists, skipping.';
END $$;

-- 문서 내보내기 포맷
DO $$ BEGIN
  CREATE TYPE doc_format AS ENUM ('pdf', 'docx', 'md', 'html');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "doc_format" already exists, skipping.';
END $$;

-- 바이어 인터랙션 유형
DO $$ BEGIN
  CREATE TYPE interaction_type AS ENUM ('email', 'call', 'meeting', 'chat');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "interaction_type" already exists, skipping.';
END $$;

-- 컴플라이언스 신호등
DO $$ BEGIN
  CREATE TYPE compliance_traffic_light AS ENUM ('green', 'yellow', 'red');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "compliance_traffic_light" already exists, skipping.';
END $$;

-- AI 에이전트 메모리 유형
DO $$ BEGIN
  CREATE TYPE memory_type AS ENUM (
    'preference',     -- 사용자 선호도
    'template_param', -- 템플릿 파라미터
    'risk_policy',    -- 리스크 정책
    'tone_rule'       -- 톤앤매너 규칙
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "memory_type" already exists, skipping.';
END $$;

-- 전문가 연결 요청 상태
DO $$ BEGIN
  CREATE TYPE expert_request_status AS ENUM (
    'pending',     -- 대기 중
    'accepted',    -- 수락됨
    'in_progress', -- 진행 중
    'completed',   -- 완료
    'declined'     -- 거절됨
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'type "expert_request_status" already exists, skipping.';
END $$;


-- =============================================================================
-- 2. HELPER FUNCTION: updated_at 자동 갱신 트리거 함수
-- =============================================================================
-- CREATE OR REPLACE FUNCTION 은 기본적으로 멱등성을 지원합니다.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 3. CORE TABLES (핵심 테이블)
-- =============================================================================
-- CREATE TABLE IF NOT EXISTS 는 기본적으로 멱등성을 지원합니다.
-- CREATE TRIGGER 는 지원하지 않으므로 DROP TRIGGER IF EXISTS 를 먼저 실행합니다.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3-1. PROFILES — 사용자 프로필 (auth.users와 1:1 연결)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  avatar_url    TEXT,
  role          app_role NOT NULL DEFAULT 'user',
  language      TEXT NOT NULL DEFAULT 'ko',      -- 선호 언어 (ko | en | ja | zh)
  timezone      TEXT NOT NULL DEFAULT 'Asia/Seoul',
  is_onboarded  BOOLEAN NOT NULL DEFAULT FALSE,   -- 온보딩 완료 여부
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS '사용자 프로필. auth.users와 1:1 연결됩니다.';

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 신규 사용자 가입 시 profiles 행 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING; -- 이미 존재하면 건너뜁니다
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE OR REPLACE TRIGGER 은 PostgreSQL 14+ 에서 지원 (Supabase ✓)
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 3-2. COMPANIES — 수출기업 프로필 (워크스페이스)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보
  name                  TEXT NOT NULL,                   -- 영문 회사명
  name_kr               TEXT,                            -- 한글 회사명
  contact_email         TEXT,
  contact_phone         TEXT,
  address               TEXT,
  website               TEXT,
  logo_url              TEXT,                            -- Supabase Storage URL

  -- 제조 정보
  manufacturing_type    manufacturing_type,
  main_category         TEXT,                            -- 주요 제품 카테고리
  certifications        JSONB DEFAULT '[]'::JSONB,       -- [{"name":"ISO22716","year":2023}]

  -- 무역 기본값 (문서 자동 완성에 사용)
  default_moq           INTEGER,                         -- 최소 주문 수량
  default_lead_time     TEXT,                            -- 리드타임 (예: "45 days")
  default_incoterms     TEXT DEFAULT 'FOB',              -- 인코텀즈
  default_payment_terms TEXT DEFAULT '30% T/T in advance, 70% before shipment',

  -- 은행 정보 (인보이스 자동 완성)
  bank_name             TEXT,
  bank_account          TEXT,
  bank_swift            TEXT,
  bank_beneficiary      TEXT,
  bank_address          TEXT,

  -- AI 어시스턴트 설정
  banned_claim_phrases  JSONB DEFAULT '[]'::JSONB,       -- 사용 금지 문구 목록
  tone_style            JSONB DEFAULT '{}'::JSONB,       -- {"formal":true,"language":"en"}

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS '수출기업의 워크스페이스. 문서 자동완성의 기준 데이터입니다.';

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);


-- ---------------------------------------------------------------------------
-- 3-3. PRODUCTS — 제품 카탈로그 (SKU 단위)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 제품 기본 정보
  name_en               TEXT NOT NULL,               -- 영문 제품명
  name_kr               TEXT,                        -- 한글 제품명
  category              TEXT,                        -- 카테고리 (예: Serum, Toner)
  sku_code              TEXT,                        -- SKU 코드
  hs_code               TEXT,                        -- HS 코드
  size_ml_g             NUMERIC,                     -- 용량 (ml 또는 g)
  packaging_type        TEXT,                        -- 패키징 유형 (예: Bottle, Tube)

  -- 가격 및 무역 조건
  unit_price_range      JSONB DEFAULT '{}'::JSONB,   -- {"usd":{"min":5,"max":8},"krw":{"min":6500}}
  moq                   INTEGER,
  lead_time             TEXT,

  -- 원료 정보
  ingredients_raw       TEXT,                        -- OCR 원본 텍스트
  ingredients_confirmed JSONB DEFAULT '[]'::JSONB,   -- [{"name":"Niacinamide","percent":5}]
  function_claims       JSONB DEFAULT '[]'::JSONB,   -- ["Brightening","Anti-aging"]

  -- 라벨 이미지
  label_images          JSONB DEFAULT '[]'::JSONB,   -- [{"url":"...","side":"front"}]

  -- 상태
  status                TEXT NOT NULL DEFAULT 'active', -- active | archived
  compliance_summary    JSONB DEFAULT '{}'::JSONB,   -- {"US":"green","JP":"yellow"}

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.products IS 'SKU 단위 제품 정보. 원료, 가격, 컴플라이언스 현황을 포함합니다.';

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku_code);


-- ---------------------------------------------------------------------------
-- 3-4. PRODUCT_INGREDIENTS — 원료 OCR 및 INCI 매핑 상세
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  raw_ocr_text          TEXT,                        -- OCR 원본
  cleaned_list          JSONB DEFAULT '[]'::JSONB,   -- 정리된 원료 목록
  inci_mapped_list      JSONB DEFAULT '[]'::JSONB,   -- INCI 명칭으로 매핑된 목록
  -- [{"raw":"녹차추출물","inci":"Camellia Sinensis Leaf Extract","cas":"84650-60-2"}]

  ocr_source            TEXT,                        -- 이미지 URL 또는 'manual'
  mapped_at             TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_product_ingredients_updated_at ON public.product_ingredients;
CREATE TRIGGER trg_product_ingredients_updated_at
  BEFORE UPDATE ON public.product_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_prod_ing_product_id ON public.product_ingredients(product_id);


-- ---------------------------------------------------------------------------
-- 3-5. PRODUCT_LABELS — 라벨 이미지 및 추출 텍스트
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_labels (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  label_image_url       TEXT NOT NULL,               -- Supabase Storage URL
  label_side            TEXT DEFAULT 'front',        -- front | back | side
  extracted_text        TEXT,                        -- OCR 추출 텍스트
  risk_flags            JSONB DEFAULT '[]'::JSONB,   -- [{"phrase":"whitening","severity":"high"}]
  draft_by_country      JSONB DEFAULT '{}'::JSONB,   -- {"US":"...draft text...","JP":"..."}
  extraction_status     TEXT DEFAULT 'pending',      -- pending | processing | done | error

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_product_labels_updated_at ON public.product_labels;
CREATE TRIGGER trg_product_labels_updated_at
  BEFORE UPDATE ON public.product_labels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_prod_labels_product_id ON public.product_labels(product_id);


-- ---------------------------------------------------------------------------
-- 3-6. BUYERS — 바이어 CRM
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 바이어 기본 정보
  company_name          TEXT NOT NULL,
  contact_name          TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  country               TEXT NOT NULL,               -- ISO 2자리 코드 (예: US, JP, CN)
  website               TEXT,
  notes                 TEXT,

  -- 세그멘테이션
  buyer_type            buyer_type,
  channel               sales_channel,
  channel_focus         TEXT,                        -- 세부 채널 메모

  -- 선호 정보
  preferred_language    TEXT DEFAULT 'en',
  target_category       TEXT,
  target_price_range    JSONB DEFAULT '{}'::JSONB,   -- {"usd":{"min":3,"max":10}}
  margin_expectation    NUMERIC,                     -- 기대 마진율 (%)

  -- CRM 상태
  status_stage          deal_status_stage DEFAULT 'lead',
  rating                SMALLINT CHECK (rating BETWEEN 1 AND 5),
  next_follow_up_date   DATE,
  last_contacted_at     TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.buyers IS '바이어 CRM. 국가, 채널, 바이어 유형, 팔로업 일정을 관리합니다.';

DROP TRIGGER IF EXISTS trg_buyers_updated_at ON public.buyers;
CREATE TRIGGER trg_buyers_updated_at
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_buyers_company_id ON public.buyers(company_id);
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON public.buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_country ON public.buyers(country);
CREATE INDEX IF NOT EXISTS idx_buyers_status_stage ON public.buyers(status_stage);
CREATE INDEX IF NOT EXISTS idx_buyers_follow_up ON public.buyers(next_follow_up_date);


-- ---------------------------------------------------------------------------
-- 3-7. BUYER_INTERACTIONS — 바이어 인터랙션 이력
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buyer_interactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id              UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  interaction_type      interaction_type NOT NULL,
  subject               TEXT,
  message_snippet       TEXT,                        -- 이메일/메시지 미리보기
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 이메일 추적
  opened                BOOLEAN DEFAULT FALSE,
  replied               BOOLEAN DEFAULT FALSE,
  next_follow_up_date   DATE,

  -- 연결된 거래 (deals 테이블 생성 후 FK가 추가됩니다)
  deal_id               UUID,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.buyer_interactions IS '바이어와의 이메일, 통화, 미팅 이력을 기록합니다.';

CREATE INDEX IF NOT EXISTS idx_interactions_buyer_id ON public.buyer_interactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.buyer_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_sent_at ON public.buyer_interactions(sent_at DESC);


-- ---------------------------------------------------------------------------
-- 3-8. DEALS — 수출 프로젝트 (딜)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  buyer_id              UUID NOT NULL REFERENCES public.buyers(id) ON DELETE SET NULL,
  product_id            UUID REFERENCES public.products(id) ON DELETE SET NULL,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 딜 기본 정보
  title                 TEXT,                        -- 딜 제목 (자동 생성 또는 입력)
  trade_stage           trade_stage DEFAULT 'first_proposal',
  status_stage          deal_status_stage DEFAULT 'lead',

  -- 가격 및 무역 조건
  quantity              INTEGER,
  unit_price            NUMERIC(12, 4),
  total_amount          NUMERIC(14, 2),
  currency              TEXT DEFAULT 'USD',
  incoterms             TEXT DEFAULT 'FOB',
  payment_terms         TEXT,
  lead_time             TEXT,
  validity_days         INTEGER DEFAULT 30,          -- 견적 유효 기간

  -- 연결된 문서
  doc_refs              JSONB DEFAULT '[]'::JSONB,   -- [{"doc_id":"...","type":"pi"}]

  notes                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.deals IS '수출 프로젝트(딜). 바이어-제품을 연결하고 거래 조건과 연관 문서를 관리합니다.';

DROP TRIGGER IF EXISTS trg_deals_updated_at ON public.deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON public.deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_product_id ON public.deals(product_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status_stage ON public.deals(status_stage);

-- buyer_interactions.deal_id → deals FK (deals 테이블 생성 후 안전하게 추가)
DO $$ BEGIN
  ALTER TABLE public.buyer_interactions
    ADD CONSTRAINT fk_interactions_deal
    FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'constraint "fk_interactions_deal" already exists, skipping.';
END $$;


-- ---------------------------------------------------------------------------
-- 3-9. DOCUMENTS — 무역 서류
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_id               UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  buyer_id              UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  product_id            UUID REFERENCES public.products(id) ON DELETE SET NULL,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 문서 기본 정보
  title                 TEXT NOT NULL,
  doc_type              doc_type NOT NULL,
  doc_status            doc_status NOT NULL DEFAULT 'draft',
  doc_format            doc_format DEFAULT 'pdf',
  version               INTEGER NOT NULL DEFAULT 1,

  -- 문서 내용
  content               TEXT,                        -- 최종 렌더링 텍스트 또는 HTML
  content_md            TEXT,                        -- Markdown 원본
  metadata              JSONB DEFAULT '{}'::JSONB,   -- 구조화된 필드값 {"buyer_name":"..."}
  source_context        JSONB DEFAULT '{}'::JSONB,   -- AI 생성 컨텍스트 스냅샷

  -- AI 생성 정보
  generated_by          TEXT DEFAULT 'user',         -- 'user' | 'ai' | 'template'
  generation_prompt     TEXT,                        -- 사용된 프롬프트 (디버깅용)

  -- 공유 링크
  share_token           TEXT UNIQUE,                 -- 외부 공유용 토큰
  share_expires_at      TIMESTAMPTZ,
  share_view_count      INTEGER DEFAULT 0,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS '모든 무역 서류(PI, 계약서, 인보이스 등). 버전관리 및 공유 링크를 지원합니다.';

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_deal_id ON public.documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_documents_buyer_id ON public.documents(buyer_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON public.documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON public.documents(share_token)
  WHERE share_token IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 3-10. COMPLIANCE_RULES — 국가별 규제 룰팩
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 국가 정보
  country_code            TEXT NOT NULL,               -- ISO 2자리 코드 (US, JP, CN 등)
  country_name            TEXT NOT NULL,

  -- 규제 기관 정보
  regulatory_body         TEXT,                        -- 예: FDA, KFDA, PMDA
  key_regulation          TEXT,                        -- 예: 21 CFR Part 700

  -- 원료 규제
  banned_ingredients      JSONB DEFAULT '[]'::JSONB,   -- ["diethylene glycol","formaldehyde"]
  restricted_ingredients  JSONB DEFAULT '[]'::JSONB,   -- [{"name":"resorcinol","limit":"0.5%"}]

  -- 라벨 요건
  label_requirements      JSONB DEFAULT '{}'::JSONB,   -- {"language":"mandatory","country_of_origin":true}
  claim_restrictions      JSONB DEFAULT '[]'::JSONB,   -- ["whitening","UV protection without SPF test"]

  -- 인증 요건
  required_certifications JSONB DEFAULT '[]'::JSONB,   -- ["CPNP","GMP"]

  -- 메타데이터
  notes                   TEXT,
  rulepack_version        TEXT DEFAULT '1.0',
  last_updated            DATE,
  is_active               BOOLEAN DEFAULT TRUE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (country_code, rulepack_version)
);

COMMENT ON TABLE public.compliance_rules IS '국가별 화장품 규제 룰팩. 금지/제한 원료, 라벨 요건, 인증 요건을 포함합니다.';

DROP TRIGGER IF EXISTS trg_compliance_rules_updated_at ON public.compliance_rules;
CREATE TRIGGER trg_compliance_rules_updated_at
  BEFORE UPDATE ON public.compliance_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_compliance_rules_country ON public.compliance_rules(country_code);


-- ---------------------------------------------------------------------------
-- 3-11. COMPLIANCE_RUNS — 제품별 컴플라이언스 검토 결과
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_runs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- 검토 범위
  target_countries      JSONB NOT NULL DEFAULT '[]'::JSONB, -- ["US","JP","CN"]

  -- 결과
  traffic_light         compliance_traffic_light NOT NULL DEFAULT 'yellow',
  export_ready_score    SMALLINT CHECK (export_ready_score BETWEEN 0 AND 100),
  findings              JSONB DEFAULT '[]'::JSONB,   -- [{"country":"US","issue":"banned ingredient X","severity":"red"}]
  next_actions          JSONB DEFAULT '[]'::JSONB,   -- [{"action":"Remove X from formula","priority":"high"}]

  -- 사용된 룰팩 버전
  rulepack_versions     JSONB DEFAULT '{}'::JSONB,   -- {"US":"1.2","JP":"1.0"}

  -- 검토 메타
  run_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_by                TEXT DEFAULT 'ai',           -- 'ai' | 'manual' | 'expert'

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.compliance_runs IS '제품의 국가별 컴플라이언스 검토 결과. 신호등(GREEN/YELLOW/RED)으로 요약됩니다.';

CREATE INDEX IF NOT EXISTS idx_compliance_runs_product_id ON public.compliance_runs(product_id);
CREATE INDEX IF NOT EXISTS idx_compliance_runs_user_id ON public.compliance_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_runs_run_at ON public.compliance_runs(run_at DESC);


-- ---------------------------------------------------------------------------
-- 3-12. AGENT_MEMORY — AI 어시스턴트 메모리
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID REFERENCES public.companies(id) ON DELETE CASCADE,

  memory_key            TEXT NOT NULL,               -- 메모리 키 (예: "default_tone", "risk_policy_US")
  memory_value          JSONB NOT NULL,              -- 저장값 (구조 자유)
  memory_type           memory_type NOT NULL,
  confidence            NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  source                TEXT DEFAULT 'user',         -- 'user' | 'ai_inferred'

  expires_at            TIMESTAMPTZ,                 -- NULL이면 영구 저장
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, memory_key)
);

COMMENT ON TABLE public.agent_memory IS 'AI 어시스턴트가 학습한 사용자 선호도, 톤앤매너, 리스크 정책을 저장합니다.';

DROP TRIGGER IF EXISTS trg_agent_memory_updated_at ON public.agent_memory;
CREATE TRIGGER trg_agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id ON public.agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON public.agent_memory(user_id, memory_key);


-- ---------------------------------------------------------------------------
-- 3-13. ONBOARDING_CONTEXT — 사용자 온보딩 설정
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_context (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- 온보딩 선택값
  target_countries      JSONB DEFAULT '[]'::JSONB,   -- ["US","JP","VN"]
  target_channel        sales_channel,
  trade_stage           trade_stage,
  buyer_type            buyer_type,
  preferred_language    TEXT DEFAULT 'ko',
  preferred_currency    TEXT DEFAULT 'USD',

  -- 추천 프리셋
  recommended_docs      JSONB DEFAULT '[]'::JSONB,   -- 추천 문서 유형 목록
  preset_name           TEXT,                        -- 선택된 프리셋 이름

  -- 온보딩 단계
  step_completed        SMALLINT DEFAULT 0,          -- 완료된 단계 수
  is_completed          BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.onboarding_context IS '사용자 온보딩 선택값. AI 추천 문서 및 프리셋 설정의 기준이 됩니다.';

DROP TRIGGER IF EXISTS trg_onboarding_updated_at ON public.onboarding_context;
CREATE TRIGGER trg_onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_context
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON public.onboarding_context(user_id);


-- ---------------------------------------------------------------------------
-- 3-14. EXPERT_CONNECTION_REQUESTS — 전문가 연결 요청
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expert_connection_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id            UUID REFERENCES public.products(id) ON DELETE SET NULL,
  deal_id               UUID REFERENCES public.deals(id) ON DELETE SET NULL,

  -- 요청 정보
  request_type          TEXT NOT NULL,               -- 'compliance' | 'logistics' | 'customs' | 'legal'
  subject               TEXT NOT NULL,
  description           TEXT,
  target_countries      JSONB DEFAULT '[]'::JSONB,
  attached_docs         JSONB DEFAULT '[]'::JSONB,   -- [{"doc_id":"...","title":"PI"}]
  priority              TEXT DEFAULT 'normal',       -- 'low' | 'normal' | 'high' | 'urgent'

  -- 처리 현황
  status                expert_request_status DEFAULT 'pending',
  assigned_partner_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_response      TEXT,
  quote_amount          NUMERIC(10, 2),
  quote_currency        TEXT DEFAULT 'USD',
  responded_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.expert_connection_requests IS '컴플라이언스/물류 전문가 연결 요청. 파트너가 응답하고 견적을 제출합니다.';

DROP TRIGGER IF EXISTS trg_expert_requests_updated_at ON public.expert_connection_requests;
CREATE TRIGGER trg_expert_requests_updated_at
  BEFORE UPDATE ON public.expert_connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_expert_req_user_id ON public.expert_connection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_req_status ON public.expert_connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_expert_req_partner ON public.expert_connection_requests(assigned_partner_id);


-- ---------------------------------------------------------------------------
-- 3-15. ACTIVITY_LOGS — 감사 로그
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id            UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- 이벤트 정보
  action                TEXT NOT NULL,               -- 'create' | 'update' | 'delete' | 'export' | 'share'
  entity_type           TEXT NOT NULL,               -- 'document' | 'deal' | 'buyer' | 'product' 등
  entity_id             UUID,
  entity_title          TEXT,                        -- 삭제 후에도 식별 가능하도록 제목 저장

  -- 변경 상세
  old_values            JSONB,
  new_values            JSONB,
  metadata              JSONB DEFAULT '{}'::JSONB,   -- 추가 컨텍스트

  ip_address            INET,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.activity_logs IS '모든 데이터 변경 이력. 감사 추적 및 디버깅에 사용됩니다.';

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_logs(created_at DESC);


-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) — 행 수준 보안
-- =============================================================================
-- 원칙: 모든 테이블에 RLS를 활성화하고, 사용자는 자신의 데이터만 CRUD 가능.
-- 어드민(admin)은 모든 데이터 조회/수정 가능.
-- 파트너(partner)는 자신에게 배정된 expert_connection_requests만 접근 가능.
--
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY 는 멱등성을 지원합니다.
-- CREATE POLICY 는 지원하지 않으므로 DROP POLICY IF EXISTS 를 먼저 실행합니다.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: 본인만 조회" ON public.profiles;
CREATE POLICY "profiles: 본인만 조회" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: 본인만 수정" ON public.profiles;
CREATE POLICY "profiles: 본인만 수정" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: 어드민 전체 조회" ON public.profiles;
CREATE POLICY "profiles: 어드민 전체 조회" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies: 본인 데이터 전체 접근" ON public.companies;
CREATE POLICY "companies: 본인 데이터 전체 접근" ON public.companies
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "companies: 어드민 전체 조회" ON public.companies;
CREATE POLICY "companies: 어드민 전체 조회" ON public.companies
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products: 본인 데이터 전체 접근" ON public.products;
CREATE POLICY "products: 본인 데이터 전체 접근" ON public.products
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products: 어드민 전체 조회" ON public.products;
CREATE POLICY "products: 어드민 전체 조회" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- product_ingredients
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_ingredients: 본인 데이터 전체 접근" ON public.product_ingredients;
CREATE POLICY "product_ingredients: 본인 데이터 전체 접근" ON public.product_ingredients
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- product_labels
-- ---------------------------------------------------------------------------
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_labels: 본인 데이터 전체 접근" ON public.product_labels;
CREATE POLICY "product_labels: 본인 데이터 전체 접근" ON public.product_labels
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- buyers
-- ---------------------------------------------------------------------------
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyers: 본인 데이터 전체 접근" ON public.buyers;
CREATE POLICY "buyers: 본인 데이터 전체 접근" ON public.buyers
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "buyers: 어드민 전체 조회" ON public.buyers;
CREATE POLICY "buyers: 어드민 전체 조회" ON public.buyers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- buyer_interactions
-- ---------------------------------------------------------------------------
ALTER TABLE public.buyer_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_interactions: 본인 데이터 전체 접근" ON public.buyer_interactions;
CREATE POLICY "buyer_interactions: 본인 데이터 전체 접근" ON public.buyer_interactions
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deals: 본인 데이터 전체 접근" ON public.deals;
CREATE POLICY "deals: 본인 데이터 전체 접근" ON public.deals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "deals: 어드민 전체 조회" ON public.deals;
CREATE POLICY "deals: 어드민 전체 조회" ON public.deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents: 본인 데이터 전체 접근" ON public.documents;
CREATE POLICY "documents: 본인 데이터 전체 접근" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "documents: 공유 토큰으로 조회 (비인증)" ON public.documents;
CREATE POLICY "documents: 공유 토큰으로 조회 (비인증)" ON public.documents
  FOR SELECT USING (
    share_token IS NOT NULL
    AND share_expires_at > NOW()
  );

DROP POLICY IF EXISTS "documents: 어드민 전체 조회" ON public.documents;
CREATE POLICY "documents: 어드민 전체 조회" ON public.documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- compliance_rules (공개 읽기 — 모든 인증 사용자가 조회 가능)
-- ---------------------------------------------------------------------------
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_rules: 인증 사용자 전체 조회" ON public.compliance_rules;
CREATE POLICY "compliance_rules: 인증 사용자 전체 조회" ON public.compliance_rules
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "compliance_rules: 어드민만 수정" ON public.compliance_rules;
CREATE POLICY "compliance_rules: 어드민만 수정" ON public.compliance_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- compliance_runs
-- ---------------------------------------------------------------------------
ALTER TABLE public.compliance_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_runs: 본인 데이터 전체 접근" ON public.compliance_runs;
CREATE POLICY "compliance_runs: 본인 데이터 전체 접근" ON public.compliance_runs
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- agent_memory
-- ---------------------------------------------------------------------------
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_memory: 본인 데이터 전체 접근" ON public.agent_memory;
CREATE POLICY "agent_memory: 본인 데이터 전체 접근" ON public.agent_memory
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- onboarding_context
-- ---------------------------------------------------------------------------
ALTER TABLE public.onboarding_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_context: 본인 데이터 전체 접근" ON public.onboarding_context;
CREATE POLICY "onboarding_context: 본인 데이터 전체 접근" ON public.onboarding_context
  FOR ALL USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- expert_connection_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.expert_connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_req: 요청자 본인 접근" ON public.expert_connection_requests;
CREATE POLICY "expert_req: 요청자 본인 접근" ON public.expert_connection_requests
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expert_req: 배정된 파트너 조회" ON public.expert_connection_requests;
CREATE POLICY "expert_req: 배정된 파트너 조회" ON public.expert_connection_requests
  FOR SELECT USING (auth.uid() = assigned_partner_id);

DROP POLICY IF EXISTS "expert_req: 파트너 응답 업데이트" ON public.expert_connection_requests;
CREATE POLICY "expert_req: 파트너 응답 업데이트" ON public.expert_connection_requests
  FOR UPDATE USING (auth.uid() = assigned_partner_id);

DROP POLICY IF EXISTS "expert_req: 어드민 전체 접근" ON public.expert_connection_requests;
CREATE POLICY "expert_req: 어드민 전체 접근" ON public.expert_connection_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_logs: 본인 로그 조회" ON public.activity_logs;
CREATE POLICY "activity_logs: 본인 로그 조회" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs: 시스템 삽입" ON public.activity_logs;
CREATE POLICY "activity_logs: 시스템 삽입" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs: 어드민 전체 조회" ON public.activity_logs;
CREATE POLICY "activity_logs: 어드민 전체 조회" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- =============================================================================
-- 5. STORAGE BUCKETS — 파일 저장소 설정 안내
-- =============================================================================
-- 아래는 Supabase 대시보드 > Storage에서 직접 생성하거나,
-- Management API로 생성하세요. SQL 편집기에서는 실행되지 않습니다.
--
-- Bucket 1: company-logos    (공개)   — 회사 로고 이미지
-- Bucket 2: product-labels   (비공개) — 제품 라벨 이미지 (OCR 원본)
-- Bucket 3: documents-export (비공개) — 생성된 PDF/DOCX 파일
-- =============================================================================


-- =============================================================================
-- 6. SEED DATA — 컴플라이언스 룰팩 초기 데이터
-- =============================================================================
-- 주요 수출 대상국 11개국의 기본 규제 정보를 삽입합니다.
-- ON CONFLICT DO NOTHING 으로 중복 실행 시 안전하게 건너뜁니다.
-- 실제 운영 시 법무팀 검토 후 업데이트하세요.
-- =============================================================================

INSERT INTO public.compliance_rules
  (country_code, country_name, regulatory_body, key_regulation,
   banned_ingredients, restricted_ingredients, label_requirements,
   claim_restrictions, rulepack_version, last_updated)
VALUES

-- 미국 (FDA)
('US', 'United States', 'FDA',
 '21 CFR Part 700-740 (Cosmetics)',
 '["bithionol","chloroform","halogenated salicylanilides","mercury compounds","methylene chloride","vinyl chloride","zirconium complexes in aerosols","chlorofluorocarbon propellants"]'::JSONB,
 '[{"name":"titanium dioxide (aerosol)","note":"inhalation risk"},{"name":"coal tar dyes","note":"except certified batches"}]'::JSONB,
 '{"language":"English mandatory","net_content":"mandatory","country_of_origin":"mandatory","ingredient_list":"INCI mandatory","distributor_address":"mandatory"}'::JSONB,
 '["drug claims without OTC approval","UV protection without SPF test","acne treatment without NDA","anti-dandruff without approval"]'::JSONB,
 '1.0', '2024-01-01'),

-- 유럽연합 (EC)
('EU', 'European Union', 'European Commission',
 'EU Cosmetics Regulation No 1223/2009',
 '["lead and compounds","mercury","formaldehyde >0.2%","diethylene glycol","coal tar (non-synthetic)","resorcinol in hair dye","phenylenediamines","chromium VI compounds","nickel in piercing jewelry context"]'::JSONB,
 '[{"name":"resorcinol","limit":"0.5% in rinse-off","category":"hair"},{"name":"hydrogen peroxide","limit":"12% w/w"},{"name":"salicylic acid","limit":"2% leave-on, 3% rinse-off"}]'::JSONB,
 '{"language":"Local language mandatory","CPNP_notification":"required before market","responsible_person":"EU entity required","ingredient_list":"INCI mandatory","PAO_or_expiry":"mandatory"}'::JSONB,
 '["anti-aging claims requiring drug approval","SPF without testing","microbiome claims without evidence"]'::JSONB,
 '1.0', '2024-01-01'),

-- 일본 (MHLW)
('JP', 'Japan', 'Ministry of Health, Labour and Welfare (MHLW)',
 'Pharmaceutical and Medical Device Act (PMD Act)',
 '["certain tar dyes not on positive list","chloramphenicol","estrogen","testosterone","heavy metals above limits"]'::JSONB,
 '[{"name":"retinol","limit":"0.3% in cosmetics"},{"name":"salicylic acid","limit":"0.2% leave-on"},{"name":"hydroquinone","note":"prescription only above 2%"}]'::JSONB,
 '{"language":"Japanese mandatory","notification":"required for quasi-drugs","ingredient_list":"positive list system","net_content":"mandatory","manufacturer_name":"mandatory"}'::JSONB,
 '["quasi-drug claims without approval","whitening above cosmetic category","hair growth claims without quasi-drug status"]'::JSONB,
 '1.0', '2024-01-01'),

-- 중국 (NMPA)
('CN', 'China', 'National Medical Products Administration (NMPA)',
 'Cosmetics Supervision and Administration Regulation (CSAR) 2021',
 '["mercury compounds","lead >10ppm","arsenic >2ppm","chromium >0.5ppm","cadmium","prohibited color additives not on positive list"]'::JSONB,
 '[{"name":"retinol","limit":"0.3%"},{"name":"AHA","limit":"6% at pH>=3.5"},{"name":"salicylic acid","limit":"2%"},{"name":"hydroquinone","limit":"2% leave-on"}]'::JSONB,
 '{"language":"Chinese mandatory","registration":"required for special cosmetics (SPF, whitening, hair color)","filing":"required for general cosmetics","animal_testing":"required for imported products (with some exemptions from 2021)","label_in_Chinese":"mandatory"}'::JSONB,
 '["special cosmetic claims without registration","SPF without approved test","whitening without special registration"]'::JSONB,
 '1.0', '2024-01-01'),

-- 베트남 (DAV)
('VN', 'Vietnam', 'Drug Administration of Vietnam (DAV)',
 'ASEAN Cosmetics Directive (ACD)',
 '["asean_prohibited_list_applies","triclosan above limit","mercury"]'::JSONB,
 '[{"name":"hydroquinone","limit":"2%"},{"name":"kojic acid","limit":"2%"}]'::JSONB,
 '{"language":"Vietnamese mandatory for labels","notification":"required via ASEAN portal","ingredient_list":"INCI preferred"}'::JSONB,
 '["drug-like claims","whitening without notification"]'::JSONB,
 '1.0', '2024-01-01'),

-- 인도네시아 (BPOM)
('ID', 'Indonesia', 'BPOM (Badan Pengawas Obat dan Makanan)',
 'ASEAN Cosmetics Directive + Local BPOM Regulations',
 '["asean_prohibited_list_applies","mercury compounds","hydroquinone above 2% in non-prescription"]'::JSONB,
 '[{"name":"kojic acid","limit":"2%"},{"name":"alpha arbutin","limit":"2%"},{"name":"hydroquinone","limit":"2%"}]'::JSONB,
 '{"language":"Indonesian (Bahasa) mandatory","registration":"required at BPOM before import","halal_label":"required if claiming halal"}'::JSONB,
 '["claims implying drug function","SPF without BPOM-approved test","halal claims without MUI certification"]'::JSONB,
 '1.0', '2024-01-01'),

-- 말레이시아 (NPRA)
('MY', 'Malaysia', 'National Pharmaceutical Regulatory Agency (NPRA)',
 'Control of Drugs and Cosmetics Regulations 1984',
 '["asean_prohibited_list_applies","certain preservatives above limit","hydroquinone in cosmetics"]'::JSONB,
 '[{"name":"kojic acid","limit":"2%"},{"name":"ascorbic acid","note":"notification required above certain concentrations"}]'::JSONB,
 '{"language":"English or Bahasa Melayu","notification":"required before sale","halal_certification":"recommended"}'::JSONB,
 '["drug-like efficacy claims","skin lightening above cosmetic category"]'::JSONB,
 '1.0', '2024-01-01'),

-- 태국 (FDA Thailand)
('TH', 'Thailand', 'Thai Food and Drug Administration (Thai FDA)',
 'Cosmetics Act B.E. 2558 (2015)',
 '["asean_prohibited_list_applies","mercury compounds","hydroquinone"]'::JSONB,
 '[{"name":"kojic acid","limit":"2%"},{"name":"resorcinol","limit":"0.5%"}]'::JSONB,
 '{"language":"Thai mandatory for primary label","notification":"required","responsible_entity":"Thai entity required"}'::JSONB,
 '["skin whitening without notification","SPF claims without approved test"]'::JSONB,
 '1.0', '2024-01-01'),

-- 홍콩 (FEHD)
('HK', 'Hong Kong', 'Food and Environmental Hygiene Department (FEHD)',
 'Pharmacy and Poisons Ordinance (Cap. 138)',
 '["same as EU for most substances","certain Chinese herbal ingredients restricted"]'::JSONB,
 '[{"name":"hydroquinone","limit":"2%"},{"name":"retinol","limit":"0.3%"}]'::JSONB,
 '{"language":"English or Chinese","registration":"not required for general cosmetics","product_safety":"self-responsibility"}'::JSONB,
 '["drug claims","SPF above 50+ without testing","prescription drug ingredients"]'::JSONB,
 '1.0', '2024-01-01'),

-- 대만 (TFDA)
('TW', 'Taiwan', 'Taiwan Food and Drug Administration (TFDA)',
 'Statute for Control of Cosmetic Products',
 '["prohibited list similar to EU","certain azo dyes","mercury compounds"]'::JSONB,
 '[{"name":"hydroquinone","limit":"2%"},{"name":"AHA","limit":"10%"},{"name":"salicylic acid","limit":"2%"}]'::JSONB,
 '{"language":"Traditional Chinese mandatory","registration":"required for special cosmetics (SPF, whitening, hair dye)","ingredient_list":"INCI + Chinese names"}'::JSONB,
 '["special cosmetic claims without registration","SPF without TFDA approved test"]'::JSONB,
 '1.0', '2024-01-01'),

-- 호주 (AICIS)
('AU', 'Australia', 'Australian Industrial Chemicals Introduction Scheme (AICIS)',
 'Industrial Chemicals Act 2019',
 '["asbestos","mercury compounds","lead compounds","phenolphthalein","certain preservatives above threshold"]'::JSONB,
 '[{"name":"formaldehyde","limit":"0.2% in cosmetics"},{"name":"retinol","limit":"0.3% in leave-on"}]'::JSONB,
 '{"language":"English mandatory","notification":"standard cosmetics self-assessed","registration":"required for non-standard cosmetics","ingredient_list":"INCI preferred"}'::JSONB,
 '["therapeutic claims without TGA registration","SPF above 50+ without testing","anti-bacterial claims without approval"]'::JSONB,
 '1.0', '2024-01-01')

ON CONFLICT (country_code, rulepack_version) DO NOTHING;


-- =============================================================================
-- 7. 완료 메시지
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'FLONIX Database Setup 완료!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '생성된 Enum: 13종 (중복 시 건너뜀)';
  RAISE NOTICE '생성된 테이블: 15개 (중복 시 건너뜀)';
  RAISE NOTICE '  - profiles, companies, products';
  RAISE NOTICE '  - product_ingredients, product_labels';
  RAISE NOTICE '  - buyers, buyer_interactions';
  RAISE NOTICE '  - deals, documents';
  RAISE NOTICE '  - compliance_rules, compliance_runs';
  RAISE NOTICE '  - agent_memory, onboarding_context';
  RAISE NOTICE '  - expert_connection_requests, activity_logs';
  RAISE NOTICE 'RLS 정책: 활성화 완료 (재실행 시 갱신됨)';
  RAISE NOTICE 'Seed Data: 11개국 규제 룰팩 삽입 완료';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. Supabase Storage에서 버킷 생성:';
  RAISE NOTICE '   company-logos (공개)';
  RAISE NOTICE '   product-labels (비공개)';
  RAISE NOTICE '   documents-export (비공개)';
  RAISE NOTICE '2. Authentication 설정 확인';
  RAISE NOTICE '3. Edge Function 배포 확인';
  RAISE NOTICE '==========================================';
END;
$$;
