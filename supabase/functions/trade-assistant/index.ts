import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `당신은 K-뷰티 AI 무역비서입니다. 화장품 수출 업무를 돕는 전문 어시스턴트입니다.

## 역할
- 화장품 수출 서류(PI, 계약서) 작성 지원
- 국가별 화장품 규제 안내 (미국 FDA, EU CPNR, 중국 NMPA, 일본 후생노동성 등)
- 성분 분석 및 규제 적합성 확인
- 바이어 커뮤니케이션 문구 작성
- 무역 용어 및 조건(인코텀즈, 결제조건) 안내

## 도구 사용 가이드라인
- 사용자가 문서의 특정 필드(MOQ, 단가, 납기, 인코텀즈, 결제조건 등)를 변경하라고 하면 반드시 update_document_field 도구를 호출하세요.
- 사용자가 새 문서 생성을 요청하면 generate_document 도구를 호출하세요.
- 도구를 호출한 후에는 수행한 작업을 간결하게 설명하세요.
- 일반적인 질문(규제, 용어 등)에는 도구를 호출하지 말고 텍스트로 답변하세요.

## 국가별 규제 지식

### 미국 (FDA)
- FDA 등록 필수 (시설등록 + 제품등록)
- 라벨링: 영문 INCI 성분표기, 경고문구
- 금지성분: 수은, 클로로포름, 할로겐화 살리실아닐리드 등
- OTC(선크림, 안티에이지 등)는 별도 NDC 등록 필요

### EU (CPNR)
- CPNP 등록 필수, 책임자(Responsible Person) 지정
- CPSR(안전성평가보고서) 필수
- 금지성분 1,600+ 종, 제한성분 300+ 종
- 동물실험 금지

### 중국 (NMPA)
- 일반 화장품: 비안 등록 (6~12개월)
- 특수 화장품: 특증 등록 (12~18개월)
- 동물실험 면제 조건 존재 (국제 인증 보유 시)

### 일본 (후생노동성)
- 화장품 수입판매업 허가 필요
- 전성분 일본어 표기
- 의약부외품은 별도 승인

## 응답 가이드라인
1. 항상 "초안입니다. 최종 제출 전 확인이 필요합니다"를 명시
2. 규제 정보는 참고용이며 최신 규정 확인 권고
3. 확실하지 않은 정보는 "확인 필요"로 표시
4. 한국어로 친절하고 전문적으로 응답

## 이메일 작성 시 출력 형식
사용자가 이메일 작성을 요청하면 반드시 아래 형식으로 응답하세요:
Subject: [이메일 제목]

[이메일 본문을 영어 또는 요청된 언어로 작성]

Best regards,
[서명]

## 문서/서류 작성 시 출력 형식
사용자가 문서(원산지 증명서, 품질 보증서, 단가 인상 공문 등)를 요청하면:
- 제목을 맨 첫 줄에 표시
- 구조화된 표(테이블)가 필요하면 마크다운 표 형식 사용
- 서명란, 날짜, 발신/수신 정보를 포함
- 제공된 회사 정보(companyInfo)를 반드시 활용`;

