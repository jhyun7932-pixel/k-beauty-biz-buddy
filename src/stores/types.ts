// ============ Shared Type Definitions for App Store ============

export type TargetCountry = 'US' | 'JP' | 'EU' | 'HK' | 'TW' | 'CN' | 'VN' | 'ID' | 'MY' | 'TH' | 'AU';
export type SalesChannel = '도매' | '리테일' | 'D2C' | '아마존' | '틱톡샵' | '오프라인';
export type BuyerType = '수입사' | '유통사' | '리테일러' | '플랫폼셀러' | '브랜드' | '에이전시';
export type StagePreset = 'FIRST_PROPOSAL' | 'SAMPLE' | 'PURCHASE_ORDER';
export type Language = 'KO' | 'EN' | 'JP';
export type Currency = 'USD' | 'JPY' | 'EUR' | 'HKD' | 'TWD' | 'CNY' | 'VND' | 'IDR' | 'MYR' | 'THB' | 'AUD';
export type Incoterms = 'FOB' | 'CIF' | 'DDP' | 'EXW';
export type PaymentTerms = 'T/T 30/70' | 'T/T 100%' | 'L/C' | 'Escrow';
export type WorkbenchTab = 'PREVIEW' | 'FIELDS' | 'GATE' | 'CHECKLIST' | 'FILES' | 'HISTORY';
export type ActivePage = 'AGENT_HOME' | 'PROJECTS' | 'BUYER_CRM' | 'DOCS' | 'COMPLIANCE' | 'SETTINGS';

export interface GateResult {
  id: string;
  title: string;
  titleEn: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  rule: string;
  status: 'PASS' | 'FAIL' | 'NEED_USER_CONFIRM';
  fixActionLabel: string;
  details?: string;
}

export interface QAWarning {
  id: string;
  msg: string;
  fixHint: string;
}

export interface DocInstance {
  docId: string;
  title: string;
  stagePreset: StagePreset;
  templateKey: string;
  status: 'draft' | 'final';
  fields: Record<string, any>;
  html: string;
  qa: { score: number; warnings: QAWarning[] };
  gate: { required: number; passed: number; locked: boolean; results: GateResult[] };
  createdAt: Date;
  updatedAt: Date;
}

export interface FileItem {
  fileId: string;
  docId: string;
  name: string;
  type: 'html' | 'pdf';
  status: 'draft' | 'final';
  createdAt: Date;
}

export interface RulePackItem {
  ruleId: string;
  title: string;
  evidence: string;
  checkHow: string;
  action: string;
  status: 'OK' | 'NEED_CHECK' | 'NEED_ACTION';
}

export interface LabelRequirement {
  item: string;
  requirement: string;
  status: 'OK' | 'NEED_CHECK' | 'NEED_ACTION';
  note: string;
}

export interface CountryCompliance {
  rulePack: RulePackItem[];
  labelRequirements: LabelRequirement[];
  hsCode: { hs6: string; rationale: string; needUserConfirm: boolean };
}

export interface SKUItem {
  sku: string;
  name: string;
  size: string;
  unit: string;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
}

export interface INCIIngredient {
  inci: string;
  orderOrPercent: string;
  note: string;
}

export interface DebugAction {
  type: string;
  payload?: any;
  at: Date;
}

// ============ State Sub-interfaces ============

export interface AuthState {
  session: {
    userId: string | null;
    email: string | null;
    role: 'user' | 'admin';
  };
  workspace: {
    workspaceId: string | null;
    name: string;
  };
}

export interface AuthActions {
  setSession: (session: Partial<AuthState['session']>) => void;
}

export interface UIState {
  ui: {
    activePage: ActivePage;
    activeDocId: string | null;
    selectedFileId: string | null;
    workbenchTab: WorkbenchTab;
    showTour: boolean;
    showDebugPanel: boolean;
  };
  debug: {
    lastActions: DebugAction[];
  };
}

export interface UIActions {
  navigate: (page: ActivePage) => void;
  setActiveDoc: (docId: string | null) => void;
  setSelectedFile: (fileId: string | null) => void;
  setWorkbenchTab: (tab: WorkbenchTab) => void;
  setShowTour: (show: boolean) => void;
  setShowDebugPanel: (show: boolean) => void;
}

export interface DocState {
  project: {
    projectId: string | null;
    name: string;
    targetCountries: TargetCountry[];
    channel: SalesChannel;
    stagePreset: StagePreset;
    buyerType: BuyerType;
    language: Language;
    currency: Currency;
    incotermsDefault: Incoterms;
    paymentDefault: PaymentTerms;
  };
  companyProfile: {
    companyName: string;
    address: string;
    phone: string;
    website: string;
    introDeckFileId: string | null;
    logoUrl: string;
    stampImageUrl: string;
    exportEmailSignature: string;
    brandTone: 'clean' | 'luxury' | 'natural';
    brandColors: { primary: string; secondary: string; accent: string };
  };
  productProfile: {
    productName: string;
    category: string;
    skuList: SKUItem[];
    inciIngredients: INCIIngredient[];
    labelImagesFileIds: string[];
  };
  docs: {
    byId: Record<string, DocInstance>;
  };
  files: {
    list: FileItem[];
  };
}

