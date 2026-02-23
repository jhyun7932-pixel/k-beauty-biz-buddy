// ZIP 내보내기 - HTML 문서 + Meta JSON 파일
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { renderDocument } from '@/lib/templates/templateEngine';
import type { DocumentType, DocumentMode, DocumentData, DocumentTemplateData } from '@/lib/templates/documentTypes';

export type { DocumentType, DocumentMode, DocumentData };

export interface ZipExportOptions {
  documents: {
    type: DocumentType;
    mode: DocumentMode;
  }[];
  data: DocumentData;
  includeAllDocuments?: boolean;
}

// 문서 타입별 파일명
const DOCUMENT_FILENAMES: Record<DocumentType, string> = {
  brand_deck: 'brand_deck',
  catalog: 'catalog',
  compliance: 'compliance_snapshot',
  pi: 'proforma_invoice',
  contract: 'sales_contract',
};

// 문서 타입별 한글 이름
const DOCUMENT_LABELS: Record<DocumentType, string> = {
  brand_deck: '브랜드 소개서',
  catalog: '제품 카탈로그',
  compliance: '수출 준비 요약',
  pi: '견적서(PI)',
  contract: '판매 계약서',
};

/**
 * DocumentData를 DocumentTemplateData로 변환
 */
function convertToTemplateData(data: DocumentData): DocumentTemplateData {
  return {
    workspace: {
      companyName: data.workspace.companyName,
      companyNameKr: data.workspace.companyNameKr,
      brandName: data.workspace.brandName,
      address: data.workspace.address,
      contactEmail: data.workspace.email,
      contactPhone: data.workspace.phone,
      website: data.workspace.website,
      logoUrl: data.workspace.logoUrl,
      defaultIncoterms: data.workspace.incoterms,
      defaultPaymentTerms: data.workspace.paymentTerms,
      defaultMoq: data.workspace.moq,
      defaultLeadTime: data.workspace.leadTime,
      bankName: data.workspace.bankName,
      bankAccountName: data.workspace.bankAccountName,
      bankAccountNo: data.workspace.bankAccountNo,
      bankSwift: data.workspace.bankSwift,
      bankAddress: data.workspace.bankAddress,
      certifications: data.workspace.certifications,
    },
    project: {
      countries: data.project.targetCountries,
      channel: data.project.channel,
      buyerType: data.project.buyerType,
      tradeStage: data.project.tradeStage,
      currency: data.project.currency,
      language: data.project.language,
    },
    skus: data.skus.map((sku, idx) => ({
      id: sku.id,
      no: idx + 1,
      productName: sku.name,
      productNameEn: sku.nameEn,
      sku: sku.skuCode || sku.id,
      category: sku.category,
      spec: `${sku.sizeMlG || '-'}ml`,
      sizeMlG: sku.sizeMlG,
      hsCode: sku.hsCode,
      qty: sku.moq || 100,
      unitPrice: sku.unitPriceRange?.min || 0,
      amount: (sku.moq || 100) * (sku.unitPriceRange?.min || 0),
      moq: sku.moq,
      leadTime: sku.leadTime,
      ingredients: sku.ingredients,
      claims: sku.claims,
      imageUrl: sku.imageUrl,
    })),
    buyer: data.buyer ? {
      companyName: data.buyer.company || '',
      contactName: data.buyer.contact,
      contactEmail: data.buyer.email,
      country: data.buyer.country || '',
      address: data.buyer.address,
      channel: data.buyer.channel,
    } : undefined,
    trade: {
      incoterms: data.trade?.incoterms || data.workspace.incoterms || 'FOB',
      paymentTerms: data.trade?.paymentTerms || data.workspace.paymentTerms || 'T/T',
      leadTime: data.trade?.leadTime || `${data.workspace.leadTime || 20} days`,
      moq: data.trade?.moq || data.workspace.moq || 500,
      currency: data.trade?.currency || data.project.currency,
      validityDays: data.trade?.validityDays || 30,
    },
  };
}

/**
 * 프로젝트 메타데이터 JSON 생성
 */
function generateProjectMeta(data: DocumentData): object {
  return {
    generatedAt: new Date().toISOString(),
    generator: 'K-Beauty Export Ops AI',
    version: '1.0.0',
    project: {
      targetCountries: data.project.targetCountries,
      channel: data.project.channel,
      buyerType: data.project.buyerType,
      tradeStage: data.project.tradeStage,
      currency: data.project.currency,
      language: data.project.language,
    },
    workspace: {
      companyName: data.workspace.companyName,
      brandName: data.workspace.brandName,
      email: data.workspace.email,
      incoterms: data.workspace.incoterms,
      paymentTerms: data.workspace.paymentTerms,
    },
  };
}

