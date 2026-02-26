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

/** 문서번호 자동 생성: TYPE-YYYYMMDD-NNN */
function generateDocumentNumber(docType: string): string {
  const prefix = docType === "PROPOSAL" ? "PROP" : docType;
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 900) + 100); // 100-999
  return `${prefix}-${ymd}-${seq}`;
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

const SYSTEM_PROMPT = `You are FLONIX AI, a specialized trade assistant for K-Beauty export operations.
You assist Korean beauty SMEs with international trade documentation, compliance, and logistics.

=== CRITICAL RULES (MUST FOLLOW ALWAYS) ===

RULE 1 - DATA USAGE:
- ALWAYS call get_user_context tool FIRST before generating any document.
- If seller is null or seller.company_name is null: respond in Korean asking user to save company info in Settings page first. Do NOT generate the document.
- NEVER fabricate seller information. Use ONLY exact data from get_user_context.
- Buyers and products: match by name from context data.

RULE 2 - DOCUMENT GENERATION:
- All documents use auto-generated document numbers (TYPE-YYYYMMDD-NNN).
- Country of Origin is always "Republic of Korea".
- Currency is always "USD" unless buyer specifies otherwise.
- All trade terms use Incoterms 2020.

RULE 3 - LANGUAGE:
- Respond to user in Korean.
- All trade documents (PI/CI/PL/NDA) must be written in English.
- Email drafts: English body, subject in English.

RULE 4 - RESPONSE FORMAT:
- After generating a document, call generate_trade_document tool with the complete structured data.
- Do not show raw JSON or markdown tables in chat. Use generate_trade_document tool for all documents.
- Keep chat responses concise. Let the document panel show the details.

RULE 5 - IMAGE/PDF ANALYSIS:
- When image/PDF is attached, analyze content first and explain results in detail.
- INCI list image: extract all ingredient names, present in table, call check_compliance if target country specified.
- Trade document image: identify type, extract key fields, point out missing/errors.

RULE 6 - COMPLIANCE:
- compliance_results must include per-ingredient results with inci_name, status(PASS/FAIL/CAUTION), regulation, action_item.
- FAIL action_items: suggest specific alternative ingredients, dosage limits, labeling fixes, or certifications needed.
- Never suggest irrelevant actions like "draft an email" for compliance issues.`;

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
    description: "Generate a trade document. type: PI|CI|PL|EMAIL|NDA|SALES_CONTRACT|PROPOSAL. PI must include: doc number, seller/buyer blocks, items table with HS Code + Country of Origin, payment terms, incoterms, banking info, T&C (4 clauses), signature block. CI adds: B/L No, certification statement ('We certify this invoice is true and correct'), net/gross weights, amount in words. PL adds: carton details, N.W./G.W. per item, CBM, shipping mark, cargo summary box. NDA: confidential_info_scope, duration, governing law, dispute resolution. SALES_CONTRACT: payment_method, shipping_deadline, quality_inspection, force_majeure. PROPOSAL: company_overview, certifications, product_highlights, why_choose_us, partnership_terms, cta. EMAIL: professional B2B format with subject, Dear/Regards, CTA with deadline, seller.email_signature at bottom.",
    parameters: {
      type: "object",
      properties: {
        document_type: { type: "string", enum: ["PI", "CI", "PL", "NDA", "SALES_CONTRACT", "PROPOSAL"] },
        document_number: { type: "string" },
        issue_date: { type: "string" },
        seller: {
          type: "object",
          properties: {
            company_name: { type: "string" }, company_name_ko: { type: "string" },
            representative: { type: "string" }, address: { type: "string" },
            contact_name: { type: "string" }, contact_title: { type: "string" },
            email: { type: "string" }, phone: { type: "string" },
            bank_name: { type: "string" }, bank_account: { type: "string" }, bank_swift: { type: "string" },
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

/** base64 접두사 방어 제거 (data:...;base64, 프리픽스 이중 방어) */
const cleanBase64 = (base64String: string): string => {
  if (base64String.includes(',')) {
    return base64String.split(',')[1];
  }
  return base64String;
};

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
  // companies, profiles, buyers, products 동시 조회
  // profiles PK는 id(uuid)이지만 user_id 컬럼으로도 조회 가능
  const [companyRes, profileRes, buyersRes, productsRes] = await Promise.all([
    sb.from("companies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    sb.from("buyers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15),
    sb.from("products")
      .select("*")
      .eq("user_id", userId)
      .limit(15),
  ]);

  const cd = companyRes.data;
  const pf = profileRes.data;
  const ci = (pf?.company_info && typeof pf.company_info === "object") ? pf.company_info as Record<string, unknown> : {};

  // companies 새 컬럼 우선 → 기존 컬럼 → profiles.company_info fallback
  const seller = {
    company_name: cd?.company_name || cd?.name || ci.company_name as string || null,
    company_name_ko: cd?.company_name_ko || cd?.company_name_kr || ci.company_name_ko as string || null,
    representative: cd?.representative || ci.ceo_name as string || pf?.display_name || null,
    contact_name: cd?.contact_name || ci.contact_name as string || pf?.display_name || null,
    contact_title: cd?.contact_title || ci.contact_title as string || null,
    contact_email: cd?.contact_email || ci.contact_email as string || null,
    contact_phone: cd?.contact_phone || ci.contact_phone as string || null,
    address: cd?.address || ci.address as string || null,
    website: cd?.website || ci.website as string || null,
    logo_url: cd?.logo_url || null,
    seal_url: cd?.seal_url || null,
    signature_url: cd?.signature_url || null,
    bank_name: cd?.bank_name || null,
    bank_account: cd?.bank_account || null,
    bank_swift: cd?.bank_swift || null,
    default_moq: cd?.default_moq || 500,
    default_lead_time: cd?.default_lead_time || 20,
    default_incoterms: cd?.default_incoterms || "FOB",
    default_payment_terms: cd?.default_payment_terms || "T/T 30/70",
    certifications: cd?.certifications || [],
    export_countries: cd?.export_countries || ci.export_countries as string[] || [],
    email_signature: cd?.email_signature || ci.email_signature as string || null,
  };

  const buyers = (buyersRes.data || []).map((b: Record<string, unknown>) => ({
    company_name: b.company_name,
    country: b.country,
    channel: b.channel || b.channel_type,
    buyer_type: b.buyer_type,
    contact_name: b.contact_name,
    contact_email: b.contact_email,
    status: b.status_stage,
  }));

  // products: product_name_en이 실제 컬럼명, status 필터 제거 (draft도 포함)
  const products = (productsRes.data || []).map((p: Record<string, unknown>) => ({
    name: p.product_name_en || p.name,
    name_kr: p.product_name_kr,
    category: p.category,
    sku: p.sku_code,
    hs_code: p.hs_code_candidate,
    unit_price_range: p.unit_price_range,
    size_ml_g: p.size_ml_g,
    moq: p.moq,
    status: p.status,
  }));

  const sellerName = seller.company_name || "회사명 미등록";
  const contactName = seller.contact_name || "담당자 미등록";

  return {
    seller,
    buyers,
    products,
    summary: `셀러: ${sellerName}, 담당자: ${contactName}, 바이어 ${buyers.length}건, 제품 ${products.length}건`,
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
          if (contentType.startsWith("image/") || contentType === "application/pdf") {
            // 이미지/PDF → Gemini Vision inlineData (chunked base64 + 방어 클리닝)
            const buf = await fileRes.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let b64 = "";
            const CHUNK = 8192;
            for (let i = 0; i < bytes.length; i += CHUNK) {
              b64 += btoa(String.fromCharCode(...bytes.slice(i, i + CHUNK)));
            }
            const mime = contentType.startsWith("image/") ? contentType : "application/pdf";
            userParts.push({ inlineData: { mimeType: mime, data: cleanBase64(b64) } });
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
              const errText = await r1.text().catch(() => "");
              let userMessage: string;
              let errCode = String(r1.status);

              if (r1.status === 503 || r1.status === 429) {
                userMessage = "AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.";
              } else if (r1.status === 400 && (errText.includes("INVALID_ARGUMENT") || errText.includes("token"))) {
                userMessage = "요청 처리 중 오류가 발생했습니다. 메시지를 짧게 나눠서 다시 시도해주세요.";
                errCode = "TOKEN_LIMIT";
              } else if (r1.status === 400 && (errText.includes("base64") || errText.includes("decode"))) {
                userMessage = "파일 처리 중 오류가 발생했습니다. JPG/PNG/PDF 파일을 다시 업로드해주세요.";
                errCode = "BASE64_ERROR";
              } else {
                userMessage = `AI 서비스 일시적 오류입니다. 잠시 후 다시 시도해주세요. (오류코드: ${r1.status})`;
              }

              push({
                type: "error",
                data: { error: true, message: userMessage, code: errCode },
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
            let parsedArgs: Record<string, unknown> = {};
            try { parsedArgs = JSON.parse(fnArgs); } catch { /* ignore */ }

            // 문서번호 자동 보완 (AI가 누락 시)
            if (fnName === "generate_trade_document" && !parsedArgs.document_number) {
              const dt = (parsedArgs.document_type as string) || "PI";
              parsedArgs.document_number = generateDocumentNumber(dt);
            }

            push({ type: "phase2_start", data: { functionName: fnName } });

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
          const errMsg = (e as Error).message || "";
          let userMessage: string;
          let errCode = "INTERNAL";

          if (errMsg.includes("token") || errMsg.includes("INVALID_ARGUMENT")) {
            userMessage = "요청 처리 중 오류가 발생했습니다. 메시지를 짧게 나눠서 다시 시도해주세요.";
            errCode = "TOKEN_LIMIT";
          } else if (errMsg.includes("base64") || errMsg.includes("decode")) {
            userMessage = "파일 처리 중 오류가 발생했습니다. JPG/PNG/PDF 파일을 다시 업로드해주세요.";
            errCode = "BASE64_ERROR";
          } else {
            userMessage = `AI 서비스 일시적 오류입니다. 잠시 후 다시 시도해주세요. (오류코드: ${errCode})`;
          }
          console.error("[trade-assistant] Stream error:", errMsg);
          push({ type: "error", data: { error: true, message: userMessage, code: errCode } });
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
    console.error("[trade-assistant] Top-level error:", (e as Error).message);
    return new Response(
      JSON.stringify({
        error: true,
        message: "AI 서비스 일시적 오류입니다. 잠시 후 다시 시도해주세요.",
        code: "INTERNAL",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }
});
