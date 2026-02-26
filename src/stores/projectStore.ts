import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Type Definitions ============
export type TargetCountry = 'US' | 'JP' | 'EU' | 'HK' | 'TW' | 'CN' | 'VN' | 'ID' | 'MY' | 'TH' | 'AU';
export type SalesChannel = '도매' | '리테일' | 'D2C' | '마켓플레이스';
export type BuyerType = '유통사' | '리셀러' | '플랫폼셀러' | '브랜드오너' | '수입대행';
export type TradeStagePreset = '첫제안' | '샘플' | '본오더';
export type Language = '한국어' | '영어' | '일본어' | '중국어';
export type Currency = 'USD' | 'JPY' | 'EUR' | 'HKD' | 'CNY' | 'KRW';
export type Incoterms = 'FOB' | 'CIF' | 'DDP' | 'EXW';
export type PaymentTerms = 'T/T 30/70' | 'L/C' | 'Escrow';

export type PipelineStage = '첫 제안 진행' | '샘플 검토' | '본 오더 및 계약' | '선적 및 통관' | '수출 완료';
export const PIPELINE_STAGES: PipelineStage[] = ['첫 제안 진행', '샘플 검토', '본 오더 및 계약', '선적 및 통관', '수출 완료'];

export interface ProjectContext {
  targetCountries: TargetCountry[];
  salesChannel: SalesChannel;
  buyerType: BuyerType;
  tradeStagePreset: TradeStagePreset;
  language: Language;
  currency: Currency;
  incotermsDefault: Incoterms;
  paymentDefault: PaymentTerms;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  swiftCode: string;
  accountHolder: string;
}

export interface CompanySettings {
  companyName: string;
  companyNameKr: string;
  ceoName: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  stampImageUrl: string;
  signatureImageUrl: string;
  introPdfUrl: string;
  introPdfName: string;
  exportCountries: TargetCountry[];
  certifications: string[];
  bankInfo: BankInfo | null;
  defaultMoq: number;
  defaultLeadTime: number;
  brandTone: '격식' | '친근';
  emailSignature: string;
}

export interface DocumentInstance {
  id: string;
  projectId: string;
  docKey: string;
  title: string;
  status: 'draft' | 'editing' | 'final';
  fields: Record<string, any>;
  html: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  context: ProjectContext;
  pipelineStage: PipelineStage;
  documents: DocumentInstance[];
  createdAt: Date;
  updatedAt: Date;
}

// ============ Document Key Definitions ============
export const DOC_KEYS_BY_PRESET: Record<TradeStagePreset, string[]> = {
  '첫제안': [
    'DOC_COMPANY_BRAND_DECK_15P',
    'DOC_PRODUCT_CATALOG_15P',
    'DOC_COMPLIANCE_SNAPSHOT_RULEPACK_15P',
    'DOC_OUTREACH_EMAIL_DRAFT',
  ],
  '샘플': [
    'DOC_SAMPLE_PI',
    'DOC_SAMPLE_PACKING_LIST',
    'DOC_SAMPLE_SHIPPING_INSTRUCTIONS',
    'DOC_SAMPLE_EMAIL_DRAFT',
  ],
  '본오더': [
    'DOC_FINAL_PI',
    'DOC_SALES_CONTRACT',
    'DOC_COMMERCIAL_INVOICE',
    'DOC_PACKING_LIST',
    'DOC_SHIPPING_INSTRUCTIONS',
    'DOC_CROSS_CHECK_REPORT',
  ],
};

