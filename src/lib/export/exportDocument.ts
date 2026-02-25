// RightPanel 전용: PI / CI / PL / NDA / SALES_CONTRACT / COMPLIANCE 서류
// PDF(jsPDF+html2canvas) + DOCX(docx 라이브러리) 내보내기

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, convertMillimetersToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

// ─── 내부 타입 ──────────────────────────────────────────────────────────────
interface TradeItem {
  product_name?: string;
  hs_code?: string;
  quantity?: number;
  unit_price?: number;
  currency?: string;
  net_weight_kg?: number;
  gross_weight_kg?: number;
  cbm?: number;
}

interface TradeDocArgs {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  seller?: {
    company_name?: string;
    address?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    company_name?: string;
    address?: string;
    country?: string;
    contact_person?: string;
    email?: string;
  };
  items?: TradeItem[];
  trade_terms?: {
    incoterms?: string;
    payment_terms?: string;
    port_of_loading?: string;
    port_of_discharge?: string;
    validity_date?: string;
  };
  remarks?: string;
}

interface ProposalArgs {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  seller?: {
    company_name?: string;
    address?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    company_name?: string;
    address?: string;
    country?: string;
    contact_person?: string;
    email?: string;
  };
  items?: TradeItem[];
  proposal_sections?: {
    company_overview?: string;
    certifications?: string;
    product_highlights?: string;
    why_choose_us?: string;
    partnership_terms?: string;
    cta?: string;
  };
  remarks?: string;
}

interface ComplianceArgs {
  product_name?: string;
  target_country?: string;
  product_category?: string;
  ingredients?: Array<{ inci_name?: string; percentage?: number; cas_number?: string }>;
}

// ─── 상수 ──────────────────────────────────────────────────────────────────
const DOC_TITLE: Record<string, string> = {
  PI: 'PROFORMA INVOICE',
  CI: 'COMMERCIAL INVOICE',
  PL: 'PACKING LIST',
  NDA: 'NON-DISCLOSURE AGREEMENT',
  SALES_CONTRACT: 'SALES CONTRACT',
  PROPOSAL: 'BUSINESS PROPOSAL',
  COMPLIANCE: 'COMPLIANCE CHECK REPORT',
};

const COUNTRY_LABEL: Record<string, string> = {
  US: '미국 (MoCRA/FDA)', EU: '유럽 (CPNP)', CN: '중국 (NMPA)',
  JP: '일본 (PMDA)', TH: '태국', VN: '베트남',
  ID: '인도네시아 (BPOM)', PH: '필리핀', MY: '말레이시아',
  SG: '싱가포르 (HSA)', AE: 'UAE (ECAS)',
};

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────
function todayCompact(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── HTML → PDF Blob (고품질 렌더링) ────────────────────────────────────────
async function htmlToBlob(html: string): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  wrap.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:#fff;font-smooth:always;-webkit-font-smoothing:antialiased;';
  document.body.appendChild(wrap);

  try {
    // 고해상도 캔버스 (300 DPI 상당)
    const dpiScale = 3;
    const canvas = await html2canvas(wrap, {
      scale: dpiScale,
      useCORS: true,
      logging: false,
      width: 794,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      removeContainer: false,
    });

    // PNG 포맷으로 고품질 유지 (JPEG 아티팩트 방지)
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // A4 여백 설정 (상하 15mm, 좌우 10mm)
    const marginX = 10;
    const marginY = 15;
    const contentW = pdfW - marginX * 2;
    const contentH = pdfH - marginY * 2;
    const imgH = (canvas.height * contentW) / canvas.width;

    let pos = marginY;
    let rem = imgH;
    pdf.addImage(imgData, 'PNG', marginX, pos, contentW, imgH);
    rem -= contentH;

    while (rem > 0) {
      pos -= contentH;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', marginX, pos, contentW, imgH);
      rem -= contentH;
    }

    // 페이지 번호 + 푸터
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(170, 170, 170);
      pdf.text(`Page ${i} / ${totalPages}`, pdfW - marginX, pdfH - 5, { align: 'right' });
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(wrap);
  }
}

