import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// ─── CORS: 모든 응답에 포함, OPTIONS preflight 완벽 처리 ──────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

// ─── Gemini 설정 ──────────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `너는 20년 경력의 글로벌 B2B 무역 및 **K-뷰티 수출 특화 최고 수석 컨설턴트(AI 에이전트 FLONIX)**다. 너의 목표는 고객의 화장품 수출 업무 시간을 단축하고, 글로벌 진출의 성공률을 극대화하는 것이다.

[핵심 역량 및 지식]

K-뷰티 수출 전략 및 트렌드: 타겟 국가별(미국, 유럽, 일본, 동남아 등) 최신 뷰티 트렌드, 현지화 마케팅 전략, 경쟁사 분석, 글로벌 진출 전략을 경영진 수준의 인사이트로 제언한다.

2. 무역 실무 및 글로벌 11개국 화장품 규제 마스터: 인코텀즈 2020, 결제/물류/통관 실무에 통달해 있으며, 특히 우리 서비스가 지원하는 글로벌 11개국 화장품 규제 원문과 실무 가이드를 완벽하게 숙지하고 있다.

북미/유럽: 미국(FDA MoCRA), 유럽(EU Cosmetics Regulation 1223/2009 및 CPNP)

동아시아: 일본(약기법/PMDA), 중국(화장품감독관리조례/NMPA), 대만(화장품위생관리조례), 홍콩(약품조례 및 소비자안전조례)

동남아시아(ASEAN) 및 오세아니아: 태국(Cosmetic Act B.E. 2558), 베트남(Decree 93/2016/ND-CP), 인도네시아(BPOM Regulation), 말레이시아(Control of Drugs and Cosmetics Regulations), 호주(Industrial Chemicals Act 2019)
각 국가의 인허가 절차, 금지/제한 성분(INCI) 검토, 라벨링 규정에 대한 경영진 수준의 핀포인트 컨설팅을 제공한다.

