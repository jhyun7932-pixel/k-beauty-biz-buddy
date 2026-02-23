import type { AppState, TargetCountry } from '../types';
import { COUNTRY_NAMES } from '../types';
import { getDefaultRulepackItems } from './complianceHelpers';

// ============ Deep Merge Utility ============
export function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// ============ Default Fields Generator ============
export function generateDefaultFields(templateKey: string, state: AppState): Record<string, any> {
  const { project, companyProfile, productProfile } = state;

  const base = {
    language: project.language,
    currency: project.currency,
    targetCountries: project.targetCountries,
    salesChannel: project.channel,
    buyerType: project.buyerType,
    incoterms: project.incotermsDefault,
    paymentTerms: project.paymentDefault,
    companyName: companyProfile.companyName,
    address: companyProfile.address,
    phone: companyProfile.phone,
    website: companyProfile.website,
  };

  switch (templateKey) {
    case 'DECK_COMPANY_BRAND_15P':
      return {
        ...base,
        sections: ['회사 소개', '브랜드 철학', '제품 라인업', '인증 현황', '수출 실적', '연락처'],
        highlights: ['10년+ 화장품 제조 경력', 'CGMP/ISO 22716 인증', '50+ 글로벌 파트너', '자체 R&D 센터 보유'],
      };
    case 'CATALOG_15P':
      return {
        ...base,
        categories: productProfile.category ? [productProfile.category] : ['스킨케어', '메이크업'],
        products: productProfile.skuList.length > 0 ? productProfile.skuList : [
          { sku: 'HS-001', name: 'Hydra Serum 30ml', category: '스킨케어', unitPrice: 4.5, moq: 500 },
          { sku: 'GC-001', name: 'Glow Cream 50ml', category: '스킨케어', unitPrice: 5.2, moq: 300 },
        ],
      };
    case 'COMPLIANCE_SNAPSHOT_15P':
      return {
        ...base,
        rulepacks: project.targetCountries.map(c => ({
          country: c,
          countryName: COUNTRY_NAMES[c],
          items: getDefaultRulepackItems(c),
        })),
      };
    case 'EMAIL_FIRST_OUTREACH':
    case 'EMAIL_FOLLOW_UP':
    case 'EMAIL_SAMPLE':
      return {
        ...base,
        subject: templateKey === 'EMAIL_FIRST_OUTREACH'
          ? `[K-Beauty Partner Inquiry] ${companyProfile.companyName} Product Introduction`
          : templateKey === 'EMAIL_SAMPLE'
          ? `[Sample Shipment] ${companyProfile.companyName} - Sample Package Notification`
          : `[Follow-up] ${companyProfile.companyName} - Regarding Our Previous Discussion`,
        greeting: 'Dear Partner,',
        body: 'We are pleased to introduce our premium K-Beauty products...',
        closing: 'Best regards,',
        signature: companyProfile.exportEmailSignature || `${companyProfile.companyName}\nExport Team`,
      };
    case 'PI_SAMPLE':
    case 'PI_FINAL':
      return {
        ...base,
        piNumber: `PI-${Date.now().toString().slice(-8)}`,
        validityDays: 30,
        items: productProfile.skuList.map(s => ({
          sku: s.sku, name: s.name,
          qty: templateKey === 'PI_SAMPLE' ? 50 : s.moq,
          unitPrice: s.unitPrice,
          amount: (templateKey === 'PI_SAMPLE' ? 50 : s.moq) * s.unitPrice,
        })),
        totalAmount: productProfile.skuList.reduce((sum, s) => sum + (templateKey === 'PI_SAMPLE' ? 50 : s.moq) * s.unitPrice, 0),
        shippingCost: 150,
        get grandTotal() { return this.totalAmount + this.shippingCost; },
        moq: productProfile.skuList[0]?.moq || 500,
        leadTime: productProfile.skuList[0]?.leadTimeDays || 14,
        hsCode: '3304.99',
        origin: 'Republic of Korea',
        portOfLoading: 'Incheon, Korea',
        portOfDischarge: project.targetCountries[0] === 'US' ? 'Los Angeles, USA' : 'Destination Port',
      };
    case 'PL_SAMPLE':
    case 'PL_FINAL':
      return {
        ...base,
        plNumber: `PL-${Date.now().toString().slice(-8)}`,
        items: productProfile.skuList.map(s => ({
          sku: s.sku, name: s.name,
          qty: templateKey === 'PL_SAMPLE' ? 50 : s.moq,
          cartons: Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) / 20),
          grossWeight: Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) * 0.15),
          netWeight: Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) * 0.12),
        })),
        totalCartons: productProfile.skuList.reduce((sum, s) => sum + Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) / 20), 0),
        totalGrossWeight: productProfile.skuList.reduce((sum, s) => sum + Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) * 0.15), 0),
        totalNetWeight: productProfile.skuList.reduce((sum, s) => sum + Math.ceil((templateKey === 'PL_SAMPLE' ? 50 : s.moq) * 0.12), 0),
        totalCBM: 0.5,
        dimensions: '60x40x50cm per carton',
      };
    case 'MEMO_LABEL_CHECK':
      return {
        ...base,
        checkItems: [
          { item: 'Brand Logo', status: 'OK', note: '로고 위치 및 크기 확인' },
          { item: 'INCI List', status: 'NEED_CHECK', note: '영문 전성분 표기 확인 필요' },
          { item: 'Country of Origin', status: 'OK', note: 'Made in Korea 표기 확인' },
          { item: 'Net Contents', status: 'NEED_CHECK', note: 'ml/oz 병기 확인' },
          { item: 'Warnings', status: 'NEED_CHECK', note: '주의사항 현지어 번역 필요' },
        ],
      };
    case 'CONTRACT_SALES':
      return {
        ...base,
        contractNumber: `SC-${Date.now().toString().slice(-8)}`,
        effectiveDate: new Date().toISOString().split('T')[0],
        seller: companyProfile.companyName,
        sellerAddress: companyProfile.address,
        buyer: 'Buyer Company Name',
        buyerAddress: 'Buyer Address',
        terms: [
          { clause: '품질 보증', content: '제조일로부터 24개월' },
          { clause: '클레임 기한', content: '수령 후 14일 이내' },
          { clause: '준거법', content: '대한민국 법' },
          { clause: '분쟁 해결', content: '서울중앙지방법원 관할' },
          { clause: 'Force Majeure', content: '불가항력 조항 적용' },
        ],
        productDescription: productProfile.skuList.map(s => `${s.sku}: ${s.name}`).join(', '),
        totalValue: productProfile.skuList.reduce((sum, s) => sum + s.moq * s.unitPrice, 0),
      };
    case 'INVOICE_COMMERCIAL':
      return {
        ...base,
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        items: productProfile.skuList.map(s => ({
          sku: s.sku, name: s.name, qty: s.moq,
          unitPrice: s.unitPrice, amount: s.moq * s.unitPrice,
        })),
        totalAmount: productProfile.skuList.reduce((sum, s) => sum + s.moq * s.unitPrice, 0),
        hsCode: '3304.99',
        origin: 'Republic of Korea',
      };
    case 'SHIPPING_INSTRUCTION':
      return {
        ...base,
        shipper: companyProfile.companyName,
        shipperAddress: companyProfile.address,
        consignee: 'Consignee Name',
        consigneeAddress: 'Consignee Address',
        notifyParty: 'Notify Party',
        vesselName: 'TBD',
        voyageNo: 'TBD',
        etd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        eta: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        portOfLoading: 'Incheon, Korea',
        portOfDischarge: 'Destination Port',
        cargoDescription: productProfile.skuList.map(s => s.name).join(', '),
        totalPackages: productProfile.skuList.reduce((sum, s) => sum + Math.ceil(s.moq / 20), 0),
        grossWeight: productProfile.skuList.reduce((sum, s) => sum + Math.ceil(s.moq * 0.15), 0),
      };
    case 'GATE_CROSSCHECK_PO':
      return { ...base, gateItems: [] };
    default:
      return base;
  }
}

