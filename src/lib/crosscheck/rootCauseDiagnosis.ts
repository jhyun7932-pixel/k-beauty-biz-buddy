// Root Cause Diagnosis Engine for Cross-check Findings
// Analyzes WHY mismatches occurred and provides actionable resolutions

import type { CrossCheckFinding, DocumentKey, CanonicalFields, DocumentSet } from './crossCheckEngine';

// Cause template definition
export interface CauseTemplate {
  causeId: string;
  label: string;
  labelEn: string;
  probability: number; // 0-1
  evidence: string[];
}

// Root cause templates by finding type
const ROOT_CAUSE_TEMPLATES: Record<string, CauseTemplate[]> = {
  INCOTERMS_MISMATCH: [
    {
      causeId: 'INCO_C1',
      label: '초기 제안(FOB) → 본오더 협상 중 CIF로 변경, 한 문서만 업데이트',
      labelEn: 'Initial proposal (FOB) changed to CIF during negotiation, only one document updated',
      probability: 0.6,
      evidence: ['PI와 계약서 인코텀즈가 다름', '최신 문서가 협상 조건 반영'],
    },
    {
      causeId: 'INCO_C2',
      label: '바이어가 DDP 요구했으나 PI만 반영',
      labelEn: 'Buyer requested DDP but only PI was updated',
      probability: 0.25,
      evidence: ['계약서에 DDP 미반영', '배송 조건 변경 요청 이력'],
    },
    {
      causeId: 'INCO_C3',
      label: '채널(아마존/FBA) 기준 terms 문구가 섞임',
      labelEn: 'Channel-specific terms (Amazon/FBA) mixed in documents',
      probability: 0.15,
      evidence: ['복수 채널 바이어', 'FBA 관련 조건 언급'],
    },
  ],
  PAYMENT_MISMATCH: [
    {
      causeId: 'PAY_C1',
      label: 'T/T 30/70 → L/C 검토 중, 계약서만 변경',
      labelEn: 'T/T 30/70 under review for L/C, only contract updated',
      probability: 0.5,
      evidence: ['PI와 계약서 결제조건 상이', '결제 협상 진행 중'],
    },
    {
      causeId: 'PAY_C2',
      label: '샘플 주문 조건(선결제)과 본오더 조건 혼재',
      labelEn: 'Sample order terms (prepayment) mixed with bulk order terms',
      probability: 0.35,
      evidence: ['샘플 오더와 본오더 조건 혼재', '문서 간 주문 단계 불일치'],
    },
    {
      causeId: 'PAY_C3',
      label: '수수료/커미션(에이전시) 포함 여부 차이',
      labelEn: 'Commission/agency fee inclusion differs between documents',
      probability: 0.15,
      evidence: ['에이전시 수수료 관련 표기 차이'],
    },
  ],
  CURRENCY_MISMATCH: [
    {
      causeId: 'CUR_C1',
      label: '견적은 USD, 계약서는 JPY/EUR로 협상',
      labelEn: 'Quote in USD, contract negotiated in JPY/EUR',
      probability: 0.6,
      evidence: ['바이어 국가 통화와 견적 통화 불일치', '환율 협상 진행'],
    },
    {
      causeId: 'CUR_C2',
      label: '단가 USD인데 총액 KRW로 메모된 값이 끼어듦',
      labelEn: 'Unit price in USD but KRW memo value mixed in totals',
      probability: 0.25,
      evidence: ['내부 참조용 KRW 값 노출', '환산 표기 혼재'],
    },
    {
      causeId: 'CUR_C3',
      label: '환율 환산 표시(참고용)와 실제 통화 혼동',
      labelEn: 'Exchange rate reference confused with actual currency',
      probability: 0.15,
      evidence: ['참고 환율과 거래 통화 구분 미흡'],
    },
  ],
  QTY_MISMATCH: [
    {
      causeId: 'QTY_C1',
      label: '샘플/본오더 수량 혼재',
      labelEn: 'Sample and bulk order quantities mixed',
      probability: 0.4,
      evidence: ['소량과 대량 수량 병기', '문서 간 주문 단계 차이'],
    },
    {
      causeId: 'QTY_C2',
      label: '패키징 단위(박스/EA) 변환 오류',
      labelEn: 'Packaging unit conversion error (box/EA)',
      probability: 0.35,
      evidence: ['박스 수량과 낱개 수량 혼재', '단위 표기 불일치'],
    },
    {
      causeId: 'QTY_C3',
      label: '무료 증정(FREE GOODS) 포함/미포함',
      labelEn: 'Free goods included in some documents but not others',
      probability: 0.25,
      evidence: ['프로모션 증정품 표기 차이', '일부 문서만 증정품 포함'],
    },
  ],
  PRICE_MISMATCH: [
    {
      causeId: 'PRICE_C1',
      label: '가격 티어 변경(수량 구간별) 반영 누락',
      labelEn: 'Price tier change (volume-based) not reflected in all documents',
      probability: 0.45,
      evidence: ['수량 구간별 단가 적용 차이', '볼륨 할인 미반영'],
    },
    {
      causeId: 'PRICE_C2',
      label: '프로모션/할인 적용 문서 불일치',
      labelEn: 'Promotion/discount applied inconsistently across documents',
      probability: 0.35,
      evidence: ['프로모션 할인 일부만 적용', '할인 조건 표기 차이'],
    },
    {
      causeId: 'PRICE_C3',
      label: '소수점 반올림/라운딩 기준 차이',
      labelEn: 'Decimal rounding differences between documents',
      probability: 0.2,
      evidence: ['단가 소수점 자릿수 차이', '반올림 방식 불일치'],
    },
  ],
  TOTALS_MISMATCH: [
    {
      causeId: 'TOT_C1',
      label: 'Subtotal는 맞는데 Shipping/Insurance 포함 여부 차이',
      labelEn: 'Subtotal correct but shipping/insurance inclusion differs',
      probability: 0.45,
      evidence: ['소계는 일치하나 총액 불일치', '부대비용 포함 기준 차이'],
    },
    {
      causeId: 'TOT_C2',
      label: '세금/VAT(특히 EU) 표기 방식 혼재',
      labelEn: 'Tax/VAT notation varies (especially for EU)',
      probability: 0.35,
      evidence: ['VAT 포함/미포함 표기 차이', 'EU 바이어 대상'],
    },
    {
      causeId: 'TOT_C3',
      label: '수수료/커미션/은행 수수료 표시 혼재',
      labelEn: 'Commission/bank fees shown inconsistently',
      probability: 0.2,
      evidence: ['수수료 항목 표기 불일치', '은행 수수료 포함 여부 차이'],
    },
  ],
  BUYER_NAME_MISMATCH: [
    {
      causeId: 'BUYER_C1',
      label: '법인명 vs 브랜드명 vs 지사명 혼용',
      labelEn: 'Legal name vs brand name vs branch name mixed',
      probability: 0.6,
      evidence: ['회사명 표기 방식 차이', '동일 기업의 다른 명칭 사용'],
    },
    {
      causeId: 'BUYER_C2',
      label: '바이어가 PO 상 수취인명을 다르게 요청',
      labelEn: 'Buyer requested different consignee name on PO',
      probability: 0.4,
      evidence: ['수취인명 별도 요청', 'PO 상 명칭과 계약상 명칭 차이'],
    },
  ],
  ADDRESS_MISMATCH: [
    {
      causeId: 'ADDR_C1',
      label: 'BILL TO / SHIP TO 혼동',
      labelEn: 'Bill-to and ship-to addresses confused',
      probability: 0.5,
      evidence: ['청구지와 배송지 주소 혼재', '주소 필드 잘못 입력'],
    },
    {
      causeId: 'ADDR_C2',
      label: 'DDP인데 배송지 확정 전',
      labelEn: 'DDP terms but ship-to address not yet confirmed',
      probability: 0.5,
      evidence: ['DDP 조건 설정', '배송지 미확정 상태'],
    },
  ],
  LEADTIME_MISMATCH: [
    {
      causeId: 'LEAD_C1',
      label: '샘플 리드타임/본오더 리드타임 혼재',
      labelEn: 'Sample lead time and bulk order lead time mixed',
      probability: 0.5,
      evidence: ['샘플과 본오더 납기 조건 차이', '문서 간 주문 유형 불일치'],
    },
    {
      causeId: 'LEAD_C2',
      label: '생산 vs 출고 vs 도착 리드타임 정의 혼동',
      labelEn: 'Production vs shipping vs arrival lead time definition confused',
      probability: 0.5,
      evidence: ['리드타임 정의 기준 차이', '시작/종료 시점 불명확'],
    },
  ],
  DESTINATION_MISMATCH: [
    {
      causeId: 'DEST_C1',
      label: '목적항 변경 후 일부 문서만 업데이트',
      labelEn: 'Destination port changed but only some documents updated',
      probability: 0.7,
      evidence: ['목적항 정보 불일치', '최신 변경사항 미반영'],
    },
    {
      causeId: 'DEST_C2',
      label: '여러 배송지 옵션 중 확정 전 상태',
      labelEn: 'Multiple destination options, not yet finalized',
      probability: 0.3,
      evidence: ['복수 목적지 후보', '배송지 미확정'],
    },
  ],
};

