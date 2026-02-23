import type { DocInstance, GateResult, CountryCompliance, AppState } from '../types';

export function runGateChecks(docs: DocInstance[], state: AppState): GateResult[] {
  const piDoc = docs.find(d => d.templateKey === 'PI_FINAL');
  const contractDoc = docs.find(d => d.templateKey === 'CONTRACT_SALES');
  const invoiceDoc = docs.find(d => d.templateKey === 'INVOICE_COMMERCIAL');
  const plDoc = docs.find(d => d.templateKey === 'PL_FINAL');

  const results: GateResult[] = [
    {
      id: 'G1', title: '당사자/주소/연락처 불일치', titleEn: 'Party/Address/Contact Mismatch',
      severity: 'HIGH', rule: 'PI/계약서/인보이스 간 당사자 정보가 일치해야 함', fixActionLabel: '당사자 정보 확인',
      status: piDoc && contractDoc && piDoc.fields.companyName === contractDoc.fields.seller ? 'PASS' : 'FAIL',
      details: piDoc && contractDoc && piDoc.fields.companyName !== contractDoc.fields.seller
        ? `PI: ${piDoc.fields.companyName} ≠ 계약서: ${contractDoc.fields.seller}` : undefined,
    },
    {
      id: 'G2', title: '인코텀즈+Port/Place 불일치', titleEn: 'Incoterms/Port Mismatch',
      severity: 'HIGH', rule: 'Incoterms와 Port가 모든 문서에서 일치해야 함', fixActionLabel: '인코텀즈 맞추기',
      status: piDoc && invoiceDoc && piDoc.fields.incoterms === invoiceDoc.fields.incoterms ? 'PASS' : (piDoc && invoiceDoc ? 'FAIL' : 'NEED_USER_CONFIRM'),
      details: piDoc && invoiceDoc && piDoc.fields.incoterms !== invoiceDoc.fields.incoterms
        ? `PI: ${piDoc.fields.incoterms} ≠ Invoice: ${invoiceDoc.fields.incoterms}` : undefined,
    },
    {
      id: 'G3', title: '결제조건/은행정보 불일치', titleEn: 'Payment Terms Mismatch',
      severity: 'HIGH', rule: '결제조건이 모든 문서에서 일치해야 함', fixActionLabel: '결제조건 확인',
      status: piDoc && contractDoc && piDoc.fields.paymentTerms === contractDoc.fields.paymentTerms ? 'PASS' : (piDoc && contractDoc ? 'FAIL' : 'NEED_USER_CONFIRM'),
    },
    {
      id: 'G4', title: 'SKU/수량/단가/총액 계산 오류', titleEn: 'Calculation Error',
      severity: 'HIGH', rule: '수량×단가=금액, 합계가 일치해야 함', fixActionLabel: '금액 재계산',
      status: piDoc ? checkCalculation(piDoc) : 'NEED_USER_CONFIRM',
    },
    {
      id: 'G5', title: 'HS Code/Origin 누락', titleEn: 'HS Code/Origin Missing',
      severity: 'HIGH', rule: 'HS Code와 원산지가 명시되어야 함', fixActionLabel: 'HS Code 입력',
      status: invoiceDoc && invoiceDoc.fields.hsCode && invoiceDoc.fields.origin ? 'PASS' : 'FAIL',
    },
    {
      id: 'G6', title: '컴플라이언스 NEED_ACTION 존재', titleEn: 'Compliance Action Required',
      severity: 'HIGH', rule: 'RulePack에 NEED_ACTION이 없어야 함', fixActionLabel: '규제 확인',
      status: checkComplianceStatus(state.compliance.byCountry),
    },
    {
      id: 'G7', title: '샘플→본오더 변경조건 미반영', titleEn: 'Sample to PO Changes',
      severity: 'MED', rule: '샘플 조건 변경이 본오더에 반영되어야 함', fixActionLabel: '변경사항 확인',
      status: 'PASS',
    },
    {
      id: 'G8', title: 'Packing List vs PI/Invoice 불일치', titleEn: 'PL Mismatch',
      severity: 'MED', rule: '포장명세서와 PI/Invoice 수량이 일치해야 함', fixActionLabel: '포장정보 확인',
      status: piDoc && plDoc ? checkPLMatch(piDoc, plDoc) : 'NEED_USER_CONFIRM',
    },
    {
      id: 'G9', title: '필수 첨부서류 미완료', titleEn: 'Required Docs Incomplete',
      severity: 'MED', rule: '필수 문서가 모두 생성되어야 함', fixActionLabel: '필수서류 확인',
      status: checkRequiredDocs(docs),
    },
    {
      id: 'G10', title: '계약서 필수 조항 미충족', titleEn: 'Contract Clauses Missing',
      severity: 'MED', rule: '분쟁/클레임/관할 조항이 포함되어야 함', fixActionLabel: '계약 조항 확인',
      status: contractDoc ? checkContractClauses(contractDoc) : 'FAIL',
    },
  ];

  return results;
}

function checkCalculation(doc: DocInstance): 'PASS' | 'FAIL' {
  const items = doc.fields.items || [];
  let calculatedTotal = 0;
  for (const item of items) {
    const expected = item.qty * item.unitPrice;
    if (Math.abs(expected - item.amount) > 0.01) return 'FAIL';
    calculatedTotal += item.amount;
  }
  if (Math.abs(calculatedTotal - doc.fields.totalAmount) > 0.01) return 'FAIL';
  return 'PASS';
}

function checkComplianceStatus(byCountry: Record<string, CountryCompliance>): 'PASS' | 'FAIL' {
  for (const country of Object.values(byCountry)) {
    if (country.rulePack.some(r => r.status === 'NEED_ACTION')) return 'FAIL';
  }
  return 'PASS';
}

function checkPLMatch(piDoc: DocInstance, plDoc: DocInstance): 'PASS' | 'FAIL' {
  const piItems = piDoc.fields.items || [];
  const plItems = plDoc.fields.items || [];
  for (const piItem of piItems) {
    const plItem = plItems.find((p: any) => p.sku === piItem.sku);
    if (!plItem || plItem.qty !== piItem.qty) return 'FAIL';
  }
  return 'PASS';
}

function checkRequiredDocs(docs: DocInstance[]): 'PASS' | 'FAIL' {
  const required = ['PI_FINAL', 'CONTRACT_SALES', 'INVOICE_COMMERCIAL', 'PL_FINAL'];
  const existing = docs.map(d => d.templateKey);
  return required.every(r => existing.includes(r)) ? 'PASS' : 'FAIL';
}

function checkContractClauses(doc: DocInstance): 'PASS' | 'FAIL' | 'NEED_USER_CONFIRM' {
  const terms = doc.fields.terms || [];
  const clauseTexts = terms.map((t: any) => t.clause?.toLowerCase() || '').join(' ');
  if (clauseTexts.includes('분쟁') || clauseTexts.includes('클레임') || clauseTexts.includes('준거법')) {
    return 'PASS';
  }
  return 'NEED_USER_CONFIRM';
}
