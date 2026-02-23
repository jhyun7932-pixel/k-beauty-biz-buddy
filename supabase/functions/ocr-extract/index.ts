import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    return new Response(null, { headers: corsHeaders });
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    await logRateLimitUsage(supabaseClient, userId, "ocr-extract");

    let messageContent: any[];
    
    if (rawText) {
      messageContent = [
        {
          type: "text",
          text: `Extract all cosmetic ingredients from this text. Return Korean names too.\n\n${rawText.slice(0, 50000)}`
        }
      ];
    } else if (imageBase64) {
      messageContent = [
        {
          type: "text",
          text: "Extract ALL ingredients from this cosmetic label. Return each ingredient with English INCI name and Korean name. Be thorough and accurate."
        },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        }
      ];
    } else {
      messageContent = [
        {
          type: "text",
          text: "Extract ALL ingredients from this cosmetic label. Return each ingredient with English INCI name and Korean name. Be thorough and accurate."
        },
        {
          type: "image_url",
          image_url: { url: imageUrl }
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: messageContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI 크레딧이 부족합니다." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI 서비스 오류가 발생했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
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
