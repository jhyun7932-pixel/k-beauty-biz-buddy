// ============ Compliance RulePack Data by Country ============

export interface ComplianceCheckItem {
  id: string;
  status: 'pass' | 'warn' | 'fail';
  category: string;
  title: string;
  detail: string;
  actionItem: string;
  actionType?: 'guide' | 'doc' | 'manual' | 'info';
  completed: boolean;
}

export interface CountryRulePack {
  countryCode: string;
  countryName: string;
  regulation: string;
  items: ComplianceCheckItem[];
}

// Simulated OCR INCI result
export const MOCK_INCI_LIST = [
  'Water', 'Glycerin', 'Butylene Glycol', 'Niacinamide', 'Sodium Hyaluronate',
  'Centella Asiatica Extract', 'Panthenol', 'Allantoin', 'Carbomer',
  'Triethanolamine', 'Phenoxyethanol', 'Ethylhexylglycerin', 'Fragrance',
  'Retinol', 'Hydroquinone', 'CI 77491',
];

export const RULEPACK_DATA: Record<string, CountryRulePack> = {
  US: {
    countryCode: 'US',
    countryName: '미국',
    regulation: 'FDA MoCRA (2022)',
    items: [
      { id: 'us-1', status: 'fail', category: '금지 성분', title: 'Hydroquinone 2% 초과 사용 금지', detail: 'FDA OTC Drug 분류. 화장품에 사용 불가.', actionItem: '📋 대체 성분 리스트 보기 (Arbutin, Niacinamide 등 허용 미백 성분)', actionType: 'guide', completed: false },
      { id: 'us-2', status: 'warn', category: '표시 사항', title: 'Fragrance 알레르겐 개별 표기 권장', detail: 'MoCRA 시행 후 개별 향료 성분 공개 권장.', actionItem: '🔍 상세 규정 원문 보기 (MoCRA Section 604)', actionType: 'info', completed: false },
      { id: 'us-3', status: 'pass', category: '시설 등록', title: 'FDA 시설 등록 완료', detail: 'MoCRA 의무 시설 등록 확인.', actionItem: '📋 필요 인증 목록: FDA 시설등록, SPF 테스트(해당 시)', actionType: 'info', completed: false },
      { id: 'us-4', status: 'pass', category: '라벨링', title: '영문 전성분 표기', detail: 'INCI 기준 함량순 표기 완료.', actionItem: '-', actionType: 'manual', completed: false },
      { id: 'us-5', status: 'warn', category: '클레임', title: '"Anti-aging" 클레임 검토 필요', detail: 'Drug claim으로 분류될 수 있음.', actionItem: '📋 추가 검토 체크리스트: Drug vs Cosmetic 클레임 구분표', actionType: 'guide', completed: false },
      { id: 'us-6', status: 'fail', category: '색소', title: 'CI 77491 FDA 인증 확인 필요', detail: 'FDA Batch Certification 대상 색소.', actionItem: '🏛️ 인증 기관 정보: FDA Color Certification 신청 절차 안내', actionType: 'info', completed: false },
    ],
  },
  EU: {
    countryCode: 'EU',
    countryName: 'EU',
    regulation: 'EU Cosmetics Regulation (EC) No 1223/2009',
    items: [
      { id: 'eu-1', status: 'fail', category: '금지 성분', title: 'Retinol 농도 제한 (0.3% face)', detail: 'EU SCCS 권고에 따라 얼굴용 0.3% 제한.', actionItem: '📐 허용 함량 기준: Face 0.3%, Body 0.5%. ✏️ 처방전 수정 가이드 확인', actionType: 'guide', completed: false },
      { id: 'eu-2', status: 'warn', category: '알레르겐', title: 'Fragrance 26종 알레르겐 개별 표기 의무', detail: 'Annex III에 따른 의무 표기.', actionItem: '📝 현지어 라벨링 가이드: EU 26종 알레르겐 INCI 표기 형식', actionType: 'guide', completed: false },
      { id: 'eu-3', status: 'pass', category: 'CPNP 등록', title: 'CPNP 제품 등록', detail: 'EU 내 유통 전 CPNP 등록 필수.', actionItem: '📋 필요 인증 목록: CPNP 등록, RP 지정, PIF 구성', actionType: 'info', completed: false },
      { id: 'eu-4', status: 'pass', category: 'RP 지정', title: 'Responsible Person(RP) 지정', detail: 'EU 내 RP 지정 필수.', actionItem: '🏛️ 인증 기관: EU RP 대행 업체 목록 및 비용 안내', actionType: 'info', completed: false },
      { id: 'eu-5', status: 'warn', category: 'PIF', title: 'Product Information File 준비', detail: 'CPSR, 안정성 시험 등 포함.', actionItem: '📋 추가 검토 체크리스트: PIF 필수 구성 서류 8종 목록', actionType: 'guide', completed: false },
    ],
  },
  JP: {
    countryCode: 'JP',
    countryName: '일본',
    regulation: '약기법 (薬機法)',
    items: [
      { id: 'jp-1', status: 'pass', category: '분류', title: '화장품/의약부외품 분류 확인', detail: '기능성 클레임에 따라 분류 상이.', actionItem: '💡 유사 사례 참고: 미백/주름개선은 의약부외품 분류', actionType: 'info', completed: false },
      { id: 'jp-2', status: 'warn', category: '표시', title: '일본어 라벨 의무', detail: '수입화장품 일본어 표기 의무.', actionItem: '📝 현지어 라벨링 가이드: 일본어 전성분 표기 형식 + 제조국/수입자 필수', actionType: 'guide', completed: false },
      { id: 'jp-3', status: 'fail', category: '금지 성분', title: 'Hydroquinone 화장품 사용 금지', detail: '일본 내 화장품 배합 금지 성분.', actionItem: '📋 대체 성분 리스트: Tranexamic Acid, Arbutin (의약부외품 허가 시 사용 가능)', actionType: 'guide', completed: false },
      { id: 'jp-4', status: 'pass', category: '수입 신고', title: '화장품 수입 신고 절차', detail: '후생노동성 수입 신고.', actionItem: '🏛️ 인증 기관: 후생노동성 화장품 수입 신고 절차 안내', actionType: 'info', completed: false },
      { id: 'jp-5', status: 'warn', category: '방부제', title: 'Phenoxyethanol 1% 이하 확인', detail: '배합 한도 1% 이하.', actionItem: '📐 허용 함량 기준: 1% 이하. 🧪 허용 범위 내 대체 농도 0.8% 권장', actionType: 'guide', completed: false },
    ],
  },
  CN: {
    countryCode: 'CN',
    countryName: '중국',
    regulation: '화장품감독관리조례 (2021)',
    items: [
      { id: 'cn-1', status: 'fail', category: 'NMPA 등록', title: 'NMPA 일반화장품 비안 등록', detail: '중국 수출 시 NMPA 비안 등록 필수.', actionItem: '📋 필요 인증 목록 및 취득 절차: NMPA 비안 등록 (3~6개월 소요)', actionType: 'info', completed: false },
      { id: 'cn-2', status: 'warn', category: '동물실험', title: '동물실험 면제 조건 확인', detail: '2021년 이후 일반화장품 동물실험 면제 조건 신설.', actionItem: '📋 추가 검토 체크리스트: 동물실험 면제 4가지 조건 확인', actionType: 'guide', completed: false },
      { id: 'cn-3', status: 'warn', category: '라벨', title: '중문 라벨 표기', detail: '중국어 전성분/사용법 표기 의무.', actionItem: '📝 현지어 라벨링 가이드: 중문 전성분 표기 형식 (GB 5296.3 기준)', actionType: 'guide', completed: false },
      { id: 'cn-4', status: 'pass', category: '성분', title: 'IECIC 등재 성분 확인', detail: '이미 등재된 성분(IECIC)인지 확인.', actionItem: '🔍 상세 규정 원문 보기: IECIC 2021년 개정판 성분 검색', actionType: 'info', completed: false },
    ],
  },
  TH: {
    countryCode: 'TH',
    countryName: '태국',
    regulation: 'Cosmetic Act B.E. 2558 (2015)',
    items: [
      { id: 'th-1', status: 'fail', category: '등록', title: 'Thai FDA 화장품 등록(CBP)', detail: '수입 화장품은 Thai FDA 등록 필수.', actionItem: '📋 필요 인증 목록: Thai FDA CBP 등록 (현지 에이전트 필수)', actionType: 'info', completed: false },
      { id: 'th-2', status: 'warn', category: '라벨', title: '태국어 라벨 표기 의무', detail: '전성분, 사용법, 제조일/유통기한 태국어 표기.', actionItem: '📝 현지어 라벨링 가이드: 태국어 의무 표기 항목 5종', actionType: 'guide', completed: false },
      { id: 'th-3', status: 'warn', category: '금지 성분', title: 'Hydroquinone 2% 초과 금지', detail: '미백 화장품 2% 이하 허용, 초과 시 의약품 분류.', actionItem: '📐 허용 함량 기준: 2% 이하. 🧪 대체 미백 성분 검토', actionType: 'guide', completed: false },
      { id: 'th-4', status: 'pass', category: '수입 허가', title: '수입업체 라이선스', detail: 'Cosmetic Importer License 필요.', actionItem: '🏛️ 인증 기관: Thai FDA 수입업체 라이선스 발급 절차', actionType: 'info', completed: false },
      { id: 'th-5', status: 'warn', category: '클레임', title: '미백/안티에이징 클레임 제한', detail: '의약품 클레임 해당 여부 검토 필요.', actionItem: '📋 추가 검토 체크리스트: 허용/금지 마케팅 클레임 구분', actionType: 'guide', completed: false },
    ],
  },
  VN: {
    countryCode: 'VN',
    countryName: '베트남',
    regulation: 'Decree 93/2016/ND-CP',
    items: [
      { id: 'vn-1', status: 'fail', category: '등록', title: 'DAV 화장품 공고(Notification)', detail: '베트남 수출 시 DAV 공고 등록 필수.', actionItem: '📋 필요 인증 목록: DAV Notification + CFS + GMP 인증서', actionType: 'info', completed: false },
      { id: 'vn-2', status: 'warn', category: '라벨', title: '베트남어 라벨 표기', detail: '베트남어로 제품명, 성분, 사용법 표기 의무.', actionItem: '📝 현지어 라벨링 가이드: 베트남어 의무 표기 항목', actionType: 'guide', completed: false },
      { id: 'vn-3', status: 'warn', category: '성분', title: 'ASEAN 화장품 지침 성분 제한', detail: 'ASEAN Cosmetic Directive 기준 금지/제한 성분 목록 적용.', actionItem: '🔍 상세 규정 원문 보기: ASEAN Cosmetic Directive Annex II/III', actionType: 'info', completed: false },
      { id: 'vn-4', status: 'pass', category: 'CFS', title: '자유판매증명서(CFS) 준비', detail: '수출국 발행 CFS 제출 필요.', actionItem: '🏛️ 인증 기관: MFDS(식약처) CFS 발급 신청 (2~3주 소요)', actionType: 'info', completed: false },
      { id: 'vn-5', status: 'warn', category: 'GMP', title: 'ISO 22716 GMP 인증', detail: '제조시설 GMP 인증서 요구.', actionItem: '📋 필요 인증 목록: ISO 22716 또는 CGMP 인증서', actionType: 'info', completed: false },
    ],
  },
  ID: {
    countryCode: 'ID',
    countryName: '인도네시아',
    regulation: 'BPOM Regulation',
    items: [
      { id: 'id-1', status: 'fail', category: 'BPOM 등록', title: 'BPOM 화장품 등록', detail: '인도네시아 수출 시 BPOM(식약청) 등록 필수.', actionItem: '📋 필요 인증 목록 및 취득 절차: BPOM 등록 (6~12개월)', actionType: 'info', completed: false },
      { id: 'id-2', status: 'fail', category: '할랄', title: 'Halal 인증 필수', detail: '2024년부터 화장품 할랄 인증 의무화.', actionItem: '🏛️ 인증 기관: MUI/BPJPH 할랄 인증 + ⏱️ 예상 기간 6~9개월', actionType: 'info', completed: false },
      { id: 'id-3', status: 'warn', category: '라벨', title: '인도네시아어 라벨 표기', detail: 'Bahasa Indonesia로 전성분, 사용법 표기.', actionItem: '📝 현지어 라벨링 가이드: Bahasa Indonesia 의무 표기 형식', actionType: 'guide', completed: false },
      { id: 'id-4', status: 'warn', category: '성분', title: '알코올 성분 Halal 적합성', detail: '에탄올 등 알코올 성분 할랄 적합성 확인.', actionItem: '📊 동일 효능 허용 성분 비교표: 할랄 적합 대체 용매 목록', actionType: 'guide', completed: false },
      { id: 'id-5', status: 'pass', category: 'GMP', title: 'CPKB (GMP) 인증', detail: 'ASEAN GMP 기준 제조시설 인증.', actionItem: '📋 필요 인증: ASEAN CGMP 인증서 (CPKB)', actionType: 'info', completed: false },
    ],
  },
  MY: {
    countryCode: 'MY',
    countryName: '말레이시아',
    regulation: 'Control of Drugs and Cosmetics Regulations',
    items: [
      { id: 'my-1', status: 'fail', category: '등록', title: 'NPRA 화장품 Notification', detail: '말레이시아 NPRA 등록 필수.', actionItem: '📋 필요 인증 목록: NPRA Notification + 현지 Licence Holder', actionType: 'info', completed: false },
      { id: 'my-2', status: 'warn', category: '라벨', title: 'Bahasa Melayu 라벨 표기', detail: '말레이어 라벨 표기 의무.', actionItem: '📝 현지어 라벨링 가이드: Bahasa Melayu 의무 표기 양식', actionType: 'guide', completed: false },
      { id: 'my-3', status: 'warn', category: '할랄', title: 'Halal 인증 권장', detail: '의무는 아니나 시장 진입 시 강력 권장.', actionItem: '🏛️ 인증 기관: JAKIM 할랄 인증 신청 절차 + ⏱️ 3~6개월', actionType: 'info', completed: false },
      { id: 'my-4', status: 'pass', category: '성분', title: 'ASEAN 성분 기준 적합', detail: 'ASEAN Cosmetic Directive 준수.', actionItem: '✅ 올바른 표기 예시: ASEAN INCI 표기 기준 확인됨', actionType: 'info', completed: false },
    ],
  },
  TW: {
    countryCode: 'TW',
    countryName: '대만',
    regulation: '화장품위생관리조례',
    items: [
      { id: 'tw-1', status: 'warn', category: '등록', title: 'TFDA 특정용도화장품 등록', detail: '미백, 자외선차단 등 특정용도 제품은 허가 필요.', actionItem: '📋 추가 검토 체크리스트: 특정용도 13종 해당 여부 확인', actionType: 'guide', completed: false },
      { id: 'tw-2', status: 'warn', category: '라벨', title: '중문(번체) 라벨 표기', detail: '번체 중국어 전성분 및 사용법 표기 의무.', actionItem: '📝 현지어 라벨링 가이드: 번체 중문 전성분 표기 양식', actionType: 'guide', completed: false },
      { id: 'tw-3', status: 'pass', category: 'GMP', title: 'GMP 인증', detail: '제조시설 GMP 인증 필요.', actionItem: '📋 필요 인증: ISO 22716 또는 CGMP', actionType: 'info', completed: false },
      { id: 'tw-4', status: 'pass', category: '수입', title: '수입업 허가', detail: '현지 수입업체 사업자 등록 확인.', actionItem: '-', actionType: 'manual', completed: false },
    ],
  },
  AU: {
    countryCode: 'AU',
    countryName: '호주',
    regulation: 'Industrial Chemicals Act 2019',
    items: [
      { id: 'au-1', status: 'warn', category: '등록', title: 'AICIS 화학물질 등록', detail: '신규 화학물질은 AICIS 등록 필요.', actionItem: '📋 추가 검토 체크리스트: AICIS 기등재 성분 목록 대조', actionType: 'guide', completed: false },
      { id: 'au-2', status: 'pass', category: '라벨', title: '영문 라벨 표기', detail: '호주는 영문 라벨 그대로 사용 가능.', actionItem: '-', actionType: 'manual', completed: false },
      { id: 'au-3', status: 'warn', category: '성분', title: 'Poisons Standard 성분 확인', detail: 'TGA Poisons Standard 해당 성분 확인.', actionItem: '🔍 상세 규정 원문 보기: TGA Poisons Standard Schedule 5/6', actionType: 'info', completed: false },
      { id: 'au-4', status: 'pass', category: 'SPF', title: 'TGA 자외선차단 규제', detail: 'SPF 제품은 TGA therapeutic good 등록.', actionItem: '💡 유사 사례 참고: SPF 15이상은 TGA 등록 대상', actionType: 'info', completed: false },
    ],
  },
  HK: {
    countryCode: 'HK',
    countryName: '홍콩',
    regulation: '약품조례/소비자안전조례',
    items: [
      { id: 'hk-1', status: 'pass', category: '등록', title: '별도 등록 불필요', detail: '홍콩은 화장품 별도 등록 의무 없음.', actionItem: '-', actionType: 'manual', completed: false },
      { id: 'hk-2', status: 'warn', category: '라벨', title: '중문/영문 라벨 표기', detail: '중문 또는 영문 라벨 표기 권장.', actionItem: '📝 현지어 라벨링 가이드: 중문(번체)/영문 병기 권장', actionType: 'guide', completed: false },
      { id: 'hk-3', status: 'pass', category: '성분', title: '금지 성분 규제', detail: '국제 기준 준용, 별도 금지 목록 적음.', actionItem: '-', actionType: 'manual', completed: false },
    ],
  },
};

