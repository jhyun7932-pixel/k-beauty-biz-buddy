// PDF/Word 내보내기 유틸리티 - jsPDF + html2canvas + docx 사용 (다국어 지원)
import type { BuyerGoal, BuyerPackFile, Language } from '@/types';
import { getTranslations, getChannelChecklist, getProductInfo, LANGUAGE_MAP, type DocumentTranslations, type ProductInfo } from '@/lib/i18n';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

// jsPDF + html2canvas를 사용한 안전한 PDF 생성
async function generatePDFFromHTML(htmlContent: string, filename: string): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width in px at 96dpi
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

// 공통 스타일
const commonStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0F172A; line-height: 1.6; }
    .document { padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 2px solid #2F6BFF; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: 700; color: #2F6BFF; }
    .draft-badge { background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 10px; }
    .title { font-size: 28px; font-weight: 700; margin: 20px 0; color: #0F172A; }
    .subtitle { font-size: 14px; color: #64748B; }
    .badge { background: #EFF6FF; color: #2F6BFF; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-right: 8px; display: inline-block; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 15px; border-left: 4px solid #2F6BFF; padding-left: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border: 1px solid #E2E8F0; }
    th { background: #F8FAFC; font-weight: 600; }
    .highlight { background: #F0FDF4; color: #16A34A; padding: 2px 6px; border-radius: 4px; }
    .warning { background: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; }
    .checklist { list-style: none; }
    .checklist li { padding: 8px 0; display: flex; align-items: center; gap: 10px; }
    .checklist li::before { content: '☐'; color: #64748B; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #64748B; text-align: center; }
  </style>
`;

// One-Pager 브랜드 소개서 생성 (다국어)
function generateOnePagerHTML(goal: BuyerGoal): string {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  const checklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];
  
  let channelFocus = '';
  if (goal.channel === 'distributor') {
    channelFocus = `
      <div class="section">
        <h3 class="section-title">${t.wholesaleConditions}</h3>
        <table>
          <tr><th>${t.moq}</th><td>500 units</td></tr>
          <tr><th>${t.wholesalePriceRange}</th><td>$3.00 - $4.50</td></tr>
          <tr><th>${t.leadTime}</th><td>20-30 days</td></tr>
          <tr><th>${t.exclusiveOption}</th><td>${t.regionalNegotiable}</td></tr>
        </table>
      </div>
    `;
  } else if (goal.channel === 'retail') {
    channelFocus = `
      <div class="section">
        <h3 class="section-title">${t.retailInfo}</h3>
        <table>
          <tr><th>${t.recommendedRetailPrice}</th><td>$25-35</td></tr>
          <tr><th>${t.expectedMargin}</th><td>40-50%</td></tr>
          <tr><th>${t.displayPoint}</th><td>K-Beauty, Vegan, Sun Care</td></tr>
          <tr><th>${t.promotion}</th><td>${t.launchPromoSupport}</td></tr>
        </table>
      </div>
    `;
  } else if (goal.channel === 'online_market') {
    channelFocus = `
      <div class="section">
        <h3 class="section-title">${t.onlineListingGuide}</h3>
        <table>
          <tr><th>${t.heroClaim}</th><td>Vegan Sunscreen SPF50+ with Centella</td></tr>
          <tr><th>${t.mainKeywords}</th><td>K-Beauty, Vegan, SPF50, Lightweight</td></tr>
          <tr><th>${t.imageRecommend}</th><td>Main 1 + Ingredients 1 + Usage 2</td></tr>
          <tr><th>${t.prohibitedExpressions}</th><td>FDA approved, 100% natural</td></tr>
        </table>
      </div>
    `;
  }

  // 회사 정보 (goal에서 가져오거나 기본값 사용)
  const company = goal.company || { name: 'GLOWSKIN' };
  const companyName = company.name || 'GLOWSKIN';
  const companyEmail = company.contactEmail || 'export@company.co.kr';
  const companyPhone = company.contactPhone || '';
  const companyWebsite = company.website || '';
  const companyAddress = company.address || '';
  const logoUrl = company.logoUrl || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="document">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 40px; max-width: 150px; margin-bottom: 10px;" />` : ''}
          <div class="logo">${companyName}</div>
          <div class="draft-badge">${t.draftBadge}</div>
        </div>
        
        <h1 class="title">${p.veganSunSerum} ${t.brandIntroTitle}</h1>
        <p class="subtitle">
          <span class="badge">${goal.countries.join(' · ')}</span>
          <span class="badge">${channelLabel}</span>
          <span class="badge">${goal.language}</span>
        </p>
        
        <div class="section">
          <h3 class="section-title">${t.brandIntroTitle}</h3>
          <p>${t.brandIntroContent}</p>
        </div>
        
        <div class="section">
          <h3 class="section-title">${t.coreProducts}</h3>
          <table>
            <tr>
              <th>${t.productName}</th>
              <th>${t.category}</th>
              <th>${t.keyIngredients}</th>
              <th>${t.target}</th>
            </tr>
            <tr>
              <td>${p.veganSunSerum}</td>
              <td>${p.suncare}</td>
              <td>Centella, Niacinamide, HA</td>
              <td>${p.sensitiveAcneSkin}</td>
            </tr>
            <tr>
              <td>${p.aloeSoothingGel}</td>
              <td>${p.skincare}</td>
              <td>Aloe 92%, Panthenol</td>
              <td>${p.allSkinTypes}</td>
            </tr>
          </table>
        </div>
        
        ${channelFocus}
        
        <div class="section">
          <h3 class="section-title">${t.certAndQuality}</h3>
          <p>${t.cgmpCert}</p>
          <p>${t.veganFormula}</p>
          <p>${t.spfTestComplete}</p>
        </div>
        
        <div class="footer">
          <p>${t.generatedBy}</p>
          <p>${t.contact}: ${companyEmail}</p>
          ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
          ${companyWebsite ? `<p>Web: ${companyWebsite}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

// 수출 준비 요약 생성 (다국어)
function generateSummaryHTML(goal: BuyerGoal): string {
  const t = getTranslations(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  const checklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];

  return `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="document">
        <div class="header">
          <div class="logo">K-Beauty Export Readiness</div>
          <div class="draft-badge">${t.draftBadge}</div>
        </div>
        
        <h1 class="title">${t.exportReadinessTitle}</h1>
        <p class="subtitle">
          <span class="badge">${goal.countries.join(' · ')}</span>
          <span class="badge">${channelLabel}</span>
        </p>
        
        <div class="section">
          <h3 class="section-title">${t.readinessStatus}</h3>
          <table>
            <tr>
              <th>${t.item}</th>
              <th>${t.status}</th>
              <th>${t.note}</th>
            </tr>
            <tr>
              <td>${t.productLabeling}</td>
              <td><span class="warning">${t.caution}</span></td>
              <td>${t.localTranslationNeeded}</td>
            </tr>
            <tr>
              <td>${t.ingredientCompliance}</td>
              <td><span class="highlight">${t.ok}</span></td>
              <td>${t.inciConfirmed}</td>
            </tr>
            <tr>
              <td>${t.certDocuments}</td>
              <td><span class="highlight">${t.ok}</span></td>
              <td>${t.spfReportAttached}</td>
            </tr>
            <tr>
              <td>${t.veganCert}</td>
              <td><span class="warning">${t.caution}</span></td>
              <td>${t.certInProgress}</td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h3 class="section-title">${channelLabel} ${t.channelChecklist}</h3>
          <ul class="checklist">
            ${checklist.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3 class="section-title">${t.nextSteps}</h3>
          <ol>
            <li>${t.step1VeganCert}</li>
            <li>${t.step2LocalLabel}</li>
            <li>${t.step3SampleShipment}</li>
          </ol>
        </div>
        
        <div class="footer">
          <p>${t.generatedBy}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Deal Sheet 생성 (다국어)
function generateDealSheetHTML(goal: BuyerGoal): string {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';

  // 회사 정보
  const company = goal.company || { name: 'GLOWSKIN' };
  const companyName = company.name || 'GLOWSKIN';
  const companyEmail = company.contactEmail || 'export@company.co.kr';
  const companyPhone = company.contactPhone || '';
  const logoUrl = company.logoUrl || '';
  const moq = company.defaultMoq || 500;
  const leadTime = company.defaultLeadTime || 20;
  const incoterms = company.defaultIncoterms || 'FOB Busan';
  const paymentTerms = company.defaultPaymentTerms || t.paymentTermsValue;
  const bankName = company.bankName || '';
  const bankAccount = company.bankAccount || '';
  const bankSwift = company.bankSwift || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="document">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 40px; max-width: 150px; margin-bottom: 10px;" />` : ''}
          <div class="logo">${companyName} - DEAL SHEET</div>
          <div class="draft-badge">${t.draftBadge}</div>
        </div>
        
        <h1 class="title">${t.dealSheetTitle}</h1>
        <p class="subtitle">
          <span class="badge">${goal.countries.join(' · ')}</span>
          <span class="badge">${channelLabel}</span>
          <span class="badge">${goal.currency}</span>
        </p>
        
        <div class="section">
          <table>
            <tr><th style="width:30%">${t.product}</th><td>${p.veganSunSerum}</td></tr>
            <tr><th>${t.moq}</th><td>${moq} units</td></tr>
            <tr><th>${t.unitPrice}</th><td>${goal.currency} 3.50</td></tr>
            <tr><th>${t.incoterms}</th><td>${incoterms}</td></tr>
            <tr><th>${t.paymentTerms}</th><td>${paymentTerms}</td></tr>
            <tr><th>${t.leadTime}</th><td>${leadTime} days after deposit</td></tr>
            <tr><th>${t.validity}</th><td>30 days</td></tr>
            <tr><th>${t.samplePolicy}</th><td>${t.samplePolicyValue}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h3 class="section-title">${t.volumeDiscount}</h3>
          <table>
            <tr>
              <th>${t.quantity}</th>
              <th>${t.unitPrice} (${goal.currency})</th>
              <th>${t.discount}</th>
            </tr>
            <tr><td>${moq}-999</td><td>3.50</td><td>-</td></tr>
            <tr><td>1,000-2,999</td><td>3.30</td><td>-6%</td></tr>
            <tr><td>3,000-4,999</td><td>3.15</td><td>-10%</td></tr>
            <tr><td>5,000+</td><td>3.00</td><td>-14%</td></tr>
          </table>
        </div>
        
        ${bankName ? `
        <div class="section">
          <h3 class="section-title">Bank Information</h3>
          <table>
            <tr><th style="width:30%">Bank Name</th><td>${bankName}</td></tr>
            <tr><th>Account Number</th><td>${bankAccount}</td></tr>
            ${bankSwift ? `<tr><th>SWIFT Code</th><td>${bankSwift}</td></tr>` : ''}
          </table>
        </div>
        ` : ''}
        
        <div class="footer">
          <p>${t.generatedBy}</p>
          <p>${t.validFor}: 30 days</p>
          <p>${t.contact}: ${companyEmail}${companyPhone ? ` | Tel: ${companyPhone}` : ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 이메일 템플릿 생성 (다국어)
function generateEmailTemplateHTML(goal: BuyerGoal): string {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const buyerName = goal.buyerCompany || '[Buyer Name]';
  const contactName = goal.buyerContact || '[Contact Name]';

  return `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="document">
        <div class="header">
          <div class="logo">Email Templates</div>
          <div class="draft-badge">${t.draftBadge}</div>
        </div>
        
        <h1 class="title">${t.emailTemplatesTitle}</h1>
        <p class="subtitle">
          <span class="badge">${goal.language}</span>
        </p>
        
        <div class="section">
          <h3 class="section-title">1. ${t.firstProposal}</h3>
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 10px 0;">
            <p><strong>Subject:</strong> ${t.emailSubjectFirst}</p>
            <br>
            <p>${t.emailGreeting} ${contactName},</p>
            <br>
            <p>${t.emailIntro}</p>
            <br>
            <p>${t.emailPartnership}</p>
            <br>
            <p>${t.keyHighlights}</p>
            <p>${t.highlight1}</p>
            <p>${t.highlight2}</p>
            <p>${t.highlight3}</p>
            <br>
            <p>${t.emailClosing}<br>[Your Name]</p>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">2. ${t.sampleProposal}</h3>
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 10px 0;">
            <p><strong>Subject:</strong> ${t.emailSubjectSample}</p>
            <br>
            <p>${t.emailGreeting} ${contactName},</p>
            <br>
            <p>${t.emailSampleIntro}</p>
            <br>
            <p>${t.samplePackageIncludes}</p>
            <p>• ${p.veganSunSerum} x 3</p>
            <p>• ${p.aloeSoothingGel} x 2</p>
            <br>
            <p>${t.emailClosing}<br>[Your Name]</p>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">3. ${t.orderConfirmation}</h3>
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 10px 0;">
            <p><strong>Subject:</strong> ${t.emailSubjectOrder}</p>
            <br>
            <p>${t.emailGreeting} ${contactName},</p>
            <br>
            <p>${t.emailOrderIntro}</p>
            <br>
            <p>${t.orderSummary}</p>
            <p>• ${t.product}: ${p.veganSunSerum}</p>
            <p>• ${t.quantity}: 5,000 units</p>
            <p>• ${t.incoterms}: FOB Busan, T/T 30/70</p>
            <br>
            <p>${t.productionNotice}</p>
            <br>
            <p>${t.emailClosing}<br>[Your Name]</p>
          </div>
        </div>
        
        <div class="footer">
          <p>${t.generatedBy}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 채널 체크리스트 생성 (다국어)
function generateChannelChecklistHTML(goal: BuyerGoal): string {
  const t = getTranslations(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  const checklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];

  return `
    <!DOCTYPE html>
    <html>
    <head>${commonStyles}</head>
    <body>
      <div class="document">
        <div class="header">
          <div class="logo">${channelLabel} ${t.channelChecklist}</div>
          <div class="draft-badge">${t.draftBadge}</div>
        </div>
        
        <h1 class="title">${channelLabel} ${t.channelChecklist}</h1>
        <p class="subtitle">
          <span class="badge">${goal.countries.join(' · ')}</span>
        </p>
        
        <div class="section">
          <ul class="checklist">
            ${checklist.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <h3 class="section-title">${t.referenceNote}</h3>
          <p>${t.checklistNote}</p>
        </div>
        
        <div class="footer">
          <p>${t.generatedBy}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 미리보기용 HTML 반환 함수 (export)
export function getPreviewHTML(goal: BuyerGoal, fileType: BuyerPackFile['type']): string {
  switch (fileType) {
    case 'one_pager':
      return generateOnePagerHTML(goal);
    case 'summary':
      return generateSummaryHTML(goal);
    case 'terms':
      return generateDealSheetHTML(goal);
    case 'email_template':
      return generateEmailTemplateHTML(goal);
    case 'channel_checklist':
      return generateChannelChecklistHTML(goal);
    default:
      return generateSummaryHTML(goal);
  }
}

// PDF 생성 함수
export async function generatePDF(goal: BuyerGoal, fileType: BuyerPackFile['type']): Promise<Blob> {
  let htmlContent: string;
  
  switch (fileType) {
    case 'one_pager':
      htmlContent = generateOnePagerHTML(goal);
      break;
    case 'summary':
      htmlContent = generateSummaryHTML(goal);
      break;
    case 'terms':
      htmlContent = generateDealSheetHTML(goal);
      break;
    case 'email_template':
      htmlContent = generateEmailTemplateHTML(goal);
      break;
    case 'channel_checklist':
      htmlContent = generateChannelChecklistHTML(goal);
      break;
    default:
      htmlContent = generateSummaryHTML(goal);
  }

  return generatePDFFromHTML(htmlContent, `${fileType}.pdf`);
}

// 단일 PDF 다운로드
export async function downloadSinglePDF(goal: BuyerGoal, fileType: BuyerPackFile['type'], fileName: string): Promise<void> {
  const blob = await generatePDF(goal, fileType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 모든 PDF를 ZIP으로 묶어 다운로드
export async function downloadAllAsZip(goal: BuyerGoal, files: BuyerPackFile[]): Promise<void> {
  const t = getTranslations(goal.language);
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const fileNameMap: Record<string, string> = {
    one_pager: 'One-page',
    summary: 'Readiness_Summary',
    quality_cert: 'Quality_Cert',
    terms: 'Deal_Sheet',
    email_template: 'Email_Templates',
    channel_checklist: `${goal.channel ? t.channelLabels[goal.channel] : 'Channel'}_Checklist`,
  };

  // 각 파일 생성 및 ZIP에 추가
  for (const file of files.filter(f => f.ready)) {
    try {
      const blob = await generatePDF(goal, file.type);
      const fileName = fileNameMap[file.type] || file.type;
      zip.file(`${fileName}.pdf`, blob);
    } catch (error) {
      console.error(`Failed to generate ${file.type}:`, error);
    }
  }

  // ZIP 다운로드
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BuyerPackage_${goal.countries[0]}_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 공유 링크 생성 (모의)
export function generateShareLink(): string {
  const id = Math.random().toString(36).substring(2, 10);
  return `https://kbeauty-trade.app/share/${id}`;
}

// ============= WORD 문서 생성 (다국어) =============

// Word 문서 생성 - One Pager
function generateOnePagerWord(goal: BuyerGoal): Document {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  
  const channelRows: TableRow[] = [];
  if (goal.channel === 'distributor') {
    channelRows.push(
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.moq, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('500 units')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.wholesalePriceRange, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('$3.00 - $4.50')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.leadTime, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('20-30 days')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.exclusiveOption, bold: true })] })] }),
        new TableCell({ children: [new Paragraph(t.regionalNegotiable)] }),
      ]})
    );
  } else if (goal.channel === 'retail') {
    channelRows.push(
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.recommendedRetailPrice, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('$25-35')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.expectedMargin, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('40-50%')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.displayPoint, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('K-Beauty, Vegan, Sun Care')] }),
      ]})
    );
  } else if (goal.channel === 'online_market') {
    channelRows.push(
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.heroClaim, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('Vegan Sunscreen SPF50+ with Centella')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.mainKeywords, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('K-Beauty, Vegan, SPF50, Lightweight')] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.prohibitedExpressions, bold: true })] })] }),
        new TableCell({ children: [new Paragraph('FDA approved, 100% natural')] }),
      ]})
    );
  }

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: t.draftBadge, color: '92400E', size: 20 })],
        }),
        new Paragraph({
          text: 'GLOWSKIN',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: `${p.veganSunSerum} ${t.brandIntroTitle}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${goal.countries.join(' · ')} | ${channelLabel} | ${goal.language}`, color: '2F6BFF' }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.brandIntroTitle,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: t.brandIntroContent,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.coreProducts,
          heading: HeadingLevel.HEADING_3,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.productName, bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.category, bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.keyIngredients, bold: true })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(p.veganSunSerum)] }),
                new TableCell({ children: [new Paragraph(p.suncare)] }),
                new TableCell({ children: [new Paragraph('Centella, Niacinamide, HA')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(p.aloeSoothingGel)] }),
                new TableCell({ children: [new Paragraph(p.skincare)] }),
                new TableCell({ children: [new Paragraph('Aloe 92%, Panthenol')] }),
              ],
            }),
          ],
        }),
        new Paragraph({ text: '' }),
        ...(channelRows.length > 0 ? [
          new Paragraph({
            text: `${channelLabel} ${t.wholesaleConditions}`,
            heading: HeadingLevel.HEADING_3,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: channelRows,
          }),
        ] : []),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.certAndQuality,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: t.cgmpCert }),
        new Paragraph({ text: t.veganFormula }),
        new Paragraph({ text: t.spfTestComplete }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [new TextRun({ text: `${t.contact}: export@glowskin.co.kr`, color: '64748B', size: 20 })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });
}

