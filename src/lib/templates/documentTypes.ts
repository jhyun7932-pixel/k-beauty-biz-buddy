// 문서 템플릿 데이터 타입 정의

// 문서 타입
export type DocumentType = 'brand_deck' | 'catalog' | 'compliance' | 'pi' | 'contract';

// 문서 모드
export type DocumentMode = 'summary' | 'detailed';

// ZIP 내보내기용 통합 데이터 구조
export interface DocumentData {
  workspace: {
    companyName: string;
    companyNameKr?: string;
    brandName?: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    incoterms?: string;
    paymentTerms?: string;
    moq?: number;
    leadTime?: number;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNo?: string;
    bankSwift?: string;
    bankAddress?: string;
    certifications?: string[];
  };
  project: {
    targetCountries: string[];
    channel: string;
    buyerType: string;
    tradeStage: string;
    currency: string;
    language: string;
  };
  skus: {
    id: string;
    name: string;
    nameEn?: string;
    category?: string;
    skuCode?: string;
    sizeMlG?: number;
    moq?: number;
    unitPriceRange?: { min: number; max: number };
    leadTime?: number;
    hsCode?: string;
    ingredients?: string[];
    claims?: string[];
    imageUrl?: string;
  }[];
  buyer?: {
    company?: string;
    contact?: string;
    email?: string;
    country?: string;
    channel?: string;
    address?: string;
  };
  trade?: {
    incoterms?: string;
    paymentTerms?: string;
    leadTime?: string;
    moq?: number;
    currency?: string;
    validityDays?: number;
  };
}

export interface WorkspaceData {
  companyName: string;
  companyNameKr?: string;
  brandName?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  stampImageUrl?: string;
  signatureImageUrl?: string;
  ceoName?: string;
  contactTitle?: string;
  defaultIncoterms?: string;
  defaultPaymentTerms?: string;
  defaultMoq?: number;
  defaultLeadTime?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  bankAddress?: string;
  certifications?: string[];
}

export interface ProjectData {
  countries: string[];
  channel: string;
  buyerType: string;
  tradeStage: string;
  currency: string;
  language: string;
}

export interface SKUData {
  id: string;
  no: number;
  productName: string;
  productNameEn?: string;
  sku: string;
  category?: string;
  spec?: string;
  sizeMlG?: number;
  hsCode?: string;
  qty: number;
  unitPrice: number;
  amount: number;
  moq?: number;
  leadTime?: number;
  ingredients?: string[];
  claims?: string[];
  imageUrl?: string;
}

export interface BuyerData {
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  country: string;
  address?: string;
  channel?: string;
  buyerType?: string;
  interestSkus?: string[];
}

export interface TradeData {
  incoterms: string;
  paymentTerms: string;
  leadTime: string;
  moq: number;
  currency: string;
  validityDays: number;
  shippingCost?: number;
  insurance?: string;
  partialShipment?: string;
  destination?: string;
  cartonSpec?: string;
  grossNet?: string;
  cartonCount?: number;
  palletInfo?: string;
}

export interface DocumentTemplateData {
  workspace: WorkspaceData;
  project: ProjectData;
  skus: SKUData[];
  buyer?: BuyerData;
  trade: TradeData;
  rulepack?: {
    country: string;
    version: string;
    focus: string[];
    labelMust: string[];
    watchouts: string[];
    ingredientsRedFlagExample?: string[];
  };
  // 계산된 필드
  documentNumber?: string;
  date?: string;
  subtotal?: number;
  total?: number;
}

// PI 특화 데이터
export interface PITemplateData extends DocumentTemplateData {
  piNumber: string;
  docCI?: string;
  docPL?: string;
  docCOO?: string;
  docOther?: string;
}

// Contract 특화 데이터
export interface ContractTemplateData extends DocumentTemplateData {
  contractNumber: string;
  sellerRep?: string;
  buyerRep?: string;
  governingLaw: string;
  definitionsText?: string;
  productSpecialNotes?: string;
  inspectionTerms?: string;
  claimsTerms?: string;
  returnTerms?: string;
  warrantyTerms?: string;
  complianceClause?: string;
  ipClause?: string;
  confClause?: string;
  forceMajeureClause?: string;
  disputeClause?: string;
  packingText?: string;
}

// 문서 섹션 정보
export interface DocumentSection {
  id: string;
  title: string;
  pageNumber: number;
  status: 'complete' | 'editing' | 'ai_suggested' | 'warning';
  content?: string;
}

// 문서 검증 결과
export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  id: string;
  field: string;
  message: string;
  documents: string[]; // 불일치하는 문서들
  values: Record<string, string | number>; // 문서별 값
}

export interface ValidationError {
  id: string;
  field: string;
  message: string;
  required: boolean;
}