/**
 * SKU 메타데이터 JSON 생성
 */
function generateSkusMeta(data: DocumentData): object {
  return {
    generatedAt: new Date().toISOString(),
    totalSkus: data.skus.length,
    skus: data.skus.map(sku => ({
      id: sku.id,
      name: sku.name,
      nameEn: sku.nameEn,
      category: sku.category,
      skuCode: sku.skuCode,
      sizeMlG: sku.sizeMlG,
      moq: sku.moq,
      unitPriceRange: sku.unitPriceRange,
      leadTime: sku.leadTime,
      hsCode: sku.hsCode,
      ingredientCount: sku.ingredients?.length || 0,
    })),
  };
}

/**
 * 바이어 메타데이터 JSON 생성
 */
function generateBuyerMeta(data: DocumentData): object | null {
  if (!data.buyer) return null;
  
  return {
    generatedAt: new Date().toISOString(),
    buyer: {
      company: data.buyer.company,
      contact: data.buyer.contact,
      email: data.buyer.email,
      country: data.buyer.country,
      channel: data.buyer.channel,
      address: data.buyer.address,
    },
  };
}

/**
 * RulePack 버전 메타데이터 JSON 생성
 */
function generateRulepackMeta(data: DocumentData): object {
  return {
    generatedAt: new Date().toISOString(),
    rulepacks: data.project.targetCountries.map(country => ({
      country,
      version: `${country}-Beauty-RulePack v0.3 (MVP sample)`,
      disclaimer: '본 RulePack은 MVP 데모용 샘플이며, 실제 업무 적용은 고객 확인 기반으로 진행해야 합니다.',
    })),
  };
}

/**
 * 모든 문서를 ZIP으로 내보내기
 */
export async function downloadDocumentsAsZip(options: ZipExportOptions): Promise<void> {
  const { documents, data, includeAllDocuments } = options;
  const zip = new JSZip();

  // HTML 폴더 생성
  const htmlFolder = zip.folder('html');
  
  // DocumentData를 DocumentTemplateData로 변환
  const templateData = convertToTemplateData(data);
  
  // 문서 목록 결정
  let docsToExport = documents;
  if (includeAllDocuments) {
    docsToExport = [
      { type: 'brand_deck' as DocumentType, mode: 'summary' as DocumentMode },
      { type: 'catalog' as DocumentType, mode: 'summary' as DocumentMode },
      { type: 'compliance' as DocumentType, mode: 'summary' as DocumentMode },
      { type: 'pi' as DocumentType, mode: 'summary' as DocumentMode },
      { type: 'contract' as DocumentType, mode: 'summary' as DocumentMode },
    ];
  }

  // 각 문서 HTML 생성 및 추가
  for (const doc of docsToExport) {
    try {
      const html = renderDocument(doc.type, doc.mode, templateData);
      const filename = `${DOCUMENT_FILENAMES[doc.type]}_${doc.mode}.html`;
      htmlFolder?.file(filename, html);
    } catch (error) {
      console.error(`Failed to generate ${doc.type}:`, error);
    }
  }

  // Meta 폴더 생성
  const metaFolder = zip.folder('meta');

  // 프로젝트 메타데이터
  metaFolder?.file('project.json', JSON.stringify(generateProjectMeta(data), null, 2));

  // SKU 메타데이터
  metaFolder?.file('skus.json', JSON.stringify(generateSkusMeta(data), null, 2));

  // 바이어 메타데이터 (있는 경우만)
  const buyerMeta = generateBuyerMeta(data);
  if (buyerMeta) {
    metaFolder?.file('buyer.json', JSON.stringify(buyerMeta, null, 2));
  }

  // RulePack 버전 메타데이터
  metaFolder?.file('rulepack_version.json', JSON.stringify(generateRulepackMeta(data), null, 2));

  // 인덱스 파일 생성 (문서 목록)
  const indexContent = generateIndexHtml(docsToExport, data);
  zip.file('index.html', indexContent);

  // README 추가
  const readmeContent = generateReadme(docsToExport, data);
  zip.file('README.md', readmeContent);

  // ZIP 생성 및 다운로드
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  
  const countryLabel = data.project.targetCountries[0] || 'Export';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ExportPackage_${countryLabel}_${dateStr}.zip`;
  
  saveAs(zipBlob, filename);
}

/**
 * 인덱스 HTML 생성
 */
function generateIndexHtml(
  documents: { type: DocumentType; mode: DocumentMode }[],
  data: DocumentData
): string {
  const docLinks = documents
    .map(doc => {
      const filename = `html/${DOCUMENT_FILENAMES[doc.type]}_${doc.mode}.html`;
      const label = DOCUMENT_LABELS[doc.type];
      const modeLabel = doc.mode === 'summary' ? '요약' : '상세';
      return `<li><a href="${filename}">${label} (${modeLabel})</a></li>`;
    })
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Export Package - ${data.workspace.companyName}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #0c1a33; }
    .meta { background: #f6f8fc; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .meta dt { font-weight: 600; color: #5b6b86; }
    .meta dd { margin: 0 0 10px 0; }
    ul { list-style: none; padding: 0; }
    li { margin: 10px 0; }
    a { color: #4aa3ff; text-decoration: none; padding: 10px 16px; background: #eff6ff; border-radius: 8px; display: inline-block; }
    a:hover { background: #dbeafe; }
    .disclaimer { background: #fef3c7; color: #92400e; padding: 16px; border-radius: 8px; margin-top: 30px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>📦 Export Package</h1>
  
  <div class="meta">
    <dl>
      <dt>회사명</dt>
      <dd>${data.workspace.companyName}</dd>
      <dt>대상 국가</dt>
      <dd>${data.project.targetCountries.join(', ')}</dd>
      <dt>채널</dt>
      <dd>${data.project.channel}</dd>
      <dt>생성일</dt>
      <dd>${new Date().toLocaleDateString('ko-KR')}</dd>
    </dl>
  </div>

  <h2>📄 포함 문서</h2>
  <ul>
    ${docLinks}
  </ul>

  <div class="disclaimer">
    <strong>⚠️ 주의사항</strong><br>
    본 패키지의 모든 문서는 "초안"입니다. 최종 제출/서명 전 반드시 확인이 필요합니다.<br>
    규제 정보는 참고용이며, 최신 규정은 각 국가 당국에서 확인하시기 바랍니다.
  </div>

  <footer style="margin-top: 40px; color: #5b6b86; font-size: 12px;">
    Generated by K-Beauty Export Ops AI · ${new Date().toISOString()}
  </footer>
</body>
</html>`;
}

