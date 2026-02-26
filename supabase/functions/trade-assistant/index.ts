import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT (핵심 규칙만, 토큰 최소화)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYSTEM_PROMPT = `You are FLONIX AI, K-Beauty export trade assistant.

RULES:
1. Call get_user_context FIRST before any document generation.
2. If seller null: tell user to save company info in Settings(설정) page. Do NOT generate document.
3. Never invent data. Use only get_user_context results.
4. Reply in Korean. Documents in English.
5. Use generate_document tool for all document output.
6. COO: Republic of Korea. Currency: USD. Incoterms 2020.

PI: doc no(FLONIX-PI-YYYYMMDD-XXXX), seller/buyer blocks, items table(HS Code/COO/Unit/Qty/Unit Price/Amount), payment terms, bank info, T&C(4 clauses: validity 30days/samples available/GMP quality/Korea governing law), signature, SAY USD ONLY.
CI: PI fields + B/L No + weight columns + certification statement.
PL: carton table(qty/carton/cartons/total qty/NW/GW/CBM/batch no), shipping mark, cargo summary.
EMAIL: subject by stage, Dear Ms/Mr [name], body, CTA+deadline, Best regards+signature.`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOOLS 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const tools: Anthropic.Tool[] = [
  {
    name: "get_user_context",
    description: "Fetch seller company info, registered buyers, and products from the database. MUST be called before any document generation.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "generate_document",
    description: "Render a trade document as a rich UI component in the right panel.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["PI", "CI", "PL", "EMAIL", "NDA", "PROPOSAL"],
          description: "Document type",
        },
        data: {
          type: "object",
          description: "Complete document data structured for rendering",
        },
      },
      required: ["type", "data"],
    },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DB 조회 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function fetchUserContext(supabaseClient: any, userId: string) {
  try {
    const [companiesRes, buyersRes, productsRes] = await Promise.all([
      supabaseClient
        .from("companies")
        .select([
          "company_name",
          "company_name_ko",
          "representative",
          "address",
          "phone",
          "email",
          "website",
          "contact_name",
          "contact_title",
          "contact_phone",
          "contact_email",
          "email_signature",
          "bank_info",
          "export_countries",
          "certifications"
        ].join(","))
        .eq("user_id", userId)
        .maybeSingle(),

      // buyers: 실제 DB 컬럼에 맞춤
      supabaseClient
        .from("buyers")
        .select([
          "id",
          "company_name",
          "contact_name",
          "contact_email",
          "contact_phone",
          "country",
          "website",
          "buyer_type",
          "channel",
          "payment_terms",
          "currency",
          "status_stage"
        ].join(","))
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10),

      // products: 실제 DB 컬럼에 맞춤 (ingredients 완전 제외)
      supabaseClient
        .from("products")
        .select([
          "id",
          "name",
          "name_en",
          "category",
          "sku_code",
          "hs_code",
          "hs_code_candidate",
          "size_ml_g",
          "moq",
          "unit_price_range",
          "status"
        ].join(","))
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(15),
    ]);

    const co = companiesRes.data;

    // 토큰 사용량 사전 검증
    // products 정규화: DB 컬럼명 → AI가 이해하기 쉬운 필드명
    const normalizedProducts = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name || p.name_en || null,
      category: p.category || null,
      sku_code: p.sku_code || null,
      hs_code: p.hs_code || p.hs_code_candidate || null,
      unit_price: p.unit_price_range?.base ?? null,
      size_ml_g: p.size_ml_g ?? null,
      moq: p.moq ?? null,
      status: p.status || null,
    }));

    const ctx = {
      seller: co ? {
        company_name: co.company_name || null,
        company_name_ko: co.company_name_ko || null,
        representative: co.representative || null,
        address: co.address || null,
        phone: co.phone || null,
        email: co.email || null,
        website: co.website || null,
        export_countries: co.export_countries || [],
        certifications: co.certifications || [],
        contact_name: co.contact_name || null,
        contact_title: co.contact_title || null,
        contact_phone: co.contact_phone || null,
        contact_email: co.contact_email || null,
        email_signature: co.email_signature || null,
        bank_info: co.bank_info || null,
      } : null,
      buyers: buyersRes.data || [],
      products: normalizedProducts,
    };

    // 토큰 추정 및 로깅
    const jsonStr = JSON.stringify(ctx);
    const estimatedTokens = Math.ceil(jsonStr.length / 4);
    console.log(`[FLONIX] context size: ${jsonStr.length} chars, ~${estimatedTokens} tokens`);
    console.log(`[FLONIX] buyers: ${ctx.buyers.length}, products: ${ctx.products.length}`);

    return ctx;

  } catch (dbError: any) {
    console.error("[FLONIX] fetchUserContext error:", dbError.message);
    return { seller: null, buyers: [], products: [] };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// base64 정제 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function cleanBase64(data: string): string {
  const idx = data.indexOf(",");
  return idx !== -1 ? data.substring(idx + 1) : data;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages = [], attachedFile, userId } = body;

    // Supabase client 생성
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Anthropic client 생성
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // ⚡ 히스토리 엄격 제한 - 토큰 초과 방지
    const MAX_HISTORY = attachedFile ? 2 : 6;
    const allMessages = messages || [];
    const trimmedMessages = allMessages.length > MAX_HISTORY
      ? allMessages.slice(-MAX_HISTORY)
      : allMessages;

    // Claude 메시지 형식 변환
    const claudeMessages: Anthropic.MessageParam[] = trimmedMessages.map((msg: any, idx: number) => {
      // 마지막 사용자 메시지에 이미지 첨부
      if (idx === trimmedMessages.length - 1 && msg.role === "user" && attachedFile) {
        const content: Anthropic.ContentBlockParam[] = [];

        if (attachedFile.mimeType === "application/pdf") {
          content.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: cleanBase64(attachedFile.base64),
            },
          } as any);
        } else {
          const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
          const mimeType = validImageTypes.includes(attachedFile.mimeType)
            ? attachedFile.mimeType
            : "image/jpeg";
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: cleanBase64(attachedFile.base64),
            },
          } as any);
        }

        content.push({ type: "text", text: msg.content });
        return { role: "user", content };
      }

      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      };
    });

    // Agentic loop (tool use 처리)
    let responseText = "";
    let documentData: { type: string; data: any } | null = null;
    const currentMessages = [...claudeMessages];

    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      });

      // 토큰 사용량 로그
      console.log(`[FLONIX] tokens - input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`);

      if (response.stop_reason === "end_turn") {
        for (const block of response.content) {
          if (block.type === "text") responseText += block.text;
        }
        break;
      }

      if (response.stop_reason === "tool_use") {
        const assistantContent = response.content;
        currentMessages.push({ role: "assistant", content: assistantContent });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of assistantContent) {
          if (block.type !== "tool_use") continue;

          let toolResult: any;

          if (block.name === "get_user_context") {
            if (!userId) {
              toolResult = { error: "No user ID provided" };
            } else {
              toolResult = await fetchUserContext(supabaseClient, userId);
              // 토큰 초과 방지: tool result가 50K 토큰(~200K chars) 초과 시 압축
              const resultStr = JSON.stringify(toolResult);
              const estimatedTokens = Math.ceil(resultStr.length / 4);
              if (estimatedTokens > 50000) {
                console.warn(`[FLONIX] Tool result too large: ~${estimatedTokens} tokens. Compressing...`);
                toolResult = {
                  seller: toolResult.seller,
                  buyers: (toolResult.buyers || []).slice(0, 5),
                  products: (toolResult.products || []).slice(0, 10),
                  _truncated: true,
                  _original_counts: {
                    buyers: (toolResult.buyers || []).length,
                    products: (toolResult.products || []).length,
                  },
                };
              }
            }
          } else if (block.name === "generate_document") {
            const input = block.input as { type: string; data: any };
            documentData = { type: input.type, data: input.data };
            toolResult = { success: true, message: "Document rendered successfully" };
          } else {
            toolResult = { error: `Unknown tool: ${block.name}` };
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(toolResult),
          });
        }

        currentMessages.push({ role: "user", content: toolResults });
        continue;
      }

      // 기타 stop reason
      for (const block of response.content) {
        if (block.type === "text") responseText += block.text;
      }
      break;
    }

    return new Response(
      JSON.stringify({
        message: responseText,
        document: documentData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[FLONIX ERROR]", err?.message || err, err?.stack || "");
    const msg = (err?.message || "").toLowerCase();
    let userMsg = "AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    let debugMsg = err?.message || String(err);

    if (msg.includes("credit balance") || msg.includes("billing") || msg.includes("purchase credits")) {
      userMsg = "AI API 크레딧이 부족합니다. 관리자에게 Anthropic 결제 설정을 요청해주세요.";
    } else if (msg.includes("overload") || msg.includes("529")) {
      userMsg = "AI 서비스가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.";
    } else if (msg.includes("invalid api key") || msg.includes("401") || msg.includes("authentication")) {
      userMsg = "API 키 설정 오류입니다. 관리자에게 문의해주세요.";
    } else if (msg.includes("base64") || msg.includes("image")) {
      userMsg = "파일 처리 오류입니다. 이미지를 JPG로 저장 후 다시 업로드해주세요.";
    } else if (msg.includes("prompt is too long") || msg.includes("token") || msg.includes("context length") || msg.includes("max_tokens")) {
      userMsg = "대화가 너무 길어져서 처리할 수 없습니다. 새 대화를 시작해주세요.";
    } else if (msg.includes("module") || msg.includes("import") || msg.includes("not found")) {
      userMsg = "서버 모듈 로딩 오류입니다. 관리자에게 문의해주세요.";
    }

    return new Response(
      JSON.stringify({ error: true, message: userMsg, debug: debugMsg }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
