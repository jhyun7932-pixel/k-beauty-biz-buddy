
-- =====================================================
-- Export Ops MVP 고도화: 워크스페이스 + 온보딩 + Deal OS
-- =====================================================

-- 1. ENUM 타입 생성
CREATE TYPE public.sales_channel AS ENUM ('wholesale', 'offline_retail', 'online_marketplace', 'd2c');
CREATE TYPE public.trade_stage AS ENUM ('first_proposal', 'sample', 'main_order', 'reorder');
CREATE TYPE public.buyer_type AS ENUM ('importer', 'distributor', 'retailer', 'market_seller');
CREATE TYPE public.deal_status_stage AS ENUM ('lead', 'contacted', 'replied', 'sample', 'negotiation', 'won', 'lost');
CREATE TYPE public.doc_type AS ENUM ('onepager', 'catalog', 'compliance_snapshot', 'deal_sheet', 'pi', 'contract', 'email_pack', 'expert_request');
CREATE TYPE public.doc_status AS ENUM ('draft', 'edited', 'final', 'sent');
CREATE TYPE public.interaction_type AS ENUM ('email', 'call', 'meeting', 'chat');
CREATE TYPE public.memory_type AS ENUM ('preference', 'template_param', 'risk_policy', 'tone_rule');

-- 2. workspaces 테이블
CREATE TABLE public.workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own workspaces"
ON public.workspaces FOR ALL
USING (auth.uid() = owner_user_id);

-- 3. onboarding_context 테이블 (온보딩 선택값)
CREATE TABLE public.onboarding_context (
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_countries JSONB DEFAULT '[]'::jsonb,
  target_channel sales_channel,
  buyer_type buyer_type DEFAULT 'importer',
  trade_stage trade_stage DEFAULT 'first_proposal',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own onboarding context"
ON public.onboarding_context FOR ALL
USING (auth.uid() = user_id);

-- 4. companies 테이블 확장 (company_profiles 역할)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS company_name_kr TEXT,
ADD COLUMN IF NOT EXISTS main_category TEXT,
ADD COLUMN IF NOT EXISTS manufacturing_type TEXT,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tone_style JSONB DEFAULT '{"style": "professional"}'::jsonb,
ADD COLUMN IF NOT EXISTS banned_claim_phrases JSONB DEFAULT '[]'::jsonb;

-- 5. products 테이블 확장
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sku_code TEXT,
ADD COLUMN IF NOT EXISTS product_name_kr TEXT,
ADD COLUMN IF NOT EXISTS product_name_en TEXT,
ADD COLUMN IF NOT EXISTS function_claims JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS size_ml_g NUMERIC,
ADD COLUMN IF NOT EXISTS packaging_type TEXT,
ADD COLUMN IF NOT EXISTS hs_code_candidate TEXT,
ADD COLUMN IF NOT EXISTS moq INTEGER,
ADD COLUMN IF NOT EXISTS unit_price_range JSONB,
ADD COLUMN IF NOT EXISTS lead_time INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- 6. product_ingredients 테이블 (성분 정규화)
CREATE TABLE public.product_ingredients (
  ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  raw_ocr_text TEXT,
  cleaned_ingredient_list JSONB DEFAULT '[]'::jsonb,
  inci_mapped_list JSONB DEFAULT '[]'::jsonb,
  last_user_edit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own product ingredients"
ON public.product_ingredients FOR ALL
USING (auth.uid() = user_id);

-- 7. product_labels 테이블 (라벨 이미지/초안)
CREATE TABLE public.product_labels (
  label_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label_image_url TEXT,
  extracted_label_text TEXT,
  label_draft_by_country JSONB DEFAULT '{}'::jsonb,
  label_risk_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own product labels"
ON public.product_labels FOR ALL
USING (auth.uid() = user_id);

-- 8. knowledge_assets 테이블 (RAG 문서 저장소)
CREATE TABLE public.knowledge_assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL,
  file_url TEXT,
  extracted_text TEXT,
  vector_index_ref TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own knowledge assets"
ON public.knowledge_assets FOR ALL
USING (auth.uid() = user_id);

-- 9. rulepacks 테이블 (규제/요건 룰팩)
CREATE TABLE public.rulepacks (
  rulepack_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  version TEXT NOT NULL,
  coverage_notes JSONB DEFAULT '[]'::jsonb,
  evidence_links JSONB DEFAULT '[]'::jsonb,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rulepacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rulepacks"
ON public.rulepacks FOR SELECT
USING (true);

-- 10. compliance_runs 테이블 (규제 진단 실행)
CREATE TABLE public.compliance_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_countries JSONB DEFAULT '[]'::jsonb,
  rulepack_versions JSONB DEFAULT '{}'::jsonb,
  export_ready_score INTEGER DEFAULT 0,
  traffic_light TEXT DEFAULT 'yellow',
  findings JSONB DEFAULT '[]'::jsonb,
  next_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own compliance runs"
ON public.compliance_runs FOR ALL
USING (auth.uid() = user_id);

-- 11. documents 테이블 확장
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS doc_format TEXT DEFAULT 'html',
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS content_md TEXT,
ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'ai',
ADD COLUMN IF NOT EXISTS source_context JSONB DEFAULT '{}'::jsonb;

-- 12. edit_logs 테이블 (사용자 편집 로그)
CREATE TABLE public.edit_logs (
  edit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  edit_type TEXT NOT NULL,
  before_snapshot TEXT,
  after_snapshot TEXT,
  reason_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.edit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own edit logs"
ON public.edit_logs FOR ALL
USING (auth.uid() = user_id);

-- 13. buyers 테이블 확장 (buyer_crm_buyers 역할)
ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS channel_focus TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS status_stage TEXT DEFAULT 'lead',
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS target_category TEXT,
ADD COLUMN IF NOT EXISTS target_price_range JSONB,
ADD COLUMN IF NOT EXISTS margin_expectation NUMERIC,
ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

-- 14. buyer_interactions 테이블 (커뮤니케이션 추적)
CREATE TABLE public.buyer_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  interaction_type interaction_type NOT NULL,
  subject TEXT,
  message_snippet TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  next_follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buyer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own buyer interactions"
ON public.buyer_interactions FOR ALL
USING (auth.uid() = user_id);

-- 15. deals 테이블 확장 (buyer_deals 역할)
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trade_stage_enum trade_stage,
ADD COLUMN IF NOT EXISTS doc_refs JSONB DEFAULT '[]'::jsonb;

-- 16. agent_memory 테이블 (AI 비서 개인화 메모리)
CREATE TABLE public.agent_memory (
  memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  memory_type memory_type NOT NULL,
  key TEXT NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own agent memory"
ON public.agent_memory FOR ALL
USING (auth.uid() = user_id);

-- 17. updated_at 트리거 함수 적용
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_context_updated_at
  BEFORE UPDATE ON public.onboarding_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_ingredients_updated_at
  BEFORE UPDATE ON public.product_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_labels_updated_at
  BEFORE UPDATE ON public.product_labels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_assets_updated_at
  BEFORE UPDATE ON public.knowledge_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rulepacks_updated_at
  BEFORE UPDATE ON public.rulepacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at
  BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