// Word 문서 생성 - Deal Sheet
function generateDealSheetWord(goal: BuyerGoal): Document {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: t.draftBadge, color: '92400E', size: 20 })],
        }),
        new Paragraph({
          text: `DEAL SHEET - ${t.dealSheetTitle}`,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${goal.countries.join(' · ')} | ${channelLabel} | ${goal.currency}`, color: '2F6BFF' }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.product, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(p.veganSunSerum)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.moq, bold: true })] })] }),
              new TableCell({ children: [new Paragraph('500 units')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.unitPrice, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(`${goal.currency} 3.50`)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.incoterms, bold: true })] })] }),
              new TableCell({ children: [new Paragraph('FOB Busan')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.paymentTerms, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(t.paymentTermsValue)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.leadTime, bold: true })] })] }),
              new TableCell({ children: [new Paragraph(t.leadTimeValue)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.validity, bold: true })] })] }),
              new TableCell({ children: [new Paragraph('30 days')] }),
            ]}),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.volumeDiscount,
          heading: HeadingLevel.HEADING_3,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.quantity, bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.unitPrice} (${goal.currency})`, bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.discount, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph('500-999')] }),
              new TableCell({ children: [new Paragraph('3.50')] }),
              new TableCell({ children: [new Paragraph('-')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph('1,000-2,999')] }),
              new TableCell({ children: [new Paragraph('3.30')] }),
              new TableCell({ children: [new Paragraph('-6%')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph('3,000-4,999')] }),
              new TableCell({ children: [new Paragraph('3.15')] }),
              new TableCell({ children: [new Paragraph('-10%')] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph('5,000+')] }),
              new TableCell({ children: [new Paragraph('3.00')] }),
              new TableCell({ children: [new Paragraph('-14%')] }),
            ]}),
          ],
        }),
      ],
    }],
  });
}