// ─── 무역 서류 HTML ─────────────────────────────────────────────────────────
function buildTradeDocHTML(args: TradeDocArgs, docType: string): string {
  const title = DOC_TITLE[docType] ?? docType;
  const items = args.items ?? [];
  const currency = items[0]?.currency ?? 'USD';
  const total = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const isPL = docType === 'PL';

  const itemRows = items
    .map(
      (item, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="text-align:left;font-weight:600">${item.product_name ?? '—'}</td>
        <td style="text-align:center;font-family:monospace;font-size:10px">${item.hs_code ?? '—'}</td>
        <td style="text-align:right">${item.quantity?.toLocaleString() ?? '—'}</td>
        <td style="text-align:right">${
          item.unit_price != null
            ? `${item.currency ?? 'USD'} ${item.unit_price.toFixed(2)}`
            : '—'
        }</td>
        <td style="text-align:right;font-weight:600">${
          item.quantity != null && item.unit_price != null
            ? `${item.currency ?? 'USD'} ${(item.quantity * item.unit_price).toFixed(2)}`
            : '—'
        }</td>
        ${
          isPL
            ? `<td style="text-align:right">${item.net_weight_kg?.toFixed(2) ?? '—'}</td>
               <td style="text-align:right">${item.gross_weight_kg?.toFixed(2) ?? '—'}</td>
               <td style="text-align:right">${item.cbm?.toFixed(4) ?? '—'}</td>`
            : ''
        }
      </tr>`,
    )
    .join('');

  const plExtraTH = isPL
    ? '<th>N/W (kg)</th><th>G/W (kg)</th><th>CBM</th>'
    : '';
  const totalSpan = isPL ? 8 : 5;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Times New Roman", Georgia, serif; font-size: 11px; color: #111; background: #fff; }
.page { width: 794px; padding: 40px 50px; }
h1 { font-size: 18px; font-weight: 700; letter-spacing: .18em; text-align: center; }
.doc-meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; margin-top: 6px; }
.parties { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #bbb; margin-top: 14px; }
.party { padding: 10px 12px; }
.party + .party { border-left: 1px solid #bbb; }
.plabel { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #777; margin-bottom: 5px; }
.pname { font-weight: 700; margin-bottom: 2px; }
.prow { color: #444; margin-bottom: 1px; }
.email-row { color: #2563eb; }
table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10px; }
th { border: 1px solid #bbb; padding: 5px 6px; background: #f4f4f4; font-size: 9px; text-transform: uppercase; text-align: center; }
td { border: 1px solid #bbb; padding: 5px 6px; }
.terms-wrap { margin-top: 12px; }
.terms-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #777; margin-bottom: 5px; }
.terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; font-size: 10px; }
.kv { display: flex; gap: 4px; }
.kv-k { color: #888; }
.remarks { margin-top: 12px; font-size: 10px; }
.sig { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #bbb; padding-top: 14px; }
.seal { width: 52px; height: 52px; border: 2px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #ccc; }
.footer { margin-top: 14px; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
</style></head>
<body><div class="page">
  <div style="border-bottom: 2px solid #111; padding-bottom: 14px;">
    <h1>${title}</h1>
    <div class="doc-meta">
      <span>No: ${args.document_number ?? '—'}</span>
      <span>Date: ${args.issue_date ?? new Date().toISOString().slice(0, 10)}</span>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="plabel">SELLER / EXPORTER</div>
      <div class="pname">${args.seller?.company_name ?? '—'}</div>
      ${args.seller?.address ? `<div class="prow">${args.seller.address}</div>` : ''}
      ${args.seller?.contact_person ? `<div class="prow">${args.seller.contact_person}</div>` : ''}
      ${args.seller?.email ? `<div class="prow email-row">${args.seller.email}</div>` : ''}
      ${args.seller?.phone ? `<div class="prow">${args.seller.phone}</div>` : ''}
    </div>
    <div class="party">
      <div class="plabel">BUYER / IMPORTER</div>
      <div class="pname">${args.buyer?.company_name ?? '—'}</div>
      ${args.buyer?.address ? `<div class="prow">${args.buyer.address}</div>` : ''}
      ${args.buyer?.country ? `<div class="prow">${args.buyer.country}</div>` : ''}
      ${args.buyer?.contact_person ? `<div class="prow">${args.buyer.contact_person}</div>` : ''}
      ${args.buyer?.email ? `<div class="prow email-row">${args.buyer.email}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 26px;">No</th>
        <th style="text-align: left;">Description</th>
        <th>HS Code</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
        ${plExtraTH}
      </tr>
    </thead>
    <tbody>${
      itemRows ||
      `<tr><td colspan="${isPL ? 9 : 6}" style="text-align:center;color:#aaa;padding:14px">—</td></tr>`
    }</tbody>
    ${
      items.length > 0
        ? `<tfoot>
        <tr>
          <td colspan="${totalSpan}" style="font-weight:700;text-align:right;background:#f9f9f9;">TOTAL</td>
          <td style="font-weight:700;text-align:right;color:#1d4ed8;background:#f9f9f9;">${currency} ${total.toFixed(2)}</td>
        </tr>
      </tfoot>`
        : ''
    }
  </table>

  ${
    args.trade_terms
      ? `<div class="terms-wrap">
    <div class="terms-title">Trade Terms</div>
    <div class="terms-grid">
      ${args.trade_terms.incoterms ? `<div class="kv"><span class="kv-k">Incoterms:</span><span style="font-weight:600">${args.trade_terms.incoterms}</span></div>` : ''}
      ${args.trade_terms.payment_terms ? `<div class="kv"><span class="kv-k">Payment:</span><span style="font-weight:600">${args.trade_terms.payment_terms}</span></div>` : ''}
      ${args.trade_terms.port_of_loading ? `<div class="kv"><span class="kv-k">Port of Loading:</span><span style="font-weight:600">${args.trade_terms.port_of_loading}</span></div>` : ''}
      ${args.trade_terms.port_of_discharge ? `<div class="kv"><span class="kv-k">Port of Discharge:</span><span style="font-weight:600">${args.trade_terms.port_of_discharge}</span></div>` : ''}
      ${args.trade_terms.validity_date ? `<div class="kv"><span class="kv-k">Validity:</span><span style="font-weight:600">${args.trade_terms.validity_date}</span></div>` : ''}
    </div>
  </div>`
      : ''
  }

  ${
    args.remarks
      ? `<div class="remarks">
    <div class="terms-title">Remarks</div>
    <p style="color:#444;white-space:pre-wrap">${args.remarks}</p>
  </div>`
      : ''
  }

  <div class="sig">
    <div>
      <p style="color:#aaa;font-size:9px;margin-bottom:20px">Authorized Signature</p>
      <div style="border-top:1px solid #555;padding-top:3px;min-width:120px;font-size:9px;color:#444">${
        args.seller?.company_name ?? 'Seller'
      }</div>
    </div>
    <div class="seal">SEAL</div>
  </div>

  <div class="footer">Generated by FLONIX AI · ${new Date().toLocaleDateString('ko-KR')}</div>
</div></body></html>`;
}

// ─── 컴플라이언스 HTML ───────────────────────────────────────────────────────
function buildComplianceHTML(args: ComplianceArgs): string {
  const rows = (args.ingredients ?? [])
    .map(
      (ing) => `
      <tr>
        <td style="text-align:left;font-family:monospace;font-size:10px">${ing.inci_name ?? '—'}</td>
        <td style="text-align:right">${ing.percentage != null ? `${ing.percentage}%` : '—'}</td>
        <td style="font-family:monospace;font-size:10px">${ing.cas_number ?? '—'}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #111; background: #fff; }
.page { width: 794px; padding: 40px 50px; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
th { border: 1px solid #bfdbfe; padding: 7px 8px; background: #eff6ff; color: #1e40af; font-size: 10px; text-align: left; font-weight: 700; }
td { border: 1px solid #dbeafe; padding: 7px 8px; color: #1e3a8a; }
.footer { margin-top: 20px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 10px; }
</style></head>
<body><div class="page">
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:20px">
    <h1 style="font-size:16px;font-weight:700;color:#1e3a8a">${args.product_name ?? '제품명 미지정'}</h1>
    <p style="color:#3b82f6;margin-top:4px">→ ${
      args.target_country
        ? (COUNTRY_LABEL[args.target_country] ?? args.target_country)
        : '국가 미지정'
    }</p>
    ${
      args.product_category
        ? `<span style="display:inline-block;margin-top:8px;background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:999px;font-size:11px">${args.product_category}</span>`
        : ''
    }
  </div>

  ${
    rows
      ? `<h2 style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:6px">성분 검토 목록</h2>
  <table>
    <thead><tr><th>INCI Name</th><th style="width:90px;text-align:right">농도 (%)</th><th>CAS No.</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
      : `<p style="color:#9ca3af;margin-top:16px">성분 정보가 없습니다.</p>`
  }

  <div class="footer">Generated by FLONIX AI · ${new Date().toLocaleDateString('ko-KR')}</div>
</div></body></html>`;
}

// ─── 제안서 HTML ────────────────────────────────────────────────────────────
function buildProposalHTML(args: ProposalArgs): string {
  const items = args.items ?? [];
  const currency = items[0]?.currency ?? 'USD';
  const total = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const ps = args.proposal_sections;

  const itemRows = items
    .map(
      (item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#faf5ff'}">
        <td style="padding:6px 8px;font-weight:600">${item.product_name ?? '—'}</td>
        <td style="padding:6px 8px;text-align:center;font-family:monospace;font-size:10px;color:#666">${item.hs_code ?? '—'}</td>
        <td style="padding:6px 8px;text-align:right">${item.quantity?.toLocaleString() ?? '—'}</td>
        <td style="padding:6px 8px;text-align:right">${
          item.unit_price != null
            ? `${item.currency ?? 'USD'} ${item.unit_price.toFixed(2)}`
            : '—'
        }</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600">${
          item.quantity != null && item.unit_price != null
            ? `${item.currency ?? 'USD'} ${(item.quantity * item.unit_price).toFixed(2)}`
            : '—'
        }</td>
      </tr>`,
    )
    .join('');

  const certBadges = ps?.certifications
    ? ps.certifications
        .split(/[,;·]/)
        .map(
          (c) =>
            `<span style="display:inline-block;margin:2px;padding:2px 8px;background:#ecfdf5;color:#059669;border-radius:999px;font-size:9px;border:1px solid #a7f3d0">${c.trim()}</span>`,
        )
        .join('')
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 11px; color: #111; background: #fff; }
.page { width: 794px; padding: 0; }
.header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 50px; text-align: center; color: #fff; }
.header h1 { font-size: 20px; font-weight: 700; letter-spacing: .15em; margin-bottom: 6px; }
.header .meta { font-size: 10px; color: rgba(255,255,255,.7); display: flex; justify-content: space-between; }
.section { padding: 16px 50px; border-bottom: 1px solid #e5e7eb; }
.section-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #ede9fe; color: #6366f1; font-size: 10px; font-weight: 700; margin-right: 6px; }
.section-title { font-size: 12px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
th { padding: 8px; background: #f5f3ff; color: #6366f1; font-weight: 600; border-bottom: 2px solid #c4b5fd; text-align: left; }
td { padding: 6px 8px; border-bottom: 1px solid #f3e8ff; }
.total-row td { font-weight: 700; background: #f5f3ff; border-top: 2px solid #c4b5fd; color: #4f46e5; }
.cta { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 24px 50px; text-align: center; }
.footer { padding: 12px 50px; font-size: 9px; color: #9ca3af; text-align: center; border-top: 1px solid #f0f0f0; }
</style></head>
<body><div class="page">
  <div class="header">
    <div style="font-size:12px;color:rgba(255,255,255,.8);margin-bottom:4px;letter-spacing:.2em">${args.seller?.company_name ?? 'FLONIX'}</div>
    <h1>BUSINESS PROPOSAL</h1>
    <div class="meta">
      <span>No: ${args.document_number ?? '—'}</span>
      <span>Date: ${args.issue_date ?? new Date().toISOString().slice(0, 10)}</span>
    </div>
  </div>

  <div class="section" style="background:#f5f3ff">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7c3aed;margin-bottom:4px">PREPARED FOR</div>
    <div style="font-weight:600;font-size:13px">${args.buyer?.company_name ?? '—'}</div>
    ${args.buyer?.country ? `<div style="color:#666;margin-top:2px">${args.buyer.country}</div>` : ''}
    ${args.buyer?.contact_person ? `<div style="margin-top:2px">${args.buyer.contact_person}</div>` : ''}
    ${args.buyer?.email ? `<div style="color:#6366f1;margin-top:2px">${args.buyer.email}</div>` : ''}
  </div>

  ${
    ps?.company_overview
      ? `<div class="section">
    <div class="section-title"><span class="section-num">1</span> Company Overview</div>
    <p style="color:#374151;line-height:1.6">${ps.company_overview}</p>
    ${certBadges ? `<div style="margin-top:8px">${certBadges}</div>` : ''}
  </div>`
      : ''
  }

  <div class="section">
    <div class="section-title"><span class="section-num">2</span> Product Portfolio</div>
    ${ps?.product_highlights ? `<p style="color:#666;margin-bottom:8px">${ps.product_highlights}</p>` : ''}
    ${
      items.length > 0
        ? `<table>
      <thead><tr>
        <th style="text-align:left">Product</th>
        <th style="text-align:center">HS Code</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr></thead>
      <tbody>${itemRows}</tbody>
      <tfoot><tr class="total-row">
        <td colspan="4" style="text-align:right">TOTAL</td>
        <td style="text-align:right">${currency} ${total.toFixed(2)}</td>
      </tr></tfoot>
    </table>`
        : '<p style="color:#9ca3af">제품 정보 없음</p>'
    }
  </div>

  ${
    ps?.why_choose_us
      ? `<div class="section">
    <div class="section-title"><span class="section-num">3</span> Why Choose Us</div>
    <p style="color:#374151;line-height:1.6">${ps.why_choose_us}</p>
  </div>`
      : ''
  }

  ${
    ps?.partnership_terms
      ? `<div class="section">
    <div class="section-title"><span class="section-num">+</span> Partnership Terms</div>
    <p style="color:#374151;line-height:1.6">${ps.partnership_terms}</p>
  </div>`
      : ''
  }

  ${
    args.remarks
      ? `<div class="section">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:4px">Remarks</div>
    <p style="color:#666">${args.remarks}</p>
  </div>`
      : ''
  }

  <div class="cta">
    <div class="section-title"><span class="section-num">4</span> Contact & Next Steps</div>
    ${
      ps?.cta
        ? `<p style="color:#4f46e5;line-height:1.6">${ps.cta}</p>`
        : `<div>
      ${args.seller?.contact_person ? `<p style="font-weight:600">${args.seller.contact_person}</p>` : ''}
      ${args.seller?.email ? `<p style="color:#6366f1">${args.seller.email}</p>` : ''}
      ${args.seller?.phone ? `<p style="color:#666">${args.seller.phone}</p>` : ''}
    </div>`
    }
  </div>

  <div class="footer">Generated by FLONIX AI · Confidential · ${new Date().toLocaleDateString('ko-KR')}</div>
</div></body></html>`;
}

// ─── 제안서 DOCX ────────────────────────────────────────────────────────────
function buildProposalDOCX(args: ProposalArgs): Document {
  const items = args.items ?? [];
  const currency = items[0]?.currency ?? 'USD';
  const total = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);
  const ps = args.proposal_sections;

  const headerRow = new TableRow({
    tableHeader: true,
    children: ['Product', 'HS Code', 'Qty', 'Unit Price', 'Amount'].map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, color: '6366F1' })],
              alignment: h === 'Product' ? AlignmentType.LEFT : AlignmentType.CENTER,
            }),
          ],
        }),
    ),
  });

  const itemRows = items.map(
    (item, i) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.product_name ?? '—', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ text: item.hs_code ?? '—', alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: item.quantity?.toLocaleString() ?? '—', alignment: AlignmentType.RIGHT })] }),
          new TableCell({
            children: [
              new Paragraph({
                text: item.unit_price != null ? `${item.currency ?? 'USD'} ${item.unit_price.toFixed(2)}` : '—',
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      item.quantity != null && item.unit_price != null
                        ? `${item.currency ?? 'USD'} ${(item.quantity * item.unit_price).toFixed(2)}`
                        : '—',
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
  );

  const totalRow =
    items.length > 0
      ? [
          new TableRow({
            children: [
              ...Array(3)
                .fill(null)
                .map(() => new TableCell({ children: [new Paragraph('')] })),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'TOTAL', bold: true, color: '6366F1' })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${currency} ${total.toFixed(2)}`, bold: true, color: '6366F1' })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ]
      : [];

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: args.seller?.company_name ?? 'FLONIX', heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: 'BUSINESS PROPOSAL', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({
      children: [
        new TextRun({
          text: `No: ${args.document_number ?? '—'}    Date: ${args.issue_date ?? new Date().toISOString().slice(0, 10)}`,
          color: '666666',
          size: 20,
        }),
      ],
      alignment: AlignmentType.RIGHT,
    }),
    new Paragraph({ text: '' }),

    // Buyer
    new Paragraph({ text: 'PREPARED FOR', heading: HeadingLevel.HEADING_3 }),
    new Paragraph({ children: [new TextRun({ text: args.buyer?.company_name ?? '—', bold: true })] }),
    ...(args.buyer?.country ? [new Paragraph({ text: args.buyer.country })] : []),
    ...(args.buyer?.contact_person ? [new Paragraph({ text: args.buyer.contact_person })] : []),
    ...(args.buyer?.email ? [new Paragraph({ children: [new TextRun({ text: args.buyer.email, color: '6366F1' })] })] : []),
    new Paragraph({ text: '' }),
  ];

  // Section 1
  if (ps?.company_overview) {
    children.push(
      new Paragraph({ text: '1. COMPANY OVERVIEW', heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: ps.company_overview }),
    );
    if (ps.certifications) {
      children.push(new Paragraph({ children: [new TextRun({ text: `Certifications: ${ps.certifications}`, italics: true, color: '059669' })] }));
    }
    children.push(new Paragraph({ text: '' }));
  }

  // Section 2
  children.push(new Paragraph({ text: '2. PRODUCT PORTFOLIO', heading: HeadingLevel.HEADING_3 }));
  if (ps?.product_highlights) {
    children.push(new Paragraph({ text: ps.product_highlights }));
  }
  if (items.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...itemRows, ...totalRow],
      }),
    );
  }
  children.push(new Paragraph({ text: '' }));

  // Section 3
  if (ps?.why_choose_us) {
    children.push(
      new Paragraph({ text: '3. WHY CHOOSE US', heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: ps.why_choose_us }),
      new Paragraph({ text: '' }),
    );
  }

  // Partnership Terms
  if (ps?.partnership_terms) {
    children.push(
      new Paragraph({ text: 'PARTNERSHIP TERMS', heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: ps.partnership_terms }),
      new Paragraph({ text: '' }),
    );
  }

  // Remarks
  if (args.remarks) {
    children.push(
      new Paragraph({ text: 'REMARKS', heading: HeadingLevel.HEADING_3 }),
      new Paragraph({ text: args.remarks }),
      new Paragraph({ text: '' }),
    );
  }

  // CTA
  children.push(new Paragraph({ text: '4. CONTACT & NEXT STEPS', heading: HeadingLevel.HEADING_3 }));
  if (ps?.cta) {
    children.push(new Paragraph({ children: [new TextRun({ text: ps.cta, color: '4F46E5' })] }));
  } else {
    if (args.seller?.contact_person) children.push(new Paragraph({ children: [new TextRun({ text: args.seller.contact_person, bold: true })] }));
    if (args.seller?.email) children.push(new Paragraph({ children: [new TextRun({ text: args.seller.email, color: '6366F1' })] }));
    if (args.seller?.phone) children.push(new Paragraph({ text: args.seller.phone }));
  }

  children.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated by FLONIX AI · Confidential · ${new Date().toLocaleDateString('ko-KR')}`,
          color: '999999',
          size: 18,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(20),
            left: convertMillimetersToTwip(15),
            right: convertMillimetersToTwip(15),
          },
        },
      },
      children,
    }],
  });
}