// Source of truth priority rules
const SOURCE_OF_TRUTH_RULES: Record<string, { priority: DocumentKey[]; reason: string }> = {
  'terms.incoterms': {
    priority: ['DOC_CONTRACT', 'DOC_PI', 'DOC_COMMERCIAL_INVOICE'],
    reason: '계약 조건은 법적 구속력 있는 계약서 기준',
  },
  'terms.paymentMethod': {
    priority: ['DOC_CONTRACT', 'DOC_PI'],
    reason: '결제 조건은 계약서 우선',
  },
  'terms.paymentSplit': {
    priority: ['DOC_CONTRACT', 'DOC_PI'],
    reason: '결제 비율은 계약서 우선',
  },
  'terms.currency': {
    priority: ['DOC_PI', 'DOC_COMMERCIAL_INVOICE', 'DOC_CONTRACT'],
    reason: '통화는 거래 기준 PI 우선',
  },
  'items.qty': {
    priority: ['DOC_PI', 'DOC_COMMERCIAL_INVOICE', 'DOC_PACKING_LIST'],
    reason: '수량은 주문 기준 PI 우선',
  },
  'items.unitPrice': {
    priority: ['DOC_PI', 'DOC_COMMERCIAL_INVOICE'],
    reason: '단가는 견적 기준 PI 우선',
  },
  'totals.grandTotal': {
    priority: ['DOC_COMMERCIAL_INVOICE', 'DOC_PI'],
    reason: '총액은 최신 finalized 인보이스 우선 (있을 경우)',
  },
  'buyer.companyName': {
    priority: ['DOC_CONTRACT', 'DOC_PI', 'DOC_COMMERCIAL_INVOICE'],
    reason: '바이어 정보는 계약서 기준',
  },
  'shipment.destinationPort': {
    priority: ['DOC_PI', 'DOC_COMMERCIAL_INVOICE'],
    reason: '배송 정보는 PI 기준',
  },
  'shipment.leadTimeDays': {
    priority: ['DOC_CONTRACT', 'DOC_PI'],
    reason: '납기는 계약서 기준',
  },
};

