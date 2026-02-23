import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const GEMINI_MODEL = "gemini-2.5-pro";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `You are a cosmetic ingredient extraction expert. Extract ALL ingredients from the label image or text.

## CRITICAL RULES
1. Extract EVERY ingredient in the EXACT order shown on the label
2. Use standard INCI nomenclature (correct OCR errors)
3. For EACH ingredient, also provide the Korean name (한글명)
4. Return ONLY valid JSON, no markdown

## OUTPUT FORMAT (strict JSON)
{
  "ingredients": [
    {
      "name": "INCI name in English",
      "nameKr": "한글 성분명",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "warnings": [],
  "rawText": "full extracted text"
}

## CONFIDENCE RULES
- high: Common ingredients (Water, Glycerin, etc.) or clearly readable
- medium: Slightly unclear but identifiable  
- low: OCR artifacts, needs human review

## KOREAN NAME EXAMPLES
- Water → 정제수
- Glycerin → 글리세린
- Butylene Glycol → 부틸렌글라이콜
- Niacinamide → 나이아신아마이드
- Sodium Hyaluronate → 히알루론산나트륨
- Centella Asiatica Extract → 센텔라아시아티카추출물
- Panthenol → 판테놀
- Retinol → 레티놀
- Phenoxyethanol → 페녹시에탄올
- Dimethicone → 디메치콘
- Tocopherol → 토코페롤

Be thorough — missing even one ingredient is unacceptable.`;

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
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const withinLimit = await checkRateLimit(supabaseClient, userId, "ocr-extract", 30);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "시간당 요청 한도(30회)를 초과했습니다. 잠시 후 다시 시도해주세요." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: '잘못된 요청 형식입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, imageUrl, rawText } = body;

    if (!imageBase64 && !imageUrl && !rawText) {
      return new Response(
        JSON.stringify({ error: 'imageBase64, imageUrl, 또는 rawText 중 하나가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (rawText && (typeof rawText !== 'string' || rawText.length > 50000)) {
      return new Response(
        JSON.stringify({ error: 'rawText는 50,000자 이하여야 합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    await logRateLimitUsage(supabaseClient, userId, "ocr-extract");

    // ── Gemini API 다이렉트 호출 (inlineData로 이미지 전달) ──────────────────
    const OCR_TEXT = "Extract ALL ingredients from this cosmetic label. Return each ingredient with English INCI name and Korean name. Be thorough and accurate.";

    // Gemini parts 빌드 (rawText/base64/URL 케이스별 처리)
    let userParts: any[];
    if (rawText) {
      userParts = [{ text: `Extract all cosmetic ingredients from this text. Return Korean names too.\n\n${rawText.slice(0, 50000)}` }];
    } else if (imageBase64) {
      userParts = [
        { text: OCR_TEXT },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
      ];
    } else {
      // imageUrl → fetch하여 base64로 변환 후 inlineData로 전달
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`이미지 URL 로딩 실패: ${imgRes.status}`);
      const imgBuf = await imgRes.arrayBuffer();
      const imgUint8 = new Uint8Array(imgBuf);
      let imgBinary = "";
      for (let i = 0; i < imgUint8.length; i++) imgBinary += String.fromCharCode(imgUint8[i]);
      const imgBase64 = btoa(imgBinary);
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      userParts = [
        { text: OCR_TEXT },
        { inlineData: { mimeType: contentType, data: imgBase64 } },
      ];
    }

    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: userParts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = {};
      try { parsedError = JSON.parse(errorText); } catch { /* raw */ }
      console.error(`[ocr-extract] Gemini 오류 ${response.status}:`, parsedError?.error?.message ?? errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: parsedError?.error?.message ?? "AI 서비스 오류가 발생했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error("AI 응답이 비어있습니다");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("응답을 파싱할 수 없습니다");
      }
    }

    if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
      parsed.ingredients = parsed.ingredients.map((ing: any, index: number) => ({
        id: `ing-${Date.now()}-${index}`,
        name: ing.name,
        nameKr: ing.nameKr || ing.name_kr || '',
        confirmed: false,
        confidence: ing.confidence || 'medium',
        needsReview: ing.needsReview ?? (ing.confidence !== 'high'),
        originalText: ing.originalText || ing.name,
      }));
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ocr-extract error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