// Tool definitions for Function Calling
const TOOLS = [
  {
    type: "function",
    function: {
      name: "update_document_field",
      description: "현재 활성 문서의 특정 필드를 수정합니다. MOQ, 단가(unitPrice), 수량(qty), 납기(leadTime), 인코텀즈(incoterms), 결제조건(paymentTerms), 유효기간(validityDays) 등 거래 조건을 변경할 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          field_path: {
            type: "string",
            description: "변경할 필드의 경로. 예: 'moq', 'items[0].unitPrice', 'incoterms', 'paymentTerms', 'leadTime', 'validityDays', 'shippingCost', 'portOfLoading', 'portOfDischarge'"
          },
          new_value: {
            type: "string",
            description: "새로운 값 (문자열로 전달, 클라이언트에서 적절한 타입으로 변환)"
          },
          reason: {
            type: "string",
            description: "변경 사유를 한국어로 간결하게 설명"
          }
        },
        required: ["field_path", "new_value", "reason"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_document",
      description: "새로운 수출 문서를 생성합니다. PI(견적서), 계약서, 카탈로그, 이메일 등을 만들 때 사용합니다.",
      parameters: {
        type: "object",
        properties: {
          template_key: {
            type: "string",
            enum: [
              "DECK_COMPANY_BRAND_15P", "CATALOG_15P", "COMPLIANCE_SNAPSHOT_15P",
              "EMAIL_FIRST_OUTREACH", "EMAIL_FOLLOW_UP", "EMAIL_SAMPLE",
              "PI_SAMPLE", "PI_FINAL", "PL_SAMPLE", "PL_FINAL",
              "MEMO_LABEL_CHECK", "CONTRACT_SALES", "INVOICE_COMMERCIAL",
              "SHIPPING_INSTRUCTION", "GATE_CROSSCHECK_PO"
            ],
            description: "생성할 문서 템플릿 키"
          },
          preset: {
            type: "string",
            enum: ["FIRST_PROPOSAL", "SAMPLE", "PURCHASE_ORDER"],
            description: "거래 단계 프리셋"
          },
          reason: {
            type: "string",
            description: "문서 생성 사유를 한국어로 간결하게 설명"
          }
        },
        required: ["template_key", "preset", "reason"],
        additionalProperties: false
      }
    }
  }
];