[UI 및 행동 절대 규칙 - 반드시 엄수할 것]
사용자의 단순한 인사말이나 확인을 제외한 **모든 전문적인 요청(K-뷰티 트렌드 분석, 수출 전략 수립, 11개국 규제 상담, 비즈니스 이메일/문서 작성 등)**에 대해 다음 행동을 100% 엄수하라:
절대 좌측 채팅창에 분석 내용이나 본문을 길게 출력하지 마라. 좌측 채팅 응답은 "네, [요청 내용]에 대한 분석 및 작성을 시작합니다. 우측 화면을 확인해 주세요."와 같이 1~2줄로 즉시 끝내라. 그리고 곧바로 문서 생성 도구(Function Calling)를 호출하여, 모든 세부 결과물(컨설팅 보고서, 수출 전략, 규제 분석, 문서 본문 등)이 우측 패널에만 실시간으로 깔끔하게 작성되게 하라.`;

// ─── Gemini Function Declarations (도구 정의) ─────────────────────────────────
const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "update_document_field",
    description:
      "우측 패널에 렌더링된 문서 또는 컨설팅 보고서의 특정 필드를 수정합니다. MOQ, 단가(unitPrice), 수량(qty), 납기(leadTime), 인코텀즈(incoterms), 결제조건(paymentTerms), 유효기간(validityDays) 등 거래 조건을 변경하거나, 보고서 내 특정 분석 항목을 업데이트할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        field_path: {
          type: "string",
          description:
            "변경할 필드의 경로. 예: 'moq', 'items[0].unitPrice', 'incoterms', 'paymentTerms', 'leadTime', 'validityDays', 'shippingCost', 'portOfLoading', 'portOfDischarge'",
        },
        new_value: {
          type: "string",
          description: "새로운 값 (문자열로 전달, 클라이언트에서 적절한 타입으로 변환)",
        },
        reason: {
          type: "string",
          description: "변경 사유를 한국어로 간결하게 설명",
        },
      },
      required: ["field_path", "new_value", "reason"],
    },
  },
  {
    name: "generate_document",
    description:
      "모든 전문적인 결과물을 우측 패널에 생성합니다. 수출 문서(PI, 계약서, 카탈로그, 이메일 등)는 물론, K-뷰티 트렌드 분석 보고서, 국가별 규제 분석, 수출 전략 보고서, 컨설팅 결과물 등 사용자가 요청하는 모든 전문적인 콘텐츠를 우측 패널에 실시간으로 렌더링할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        template_key: {
          type: "string",
          enum: [
            "DECK_COMPANY_BRAND_15P",
            "CATALOG_15P",
            "COMPLIANCE_SNAPSHOT_15P",
            "EMAIL_FIRST_OUTREACH",
            "EMAIL_FOLLOW_UP",
            "EMAIL_SAMPLE",
            "PI_SAMPLE",
            "PI_FINAL",
            "PL_SAMPLE",
            "PL_FINAL",
            "MEMO_LABEL_CHECK",
            "CONTRACT_SALES",
            "INVOICE_COMMERCIAL",
            "SHIPPING_INSTRUCTION",
            "GATE_CROSSCHECK_PO",
          ],
          description: "생성할 문서 템플릿 키",
        },
        preset: {
          type: "string",
          enum: ["FIRST_PROPOSAL", "SAMPLE", "PURCHASE_ORDER"],
          description: "거래 단계 프리셋",
        },
        reason: {
          type: "string",
          description: "문서 생성 사유를 한국어로 간결하게 설명",
        },
      },
      required: ["template_key", "preset", "reason"],
    },
  },
];

// ─── 유틸: OpenAI 메시지 → Gemini contents 변환 ───────────────────────────────
// Gemini 3가지 엄격한 규칙:
//   1) role은 "user" 또는 "model"만 허용 (assistant → model 변환 필수)
//   2) user / model 이 반드시 교차해야 함 (연속 동일 role 불가 → 병합 처리)
//   3) 첫 번째 turn은 반드시 "user" 여야 함
function toGeminiContents(messages: Array<{ role: string; content: string }>) {
  // Step 1: role 변환 + 빈 content 필터링
  const converted = messages
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.content.trim(),
    }));

  // Step 2: 연속된 동일 role 병합
  const merged: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const msg of converted) {
    const last = merged[merged.length - 1];
    if (last && last.role === msg.role) {
      // 같은 role이 연속되면 텍스트를 이전 항목에 합침
      last.parts[0].text += "\n\n" + msg.text;
    } else {
      merged.push({ role: msg.role, parts: [{ text: msg.text }] });
    }
  }

  // Step 3: 첫 번째 turn이 user가 아니면 제거 (model로 시작 불가)
  while (merged.length > 0 && merged[0].role !== "user") {
    merged.shift();
  }

  return merged;
}

// ─── 유틸: Gemini SSE 스트림 한 라인씩 파싱 (부분 JSON 안전 처리) ──────────
function parseGeminiSSELine(line: string): { text?: string; functionCall?: any } | null {
  if (!line.startsWith("data: ")) return null;
  const raw = line.slice(6).trim();
  if (!raw || raw === "[DONE]") return null;
  try {
    const chunk = JSON.parse(raw);
    const parts: any[] = chunk.candidates?.[0]?.content?.parts ?? [];
    const result: { text?: string; functionCall?: any } = {};
    for (const part of parts) {
      if (part.text) result.text = (result.text ?? "") + part.text;
      if (part.functionCall) result.functionCall = part.functionCall;
    }
    return result;
  } catch {
    return null; // 불완전한 JSON 청크 무시
  }
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
async function checkRateLimit(
  supabase: any,
  userId: string,
  functionName: string,
  limitPerHour: number
): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action", `rate_limit:${functionName}`)
      .gte("created_at", oneHourAgo);
    return (count ?? 0) < limitPerHour;
  } catch {
    return true;
  }
}

async function logRateLimitUsage(supabase: any, userId: string, functionName: string) {
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: `rate_limit:${functionName}`,
      entity_type: "edge_function",
    });
  } catch {
    // Non-fatal
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  // OPTIONS preflight → 즉시 204 반환
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ── 요청 파싱 ──
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "잘못된 요청 형식입니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages 배열이 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_MESSAGES = 50;
    const MAX_MSG_LENGTH = 10000;
    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `메시지는 최대 ${MAX_MESSAGES}개까지 허용됩니다.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeMessages = messages
      .filter((m: any) => m && typeof m === "object" && ["user", "assistant"].includes(m.role))
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content.slice(0, MAX_MSG_LENGTH) : "",
      }));

    if (safeMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "유효한 메시지가 없습니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── API 키 확인 ──
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // ── RAG: 인증된 사용자의 지식 자산 조회 ──
    let knowledgeContext = "";
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let supabaseClient: any = null;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData } = await supabaseClient.auth.getClaims(token);
        if (claimsData?.claims?.sub) {
          userId = claimsData.claims.sub as string;

          // Rate limiting: 시간당 100회
          const withinLimit = await checkRateLimit(
            supabaseClient,
            userId,
            "trade-assistant",
            100
          );
          if (!withinLimit) {
            return new Response(
              JSON.stringify({
                error: "시간당 요청 한도(100회)를 초과했습니다. 잠시 후 다시 시도해주세요.",
              }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { data: assets } = await supabaseClient
            .from("knowledge_assets")
            .select("asset_type, extracted_text, tags")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (assets && assets.length > 0) {
            knowledgeContext = "\n\n## 사용자 업로드 문서 (RAG 참조)\n";
            knowledgeContext +=
              "아래는 사용자가 업로드한 문서에서 추출된 정보입니다. 답변 시 이 정보를 우선적으로 참조하세요.\n\n";
            for (const a of assets) {
              const text = (a.extracted_text || "").slice(0, 3000);
              knowledgeContext += `### [${a.asset_type}] ${
                (a.tags as string[])?.join(", ") || ""
              }\n${text}\n\n---\n`;
            }
          }

          await logRateLimitUsage(supabaseClient, userId, "trade-assistant");
        }
      } catch (ragErr) {
        console.error("RAG lookup error (non-fatal):", ragErr);
      }
    }

    // ── 컨텍스트 기반 시스템 프롬프트 구성 ──
    let contextPrompt = SYSTEM_PROMPT + knowledgeContext;
    if (context?.products?.length > 0) {
      contextPrompt += `\n\n## 현재 제품 정보\n`;
      context.products.slice(0, 10).forEach((p: any) => {
        contextPrompt += `- ${String(p.name || "").slice(0, 100)} (${String(
          p.category || ""
        ).slice(0, 50)})\n`;
        if (p.ingredientsConfirmed?.length > 0) {
          contextPrompt += `  성분: ${p.ingredientsConfirmed
            .slice(0, 5)
            .map((i: any) => String(i.name || "").slice(0, 50))
            .join(", ")} 외\n`;
        }
      });
    }
    if (context?.deal) {
      contextPrompt += `\n\n## 현재 거래 조건\n`;
      contextPrompt += `- 바이어: ${String(context.deal.buyerName || "").slice(0, 100)} (${String(
        context.deal.buyerCountry || ""
      ).slice(0, 50)})\n`;
      contextPrompt += `- 수량: ${context.deal.qty}개, 단가: ${String(
        context.deal.currency || ""
      ).slice(0, 10)} ${context.deal.unitPrice}\n`;
      contextPrompt += `- 인코텀즈: ${String(context.deal.incoterms || "").slice(
        0,
        20
      )}, 결제: ${String(context.deal.paymentTerms || "").slice(0, 50)}\n`;
    }
    if (context?.targetCountry) {
      contextPrompt += `\n\n## 타겟 국가: ${String(context.targetCountry).slice(0, 50)}\n이 국가의 규제를 중점적으로 안내해주세요.`;
    }
    if (context?.activeDoc) {
      contextPrompt += `\n\n## 현재 활성 문서\n`;
      contextPrompt += `- 문서 ID: ${String(context.activeDoc.docId || "").slice(0, 50)}\n`;
      contextPrompt += `- 템플릿: ${String(context.activeDoc.templateKey || "").slice(0, 50)}\n`;
      contextPrompt += `- 상태: ${String(context.activeDoc.status || "").slice(0, 20)}\n`;
      if (context.activeDoc.fields) {
        const f = context.activeDoc.fields;
        contextPrompt += `- MOQ: ${f.moq || "N/A"}\n`;
        contextPrompt += `- 인코텀즈: ${String(f.incoterms || "N/A").slice(0, 20)}\n`;
        contextPrompt += `- 결제조건: ${String(f.paymentTerms || "N/A").slice(0, 50)}\n`;
        contextPrompt += `- 납기: ${f.leadTime || "N/A"}일\n`;
        if (f.items?.length > 0) {
          contextPrompt += `- 품목: ${f.items
            .slice(0, 10)
            .map(
              (i: any) =>
                `${String(i.sku || "").slice(0, 20)} ${String(i.name || "").slice(0, 50)} (단가: ${String(
                  f.currency || ""
                ).slice(0, 10)} ${i.unitPrice}, 수량: ${i.qty})`
            )
            .join(", ")}\n`;
        }
      }
    }

    // ── 단일 스트리밍 파이프라인 (TTFT 최적화 + 무한로딩 해결) ───────────────
    // [구 아키텍처] non-streaming 1차 호출(전체 대기) → streaming 2차 호출 (2-RTT)
    // [신 아키텍처] streaming 단일 호출 → 텍스트 즉시 push → Function Call 감지 즉시 전달
    const geminiContents = toGeminiContents(safeMessages);

    if (geminiContents.length === 0) {
      return new Response(
        JSON.stringify({ error: "유효한 대화 내용이 없습니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[trade-assistant] 단일 스트리밍 호출 시작 (TTFT 최적화)\n` +
      `  모델: ${GEMINI_MODEL}, contents 턴: ${geminiContents.length}\n` +
      `  roles: [${geminiContents.map((c) => c.role).join(", ")}]`
    );

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // ReadableStream을 즉시 반환 → start() 내부에서 비동기 파이프라인 실행
    // 이 구조 덕분에 HTTP 응답 헤더가 즉시 전송되어 TTFT가 극적으로 단축됨
    return new Response(
      new ReadableStream<Uint8Array>({
        async start(controller) {

          // ── 버퍼링 없이 즉시 SSE 청크 전송하는 헬퍼 ──────────────────────
          const push = (data: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            // ── Phase 1: 스트리밍 호출 (tools 포함) ─────────────────────────
            // 텍스트 토큰은 수신 즉시 push, Function Call 정보는 수집
            const resp1 = await fetch(
              `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { role: "system", parts: [{ text: contextPrompt }] },
                  contents: geminiContents,
                  tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
                  generationConfig: { maxOutputTokens: 8192 },
                }),
              }
            );

            if (!resp1.ok) {
              const errText = await resp1.text();
              let parsed: any = {};
              try { parsed = JSON.parse(errText); } catch { /* raw */ }
              console.error(
                `[trade-assistant] Phase1 스트림 호출 실패\n` +
                `  HTTP: ${resp1.status} ${resp1.statusText}\n` +
                `  오류: ${parsed?.error?.message ?? errText}`
              );
              push({ error: parsed?.error?.message ? `AI 오류: ${parsed.error.message}` : "AI 서비스 오류가 발생했습니다." });
              return;
            }

            // ── Phase 1 스트림 실시간 처리 ──────────────────────────────────
            const functionCallParts: any[] = [];
            const modelParts: any[] = [];
            let buf1 = "";
            const reader1 = resp1.body!.getReader();

            try {
              while (true) {
                const { done, value } = await reader1.read();
                if (done) break;
                buf1 += decoder.decode(value, { stream: true });
                const lines = buf1.split("\n");
                buf1 = lines.pop() ?? "";

                for (const line of lines) {
                  const parsed = parseGeminiSSELine(line);
                  if (!parsed) continue;

                  if (parsed.text) {
                    // ✅ 첫 텍스트 토큰 수신 즉시 push → TTFT ~1초 이내
                    push({ choices: [{ delta: { content: parsed.text }, index: 0, finish_reason: null }] });
                  }
                  if (parsed.functionCall) {
                    functionCallParts.push({ functionCall: parsed.functionCall });
                    modelParts.push({ functionCall: parsed.functionCall });
                  }
                }
              }
            } finally {
              reader1.releaseLock();
            }

            console.log(
              `[trade-assistant] Phase1 완료 — Function Calls: ${functionCallParts.length}개`
            );

            // ── Phase 2: Function Call 감지 시 즉시 처리 ────────────────────
            if (functionCallParts.length > 0) {
              const parsedToolCalls = functionCallParts.map((p, idx) => ({
                id: `call_${Date.now()}_${idx}`,
                name: p.functionCall.name,
                arguments: p.functionCall.args,
              }));

              // ✅ tool_calls 즉시 push → 프론트엔드 우측 패널 지연 없이 오픈
              push({ tool_calls: parsedToolCalls });

              // Tool 실행 결과 구성 (클라이언트 사이드 실행 시뮬레이션)
              const toolResultParts = functionCallParts.map((p) => {
                const fc = p.functionCall;
                let result: any = { success: true };
                if (fc.name === "update_document_field") {
                  result = { success: true, field: fc.args.field_path, value: fc.args.new_value };
                } else if (fc.name === "generate_document") {
                  result = { success: true, template: fc.args.template_key };
                }
                return { functionResponse: { name: fc.name, response: result } };
              });

              // ── Phase 2: 후속 스트리밍 (확인 메시지 실시간 전달) ─────────
              const resp2 = await fetch(
                `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    systemInstruction: { role: "system", parts: [{ text: contextPrompt }] },
                    contents: [
                      ...toGeminiContents(safeMessages),
                      { role: "model", parts: modelParts },
                      { role: "user", parts: toolResultParts },
                    ],
                    generationConfig: { maxOutputTokens: 2048 }, // 짧은 확인 메시지
                  }),
                }
              );

              if (resp2.ok) {
                let buf2 = "";
                const reader2 = resp2.body!.getReader();
                try {
                  while (true) {
                    const { done, value } = await reader2.read();
                    if (done) break;
                    buf2 += decoder.decode(value, { stream: true });
                    const lines = buf2.split("\n");
                    buf2 = lines.pop() ?? "";
                    for (const line of lines) {
                      const parsed = parseGeminiSSELine(line);
                      if (parsed?.text) {
                        push({ choices: [{ delta: { content: parsed.text }, index: 0, finish_reason: null }] });
                      }
                    }
                  }
                } catch (e) {
                  console.error("[trade-assistant] Phase2 스트림 오류:", e);
                } finally {
                  reader2.releaseLock();
                }
              } else {
                console.error(`[trade-assistant] Phase2 스트림 호출 실패: ${resp2.status}`);
              }
            }
            // Function Call 없는 경우: Phase1에서 텍스트가 이미 push됨 (추가 호출 불필요)

          } catch (e) {
            console.error("[trade-assistant] 스트림 파이프라인 예외:", e);
            push({ error: `스트림 오류: ${e instanceof Error ? e.message : String(e)}` });
          } finally {
            // ✅ [DONE] 신호 보장: 항상 스트림 종료 처리
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[trade-assistant] 예상치 못한 예외 발생\n` +
      `  모델: ${GEMINI_MODEL}\n` +
      `  오류: ${errorMessage}\n` +
      `  스택: ${error instanceof Error ? error.stack : "N/A"}`
    );
    return new Response(
      JSON.stringify({ error: `서버 오류: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
