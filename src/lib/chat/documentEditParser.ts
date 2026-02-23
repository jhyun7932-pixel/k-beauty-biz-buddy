import { EditOp, EditOpType } from '@/hooks/useDocumentRunner';

// =========================================
// Chat Command Parser for Document Editing
// Parses natural language commands and converts them to EditOps
// =========================================

interface ParsedCommand {
  intent: EditOpType;
  params: Record<string, unknown>;
  confidence: number;
  originalText: string;
}

// Pattern matchers for different edit intents
const EDIT_PATTERNS: Array<{
  pattern: RegExp;
  intent: EditOpType;
  extractParams: (match: RegExpMatchArray, text: string) => Record<string, unknown>;
}> = [
  // Update field patterns
  {
    pattern: /(?:MOQ|moq|수량)(?:을|를)?\s*(\d+(?:,\d{3})*)\s*(?:으로|로)?\s*(?:바꿔|변경|수정)/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'moq',
      value: parseInt(match[1].replace(/,/g, ''), 10),
    }),
  },
  {
    pattern: /(?:단가|가격|price)(?:을|를)?\s*\$?(\d+(?:\.\d{2})?)\s*(?:으로|로)?\s*(?:바꿔|변경|수정)/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'unitPrice',
      value: parseFloat(match[1]),
    }),
  },
  {
    pattern: /(?:납기|리드타임|lead\s*time)(?:을|를)?\s*(\d+)\s*일\s*(?:으로|로)?\s*(?:바꿔|변경|수정)/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'leadTime',
      value: parseInt(match[1], 10),
    }),
  },
  {
    pattern: /(?:유효기간|validity)(?:을|를)?\s*(\d+)\s*일\s*(?:으로|로)?\s*(?:바꿔|변경|수정)/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'validityDays',
      value: parseInt(match[1], 10),
    }),
  },
  {
    pattern: /(?:인코텀즈|incoterms?)(?:을|를)?\s*(FOB|CIF|DDP|EXW|CFR|DAP)\s*(?:으로|로)?\s*(?:바꿔|변경|수정)?/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'incoterms',
      value: match[1].toUpperCase(),
    }),
  },
  {
    pattern: /(?:결제조건|payment)(?:을|를)?\s*(T\/T\s*\d+\/\d+|L\/C|D\/A|D\/P)/i,
    intent: 'updateField',
    extractParams: (match) => ({
      field: 'paymentTerms',
      value: match[1],
    }),
  },
  
  // Rewrite section patterns
  {
    pattern: /(?:표|table)(?:을|를)?\s*(?:더\s*)?(?:깔끔하게|정리해|다듬어|예쁘게)/i,
    intent: 'rewriteSection',
    extractParams: () => ({
      sectionType: 'table',
      styleGuide: 'clean',
    }),
  },
  {
    pattern: /(?:요약|summary)(?:을|를)?\s*(?:더\s*)?(?:짧게|간결하게|줄여)/i,
    intent: 'rewriteSection',
    extractParams: () => ({
      sectionType: 'summary',
      styleGuide: 'concise',
    }),
  },
  {
    pattern: /(\d+)\s*(?:페이지|page)에?\s*(?:.*?)(?:추가|넣어|삽입)/i,
    intent: 'addSection',
    extractParams: (match, text) => ({
      pageNumber: parseInt(match[1], 10),
      content: text.replace(match[0], '').trim(),
    }),
  },
  
  // Tone change patterns
  {
    pattern: /(?:톤|tone|어조)(?:을|를)?\s*(?:더\s*)?(?:전문적|professional|격식|formal)(?:으로|로|하게)?/i,
    intent: 'changeTone',
    extractParams: () => ({
      tonePreset: 'professional',
    }),
  },
  {
    pattern: /(?:톤|tone|어조)(?:을|를)?\s*(?:더\s*)?(?:친근|friendly|캐주얼|casual)(?:으로|로|하게)?/i,
    intent: 'changeTone',
    extractParams: () => ({
      tonePreset: 'friendly',
    }),
  },
  
  // Localization patterns
  {
    pattern: /(?:일본|일본어|JP|japanese)\s*(?:시장|버전|용)?(?:으로|로)?\s*(?:바꿔|변경|번역|현지화)/i,
    intent: 'localize',
    extractParams: () => ({
      languageCode: 'ja',
      regionStyle: 'JP',
    }),
  },
  {
    pattern: /(?:미국|영어|US|american|english)\s*(?:시장|버전|용)?(?:으로|로)?\s*(?:바꿔|변경|번역|현지화)/i,
    intent: 'localize',
    extractParams: () => ({
      languageCode: 'en',
      regionStyle: 'US',
    }),
  },
  {
    pattern: /(?:중국|중국어|CN|chinese)\s*(?:시장|버전|용)?(?:으로|로)?\s*(?:바꿔|변경|번역|현지화)/i,
    intent: 'localize',
    extractParams: () => ({
      languageCode: 'zh',
      regionStyle: 'CN',
    }),
  },
  
  // Table update patterns
  {
    pattern: /(?:행|row)(?:을|를)?\s*(\d+)개?\s*(?:더\s*)?추가/i,
    intent: 'updateTable',
    extractParams: (match) => ({
      action: 'addRows',
      count: parseInt(match[1], 10),
    }),
  },
  {
    pattern: /(?:열|column)(?:을|를)?\s*(\d+)개?\s*(?:더\s*)?추가/i,
    intent: 'updateTable',
    extractParams: (match) => ({
      action: 'addColumns',
      count: parseInt(match[1], 10),
    }),
  },
  
  // Section ordering
  {
    pattern: /(?:섹션|section)\s*(?:순서|order)(?:를|을)?\s*(?:바꿔|변경)/i,
    intent: 'reorderSections',
    extractParams: () => ({
      action: 'reorder',
    }),
  },
  
  // Remove section
  {
    pattern: /(?:.*?)(?:섹션|section|부분|파트)(?:을|를)?\s*(?:삭제|제거|빼)/i,
    intent: 'removeSection',
    extractParams: (_, text) => ({
      sectionDescription: text,
    }),
  },
];

