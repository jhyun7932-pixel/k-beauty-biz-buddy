// Communication Kit Generator for Cross-check Findings
// Generates buyer/internal/forwarder messages with language variants

import type { CrossCheckFinding, DocumentKey } from './crossCheckEngine';
import type { DiagnosisResult } from './rootCauseDiagnosis';

export type RecipientType = 'BUYER' | 'INTERNAL' | 'FORWARDER';
export type MessageLanguage = 'ko' | 'en' | 'ja' | 'zh';
export type MessageType = 'CORRECTION' | 'CONFIRMATION_REQUEST';

// Message structure
export interface GeneratedMessage {
  recipient: RecipientType;
  type: MessageType;
  subject?: string;
  body: string;
  languageVariants: Partial<Record<MessageLanguage, string>>;
}

// Communication kit for a finding
export interface CommunicationKit {
  findingId: string;
  messages: {
    buyerEmail?: {
      correction: GeneratedMessage;
      confirmationRequest: GeneratedMessage;
    };
    buyerChat?: GeneratedMessage;
    internalNote?: GeneratedMessage;
    forwarderNote?: GeneratedMessage;
  };
}

// Context for message generation
export interface MessageContext {
  projectName: string;
  sellerBrandName: string;
  buyerContactName?: string;
  buyerCompanyName?: string;
  piVersion?: number;
  contractVersion?: number;
  invoiceVersion?: number;
  plVersion?: number;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
    affectedDocs: DocumentKey[];
  }[];
  impact?: string;
  impactEn?: string;
}

// Generate communication kit for a finding
export function generateCommunicationKit(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): CommunicationKit {
  const kit: CommunicationKit = {
    findingId: finding.id,
    messages: {},
  };

  // Generate buyer messages if needed
  if (diagnosis.communicationNeeds.includes('BUYER')) {
    kit.messages.buyerEmail = {
      correction: generateBuyerCorrectionEmail(finding, diagnosis, context),
      confirmationRequest: generateBuyerConfirmationEmail(finding, diagnosis, context),
    };
    kit.messages.buyerChat = generateBuyerChatMessage(finding, diagnosis, context);
  }

  // Always generate internal note
  kit.messages.internalNote = generateInternalNote(finding, diagnosis, context);

  // Generate forwarder note if needed
  if (diagnosis.communicationNeeds.includes('FORWARDER')) {
    kit.messages.forwarderNote = generateForwarderNote(finding, diagnosis, context);
  }

  return kit;
}

// Generate buyer correction email
function generateBuyerCorrectionEmail(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): GeneratedMessage {
  const changeLines = context.changes.map(c => `- ${c.field}: ${c.oldValue} → ${c.newValue}`).join('\n');
  const changeLinesEn = context.changes.map(c => `- ${c.field}: ${c.oldValue} → ${c.newValue}`).join('\n');

  const updatedFiles = [];
  if (context.piVersion) updatedFiles.push(`Proforma Invoice: v${context.piVersion}`);
  if (context.contractVersion) updatedFiles.push(`Sales Contract: v${context.contractVersion}`);
  if (context.invoiceVersion) updatedFiles.push(`Commercial Invoice: v${context.invoiceVersion}`);
  if (context.plVersion) updatedFiles.push(`Packing List: v${context.plVersion}`);

  const bodyEn = `Hi ${context.buyerContactName || 'there'},

We noticed a mismatch across our documents and have now updated them for consistency.

✅ What changed:
${changeLinesEn}

📎 Updated files:
${updatedFiles.map(f => `- ${f}`).join('\n')}

Impact:
- ${context.impactEn || 'No change in total amount'}

Could you please confirm if everything looks correct on your side?

Best regards,
${context.sellerBrandName}`;

  const bodyKo = `${context.buyerContactName || '담당자'}님, 안녕하세요.

문서 간 일부 항목이 일치하지 않아, 정확하게 수정한 버전으로 다시 보내드립니다.

✅ 변경 사항:
${changeLines}

📎 업데이트된 문서:
${updatedFiles.map(f => `- ${f}`).join('\n')}

영향:
- ${context.impact || '총액 변동 없음'}

확인 부탁드리며, 문제 있으시면 알려주세요.

감사합니다.
${context.sellerBrandName}`;

  return {
    recipient: 'BUYER',
    type: 'CORRECTION',
    subject: `Updated documents for ${context.projectName} (${finding.title})`,
    body: bodyEn,
    languageVariants: {
      en: bodyEn,
      ko: bodyKo,
    },
  };
}