export const DOC_METADATA: Record<string, { title: string; titleKr: string; icon: string; pages?: string; description: string }> = {
  'DOC_COMPANY_BRAND_DECK_15P': { title: 'Company/Brand Deck', titleKr: '브랜드 소개서', icon: '🏢', pages: '≤15p', description: '회사 및 브랜드 소개' },
  'DOC_PRODUCT_CATALOG_15P': { title: 'Product Catalog', titleKr: '제품 카탈로그', icon: '📚', pages: '≤15p', description: '제품 라인업 소개' },
  'DOC_COMPLIANCE_SNAPSHOT_RULEPACK_15P': { title: 'Compliance Snapshot', titleKr: '수출 준비 요약', icon: '✅', pages: '≤6p', description: '국가별 규제 체크리스트' },
  'DOC_OUTREACH_EMAIL_DRAFT': { title: 'Buyer Outreach Message', titleKr: '바이어 메시지', icon: '✉️', description: '이메일/링크드인 초안' },
  'DOC_SAMPLE_PI': { title: 'Sample Proforma Invoice', titleKr: '샘플 PI', icon: '📄', description: '샘플용 견적서' },
  'DOC_SAMPLE_PACKING_LIST': { title: 'Sample Packing List', titleKr: '샘플 포장명세서', icon: '📦', description: '포장 상세 내역' },
  'DOC_SAMPLE_SHIPPING_INSTRUCTIONS': { title: 'Sample Shipping Note', titleKr: '발송 안내문', icon: '🚚', description: '배송 추적/ETA 템플릿' },
  'DOC_SAMPLE_EMAIL_DRAFT': { title: 'Sample Follow-up Email', titleKr: '샘플 이메일', icon: '✉️', description: '샘플 발송 안내 이메일' },
  'DOC_FINAL_PI': { title: 'Final PI', titleKr: '최종 PI', icon: '📄', description: '정식 견적서' },
  'DOC_SALES_CONTRACT': { title: 'Sales Contract', titleKr: '판매 계약서', icon: '📝', pages: '≤12p', description: '거래 계약서' },
  'DOC_COMMERCIAL_INVOICE': { title: 'Commercial Invoice', titleKr: '상업 송장', icon: '💰', description: '인보이스 초안' },
  'DOC_PACKING_LIST': { title: 'Packing List (Final)', titleKr: '포장명세서', icon: '📦', description: '최종 포장 내역' },
  'DOC_SHIPPING_INSTRUCTIONS': { title: 'Shipping Instructions', titleKr: '선적 지시서', icon: '🚢', description: '포워더용 선적 정보' },
  'DOC_CROSS_CHECK_REPORT': { title: 'Cross-document Error Check', titleKr: '실수 체크 리포트', icon: '🔍', description: '문서 간 불일치 탐지' },
};

// ============ Country Display Names ============
export const COUNTRY_NAMES: Record<TargetCountry, string> = {
  'US': '미국',
  'JP': '일본',
  'EU': 'EU',
  'HK': '홍콩',
  'TW': '대만',
  'CN': '중국',
  'VN': '베트남',
  'ID': '인도네시아',
  'MY': '말레이시아',
  'TH': '태국',
  'AU': '호주',
};

// ============ Default Values ============
const DEFAULT_PROJECT_CONTEXT: ProjectContext = {
  targetCountries: [],
  salesChannel: '도매',
  buyerType: '유통사',
  tradeStagePreset: '첫제안',
  language: '영어',
  currency: 'USD',
  incotermsDefault: 'FOB',
  paymentDefault: 'T/T 30/70',
};

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: '',
  companyNameKr: '',
  ceoName: '',
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logoUrl: '',
  stampImageUrl: '',
  signatureImageUrl: '',
  introPdfUrl: '',
  introPdfName: '',
  exportCountries: [],
  certifications: [],
  bankInfo: null,
  defaultMoq: 500,
  defaultLeadTime: 14,
  brandTone: '격식',
  emailSignature: '',
};

// ============ Store Interface ============
interface ProjectStore {
  // Active project
  activeProjectId: string | null;
  projectContext: ProjectContext;
  companySettings: CompanySettings;
  
  // Projects list
  projects: Project[];
  
  // Active document
  activeDocumentId: string | null;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  hasSeenTour: boolean;
  
  // Actions - Context
  setProjectContext: (context: Partial<ProjectContext>) => void;
  resetProjectContext: () => void;
  
  // Actions - Company Settings
  setCompanySettings: (settings: Partial<CompanySettings>) => void;
  