// Diagnosis result
export interface DiagnosisResult {
  findingId: string;
  probableCauses: CauseTemplate[];
  recommendedResolution: {
    actionSummary: string;
    actionSummaryEn: string;
    chooseSourceOfTruth: DocumentKey;
    sourceValue: unknown;
    rationale: string;
    rationaleEn: string;
    riskIfIgnored: string;
    riskIfIgnoredEn: string;
  };
  communicationNeeds: ('BUYER' | 'INTERNAL' | 'FORWARDER')[];
  needsConfirmation: boolean;
}

// Diagnose a single finding
export function diagnoseFinding(
  finding: CrossCheckFinding,
  documents: DocumentSet,
  _docMetadata?: Record<DocumentKey, { version: number; updatedAt: Date }>
): DiagnosisResult {
  // Get probable causes from templates
  const causeTemplates = ROOT_CAUSE_TEMPLATES[finding.id] || [];
  const probableCauses = causeTemplates.map(t => ({
    ...t,
    probability: adjustProbabilityByContext(t, finding, documents),
  })).sort((a, b) => b.probability - a.probability);

  // Determine source of truth
  const fieldPath = getFieldPathFromFindingId(finding.id);
  const sotRule = SOURCE_OF_TRUTH_RULES[fieldPath] || {
    priority: ['DOC_CONTRACT', 'DOC_PI'],
    reason: '일반 규칙: 계약서 우선',
  };

  // Find the best source document
  let chosenSource: DocumentKey = 'DOC_CONTRACT';
  let sourceValue: unknown = finding.recommendedValue;
  
  for (const docKey of sotRule.priority) {
    if (documents[docKey]) {
      chosenSource = docKey;
      const docValue = finding.detectedValues.find(v => v.docKey === docKey)?.value;
      if (docValue !== undefined) {
        sourceValue = docValue;
      }
      break;
    }
  }

  // Determine communication needs based on finding type
  const communicationNeeds = determineCommunicationNeeds(finding);

  // Check if confirmation is needed
  const needsConfirmation = probableCauses.length > 0 && probableCauses[0].probability < 0.5;

  // Build resolution recommendation
  const docLabels: Record<DocumentKey, string> = {
    DOC_PI: 'PI',
    DOC_CONTRACT: '계약서',
    DOC_COMMERCIAL_INVOICE: '인보이스',
    DOC_PACKING_LIST: '포장명세서',
  };

  const riskMessages = getRiskMessages(finding.id);

  return {
    findingId: finding.id,
    probableCauses,
    recommendedResolution: {
      actionSummary: `${docLabels[chosenSource]} 값(${formatValue(sourceValue)})으로 다른 문서들을 통일합니다.`,
      actionSummaryEn: `Unify all documents to ${chosenSource} value (${formatValue(sourceValue)}).`,
      chooseSourceOfTruth: chosenSource,
      sourceValue,
      rationale: sotRule.reason,
      rationaleEn: getEnglishRationale(sotRule.reason),
      riskIfIgnored: riskMessages.ko,
      riskIfIgnoredEn: riskMessages.en,
    },
    communicationNeeds,
    needsConfirmation,
  };
}

