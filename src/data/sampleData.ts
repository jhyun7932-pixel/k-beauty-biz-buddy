// 샘플 데이터 - K-뷰티 AI 무역비서

import type { 
  Company, 
  Product, 
  Ingredient, 
  DraftSummary, 
  Deal, 
  Document, 
  ValidationWarning,
  BuyerPackFile,
  ChecklistItem,
  EvidenceItem,
  BuyerGoal,
  SalesChannel,
} from '@/types';

// 샘플 회사
export const sampleCompany: Company = {
  id: 'sample-company-1',
  name: '글로우스킨 코스메틱',
  contact: 'export@glowskin.co.kr',
  logo: undefined,
  defaults: {
    moq: 500,
    leadTime: 20,
    incoterms: 'FOB',
    paymentTerms: 'T/T 30/70',
  },
};

// 샘플 성분 (비건 선세럼 SPF)
export const sampleIngredients1: Ingredient[] = [
  { id: 'ing-1', name: 'Water (Aqua)', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-2', name: 'Glycerin', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-3', name: 'Niacinamide', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-4', name: 'Titanium Dioxide', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-5', name: 'Zinc Oxide', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-6', name: 'Centella Asiatica Extract', confirmed: true, confidence: 'medium', needsReview: true },
  { id: 'ing-7', name: 'Hyaluronic Acid', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-8', name: 'Tocopheryl Acetate', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-9', name: 'Phenoxyethanol', confirmed: false, confidence: 'low', needsReview: true },
  { id: 'ing-10', name: 'Fragrance (Parfum)', confirmed: true, confidence: 'medium', needsReview: true },
];

// 샘플 성분 (알로에 수딩젤)
export const sampleIngredients2: Ingredient[] = [
  { id: 'ing-11', name: 'Aloe Barbadensis Leaf Juice', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-12', name: 'Glycerin', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-13', name: 'Carbomer', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-14', name: 'Triethanolamine', confirmed: true, confidence: 'medium', needsReview: true },
  { id: 'ing-15', name: 'Allantoin', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-16', name: 'Panthenol', confirmed: true, confidence: 'high', needsReview: false },
  { id: 'ing-17', name: 'Chlorphenesin', confirmed: false, confidence: 'low', needsReview: true },
];

// 샘플 제품
export const sampleProducts: Product[] = [
  {
    id: 'product-1',
    name: '비건 선세럼 SPF50+',
    category: '선케어',
    ingredientsRaw: 'Water, Glycerin, Niacinamide, Titanium Dioxide...',
    ingredientsConfirmed: sampleIngredients1,
    labelImages: [],
  },
  {
    id: 'product-2',
    name: '알로에 수딩젤 300ml',
    category: '스킨케어',
    ingredientsRaw: 'Aloe Barbadensis Leaf Juice (92%), Glycerin...',
    ingredientsConfirmed: sampleIngredients2,
    labelImages: [],
  },
];

// 샘플 바이어 리스트
export const sampleBuyers = [
  { id: 'buyer-1', name: 'Beauty Hub Ltd.', country: '홍콩', website: 'beautyhub.hk' },
  { id: 'buyer-2', name: 'K-Beauty Taiwan', country: '대만', website: 'kbeauty.tw' },
  { id: 'buyer-3', name: 'Seoul Cosmetics USA', country: '미국', website: 'seoulcos.us' },
  { id: 'buyer-4', name: 'Asia Beauty GmbH', country: 'EU (독일)', website: 'asiabeauty.de' },
  { id: 'buyer-5', name: 'Natural Beauty Vietnam', country: '베트남', website: 'naturalbeauty.vn' },
  { id: 'buyer-6', name: 'Sakura Imports', country: '일본', website: 'sakura-imports.jp' },
  { id: 'buyer-7', name: 'Indo Beauty Store', country: '인도네시아', website: 'indobeauty.id' },
  { id: 'buyer-8', name: 'Thai Glow', country: '태국', website: 'thaiglow.co.th' },
  { id: 'buyer-9', name: 'Aussie K-Beauty', country: '호주', website: 'aussiekbeauty.com.au' },
  { id: 'buyer-10', name: 'Shanghai Beauty Co.', country: '중국', website: 'shbeauty.cn' },
];

// 샘플 체크리스트
export const sampleChecklist: ChecklistItem[] = [
  { id: 'check-1', text: '제품 라벨 현지어 번역 필요', checked: false, category: '라벨링' },
  { id: 'check-2', text: 'INCI 명칭 확인 완료', checked: true, category: '성분' },
  { id: 'check-3', text: 'SPF 테스트 리포트 첨부', checked: true, category: '인증' },
  { id: 'check-4', text: '비건 인증서 준비', checked: false, category: '인증' },
  { id: 'check-5', text: '원산지 증명서(C/O) 발급', checked: false, category: '서류' },
];

// 샘플 근거/참고
export const sampleEvidence: EvidenceItem[] = [
  { 
    id: 'evd-1', 
    title: 'SPF50+ 자외선 차단 효과', 
    description: 'ISO 24444:2019 기준 테스트 완료',
    source: '한국화장품시험연구원'
  },
  { 
    id: 'evd-2', 
    title: '비건 포뮬러', 
    description: '동물성 원료 0%, 동물실험 미실시',
    source: '자체 검증'
  },
  { 
    id: 'evd-3', 
    title: '히알루론산 함량', 
    description: '저분자 히알루론산 0.1% 함유',
    source: '제품 사양서'
  },
];

// 샘플 수출 준비 요약
export const sampleSummary: DraftSummary = {
  signal: 'caution',
  checklist: sampleChecklist,
  evidence: sampleEvidence,
  confidence: 'medium',
};

// 샘플 딜 (경고 발생용 - 총액 불일치)
export const sampleDeal: Deal = {
  id: 'deal-1',
  buyerName: 'Beauty Hub Ltd.',
  buyerCountry: '홍콩',
  qty: 5000,
  unitPrice: 3.5,
  currency: 'USD',
  incoterms: 'FOB',
  paymentTerms: 'T/T 30/70',
  leadTime: 20,
  validity: '30 days',
  totalAmount: 17000, // 의도적 불일치: 5000 * 3.5 = 17,500이어야 함
};

// 샘플 PI 문서
export const samplePIDocument: Document = {
  id: 'doc-pi-1',
  type: 'PI',
  title: 'Proforma Invoice - PI-2026-001',
  content: `
PROFORMA INVOICE

Document No: PI-2026-001
Date: 2026-01-28
Valid Until: 2026-02-27

SELLER: 글로우스킨 코스메틱
Address: 서울특별시 강남구 테헤란로 123
Contact: export@glowskin.co.kr

BUYER: Beauty Hub Ltd.
Address: Unit 1201, Lippo Centre, Hong Kong
Contact: buyer@beautyhub.hk

PRODUCT DETAILS:
---------------------------------------------
Item: 비건 선세럼 SPF50+
Quantity: 5,000 pcs
Unit Price: USD 3.50
Total: USD 17,000.00

TERMS:
Incoterms: FOB Busan
Payment: T/T 30% deposit, 70% before shipment
Lead Time: 20 days from order confirmation
Validity: 30 days from issue date

BANK DETAILS:
Bank: Shinhan Bank
Account: 110-123-456789
SWIFT: SHBKKRSE
  `,
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 샘플 계약서 문서
export const sampleContractDocument: Document = {
  id: 'doc-contract-1',
  type: 'Contract',
  title: 'Sales Contract - SC-2026-001',
  content: `
SALES CONTRACT

Contract No: SC-2026-001
Date: 2026-01-28

BETWEEN:
글로우스킨 코스메틱 (Seller)
AND
Beauty Hub Ltd. (Buyer)

ARTICLE 1 - PRODUCT
비건 선세럼 SPF50+
Quantity: 5,000 units

ARTICLE 2 - PRICE & PAYMENT
Unit Price: USD 3.50 FOB Busan
Total Amount: USD 17,500.00
Payment Terms: T/T 30/70

ARTICLE 3 - DELIVERY
Shipment: Within 20 days after deposit
Port of Loading: Busan, Korea
Port of Destination: Hong Kong

ARTICLE 4 - QUALITY
Products shall conform to specifications
and samples approved by Buyer.

___________________    ___________________
Seller Signature       Buyer Signature
  `,
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// 샘플 경고 (실수 체크용)
export const sampleWarnings: ValidationWarning[] = [
  {
    id: 'warn-1',
    type: 'amount_mismatch',
    message: '총액이 계산과 다를 수 있어요. 수량×단가를 확인해 주세요.',
    field: 'totalAmount',
    suggestedFix: 'USD 17,500.00 (5,000 × $3.50)',
    severity: 'error',
  },
  {
    id: 'warn-2',
    type: 'condition_conflict',
    message: '문서끼리 조건이 달라요. (PI: USD 17,000 / 계약서: USD 17,500)',
    field: 'totalAmount',
    suggestedFix: '계약서 금액(USD 17,500)으로 PI 수정 권장',
    severity: 'warning',
  },
];

// 채널별 체크리스트 아이템 (한국어 기본값 - 다국어는 src/lib/i18n/translations.ts 참조)
export const CHANNEL_CHECKLISTS: Record<SalesChannel, string[]> = {
  online_market: [
    '핵심 문구/금지 표현 주의',
    '리스팅 이미지 컷 가이드 확인',
    '상품 FAQ 준비',
    '배송/반품 정책 확인',
    '플랫폼별 클레임 가이드라인',
  ],
  retail: [
    '마진 구조 확인',
    '프로모션 가능 여부',
    '진열 포인트 안내',
    '매대용 POP 자료',
    '입점 필수 서류 확인',
  ],
  distributor: [
    '도매단가표 준비',
    'MOQ/리드타임 명시',
    '독점 옵션 여부',
    '재고 보유 정책',
    '리오더 조건',
  ],
  d2c: [
    '브랜드 스토리 강조',
    '온라인 마케팅 자산',
    '고객 서비스 가이드',
    '결제/배송 설정',
  ],
};

// 채널별 배지 라벨 (한국어 기본값 - 다국어는 src/lib/i18n/translations.ts 참조)
export const CHANNEL_LABELS: Record<SalesChannel, string> = {
  distributor: '유통/도매',
  retail: '리테일(오프라인)',
  online_market: '온라인 마켓',
  d2c: 'D2C',
};

// 목표 기반 바이어 패키지 생성
export function generateBuyerPackFiles(goal: BuyerGoal): BuyerPackFile[] {
  const countryBadge = goal.countries.join('/');
  const channelBadge = goal.channel ? CHANNEL_LABELS[goal.channel] : '';
  
  const baseFiles: BuyerPackFile[] = [
    {
      id: 'pack-1',
      name: '브랜드 1장 소개서(One-page)',
      type: 'one_pager',
      ready: true,
      countryBadge,
      channelBadge,
    },
    {
      id: 'pack-2',
      name: '수출 준비 요약(신호등+확인할 것)',
      type: 'summary',
      ready: true,
      countryBadge,
      channelBadge,
    },
    {
      id: 'pack-3',
      name: '품질/인증 자료 정리본',
      type: 'quality_cert',
      ready: false,
      countryBadge,
      channelBadge,
    },
    {
      id: 'pack-4',
      name: '거래 조건 요약표(Deal Sheet)',
      type: 'terms',
      ready: true,
      countryBadge,
      channelBadge,
    },
    {
      id: 'pack-5',
      name: `이메일/답장 문구 세트(${goal.language})`,
      type: 'email_template',
      ready: true,
      countryBadge,
      channelBadge,
    },
  ];

  // 채널별 추가 체크리스트 파일
  if (goal.channel) {
    baseFiles.push({
      id: 'pack-channel',
      name: `${channelBadge} 체크리스트`,
      type: 'channel_checklist',
      ready: true,
      countryBadge,
      channelBadge,
    });
  }

  return baseFiles;
}

// 기본 샘플 바이어 패키지 파일 (호환용)
export const sampleBuyerPackFiles: BuyerPackFile[] = [
  {
    id: 'pack-1',
    name: '제품 1장 소개서(원페이지)',
    type: 'one_pager',
    ready: true,
  },
  {
    id: 'pack-2',
    name: '수출 준비 요약(신호등+확인할 것)',
    type: 'summary',
    ready: true,
  },
  {
    id: 'pack-3',
    name: '품질/인증 자료 정리본',
    type: 'quality_cert',
    ready: false,
  },
  {
    id: 'pack-4',
    name: '거래 조건 요약표',
    type: 'terms',
    ready: true,
  },
  {
    id: 'pack-5',
    name: '이메일/답장 문구 세트',
    type: 'email_template',
    ready: true,
  },
];

// 국가 선택 옵션
export const countryOptions = {
  detailed: ['미국', '대만', 'EU'],
  simple: ['중국', '일본', '베트남', '인도네시아', '말레이시아', '태국', '홍콩', '호주'],
};

// 빠른 명령어 (Quick Chips)
export const quickCommands = [
  '홍콩 바이어 패키지 만들어줘',
  'MOQ 300, 납기 20일로 반영해줘',
  'PI 만들기',
  '실수 체크하기',
];
