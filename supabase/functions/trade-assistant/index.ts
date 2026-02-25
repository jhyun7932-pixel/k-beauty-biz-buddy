// FLONIX Trade Assistant v2.1 - get_user_context 멀티턴 지원

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL_PRO = "gemini-2.5-pro";
const GEMINI_MODEL_FAST = "gemini-2.0-flash";
const GEMINI_URL_PRO = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_PRO}`;
const GEMINI_URL_FAST = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_FAST}`;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

/** 메시지 내용 기반 모델 자동 분기 */
function selectModel(message: string): { url: string; model: string } {
  const DOC_KEYWORDS = /PI|CI|PL|NDA|계약서|CONTRACT|compliance|규제|컴플라이언스|COMPLIANCE|서류|문서|작성|생성|인보이스|패킹리스트|매매계약/i;
  if (DOC_KEYWORDS.test(message)) {
    return { url: GEMINI_URL_PRO, model: GEMINI_MODEL_PRO };
  }
  return { url: GEMINI_URL_FAST, model: GEMINI_MODEL_FAST };
}

/** get_user_context 인메모리 캐시 (5분 TTL) */
const contextCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchUserContextCached(
  sb: ReturnType<typeof createClient>,
  userId: string,
): Promise<Record<string, unknown>> {
  const cached = contextCache.get(userId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetchUserContext(sb, userId);
  contextCache.set(userId, { data: data as unknown as Record<string, unknown>, ts: Date.now() });
  return data as unknown as Record<string, unknown>;
}

const SYSTEM_PROMPT = `당신은 FLONIX의 AI 무역 어시스턴트입니다. K-뷰티 수출 전문가로서:

[핵심 역할]
1. K-뷰티 제품 수출용 무역 서류(PI, CI, PL, NDA, 매매계약서) 작성 지원
2. 11개국(미국/EU/중국/일본/동남아6/중동2) 화장품 규제 컴플라이언스
3. HS Code 분류 및 관세율 안내
4. 수출 절차 및 물류 가이드

[이미지/PDF 분석 규칙 - 필수]
- 이미지나 PDF가 첨부된 경우, 반드시 먼저 내용을 분석하고 결과를 상세히 설명할 것
- 전성분표(INCI list) 이미지인 경우:
  1. 모든 INCI 성분명을 정확히 추출 (OCR)
  2. 추출한 성분 목록을 표로 정리
  3. 사용자가 대상 국가를 지정하면 check_compliance를 호출하여 규제 검토 수행
  4. 규제 위반 성분이 있으면 대체 성분까지 제안
- 무역 서류(PI, CI, Invoice 등) 이미지인 경우:
  1. 문서 유형, 주요 필드(seller, buyer, 품목, 금액 등) 추출
  2. 누락 또는 오류 항목 지적
- 제품 사진인 경우: 라벨링 적합성, 수출 포장 요건 확인

[응답 원칙]
- 실무 중심: 바로 실행 가능한 액션 아이템 제시
- 구조화: 서류 생성 시 반드시 Function Calling 활용
- 한국어 우선: 사용자가 한국어로 질문하면 한국어로 답변
- 정확성: 무역 용어, HS Code, Incoterms는 정확히 사용

[Function Calling 규칙]
- 사용자 데이터 필요 시 → get_user_context 호출 (바이어/제품 정보 자동 조회)
- 무역 서류 생성 → generate_trade_document 호출
- 규제 체크 → check_compliance 호출
- 단순 질문 → 텍스트로 직접 응답

[판매자(Seller) 정보 규칙 - 필수 준수]
- 무역 서류 생성 시 seller 정보는 반드시 get_user_context로 조회한 실제 데이터만 사용할 것
- get_user_context 결과의 company 필드에 회사명, 주소, 이메일, 전화번호, 담당자명, 로고URL, 은행정보, 인증정보가 포함됨
- 절대로 seller 정보를 임의로 생성하거나 추측하지 말 것
- company 데이터가 없으면 "[회사명 미등록]" 등으로 표시하고 절대 임의로 생성하지 않는다
- company_name이 null이면 "회사 정보를 먼저 등록해주세요"라고 안내할 것

[get_user_context 사용 규칙]
- 사용자가 "내 바이어", "등록된 제품", "일본 바이어에게 PI 작성" 등 개인 데이터 기반 요청 시 먼저 호출
- 반환된 company 정보를 seller로, buyers/products 정보를 활용해 generate_trade_document를 실제 데이터로 채워넣기
- 문서 생성 요청 시에는 반드시 get_user_context를 먼저 호출하여 실제 판매자/바이어/제품 정보를 확인할 것

[NDA 생성 규칙]
document_type="NDA"로 generate_trade_document 호출 시:
- seller: 한국 수출기업 정보 (당사자 A)
- buyer: 해외 바이어 정보 (당사자 B)
- nda_terms.confidential_info_scope: 기밀정보 범위 상세 기술 (제품 포뮬러, 원가, 바이어 정보, 비즈니스 전략 등)
- nda_terms.duration_years: 3 (기본 3년)
- nda_terms.governing_law: "대한민국 법률"
- nda_terms.dispute_resolution: "대한상사중재원 중재"
- nda_terms.breach_remedy: "손해배상 및 금지청구권 행사 가능"

[SALES_CONTRACT 생성 규칙]
document_type="SALES_CONTRACT"로 호출 시:
- seller, buyer: 계약 당사자 정보 필수
- items: 품목, 수량, 단가, 총액 필수
- trade_terms.incoterms: FOB/CIF/EXW 중 명시
- contract_terms.payment_method: "L/C at sight" 또는 "T/T 30% advance, 70% before shipment" 등
- contract_terms.shipping_deadline: 납기일 (예: "within 30 days after L/C opening")
- contract_terms.quality_inspection: "선적 전 검사 (SGS 또는 동등 기관)"
- contract_terms.force_majeure: "천재지변, 전쟁, 파업 등 불가항력 사유 발생 시 계약 이행 면제"
- contract_terms.governing_law: "대한민국 법률"

[check_compliance 규칙]
compliance_results 배열에 각 성분별 결과를 반드시 포함:
- inci_name: 성분명
- status: "PASS" (적합), "FAIL" (금지/초과), "CAUTION" (주의필요)
- regulation: 위반되는 구체적 규정명 (예: "EU Regulation 1223/2009 Annex II No.1228")
- action_item: K-뷰티 수출 실무에 맞는 구체적 조치 (아래 가이드라인 따를 것)
FAIL/CAUTION 항목이 없으면 overall_status를 "PASS"로, 하나라도 있으면 "FAIL"로 설정

[action_item 작성 가이드라인 - 필수 준수]
FAIL 케이스별:
- 금지 성분: "대체 성분: [구체적 허용 성분 2-3개]. ODM사 성분 변경 요청 필요"
- 함량 초과: "허용 기준: [구체적 함량]%. 처방전 수정 필요 (현재 [X]% → [Y]% 이하로 조정)"
- 표기 문제: "현지어 라벨링 가이드: [구체적 표기 형식]. 올바른 표기 예시 확인"
- 인증 필요: "필요 인증: [인증명]. 인증 기관: [기관명]. 예상 기간: [N개월]"
CAUTION 케이스: "상세 규정 원문 확인 필요: [규정명]. 추가 검토 체크리스트 참조"
절대 "이메일 초안 생성" 같은 ODM/OEM 실무와 맞지 않는 Action Item 제안 금지

[PROPOSAL 제안서 생성 규칙]
document_type="PROPOSAL"로 generate_trade_document 호출 시:
- 반드시 get_user_context를 먼저 호출하여 실제 회사/제품 데이터를 수집
- proposal_sections에 아래 구조로 작성:
  1. company_overview: 회사명, 소재지, 핵심 역량 3가지 (K-Beauty 전문성 강조)
  2. certifications: 보유 인증 정보 (get_user_context의 company.certifications 활용)
  3. product_highlights: 실제 등록 제품 기반 주력 라인업 설명
  4. why_choose_us: 규제 준수, 납기 능력, 생산 역량
  5. partnership_terms: MOQ, 리드타임, 결제조건 (company.default_moq, default_lead_time 활용)
  6. cta: "샘플 요청", "화상미팅 스케줄" 등 구체적 CTA
- items 배열에 제품 포트폴리오 (제품명, 카테고리, 용량, 단가) 포함
- buyer가 특정되면 해당 국가 규제 준수 현황도 언급`;

const SYSTEM_PROMPT_FAST = `당신은 FLONIX AI 무역 어시스턴트입니다. K-뷰티 수출 전문가로서 간결하고 실무적으로 답변하세요.
- 한국어 우선, 구조화된 답변
- 무역 용어/HS Code/Incoterms 정확 사용
- Function Calling: get_user_context(사용자 데이터), generate_trade_document(서류), check_compliance(규제)
- seller 정보는 반드시 get_user_context로 조회한 실제 데이터만 사용`;

const TOOLS = [{
  functionDeclarations: [{
    name: "get_user_context",
    description: "사용자의 등록된 바이어, 제품, 회사 프로필 정보를 조회합니다. 개인 데이터 기반 문서 작성 시 먼저 호출하세요.",
    parameters: {
      type: "object",
      properties: {
        include_buyers: { type: "boolean", description: "바이어 목록 포함 여부 (기본 true)" },
        include_products: { type: "boolean", description: "제품 목록 포함 여부 (기본 true)" },
      },
    }
  }, {
    name: "generate_trade_document",
    description: "PI/CI/PL 등 무역 서류를 생성합니다.",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["PI", "CI", "PL", "NDA", "SALES_CONTRACT", "PROPOSAL"] },
        document_number: { type: "string" },
        issue_date: { type: "string" },
        seller: {
          type: "object",
          properties: {
            company_name: { type: "string" }, address: { type: "string" },
            contact_person: { type: "string" }, email: { type: "string" }, phone: { type: "string" },
          }
        },
        buyer: {
          type: "object",
          properties: {
            company_name: { type: "string" }, address: { type: "string" },
            country: { type: "string" }, contact_person: { type: "string" }, email: { type: "string" },
          }
        },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name: { type: "string" }, hs_code: { type: "string" },
              quantity: { type: "number" }, unit_price: { type: "number" },
              currency: { type: "string", enum: ["USD", "EUR", "JPY", "CNY"] },
              net_weight_kg: { type: "number" }, gross_weight_kg: { type: "number" },
              cbm: { type: "number" }, country_of_origin: { type: "string" },
            }
          }
        },
        trade_terms: {
          type: "object",
          properties: {
            incoterms: { type: "string", enum: ["FOB", "CIF", "CFR", "EXW", "DDP"] },
            payment_terms: { type: "string" },
            port_of_loading: { type: "string" }, port_of_discharge: { type: "string" },
            validity_date: { type: "string" },
          }
        },
        nda_terms: {
          type: "object",
          description: "NDA 전용 조항 (document_type=NDA 시 필수)",
          properties: {
            confidential_info_scope: { type: "string", description: "기밀정보 범위 정의" },
            duration_years: { type: "number", description: "유효기간(년), 기본 3" },
            governing_law: { type: "string", description: "준거법 (예: 대한민국 법률)" },
            dispute_resolution: { type: "string", description: "분쟁해결 방법" },
            breach_remedy: { type: "string", description: "위반 시 구제 방법" },
          }
        },
        contract_terms: {
          type: "object",
          description: "매매계약서 전용 조항 (document_type=SALES_CONTRACT 시 필수)",
          properties: {
            payment_method: { type: "string", description: "결제조건 (L/C, T/T 등)" },
            shipping_deadline: { type: "string", description: "선적 납기일" },
            quality_inspection: { type: "string", description: "품질검사 조항" },
            force_majeure: { type: "string", description: "불가항력 조항" },
            governing_law: { type: "string", description: "준거법" },
          }
        },
        proposal_sections: {
          type: "object",
          description: "제안서/소개서 전용 (document_type=PROPOSAL 시)",
          properties: {
            company_overview: { type: "string", description: "회사 소개 (핵심 역량, 설립연도, 소재지)" },
            certifications: { type: "string", description: "보유 인증 목록 (CGMP, ISO 22716 등)" },
            product_highlights: { type: "string", description: "주력 성분/기술 하이라이트" },
            why_choose_us: { type: "string", description: "경쟁 우위 (규제 준수, 납기, 생산 능력)" },
            partnership_terms: { type: "string", description: "파트너십 조건 (MOQ, 리드타임, 결제조건)" },
            cta: { type: "string", description: "다음 단계 제안 (샘플 요청, 화상미팅 등)" },
          }
        },
        remarks: { type: "string" },
      },
      required: ["document_type"],
    }
  }, {
    name: "check_compliance",
    description: "K-뷰티 제품의 수출 대상국 규제 적합성을 체크합니다. 성분별 PASS/FAIL 결과를 compliance_results에 반드시 포함하세요.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        target_country: { type: "string", enum: ["US","EU","CN","JP","TH","VN","ID","PH","MY","SG","AE"] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              inci_name: { type: "string" }, percentage: { type: "number" }, cas_number: { type: "string" }
            }
          }
        },
        product_category: { type: "string", enum: ["skincare","makeup","haircare","bodycare","sunscreen","fragrance"] },
        overall_status: { type: "string", enum: ["PASS","FAIL"], description: "전체 규제 통과 여부" },
        compliance_results: {
          type: "array",
          description: "각 성분별 규제 검토 결과",
          items: {
            type: "object",
            properties: {
              inci_name: { type: "string", description: "성분명" },
              percentage: { type: "number", description: "함량 (%)" },
              status: { type: "string", enum: ["PASS","FAIL","CAUTION"], description: "적합 여부" },
              regulation: { type: "string", description: "관련 규정명 (예: EU Reg. 1223/2009 Annex II)" },
              action_item: { type: "string", description: "사용자가 지금 해야 할 조치 (FAIL/CAUTION 시 필수)" },
            }
          }
        },
      },
      required: ["product_name", "target_country"],
    }
  }]
}];