// Helper functions
function adjustProbabilityByContext(
  template: CauseTemplate,
  _finding: CrossCheckFinding,
  _documents: DocumentSet
): number {
  // In production, this would analyze actual document content
  // For MVP, return base probability with slight randomization
  return template.probability * (0.9 + Math.random() * 0.2);
}

function getFieldPathFromFindingId(findingId: string): string {
  const mapping: Record<string, string> = {
    INCOTERMS_MISMATCH: 'terms.incoterms',
    PAYMENT_MISMATCH: 'terms.paymentSplit',
    CURRENCY_MISMATCH: 'terms.currency',
    QTY_MISMATCH: 'items.qty',
    PRICE_MISMATCH: 'items.unitPrice',
    TOTALS_MISMATCH: 'totals.grandTotal',
    BUYER_NAME_MISMATCH: 'buyer.companyName',
    ADDRESS_MISMATCH: 'buyer.addressLine1',
    LEADTIME_MISMATCH: 'shipment.leadTimeDays',
    DESTINATION_MISMATCH: 'shipment.destinationPort',
  };
  return mapping[findingId] || 'terms.incoterms';
}

function determineCommunicationNeeds(finding: CrossCheckFinding): ('BUYER' | 'INTERNAL' | 'FORWARDER')[] {
  const needs: ('BUYER' | 'INTERNAL' | 'FORWARDER')[] = ['INTERNAL'];
  
  const buyerRelated = ['INCOTERMS_MISMATCH', 'PAYMENT_MISMATCH', 'CURRENCY_MISMATCH', 
    'PRICE_MISMATCH', 'TOTALS_MISMATCH', 'BUYER_NAME_MISMATCH'];
  const forwarderRelated = ['INCOTERMS_MISMATCH', 'ADDRESS_MISMATCH', 'DESTINATION_MISMATCH', 
    'LEADTIME_MISMATCH', 'QTY_MISMATCH'];

  if (buyerRelated.includes(finding.id)) {
    needs.push('BUYER');
  }
  if (forwarderRelated.includes(finding.id)) {
    needs.push('FORWARDER');
  }

  return needs;
}

