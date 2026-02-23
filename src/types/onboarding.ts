// 2단계 온보딩 + Deal OS 관련 타입

export type OnboardingSalesChannel = 'wholesale' | 'offline_retail' | 'online_marketplace' | 'd2c';
export type OnboardingTradeStage = 'first_proposal' | 'sample' | 'main_order' | 'reorder';
export type OnboardingBuyerType = 'importer' | 'distributor' | 'retailer' | 'market_seller';
export type DealStatusStage = 'lead' | 'contacted' | 'replied' | 'sample' | 'negotiation' | 'won' | 'lost';

export interface OnboardingContext {
  contextId?: string;
  workspaceId?: string;
  userId?: string;
  targetCountries: string[];
  targetChannel: OnboardingSalesChannel | null;
  buyerType: OnboardingBuyerType;
  tradeStage: OnboardingTradeStage;
  language: string;
  currency: string;
}

export const DEFAULT_ONBOARDING_CONTEXT: OnboardingContext = {
  targetCountries: [],
  targetChannel: null,
  buyerType: 'importer',
  tradeStage: 'first_proposal',
  language: 'en',
  currency: 'USD',
};

export const ONBOARDING_COUNTRIES = [
  { code: 'US', label: '미국', labelEn: 'United States' },
  { code: 'CN', label: '중국', labelEn: 'China' },
  { code: 'JP', label: '일본', labelEn: 'Japan' },
  { code: 'VN', label: '베트남', labelEn: 'Vietnam' },
  { code: 'ID', label: '인도네시아', labelEn: 'Indonesia' },
  { code: 'MY', label: '말레이시아', labelEn: 'Malaysia' },
  { code: 'TH', label: '태국', labelEn: 'Thailand' },
  { code: 'HK', label: '홍콩', labelEn: 'Hong Kong' },
  { code: 'TW', label: '대만', labelEn: 'Taiwan' },
  { code: 'AU', label: '호주', labelEn: 'Australia' },
  { code: 'EU', label: 'EU', labelEn: 'European Union' },
];

export const ONBOARDING_CHANNELS: { value: OnboardingSalesChannel; label: string; description: string }[] = [
  { value: 'wholesale', label: '유통/도매(수입사)', description: '디스트리뷰터를 통한 B2B' },
  { value: 'offline_retail', label: '오프라인 리테일', description: '드럭스토어/백화점' },
  { value: 'online_marketplace', label: '온라인 마켓', description: '아마존/쇼피/티몰' },
  { value: 'd2c', label: 'D2C', description: '자사몰/공식몰' },
];

export const ONBOARDING_TRADE_STAGES: { value: OnboardingTradeStage; label: string }[] = [
  { value: 'first_proposal', label: '첫 제안' },
  { value: 'sample', label: '샘플' },
  { value: 'main_order', label: '본오더' },
  { value: 'reorder', label: '재주문' },
];

export const ONBOARDING_BUYER_TYPES: { value: OnboardingBuyerType; label: string }[] = [
  { value: 'importer', label: '수입사' },
  { value: 'distributor', label: '유통사' },
  { value: 'retailer', label: '리테일러' },
  { value: 'market_seller', label: '마켓셀러' },
];

