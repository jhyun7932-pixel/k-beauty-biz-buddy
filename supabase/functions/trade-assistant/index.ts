import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT (핵심 규칙만, 토큰 최소화)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SYSTEM_PROMPT = `You are FLONIX AI, a specialized K-Beauty export trade assistant for Korean SMEs.

=== CRITICAL RULES ===
1. ALWAYS call get_user_context tool FIRST before generating any document.
2. If seller is null OR seller.company_name is null:
   → Respond in Korean: "⚙️ 설정 페이지에서 회사 기본정보(회사명, 주소, 담당자)를 먼저 저장해주세요. 저장 후 다시 요청해주시면 즉시 문서를 생성해드립니다."
   → Do NOT generate any document.
3. NEVER fabricate seller, buyer, or product information.
4. Use ONLY exact data from get_user_context results.
5. Respond to user in Korean. All trade documents must be written in English.
6. Use generate_document tool for all document rendering. Never output raw document content in chat.
7. Country of Origin: always "Republic of Korea". Currency: USD. Incoterms 2020.

=== DOCUMENT GENERATION RULES ===
PI (Proforma Invoice):
- Doc number format: FLONIX-PI-YYYYMMDD-XXXX
- Required sections: Document Header, Seller Block, Buyer Block, Items Table (No/Description/HS Code/COO/Unit/Qty/Unit Price/Amount), Shipping Terms (Incoterms + Port of Loading + Port of Discharge + Partial Shipment + Transhipment), Payment Terms, Banking Information, Packaging Info, Terms & Conditions (4 mandatory clauses below), Signature Block
- T&C clauses: "1. Validity: This PI is valid for 30 days from issue date. 2. Samples: Available upon request. 3. Quality: Products conform to GMP standards. COA available on request. 4. Governing Law: Republic of Korea."
- Footer: SAY USD [amount in words] ONLY

CI (Commercial Invoice):
- Doc number: FLONIX-CI-YYYYMMDD-XXXX
- All PI fields + B/L No. field + Net Weight/Gross Weight columns + certification: "I/We hereby certify that the information in this invoice is true and correct, and the goods are of Korean origin."

PL (Packing List):
- Doc number: FLONIX-PL-YYYYMMDD-XXXX
- Ref. CI No. | Items table: No/Item/Qty per Carton/No. of Cartons/Total Qty/Net Wt(kg)/Gross Wt(kg)/CBM/Batch No. | Totals row | Shipping Mark | Cargo Summary Box

EMAIL:
- Subject format by stage: First contact: "[Company] - K-Beauty Product Proposal | [Category]" / Sample: "Re: Sample Feedback - [Product]" / Order: "[Company] - PI Confirmation | [PI No.]"
- Structure: Dear Ms./Mr. [Last Name] → Context 1 sentence → Main body → CTA with deadline → Best regards + full signature`;

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
  const [companiesRes, buyersRes, productsRes] = await Promise.all([
    supabaseClient.from("companies").select("*").eq("user_id", userId).maybeSingle(),
    supabaseClient.from("buyers").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabaseClient.from("products").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const co = companiesRes.data;

  return {
    seller: co
      ? {
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
          logo_url: co.logo_url || null,
          bank_info: co.bank_info || null,
        }
      : null,
    buyers: buyersRes.data || [],
    products: productsRes.data || [],
  };
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

    // 히스토리 제한 (이미지 있으면 5개, 없으면 20개)
    const hasImage = !!attachedFile;
    const maxHistory = hasImage ? 5 : 20;
    const trimmedMessages = messages.length > maxHistory
      ? messages.slice(-maxHistory)
      : messages;

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
    console.error("[FLONIX ERROR]", err);
    const msg = (err?.message || "").toLowerCase();
    let userMsg = "AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

    if (msg.includes("overload") || msg.includes("529")) {
      userMsg = "AI 서비스가 일시적으로 혼잡합니다. 잠시 후 다시 시도해주세요.";
    } else if (msg.includes("invalid api key") || msg.includes("401")) {
      userMsg = "API 키 설정 오류입니다. 관리자에게 문의해주세요.";
    } else if (msg.includes("base64") || msg.includes("image")) {
      userMsg = "파일 처리 오류입니다. 이미지를 JPG로 저장 후 다시 업로드해주세요.";
    }

    return new Response(
      JSON.stringify({ error: true, message: userMsg }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
