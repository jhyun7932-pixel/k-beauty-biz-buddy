import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const EXTRACT_PROMPT = `You are a document analysis expert for K-beauty export trade documents.
Extract ALL text content from this document and organize it into structured sections.

Return JSON:
{
  "title": "document title or filename",
  "sections": [
    { "heading": "section name", "content": "text content" }
  ],
  "keyFacts": {
    "productNames": ["..."],
    "ingredients": ["..."],
    "certifications": ["..."],
    "countries": ["..."],
    "prices": ["..."],
    "quantities": ["..."]
  },
  "fullText": "complete extracted text",
  "documentType": "catalog|ingredient_list|certificate|invoice|other",
  "language": "ko|en|mixed",
  "summary": "2-3 sentence summary in Korean"
}`;

// Validate UUID format
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Validate file path - prevent path traversal
function isValidFilePath(path: string): boolean {
  if (!path || path.length > 500) return false;
  if (path.includes("..") || path.includes("//") || path.startsWith("/")) return false;
  if (!/^[a-zA-Z0-9\-_\/\.]+$/.test(path)) return false;
  return true;
}

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
    return true; // Fail open if rate limit check fails
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Rate limiting: 20 document extractions per hour
    const withinLimit = await checkRateLimit(supabase, userId, "extract-document", 20);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "시간당 요청 한도(20회)를 초과했습니다. 잠시 후 다시 시도해주세요." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const { filePath, workspaceId } = body;

    if (!filePath || typeof filePath !== "string") {
      return new Response(
        JSON.stringify({ error: "filePath is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidFilePath(filePath)) {
      return new Response(
        JSON.stringify({ error: "유효하지 않은 파일 경로입니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (workspaceId !== undefined && workspaceId !== null) {
      if (typeof workspaceId !== "string" || !isValidUUID(workspaceId)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 workspaceId 형식입니다." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("onboarding-docs")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "파일을 다운로드할 수 없습니다." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Log rate limit usage
    await logRateLimitUsage(supabase, userId, "extract-document");

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    const isPdf = filePath.toLowerCase().endsWith(".pdf");
    const mimeType = isPdf ? "application/pdf" : "image/jpeg";

    const extractText = isPdf
      ? "이 PDF 문서에서 모든 텍스트를 추출하고 구조화해주세요. Return ONLY valid JSON."
      : "이 이미지에서 모든 텍스트를 추출하고 구조화해주세요. Return ONLY valid JSON.";

    // ── Claude API 호출 (Vision / PDF) ──────────────────────────────────
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const userContent: Anthropic.ContentBlockParam[] = [];

    if (isPdf) {
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      } as any);
    } else {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const safeMime = validTypes.includes(mimeType) ? mimeType : "image/jpeg";
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: safeMime,
          data: base64,
        },
      } as any);
    }
    userContent.push({ type: "text", text: extractText });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: EXTRACT_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    console.log(`[extract-document] tokens - input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`);

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: any;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch {
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { fullText: content, title: filePath.split("/").pop() };
      }
    }

    // Build public URL for reference
    const { data: urlData } = supabase.storage
      .from("onboarding-docs")
      .getPublicUrl(filePath);

    // Save to knowledge_assets
    const tags = [
      parsed.documentType || "other",
      parsed.language || "unknown",
      ...(parsed.keyFacts?.certifications || []).slice(0, 3),
    ];

    const { data: asset, error: insertError } = await supabase
      .from("knowledge_assets")
      .insert({
        user_id: userId,
        workspace_id: workspaceId || null,
        asset_type: parsed.documentType || "document",
        file_url: urlData?.publicUrl || filePath,
        extracted_text: parsed.fullText || content || "",
        tags,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({
          error: "추출된 텍스트 저장 실패",
          detail: insertError.message,
          extracted: parsed,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        assetId: asset.asset_id,
        extracted: parsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-document error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
