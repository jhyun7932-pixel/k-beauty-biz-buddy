// Confirmation Questions Generator for Cross-check Findings
// Generates clarification questions when AI cannot determine the correct value

import type { CrossCheckFinding, DocumentSet } from './crossCheckEngine';
import type { DiagnosisResult } from './rootCauseDiagnosis';

export interface ConfirmationQuestion {
  id: string;
  findingId: string;
  question: string;
  questionEn: string;
  options: ConfirmationOption[];
  fieldPath: string;
}

export interface ConfirmationOption {
  label: string;
  value: unknown;
  sourceDoc: string;
  isRecommended?: boolean;
}

export interface ConfirmationAnswer {
  questionId: string;
  findingId: string;
  selectedValue: unknown;
  fieldPath: string;
}

// Generate confirmation questions from findings that need clarification
export function generateConfirmationQuestions(
  findings: CrossCheckFinding[],
  diagnoses: DiagnosisResult[],
  _documents: DocumentSet
): ConfirmationQuestion[] {
  const questions: ConfirmationQuestion[] = [];
  
  // Filter findings that need confirmation (ambiguous or multiple valid options)
  const needsConfirmation = findings.filter((f, i) => {
    const diagnosis = diagnoses[i];
    // If top cause probability is low, we need confirmation
    return diagnosis.needsConfirmation || 
           f.severity === 'BLOCKING' ||
           (diagnosis.probableCauses.length > 1 && 
            diagnosis.probableCauses[0].probability < 0.7);
  });

  needsConfirmation.forEach((finding, idx) => {
    const diagnosis = diagnoses[findings.indexOf(finding)];
    const question = createQuestionForFinding(finding, diagnosis, idx);
    if (question) {
      questions.push(question);
    }
  });

  // Limit to top 5 most important questions
  return questions.slice(0, 5);
}

function createQuestionForFinding(
  finding: CrossCheckFinding,
  diagnosis: DiagnosisResult,
  _index: number
): ConfirmationQuestion | null {
  const options: ConfirmationOption[] = finding.detectedValues
    .filter(v => v.value !== null && v.value !== undefined)
    .map(v => ({
      label: `${getDocLabel(v.docKey)} 값: ${formatValue(v.value)}`,
      value: v.value,
      sourceDoc: v.docKey,
      isRecommended: v.docKey === diagnosis.recommendedResolution.chooseSourceOfTruth,
    }));

  // If we have less than 2 options, no need for confirmation
  if (options.length < 2) return null;

  const questionTemplates = getQuestionTemplate(finding.id);

  return {
    id: `confirm-${finding.id}-${Date.now()}`,
    findingId: finding.id,
    question: questionTemplates.ko,
    questionEn: questionTemplates.en,
    options,
    fieldPath: getFieldPathFromFindingId(finding.id),
  };
}

function getQuestionTemplate(findingId: string): { ko: string; en: string } {
  const templates: Record<string, { ko: string; en: string }> = {
    INCOTERMS_MISMATCH: {
      ko: '인코텀즈(거래조건)는 어느 것으로 확정할까요?',
      en: 'Which Incoterms should we finalize?',
    },
    PAYMENT_MISMATCH: {
      ko: '결제 조건은 어느 것으로 확정할까요?',
      en: 'Which payment terms should we finalize?',
    },
    CURRENCY_MISMATCH: {
      ko: '거래 통화는 어느 것으로 확정할까요?',
      en: 'Which currency should we finalize?',
    },
    QTY_MISMATCH: {
      ko: '수량은 어느 값으로 통일할까요?',
      en: 'Which quantity should we use across all documents?',
    },
    PRICE_MISMATCH: {
      ko: '단가는 어느 값으로 확정할까요?',
      en: 'Which unit price should we finalize?',
    },
    TOTALS_MISMATCH: {
      ko: '총액은 어느 값으로 확정할까요?',
      en: 'Which total amount should we finalize?',
    },
    BUYER_NAME_MISMATCH: {
      ko: '바이어 회사명은 어느 것으로 통일할까요?',
      en: 'Which buyer company name should we use?',
    },
    ADDRESS_MISMATCH: {
      ko: '배송/청구 주소는 어느 것으로 확정할까요?',
      en: 'Which address should we use?',
    },
    LEADTIME_MISMATCH: {
      ko: '납기(리드타임)는 어느 것으로 확정할까요?',
      en: 'Which lead time should we finalize?',
    },
    DESTINATION_MISMATCH: {
      ko: '목적지/목적항은 어느 것으로 확정할까요?',
      en: 'Which destination should we use?',
    },
  };

  return templates[findingId] || {
    ko: '어느 값으로 확정할까요?',
    en: 'Which value should we finalize?',
  };
}

function getDocLabel(docKey: string): string {
  const labels: Record<string, string> = {
    DOC_PI: 'PI',
    DOC_CONTRACT: '계약서',
    DOC_COMMERCIAL_INVOICE: '인보이스',
    DOC_PACKING_LIST: '포장명세서',
  };
  return labels[docKey] || docKey;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

function getFieldPathFromFindingId(findingId: string): string {
  const mapping: Record<string, string> = {
    INCOTERMS_MISMATCH: 'terms.incoterms',
    PAYMENT_MISMATCH: 'terms.paymentMethod',
    CURRENCY_MISMATCH: 'terms.currency',
    QTY_MISMATCH: 'items.qty',
    PRICE_MISMATCH: 'items.unitPrice',
    TOTALS_MISMATCH: 'totals.grandTotal',
    BUYER_NAME_MISMATCH: 'buyer.companyName',
    ADDRESS_MISMATCH: 'buyer.addressLine1',
    LEADTIME_MISMATCH: 'shipment.leadTimeDays',
    DESTINATION_MISMATCH: 'shipment.destinationPort',
  };
  return mapping[findingId] || 'unknown';
}

// Generate a summary message after user answers all questions
export function generateFixSummaryMessage(
  answers: ConfirmationAnswer[],
  originalFindings: CrossCheckFinding[]
): { ko: string; en: string } {
  const changes = answers.map(answer => {
    const finding = originalFindings.find(f => f.id === answer.findingId);
    return {
      field: finding?.title || answer.fieldPath,
      value: formatValue(answer.selectedValue),
    };
  });

  const koLines = changes.map(c => `• ${c.field}: ${c.value}로 확정`).join('\n');
  const enLines = changes.map(c => `• ${c.field}: finalized as ${c.value}`).join('\n');

  return {
    ko: `다음 항목들을 확정하고 문서를 업데이트했습니다:\n\n${koLines}\n\n이제 막힘 항목이 해결되어 최종 확정이 가능합니다.`,
    en: `Updated documents with the following values:\n\n${enLines}\n\nBlocking issues resolved. Ready for finalization.`,
  };
}
