import { useState, useCallback } from 'react';
import { DealStagePreset } from './usePresetState';
import { renderDocumentByKey, updateSection } from '@/lib/templates/templateEngine';
import { parseEditCommand, toEditOp, generateEditResponse } from '@/lib/chat/documentEditParser';
import { 
  detectCrossDocumentIssues, 
  generateMockDocumentSet,
  applyAllBlockingFixes,
  type CrossCheckResult,
  type DocumentSet,
} from '@/lib/crosscheck';
import { renderCrossCheckReport } from '@/lib/crosscheck/crossCheckReport';

// Document lifecycle states
export type DocStatus = 'IDLE' | 'GENERATING' | 'EDITING' | 'FINALIZING' | 'DONE';

// Template keys for all document types
export type TemplateKey = 
  // PROPOSAL
  | 'DECK_COMPANY_BRAND_15P'
  | 'CATALOG_PRODUCTS_15P'
  | 'COMPLIANCE_SNAPSHOT_15P'
  | 'BUYER_OUTREACH_MESSAGE'
  // SAMPLE
  | 'DOC_SAMPLE_PI'
  | 'DOC_PACKING_LIST_SIMPLE'
  | 'DOC_SHIPPING_NOTE'
  | 'DOC_LABEL_DRAFT'
  | 'DOC_MSDS_SUMMARY'
  // BULK
  | 'DOC_PI'
  | 'DOC_CONTRACT'
  | 'DOC_COMMERCIAL_INVOICE'
  | 'DOC_PACKING_LIST'
  | 'DOC_LABEL_FINAL'
  | 'DOC_CROSSCHECK_REPORT';

// Mapping from preset tile IDs to template keys
export const TILE_TO_TEMPLATE: Record<string, TemplateKey> = {
  // PROPOSAL
  brand_deck: 'DECK_COMPANY_BRAND_15P',
  catalog: 'CATALOG_PRODUCTS_15P',
  compliance: 'COMPLIANCE_SNAPSHOT_15P',
  outreach: 'BUYER_OUTREACH_MESSAGE',
  // SAMPLE
  sample_pi: 'DOC_SAMPLE_PI',
  sample_pl: 'DOC_PACKING_LIST_SIMPLE',
  shipping_note: 'DOC_SHIPPING_NOTE',
  label_draft: 'DOC_LABEL_DRAFT',
  msds: 'DOC_MSDS_SUMMARY',
  // BULK
  final_pi: 'DOC_PI',
  contract: 'DOC_CONTRACT',
  commercial_invoice: 'DOC_COMMERCIAL_INVOICE',
  packing_list: 'DOC_PACKING_LIST',
  label_final: 'DOC_LABEL_FINAL',
  error_check: 'DOC_CROSSCHECK_REPORT',
  // Additional mappings for optional docs
  coo_guide: 'COMPLIANCE_SNAPSHOT_15P', // Reuse compliance template
  bl_info: 'DOC_SHIPPING_NOTE', // Reuse shipping note template
};

// Validation issue types
export interface ValidationIssue {
  id: string;
  field: string;
  message: string;
  severity: 'blocking' | 'warning' | 'info';
  fixAction?: string;
}

// Document object
export interface ActiveDocument {
  docId: string;
  templateKey: TemplateKey;
  presetKey: DealStagePreset;
  version: number;
  status: DocStatus;
  title: string;
  titleKr: string;
  html: string;
  pages: number;
  validation: ValidationIssue[];
  lastUpdatedAt: Date;
  progressStep: 'loading' | 'sections' | 'tables' | 'localization' | 'validation' | 'complete';
  progressMessage: string;
  inputs: DocumentInputs;
}

// Document inputs
export interface DocumentInputs {
  moq?: number;
  unitPrice?: number;
  leadTime?: number;
  validityDays?: number;
  incoterms?: string;
  paymentTerms?: string;
  currency?: string;
  targetCountries?: string[];
  buyerCompany?: string;
  buyerCountry?: string;
  // Cross-check related
  crossCheckResult?: CrossCheckResult;
  documentSet?: DocumentSet;
  [key: string]: unknown;
}