export const DEAL_STATUS_STAGES: { value: DealStatusStage; label: string; color: string }[] = [
  { value: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-600' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-600' },
  { value: 'replied', label: 'Replied', color: 'bg-cyan-100 text-cyan-600' },
  { value: 'sample', label: 'Sample', color: 'bg-amber-100 text-amber-600' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-600' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-600' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-600' },
];

// AI 첫 대화 스크립트
export interface AIConversationScript {
  welcomeMessage: (context: OnboardingContext) => string;
  questions: AIConversationQuestion[];
}

export interface AIConversationQuestion {
  id: string;
  question: string;
  trigger?: string; // 언제 노출할지
  memoryKey?: string; // agent_memory에 저장할 키
}

export const AI_CONVERSATION_QUESTIONS: AIConversationQuestion[] = [
  {
    id: 'q1',
    question: "이번에 제안할 '대표 제품 1개'가 무엇인가요? (제품명/카테고리)",
    memoryKey: 'representative_product',
  },
  {
    id: 'q2',
    question: "바이어에게 제일 먼저 보여줄 3가지 강점은 무엇인가요? (예: 성분, 임상/테스트, 수상, 제조역량)",
    memoryKey: 'key_strengths',
  },
  {
    id: 'q3',
    question: "가격/조건은 어느 정도로 제안하실까요? (MOQ, 단가 범위, 리드타임)",
    memoryKey: 'price_conditions',
  },
  {
    id: 'q4',
    question: "거래 조건 기본값을 정할게요. 인코텀즈는 보통 FOB/CIF/DDP 중 무엇을 선호하세요?",
    memoryKey: 'default_incoterms',
  },
  {
    id: 'q5',
    question: "결제 조건은 T/T 기준으로 선금 비율을 어떻게 하시나요? (예: 30/70)",
    memoryKey: 'default_payment_terms',
  },
  {
    id: 'q6',
    question: "바이어가 누구인가요? (수입사/유통사/리테일러/마켓셀러)",
    memoryKey: 'buyer_type_preference',
  },
  {
    id: 'q7',
    question: "문서 언어와 통화를 확정할게요. 바꾸실까요?",
    memoryKey: 'language_currency',
  },
  {
    id: 'q8',
    question: "회사소개서(PDF)가 있으면 문서가 훨씬 빨라져요. 지금 업로드할까요?",
    trigger: 'no_company_deck',
  },
  {
    id: 'q9',
    question: "제품 성분표/라벨 사진이 있으면 국가별 리스크를 먼저 체크할 수 있어요. 업로드할까요?",
    trigger: 'no_ingredients',
  },
  {
    id: 'q10',
    question: "첫 제안 이메일도 같이 만들까요? '첫 제안/샘플 후속/본오더 클로징' 중 무엇이 필요하세요?",
    memoryKey: 'email_preference',
  },
];

export function generateAIWelcomeMessage(context: OnboardingContext): string {
  const countriesLabel = context.targetCountries.length > 0 
    ? context.targetCountries.map(c => 
        ONBOARDING_COUNTRIES.find(oc => oc.code === c)?.label || c
      ).join(' / ')
    : '미설정';
  
  const channelLabel = context.targetChannel 
    ? ONBOARDING_CHANNELS.find(c => c.value === context.targetChannel)?.label || context.targetChannel
    : '미설정';
  
  const stageLabel = ONBOARDING_TRADE_STAGES.find(s => s.value === context.tradeStage)?.label || '첫 제안';

  return `좋아요. **${countriesLabel}** / **${channelLabel}** / **${stageLabel}** 기준으로 '보낼 준비'를 빠르게 만들게요.

1️⃣ 지금 바로 **1페이지 Deal Sheet 초안**을 만들까요?
2️⃣ 아니면 먼저 **제품 1개(SKU)의 성분/라벨**을 확인할까요?`;
}

// CRM 딜 관련
export interface CRMDeal {
  dealId: string;
  buyerId: string;
  productId?: string;
  tradeStage: OnboardingTradeStage;
  incoterms: string;
  paymentTerms: string;
  moq: number;
  unitPrice: number;
  qty: number;
  currency: string;
  leadTime: number;
  docRefs: string[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMBuyer {
  buyerId: string;
  workspaceId?: string;
  companyName: string;
  country: string;
  channelFocus: string;
  buyerType: OnboardingBuyerType;
  preferredLanguage: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  statusStage: DealStatusStage;
  rating: number;
  notes?: string;
  nextFollowUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMInteraction {
  interactionId: string;
  buyerId: string;
  interactionType: 'email' | 'call' | 'meeting' | 'chat';
  subject?: string;
  messageSnippet?: string;
  sentAt?: Date;
  opened: boolean;
  replied: boolean;
  nextFollowUpDate?: Date;
  createdAt: Date;
}

// KPI 타입
export interface CRMKPIData {
  followUpNeeded: number;
  activeDeals: number;
  sampleToOrderCandidates: number;
  unsentDocuments: number;
}

// Next Action 추천
export function getNextActionForStage(stage: DealStatusStage): { label: string; action: string } {
  switch (stage) {
    case 'lead':
      return { label: '첫 제안 이메일+딜시트 생성', action: 'create_first_proposal' };
    case 'contacted':
      return { label: '후속 이메일 발송', action: 'send_followup' };
    case 'replied':
      return { label: '샘플 조건 확정/샘플 후속 이메일', action: 'confirm_sample' };
    case 'sample':
      return { label: '본오더 조건 제안(PI 초안)', action: 'create_pi_draft' };
    case 'negotiation':
      return { label: 'Contract 레드라인 체크리스트', action: 'contract_checklist' };
    case 'won':
      return { label: '출고 서류 준비', action: 'prepare_shipment' };
    case 'lost':
      return { label: '재접촉 캠페인', action: 'recontact_campaign' };
    default:
      return { label: '다음 액션 등록', action: 'register_action' };
  }
}