export interface DocActions {
  setPreset: (preset: StagePreset) => void;
  getDocTilesForPreset: (preset: StagePreset) => Array<{ templateKey: string; title: string; titleKr: string; icon: string; description: string; order: number }>;
  createDocFromTemplate: (params: { templateKey: string; preset: StagePreset }) => string;
  renderDocHTML: (params: { templateKey: string; fields: Record<string, any> }) => string;
  applyFieldPatch: (params: { docId: string; patch: Record<string, any> }) => void;
  setProjectConfig: (config: Partial<DocState['project']>) => void;
  setCompanyProfile: (profile: Partial<DocState['companyProfile']>) => void;
  setProductProfile: (profile: Partial<DocState['productProfile']>) => void;
  runCrossCheckGate: (docId: string) => GateResult[];
  finalizeDoc: (docId: string) => boolean;
  getActiveDoc: () => DocInstance | null;
  getDocsForCurrentPreset: () => DocInstance[];
  clearProject: () => void;
  exportZip: () => void;
}

// ============ Data Hub Types ============

export interface BuyerEntry {
  id: string;
  companyName: string;
  country: string;
  address: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: Date;
}

export interface ProductEntry {
  id: string;
  productName: string;
  category: string;
  skuCode: string;
  hsCode: string;
  unitPrice: number;
  netWeight: number;
  qtyPerCarton: number;
  inciText: string;
  createdAt: Date;
}

export interface CRMState {
  compliance: {
    byCountry: Record<string, CountryCompliance>;
  };
  buyerEntries: BuyerEntry[];
  productEntries: ProductEntry[];
}

export interface CRMActions {
  runCompliance: (params: { countries: TargetCountry[]; inciIngredients?: INCIIngredient[] }) => void;
  addBuyerEntry: (buyer: Omit<BuyerEntry, 'id' | 'createdAt'>) => void;
  removeBuyerEntry: (id: string) => void;
  addProductEntry: (product: Omit<ProductEntry, 'id' | 'createdAt'>) => void;
  updateProductEntry: (id: string, updates: Partial<Omit<ProductEntry, 'id' | 'createdAt'>>) => void;
  removeProductEntry: (id: string) => void;
}

// ============ Combined Store Type ============

export type AppState = AuthState & UIState & DocState & CRMState;

export type AppActions = AuthActions & UIActions & DocActions & CRMActions & {
  handleAction: (action: { type: string; payload?: any }) => void;
};

export type AppStore = AppState & AppActions;

// ============ Constants ============

export const COUNTRY_NAMES: Record<TargetCountry, string> = {
  'US': '미국', 'JP': '일본', 'EU': 'EU', 'HK': '홍콩', 'TW': '대만',
  'CN': '중국', 'VN': '베트남', 'ID': '인도네시아', 'MY': '말레이시아', 'TH': '태국', 'AU': '호주',
};

export const PRESET_LABELS: Record<StagePreset, string> = {
  'FIRST_PROPOSAL': '첫 제안',
  'SAMPLE': '샘플',
  'PURCHASE_ORDER': '본오더',
};

export const DOC_TILES: Record<StagePreset, Array<{ templateKey: string; title: string; titleKr: string; icon: string; description: string }>> = {
  'FIRST_PROPOSAL': [
    { templateKey: 'DECK_COMPANY_BRAND_15P', title: 'Company/Brand Deck', titleKr: '브랜드 소개서', icon: '🏢', description: '≤15p 회사/브랜드 소개' },
    { templateKey: 'CATALOG_15P', title: 'Product Catalog', titleKr: '제품 카탈로그', icon: '📚', description: '≤15p 제품 라인업' },
    { templateKey: 'COMPLIANCE_SNAPSHOT_15P', title: 'Compliance Snapshot', titleKr: '수출 준비 요약', icon: '✅', description: '국가별 규제 요약' },
    { templateKey: 'EMAIL_FIRST_OUTREACH', title: 'First Outreach Email', titleKr: '첫 제안 이메일', icon: '✉️', description: '바이어 접촉 메일' },
    { templateKey: 'EMAIL_FOLLOW_UP', title: 'Follow-up Email', titleKr: '후속 이메일', icon: '📧', description: '리마인더 메일' },
  ],
  'SAMPLE': [
    { templateKey: 'PI_SAMPLE', title: 'Sample PI', titleKr: '샘플 PI', icon: '📄', description: '샘플용 견적서' },
    { templateKey: 'PL_SAMPLE', title: 'Sample Packing List', titleKr: '샘플 포장명세서', icon: '📦', description: '포장 상세 내역' },
    { templateKey: 'EMAIL_SAMPLE', title: 'Sample Email', titleKr: '샘플 이메일', icon: '✉️', description: '발송/확인 메일' },
    { templateKey: 'MEMO_LABEL_CHECK', title: 'Label Check Memo', titleKr: '라벨 체크 메모', icon: '🏷️', description: '라벨/아트웍 확인' },
  ],
  'PURCHASE_ORDER': [
    { templateKey: 'PI_FINAL', title: 'Final PI', titleKr: '최종 PI', icon: '📄', description: '정식 견적서' },
    { templateKey: 'CONTRACT_SALES', title: 'Sales Contract', titleKr: '판매 계약서', icon: '📝', description: '거래 계약서' },
    { templateKey: 'INVOICE_COMMERCIAL', title: 'Commercial Invoice', titleKr: '상업 송장', icon: '💰', description: '인보이스' },
    { templateKey: 'PL_FINAL', title: 'Packing List', titleKr: '포장명세서', icon: '📦', description: '최종 포장 내역' },
    { templateKey: 'SHIPPING_INSTRUCTION', title: 'Shipping Instructions', titleKr: '선적 지시서', icon: '🚢', description: '포워더용 정보' },
    { templateKey: 'GATE_CROSSCHECK_PO', title: 'Cross-check Gate', titleKr: '실수 체크 게이트', icon: '🔍', description: '문서 간 검증' },
  ],
};