// ============ HTML Generation ============
export function generateDocumentHTML(templateKey: string, fields: Record<string, any>): string {
  const { currency, companyName, phone, website, address } = fields;

  const header = `
    <div style="border-bottom: 3px solid #2F6BFF; padding-bottom: 20px; margin-bottom: 25px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="color: #1a365d; margin: 0; font-size: 26px; font-weight: 700;">${getDocTitle(templateKey)}</h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">${getDocTitleEn(templateKey)}</p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #666;">
          <p style="margin: 0;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  `;

  const companyInfo = `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #2F6BFF;">
      <h3 style="margin: 0 0 12px 0; color: #1a365d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Seller / 수출자</h3>
      <p style="margin: 5px 0; font-weight: 600; font-size: 16px; color: #1a365d;">${companyName}</p>
      <p style="margin: 5px 0; font-size: 13px; color: #4a5568;">${address}</p>
      <p style="margin: 5px 0; font-size: 13px; color: #4a5568;">📞 ${phone} | 🌐 ${website}</p>
    </div>
  `;

  switch (templateKey) {
    case 'PI_SAMPLE':
    case 'PI_FINAL':
      return generatePIHTML(fields, header, companyInfo, currency, templateKey === 'PI_FINAL');
    case 'DECK_COMPANY_BRAND_15P':
      return generateDeckHTML(fields, header, companyName);
    case 'CATALOG_15P':
      return generateCatalogHTML(fields, header, companyInfo, currency);
    case 'COMPLIANCE_SNAPSHOT_15P':
      return generateComplianceHTML(fields, header, companyInfo);
    case 'CONTRACT_SALES':
      return generateContractHTML(fields, header, companyInfo, currency);
    case 'INVOICE_COMMERCIAL':
      return generateInvoiceHTML(fields, header, companyInfo, currency);
    case 'PL_SAMPLE':
    case 'PL_FINAL':
      return generatePackingListHTML(fields, header, companyInfo);
    case 'SHIPPING_INSTRUCTION':
      return generateShippingHTML(fields, header);
    case 'EMAIL_FIRST_OUTREACH':
    case 'EMAIL_FOLLOW_UP':
    case 'EMAIL_SAMPLE':
      return generateEmailHTML(fields, templateKey);
    case 'MEMO_LABEL_CHECK':
      return generateLabelCheckHTML(fields, header);
    default:
      return `<div style="font-family: 'Noto Sans KR', sans-serif; padding: 30px;">${header}${companyInfo}<p>Document content will be generated.</p></div>`;
  }
}

