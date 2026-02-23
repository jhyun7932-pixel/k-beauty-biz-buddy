// 공통 문서 CSS — 에이전시급 인쇄 품질
export const DOCUMENT_CSS = `
:root{
  --ink:#0b1220;
  --muted:#5b6b86;
  --line:#d9e2ef;
  --bg:#ffffff;
  --navy:#0c1a33;
  --aurora:#4aa3ff;
  --lilac:#8b7bff;
  --mint:#34d399;
  --warn:#f59e0b;
  --danger:#ef4444;
  --ok:#22c55e;
  --shadow: 0 10px 30px rgba(12,26,51,.12);
  --radius: 14px;
  --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:#f6f8fc;font-family:var(--font);color:var(--ink)}
.doc-wrap{max-width:980px;margin:0 auto;padding:24px}
.doc-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:10px 0 18px;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--line);font-size:12px;color:var(--muted);background:#fff}
.badge.ok{border-color:rgba(34,197,94,.35);color:var(--ok)}
.badge.warn{border-color:rgba(245,158,11,.35);color:var(--warn)}
.badge.danger{border-color:rgba(239,68,68,.35);color:var(--danger)}
.btn{border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;font-size:13px;cursor:pointer;box-shadow:0 1px 0 rgba(12,26,51,.04)}
.btn.primary{border:none;background:linear-gradient(135deg,var(--aurora),var(--lilac));color:#fff}
.btn.ghost{background:transparent}
.page{
  width: 794px;
  min-height: 1123px;
  margin: 0 auto 18px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}
.page-inner{padding:46px 54px}
.header{
  display:flex;justify-content:space-between;align-items:flex-start;
  padding:18px 22px;border-bottom:1px solid var(--line);
  background: linear-gradient(180deg, rgba(74,163,255,.10), rgba(139,123,255,.06));
}
.brandmark{display:flex;gap:10px;align-items:center}
.logo{
  width:34px;height:34px;border-radius:12px;
  background: radial-gradient(circle at 30% 30%, rgba(74,163,255,.9), rgba(139,123,255,.85));
  box-shadow:0 0 18px rgba(74,163,255,.25);
}
.doctitle{font-weight:800;font-size:14px;letter-spacing:.2px}
.docmeta{font-size:12px;color:var(--muted);line-height:1.45;text-align:right}
.footer{
  position:absolute;left:0;right:0;bottom:0;
  display:flex;justify-content:space-between;align-items:center;
  padding:12px 18px;border-top:1px solid var(--line);
  color:var(--muted);font-size:11px;background:#fff;
}
.h1{font-size:30px;font-weight:900;margin:0 0 8px}
.h2{font-size:18px;font-weight:800;margin:18px 0 10px}
.h3{font-size:15px;font-weight:700;margin:14px 0 8px}
.p{margin:0;color:var(--muted);line-height:1.6;font-size:13px}
.kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
.kpi .card{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff}
.kpi .label{font-size:12px;color:var(--muted)}
.kpi .val{font-size:18px;font-weight:900;margin-top:6px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.card{border:1px solid var(--line);border-radius:14px;padding:16px;background:#fff}
.table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}
.table th,.table td{border:1px solid var(--line);padding:8px 10px;vertical-align:top}
.table th{background:#f7faff;color:var(--ink);font-weight:800}
.small{font-size:11px;color:var(--muted)}
.hr{height:1px;background:var(--line);margin:14px 0}
.callout{
  border:1px solid rgba(74,163,255,.35);
  background:rgba(74,163,255,.06);
  border-radius:14px;padding:14px;
}
.callout.warn{
  border-color:rgba(245,158,11,.35);
  background:rgba(245,158,11,.06);
}
.callout.danger{
  border-color:rgba(239,68,68,.35);
  background:rgba(239,68,68,.06);
}
.callout strong{color:var(--ink)}
.draft-banner{
  background:linear-gradient(90deg, rgba(245,158,11,.15), rgba(239,68,68,.08));
  border:1px solid rgba(245,158,11,.4);
  border-radius:8px;
  padding:10px 14px;
  font-size:12px;
  color:var(--warn);
  margin-bottom:14px;
}
.section-edit-btn{
  position:absolute;
  top:8px;
  right:8px;
  opacity:0;
  transition:opacity 0.2s;
}
.card:hover .section-edit-btn,
[data-section-id]:hover .section-edit-btn{
  opacity:1;
}
@media print{
  body{background:#fff}
  .doc-wrap{padding:0}
  .doc-toolbar{display:none}
  .page{box-shadow:none;margin:0;border-radius:0;border:none;page-break-after:always}
  .section-edit-btn{display:none}
}
`;

// 문서 타입별 페이지 정책
export const PAGE_LIMITS = {
  brand_deck: { summary: { min: 3, max: 5 }, detailed: { min: 6, max: 8 } },
  catalog: { summary: { min: 3, max: 5 }, detailed: { min: 6, max: 15 } },
  compliance: { summary: { min: 3, max: 4 }, detailed: { min: 5, max: 6 } },
  pi: { summary: { min: 1, max: 1 }, detailed: { min: 2, max: 2 } },
  contract: { summary: { min: 4, max: 6 }, detailed: { min: 8, max: 12 } },
} as const;

export type DocumentType = keyof typeof PAGE_LIMITS;
export type DocumentMode = 'summary' | 'detailed';

// RulePack 샘플 데이터 (MVP용)
export const RULEPACKS = {
  US: {
    version: "US-Beauty-RulePack v0.3 (MVP sample)",
    focus: ["MoCRA(시설/제품 등록/안전근거)", "라벨 필수표기", "금지/제한 성분 1차 스캔(샘플)"],
    labelMust: ["Product identity(제품명/용도)", "Net quantity(내용량)", "Ingredient declaration(INCI)", "Manufacturer/Distributor", "Warnings(if applicable)"],
    watchouts: ["OTC(자외선차단 등) 해당 시 별도 요건 가능", "Claims 과장/의약품 오인 위험"],
    ingredientsRedFlagExample: ["Hydroquinone(예시)", "Mercury compounds(예시)"]
  },
  JP: {
    version: "JP-Beauty-RulePack v0.3 (MVP sample)",
    focus: ["일본 수입화장품 표시/성분 표기 관행(샘플)", "주의 성분 1차 스캔(샘플)"],
    labelMust: ["제품명", "전성분", "내용량", "제조번호/로트", "제조판매업자/수입판매업자 정보(유통 구조에 따라)"],
    watchouts: ["의약부외품/화장품 구분", "표현/효능 주장 제한"],
    ingredientsRedFlagExample: ["샘플: 특정 방부제/색소(예시)"]
  },
  EU: {
    version: "EU-Beauty-RulePack v0.3 (MVP sample)",
    focus: ["EU CPNP 등록 준비 체크(초안)", "라벨 필수요건(샘플)", "REACH/금지성분 1차 스캔(샘플)"],
    labelMust: ["INCI", "Nominal content", "PAO/Expiry", "Responsible Person", "Country of origin(if needed)", "Function", "Batch number", "Precautions"],
    watchouts: ["Responsible Person 지정", "Claims substantiation", "성분 제한 업데이트 가능"],
    ingredientsRedFlagExample: ["샘플: 특정 알레르겐(예시)"]
  }
} as const;

export type RulePackCountry = keyof typeof RULEPACKS;
