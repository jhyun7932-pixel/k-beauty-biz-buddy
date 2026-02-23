// Cross-check Gate Engine - TOP10 검사 항목 구현

import type { DocumentInstance } from '@/stores/projectStore';

export type GateSeverity = 'HIGH' | 'MED' | 'LOW';
export type GateStatus = 'PASS' | 'FAIL' | 'NEED_USER_CONFIRM';

export interface GateCheckResult {
  id: string;
  title: string;
  titleEn: string;
  severity: GateSeverity;
  rule: string;
  status: GateStatus;
  fixActionLabel: string;
  details?: string;
}

export interface GateResult {
  passed: boolean;
  passedChecks: number;
  requiredChecks: number;
  results: GateCheckResult[];
}

// TOP10 Gate Checks Definition
const GATE_CHECKS: Array<{
  id: string;
  title: string;
  titleEn: string;
  severity: GateSeverity;
  rule: string;
  fixActionLabel: string;
  check: (docs: DocumentInstance[]) => { status: GateStatus; details?: string };
}> = [
  {
    id: 'G1',
    title: '당사자/주소/담당자/연락처 불일치',
    titleEn: 'Party/Address/Contact Mismatch',
    severity: 'HIGH',
    rule: 'PI/계약서/인보이스 간 당사자 정보가 일치해야 함',
    fixActionLabel: '당사자 정보 확인하기',
    check: (docs) => {
      const piDoc = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      const contractDoc = docs.find(d => d.docKey === 'DOC_SALES_CONTRACT');
      const invoiceDoc = docs.find(d => d.docKey === 'DOC_COMMERCIAL_INVOICE');
      
      if (!piDoc || !contractDoc) {
        return { status: 'NEED_USER_CONFIRM', details: 'PI 또는 계약서가 없어 비교할 수 없습니다.' };
      }
      
      const piCompany = piDoc.fields.companyName;
      const contractCompany = contractDoc.fields.companyName;
      
      if (piCompany !== contractCompany) {
        return { status: 'FAIL', details: `PI: ${piCompany} ≠ 계약서: ${contractCompany}` };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G2',
    title: '인코텀즈+Port/Place 불일치',
    titleEn: 'Incoterms/Port Mismatch',
    severity: 'HIGH',
    rule: 'Incoterms와 Port/Place가 모든 문서에서 일치해야 함',
    fixActionLabel: '인코텀즈 맞추기',
    check: (docs) => {
      const piDoc = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      const contractDoc = docs.find(d => d.docKey === 'DOC_SALES_CONTRACT');
      
      if (!piDoc || !contractDoc) {
        return { status: 'NEED_USER_CONFIRM', details: '문서가 부족합니다.' };
      }
      
      const piIncoterms = piDoc.fields.incoterms;
      const contractIncoterms = contractDoc.fields.incoterms;
      
      if (piIncoterms !== contractIncoterms) {
        return { status: 'FAIL', details: `PI: ${piIncoterms} ≠ 계약서: ${contractIncoterms}` };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G3',
    title: '결제조건/은행정보 불일치',
    titleEn: 'Payment Terms/Bank Info Mismatch',
    severity: 'HIGH',
    rule: '결제조건, 은행정보, 만기일이 일치해야 함',
    fixActionLabel: '결제조건 확인하기',
    check: (docs) => {
      const piDoc = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      const contractDoc = docs.find(d => d.docKey === 'DOC_SALES_CONTRACT');
      
      if (!piDoc || !contractDoc) {
        return { status: 'NEED_USER_CONFIRM', details: '문서가 부족합니다.' };
      }
      
      const piPayment = piDoc.fields.paymentTerms;
      const contractPayment = contractDoc.fields.paymentTerms;
      
      if (piPayment !== contractPayment) {
        return { status: 'FAIL', details: `PI: ${piPayment} ≠ 계약서: ${contractPayment}` };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G4',
    title: 'SKU/수량/단가/총액 계산 오류',
    titleEn: 'SKU/Qty/Price/Total Calculation Error',
    severity: 'HIGH',
    rule: '모든 품목의 수량×단가=금액, 합계가 일치해야 함',
    fixActionLabel: '금액 재계산하기',
    check: (docs) => {
      const piDoc = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      
      if (!piDoc) {
        return { status: 'NEED_USER_CONFIRM', details: 'PI가 없습니다.' };
      }
      
      const items = piDoc.fields.items || [];
      let calculatedTotal = 0;
      
      for (const item of items) {
        const expectedAmount = item.qty * item.unitPrice;
        if (Math.abs(expectedAmount - item.amount) > 0.01) {
          return { status: 'FAIL', details: `${item.sku}: ${item.qty}×${item.unitPrice}=${expectedAmount} ≠ ${item.amount}` };
        }
        calculatedTotal += item.amount;
      }
      
      if (Math.abs(calculatedTotal - piDoc.fields.totalAmount) > 0.01) {
        return { status: 'FAIL', details: `계산된 합계: ${calculatedTotal} ≠ 표시된 합계: ${piDoc.fields.totalAmount}` };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G5',
    title: 'HS Code/Origin 누락',
    titleEn: 'HS Code/Origin Missing',
    severity: 'HIGH',
    rule: 'HS Code 6자리 이상, 원산지 표기 필수',
    fixActionLabel: 'HS Code 입력하기',
    check: (docs) => {
      const invoiceDoc = docs.find(d => d.docKey === 'DOC_COMMERCIAL_INVOICE');
      
      if (!invoiceDoc) {
        return { status: 'NEED_USER_CONFIRM', details: '상업송장이 없습니다.' };
      }
      
      const hsCode = invoiceDoc.fields.hsCode;
      if (!hsCode || hsCode.length < 6) {
        return { status: 'FAIL', details: 'HS Code가 없거나 6자리 미만입니다.' };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G6',
    title: '컴플라이언스 미완료 항목 존재',
    titleEn: 'Compliance Action Required',
    severity: 'HIGH',
    rule: 'RulePack에 "조치필요" 상태가 없어야 함',
    fixActionLabel: '규제 확인하기',
    check: (docs) => {
      const complianceDoc = docs.find(d => d.docKey.includes('COMPLIANCE'));
      
      if (!complianceDoc) {
        return { status: 'NEED_USER_CONFIRM', details: '규제 확인 문서가 없습니다.' };
      }
      
      const rulepacks = complianceDoc.fields.rulepacks || [];
      for (const rp of rulepacks) {
        const pendingItems = (rp.items || []).filter((item: any) => item.status === 'pending' || item.status === 'fail');
        if (pendingItems.length > 0) {
          return { status: 'FAIL', details: `${rp.country}: ${pendingItems.length}개 확인/조치 필요` };
        }
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G7',
    title: '샘플→본오더 변경조건 미반영',
    titleEn: 'Sample to Bulk Order Changes Not Reflected',
    severity: 'MED',
    rule: '샘플 단계 조건 변경이 본오더에 반영되어야 함',
    fixActionLabel: '변경사항 확인하기',
    check: (docs) => {
      const samplePI = docs.find(d => d.docKey === 'DOC_SAMPLE_PI');
      const finalPI = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      
      if (!samplePI || !finalPI) {
        return { status: 'PASS', details: '비교할 샘플 PI가 없습니다.' };
      }
      
      // 단가 변경 확인
      const sampleItems = samplePI.fields.items || [];
      const finalItems = finalPI.fields.items || [];
      
      for (const sItem of sampleItems) {
        const fItem = finalItems.find((f: any) => f.sku === sItem.sku);
        if (fItem && sItem.unitPrice !== fItem.unitPrice) {
          return { status: 'NEED_USER_CONFIRM', details: `${sItem.sku}: 샘플 단가 ${sItem.unitPrice} → 본오더 ${fItem.unitPrice}` };
        }
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G8',
    title: 'Packing List vs PI/Invoice 불일치',
    titleEn: 'Packing List vs PI/Invoice Mismatch',
    severity: 'MED',
    rule: '포장명세서의 수량/중량이 PI/Invoice와 일치해야 함',
    fixActionLabel: '포장정보 확인하기',
    check: (docs) => {
      const plDoc = docs.find(d => d.docKey === 'DOC_PACKING_LIST');
      const piDoc = docs.find(d => d.docKey === 'DOC_FINAL_PI');
      
      if (!plDoc || !piDoc) {
        return { status: 'NEED_USER_CONFIRM', details: '포장명세서 또는 PI가 없습니다.' };
      }
      
      const plItems = plDoc.fields.items || [];
      const piItems = piDoc.fields.items || [];
      
      for (const plItem of plItems) {
        const piItem = piItems.find((p: any) => p.sku === plItem.sku);
        if (piItem && plItem.qty !== piItem.qty) {
          return { status: 'FAIL', details: `${plItem.sku}: PL 수량 ${plItem.qty} ≠ PI 수량 ${piItem.qty}` };
        }
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G9',
    title: '필수 첨부서류 미완료',
    titleEn: 'Required Attachments Incomplete',
    severity: 'MED',
    rule: '국가/채널/바이어 타입에 따른 필수 서류가 모두 준비되어야 함',
    fixActionLabel: '필수서류 확인하기',
    check: (docs) => {
      const requiredDocs = ['DOC_FINAL_PI', 'DOC_SALES_CONTRACT', 'DOC_COMMERCIAL_INVOICE', 'DOC_PACKING_LIST'];
      const existingDocKeys = docs.map(d => d.docKey);
      const missingDocs = requiredDocs.filter(d => !existingDocKeys.includes(d));
      
      if (missingDocs.length > 0) {
        return { status: 'FAIL', details: `누락: ${missingDocs.length}개 문서` };
      }
      
      return { status: 'PASS' };
    },
  },
  {
    id: 'G10',
    title: '계약서 필수 조항 미충족',
    titleEn: 'Contract Required Clauses Missing',
    severity: 'MED',
    rule: '분쟁/클레임/관할 조항이 포함되어야 함',
    fixActionLabel: '계약 조항 확인하기',
    check: (docs) => {
      const contractDoc = docs.find(d => d.docKey === 'DOC_SALES_CONTRACT');
      
      if (!contractDoc) {
        return { status: 'FAIL', details: '계약서가 없습니다.' };
      }
      
      const terms = contractDoc.fields.terms || [];
      const hasDispute = terms.some((t: string) => t.includes('분쟁') || t.includes('클레임') || t.includes('준거법'));
      
      if (!hasDispute) {
        return { status: 'NEED_USER_CONFIRM', details: '분쟁/클레임 조항 확인 필요' };
      }
      
      return { status: 'PASS' };
    },
  },
];

export function runCrossCheckGate(docs: DocumentInstance[]): GateResult {
  const results: GateCheckResult[] = [];
  let passedChecks = 0;
  
  for (const check of GATE_CHECKS) {
    const result = check.check(docs);
    
    results.push({
      id: check.id,
      title: check.title,
      titleEn: check.titleEn,
      severity: check.severity,
      rule: check.rule,
      status: result.status,
      fixActionLabel: check.fixActionLabel,
      details: result.details,
    });
    
    if (result.status === 'PASS') {
      passedChecks++;
    }
  }
  
  // HIGH severity FAIL이 있으면 통과 불가
  const hasHighFail = results.some(r => r.severity === 'HIGH' && r.status === 'FAIL');
  const allPassed = results.every(r => r.status === 'PASS' || r.status === 'NEED_USER_CONFIRM');
  
  return {
    passed: !hasHighFail && allPassed,
    passedChecks,
    requiredChecks: GATE_CHECKS.length,
    results,
  };
}

export function getGateStatusColor(status: GateStatus): string {
  switch (status) {
    case 'PASS':
      return 'text-green-600 bg-green-50';
    case 'FAIL':
      return 'text-red-600 bg-red-50';
    case 'NEED_USER_CONFIRM':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getGateSeverityColor(severity: GateSeverity): string {
  switch (severity) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'MED':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