// Word 문서 생성 - 수출 준비 요약
function generateSummaryWord(goal: BuyerGoal): Document {
  const t = getTranslations(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  const checklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: t.draftBadge, color: '92400E', size: 20 })],
        }),
        new Paragraph({
          text: t.exportReadinessTitle,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${goal.countries.join(' · ')} | ${channelLabel}`, color: '2F6BFF' }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.readinessStatus,
          heading: HeadingLevel.HEADING_3,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.item, bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.status, bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.note, bold: true })] })] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph(t.productLabeling)] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `⚠ ${t.caution}`, color: 'F59E0B' })] })] }),
              new TableCell({ children: [new Paragraph(t.localTranslationNeeded)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph(t.ingredientCompliance)] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `✓ ${t.ok}`, color: '16A34A' })] })] }),
              new TableCell({ children: [new Paragraph(t.inciConfirmed)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph(t.certDocuments)] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `✓ ${t.ok}`, color: '16A34A' })] })] }),
              new TableCell({ children: [new Paragraph(t.spfReportAttached)] }),
            ]}),
            new TableRow({ children: [
              new TableCell({ children: [new Paragraph(t.veganCert)] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `⚠ ${t.caution}`, color: 'F59E0B' })] })] }),
              new TableCell({ children: [new Paragraph(t.certInProgress)] }),
            ]}),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: `${channelLabel} ${t.channelChecklist}`,
          heading: HeadingLevel.HEADING_3,
        }),
        ...checklist.map(item => new Paragraph({ text: `☐ ${item}` })),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.nextSteps,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: `1. ${t.step1VeganCert}` }),
        new Paragraph({ text: `2. ${t.step2LocalLabel}` }),
        new Paragraph({ text: `3. ${t.step3SampleShipment}` }),
      ],
    }],
  });
}

// Word 문서 생성 - 이메일 템플릿
function generateEmailTemplateWord(goal: BuyerGoal): Document {
  const t = getTranslations(goal.language);
  const p = getProductInfo(goal.language);
  const buyerName = goal.buyerCompany || '[Buyer Name]';
  const contactName = goal.buyerContact || '[Contact Name]';

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: t.draftBadge, color: '92400E', size: 20 })],
        }),
        new Paragraph({
          text: t.emailTemplatesTitle,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: goal.language, color: '2F6BFF' }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: `1. ${t.firstProposal}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: 'Subject: ', bold: true }), new TextRun(t.emailSubjectFirst)] }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: `${t.emailGreeting} ${contactName},` }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.emailIntro }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.emailPartnership }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.keyHighlights }),
        new Paragraph({ text: t.highlight1 }),
        new Paragraph({ text: t.highlight2 }),
        new Paragraph({ text: t.highlight3 }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.emailClosing }),
        new Paragraph({ text: '[Your Name]' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: `2. ${t.sampleProposal}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ children: [new TextRun({ text: 'Subject: ', bold: true }), new TextRun(t.emailSubjectSample)] }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: `${t.emailGreeting} ${contactName},` }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.emailSampleIntro }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.samplePackageIncludes }),
        new Paragraph({ text: `• ${p.veganSunSerum} x 3` }),
        new Paragraph({ text: `• ${p.aloeSoothingGel} x 2` }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: t.emailClosing }),
        new Paragraph({ text: '[Your Name]' }),
      ],
    }],
  });
}

// Word 문서 생성 - 채널 체크리스트
function generateChannelChecklistWord(goal: BuyerGoal): Document {
  const t = getTranslations(goal.language);
  const channelLabel = goal.channel ? t.channelLabels[goal.channel] : '';
  const checklist = goal.channel ? getChannelChecklist(goal.language, goal.channel) : [];

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: t.draftBadge, color: '92400E', size: 20 })],
        }),
        new Paragraph({
          text: `${channelLabel} ${t.channelChecklist}`,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: goal.countries.join(' · '), color: '2F6BFF' }),
          ],
        }),
        new Paragraph({ text: '' }),
        ...checklist.map(item => new Paragraph({ text: `☐ ${item}` })),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: t.referenceNote,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({ text: t.checklistNote }),
      ],
    }],
  });
}

// Word 문서 생성 메인 함수
export async function generateWord(goal: BuyerGoal, fileType: BuyerPackFile['type']): Promise<Blob> {
  let doc: Document;
  
  switch (fileType) {
    case 'one_pager':
      doc = generateOnePagerWord(goal);
      break;
    case 'summary':
      doc = generateSummaryWord(goal);
      break;
    case 'terms':
      doc = generateDealSheetWord(goal);
      break;
    case 'email_template':
      doc = generateEmailTemplateWord(goal);
      break;
    case 'channel_checklist':
      doc = generateChannelChecklistWord(goal);
      break;
    default:
      doc = generateSummaryWord(goal);
  }

  return await Packer.toBlob(doc);
}

// 단일 Word 다운로드
export async function downloadSingleWord(goal: BuyerGoal, fileType: BuyerPackFile['type'], fileName: string): Promise<void> {
  const blob = await generateWord(goal, fileType);
  saveAs(blob, `${fileName}.docx`);
}