/**
 * README 마크다운 생성
 */
function generateReadme(
  documents: { type: DocumentType; mode: DocumentMode }[],
  data: DocumentData
): string {
  const docList = documents
    .map(doc => `- \`html/${DOCUMENT_FILENAMES[doc.type]}_${doc.mode}.html\` - ${DOCUMENT_LABELS[doc.type]}`)
    .join('\n');

  return `# Export Package

**회사명:** ${data.workspace.companyName}  
**대상 국가:** ${data.project.targetCountries.join(', ')}  
**생성일:** ${new Date().toISOString()}  

## 📁 폴더 구조

\`\`\`
├── index.html          # 문서 목록 (브라우저에서 열기)
├── html/               # HTML 문서 파일
${documents.map(doc => `│   ├── ${DOCUMENT_FILENAMES[doc.type]}_${doc.mode}.html`).join('\n')}
├── meta/               # 메타데이터 JSON
│   ├── project.json    # 프로젝트 설정
│   ├── skus.json       # SKU 정보
│   ├── buyer.json      # 바이어 정보 (있는 경우)
│   └── rulepack_version.json  # 규제 팩 버전
└── README.md           # 이 파일
\`\`\`

## 📄 포함 문서

${docList}

## ⚠️ 주의사항

- 본 패키지의 모든 문서는 **초안**입니다.
- 최종 제출/서명 전 반드시 내용을 확인해주세요.
- 규제 정보는 참고용이며, 최신 규정은 각 국가 당국에서 확인하시기 바랍니다.

## 🖨️ 인쇄 방법

1. 원하는 HTML 파일을 브라우저에서 엽니다.
2. Ctrl+P (Windows) 또는 Cmd+P (Mac)를 눌러 인쇄합니다.
3. "PDF로 저장"을 선택하면 PDF로 변환됩니다.

---

*Generated by K-Beauty Export Ops AI*
`;
}

/**
 * 단일 문서 HTML 다운로드
 */
export function downloadSingleHtml(
  type: DocumentType,
  mode: DocumentMode,
  data: DocumentData
): void {
  const templateData = convertToTemplateData(data);
  const html = renderDocument(type, mode, templateData);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = `${DOCUMENT_FILENAMES[type]}_${mode}.html`;
  saveAs(blob, filename);
}
