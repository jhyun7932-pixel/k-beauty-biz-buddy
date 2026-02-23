// Cross-document Consistency Engine
// Detects mismatches across PI, Contract, Invoice, Packing List

export type DocumentKey = 'DOC_PI' | 'DOC_CONTRACT' | 'DOC_COMMERCIAL_INVOICE' | 'DOC_PACKING_LIST';

export type FindingSeverity = 'BLOCKING' | 'WARNING' | 'OK';

// Canonical field structure extracted from documents
export interface CanonicalFields {
  buyer: {
    companyName?: string;
    contactName?: string;
    email?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  seller: {
    legalName?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  terms: {
    incoterms?: string;
    paymentMethod?: string;
    paymentSplit?: string;
    currency?: string;
    validityDays?: number;
  };
  shipment: {
    shipToCountry?: string;
    shipToCity?: string;
    destinationPort?: string;
    leadTimeDays?: number;
    deliveryDate?: string;
  };
  items: {
    skuId: string;
    skuName: string;
    hsCode?: string;
    qty: number;
    unit?: string;
    unitPrice: number;
    amount: number;
    packaging?: string;
  }[];
  totals: {
    subtotal: number;
    shipping?: number;
    insurance?: number;
    grandTotal: number;
  };
}

// Fix action types
export interface FixAction {
  type: 'APPLY_TO_DOC' | 'ASK_AI' | 'MANUAL_INPUT';
  targetDocKey?: DocumentKey;
  fieldPath?: string;
  value?: unknown;
  label: string;
  prompt?: string;
}

// Individual finding
export interface CrossCheckFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  whyItMatters: string;
  detectedValues: {
    docKey: DocumentKey;
    value: unknown;
  }[];
  recommendedValue?: unknown;
  fixActions: FixAction[];
}

// Missing document suggestion
export interface MissingDocSuggestion {
  docKey: DocumentKey;
  suggestion: string;
}

// Detection result
export interface CrossCheckResult {
  summary: {
    blockingCount: number;
    warningCount: number;
    okCount: number;
    score: number; // 0-100
  };
  findings: CrossCheckFinding[];
  missingDocs: MissingDocSuggestion[];
  itemDiff: ItemDiffRow[];
  totalsDiff: TotalsDiff;
}

export interface ItemDiffRow {
  skuId: string;
  skuName: string;
  qtyPI?: number;
  qtyPL?: number;
  qtyINV?: number;
  unitPricePI?: number;
  unitPriceINV?: number;
  status: 'OK' | 'MISMATCH' | 'MISSING';
}

export interface TotalsDiff {
  piSubtotal?: number;
  invSubtotal?: number;
  piTotal?: number;
  invTotal?: number;
  subtotalStatus: 'OK' | 'MISMATCH' | 'MISSING';
  totalStatus: 'OK' | 'MISMATCH' | 'MISSING';
}

// Document set for cross-checking
export interface DocumentSet {
  DOC_PI?: CanonicalFields;
  DOC_CONTRACT?: CanonicalFields;
  DOC_COMMERCIAL_INVOICE?: CanonicalFields;
  DOC_PACKING_LIST?: CanonicalFields;
}

// Mock data extractor - in real implementation would parse actual document content
export function extractCanonicalFields(_docKey: DocumentKey, _html: string): CanonicalFields {
  // For MVP, return mock data based on document type
  return {
    buyer: {
      companyName: 'Global Beauty Inc.',
      contactName: 'John Smith',
      email: 'john@globalbeauty.com',
      country: 'US',
      addressLine1: '123 Beauty Lane',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
    },
    seller: {
      legalName: 'K-Beauty Export Co., Ltd.',
      addressLine1: '서울시 강남구',
      country: 'Korea',
      email: 'export@kbeauty.com',
      phone: '+82-2-1234-5678',
    },
    terms: {
      incoterms: 'FOB Incheon',
      paymentMethod: 'T/T',
      paymentSplit: '30/70',
      currency: 'USD',
      validityDays: 14,
    },
    shipment: {
      shipToCountry: 'US',
      shipToCity: 'Los Angeles',
      destinationPort: 'Los Angeles Port',
      leadTimeDays: 21,
    },
    items: [
      { skuId: 'SKU001', skuName: 'Hydra Serum 30ml', qty: 500, unitPrice: 9.5, amount: 4750 },
      { skuId: 'SKU002', skuName: 'Glow Cream 50g', qty: 300, unitPrice: 12.0, amount: 3600 },
    ],
    totals: {
      subtotal: 8350,
      shipping: 500,
      grandTotal: 8850,
    },
  };
}

// Generate mock document set with intentional mismatches for demo
export function generateMockDocumentSet(hasMismatches: boolean = true): DocumentSet {
  const baseFields = extractCanonicalFields('DOC_PI', '');
  
  if (!hasMismatches) {
    return {
      DOC_PI: baseFields,
      DOC_CONTRACT: baseFields,
      DOC_COMMERCIAL_INVOICE: baseFields,
      DOC_PACKING_LIST: baseFields,
    };
  }

  // Create mismatches for demo
  return {
    DOC_PI: {
      ...baseFields,
      terms: { ...baseFields.terms, incoterms: 'FOB Incheon' },
      items: [
        { skuId: 'SKU001', skuName: 'Hydra Serum 30ml', qty: 500, unitPrice: 9.5, amount: 4750 },
        { skuId: 'SKU002', skuName: 'Glow Cream 50g', qty: 300, unitPrice: 12.0, amount: 3600 },
      ],
      totals: { subtotal: 8350, shipping: 500, grandTotal: 8850 },
    },
    DOC_CONTRACT: {
      ...baseFields,
      terms: { ...baseFields.terms, incoterms: 'CIF Los Angeles', paymentSplit: '50/50' },
    },
    DOC_COMMERCIAL_INVOICE: {
      ...baseFields,
      items: [
        { skuId: 'SKU001', skuName: 'Hydra Serum 30ml', qty: 480, unitPrice: 9.5, amount: 4560 }, // qty mismatch
        { skuId: 'SKU002', skuName: 'Glow Cream 50g', qty: 300, unitPrice: 11.5, amount: 3450 }, // price mismatch
      ],
      totals: { subtotal: 8010, grandTotal: 8510 },
    },
    DOC_PACKING_LIST: {
      ...baseFields,
      items: [
        { skuId: 'SKU001', skuName: 'Hydra Serum 30ml', qty: 500, unitPrice: 0, amount: 0 },
        { skuId: 'SKU002', skuName: 'Glow Cream 50g', qty: 300, unitPrice: 0, amount: 0 },
      ],
    },
  };
}

// Main cross-check detection function
export function detectCrossDocumentIssues(documents: DocumentSet): CrossCheckResult {
  const findings: CrossCheckFinding[] = [];
  const missingDocs: MissingDocSuggestion[] = [];
  
  // Check for missing critical documents
  if (!documents.DOC_COMMERCIAL_INVOICE) {
    missingDocs.push({
      docKey: 'DOC_COMMERCIAL_INVOICE',
      suggestion: '인보이스가 없으면 통관/정산 단계에서 재작업이 생깁니다. 지금 생성할까요?',
    });
  }
  if (!documents.DOC_PACKING_LIST) {
    missingDocs.push({
      docKey: 'DOC_PACKING_LIST',
      suggestion: '포장명세서가 없으면 물류 확인에 문제가 생길 수 있습니다. 지금 생성할까요?',
    });
  }

  // 1. Check Buyer Company Name
  const buyerNames = collectValues(documents, 'buyer.companyName');
  if (hasMultipleValues(buyerNames)) {
    findings.push({
      id: 'BUYER_NAME_MISMATCH',
      severity: 'BLOCKING',
      title: '바이어 회사명 불일치',
      description: '문서마다 바이어 회사명이 다릅니다.',
      whyItMatters: '바이어 이름이 다르면 통관 시 문제가 발생할 수 있습니다.',
      detectedValues: buyerNames,
      recommendedValue: documents.DOC_CONTRACT?.buyer?.companyName || buyerNames[0]?.value,
      fixActions: generateUnifyActions('buyer.companyName', buyerNames),
    });
  }

  // 2. Check Incoterms
  const incoterms = collectValues(documents, 'terms.incoterms');
  if (hasMultipleValues(incoterms)) {
    findings.push({
      id: 'INCOTERMS_MISMATCH',
      severity: 'BLOCKING',
      title: '인코텀즈 불일치',
      description: '문서마다 인코텀즈가 다릅니다.',
      whyItMatters: '인코텀즈가 일치하지 않으면 비용 분담과 위험 이전 시점에 분쟁이 발생할 수 있습니다.',
      detectedValues: incoterms,
      recommendedValue: documents.DOC_CONTRACT?.terms?.incoterms || incoterms[0]?.value,
      fixActions: generateUnifyActions('terms.incoterms', incoterms),
    });
  }

  // 3. Check Currency
  const currencies = collectValues(documents, 'terms.currency');
  if (hasMultipleValues(currencies)) {
    findings.push({
      id: 'CURRENCY_MISMATCH',
      severity: 'BLOCKING',
      title: '통화 불일치',
      description: '문서마다 결제 통화가 다릅니다.',
      whyItMatters: '통화 불일치는 결제 및 정산에 혼란을 야기합니다.',
      detectedValues: currencies,
      recommendedValue: documents.DOC_PI?.terms?.currency || currencies[0]?.value,
      fixActions: generateUnifyActions('terms.currency', currencies),
    });
  }

  // 4. Check Payment Terms
  const paymentTerms = collectValues(documents, 'terms.paymentSplit');
  if (hasMultipleValues(paymentTerms)) {
    findings.push({
      id: 'PAYMENT_MISMATCH',
      severity: 'BLOCKING',
      title: '결제 조건 불일치',
      description: 'PI와 계약서의 결제 조건이 다릅니다.',
      whyItMatters: '결제 조건 불일치는 대금 수령에 문제를 일으킬 수 있습니다.',
      detectedValues: paymentTerms,
      recommendedValue: documents.DOC_CONTRACT?.terms?.paymentSplit || paymentTerms[0]?.value,
      fixActions: generateUnifyActions('terms.paymentSplit', paymentTerms),
    });
  }

  // 5. Check Lead Time
  const leadTimes = collectValues(documents, 'shipment.leadTimeDays');
  if (hasMultipleValues(leadTimes)) {
    findings.push({
      id: 'LEADTIME_MISMATCH',
      severity: 'WARNING',
      title: '리드타임 불일치',
      description: '문서마다 리드타임이 다릅니다.',
      whyItMatters: '납기 불일치는 배송 지연 클레임의 원인이 됩니다.',
      detectedValues: leadTimes,
      recommendedValue: documents.DOC_CONTRACT?.shipment?.leadTimeDays || leadTimes[0]?.value,
      fixActions: generateUnifyActions('shipment.leadTimeDays', leadTimes),
    });
  }

  // 6. Check Destination Port
  const destinations = collectValues(documents, 'shipment.destinationPort');
  if (hasMultipleValues(destinations)) {
    findings.push({
      id: 'DESTINATION_MISMATCH',
      severity: 'WARNING',
      title: '목적지 불일치',
      description: 'PI와 인보이스의 목적지가 다릅니다.',
      whyItMatters: '목적지 불일치는 물류 비용 추가 발생 원인이 됩니다.',
      detectedValues: destinations,
      recommendedValue: documents.DOC_PI?.shipment?.destinationPort || destinations[0]?.value,
      fixActions: generateUnifyActions('shipment.destinationPort', destinations),
    });
  }

  // Build item diff table
  const itemDiff = buildItemDiffTable(documents);
  
  // Check for item-level mismatches
  const qtyMismatches = itemDiff.filter(row => row.status === 'MISMATCH' && 
    (row.qtyPI !== row.qtyINV || row.qtyPI !== row.qtyPL));
  if (qtyMismatches.length > 0) {
    findings.push({
      id: 'QTY_MISMATCH',
      severity: 'BLOCKING',
      title: 'SKU 수량 불일치',
      description: `${qtyMismatches.length}개 SKU의 수량이 문서마다 다릅니다.`,
      whyItMatters: '수량 불일치는 통관 및 대금 정산에 직접적인 문제를 일으킵니다.',
      detectedValues: qtyMismatches.map(row => ({
        docKey: 'DOC_PI' as DocumentKey,
        value: `${row.skuName}: PI=${row.qtyPI}, INV=${row.qtyINV}, PL=${row.qtyPL}`,
      })),
      recommendedValue: 'PI 수량 기준으로 통일',
      fixActions: [
        { type: 'APPLY_TO_DOC', label: 'PI 수량으로 통일하기', targetDocKey: 'DOC_COMMERCIAL_INVOICE', fieldPath: 'items' },
        { type: 'ASK_AI', label: 'AI에게 확인 요청', prompt: '수량 불일치를 확인해주세요' },
      ],
    });
  }

  const priceMismatches = itemDiff.filter(row => row.status === 'MISMATCH' && 
    row.unitPricePI !== row.unitPriceINV);
  if (priceMismatches.length > 0) {
    findings.push({
      id: 'PRICE_MISMATCH',
      severity: 'BLOCKING',
      title: 'SKU 단가 불일치',
      description: `${priceMismatches.length}개 SKU의 단가가 PI와 인보이스에서 다릅니다.`,
      whyItMatters: '단가 불일치는 대금 정산 분쟁의 주요 원인입니다.',
      detectedValues: priceMismatches.map(row => ({
        docKey: 'DOC_PI' as DocumentKey,
        value: `${row.skuName}: PI=$${row.unitPricePI}, INV=$${row.unitPriceINV}`,
      })),
      recommendedValue: 'PI 단가 기준으로 통일',
      fixActions: [
        { type: 'APPLY_TO_DOC', label: 'PI 단가로 통일하기', targetDocKey: 'DOC_COMMERCIAL_INVOICE', fieldPath: 'items.unitPrice' },
        { type: 'ASK_AI', label: 'AI에게 확인 요청', prompt: '단가 불일치를 확인해주세요' },
      ],
    });
  }

  // Build totals diff
  const totalsDiff = buildTotalsDiff(documents);
  if (totalsDiff.subtotalStatus === 'MISMATCH' || totalsDiff.totalStatus === 'MISMATCH') {
    findings.push({
      id: 'TOTALS_MISMATCH',
      severity: 'BLOCKING',
      title: '총액 불일치',
      description: 'PI와 인보이스의 총액이 다릅니다.',
      whyItMatters: '총액 불일치는 결제 및 정산에 직접적인 문제를 일으킵니다.',
      detectedValues: [
        { docKey: 'DOC_PI', value: `합계: $${totalsDiff.piTotal}` },
        { docKey: 'DOC_COMMERCIAL_INVOICE', value: `합계: $${totalsDiff.invTotal}` },
      ],
      recommendedValue: `$${totalsDiff.piTotal}`,
      fixActions: [
        { type: 'APPLY_TO_DOC', label: 'PI 총액으로 통일', targetDocKey: 'DOC_COMMERCIAL_INVOICE', fieldPath: 'totals.grandTotal' },
      ],
    });
  }

  // Calculate score
  const blockingCount = findings.filter(f => f.severity === 'BLOCKING').length;
  const warningCount = findings.filter(f => f.severity === 'WARNING').length;
  const okCount = 12 - blockingCount - warningCount; // 12 core checks
  const score = Math.max(0, 100 - (blockingCount * 12 + warningCount * 4));

  return {
    summary: {
      blockingCount,
      warningCount,
      okCount,
      score,
    },
    findings,
    missingDocs,
    itemDiff,
    totalsDiff,
  };
}

// Helper: collect values from all documents for a specific field path
function collectValues(
  documents: DocumentSet, 
  fieldPath: string
): { docKey: DocumentKey; value: unknown }[] {
  const results: { docKey: DocumentKey; value: unknown }[] = [];
  const keys: DocumentKey[] = ['DOC_PI', 'DOC_CONTRACT', 'DOC_COMMERCIAL_INVOICE', 'DOC_PACKING_LIST'];
  
  for (const key of keys) {
    const doc = documents[key];
    if (!doc) continue;
    
    const value = getNestedValue(doc, fieldPath);
    if (value !== undefined && value !== null) {
      results.push({ docKey: key, value });
    }
  }
  
  return results;
}

// Helper: get nested value from object
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

// Helper: check if there are multiple distinct values
function hasMultipleValues(values: { docKey: DocumentKey; value: unknown }[]): boolean {
  if (values.length < 2) return false;
  const uniqueValues = new Set(values.map(v => JSON.stringify(v.value)));
  return uniqueValues.size > 1;
}

// Helper: generate fix actions for unifying values
function generateUnifyActions(
  _fieldPath: string, 
  values: { docKey: DocumentKey; value: unknown }[]
): FixAction[] {
  const actions: FixAction[] = [];
  const uniqueValues = [...new Set(values.map(v => v.value))];
  
  // Add action for each unique value source
  for (const val of uniqueValues) {
    const sourceDoc = values.find(v => v.value === val)?.docKey;
    if (sourceDoc) {
      const docNames: Record<DocumentKey, string> = {
        DOC_PI: 'PI',
        DOC_CONTRACT: '계약서',
        DOC_COMMERCIAL_INVOICE: '인보이스',
        DOC_PACKING_LIST: '포장명세서',
      };
      actions.push({
        type: 'APPLY_TO_DOC',
        label: `${docNames[sourceDoc]} 값으로 맞추기 (${val})`,
        value: val,
        targetDocKey: sourceDoc,
      });
    }
  }
  
  // Add AI assist action
  actions.push({
    type: 'ASK_AI',
    label: 'AI에게 수정 요청',
    prompt: '이 값들이 서로 다릅니다. 어떤 값으로 통일해야 하나요?',
  });
  
  return actions;
}

// Helper: build item diff table
function buildItemDiffTable(documents: DocumentSet): ItemDiffRow[] {
  const allSkus = new Map<string, ItemDiffRow>();
  
  // Collect from PI
  documents.DOC_PI?.items?.forEach(item => {
    allSkus.set(item.skuId, {
      skuId: item.skuId,
      skuName: item.skuName,
      qtyPI: item.qty,
      unitPricePI: item.unitPrice,
      status: 'OK',
    });
  });
  
  // Add from Invoice
  documents.DOC_COMMERCIAL_INVOICE?.items?.forEach(item => {
    const existing = allSkus.get(item.skuId);
    if (existing) {
      existing.qtyINV = item.qty;
      existing.unitPriceINV = item.unitPrice;
      // Check for mismatches
      if (existing.qtyPI !== item.qty || existing.unitPricePI !== item.unitPrice) {
        existing.status = 'MISMATCH';
      }
    } else {
      allSkus.set(item.skuId, {
        skuId: item.skuId,
        skuName: item.skuName,
        qtyINV: item.qty,
        unitPriceINV: item.unitPrice,
        status: 'MISSING',
      });
    }
  });
  
  // Add from Packing List
  documents.DOC_PACKING_LIST?.items?.forEach(item => {
    const existing = allSkus.get(item.skuId);
    if (existing) {
      existing.qtyPL = item.qty;
      // Check for qty mismatch with PI
      if (existing.qtyPI !== item.qty) {
        existing.status = 'MISMATCH';
      }
    }
  });
  
  return Array.from(allSkus.values());
}

// Helper: build totals diff
function buildTotalsDiff(documents: DocumentSet): TotalsDiff {
  const pi = documents.DOC_PI?.totals;
  const inv = documents.DOC_COMMERCIAL_INVOICE?.totals;
  
  return {
    piSubtotal: pi?.subtotal,
    invSubtotal: inv?.subtotal,
    piTotal: pi?.grandTotal,
    invTotal: inv?.grandTotal,
    subtotalStatus: !pi || !inv ? 'MISSING' : 
      pi.subtotal === inv.subtotal ? 'OK' : 'MISMATCH',
    totalStatus: !pi || !inv ? 'MISSING' : 
      pi.grandTotal === inv.grandTotal ? 'OK' : 'MISMATCH',
  };
}

// Apply fix plan - returns list of documents that were updated
export function applyFixPlan(
  documents: DocumentSet,
  findingId: string,
  actionIndex: number
): { updatedDocs: DocumentKey[]; newDocuments: DocumentSet } {
  // In real implementation, this would apply the fix to actual document inputs
  // For MVP, just return the documents as-is with a log
  console.log(`Applying fix for ${findingId}, action ${actionIndex}`);
  
  // Mock: just return same documents
  return {
    updatedDocs: [],
    newDocuments: documents,
  };
}

// Apply all blocking fixes automatically
export function applyAllBlockingFixes(documents: DocumentSet): {
  updatedDocs: DocumentKey[];
  newDocuments: DocumentSet;
  appliedCount: number;
} {
  const result = detectCrossDocumentIssues(documents);
  const blockingFindings = result.findings.filter(f => f.severity === 'BLOCKING');
  
  let appliedCount = 0;
  let currentDocs = { ...documents };
  const allUpdatedDocs = new Set<DocumentKey>();
  
  for (const finding of blockingFindings) {
    if (finding.fixActions.length > 0 && finding.fixActions[0].type === 'APPLY_TO_DOC') {
      const { updatedDocs, newDocuments } = applyFixPlan(currentDocs, finding.id, 0);
      currentDocs = newDocuments;
      updatedDocs.forEach(doc => allUpdatedDocs.add(doc));
      appliedCount++;
    }
  }
  
  return {
    updatedDocs: Array.from(allUpdatedDocs),
    newDocuments: currentDocs,
    appliedCount,
  };
}