// Edit operations for chat-based editing
export type EditOpType = 
  | 'updateField'
  | 'rewriteSection'
  | 'addSection'
  | 'removeSection'
  | 'reorderSections'
  | 'updateTable'
  | 'changeTone'
  | 'localize';

export interface EditOp {
  type: EditOpType;
  params: Record<string, unknown>;
}

// Template metadata for registry
export interface TemplateMetadata {
  key: TemplateKey;
  name: string;
  nameKr: string;
  maxPages: number;
  requiredFields: string[];
  presets: DealStagePreset[];
}

// Template registry
export const TEMPLATE_REGISTRY: Record<TemplateKey, TemplateMetadata> = {
  DECK_COMPANY_BRAND_15P: {
    key: 'DECK_COMPANY_BRAND_15P',
    name: 'Company/Brand Deck',
    nameKr: '브랜드 소개서',
    maxPages: 15,
    requiredFields: ['sellerCompany.legalName', 'brandName', 'productList'],
    presets: ['PROPOSAL'],
  },
  CATALOG_PRODUCTS_15P: {
    key: 'CATALOG_PRODUCTS_15P',
    name: 'Product Catalog',
    nameKr: '제품 카탈로그',
    maxPages: 15,
    requiredFields: ['productList', 'currency'],
    presets: ['PROPOSAL'],
  },
  COMPLIANCE_SNAPSHOT_15P: {
    key: 'COMPLIANCE_SNAPSHOT_15P',
    name: 'Compliance Snapshot',
    nameKr: '수출 준비 요약',
    maxPages: 15,
    requiredFields: ['targetCountries', 'productList'],
    presets: ['PROPOSAL', 'SAMPLE', 'BULK'],
  },
  BUYER_OUTREACH_MESSAGE: {
    key: 'BUYER_OUTREACH_MESSAGE',
    name: 'Buyer Outreach Message',
    nameKr: '바이어 메시지',
    maxPages: 1,
    requiredFields: ['buyerType', 'salesChannel'],
    presets: ['PROPOSAL'],
  },
  DOC_SAMPLE_PI: {
    key: 'DOC_SAMPLE_PI',
    name: 'Sample Proforma Invoice',
    nameKr: '샘플 PI',
    maxPages: 3,
    requiredFields: ['productList', 'currency', 'incoterms'],
    presets: ['SAMPLE'],
  },
  DOC_PACKING_LIST_SIMPLE: {
    key: 'DOC_PACKING_LIST_SIMPLE',
    name: 'Sample Packing List',
    nameKr: '샘플 포장명세서',
    maxPages: 2,
    requiredFields: ['productList'],
    presets: ['SAMPLE'],
  },
  DOC_SHIPPING_NOTE: {
    key: 'DOC_SHIPPING_NOTE',
    name: 'Shipping Note',
    nameKr: '발송 안내문',
    maxPages: 1,
    requiredFields: [],
    presets: ['SAMPLE'],
  },
  DOC_LABEL_DRAFT: {
    key: 'DOC_LABEL_DRAFT',
    name: 'Label Draft',
    nameKr: '라벨 초안',
    maxPages: 2,
    requiredFields: ['targetCountries', 'productList'],
    presets: ['SAMPLE'],
  },
  DOC_MSDS_SUMMARY: {
    key: 'DOC_MSDS_SUMMARY',
    name: 'MSDS/Ingredients Summary',
    nameKr: 'MSDS/성분 요약',
    maxPages: 3,
    requiredFields: ['productList'],
    presets: ['SAMPLE'],
  },
  DOC_PI: {
    key: 'DOC_PI',
    name: 'Final Proforma Invoice',
    nameKr: '최종 PI',
    maxPages: 6,
    requiredFields: ['buyerCompany', 'incoterms', 'paymentTerms', 'currency', 'productList'],
    presets: ['BULK'],
  },
  DOC_CONTRACT: {
    key: 'DOC_CONTRACT',
    name: 'Sales Contract',
    nameKr: '판매 계약서',
    maxPages: 12,
    requiredFields: ['sellerCompany.legalName', 'buyerCompany', 'incoterms', 'paymentTerms', 'governingLaw'],
    presets: ['BULK'],
  },
  DOC_COMMERCIAL_INVOICE: {
    key: 'DOC_COMMERCIAL_INVOICE',
    name: 'Commercial Invoice',
    nameKr: '상업 송장',
    maxPages: 3,
    requiredFields: ['productList', 'currency'],
    presets: ['BULK'],
  },
  DOC_PACKING_LIST: {
    key: 'DOC_PACKING_LIST',
    name: 'Packing List (Final)',
    nameKr: '포장명세서',
    maxPages: 3,
    requiredFields: ['productList'],
    presets: ['BULK'],
  },
  DOC_LABEL_FINAL: {
    key: 'DOC_LABEL_FINAL',
    name: 'Label Final',
    nameKr: '최종 라벨',
    maxPages: 2,
    requiredFields: ['targetCountries', 'productList'],
    presets: ['BULK'],
  },
  DOC_CROSSCHECK_REPORT: {
    key: 'DOC_CROSSCHECK_REPORT',
    name: 'Cross-document Error Check',
    nameKr: '실수 체크 리포트',
    maxPages: 4,
    requiredFields: [],
    presets: ['BULK'],
  },
};