function getRiskMessages(findingId: string): { ko: string; en: string } {
  const risks: Record<string, { ko: string; en: string }> = {
    INCOTERMS_MISMATCH: {
      ko: '인코텀즈 불일치 시 비용 분담과 위험 이전 시점에 분쟁 발생 가능. 통관 지연 및 추가 비용 위험.',
      en: 'Incoterms mismatch can cause disputes over cost sharing and risk transfer. Risk of customs delays and additional costs.',
    },
    PAYMENT_MISMATCH: {
      ko: '결제 조건 불일치 시 대금 수령 지연 또는 분쟁 가능. 신용장 조건 불일치로 네고 불가 위험.',
      en: 'Payment term mismatch can delay payment collection or cause disputes. Risk of L/C negotiation failure.',
    },
    CURRENCY_MISMATCH: {
      ko: '통화 불일치 시 환율 손실 또는 정산 혼란 발생. 바이어와 금액 분쟁 위험.',
      en: 'Currency mismatch can cause exchange rate losses or settlement confusion. Risk of amount disputes with buyer.',
    },
    QTY_MISMATCH: {
      ko: '수량 불일치 시 통관 보류, 반송, 또는 과소/과다 청구 문제 발생.',
      en: 'Quantity mismatch can cause customs hold, return shipment, or over/under-billing issues.',
    },
    PRICE_MISMATCH: {
      ko: '단가 불일치 시 대금 정산 분쟁의 직접적 원인. 바이어 신뢰도 하락.',
      en: 'Price mismatch is a direct cause of payment disputes. Damages buyer trust.',
    },
    TOTALS_MISMATCH: {
      ko: '총액 불일치 시 결제 및 정산 직접 영향. 회계 감사 문제 가능.',
      en: 'Total amount mismatch directly affects payment and settlement. Can cause audit issues.',
    },
    BUYER_NAME_MISMATCH: {
      ko: '바이어명 불일치 시 통관 시 수취인 확인 실패로 화물 보류 위험.',
      en: 'Buyer name mismatch can cause cargo hold due to consignee verification failure at customs.',
    },
    ADDRESS_MISMATCH: {
      ko: '주소 불일치 시 배송 지연 또는 오배송 위험. DDP 시 세관 문제 발생 가능.',
      en: 'Address mismatch risks delivery delay or wrong delivery. Can cause customs issues for DDP.',
    },
    LEADTIME_MISMATCH: {
      ko: '납기 불일치 시 배송 지연 클레임 원인. 계약 위반으로 패널티 가능.',
      en: 'Lead time mismatch can cause delivery delay claims. May trigger penalty for contract violation.',
    },
    DESTINATION_MISMATCH: {
      ko: '목적지 불일치 시 물류 비용 추가 발생. 화물 오배송 위험.',
      en: 'Destination mismatch can cause additional logistics costs. Risk of cargo misrouting.',
    },
  };

  return risks[findingId] || {
    ko: '문서 간 불일치는 거래 분쟁의 원인이 됩니다.',
    en: 'Document inconsistency can cause trade disputes.',
  };
}

function getEnglishRationale(koreanRationale: string): string {
  const translations: Record<string, string> = {
    '계약 조건은 법적 구속력 있는 계약서 기준': 'Contract terms take precedence as legally binding',
    '결제 조건은 계약서 우선': 'Payment terms follow contract',
    '결제 비율은 계약서 우선': 'Payment split follows contract',
    '통화는 거래 기준 PI 우선': 'Currency follows PI as transaction basis',
    '수량은 주문 기준 PI 우선': 'Quantity follows PI as order basis',
    '단가는 견적 기준 PI 우선': 'Unit price follows PI as quotation basis',
    '총액은 최신 finalized 인보이스 우선 (있을 경우)': 'Total follows latest finalized invoice if available',
    '바이어 정보는 계약서 기준': 'Buyer info follows contract',
    '배송 정보는 PI 기준': 'Shipping info follows PI',
    '납기는 계약서 기준': 'Lead time follows contract',
    '일반 규칙: 계약서 우선': 'General rule: Contract takes precedence',
  };
  return translations[koreanRationale] || 'Based on standard trade document hierarchy';
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

// Diagnose all findings in a cross-check result
export function diagnoseAllFindings(
  findings: CrossCheckFinding[],
  documents: DocumentSet
): DiagnosisResult[] {
  return findings.map(finding => diagnoseFinding(finding, documents));
}