function getDocTitle(templateKey: string): string {
  const titles: Record<string, string> = {
    'PI_SAMPLE': '샘플 Proforma Invoice', 'PI_FINAL': '최종 Proforma Invoice',
    'DECK_COMPANY_BRAND_15P': '브랜드 소개서', 'CATALOG_15P': '제품 카탈로그',
    'COMPLIANCE_SNAPSHOT_15P': '수출 준비 요약', 'CONTRACT_SALES': '판매 계약서',
    'INVOICE_COMMERCIAL': '상업 송장', 'PL_SAMPLE': '샘플 포장명세서', 'PL_FINAL': '포장명세서',
    'SHIPPING_INSTRUCTION': '선적 지시서', 'EMAIL_FIRST_OUTREACH': '첫 제안 이메일',
    'EMAIL_FOLLOW_UP': '후속 이메일', 'EMAIL_SAMPLE': '샘플 이메일', 'MEMO_LABEL_CHECK': '라벨 체크 메모',
  };
  return titles[templateKey] || 'Document';
}

function getDocTitleEn(templateKey: string): string {
  const titles: Record<string, string> = {
    'PI_SAMPLE': 'Sample Proforma Invoice', 'PI_FINAL': 'Final Proforma Invoice',
    'DECK_COMPANY_BRAND_15P': 'Company/Brand Deck', 'CATALOG_15P': 'Product Catalog',
    'COMPLIANCE_SNAPSHOT_15P': 'Export Compliance Snapshot', 'CONTRACT_SALES': 'Sales Contract',
    'INVOICE_COMMERCIAL': 'Commercial Invoice', 'PL_SAMPLE': 'Sample Packing List', 'PL_FINAL': 'Packing List',
    'SHIPPING_INSTRUCTION': 'Shipping Instructions', 'EMAIL_FIRST_OUTREACH': 'First Outreach Email',
    'EMAIL_FOLLOW_UP': 'Follow-up Email', 'EMAIL_SAMPLE': 'Sample Email', 'MEMO_LABEL_CHECK': 'Label Check Memo',
  };
  return titles[templateKey] || 'Document';
}