  // Actions - Projects
  createProject: (name: string) => string;
  setActiveProject: (id: string | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectStage: (id: string, stage: PipelineStage) => void;
  deleteProject: (id: string) => void;
  
  // Actions - Documents
  createDocumentInstance: (projectId: string, docKey: string) => DocumentInstance | null;
  addDocumentToProject: (projectId: string, doc: Omit<DocumentInstance, 'projectId'>) => void;
  setActiveDocument: (id: string | null) => void;
  updateDocumentFields: (docId: string, fields: Record<string, any>) => void;
  updateDocumentHtml: (docId: string, html: string) => void;
  finalizeDocument: (docId: string) => void;
  getDocumentsForActiveProject: () => DocumentInstance[];
  
  // Actions - Onboarding
  setHasCompletedOnboarding: (value: boolean) => void;
  setHasSeenTour: (value: boolean) => void;
  
  // Helpers
  getActiveProject: () => Project | null;
  getActiveDocument: () => DocumentInstance | null;
}

// ============ Store Implementation ============
export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activeProjectId: null,
      projectContext: DEFAULT_PROJECT_CONTEXT,
      companySettings: DEFAULT_COMPANY_SETTINGS,
      projects: [],
      activeDocumentId: null,
      hasCompletedOnboarding: false,
      hasSeenTour: false,
      
      // Actions - Context
      setProjectContext: (context) => {
        set((state) => ({
          projectContext: { ...state.projectContext, ...context },
        }));
        // Also update active project context if exists
        const { activeProjectId, projects } = get();
        if (activeProjectId) {
          const updatedProjects = projects.map((p) =>
            p.id === activeProjectId
              ? { ...p, context: { ...p.context, ...context }, updatedAt: new Date() }
              : p
          );
          set({ projects: updatedProjects });
        }
      },
      
      resetProjectContext: () => set({ projectContext: DEFAULT_PROJECT_CONTEXT }),
      
      // Actions - Company Settings
      setCompanySettings: (settings) =>
        set((state) => ({
          companySettings: { ...state.companySettings, ...settings },
        })),
      