// ─── INCI 기반 동적 규제 오버라이드 엔진 ─────────────────────────────────
// 특정 성분이 INCI 목록에 있으면 해당 아이템 상태를 'fail'로 오버라이드

export interface IngredientRule {
  inci: string;              // INCI 이름 (대소문자 무관)
  itemIds: string[];         // 영향받는 RulePack item ID 목록
  overrideStatus: 'fail' | 'warn';
  detectedDetail: string;    // 감지 시 상세 설명
}

export const INCI_INGREDIENT_RULES: IngredientRule[] = [
  {
    inci: 'Hydroquinone',
    itemIds: ['us-1', 'jp-3', 'th-3'],
    overrideStatus: 'fail',
    detectedDetail: '⚠️ INCI에서 Hydroquinone 감지됨 — 해당 국가 화장품 사용 금지/제한 성분입니다.',
  },
  {
    inci: 'Retinol',
    itemIds: ['eu-1'],
    overrideStatus: 'fail',
    detectedDetail: '⚠️ INCI에서 Retinol 감지됨 — EU 얼굴용 0.3% 농도 제한 (SCCS 권고).',
  },
  {
    inci: 'CI 77491',
    itemIds: ['us-6'],
    overrideStatus: 'fail',
    detectedDetail: '⚠️ INCI에서 CI 77491 감지됨 — FDA Batch Certification 필요.',
  },
  {
    inci: 'Fragrance',
    itemIds: ['us-2', 'eu-2'],
    overrideStatus: 'warn',
    detectedDetail: '⚠️ INCI에서 Fragrance 감지됨 — 개별 알레르겐 표기 검토 필요.',
  },
  {
    inci: 'Phenoxyethanol',
    itemIds: ['jp-5'],
    overrideStatus: 'warn',
    detectedDetail: '⚠️ INCI에서 Phenoxyethanol 감지됨 — 일본 배합 한도 1% 이하 확인 필요.',
  },
  {
    inci: 'Triethanolamine',
    itemIds: ['eu-5'],
    overrideStatus: 'warn',
    detectedDetail: '⚠️ INCI에서 Triethanolamine 감지됨 — EU PIF에 안전성 자료 포함 권장.',
  },
];