function generatePIHTML(fields: Record<string, any>, header: string, companyInfo: string, currency: string, isFinal: boolean): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; background: white;">
      ${header}
      ${companyInfo}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>PI No.:</strong> ${fields.piNumber}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Validity:</strong> ${fields.validityDays} days</p>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Incoterms:</strong> ${fields.incoterms}</p>
          <p style="margin: 5px 0;"><strong>Payment:</strong> ${fields.paymentTerms}</p>
          <p style="margin: 5px 0;"><strong>Lead Time:</strong> ${fields.leadTime} days</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <th style="padding: 14px 12px; text-align: left; font-size: 13px;">SKU</th>
            <th style="padding: 14px 12px; text-align: left; font-size: 13px;">Product</th>
            <th style="padding: 14px 12px; text-align: right; font-size: 13px;">Qty</th>
            <th style="padding: 14px 12px; text-align: right; font-size: 13px;">Unit Price</th>
            <th style="padding: 14px 12px; text-align: right; font-size: 13px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(fields.items || []).map((item: any, i: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? 'white' : '#f8fafc'};">
              <td style="padding: 12px; font-size: 13px; font-family: monospace;">${item.sku}</td>
              <td style="padding: 12px; font-size: 13px;">${item.name}</td>
              <td style="padding: 12px; text-align: right; font-size: 13px;">${item.qty?.toLocaleString()}</td>
              <td style="padding: 12px; text-align: right; font-size: 13px;">${currency} ${item.unitPrice?.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; font-size: 13px; font-weight: 500;">${currency} ${item.amount?.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9;">
            <td colspan="4" style="padding: 12px; text-align: right; font-weight: 500;">Subtotal:</td>
            <td style="padding: 12px; text-align: right; font-weight: 600;">${currency} ${fields.totalAmount?.toFixed(2)}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td colspan="4" style="padding: 12px; text-align: right;">Shipping (${fields.incoterms}):</td>
            <td style="padding: 12px; text-align: right;">${currency} ${fields.shippingCost?.toFixed(2)}</td>
          </tr>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <td colspan="4" style="padding: 14px; text-align: right; font-weight: 600; font-size: 15px;">GRAND TOTAL:</td>
            <td style="padding: 14px; text-align: right; font-weight: 700; font-size: 16px;">${currency} ${(fields.totalAmount + fields.shippingCost)?.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <h4 style="margin: 0 0 15px 0; color: #1a365d; font-size: 14px;">📋 Terms & Conditions</h4>
          <p style="margin: 8px 0; font-size: 13px;"><strong>MOQ:</strong> ${fields.moq} units per SKU</p>
          <p style="margin: 8px 0; font-size: 13px;"><strong>HS Code:</strong> ${fields.hsCode || 'TBD'}</p>
          <p style="margin: 8px 0; font-size: 13px;"><strong>Origin:</strong> ${fields.origin || 'Republic of Korea'}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <h4 style="margin: 0 0 15px 0; color: #1a365d; font-size: 14px;">🚢 Shipping Info</h4>
          <p style="margin: 8px 0; font-size: 13px;"><strong>Port of Loading:</strong> ${fields.portOfLoading || 'Incheon, Korea'}</p>
          <p style="margin: 8px 0; font-size: 13px;"><strong>Port of Discharge:</strong> ${fields.portOfDischarge || 'TBD'}</p>
        </div>
      </div>
      ${isFinal ? `
        <div style="margin-top: 30px; padding: 20px; border: 2px solid #2F6BFF; border-radius: 12px; text-align: center;">
          <p style="margin: 0; color: #1a365d; font-weight: 600;">이 문서는 정식 견적서입니다. / This is an official Proforma Invoice.</p>
        </div>
      ` : ''}
    </div>
  `;
}

function generateDeckHTML(fields: Record<string, any>, header: string, companyName: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      <div style="text-align: center; padding: 60px 40px; background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 50%, #2EE59D 100%); border-radius: 16px; color: white; margin-bottom: 40px;">
        <h2 style="margin: 0; font-size: 36px; font-weight: 700;">${companyName}</h2>
        <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">K-Beauty Excellence Partner</p>
      </div>
      ${(fields.sections || []).map((section: string, i: number) => `
        <div style="margin-bottom: 30px; padding: 25px; background: ${i % 2 === 0 ? '#f8fafc' : 'white'}; border-radius: 12px; border-left: 4px solid ${i % 2 === 0 ? '#2F6BFF' : '#7B61FF'};">
          <h3 style="color: #1a365d; margin: 0 0 12px 0; font-size: 18px;">${section}</h3>
          <p style="color: #4a5568; margin: 0; line-height: 1.6;">이 섹션은 귀사의 정보에 맞게 자동으로 채워집니다.</p>
        </div>
      `).join('')}
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%); color: white; padding: 30px; border-radius: 16px; margin-top: 40px;">
        <h4 style="margin: 0 0 20px 0; font-size: 20px;">✨ Why Choose Us?</h4>
        <ul style="margin: 0; padding-left: 24px; line-height: 2;">
          ${(fields.highlights || []).map((h: string) => `<li style="font-size: 15px;">${h}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function generateCatalogHTML(fields: Record<string, any>, header: string, companyInfo: string, currency: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      ${companyInfo}
      <h3 style="color: #1a365d; border-bottom: 2px solid #2F6BFF; padding-bottom: 10px; margin-bottom: 20px;">📦 Product Categories</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 35px;">
        ${(fields.categories || []).map((cat: string) => `
          <div style="background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
            <span style="font-size: 32px;">📦</span>
            <p style="margin: 12px 0 0 0; font-weight: 600; color: #1a365d;">${cat}</p>
          </div>
        `).join('')}
      </div>
      <h3 style="color: #1a365d; border-bottom: 2px solid #2F6BFF; padding-bottom: 10px; margin-bottom: 20px;">🌟 Featured Products</h3>
      <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <th style="padding: 14px; text-align: left;">Product</th>
            <th style="padding: 14px; text-align: left;">Category</th>
            <th style="padding: 14px; text-align: right;">Unit Price</th>
            <th style="padding: 14px; text-align: right;">MOQ</th>
          </tr>
        </thead>
        <tbody>
          ${(fields.products || []).map((p: any, i: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? 'white' : '#f8fafc'};">
              <td style="padding: 14px; font-weight: 500;">${p.name}</td>
              <td style="padding: 14px; color: #4a5568;">${p.category}</td>
              <td style="padding: 14px; text-align: right;">${currency} ${p.unitPrice?.toFixed(2)}</td>
              <td style="padding: 14px; text-align: right;">${p.moq?.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateComplianceHTML(fields: Record<string, any>, header: string, companyInfo: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      ${companyInfo}
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 10px; margin-bottom: 25px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ 이 문서는 예비 규제 확인용입니다. 최종 확인은 전문가와 상담하세요.</p>
      </div>
      ${(fields.rulepacks || []).map((rp: any) => `
        <div style="margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white; padding: 16px;">
            <h3 style="margin: 0; font-size: 16px;">🌍 ${rp.countryName || rp.country} Compliance</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 12px; text-align: left; font-size: 12px;">항목</th>
                <th style="padding: 12px; text-align: center; font-size: 12px;">상태</th>
                <th style="padding: 12px; text-align: left; font-size: 12px;">비고</th>
              </tr>
            </thead>
            <tbody>
              ${(rp.items || []).map((item: any) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px; font-size: 13px;">${item.title || item.item}</td>
                  <td style="padding: 12px; text-align: center;">
                    <span style="background: ${item.status === 'OK' ? '#dcfce7' : item.status === 'NEED_CHECK' ? '#fef3c7' : '#fee2e2'};
                          color: ${item.status === 'OK' ? '#166534' : item.status === 'NEED_CHECK' ? '#92400e' : '#991b1b'};
                          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500;">
                      ${item.status === 'OK' ? '✓ OK' : item.status === 'NEED_CHECK' ? '⏳ 확인필요' : '⚠️ 조치필요'}
                    </span>
                  </td>
                  <td style="padding: 12px; color: #666; font-size: 12px;">${item.action || item.note || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `;
}

function generateContractHTML(fields: Record<string, any>, header: string, companyInfo: string, currency: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #1a365d; margin: 0;">SALES CONTRACT</h2>
        <p style="color: #666; margin: 5px 0;">계약번호: ${fields.contractNumber}</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #2F6BFF;">
          <h4 style="margin: 0 0 10px 0; color: #1a365d;">SELLER (수출자)</h4>
          <p style="margin: 5px 0; font-weight: 600;">${fields.seller}</p>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">${fields.sellerAddress}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #7B61FF;">
          <h4 style="margin: 0 0 10px 0; color: #1a365d;">BUYER (수입자)</h4>
          <p style="margin: 5px 0; font-weight: 600;">${fields.buyer}</p>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">${fields.buyerAddress}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <h4 style="margin: 0 0 15px 0; color: #1a365d;">📦 거래 내용</h4>
        <p style="margin: 8px 0;"><strong>품목:</strong> ${fields.productDescription}</p>
        <p style="margin: 8px 0;"><strong>금액:</strong> ${currency} ${fields.totalValue?.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Incoterms:</strong> ${fields.incoterms}</p>
        <p style="margin: 8px 0;"><strong>결제조건:</strong> ${fields.paymentTerms}</p>
      </div>
      <h4 style="color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📋 계약 조항</h4>
      ${(fields.terms || []).map((term: any, i: number) => `
        <div style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
          <p style="margin: 0;"><strong>제${i + 1}조 (${term.clause}):</strong> ${term.content}</p>
        </div>
      `).join('')}
      <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #1a365d;">
          <p style="margin: 0; font-weight: 600;">SELLER</p>
          <p style="margin: 5px 0; color: #666;">(서명)</p>
        </div>
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #1a365d;">
          <p style="margin: 0; font-weight: 600;">BUYER</p>
          <p style="margin: 5px 0; color: #666;">(서명)</p>
        </div>
      </div>
    </div>
  `;
}

function generateInvoiceHTML(fields: Record<string, any>, header: string, companyInfo: string, currency: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      ${companyInfo}
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 5px 0;"><strong>Invoice No.:</strong> ${fields.invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${fields.invoiceDate}</p>
        <p style="margin: 5px 0;"><strong>HS Code:</strong> ${fields.hsCode}</p>
        <p style="margin: 5px 0;"><strong>Country of Origin:</strong> ${fields.origin}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <th style="padding: 14px; text-align: left;">SKU</th>
            <th style="padding: 14px; text-align: left;">Description</th>
            <th style="padding: 14px; text-align: right;">Qty</th>
            <th style="padding: 14px; text-align: right;">Unit Price</th>
            <th style="padding: 14px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(fields.items || []).map((item: any, i: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? 'white' : '#f8fafc'};">
              <td style="padding: 12px; font-family: monospace;">${item.sku}</td>
              <td style="padding: 12px;">${item.name}</td>
              <td style="padding: 12px; text-align: right;">${item.qty?.toLocaleString()}</td>
              <td style="padding: 12px; text-align: right;">${currency} ${item.unitPrice?.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; font-weight: 500;">${currency} ${item.amount?.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <td colspan="4" style="padding: 14px; text-align: right; font-weight: 600;">TOTAL:</td>
            <td style="padding: 14px; text-align: right; font-weight: 700; font-size: 16px;">${currency} ${fields.totalAmount?.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function generatePackingListHTML(fields: Record<string, any>, header: string, companyInfo: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      ${companyInfo}
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <p style="margin: 5px 0;"><strong>P/L No.:</strong> ${fields.plNumber}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <th style="padding: 12px; text-align: left;">SKU</th>
            <th style="padding: 12px; text-align: left;">Product</th>
            <th style="padding: 12px; text-align: right;">Qty</th>
            <th style="padding: 12px; text-align: right;">Cartons</th>
            <th style="padding: 12px; text-align: right;">Gross Wt (kg)</th>
            <th style="padding: 12px; text-align: right;">Net Wt (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${(fields.items || []).map((item: any, i: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? 'white' : '#f8fafc'};">
              <td style="padding: 12px; font-family: monospace;">${item.sku}</td>
              <td style="padding: 12px;">${item.name}</td>
              <td style="padding: 12px; text-align: right;">${item.qty?.toLocaleString()}</td>
              <td style="padding: 12px; text-align: right;">${item.cartons}</td>
              <td style="padding: 12px; text-align: right;">${item.grossWeight}</td>
              <td style="padding: 12px; text-align: right;">${item.netWeight}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: 600;">
            <td colspan="2" style="padding: 12px;">TOTAL</td>
            <td style="padding: 12px; text-align: right;">${fields.items?.reduce((s: number, i: any) => s + i.qty, 0)?.toLocaleString()}</td>
            <td style="padding: 12px; text-align: right;">${fields.totalCartons}</td>
            <td style="padding: 12px; text-align: right;">${fields.totalGrossWeight} kg</td>
            <td style="padding: 12px; text-align: right;">${fields.totalNetWeight} kg</td>
          </tr>
        </tfoot>
      </table>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
        <p style="margin: 8px 0;"><strong>Total CBM:</strong> ${fields.totalCBM} m³</p>
        <p style="margin: 8px 0;"><strong>Dimensions:</strong> ${fields.dimensions}</p>
      </div>
    </div>
  `;
}

function generateShippingHTML(fields: Record<string, any>, header: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <h4 style="margin: 0 0 15px 0; color: #1a365d;">📤 SHIPPER</h4>
          <p style="margin: 5px 0; font-weight: 600;">${fields.shipper}</p>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">${fields.shipperAddress}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <h4 style="margin: 0 0 15px 0; color: #1a365d;">📥 CONSIGNEE</h4>
          <p style="margin: 5px 0; font-weight: 600;">${fields.consignee}</p>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">${fields.consigneeAddress}</p>
        </div>
      </div>
      <div style="background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h4 style="margin: 0 0 20px 0; color: #1a365d;">🚢 Vessel / Voyage</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <p style="margin: 5px 0;"><strong>Vessel:</strong> ${fields.vesselName}</p>
          <p style="margin: 5px 0;"><strong>Voyage No.:</strong> ${fields.voyageNo}</p>
          <p style="margin: 5px 0;"><strong>Port of Loading:</strong> ${fields.portOfLoading}</p>
          <p style="margin: 5px 0;"><strong>Port of Discharge:</strong> ${fields.portOfDischarge}</p>
          <p style="margin: 5px 0;"><strong>ETD:</strong> ${fields.etd}</p>
          <p style="margin: 5px 0;"><strong>ETA:</strong> ${fields.eta}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
        <h4 style="margin: 0 0 15px 0; color: #1a365d;">📦 Cargo Details</h4>
        <p style="margin: 8px 0;"><strong>Description:</strong> ${fields.cargoDescription}</p>
        <p style="margin: 8px 0;"><strong>Total Packages:</strong> ${fields.totalPackages}</p>
        <p style="margin: 8px 0;"><strong>Gross Weight:</strong> ${fields.grossWeight} kg</p>
      </div>
    </div>
  `;
}

function generateEmailHTML(fields: Record<string, any>, templateKey: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 700px; margin: 0 auto;">
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${fields.subject}</p>
      </div>
      <div style="padding: 20px; line-height: 1.8;">
        <p style="margin: 0 0 20px 0;">${fields.greeting}</p>
        <p style="margin: 0 0 20px 0;">${fields.body}</p>
        <p style="margin: 20px 0 0 0;">${fields.closing}</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; white-space: pre-line; color: #666;">
${fields.signature}
        </div>
      </div>
    </div>
  `;
}

function generateLabelCheckHTML(fields: Record<string, any>, header: string): string {
  return `
    <div style="font-family: 'Noto Sans KR', Arial, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto;">
      ${header}
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: linear-gradient(135deg, #2F6BFF 0%, #7B61FF 100%); color: white;">
            <th style="padding: 14px; text-align: left;">항목</th>
            <th style="padding: 14px; text-align: center;">상태</th>
            <th style="padding: 14px; text-align: left;">비고</th>
          </tr>
        </thead>
        <tbody>
          ${(fields.checkItems || []).map((item: any, i: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? 'white' : '#f8fafc'};">
              <td style="padding: 14px; font-weight: 500;">${item.item}</td>
              <td style="padding: 14px; text-align: center;">
                <span style="background: ${item.status === 'OK' ? '#dcfce7' : '#fef3c7'};
                      color: ${item.status === 'OK' ? '#166534' : '#92400e'};
                      padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                  ${item.status === 'OK' ? '✓ OK' : '⏳ 확인필요'}
                </span>
              </td>
              <td style="padding: 14px; color: #666;">${item.note}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
