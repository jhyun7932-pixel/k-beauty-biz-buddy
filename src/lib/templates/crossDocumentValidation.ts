// Cross-document Validation - 문서 간 일관성 체크

import type { ValidationWarning, DocumentTemplateData } from './documentTypes';

interface DocumentValues {
  currency?: string;
  incoterms?: string;
  paymentTerms?: string;
  leadTime?: string | number;
  moq?: number;
  skuPrices?: Record<string, { qty: number; unitPrice: number; amount: number }>;
}

interface DocumentSet {
  pi?: DocumentValues;
  contract?: DocumentValues;
  catalog?: DocumentValues;
}

// 문서에서 검증용 값 추출
export function extractDocumentValues(
  type: 'pi' | 'contract' | 'catalog',
  data: DocumentTemplateData
): DocumentValues {
  const values: DocumentValues = {
    currency: data.trade?.currency,
    incoterms: data.trade?.incoterms,
    paymentTerms: data.trade?.paymentTerms,
    leadTime: data.trade?.leadTime,
    moq: data.trade?.moq,
    skuPrices: {},
  };

  // SKU별 가격/수량 정보
  data.skus?.forEach(sku => {
    values.skuPrices![sku.sku] = {
      qty: sku.qty,
      unitPrice: sku.unitPrice,
      amount: sku.amount,
    };
  });

  return values;
}

// 문서 간 불일치 검증
export function validateCrossDocument(documents: DocumentSet): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const docTypes = Object.keys(documents).filter(k => documents[k as keyof DocumentSet]) as (keyof DocumentSet)[];

  if (docTypes.length < 2) {
    return warnings; // 비교할 문서가 2개 미만
  }

  // 1. 통화 일치 검증
  const currencies: Record<string, string> = {};
  docTypes.forEach(type => {
    const val = documents[type]?.currency;
    if (val) currencies[type] = val;
  });
  
  const uniqueCurrencies = [...new Set(Object.values(currencies))];
  if (uniqueCurrencies.length > 1) {
    warnings.push({
      id: 'currency_mismatch',
      field: 'currency',
      message: '문서 간 통화가 다릅니다',
      documents: Object.keys(currencies),
      values: currencies,
    });
  }

  // 2. Incoterms 일치 검증
  const incoterms: Record<string, string> = {};
  docTypes.forEach(type => {
    const val = documents[type]?.incoterms;
    if (val) incoterms[type] = val;
  });
  
  const uniqueIncoterms = [...new Set(Object.values(incoterms))];
  if (uniqueIncoterms.length > 1) {
    warnings.push({
      id: 'incoterms_mismatch',
      field: 'incoterms',
      message: '문서 간 인코텀즈가 다릅니다',
      documents: Object.keys(incoterms),
      values: incoterms,
    });
  }

  // 3. Payment Terms 일치 검증
  const paymentTerms: Record<string, string> = {};
  docTypes.forEach(type => {
    const val = documents[type]?.paymentTerms;
    if (val) paymentTerms[type] = val;
  });
  
  const uniquePaymentTerms = [...new Set(Object.values(paymentTerms))];
  if (uniquePaymentTerms.length > 1) {
    warnings.push({
      id: 'payment_mismatch',
      field: 'paymentTerms',
      message: '문서 간 결제 조건이 다릅니다',
      documents: Object.keys(paymentTerms),
      values: paymentTerms,
    });
  }

  // 4. Lead Time 일치 검증
  const leadTimes: Record<string, string | number> = {};
  docTypes.forEach(type => {
    const val = documents[type]?.leadTime;
    if (val) leadTimes[type] = val;
  });
  
  const uniqueLeadTimes = [...new Set(Object.values(leadTimes).map(String))];
  if (uniqueLeadTimes.length > 1) {
    warnings.push({
      id: 'leadtime_mismatch',
      field: 'leadTime',
      message: '문서 간 리드타임이 다릅니다',
      documents: Object.keys(leadTimes),
      values: leadTimes,
    });
  }

  // 5. MOQ 일치 검증
  const moqs: Record<string, number> = {};
  docTypes.forEach(type => {
    const val = documents[type]?.moq;
    if (val) moqs[type] = val;
  });
  
  const uniqueMoqs = [...new Set(Object.values(moqs))];
  if (uniqueMoqs.length > 1) {
    warnings.push({
      id: 'moq_mismatch',
      field: 'moq',
      message: '문서 간 MOQ가 다릅니다',
      documents: Object.keys(moqs),
      values: moqs,
    });
  }

  // 6. SKU별 가격/수량 검증 (PI와 Contract 간)
  if (documents.pi?.skuPrices && documents.contract?.skuPrices) {
    const piSkus = documents.pi.skuPrices;
    const contractSkus = documents.contract.skuPrices;

    Object.keys(piSkus).forEach(sku => {
      if (contractSkus[sku]) {
        // 수량 비교
        if (piSkus[sku].qty !== contractSkus[sku].qty) {
          warnings.push({
            id: `sku_qty_mismatch_${sku}`,
            field: `${sku}.qty`,
            message: `${sku}: PI와 계약서의 수량이 다릅니다`,
            documents: ['pi', 'contract'],
            values: {
              pi: piSkus[sku].qty,
              contract: contractSkus[sku].qty,
            },
          });
        }

        // 단가 비교
        if (piSkus[sku].unitPrice !== contractSkus[sku].unitPrice) {
          warnings.push({
            id: `sku_price_mismatch_${sku}`,
            field: `${sku}.unitPrice`,
            message: `${sku}: PI와 계약서의 단가가 다릅니다`,
            documents: ['pi', 'contract'],
            values: {
              pi: piSkus[sku].unitPrice,
              contract: contractSkus[sku].unitPrice,
            },
          });
        }

        // 총액 비교
        if (piSkus[sku].amount !== contractSkus[sku].amount) {
          warnings.push({
            id: `sku_amount_mismatch_${sku}`,
            field: `${sku}.amount`,
            message: `${sku}: PI와 계약서의 총액이 다릅니다`,
            documents: ['pi', 'contract'],
            values: {
              pi: piSkus[sku].amount,
              contract: contractSkus[sku].amount,
            },
          });
        }
      }
    });
  }

  return warnings;
}

// 값 통일 (기준 문서의 값으로 모든 문서 동기화)
export function unifyValues(
  documents: DocumentSet,
  field: 'currency' | 'incoterms' | 'paymentTerms' | 'leadTime' | 'moq',
  sourceDoc: keyof DocumentSet
): DocumentSet {
  const sourceValue = documents[sourceDoc]?.[field];
  if (sourceValue === undefined) return documents;

  const unified: DocumentSet = {};
  
  (Object.keys(documents) as (keyof DocumentSet)[]).forEach(docType => {
    if (documents[docType]) {
      unified[docType] = {
        ...documents[docType],
        [field]: sourceValue,
      };
    }
  });

  return unified;
}

// 검증 결과 요약
export function getValidationSummary(warnings: ValidationWarning[]): {
  totalWarnings: number;
  criticalCount: number;
  fields: string[];
} {
  const criticalFields = ['currency', 'incoterms', 'paymentTerms'];
  const criticalCount = warnings.filter(w => 
    criticalFields.some(f => w.field.includes(f))
  ).length;

  return {
    totalWarnings: warnings.length,
    criticalCount,
    fields: [...new Set(warnings.map(w => w.field.split('.')[0]))],
  };
}