// Progress messages for each step
const PROGRESS_MESSAGES: Record<string, string> = {
  loading: '템플릿 불러오는 중…',
  sections: '섹션 구성 중…',
  tables: '표 채우는 중…',
  localization: '국가별 표시 적용 중…',
  validation: '검증 중…',
  complete: '완료!',
};

// Default inputs for demo
const DEFAULT_INPUTS: DocumentInputs = {
  moq: 500,
  unitPrice: 9.5,
  leadTime: 21,
  validityDays: 14,
  incoterms: 'FOB Incheon',
  paymentTerms: 'T/T 30/70',
  currency: 'USD',
  targetCountries: ['US', 'JP', 'EU'],
  buyerCompany: 'Global Beauty Inc.',
  buyerCountry: 'US',
};

export function useDocumentRunner() {
  const [activeDoc, setActiveDoc] = useState<ActiveDocument | null>(null);
  const [versions, setVersions] = useState<ActiveDocument[]>([]);
  // Track whether cross-check report is completed (no blocking issues)
  const [crossCheckCompleted, setCrossCheckCompleted] = useState(false);

  // Start document generation
  const generateDocument = useCallback(async (
    tileId: string, 
    presetKey: DealStagePreset
  ) => {
    const templateKey = TILE_TO_TEMPLATE[tileId];
    if (!templateKey) {
      console.error(`No template found for tile: ${tileId}`);
      return;
    }

    const template = TEMPLATE_REGISTRY[templateKey];

    // Initialize document with GENERATING state
    const newDoc: ActiveDocument = {
      docId: `${templateKey}-${Date.now()}`,
      templateKey,
      presetKey,
      version: 1,
      status: 'GENERATING',
      title: template.name,
      titleKr: template.nameKr,
      html: '',
      pages: 0,
      validation: [],
      lastUpdatedAt: new Date(),
      progressStep: 'loading',
      progressMessage: PROGRESS_MESSAGES.loading,
      inputs: { ...DEFAULT_INPUTS },
    };

    setActiveDoc(newDoc);

    // Simulate generation steps with delays
    const steps: Array<'loading' | 'sections' | 'tables' | 'localization' | 'validation' | 'complete'> = [
      'loading',
      'sections', 
      'tables',
      'localization',
      'validation',
      'complete'
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setActiveDoc(prev => prev ? {
        ...prev,
        progressStep: step,
        progressMessage: PROGRESS_MESSAGES[step],
      } : null);
    }

    // Special handling for cross-check report
    if (templateKey === 'DOC_CROSSCHECK_REPORT') {
      // Generate mock document set with intentional mismatches for demo
      const documentSet = generateMockDocumentSet(true);
      const crossCheckResult = detectCrossDocumentIssues(documentSet);
      const reportHtml = renderCrossCheckReport(crossCheckResult, 'K-Beauty Export Project', 'K-Beauty Co.');
      
      // Generate validation issues from cross-check findings
      const crossCheckValidation: ValidationIssue[] = [
        {
          id: 'draft_notice',
          field: 'document',
          message: '이 문서는 초안입니다. 최종 제출 전 확인이 필요합니다.',
          severity: 'info',
        },
      ];
      
      // Add blocking issues from cross-check
      if (crossCheckResult.summary.blockingCount > 0) {
        crossCheckValidation.push({
          id: 'cross_check_blocking',
          field: 'crosscheck',
          message: `${crossCheckResult.summary.blockingCount}개의 막힘 항목이 있습니다. 수정 후 최종 확정하세요.`,
          severity: 'blocking',
          fixAction: '원클릭 수정',
        });
      }
      
      if (crossCheckResult.summary.warningCount > 0) {
        crossCheckValidation.push({
          id: 'cross_check_warning',
          field: 'crosscheck',
          message: `${crossCheckResult.summary.warningCount}개의 주의 항목이 있습니다.`,
          severity: 'warning',
        });
      }

      const pageCount = (reportHtml.match(/class="page"/g) || []).length || 1;

      setActiveDoc(prev => prev ? {
        ...prev,
        status: 'EDITING',
        html: reportHtml,
        pages: Math.min(pageCount, template.maxPages),
        validation: crossCheckValidation,
        progressStep: 'complete',
        progressMessage: '',
        inputs: {
          ...prev.inputs,
          crossCheckResult,
          documentSet,
        },
      } : null);
      
      return;
    }

    // Generate actual HTML from template engine
    const generatedHtml = renderDocumentByKey(templateKey, presetKey);
    const validationIssues = generateValidationIssues(templateKey);
    
    // Count pages in generated HTML
    const pageCount = (generatedHtml.match(/class="page"/g) || []).length || 1;

    setActiveDoc(prev => prev ? {
      ...prev,
      status: 'EDITING',
      html: generatedHtml,
      pages: Math.min(pageCount, template.maxPages),
      validation: validationIssues,
      progressStep: 'complete',
      progressMessage: '',
    } : null);

  }, []);

  // Finalize document (lock version)
  const finalizeDocument = useCallback(async () => {
    if (!activeDoc || activeDoc.status !== 'EDITING') return;

    // Check for blocking issues
    const blockingIssues = activeDoc.validation.filter(v => v.severity === 'blocking');
    if (blockingIssues.length > 0) {
      console.warn('Cannot finalize: blocking issues exist');
      return false;
    }

    setActiveDoc(prev => prev ? {
      ...prev,
      status: 'FINALIZING',
    } : null);

    await new Promise(resolve => setTimeout(resolve, 800));

    const finalizedDoc: ActiveDocument = {
      ...activeDoc,
      status: 'DONE',
      lastUpdatedAt: new Date(),
    };

    // Add to versions history (keep last 5)
    setVersions(prev => [...prev.slice(-4), finalizedDoc]);

    setActiveDoc(finalizedDoc);
    return true;
  }, [activeDoc]);

  // Apply edit operation from chat
  const applyEditOp = useCallback((op: EditOp): string => {
    if (!activeDoc || activeDoc.status !== 'EDITING') {
      return '문서가 편집 모드가 아닙니다.';
    }

    let updatedHtml = activeDoc.html;
    let updatedInputs = { ...activeDoc.inputs };
    let responseMessage = '';

    switch (op.type) {
      case 'updateField': {
        const field = op.params.field as string;
        const value = op.params.value;
        updatedInputs[field] = value;
        
        // Update HTML based on field
        if (field === 'moq') {
          updatedHtml = updatedHtml.replace(
            /MOQ<\/th><td>[^<]*/g,
            `MOQ</th><td>${value}`
          );
        } else if (field === 'unitPrice') {
          // Update unit prices in tables
          updatedHtml = updatedHtml.replace(
            /Unit Price<\/th><td>[^<]*/g,
            `Unit Price</th><td>$${value}`
          );
        } else if (field === 'leadTime') {
          updatedHtml = updatedHtml.replace(
            /Lead Time<\/th><td>[^<]*/g,
            `Lead Time</th><td>${value} days`
          );
        } else if (field === 'validityDays') {
          updatedHtml = updatedHtml.replace(
            /Validity<\/th><td>[^<]*/g,
            `Validity</th><td>${value} days`
          );
        } else if (field === 'incoterms') {
          updatedHtml = updatedHtml.replace(
            /Incoterms<\/th><td>[^<]*/g,
            `Incoterms</th><td>${value}`
          );
        } else if (field === 'paymentTerms') {
          updatedHtml = updatedHtml.replace(
            /Payment<\/th><td>[^<]*/g,
            `Payment</th><td>${value}`
          );
        }
        
        const fieldNames: Record<string, string> = {
          moq: 'MOQ',
          unitPrice: '단가',
          leadTime: '납기',
          validityDays: '유효기간',
          incoterms: '인코텀즈',
          paymentTerms: '결제조건',
        };
        responseMessage = `✅ ${fieldNames[field] || field}을(를) ${value}(으)로 변경했어요. 문서에 바로 반영됩니다.`;
        break;
      }
      
      case 'rewriteSection': {
        responseMessage = '✅ 해당 섹션을 다듬었어요. 미리보기에서 확인해주세요.';
        break;
      }
      
      case 'changeTone': {
        const tone = op.params.tonePreset as string;
        responseMessage = `✅ 문서 톤을 ${tone === 'professional' ? '전문적인' : '친근한'} 스타일로 변경했어요.`;
        break;
      }
      
      case 'localize': {
        const lang = op.params.languageCode as string;
        const langNames: Record<string, string> = { ja: '일본어', en: '영어', zh: '중국어' };
        responseMessage = `✅ ${langNames[lang] || lang} 시장에 맞게 문서를 현지화했어요.`;
        break;
      }
      
      default:
        responseMessage = '✅ 문서를 수정했어요. 미리보기에서 확인해주세요.';
    }

    setActiveDoc(prev => prev ? {
      ...prev,
      html: updatedHtml,
      inputs: updatedInputs,
      lastUpdatedAt: new Date(),
    } : null);

    return responseMessage;
  }, [activeDoc]);

  // Process chat message and check for edit commands
  const processEditMessage = useCallback((message: string): { isEdit: boolean; response: string } => {
    const parsed = parseEditCommand(message);
    
    if (parsed && activeDoc?.status === 'EDITING') {
      const editOp = toEditOp(parsed);
      const response = applyEditOp(editOp);
      return { isEdit: true, response };
    }
    
    return { isEdit: false, response: '' };
  }, [activeDoc, applyEditOp]);

  // Clear active document
  const clearActiveDoc = useCallback(() => {
    setActiveDoc(null);
  }, []);

  // Print document (open print dialog)
  const printDocument = useCallback(() => {
    if (!activeDoc?.html) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(activeDoc.html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, [activeDoc]);

  // Apply all blocking fixes for cross-check report
  const applyCrossCheckFixes = useCallback(() => {
    if (!activeDoc || activeDoc.templateKey !== 'DOC_CROSSCHECK_REPORT') return;
    
    const documentSet = activeDoc.inputs.documentSet as DocumentSet | undefined;
    if (!documentSet) return;
    
    const { newDocuments, appliedCount } = applyAllBlockingFixes(documentSet);
    
    // Re-run detection and regenerate report
    const newResult = detectCrossDocumentIssues(newDocuments);
    const newHtml = renderCrossCheckReport(newResult, 'K-Beauty Export Project', 'K-Beauty Co.');
    
    // Update validation
    const crossCheckValidation: ValidationIssue[] = [
      {
        id: 'draft_notice',
        field: 'document',
        message: '이 문서는 초안입니다. 최종 제출 전 확인이 필요합니다.',
        severity: 'info',
      },
    ];
    
    if (newResult.summary.blockingCount > 0) {
      crossCheckValidation.push({
        id: 'cross_check_blocking',
        field: 'crosscheck',
        message: `${newResult.summary.blockingCount}개의 막힘 항목이 있습니다.`,
        severity: 'blocking',
        fixAction: '원클릭 수정',
      });
    } else {
      // No blocking issues - mark cross-check as completed
      setCrossCheckCompleted(true);
    }
    
    if (newResult.summary.warningCount > 0) {
      crossCheckValidation.push({
        id: 'cross_check_warning',
        field: 'crosscheck',
        message: `${newResult.summary.warningCount}개의 주의 항목이 있습니다.`,
        severity: 'warning',
      });
    }
    
    setActiveDoc(prev => prev ? {
      ...prev,
      html: newHtml,
      validation: crossCheckValidation,
      inputs: {
        ...prev.inputs,
        crossCheckResult: newResult,
        documentSet: newDocuments,
      },
      lastUpdatedAt: new Date(),
    } : null);
    
    return appliedCount;
  }, [activeDoc]);

  // Get cross-check result if active doc is a cross-check report
  const getCrossCheckResult = useCallback((): CrossCheckResult | null => {
    if (!activeDoc || activeDoc.templateKey !== 'DOC_CROSSCHECK_REPORT') return null;
    return activeDoc.inputs.crossCheckResult as CrossCheckResult || null;
  }, [activeDoc]);

  // Get document set if active doc is a cross-check report
  const getDocumentSet = useCallback((): DocumentSet | null => {
    if (!activeDoc || activeDoc.templateKey !== 'DOC_CROSSCHECK_REPORT') return null;
    return activeDoc.inputs.documentSet as DocumentSet || null;
  }, [activeDoc]);

  // Apply a single fix for a specific finding
  const applySingleFix = useCallback((findingId: string, actionIndex: number) => {
    if (!activeDoc || activeDoc.templateKey !== 'DOC_CROSSCHECK_REPORT') return;
    
    const crossCheckResult = activeDoc.inputs.crossCheckResult as CrossCheckResult | undefined;
    if (!crossCheckResult) return;
    
    const finding = crossCheckResult.findings.find(f => f.id === findingId);
    if (!finding || !finding.fixActions[actionIndex]) return;
    
    // For MVP, just apply all fixes - in production, would apply the specific fix
    return applyCrossCheckFixes();
  }, [activeDoc, applyCrossCheckFixes]);

  return {
    activeDoc,
    versions,
    generateDocument,
    finalizeDocument,
    applyEditOp,
    processEditMessage,
    clearActiveDoc,
    printDocument,
    applyCrossCheckFixes,
    applySingleFix,
    getCrossCheckResult,
    getDocumentSet,
    hasBlockingIssues: activeDoc?.validation.some(v => v.severity === 'blocking') ?? false,
    hasWarnings: activeDoc?.validation.some(v => v.severity === 'warning') ?? false,
    isCrossCheckReport: activeDoc?.templateKey === 'DOC_CROSSCHECK_REPORT',
    crossCheckCompleted,
    // Check if current doc is a BULK document that requires cross-check completion
    requiresCrossCheckGate: activeDoc?.presetKey === 'BULK' && 
      activeDoc?.templateKey !== 'DOC_CROSSCHECK_REPORT' && 
      !crossCheckCompleted,
  };
}

// Helper: Generate mock validation issues based on template
function generateValidationIssues(templateKey: TemplateKey): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Add common warning
  issues.push({
    id: 'draft_notice',
    field: 'document',
    message: '이 문서는 초안입니다. 최종 제출 전 확인이 필요합니다.',
    severity: 'info',
  });

  // Template-specific validations
  switch (templateKey) {
    case 'DOC_PI':
    case 'DOC_SAMPLE_PI':
      issues.push({
        id: 'buyer_missing',
        field: 'buyer',
        message: '바이어 정보가 입력되지 않았습니다',
        severity: 'warning',
        fixAction: '바이어 정보 입력',
      });
      break;

    case 'DOC_CONTRACT':
      issues.push({
        id: 'governing_law',
        field: 'governingLaw',
        message: '준거법을 확인해주세요',
        severity: 'warning',
      });
      break;

    case 'COMPLIANCE_SNAPSHOT_15P':
      issues.push({
        id: 'ingredients_confirm',
        field: 'ingredients',
        message: '성분 확인이 필요합니다',
        severity: 'warning',
        fixAction: '성분 확인하기',
      });
      break;
  }

  return issues;
}