      // Actions - Projects
      createProject: (name) => {
        const id = `proj_${Date.now()}`;
        const newProject: Project = {
          id,
          name,
          context: get().projectContext,
          pipelineStage: '첫 제안 진행',
          documents: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }));
        return id;
      },
      
      setActiveProject: (id) => {
        set({ activeProjectId: id, activeDocumentId: null });
        if (id) {
          const project = get().projects.find((p) => p.id === id);
          if (project) {
            set({ projectContext: project.context });
          }
        }
      },
      
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),

      updateProjectStage: (id, stage) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, pipelineStage: stage, updatedAt: new Date() } : p
          ),
        })),
      
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),
      
      // Actions - Documents
      createDocumentInstance: (projectId, docKey) => {
        const { projects, projectContext, companySettings } = get();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
          console.error('Project not found:', projectId);
          return null;
        }
        
        const metadata = DOC_METADATA[docKey];
        if (!metadata) {
          console.error('Unknown doc key:', docKey);
          return null;
        }
        
        const id = `doc_${Date.now()}`;
        const fields = generateDefaultFields(docKey, projectContext, companySettings);
        const html = generateDocumentHtml(docKey, fields, metadata);
        
        const newDoc: DocumentInstance = {
          id,
          projectId,
          docKey,
          title: metadata.titleKr,
          status: 'draft',
          fields,
          html,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const updatedProjects = projects.map((p) =>
          p.id === projectId
            ? { ...p, documents: [...p.documents, newDoc], updatedAt: new Date() }
            : p
        );
        
        set({ projects: updatedProjects, activeDocumentId: id });
        console.log('Document created:', newDoc);
        return newDoc;
      },
      
      addDocumentToProject: (projectId, doc) => {
        const { projects } = get();
        const fullDoc: DocumentInstance = { ...doc, projectId };
        const updatedProjects = projects.map((p) =>
          p.id === projectId
            ? { ...p, documents: [...p.documents, fullDoc], updatedAt: new Date() }
            : p
        );
        set({ projects: updatedProjects });
      },
      
      setActiveDocument: (id) => set({ activeDocumentId: id }),
      
      updateDocumentFields: (docId, fields) => {
        const { projects } = get();
        const updatedProjects = projects.map((p) => ({
          ...p,
          documents: p.documents.map((d) => {
            if (d.id === docId) {
              const newFields = { ...d.fields, ...fields };
              const metadata = DOC_METADATA[d.docKey];
              const newHtml = generateDocumentHtml(d.docKey, newFields, metadata);
              return { ...d, fields: newFields, html: newHtml, updatedAt: new Date() };
            }
            return d;
          }),
        }));
        set({ projects: updatedProjects });
      },
      
      updateDocumentHtml: (docId, html) => {
        const { projects } = get();
        const updatedProjects = projects.map((p) => ({
          ...p,
          documents: p.documents.map((d) =>
            d.id === docId ? { ...d, html, updatedAt: new Date() } : d
          ),
        }));
        set({ projects: updatedProjects });
      },
      
      finalizeDocument: (docId) => {
        const { projects } = get();
        const updatedProjects = projects.map((p) => ({
          ...p,
          documents: p.documents.map((d) =>
            d.id === docId ? { ...d, status: 'final' as const, updatedAt: new Date() } : d
          ),
        }));
        set({ projects: updatedProjects });
      },
      
      getDocumentsForActiveProject: () => {
        const { activeProjectId, projects } = get();
        if (!activeProjectId) return [];
        const project = projects.find((p) => p.id === activeProjectId);
        return project?.documents || [];
      },
      
      // Actions - Onboarding
      setHasCompletedOnboarding: (value) => set({ hasCompletedOnboarding: value }),
      setHasSeenTour: (value) => set({ hasSeenTour: value }),
      
      // Helpers
      getActiveProject: () => {
        const { activeProjectId, projects } = get();
        return projects.find((p) => p.id === activeProjectId) || null;
      },
      
      getActiveDocument: () => {
        const { activeDocumentId, projects } = get();
        if (!activeDocumentId) return null;
        for (const project of projects) {
          const doc = project.documents.find((d) => d.id === activeDocumentId);
          if (doc) return doc;
        }
        return null;
      },
    }),
    {
      name: 'kbeauty-project-store',
      partialize: (state) => ({
        projects: state.projects,
        projectContext: state.projectContext,
        companySettings: state.companySettings,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasSeenTour: state.hasSeenTour,
      }),
    }
  )
);