/**
 * INCI 텍스트를 기반으로 각 국가 RulePack 아이템 상태를 동적으로 계산해 반환.
 * 원본 RULEPACK_DATA를 변형하지 않고 새 객체로 반환.
 */
export function computeDynamicRulePack(
  countryCode: string,
  inciText: string
): CountryRulePack | null {
  const base = RULEPACK_DATA[countryCode];
  if (!base) return null;

  if (!inciText || !inciText.trim()) return base;

  const inciList = inciText.split(',').map(s => s.trim().toLowerCase());

  // 감지된 성분으로 오버라이드할 itemId → rule 맵 구성
  const overrideMap: Record<string, { status: 'fail' | 'warn'; detail: string }> = {};

  INCI_INGREDIENT_RULES.forEach(rule => {
    const detected = inciList.some(ing => ing.includes(rule.inci.toLowerCase()));
    if (detected) {
      rule.itemIds.forEach(itemId => {
        // 이미 오버라이드된 경우 fail 우선
        const existing = overrideMap[itemId];
        if (!existing || rule.overrideStatus === 'fail') {
          overrideMap[itemId] = { status: rule.overrideStatus, detail: rule.detectedDetail };
        }
      });
    }
  });

  const dynamicItems = base.items.map(item => {
    const override = overrideMap[item.id];
    if (!override) return item;
    return {
      ...item,
      status: override.status,
      detail: override.detail + '\n\n원래 설명: ' + item.detail,
    };
  });

  return { ...base, items: dynamicItems };
}

// ─── 수출 가능 국가 계산 (동적) ──────────────────────────────────────────
export function getExportableCountries(inciText: string): string[] {
  if (!inciText || !inciText.trim()) return [];

  return Object.keys(RULEPACK_DATA).filter(cc => {
    const dynamic = computeDynamicRulePack(cc, inciText);
    if (!dynamic) return false;
    return dynamic.items.every(item => item.status !== 'fail');
  });
}

// Get RulePack for a given country, fallback to generic
export function getRulePackForCountry(countryCode: string): CountryRulePack | null {
  return RULEPACK_DATA[countryCode] || null;
}

// Exportable countries list (국가명 맵핑 포함)
export const ALL_RULEPACK_COUNTRIES = Object.keys(RULEPACK_DATA);