// Generate buyer confirmation request email
function generateBuyerConfirmationEmail(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): GeneratedMessage {
  const topCause = diagnosis.probableCauses[0];
  
  const questionsEn = getConfirmationQuestions(finding.id, 'en');
  const questionsKo = getConfirmationQuestions(finding.id, 'ko');

  const bodyEn = `Hi ${context.buyerContactName || 'there'},

To finalize the documents, could you please confirm the following?

${questionsEn.map((q, i) => `${i + 1}) ${q}`).join('\n')}

Once confirmed, we will re-issue the final PI/Contract immediately.

Best regards,
${context.sellerBrandName}`;

  const bodyKo = `${context.buyerContactName || '담당자'}님, 안녕하세요.

문서 최종 확정을 위해 아래 사항을 확인 부탁드립니다.

${questionsKo.map((q, i) => `${i + 1}) ${q}`).join('\n')}

확인해 주시면 바로 최종 PI/계약서를 재발행해 드리겠습니다.

감사합니다.
${context.sellerBrandName}`;

  return {
    recipient: 'BUYER',
    type: 'CONFIRMATION_REQUEST',
    subject: `Quick confirmation needed (${finding.title})`,
    body: bodyEn,
    languageVariants: {
      en: bodyEn,
      ko: bodyKo,
    },
  };
}

// Generate buyer chat message (short)
function generateBuyerChatMessage(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): GeneratedMessage {
  const changePreview = context.changes[0] 
    ? `${context.changes[0].field}: ${context.changes[0].oldValue} → ${context.changes[0].newValue}`
    : finding.title;

  const bodyKo = `문서 간 조건이 하나만 다르게 들어가서, 동일하게 맞춘 버전으로 재발행했어요. (${changePreview}) 확인 부탁드릴게요!`;
  const bodyEn = `We found a mismatch and re-issued consistent documents (${changePreview}). Could you please confirm?`;

  return {
    recipient: 'BUYER',
    type: 'CORRECTION',
    body: bodyKo,
    languageVariants: {
      ko: bodyKo,
      en: bodyEn,
    },
  };
}

// Generate internal note
function generateInternalNote(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): GeneratedMessage {
  const topCause = diagnosis.probableCauses[0];
  const fixSummary = diagnosis.recommendedResolution.actionSummary;
  const risk = diagnosis.recommendedResolution.riskIfIgnored;
  
  const nextSteps = getNextSteps(finding.id);

  const bodyKo = `📋 문서 불일치 처리 기록

🔍 원인(추정): ${topCause?.label || '원인 분석 필요'}
   확률: ${topCause ? Math.round(topCause.probability * 100) : 0}%

✅ 조치: ${fixSummary}

⚠️ 리스크: ${risk}

📝 다음 할 일:
${nextSteps.map(s => `- ${s}`).join('\n')}

관련 프로젝트: ${context.projectName}
문서 버전: PI v${context.piVersion || 1}, 계약서 v${context.contractVersion || 1}`;

  return {
    recipient: 'INTERNAL',
    type: 'CORRECTION',
    body: bodyKo,
    languageVariants: {
      ko: bodyKo,
    },
  };
}

// Generate forwarder note
function generateForwarderNote(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  context: MessageContext
): GeneratedMessage {
  // Extract shipping-related info from changes
  const incoterms = context.changes.find(c => c.field.toLowerCase().includes('incoterms'))?.newValue || 'FOB';
  
  const bodyEn = `Hello,

Please note the shipment terms for ${context.projectName}:

- Incoterms: ${incoterms}
- Destination: To be confirmed
- Packing: Standard export packing
- Ready date: To be advised

Please let us know if you need any clarification.

Thanks,
${context.sellerBrandName}`;

  const bodyKo = `안녕하세요,

${context.projectName} 건 배송 조건 안내드립니다.

- 인코텀즈: ${incoterms}
- 목적지: 확정 후 안내 예정
- 포장: 표준 수출 포장
- 출고 예정일: 추후 안내

추가 확인 필요하시면 알려주세요.

감사합니다.
${context.sellerBrandName}`;

  return {
    recipient: 'FORWARDER',
    type: 'CORRECTION',
    body: bodyEn,
    languageVariants: {
      en: bodyEn,
      ko: bodyKo,
    },
  };
}