// ============ Helper Functions ============
function generateDefaultFields(
  docKey: string,
  context: ProjectContext,
  company: CompanySettings
): Record<string, any> {
  const base = {
    language: context.language,
    currency: context.currency,
    targetCountries: context.targetCountries,
    salesChannel: context.salesChannel,
    buyerType: context.buyerType,
    incoterms: context.incotermsDefault,
    paymentTerms: context.paymentDefault,
    companyName: company.companyName || 'K-Beauty Co., Ltd.',
    companyNameKr: company.companyNameKr || '케이뷰티 주식회사',
    contactName: company.contactName || 'Export Manager',
    contactEmail: company.contactEmail || 'export@kbeauty.com',
    contactPhone: company.contactPhone || '+82-2-1234-5678',
    address: company.address || 'Seoul, South Korea',
    moq: company.defaultMoq || 500,
    leadTime: company.defaultLeadTime || 14,
    logoUrl: company.logoUrl || '',
    stampImageUrl: company.stampImageUrl || '',
    signatureImageUrl: company.signatureImageUrl || '',
    ceoName: company.ceoName || '',
    contactTitle: company.contactTitle || '',
  };

  switch (docKey) {
    case 'DOC_COMPANY_BRAND_DECK_15P':
      return {
        ...base,
        sections: ['회사 소개', '브랜드 철학', '제품 라인업', '인증 현황', '수출 실적', '연락처'],
        highlights: ['10년+ 화장품 제조 경력', 'CGMP/ISO 22716 인증', '50+ 글로벌 파트너'],
      };
    case 'DOC_PRODUCT_CATALOG_15P':
      return {
        ...base,
        categories: ['스킨케어', '메이크업', '헤어케어', '바디케어'],
        products: [
          { name: 'Hydra Serum', category: '스킨케어', unitPrice: 4.5, moq: 500 },
          { name: 'Glow Cream', category: '스킨케어', unitPrice: 5.2, moq: 300 },
        ],
      };
    case 'DOC_COMPLIANCE_SNAPSHOT_RULEPACK_15P':
      return {
        ...base,
        rulepacks: context.targetCountries.map((c) => ({
          country: c,
          status: 'review',
          items: getDefaultRulepackItems(c),
        })),
      };
    case 'DOC_SAMPLE_PI':
    case 'DOC_FINAL_PI':
      return {
        ...base,
        piNumber: `PI-${Date.now().toString().slice(-8)}`,
        validityDays: 30,
        items: [
          { sku: 'HS-001', name: 'Hydra Serum 30ml', qty: 100, unitPrice: 4.5, amount: 450 },
          { sku: 'GC-001', name: 'Glow Cream 50ml', qty: 100, unitPrice: 5.2, amount: 520 },
        ],
        totalAmount: 970,
        shippingCost: 150,
        grandTotal: 1120,
      };
    case 'DOC_SAMPLE_PACKING_LIST':
    case 'DOC_PACKING_LIST':
      return {
        ...base,
        items: [
          { sku: 'HS-001', name: 'Hydra Serum 30ml', qty: 100, cartons: 5, grossWeight: 15, netWeight: 12 },
          { sku: 'GC-001', name: 'Glow Cream 50ml', qty: 100, cartons: 5, grossWeight: 20, netWeight: 16 },
        ],
        totalCartons: 10,
        totalGrossWeight: 35,
        totalNetWeight: 28,
        dimensions: '60x40x50cm',
      };
    case 'DOC_SALES_CONTRACT':
      return {
        ...base,
        contractNumber: `SC-${Date.now().toString().slice(-8)}`,
        effectiveDate: new Date().toISOString().split('T')[0],
        terms: [
          '품질 보증: 제조일로부터 24개월',
          '클레임 기한: 수령 후 14일 이내',
          '준거법: 대한민국 법',
        ],
      };
    case 'DOC_COMMERCIAL_INVOICE':
      return {
        ...base,
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        items: [
          { sku: 'HS-001', name: 'Hydra Serum 30ml', qty: 100, unitPrice: 4.5, amount: 450 },
          { sku: 'GC-001', name: 'Glow Cream 50ml', qty: 100, unitPrice: 5.2, amount: 520 },
        ],
        totalAmount: 970,
      };
    default:
      return base;
  }
}

function getDefaultRulepackItems(country: TargetCountry): Array<{ item: string; status: string; note: string }> {
  const commonItems = [
    { item: '성분표 영문 표기', status: 'pending', note: 'INCI 명칭 확인 필요' },
    { item: '라벨 필수 항목', status: 'pending', note: '국가별 언어 요건 확인' },
  ];
  
  switch (country) {
    case 'US':
      return [
        ...commonItems,
        { item: 'FDA 등록/통지', status: 'pending', note: 'MoCRA 요건 확인' },
        { item: 'Drug/Cosmetic 분류', status: 'pending', note: '효능 표현 검토' },
      ];
    case 'JP':
      return [
        ...commonItems,
        { item: '후생노동성 신고', status: 'pending', note: '화장품 수입판매업 허가' },
        { item: '일본어 라벨', status: 'pending', note: '전성분 일본어 표기' },
      ];
    case 'EU':
      return [
        ...commonItems,
        { item: 'CPNP 등록', status: 'pending', note: 'EU 책임자 지정 필요' },
        { item: 'PIF 준비', status: 'pending', note: '제품정보파일 작성' },
      ];
    default:
      return commonItems;
  }
}