// Parse a message and return EditOp if it's an edit command
export function parseEditCommand(message: string): ParsedCommand | null {
  const normalizedMessage = message.trim().toLowerCase();
  
  for (const { pattern, intent, extractParams } of EDIT_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return {
        intent,
        params: extractParams(match, message),
        confidence: 0.8,
        originalText: message,
      };
    }
  }
  
  // Check for generic edit keywords
  if (/바꿔|변경|수정|추가|삭제|다듬|정리/.test(normalizedMessage)) {
    return {
      intent: 'rewriteSection',
      params: { text: message },
      confidence: 0.5,
      originalText: message,
    };
  }
  
  return null;
}

// Convert parsed command to EditOp
export function toEditOp(parsed: ParsedCommand): EditOp {
  return {
    type: parsed.intent,
    params: parsed.params,
  };
}

// Check if a message looks like an edit command
export function isEditCommand(message: string): boolean {
  const editKeywords = [
    '바꿔', '변경', '수정', '추가', '삭제', '제거',
    '다듬', '정리', '깔끔', '예쁘게', '줄여', '늘려',
    '번역', '현지화', '톤', '어조',
    'MOQ', 'moq', '단가', '가격', '납기', '리드타임',
    '표', '행', '열', '섹션', '페이지',
  ];
  
  return editKeywords.some(keyword => message.includes(keyword));
}

// Generate response message for an edit operation
export function generateEditResponse(parsed: ParsedCommand): string {
  switch (parsed.intent) {
    case 'updateField':
      const field = parsed.params.field as string;
      const value = parsed.params.value;
      const fieldNames: Record<string, string> = {
        moq: 'MOQ',
        unitPrice: '단가',
        leadTime: '납기',
        validityDays: '유효기간',
        incoterms: '인코텀즈',
        paymentTerms: '결제조건',
      };
      return `✅ ${fieldNames[field] || field}을(를) ${value}(으)로 변경했어요. 문서에 바로 반영됩니다.`;
    
    case 'rewriteSection':
      return '✅ 해당 섹션을 다듬었어요. 미리보기에서 확인해주세요.';
    
    case 'addSection':
      return '✅ 새 섹션을 추가했어요. 위치와 내용을 확인해주세요.';
    
    case 'changeTone':
      const tone = parsed.params.tonePreset as string;
      return `✅ 문서 톤을 ${tone === 'professional' ? '전문적인' : '친근한'} 스타일로 변경했어요.`;
    
    case 'localize':
      const lang = parsed.params.languageCode as string;
      const langNames: Record<string, string> = { ja: '일본어', en: '영어', zh: '중국어' };
      return `✅ ${langNames[lang] || lang} 시장에 맞게 문서를 현지화했어요.`;
    
    case 'updateTable':
      return '✅ 표를 업데이트했어요.';
    
    case 'reorderSections':
      return '✅ 섹션 순서를 변경했어요.';
    
    case 'removeSection':
      return '✅ 해당 섹션을 삭제했어요.';
    
    default:
      return '✅ 문서를 수정했어요. 미리보기에서 확인해주세요.';
  }
}

// Examples for chat hints
export const EDIT_EXAMPLES = [
  { command: 'MOQ를 1000으로 바꿔줘', description: 'MOQ 수정' },
  { command: '표를 더 깔끔하게 정리해줘', description: '표 스타일 개선' },
  { command: '일본 시장용으로 톤 바꿔줘', description: '현지화' },
  { command: '단가를 $8.50으로 변경해줘', description: '가격 수정' },
  { command: '3페이지에 성분표 요약 추가해줘', description: '섹션 추가' },
];