// Get confirmation questions by finding type
function getConfirmationQuestions(findingId: string, lang: 'ko' | 'en'): string[] {
  const questions: Record<string, { ko: string[]; en: string[] }> = {
    INCOTERMS_MISMATCH: {
      ko: ['인코텀즈: FOB로 확정할까요, CIF로 할까요?', '운송비/보험료 부담 주체를 확인해 주세요.'],
      en: ['Incoterms: Should we confirm FOB or CIF?', 'Please confirm who bears freight/insurance costs.'],
    },
    PAYMENT_MISMATCH: {
      ko: ['결제 조건: T/T 30/70이 맞나요?', 'L/C 조건으로 변경을 검토 중이신가요?'],
      en: ['Payment: Is T/T 30/70 correct?', 'Are you considering changing to L/C terms?'],
    },
    CURRENCY_MISMATCH: {
      ko: ['결제 통화: USD로 확정 맞으신가요?', '다른 통화로 변경을 원하시나요?'],
      en: ['Currency: Is USD confirmed for this order?', 'Would you prefer a different currency?'],
    },
    QTY_MISMATCH: {
      ko: ['수량을 확인해 주세요.', '무료 증정품 포함 여부를 알려주세요.'],
      en: ['Please confirm the quantities.', 'Please confirm if free goods are included.'],
    },
    PRICE_MISMATCH: {
      ko: ['단가가 정확한지 확인해 주세요.', '프로모션 할인이 적용되어야 하나요?'],
      en: ['Please confirm the unit prices are correct.', 'Should promotional discount be applied?'],
    },
    TOTALS_MISMATCH: {
      ko: ['총액이 정확한지 확인해 주세요.', '운송비/보험료가 포함되어야 하나요?'],
      en: ['Please confirm the total amount is correct.', 'Should shipping/insurance be included?'],
    },
    BUYER_NAME_MISMATCH: {
      ko: ['정확한 회사명/수취인명을 알려주세요.', '통관용 명칭이 다른 경우 별도로 알려주세요.'],
      en: ['Please confirm the correct company/consignee name.', 'Let us know if customs requires a different name.'],
    },
    ADDRESS_MISMATCH: {
      ko: ['배송지 주소를 확인해 주세요.', 'BILL TO와 SHIP TO가 다른 경우 알려주세요.'],
      en: ['Please confirm the shipping address.', 'Let us know if BILL TO and SHIP TO are different.'],
    },
    LEADTIME_MISMATCH: {
      ko: ['희망 납기일을 확인해 주세요.', '생산 리드타임과 배송 리드타임 중 어느 기준인가요?'],
      en: ['Please confirm your required delivery date.', 'Is this based on production or shipping lead time?'],
    },
    DESTINATION_MISMATCH: {
      ko: ['목적항을 확인해 주세요.', '최종 배송지가 변경되었나요?'],
      en: ['Please confirm the destination port.', 'Has the final delivery address changed?'],
    },
  };

  return questions[findingId]?.[lang] || (lang === 'ko' 
    ? ['해당 항목을 확인해 주세요.'] 
    : ['Please confirm this item.']);
}

// Get next steps for internal note
function getNextSteps(findingId: string): string[] {
  const steps: Record<string, string[]> = {
    INCOTERMS_MISMATCH: ['바이어 확인 후 모든 문서 업데이트', '포워더에게 조건 변경 통보'],
    PAYMENT_MISMATCH: ['바이어 결제 조건 최종 확인', '필요시 L/C 조건 협의'],
    CURRENCY_MISMATCH: ['통화 확정 후 단가/총액 재계산', '환율 적용 기준일 확인'],
    QTY_MISMATCH: ['PO 수량과 대조 확인', '포장 단위 재확인'],
    PRICE_MISMATCH: ['최종 단가표 확인', '할인 조건 명확화'],
    TOTALS_MISMATCH: ['항목별 금액 재계산', '부대비용 포함 여부 확인'],
    BUYER_NAME_MISMATCH: ['공식 회사명 확인', '통관용 명칭 별도 확인'],
    ADDRESS_MISMATCH: ['배송지 최종 확정', 'DDP인 경우 통관 대행 확인'],
    LEADTIME_MISMATCH: ['생산팀 납기 확인', '물류팀 배송 일정 확인'],
    DESTINATION_MISMATCH: ['목적항 최종 확정', '포워더에게 라우팅 확인'],
  };

  return steps[findingId] || ['관련 담당자와 협의', '문서 업데이트 후 바이어 확인'];
}

// Generate all communication kits for multiple findings
export function generateAllCommunicationKits(
  findings: CrossCheckFinding[],
  diagnoses: DiagnosisResult[],
  context: MessageContext
): CommunicationKit[] {
  return findings.map((finding, index) => 
    generateCommunicationKit(finding, diagnoses[index], context)
  );
}

// Get a combined summary message for multiple fixes
export function generateCombinedCorrectionMessage(
  changes: MessageContext['changes'],
  context: MessageContext,
  lang: 'ko' | 'en'
): string {
  const changeLines = changes.map(c => `- ${c.field}: ${c.oldValue} → ${c.newValue}`);

  if (lang === 'ko') {
    return `문서 간 ${changes.length}개 항목을 수정했습니다.

${changeLines.join('\n')}

관련 문서를 업데이트했으니 확인 부탁드립니다.`;
  }

  return `We've corrected ${changes.length} item(s) across documents.

${changeLines.join('\n')}

Please review the updated documents.`;
}