function generateDocumentHtml(
  docKey: string,
  fields: Record<string, any>,
  metadata: { title: string; titleKr: string }
): string {
  const { language, currency, companyName, contactEmail, contactPhone } = fields;
  
  const { logoUrl, stampImageUrl, signatureImageUrl, ceoName, contactTitle } = fields;
  
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Company Logo" style="max-height: 48px; max-width: 180px; object-fit: contain;" />`
    : '';

  const header = `
    <div style="border-bottom: 2px solid #1a365d; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="color: #1a365d; margin: 0; font-size: 24px;">${metadata.titleKr}</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">${metadata.title}</p>
      </div>
      ${logoHtml ? `<div>${logoHtml}</div>` : ''}
    </div>
  `;
  
  const companyInfo = `
    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #1a365d;">Seller / 수출자</h3>
      <p style="margin: 5px 0;"><strong>${companyName}</strong></p>
      <p style="margin: 5px 0;">${contactEmail} | ${contactPhone}</p>
    </div>
  `;

  switch (docKey) {
    case 'DOC_SAMPLE_PI':
    case 'DOC_FINAL_PI':
      return `
        <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          ${header}
          ${companyInfo}
          <div style="margin-bottom: 20px;">
            <p><strong>PI No.:</strong> ${fields.piNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Validity:</strong> ${fields.validityDays} days</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #1a365d; color: white;">
                <th style="padding: 10px; text-align: left;">SKU</th>
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: right;">Qty</th>
                <th style="padding: 10px; text-align: right;">Unit Price (${currency})</th>
                <th style="padding: 10px; text-align: right;">Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${fields.items?.map((item: any) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px;">${item.sku}</td>
                  <td style="padding: 10px;">${item.name}</td>
                  <td style="padding: 10px; text-align: right;">${item.qty}</td>
                  <td style="padding: 10px; text-align: right;">${item.unitPrice?.toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right;">${item.amount?.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc;">
                <td colspan="4" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>${currency} ${fields.totalAmount?.toFixed(2)}</strong></td>
              </tr>
              <tr style="background: #f8fafc;">
                <td colspan="4" style="padding: 10px; text-align: right;">Shipping (${fields.incoterms}):</td>
                <td style="padding: 10px; text-align: right;">${currency} ${fields.shippingCost?.toFixed(2)}</td>
              </tr>
              <tr style="background: #1a365d; color: white;">
                <td colspan="4" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
                <td style="padding: 10px; text-align: right;"><strong>${currency} ${fields.grandTotal?.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <h4 style="margin: 0 0 10px 0;">Terms & Conditions</h4>
            <p style="margin: 5px 0;"><strong>Payment:</strong> ${fields.paymentTerms}</p>
            <p style="margin: 5px 0;"><strong>Incoterms:</strong> ${fields.incoterms}</p>
            <p style="margin: 5px 0;"><strong>Lead Time:</strong> ${fields.leadTime} days after payment</p>
            <p style="margin: 5px 0;"><strong>MOQ:</strong> ${fields.moq} units per SKU</p>
          </div>
          <div style="margin-top: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #1a365d;">Authorized Signature</h4>
            <div style="display: flex; gap: 40px; align-items: flex-end;">
              <div style="flex: 1;">
                <p style="margin: 5px 0; color: #666; font-size: 13px;"><strong>${companyName}</strong></p>
                ${ceoName ? `<p style="margin: 3px 0; color: #666; font-size: 13px;">${ceoName}</p>` : ''}
                <div style="margin-top: 10px; min-height: 60px; display: flex; gap: 16px; align-items: center;">
                  ${signatureImageUrl ? `<img src="${signatureImageUrl}" alt="Signature" style="max-height: 50px; max-width: 150px; object-fit: contain;" />` : '<div style="border-bottom: 1px solid #999; width: 150px; height: 50px;"></div>'}
                  ${stampImageUrl ? `<img src="${stampImageUrl}" alt="Company Stamp" style="max-height: 60px; max-width: 60px; object-fit: contain;" />` : ''}
                </div>
              </div>
              <div style="flex: 1;">
                <p style="margin: 5px 0; color: #666; font-size: 13px;">Date: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
    case 'DOC_COMPANY_BRAND_DECK_15P':
      return `
        <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          ${header}
          <div style="text-align: center; padding: 40px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; margin-bottom: 30px;">
            <h2 style="margin: 0; font-size: 32px;">${companyName}</h2>
            <p style="margin: 10px 0 0 0; font-size: 18px;">K-Beauty Excellence Partner</p>
          </div>
          ${fields.sections?.map((section: string, i: number) => `
            <div style="margin-bottom: 25px; padding: 20px; background: ${i % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3 style="color: #1a365d; margin: 0 0 10px 0;">${section}</h3>
              <p style="color: #666; margin: 0;">Section content will be customized based on your company information.</p>
            </div>
          `).join('') || ''}
          <div style="background: #1a365d; color: white; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h4 style="margin: 0 0 15px 0;">Why Choose Us?</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${fields.highlights?.map((h: string) => `<li style="margin: 5px 0;">${h}</li>`).join('') || ''}
            </ul>
          </div>
        </div>
      `;
      
    case 'DOC_PRODUCT_CATALOG_15P':
      return `
        <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          ${header}
          ${companyInfo}
          <h3 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Product Categories</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
            ${fields.categories?.map((cat: string) => `
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
                <span style="font-size: 24px;">📦</span>
                <p style="margin: 10px 0 0 0; font-weight: 500;">${cat}</p>
              </div>
            `).join('') || ''}
          </div>
          <h3 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Featured Products</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #1a365d; color: white;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: left;">Category</th>
                <th style="padding: 10px; text-align: right;">Unit Price (${currency})</th>
                <th style="padding: 10px; text-align: right;">MOQ</th>
              </tr>
            </thead>
            <tbody>
              ${fields.products?.map((p: any) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px;">${p.name}</td>
                  <td style="padding: 10px;">${p.category}</td>
                  <td style="padding: 10px; text-align: right;">${p.unitPrice?.toFixed(2)}</td>
                  <td style="padding: 10px; text-align: right;">${p.moq}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>
      `;
      
    case 'DOC_COMPLIANCE_SNAPSHOT_RULEPACK_15P':
      return `
        <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          ${header}
          ${companyInfo}
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e;">⚠️ This is a preliminary compliance check. Please consult with regulatory experts for final confirmation.</p>
          </div>
          ${fields.rulepacks?.map((rp: any) => `
            <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: #1a365d; color: white; padding: 15px;">
                <h3 style="margin: 0;">${COUNTRY_NAMES[rp.country as TargetCountry] || rp.country} Compliance</h3>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: center;">Status</th>
                    <th style="padding: 10px; text-align: left;">Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${rp.items?.map((item: any) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 10px;">${item.item}</td>
                      <td style="padding: 10px; text-align: center;">
                        <span style="background: ${item.status === 'ok' ? '#dcfce7' : item.status === 'pending' ? '#fef3c7' : '#fee2e2'}; 
                              color: ${item.status === 'ok' ? '#166534' : item.status === 'pending' ? '#92400e' : '#991b1b'};
                              padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                          ${item.status === 'ok' ? '✓ OK' : item.status === 'pending' ? '⏳ 확인필요' : '✗ 불가'}
                        </span>
                      </td>
                      <td style="padding: 10px; color: #666;">${item.note}</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>
          `).join('') || ''}
        </div>
      `;
      
    default:
      return `
        <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 800px; margin: 0 auto;">
          ${header}
          ${companyInfo}
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: #666;">Document template will be generated based on your project context.</p>
            <p style="color: #1a365d; font-weight: 500;">Target: ${fields.targetCountries?.map((c: TargetCountry) => COUNTRY_NAMES[c]).join(', ') || 'Not specified'}</p>
            <p style="color: #1a365d;">Channel: ${fields.salesChannel} | Stage: ${fields.tradeStagePreset}</p>
          </div>
        </div>
      `;
  }
}