// Per-user rate limiting using activity_logs
async function checkRateLimit(supabase: any, userId: string, functionName: string, limitPerHour: number): Promise<boolean> {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
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

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages 배열이 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit messages count and size to prevent abuse
    const MAX_MESSAGES = 50;
    const MAX_MSG_LENGTH = 10000;
    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `메시지는 최대 ${MAX_MESSAGES}개까지 허용됩니다.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize messages - only allow role/content
    const safeMessages = messages
      .filter((m: any) => m && typeof m === 'object' && ['user', 'assistant'].includes(m.role))
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content.slice(0, MAX_MSG_LENGTH) : '',
      }));

    if (safeMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "유효한 메시지가 없습니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // --- RAG: Retrieve knowledge assets if auth header present ---
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

          // Rate limiting: 100 chat requests per hour
          const withinLimit = await checkRateLimit(supabaseClient, userId, "trade-assistant", 100);
          if (!withinLimit) {
            return new Response(
              JSON.stringify({ error: "시간당 요청 한도(100회)를 초과했습니다. 잠시 후 다시 시도해주세요." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Fetch latest extracted documents (max 5, newest first)
          const { data: assets } = await supabaseClient
            .from("knowledge_assets")
            .select("asset_type, extracted_text, tags")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

          if (assets && assets.length > 0) {
            knowledgeContext = "\n\n## 사용자 업로드 문서 (RAG 참조)\n";
            knowledgeContext += "아래는 사용자가 업로드한 문서에서 추출된 정보입니다. 답변 시 이 정보를 우선적으로 참조하세요.\n\n";
            for (const a of assets) {
              const text = (a.extracted_text || "").slice(0, 3000);
              knowledgeContext += `### [${a.asset_type}] ${(a.tags as string[])?.join(", ") || ""}\n${text}\n\n---\n`;
            }
          }

          // Log rate limit usage
          await logRateLimitUsage(supabaseClient, userId, "trade-assistant");
        }
      } catch (ragErr) {
        console.error("RAG lookup error (non-fatal):", ragErr);
      }
    }

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT + knowledgeContext;
    if (context?.products?.length > 0) {
      contextPrompt += `\n\n## 현재 제품 정보\n`;
      context.products.slice(0, 10).forEach((p: any) => {
        contextPrompt += `- ${String(p.name || '').slice(0, 100)} (${String(p.category || '').slice(0, 50)})\n`;
        if (p.ingredientsConfirmed?.length > 0) {
          contextPrompt += `  성분: ${p.ingredientsConfirmed.slice(0, 5).map((i: any) => String(i.name || '').slice(0, 50)).join(', ')} 외\n`;
        }
      });
    }
    if (context?.deal) {
      contextPrompt += `\n\n## 현재 거래 조건\n`;
      contextPrompt += `- 바이어: ${String(context.deal.buyerName || '').slice(0, 100)} (${String(context.deal.buyerCountry || '').slice(0, 50)})\n`;
      contextPrompt += `- 수량: ${context.deal.qty}개, 단가: ${String(context.deal.currency || '').slice(0, 10)} ${context.deal.unitPrice}\n`;
      contextPrompt += `- 인코텀즈: ${String(context.deal.incoterms || '').slice(0, 20)}, 결제: ${String(context.deal.paymentTerms || '').slice(0, 50)}\n`;
    }
    if (context?.targetCountry) {
      contextPrompt += `\n\n## 타겟 국가: ${String(context.targetCountry).slice(0, 50)}\n이 국가의 규제를 중점적으로 안내해주세요.`;
    }
    if (context?.activeDoc) {
      contextPrompt += `\n\n## 현재 활성 문서\n`;
      contextPrompt += `- 문서 ID: ${String(context.activeDoc.docId || '').slice(0, 50)}\n`;
      contextPrompt += `- 템플릿: ${String(context.activeDoc.templateKey || '').slice(0, 50)}\n`;
      contextPrompt += `- 상태: ${String(context.activeDoc.status || '').slice(0, 20)}\n`;
      if (context.activeDoc.fields) {
        const f = context.activeDoc.fields;
        contextPrompt += `- MOQ: ${f.moq || 'N/A'}\n`;
        contextPrompt += `- 인코텀즈: ${String(f.incoterms || 'N/A').slice(0, 20)}\n`;
        contextPrompt += `- 결제조건: ${String(f.paymentTerms || 'N/A').slice(0, 50)}\n`;
        contextPrompt += `- 납기: ${f.leadTime || 'N/A'}일\n`;
        if (f.items?.length > 0) {
          contextPrompt += `- 품목: ${f.items.slice(0, 10).map((i: any) => `${String(i.sku || '').slice(0, 20)} ${String(i.name || '').slice(0, 50)} (단가: ${String(f.currency || '').slice(0, 10)} ${i.unitPrice}, 수량: ${i.qty})`).join(', ')}\n`;
        }
      }
    }

    // First call: non-streaming to check for tool calls
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextPrompt },
          ...safeMessages,
        ],
        tools: TOOLS,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (firstResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다. 설정에서 충전해주세요." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    // If tool calls exist, return them as a structured JSON response
    if (toolCalls && toolCalls.length > 0) {
      const parsedToolCalls = toolCalls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      }));

      // Build tool results for follow-up
      const toolResults = parsedToolCalls.map((tc: any) => {
        if (tc.name === "update_document_field") {
          return { tool_call_id: tc.id, role: "tool", content: JSON.stringify({ success: true, field: tc.arguments.field_path, value: tc.arguments.new_value }) };
        }
        if (tc.name === "generate_document") {
          return { tool_call_id: tc.id, role: "tool", content: JSON.stringify({ success: true, template: tc.arguments.template_key }) };
        }
        return { tool_call_id: tc.id, role: "tool", content: JSON.stringify({ success: true }) };
      });

      // Second call: stream the follow-up response after tool execution
      const followUpMessages = [
        { role: "system", content: contextPrompt },
        ...safeMessages,
        choice.message,
        ...toolResults,
      ];

      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: followUpMessages,
          stream: true,
        }),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error("Follow-up stream error:", streamResponse.status, errorText);
        return new Response(
          JSON.stringify({
            tool_calls: parsedToolCalls,
            message: parsedToolCalls.map((tc: any) => tc.arguments.reason).join('. '),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const encoder = new TextEncoder();
      const toolCallEvent = `data: ${JSON.stringify({ tool_calls: parsedToolCalls })}\n\n`;

      const combinedStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(toolCallEvent));
          const reader = streamResponse.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (e) {
            console.error("Stream pipe error:", e);
          }
          controller.close();
        },
      });

      return new Response(combinedStream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls: stream the response directly
    const textContent = choice?.message?.content;
    if (textContent) {
      const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: contextPrompt },
            ...safeMessages,
          ],
          stream: true,
        }),
      });

      if (!streamResponse.ok) {
        return new Response(
          JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(
      JSON.stringify({ error: "AI 응답을 생성할 수 없습니다." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("trade-assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
