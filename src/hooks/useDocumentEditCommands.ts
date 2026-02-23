import { useProjectStore, DocumentInstance, DOC_METADATA } from '@/stores/projectStore';
import { toast } from 'sonner';

// =========================================
// Document Edit Commands Hook
// Parses natural language commands and updates document fields
// =========================================

export interface EditResult {
  isEdit: boolean;
  response: string;
  updatedFields?: Record<string, any>;
}

// Pattern matchers for different edit intents
const EDIT_PATTERNS: Array<{
  pattern: RegExp;
  field: string;
  fieldLabel: string;
  extractValue: (match: RegExpMatchArray) => any;
}> = [
  // MOQ patterns
  {
    pattern: /(?:MOQ|moq|수량|최소주문량?)(?:을|를)?\s*(\d+(?:,\d{3})*)\s*(?:개|으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'moq',
    fieldLabel: 'MOQ',
    extractValue: (match) => parseInt(match[1].replace(/,/g, ''), 10),
  },
  {
    pattern: /(?:MOQ|moq)(?:를|을)?\s*(?:.*?)(\d+(?:,\d{3})*)\s*(?:개|으로|로)?/i,
    field: 'moq',
    fieldLabel: 'MOQ',
    extractValue: (match) => parseInt(match[1].replace(/,/g, ''), 10),
  },
  // Unit price patterns
  {
    pattern: /(?:단가|가격|price|unit\s*price)(?:을|를)?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'unitPrice',
    fieldLabel: '단가',
    extractValue: (match) => parseFloat(match[1]),
  },
  // Lead time patterns
  {
    pattern: /(?:납기|리드타임|lead\s*time|생산기간)(?:을|를)?\s*(\d+)\s*(?:일|days)?\s*(?:으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'leadTime',
    fieldLabel: '납기',
    extractValue: (match) => parseInt(match[1], 10),
  },
  // Validity days patterns
  {
    pattern: /(?:유효기간|validity|견적\s*유효|유효\s*일수)(?:을|를)?\s*(\d+)\s*(?:일|days)?\s*(?:으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'validityDays',
    fieldLabel: '유효기간',
    extractValue: (match) => parseInt(match[1], 10),
  },
  // Incoterms patterns
  {
    pattern: /(?:인코텀즈?|incoterms?)(?:을|를)?\s*(FOB|CIF|DDP|EXW|CFR|DAP|FCA)\s*(?:으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'incoterms',
    fieldLabel: '인코텀즈',
    extractValue: (match) => match[1].toUpperCase(),
  },
  // Payment terms patterns
  {
    pattern: /(?:결제조건|결제\s*방식|payment)(?:을|를)?\s*(T\/T\s*\d+\/\d+|L\/C|Escrow|D\/A|D\/P)/i,
    field: 'paymentTerms',
    fieldLabel: '결제조건',
    extractValue: (match) => match[1],
  },
  // Shipping cost patterns
  {
    pattern: /(?:배송비|운송비|shipping\s*cost?)(?:을|를)?\s*\$?(\d+(?:\.\d{2})?)\s*(?:으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'shippingCost',
    fieldLabel: '배송비',
    extractValue: (match) => parseFloat(match[1]),
  },
  // Quantity patterns for items
  {
    pattern: /(?:수량|qty|quantity)(?:을|를)?\s*(\d+(?:,\d{3})*)\s*(?:개|으로|로)?\s*(?:바꿔|변경|수정|해줘)?/i,
    field: 'qty',
    fieldLabel: '수량',
    extractValue: (match) => parseInt(match[1].replace(/,/g, ''), 10),
  },
];

// Check if a message looks like an edit command
export function isEditCommand(message: string): boolean {
  const editKeywords = [
    '바꿔', '변경', '수정', '해줘', '으로', '로',
    'MOQ', 'moq', '단가', '가격', '납기', '리드타임',
    '유효기간', '인코텀즈', '결제조건', '배송비', '수량',
  ];
  
  return editKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
}

// Parse a message and apply edits to the active document
export function useDocumentEditCommands() {
  const { 
    getActiveDocument, 
    updateDocumentFields,
    activeDocumentId,
  } = useProjectStore();

  const processEditCommand = (message: string): EditResult => {
    const activeDoc = getActiveDocument();
    
    if (!activeDoc) {
      return {
        isEdit: false,
        response: '편집할 문서가 선택되지 않았어요. 먼저 문서를 선택해주세요.',
      };
    }

    if (activeDoc.status === 'final') {
      return {
        isEdit: true,
        response: '⚠️ 이 문서는 이미 최종 확정되었습니다. 수정하려면 새 문서를 생성해주세요.',
      };
    }

    // Try to match edit patterns
    for (const { pattern, field, fieldLabel, extractValue } of EDIT_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const value = extractValue(match);
        
        // Update the document fields
        const updatedFields: Record<string, any> = { [field]: value };
        
        // Recalculate totals if relevant fields are updated
        if (field === 'qty' || field === 'unitPrice' || field === 'shippingCost') {
          const items = activeDoc.fields.items || [];
          if (field === 'qty' && items.length > 0) {
            // Update first item's quantity and recalculate
            const newItems = items.map((item: any, idx: number) => {
              if (idx === 0) {
                const newQty = value;
                return { ...item, qty: newQty, amount: newQty * item.unitPrice };
              }
              return item;
            });
            updatedFields.items = newItems;
            const totalAmount = newItems.reduce((sum: number, item: any) => sum + item.amount, 0);
            updatedFields.totalAmount = totalAmount;
            updatedFields.grandTotal = totalAmount + (activeDoc.fields.shippingCost || 0);
          } else if (field === 'unitPrice' && items.length > 0) {
            const newItems = items.map((item: any, idx: number) => {
              if (idx === 0) {
                return { ...item, unitPrice: value, amount: item.qty * value };
              }
              return item;
            });
            updatedFields.items = newItems;
            const totalAmount = newItems.reduce((sum: number, item: any) => sum + item.amount, 0);
            updatedFields.totalAmount = totalAmount;
            updatedFields.grandTotal = totalAmount + (activeDoc.fields.shippingCost || 0);
          } else if (field === 'shippingCost') {
            updatedFields.grandTotal = (activeDoc.fields.totalAmount || 0) + value;
          }
        }

        // Apply the update
        updateDocumentFields(activeDoc.id, updatedFields);
        
        toast.success(`${fieldLabel}이(가) ${value}(으)로 변경되었습니다.`);
        
        return {
          isEdit: true,
          response: `✅ ${fieldLabel}을(를) ${formatValue(field, value)}(으)로 변경했어요. 문서에 바로 반영됩니다.`,
          updatedFields,
        };
      }
    }

    // No pattern matched
    return {
      isEdit: false,
      response: '',
    };
  };

  return {
    processEditCommand,
    isEditCommand,
  };
}

// Format value for display
function formatValue(field: string, value: any): string {
  switch (field) {
    case 'moq':
    case 'qty':
      return `${value.toLocaleString()}개`;
    case 'unitPrice':
    case 'shippingCost':
      return `$${value.toFixed(2)}`;
    case 'leadTime':
    case 'validityDays':
      return `${value}일`;
    default:
      return String(value);
  }
}

// Examples for chat hints
export const EDIT_EXAMPLES = [
  { command: 'MOQ를 1000으로 바꿔줘', description: 'MOQ 수정' },
  { command: '단가를 $8.50으로 변경해줘', description: '가격 수정' },
  { command: '납기 14일로 해줘', description: '납기 수정' },
  { command: '인코텀즈 CIF로 바꿔줘', description: '인코텀즈 변경' },
  { command: '유효기간 30일로 수정', description: '견적 유효기간' },
];