// ─── 무역 서류 DOCX ─────────────────────────────────────────────────────────
function buildTradeDocDOCX(args: TradeDocArgs, docType: string): Document {
  const title = DOC_TITLE[docType] ?? docType;
  const items = args.items ?? [];
  const currency = items[0]?.currency ?? 'USD';
  const total = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.unit_price ?? 0), 0);

  const headerRow = new TableRow({
    tableHeader: true,
    children: ['No', 'Description', 'HS Code', 'Qty', 'Unit Price', 'Amount'].map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true })],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
    ),
  });

  const itemRows = items.map(
    (item, i) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: String(i + 1), alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.product_name ?? '—', bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ text: item.hs_code ?? '—', alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: item.quantity?.toLocaleString() ?? '—', alignment: AlignmentType.RIGHT })] }),
          new TableCell({
            children: [
              new Paragraph({
                text: item.unit_price != null ? `${item.currency ?? 'USD'} ${item.unit_price.toFixed(2)}` : '—',
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      item.quantity != null && item.unit_price != null
                        ? `${item.currency ?? 'USD'} ${(item.quantity * item.unit_price).toFixed(2)}`
                        : '—',
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
  );

  const totalRow =
    items.length > 0
      ? [
          new TableRow({
            children: [
              // 빈 셀 4개 + TOTAL 레이블 + 금액
              ...Array(4)
                .fill(null)
                .map(() => new TableCell({ children: [new Paragraph('')] })),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'TOTAL', bold: true })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `${currency} ${total.toFixed(2)}`, bold: true })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ]
      : [];

  // Trade terms rows
  const termsRows: TableRow[] = [];
  const makeTermRow = (label: string, value?: string) => {
    if (!value) return;
    termsRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
          new TableCell({ children: [new Paragraph({ text: value })] }),
        ],
      }),
    );
  };
  const tt = args.trade_terms;
  if (tt) {
    makeTermRow('Incoterms', tt.incoterms);
    makeTermRow('Payment Terms', tt.payment_terms);
    makeTermRow('Port of Loading', tt.port_of_loading);
    makeTermRow('Port of Discharge', tt.port_of_discharge);
    makeTermRow('Validity', tt.validity_date);
  }

  return new Document({
    sections: [
      {
        properties: {
            page: {
              margin: {
                top: convertMillimetersToTwip(20),
                bottom: convertMillimetersToTwip(20),
                left: convertMillimetersToTwip(15),
                right: convertMillimetersToTwip(15),
              },
            },
          },
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({
            children: [
              new TextRun({
                text: `No: ${args.document_number ?? '—'}    Date: ${
                  args.issue_date ?? new Date().toISOString().slice(0, 10)
                }`,
                color: '666666',
                size: 20,
              }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({ text: '' }),

          // Seller
          new Paragraph({ text: 'SELLER / EXPORTER', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: args.seller?.company_name ?? '—', bold: true })] }),
          ...(args.seller?.address ? [new Paragraph({ text: args.seller.address })] : []),
          ...(args.seller?.contact_person ? [new Paragraph({ text: args.seller.contact_person })] : []),
          ...(args.seller?.email ? [new Paragraph({ text: args.seller.email })] : []),
          ...(args.seller?.phone ? [new Paragraph({ text: args.seller.phone })] : []),
          new Paragraph({ text: '' }),

          // Buyer
          new Paragraph({ text: 'BUYER / IMPORTER', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: args.buyer?.company_name ?? '—', bold: true })] }),
          ...(args.buyer?.address ? [new Paragraph({ text: args.buyer.address })] : []),
          ...(args.buyer?.country ? [new Paragraph({ text: args.buyer.country })] : []),
          ...(args.buyer?.contact_person ? [new Paragraph({ text: args.buyer.contact_person })] : []),
          ...(args.buyer?.email ? [new Paragraph({ text: args.buyer.email })] : []),
          new Paragraph({ text: '' }),

          // Items
          new Paragraph({ text: 'ITEMS', heading: HeadingLevel.HEADING_3 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...itemRows, ...totalRow],
          }),

          // Trade Terms
          ...(termsRows.length > 0
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({ text: 'TRADE TERMS', heading: HeadingLevel.HEADING_3 }),
                new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: termsRows }),
              ]
            : []),

          // Remarks
          ...(args.remarks
            ? [
                new Paragraph({ text: '' }),
                new Paragraph({ text: 'REMARKS', heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: args.remarks }),
              ]
            : []),

          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated by FLONIX AI · ${new Date().toLocaleDateString('ko-KR')}`,
                color: '999999',
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });
}

// ─── 컴플라이언스 DOCX ───────────────────────────────────────────────────────
function buildComplianceDOCX(args: ComplianceArgs): Document {
  const ingRows = (args.ingredients ?? []).map(
    (ing) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: ing.inci_name ?? '—' })] }),
          new TableCell({
            children: [
              new Paragraph({
                text: ing.percentage != null ? `${ing.percentage}%` : '—',
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
          new TableCell({ children: [new Paragraph({ text: ing.cas_number ?? '—' })] }),
        ],
      }),
  );

  return new Document({
    sections: [
      {
        properties: {
            page: {
              margin: {
                top: convertMillimetersToTwip(20),
                bottom: convertMillimetersToTwip(20),
                left: convertMillimetersToTwip(15),
                right: convertMillimetersToTwip(15),
              },
            },
          },
        children: [
          new Paragraph({ text: 'COMPLIANCE CHECK REPORT', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '제품명: ', bold: true }),
              new TextRun(args.product_name ?? '미지정'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '대상 국가: ', bold: true }),
              new TextRun(
                args.target_country
                  ? (COUNTRY_LABEL[args.target_country] ?? args.target_country)
                  : '미지정',
              ),
            ],
          }),
          ...(args.product_category
            ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: '제품 카테고리: ', bold: true }),
                    new TextRun(args.product_category),
                  ],
                }),
              ]
            : []),
          new Paragraph({ text: '' }),

          ...(ingRows.length > 0
            ? [
                new Paragraph({ text: '성분 검토 목록', heading: HeadingLevel.HEADING_3 }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      tableHeader: true,
                      children: ['INCI Name', '농도 (%)', 'CAS No.'].map(
                        (h) =>
                          new TableCell({
                            children: [
                              new Paragraph({ children: [new TextRun({ text: h, bold: true })] }),
                            ],
                          }),
                      ),
                    }),
                    ...ingRows,
                  ],
                }),
              ]
            : [
                new Paragraph({
                  children: [new TextRun({ text: '성분 정보가 없습니다.', color: '9CA3AF' })],
                }),
              ]),

          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated by FLONIX AI · ${new Date().toLocaleDateString('ko-KR')}`,
                color: '999999',
                size: 18,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });
}

