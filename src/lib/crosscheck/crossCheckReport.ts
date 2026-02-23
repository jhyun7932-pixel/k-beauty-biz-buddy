// DOC_CROSSCHECK_REPORT Template Renderer
// Generates agency-grade HTML report for cross-document validation

import type { CrossCheckResult, ItemDiffRow } from './crossCheckEngine';

export function renderCrossCheckReport(
  result: CrossCheckResult,
  projectName: string = 'K-Beauty Export',
  brandName: string = 'K-Beauty Co.'
): string {
  const { summary, findings, missingDocs, itemDiff, totalsDiff } = result;
  const date = new Date().toLocaleDateString('ko-KR');
  
  const blockingFindings = findings.filter(f => f.severity === 'BLOCKING');
  const warningFindings = findings.filter(f => f.severity === 'WARNING');
  
  const totalPages = Math.min(6, Math.ceil((2 + blockingFindings.length + warningFindings.length + itemDiff.length) / 4));

  return `
    <style>
      ${getCrossCheckCSS()}
    </style>
    <div class="doc-root crosscheck" data-template-key="DOC_CROSSCHECK_REPORT">
      <!-- Page 1: Summary & Blocking Issues -->
      <section class="page" data-page="1">
        <header class="doc-header">
          <div class="brandmark">
            <div class="logo-placeholder">📋</div>
            <div>
              <h1 class="doc-title">문서 일관성 체크 리포트</h1>
              <div class="doc-subtitle">${projectName} · 본오더 · ${date}</div>
            </div>
          </div>
          <div class="doc-meta-badge">
            <span class="badge ${summary.blockingCount > 0 ? 'red' : 'green'}">
              ${summary.blockingCount > 0 ? '수정 필요' : '통과'}
            </span>
          </div>
        </header>
        
        <div class="page-content">
          <!-- Score Card -->
          <div class="score-card">
            <div class="score-main">
              <div class="score-number ${summary.score >= 80 ? 'green' : summary.score >= 50 ? 'yellow' : 'red'}">
                ${summary.score}
              </div>
              <div class="score-label">/ 100점</div>
            </div>
            <div class="score-breakdown">
              <span class="pill red">🚫 막힘 ${summary.blockingCount}</span>
              <span class="pill yellow">⚠️ 주의 ${summary.warningCount}</span>
              <span class="pill green">✅ 정상 ${summary.okCount}</span>
            </div>
            <div class="score-message">
              ${summary.blockingCount > 0 
                ? '<strong>최종 확정 전, 막힘 항목은 반드시 수정해야 합니다.</strong><br/>원클릭 수정으로 PI/계약서/인보이스/포장명세서 값을 자동으로 맞춰드릴게요.'
                : '<strong>실수 0건! 이제 최종 확정하고 바이어에게 보내도 안전합니다.</strong>'
              }
            </div>
            <div class="cta-buttons">
              <button class="btn-primary" data-action="apply-all-fixes" ${summary.blockingCount === 0 ? 'disabled' : ''}>
                ⚡ 원클릭으로 자동 수정
              </button>
              <button class="btn-secondary" data-action="ask-ai">
                💬 AI에게 수정 요청
              </button>
            </div>
          </div>

          ${missingDocs.length > 0 ? `
            <div class="callout warning">
              <strong>⚠️ 누락된 문서</strong>
              <ul>
                ${missingDocs.map(d => `
                  <li>
                    <span>${d.suggestion}</span>
                    <button class="btn-inline" data-action="create-doc" data-doc="${d.docKey}">
                      지금 생성
                    </button>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          ${blockingFindings.length > 0 ? `
            <h2 class="section-title">🚫 막힘 (필수 수정) — ${blockingFindings.length}건</h2>
            <table class="findings-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>문서별 값</th>
                  <th>추천</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
                ${blockingFindings.slice(0, 5).map(f => `
                  <tr>
                    <td>
                      <span class="pill red">막힘</span>
                      <strong>${f.title}</strong>
                      <div class="small">${f.description}</div>
                    </td>
                    <td>
                      <ul class="doc-values">
                        ${f.detectedValues.slice(0, 3).map(v => `
                          <li><span class="doc-label">${getDocLabel(v.docKey)}</span>: ${formatValue(v.value)}</li>
                        `).join('')}
                      </ul>
                    </td>
                    <td><strong>${formatValue(f.recommendedValue)}</strong></td>
                    <td class="action-cell">
                      ${f.fixActions.slice(0, 2).map((action, i) => `
                        <button class="btn-inline" data-action="apply-fix" data-finding="${f.id}" data-index="${i}">
                          ${action.label}
                        </button>
                      `).join('')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="success-box">
              <span class="success-icon">✅</span>
              <span>막힘 항목이 없습니다! 문서를 최종 확정할 수 있어요.</span>
            </div>
          `}
        </div>
        
        <footer class="doc-footer">
          <span>${brandName}</span>
          <span>Page 1 / ${totalPages}</span>
        </footer>
      </section>

      <!-- Page 2: Warnings -->
      <section class="page" data-page="2">
        <header class="doc-header-mini">
          <span>주의 항목 (확인 권장)</span>
          <span>${date}</span>
        </header>
        
        <div class="page-content">
          ${warningFindings.length > 0 ? `
            <h2 class="section-title">⚠️ 주의 (확인 권장) — ${warningFindings.length}건</h2>
            <table class="findings-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>문서별 값</th>
                  <th>추천</th>
                  <th>수정</th>
                </tr>
              </thead>
              <tbody>
                ${warningFindings.map(f => `
                  <tr>
                    <td>
                      <span class="pill yellow">주의</span>
                      <strong>${f.title}</strong>
                      <div class="small">${f.whyItMatters}</div>
                    </td>
                    <td>
                      <ul class="doc-values">
                        ${f.detectedValues.slice(0, 3).map(v => `
                          <li><span class="doc-label">${getDocLabel(v.docKey)}</span>: ${formatValue(v.value)}</li>
                        `).join('')}
                      </ul>
                    </td>
                    <td>${formatValue(f.recommendedValue) || '-'}</td>
                    <td class="action-cell">
                      ${f.fixActions.slice(0, 2).map((action, i) => `
                        <button class="btn-inline" data-action="apply-fix" data-finding="${f.id}" data-index="${i}">
                          ${action.label}
                        </button>
                      `).join('')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="success-box">
              <span class="success-icon">✅</span>
              <span>주의 항목도 없습니다!</span>
            </div>
          `}
        </div>
        
        <footer class="doc-footer">
          <span>${brandName}</span>
          <span>Page 2 / ${totalPages}</span>
        </footer>
      </section>

      <!-- Page 3: SKU Cross-check -->
      <section class="page" data-page="3">
        <header class="doc-header-mini">
          <span>SKU/수량/금액 교차검증</span>
          <span>${date}</span>
        </header>
        
        <div class="page-content">
          <h2 class="section-title">📦 SKU별 수량/단가 비교</h2>
          <table class="diff-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>PI 수량</th>
                <th>PL 수량</th>
                <th>Invoice 수량</th>
                <th>PI 단가</th>
                <th>Invoice 단가</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              ${itemDiff.map(row => `
                <tr class="${row.status === 'MISMATCH' ? 'row-error' : row.status === 'MISSING' ? 'row-warning' : ''}">
                  <td><strong>${row.skuName}</strong></td>
                  <td class="${row.qtyPI !== row.qtyINV ? 'cell-diff' : ''}">${row.qtyPI ?? '-'}</td>
                  <td class="${row.qtyPI !== row.qtyPL ? 'cell-diff' : ''}">${row.qtyPL ?? '-'}</td>
                  <td class="${row.qtyPI !== row.qtyINV ? 'cell-diff' : ''}">${row.qtyINV ?? '-'}</td>
                  <td class="${row.unitPricePI !== row.unitPriceINV ? 'cell-diff' : ''}">$${row.unitPricePI ?? '-'}</td>
                  <td class="${row.unitPricePI !== row.unitPriceINV ? 'cell-diff' : ''}">$${row.unitPriceINV ?? '-'}</td>
                  <td>
                    <span class="pill ${row.status === 'OK' ? 'green' : row.status === 'MISMATCH' ? 'red' : 'yellow'}">
                      ${row.status === 'OK' ? '✓' : row.status === 'MISMATCH' ? '불일치' : '누락'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 class="section-title" style="margin-top: 20px;">💰 총액 검증</h3>
          <table class="totals-table">
            <tr>
              <th></th>
              <th>PI</th>
              <th>Invoice</th>
              <th>판정</th>
            </tr>
            <tr>
              <td>Subtotal</td>
              <td>$${totalsDiff.piSubtotal?.toLocaleString() ?? '-'}</td>
              <td class="${totalsDiff.subtotalStatus === 'MISMATCH' ? 'cell-diff' : ''}">
                $${totalsDiff.invSubtotal?.toLocaleString() ?? '-'}
              </td>
              <td>
                <span class="pill ${totalsDiff.subtotalStatus === 'OK' ? 'green' : totalsDiff.subtotalStatus === 'MISMATCH' ? 'red' : 'yellow'}">
                  ${totalsDiff.subtotalStatus === 'OK' ? '✓' : totalsDiff.subtotalStatus}
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>Grand Total</strong></td>
              <td><strong>$${totalsDiff.piTotal?.toLocaleString() ?? '-'}</strong></td>
              <td class="${totalsDiff.totalStatus === 'MISMATCH' ? 'cell-diff' : ''}">
                <strong>$${totalsDiff.invTotal?.toLocaleString() ?? '-'}</strong>
              </td>
              <td>
                <span class="pill ${totalsDiff.totalStatus === 'OK' ? 'green' : totalsDiff.totalStatus === 'MISMATCH' ? 'red' : 'yellow'}">
                  ${totalsDiff.totalStatus === 'OK' ? '✓' : totalsDiff.totalStatus}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        <footer class="doc-footer">
          <span>${brandName}</span>
          <span>Page 3 / ${totalPages}</span>
        </footer>
      </section>

      <!-- Page 4: Fix Plan -->
      <section class="page" data-page="4">
        <header class="doc-header-mini">
          <span>추천 수정 플랜</span>
          <span>${date}</span>
        </header>
        
        <div class="page-content">
          <h2 class="section-title">🔧 추천 수정 플랜</h2>
          <table class="fix-table">
            <thead>
              <tr>
                <th>우선순위</th>
                <th>무엇을</th>
                <th>어느 문서</th>
                <th>바꿀 값</th>
                <th>실행</th>
              </tr>
            </thead>
            <tbody>
              ${blockingFindings.concat(warningFindings).slice(0, 8).map((f, i) => `
                <tr>
                  <td><strong class="${f.severity === 'BLOCKING' ? 'priority-high' : 'priority-med'}">P${i + 1}</strong></td>
                  <td>${f.title}</td>
                  <td>${f.fixActions[0]?.targetDocKey ? getDocLabel(f.fixActions[0].targetDocKey) : '여러 문서'}</td>
                  <td><strong>${formatValue(f.recommendedValue)}</strong></td>
                  <td>
                    <button class="btn-inline" data-action="apply-fix" data-finding="${f.id}" data-index="0">
                      적용
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="callout info">
            <strong>📝 기록</strong><br/>
            자동 수정 시 문서 버전이 증가합니다. (v1 → v2)<br/>
            모든 변경 내역은 히스토리에서 확인할 수 있습니다.
          </div>

          <div class="final-cta">
            <button class="btn-primary large" data-action="apply-all-fixes" ${summary.blockingCount === 0 ? 'disabled' : ''}>
              ⚡ 모든 막힘 항목 자동 수정
            </button>
          </div>
        </div>
        
        <footer class="doc-footer">
          <span>${brandName} · Cross-document Validation Report</span>
          <span>Page 4 / ${totalPages}</span>
        </footer>
      </section>
    </div>
  `;
}

function getDocLabel(docKey: string): string {
  const labels: Record<string, string> = {
    DOC_PI: 'PI',
    DOC_CONTRACT: '계약서',
    DOC_COMMERCIAL_INVOICE: '인보이스',
    DOC_PACKING_LIST: '포장명세서',
  };
  return labels[docKey] || docKey;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

function getCrossCheckCSS(): string {
  return `
    :root {
      --accent: 217 91% 60%;
      --red: 0 84% 60%;
      --yellow: 45 93% 47%;
      --green: 142 71% 45%;
    }

    .doc-root.crosscheck {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1a1a2e;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: #fff;
      page-break-after: always;
      position: relative;
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid hsl(var(--accent));
    }

    .brandmark {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-placeholder {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: hsl(var(--accent) / 0.1);
      border-radius: 8px;
    }

    .doc-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
      color: hsl(var(--accent));
    }

    .doc-subtitle {
      font-size: 12px;
      color: #666;
    }

    .doc-header-mini {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 20px;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.red { background: hsl(var(--red) / 0.1); color: hsl(var(--red)); }
    .badge.green { background: hsl(var(--green) / 0.1); color: hsl(var(--green)); }

    .page-content {
      min-height: calc(297mm - 80mm);
    }

    .score-card {
      background: linear-gradient(135deg, hsl(var(--accent) / 0.05), hsl(var(--accent) / 0.1));
      border: 1px solid hsl(var(--accent) / 0.2);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }

    .score-main {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .score-number {
      font-size: 56px;
      font-weight: 800;
    }

    .score-number.green { color: hsl(var(--green)); }
    .score-number.yellow { color: hsl(var(--yellow)); }
    .score-number.red { color: hsl(var(--red)); }

    .score-label {
      font-size: 18px;
      color: #666;
    }

    .score-breakdown {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .pill.red { background: #ffe8ea; color: #b42318; }
    .pill.yellow { background: #fff7e6; color: #9a6700; }
    .pill.green { background: #eafff1; color: #067647; }

    .score-message {
      font-size: 14px;
      color: #333;
      margin-bottom: 20px;
    }

    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: hsl(var(--accent));
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      border: 1px solid hsl(var(--accent));
      color: hsl(var(--accent));
    }

    .btn-inline {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      transition: all 0.15s;
    }

    .btn-inline:hover {
      background: hsl(var(--accent));
      color: white;
      border-color: hsl(var(--accent));
    }

    .callout {
      padding: 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 13px;
    }

    .callout.warning {
      background: #fff7e6;
      border-left: 4px solid hsl(var(--yellow));
    }

    .callout.info {
      background: hsl(var(--accent) / 0.05);
      border-left: 4px solid hsl(var(--accent));
    }

    .callout ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .callout li {
      margin: 6px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: #1a1a2e;
    }

    .findings-table, .diff-table, .totals-table, .fix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 20px;
    }

    .findings-table th, .diff-table th, .totals-table th, .fix-table th {
      background: #f8f9fa;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }

    .findings-table td, .diff-table td, .totals-table td, .fix-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }

    .doc-values {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .doc-values li {
      margin: 4px 0;
      font-size: 11px;
    }

    .doc-label {
      display: inline-block;
      padding: 2px 6px;
      background: #f0f0f0;
      border-radius: 4px;
      font-weight: 500;
      margin-right: 4px;
    }

    .action-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .small {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }

    .row-error {
      background: hsl(var(--red) / 0.05);
    }

    .row-warning {
      background: hsl(var(--yellow) / 0.05);
    }

    .cell-diff {
      background: hsl(var(--red) / 0.1);
      font-weight: 600;
    }

    .success-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      background: hsl(var(--green) / 0.1);
      border-radius: 12px;
      margin: 20px 0;
    }

    .success-icon {
      font-size: 24px;
    }

    .priority-high { color: hsl(var(--red)); }
    .priority-med { color: hsl(var(--yellow)); }

    .final-cta {
      margin-top: 24px;
      text-align: center;
    }

    .btn-primary.large {
      padding: 14px 32px;
      font-size: 16px;
    }

    .doc-footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }

    @media print {
      .page {
        page-break-after: always;
      }
      .btn-primary, .btn-secondary, .btn-inline {
        display: none;
      }
    }
  `;
}
