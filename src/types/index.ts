// K-뷰티 AI 무역비서 Data Types

export interface Company {
  id: string;
  name: string;
  contact: string;
  logo?: string;
  defaults: {
    moq: number;
    leadTime: number;
    incoterms: string;
    paymentTerms: string;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  ingredientsRaw: string;
  ingredientsConfirmed: Ingredient[];
  labelImages: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  confirmed: boolean;
  confidence: 'high' | 'medium' | 'low';
  needsReview: boolean;
}

export interface MarketChoice {
  selectedCountries: string[];
  mode: 'detailed' | 'simple';
}

// ========== 목표 바이어 설정 (Goal Bar) ==========
export type TargetCountry = 
  | '미국' | '중국' | '일본' | '베트남' | '인도네시아' 
  | '말레이시아' | '태국' | '홍콩' | '대만' | '호주' | 'EU';

export type SalesChannel = 
  | 'distributor'   // 유통사/도매
  | 'retail'        // 리테일(오프라인)
  | 'online_market' // 온라인 마켓
  | 'd2c';          // D2C(자사몰)

export type BuyerType = 
  | 'importer'      // 수입사
  | 'distributor'   // 유통사
  | 'retailer'      // 리테일러
  | 'reseller';     // 마켓 셀러

export type DealStage = 
  | 'first_proposal'   // 첫 제안
  | 'sample_proposal'  // 샘플 제안
  | 'pre_contract'     // 계약 직전
  | 'shipment_prep';   // 출고·서류 준비

export type Language = '영어' | '중국어' | '일본어' | '독일어' | '한국어';
export type Currency = 'USD' | 'HKD' | 'JPY' | 'CNY' | 'EUR' | 'AUD' | 'KRW';

export interface BuyerGoal {
  countries: TargetCountry[];        // 필수: 최대 3개
  channel: SalesChannel | null;      // 필수
  buyerType: BuyerType | null;       // 필수
  language: Language;                // 선택 (자동 추천)
  currency: Currency;                // 선택 (자동 추천)
  dealStage: DealStage | null;       // 선택
  buyerCompany?: string;             // 선택
  buyerContact?: string;             // 선택
  buyerEmail?: string;               // 선택
  // 회사 정보 (자동 반영)
  company?: {
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    website?: string;
    logoUrl?: string;
    bankName?: string;
    bankAccount?: string;
    bankSwift?: string;
    defaultMoq?: number;
    defaultLeadTime?: number;
    defaultIncoterms?: string;
    defaultPaymentTerms?: string;
  };
}

export interface ChannelChecklist {
  channel: SalesChannel;
  items: string[];
}

// ========== 기존 타입들 ==========
export interface DraftSummary {
  signal: 'ok' | 'caution' | 'stop';
  checklist: ChecklistItem[];
  evidence: EvidenceItem[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  description: string;
  source?: string;
}

export interface Deal {
  id: string;
  buyerName: string;
  buyerCountry: string;
  qty: number;
  unitPrice: number;
  currency: string;
  incoterms: string;
  paymentTerms: string;
  leadTime: number;
  validity: string;
  totalAmount: number;
}

export interface Document {
  id: string;
  type: 'PI' | 'Contract' | 'Invoice' | 'PackingList';
  title: string;
  content: string;
  status: 'draft' | 'confirmed' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationWarning {
  id: string;
  type: 'amount_mismatch' | 'condition_conflict' | 'missing_field';
  message: string;
  field: string;
  suggestedFix?: string;
  severity: 'error' | 'warning';
}

export interface BuyerPackFile {
  id: string;
  name: string;
  type: 'one_pager' | 'summary' | 'quality_cert' | 'terms' | 'email_template' | 'channel_checklist';
  preview?: string;
  ready: boolean;
  channelBadge?: string;  // 채널별 배지
  countryBadge?: string;  // 국가별 배지
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  status: 'draft' | 'confirmed' | 'complete';
  snapshot?: any;
  goalBadge?: string;  // 목표 배지 (예: "홍콩 · 리테일")
}

export interface ToolCallResult {
  toolCall: {
    id: string;
    name: 'update_document_field' | 'generate_document';
    arguments: {
      field_path?: string;
      new_value?: string;
      template_key?: string;
      preset?: string;
      reason: string;
    };
  };
  beforeValue?: string;
  success: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCallResults?: ToolCallResult[];
}

export type Step = 
  | 'upload'
  | 'ingredients'
  | 'draft'
  | 'edit'
  | 'validate'
  | 'export';

export interface AppState {
  currentStep: Step;
  activeTab: number;
  company: Company | null;
  products: Product[];
  marketChoice: MarketChoice | null;
  buyerGoal: BuyerGoal | null;  // 추가: 목표 바이어 설정
  summary: DraftSummary | null;
  deal: Deal | null;
  documents: Document[];
  warnings: ValidationWarning[];
  buyerPack: BuyerPackFile[];
  history: HistoryEntry[];
  messages: ChatMessage[];
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  isSampleMode: boolean;  // 추가: 샘플 모드 여부
}

// ========== 유틸리티 함수용 타입 ==========
export interface SamplePreset {
  id: string;
  name: string;
  goal: BuyerGoal;
  description: string;
}