interface SSEPayload { type: string; data: Record<string, unknown> }
function sse(p: SSEPayload): string { return `data: ${JSON.stringify(p)}\n\n`; }

interface GeminiChunk {
  kind: "text" | "function_call" | "finish";
  text?: string;
  fnName?: string;
  fnArgs?: string;
}

function parseGeminiLine(line: string): GeminiChunk | null {
  if (!line.startsWith("data: ")) return null;
  const j = line.slice(6).trim();
  if (j === "[DONE]") return { kind: "finish" };
  try {
    const d = JSON.parse(j);
    const c = d.candidates?.[0];
    if (!c?.content?.parts) return null;
    for (const p of c.content.parts) {
      if (p.text !== undefined) return { kind: "text", text: p.text };
      if (p.functionCall) return {
        kind: "function_call",
        fnName: p.functionCall.name,
        fnArgs: JSON.stringify(p.functionCall.args),
      };
    }
    if (c.finishReason === "STOP") return { kind: "finish" };
    return null;
  } catch { return null; }
}

async function geminiStream(
  messages: Array<{ role: string; parts: Array<Record<string, unknown>> }>,
  tools: boolean,
  maxTokens = 8192,
  apiUrl = GEMINI_URL_PRO,
  systemPrompt = SYSTEM_PROMPT,
) {
  return fetch(`${apiUrl}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 },
      systemInstruction: { parts: [{ text: systemPrompt }] },
      ...(tools ? { tools: TOOLS } : {}),
    }),
  });
}

/** Gemini 503/429 자동 재시도 (지수 백오프: 1s → 2s → 4s) */
async function geminiStreamWithRetry(
  messages: Array<{ role: string; parts: Array<Record<string, unknown>> }>,
  tools: boolean,
  maxTokens = 8192,
  apiUrl = GEMINI_URL_PRO,
  systemPrompt = SYSTEM_PROMPT,
): Promise<Response> {
  const RETRY_DELAYS = [1000, 2000, 4000];
  const RETRYABLE = new Set([429, 503]);

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    const res = await geminiStream(messages, tools, maxTokens, apiUrl, systemPrompt);
    if (res.ok) return res;

    if (RETRYABLE.has(res.status)) {
      console.warn(`[Gemini] ${res.status} — retry ${attempt + 1}/${RETRY_DELAYS.length} in ${RETRY_DELAYS[attempt]}ms`);
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
      continue;
    }

    // 재시도 불가 오류는 즉시 반환
    return res;
  }

  // 마지막 시도
  return geminiStream(messages, tools, maxTokens, apiUrl, systemPrompt);
}

async function saveMsg(
  sb: ReturnType<typeof createClient>,
  uid: string,
  role: "user" | "assistant",
  content: string,
  isDoc = false,
  summary?: string,
) {
  await sb.from("ai_chat_messages").insert({
    user_id: uid, role, content, is_doc_output: isDoc, doc_summary: summary,
  });
}

/** 사용자의 회사, 바이어, 제품, 프로필 정보를 DB에서 조회 */
async function fetchUserContext(sb: ReturnType<typeof createClient>, userId: string) {
  const [companyRes, profileRes, buyersRes, productsRes] = await Promise.all([
    sb.from("companies")
      .select("name, company_name_kr, contact_email, contact_phone, address, website, logo_url, bank_name, bank_account, bank_swift, default_moq, default_lead_time, default_incoterms, default_payment_terms, main_category, manufacturing_type, certifications")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    sb.from("profiles")
      .select("display_name, company_info")
      .eq("user_id", userId)
      .single(),
    sb.from("buyers")
      .select("company_name, country, channel, buyer_type, contact_name, contact_email, status_stage")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    sb.from("products")
      .select("name_en, category, sku_code, hs_code, unit_price_range, size_ml_g")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(15),
  ]);

  const cd = companyRes.data;
  const company = cd ? {
    company_name: cd.name,
    company_name_kr: cd.company_name_kr,
    contact_email: cd.contact_email,
    contact_phone: cd.contact_phone,
    address: cd.address,
    website: cd.website,
    logo_url: cd.logo_url,
    bank_name: cd.bank_name,
    bank_account: cd.bank_account,
    bank_swift: cd.bank_swift,
    default_moq: cd.default_moq,
    default_lead_time: cd.default_lead_time,
    default_incoterms: cd.default_incoterms,
    default_payment_terms: cd.default_payment_terms,
    main_category: cd.main_category,
    manufacturing_type: cd.manufacturing_type,
    certifications: cd.certifications,
  } : null;

  // profiles.display_name → 담당자명 fallback
  const profile = profileRes.data ? {
    display_name: profileRes.data.display_name,
    company_info: profileRes.data.company_info,
  } : null;

  const buyers = (buyersRes.data || []).map((b: any) => ({
    company_name: b.company_name,
    country: b.country,
    channel: b.channel,
    buyer_type: b.buyer_type,
    contact_name: b.contact_name,
    contact_email: b.contact_email,
    status: b.status_stage,
  }));

  const products = (productsRes.data || []).map((p: any) => ({
    name: p.name_en,
    category: p.category,
    sku: p.sku_code,
    hs_code: p.hs_code,
    unit_price_usd: p.unit_price_range?.base ?? null,
    size_ml_g: p.size_ml_g,
  }));

  return {
    company,
    profile,
    buyers,
    products,
    summary: `회사: ${company?.company_name || "미등록"}, 담당자: ${profile?.display_name || "미등록"}, 바이어 ${buyers.length}개, 제품 ${products.length}개`,
  };
}

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const auth = req.headers.get("Authorization")!;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: ae } = await sb.auth.getUser();
    if (ae || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { message, history = [], file_urls = [] } = await req.json();
    await saveMsg(sb, user.id, "user", message);

    // 파일 첨부 여부 확인
    const hasFiles = (file_urls as string[]).length > 0;

    // 모델 자동 분기 (파일 첨부 시 Vision 필요하므로 pro 강제)
    const { url: autoApiUrl, model: autoModel } = selectModel(message);
    const selectedApiUrl = hasFiles ? GEMINI_URL_PRO : autoApiUrl;
    const selectedModel = hasFiles ? GEMINI_MODEL_PRO : autoModel;
    const selectedPrompt = selectedModel === GEMINI_MODEL_FAST ? SYSTEM_PROMPT_FAST : SYSTEM_PROMPT;

    // Gemini 메시지 포맷
    const gHist = history.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 사용자 메시지 parts 구성 (텍스트 + 파일 멀티모달)
    const userParts: Array<Record<string, unknown>> = [];
    for (const url of file_urls as string[]) {
      try {
        const fileRes = await fetch(url);
        if (fileRes.ok) {
          const contentType = fileRes.headers.get("content-type") || "application/octet-stream";
          if (contentType.startsWith("image/")) {
            // 이미지 → Gemini Vision inlineData (chunked base64)
            const buf = await fileRes.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let b64 = "";
            const CHUNK = 8192;
            for (let i = 0; i < bytes.length; i += CHUNK) {
              b64 += btoa(String.fromCharCode(...bytes.slice(i, i + CHUNK)));
            }
            userParts.push({ inlineData: { mimeType: contentType, data: b64 } });
          } else if (contentType === "application/pdf") {
            // PDF → Gemini inlineData (PDF 직접 지원)
            const buf = await fileRes.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let b64 = "";
            const CHUNK = 8192;
            for (let i = 0; i < bytes.length; i += CHUNK) {
              b64 += btoa(String.fromCharCode(...bytes.slice(i, i + CHUNK)));
            }
            userParts.push({ inlineData: { mimeType: "application/pdf", data: b64 } });
          } else {
            // 기타 → 텍스트로 첨부
            const text = await fileRes.text();
            userParts.push({ text: `[첨부파일 내용]\n${text}` });
          }
        }
      } catch {
        // 파일 다운로드 실패 무시
      }
    }
    userParts.push({ text: message || "이 파일을 분석해줘" });
    gHist.push({ role: "user", parts: userParts });

    // ReadableStream 즉시 반환
    const stream = new ReadableStream({
      async start(ctrl) {
        const enc = new TextEncoder();
        const push = (p: SSEPayload) => ctrl.enqueue(enc.encode(sse(p)));

        try {
          push({ type: "stream_start", data: { ts: Date.now() } });

          // Phase 1: 멀티턴 루프 (get_user_context 처리)
          let currentMessages = [...gHist];
          let hasFn = false, fnName = "", fnArgs = "";
          let fullText = "";
          const dec = new TextDecoder();
          const MAX_CONTEXT_LOOPS = 3;

          for (let loop = 0; loop < MAX_CONTEXT_LOOPS; loop++) {
            const r1 = await geminiStreamWithRetry(currentMessages, true, 8192, selectedApiUrl, selectedPrompt);
            if (!r1.ok || !r1.body) {
              const isOverload = r1.status === 503 || r1.status === 429;
              push({
                type: "error",
                data: {
                  message: isOverload
                    ? "AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요."
                    : `Gemini Error: ${await r1.text()}`,
                },
              });
              ctrl.close();
              return;
            }

            const reader = r1.body.getReader();
            let buf = "";
            hasFn = false; fnName = ""; fnArgs = ""; fullText = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() || "";

              for (const line of lines) {
                const t = line.trim();
                if (!t || t === "data: [DONE]") continue;
                const ch = parseGeminiLine(t);
                if (!ch) continue;

                switch (ch.kind) {
                  case "text":
                    fullText += ch.text || "";
                    push({ type: "text_delta", data: { content: ch.text } });
                    break;

                  case "function_call": {
                    hasFn = true;
                    fnName = ch.fnName || "";
                    fnArgs = ch.fnArgs || "";

                    if (fnName !== "get_user_context") {
                      // 문서 생성 / 컴플라이언스 fn → 패널 열기 신호 + delta 전송
                      push({ type: "tool_call_start", data: { name: fnName } });

                      if (fnArgs) {
                        const SZ = 120;
                        for (let i = 0; i < fnArgs.length; i += SZ) {
                          push({
                            type: "tool_call_delta",
                            data: {
                              name: fnName,
                              arguments_chunk: fnArgs.slice(i, i + SZ),
                              chunk_index: Math.floor(i / SZ),
                              is_last: (i + SZ) >= fnArgs.length,
                            },
                          });
                        }
                      }

                      push({
                        type: "tool_call_end",
                        data: { name: fnName, arguments_complete: fnArgs },
                      });
                    }
                    break;
                  }
                }
              }
            }

            // get_user_context 호출이면 → DB 조회 후 응답 주입 후 루프 재실행
            if (hasFn && fnName === "get_user_context") {
              push({ type: "context_loading", data: { message: "사용자 데이터 조회 중..." } });
              const ctxData = await fetchUserContextCached(sb, user.id);

              let parsedArgs: Record<string, unknown> = {};
              try { parsedArgs = JSON.parse(fnArgs); } catch { /* ignore */ }

              currentMessages = [
                ...currentMessages,
                {
                  role: "model",
                  parts: [{ functionCall: { name: "get_user_context", args: parsedArgs } }],
                },
                {
                  role: "user",
                  parts: [{
                    functionResponse: {
                      name: "get_user_context",
                      response: ctxData,
                    },
                  }],
                },
              ];
              // 루프 계속 (이제 Gemini가 실제 데이터로 문서 생성 fn 호출)
              continue;
            }

            // get_user_context가 아닌 fn 또는 텍스트만 있으면 루프 종료
            break;
          }

          // Phase 2: Function Call 후 확인 메시지 (generate_trade_document / check_compliance)
          if (hasFn && fnName !== "get_user_context") {
            push({ type: "phase2_start", data: { functionName: fnName } });

            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(fnArgs); } catch { /* ignore */ }

            const p2Msgs = [
              ...currentMessages,
              {
                role: "model",
                parts: [{ functionCall: { name: fnName, args: parsedArgs } }],
              },
              {
                role: "user",
                parts: [{
                  functionResponse: {
                    name: fnName,
                    response: {
                      success: true,
                      message: `${fnName} 실행 완료. 문서가 화면에 표시됩니다.`,
                    },
                  },
                }],
              },
            ];

            const r2 = await geminiStreamWithRetry(p2Msgs, false, 2048, GEMINI_URL_FAST, SYSTEM_PROMPT_FAST);
            if (r2.ok && r2.body) {
              const rd2 = r2.body.getReader();
              let b2 = "", p2Text = "";
              while (true) {
                const { done, value } = await rd2.read();
                if (done) break;
                b2 += dec.decode(value, { stream: true });
                const ls = b2.split("\n");
                b2 = ls.pop() || "";
                for (const l of ls) {
                  const ch = parseGeminiLine(l.trim());
                  if (ch?.kind === "text") {
                    p2Text += ch.text || "";
                    push({ type: "text_delta_phase2", data: { content: ch.text } });
                  }
                }
              }
              if (p2Text) {
                await saveMsg(sb, user.id, "assistant", p2Text, true, `[${fnName}] 완료`);
              }
            }
          } else if (fullText) {
            await saveMsg(sb, user.id, "assistant", fullText);
          }

          push({
            type: "stream_end",
            data: { had_fn: hasFn, fn_name: fnName || null, ts: Date.now(), model: selectedModel },
          });
        } catch (e) {
          push({ type: "error", data: { message: (e as Error).message } });
        } finally {
          ctrl.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