// ─── Public API ────────────────────────────────────────────────────────────

/** PI / CI / PL / NDA / SALES_CONTRACT → FLONIX_[TYPE]_[YYYYMMDD].pdf */
export async function downloadTradeDocAsPDF(
  args: Record<string, unknown>,
  docType: string,
): Promise<void> {
  const blob = await htmlToBlob(buildTradeDocHTML(args as unknown as TradeDocArgs, docType));
  triggerDownload(blob, `FLONIX_${docType}_${todayCompact()}.pdf`);
}

/** COMPLIANCE → FLONIX_COMPLIANCE_[YYYYMMDD].pdf */
export async function downloadComplianceAsPDF(
  args: Record<string, unknown>,
): Promise<void> {
  const blob = await htmlToBlob(buildComplianceHTML(args as unknown as ComplianceArgs));
  triggerDownload(blob, `FLONIX_COMPLIANCE_${todayCompact()}.pdf`);
}

/** PI / CI / PL / NDA / SALES_CONTRACT → FLONIX_[TYPE]_[YYYYMMDD].docx */
export async function downloadTradeDocAsWord(
  args: Record<string, unknown>,
  docType: string,
): Promise<void> {
  const blob = await Packer.toBlob(
    buildTradeDocDOCX(args as unknown as TradeDocArgs, docType),
  );
  saveAs(blob, `FLONIX_${docType}_${todayCompact()}.docx`);
}

/** COMPLIANCE → FLONIX_COMPLIANCE_[YYYYMMDD].docx */
export async function downloadComplianceAsWord(
  args: Record<string, unknown>,
): Promise<void> {
  const blob = await Packer.toBlob(buildComplianceDOCX(args as unknown as ComplianceArgs));
  saveAs(blob, `FLONIX_COMPLIANCE_${todayCompact()}.docx`);
}

/** PROPOSAL → FLONIX_PROPOSAL_[YYYYMMDD].pdf */
export async function downloadProposalAsPDF(
  args: Record<string, unknown>,
): Promise<void> {
  const blob = await htmlToBlob(buildProposalHTML(args as unknown as ProposalArgs));
  triggerDownload(blob, `FLONIX_PROPOSAL_${todayCompact()}.pdf`);
}

/** PROPOSAL → FLONIX_PROPOSAL_[YYYYMMDD].docx */
export async function downloadProposalAsWord(
  args: Record<string, unknown>,
): Promise<void> {
  const blob = await Packer.toBlob(buildProposalDOCX(args as unknown as ProposalArgs));
  saveAs(blob, `FLONIX_PROPOSAL_${todayCompact()}.docx`);
}
