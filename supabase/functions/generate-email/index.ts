import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

const VALID_EMAIL_TYPES = ['first_proposal', 'sample_followup', 'closing'] as const;
type EmailType = typeof VALID_EMAIL_TYPES[number];

interface EmailRequest {
  emailType: EmailType;
  context: {
    companyName?: string;
    brandName?: string;
    buyerName?: string;
    buyerCompany?: string;
    buyerCountry?: string;
    products?: Array<{ name: string; category?: string }>;
    sampleDetails?: string;
    dealTerms?: {
      incoterms?: string;
      paymentTerms?: string;
      moq?: number;
      leadTime?: string;
      currency?: string;
      totalAmount?: number;
    };
    language?: string;
  };
}

const EMAIL_PROMPTS: Record<EmailType, string> = {
  first_proposal: `당신은 K-뷰티 수출 전문 이메일 작성가입니다. 바이어에게 처음 보내는 제안 이메일을 작성해주세요.

## 이메일 목적
- 브랜드/회사 소개
- 관심 유도 및 미팅/샘플 요청으로 연결
- 전문적이면서도 친근한 톤

## 구조
1. 인사 및 자기소개 (2-3문장)
2. 브랜드/제품 소개 (3-4문장)
3. 왜 이 바이어에게 연락했는지 (2-3문장)
4. 다음 단계 제안 (샘플 발송/미팅/카탈로그 공유 등)
5. 마무리 인사

## 주의사항
- 너무 길지 않게 (200-300 단어)
- 스팸처럼 보이지 않게
- 구체적인 제품명과 강점 언급
- CTA(Call to Action) 명확하게`,

  sample_followup: `당신은 K-뷰티 수출 전문 이메일 작성가입니다. 샘플 발송 후 후속 이메일을 작성해주세요.

## 이메일 목적
- 샘플 도착 확인
- 피드백 요청
- 본오더로의 전환 유도

## 구조
1. 샘플 발송 확인 및 도착 여부 문의
2. 샘플 테스트 시 참고사항 (사용법, 특장점)
3. 피드백 요청
4. 본오더 시 조건 안내 (MOQ, 납기, 가격 등)
5. 다음 단계 제안

## 주의사항
- 압박하지 않으면서도 관심 유지
- 구체적인 샘플 내용 언급
- 본오더 조건 자연스럽게 안내
- 150-250 단어`,

  closing: `당신은 K-뷰티 수출 전문 이메일 작성가입니다. 계약 체결/클로징을 위한 이메일을 작성해주세요.

## 이메일 목적
- 최종 조건 확인
- 계약서/PI 서명 요청
- 결제 및 생산 일정 안내

## 구조
1. 협상 과정 감사 인사
2. 최종 합의 조건 요약 (품목, 수량, 단가, 인코텀즈, 결제조건)
3. 첨부 서류 안내 (PI, 계약서 등)
4. 다음 단계 (서명, 선금 송금 등)
5. 일정 안내 (생산, 선적 예정)

## 주의사항
- 정확한 숫자와 조건 명시
- 명확한 액션 아이템
- 프로페셔널한 톤
- 200-300 단어`,
};

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

// Sanitize string inputs to bounded lengths
function sanitizeStr(val: unknown, maxLen: number): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'string') return undefined;
  return val.slice(0, maxLen);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Authentication check
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

    // Rate limiting: 50 email generations per hour
    const withinLimit = await checkRateLimit(supabaseClient, userId, "generate-email", 50);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "시간당 요청 한도(50회)를 초과했습니다. 잠시 후 다시 시도해주세요." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: '잘못된 요청 형식입니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { emailType, context } = body;

    // Validate emailType enum
    if (!emailType || !VALID_EMAIL_TYPES.includes(emailType as EmailType)) {
      return new Response(
        JSON.stringify({ error: "Invalid email type. Use: first_proposal, sample_followup, or closing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate context object
    if (!context || typeof context !== 'object' || Array.isArray(context)) {
      return new Response(
        JSON.stringify({ error: "context 객체가 필요합니다." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize context inputs
    const safeContext = {
      companyName: sanitizeStr(context.companyName, 100),
      brandName: sanitizeStr(context.brandName, 100),
      buyerName: sanitizeStr(context.buyerName, 100),
      buyerCompany: sanitizeStr(context.buyerCompany, 100),
      buyerCountry: sanitizeStr(context.buyerCountry, 100),
      language: sanitizeStr(context.language, 20),
      sampleDetails: sanitizeStr(context.sampleDetails, 500),
      products: Array.isArray(context.products)
        ? context.products.slice(0, 20).map((p: any) => ({
            name: sanitizeStr(p?.name, 100) || '',
            category: sanitizeStr(p?.category, 50),
          }))
        : undefined,
      dealTerms: context.dealTerms && typeof context.dealTerms === 'object' ? {
        incoterms: sanitizeStr(context.dealTerms.incoterms, 50),
        paymentTerms: sanitizeStr(context.dealTerms.paymentTerms, 100),
        moq: typeof context.dealTerms.moq === 'number' ? Math.max(0, Math.floor(context.dealTerms.moq)) : undefined,
        leadTime: sanitizeStr(context.dealTerms.leadTime, 50),
        currency: sanitizeStr(context.dealTerms.currency, 10),
        totalAmount: typeof context.dealTerms.totalAmount === 'number' ? Math.max(0, context.dealTerms.totalAmount) : undefined,
      } : undefined,
    };

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Log rate limit usage
    await logRateLimitUsage(supabaseClient, userId, "generate-email");

    let contextStr = `
## 제공된 정보
- 우리 회사: ${safeContext.companyName || '미정'}
- 브랜드: ${safeContext.brandName || safeContext.companyName || '미정'}
- 바이어 담당자: ${safeContext.buyerName || '미정'}
- 바이어 회사: ${safeContext.buyerCompany || '미정'}
- 바이어 국가: ${safeContext.buyerCountry || '미정'}
- 언어: ${safeContext.language || '영어'}
`;

    if (safeContext.products && safeContext.products.length > 0) {
      contextStr += `- 제품: ${safeContext.products.map(p => p.name).join(', ')}\n`;
    }

    if (safeContext.sampleDetails) {
      contextStr += `- 샘플 내용: ${safeContext.sampleDetails}\n`;
    }

    if (safeContext.dealTerms) {
      const dt = safeContext.dealTerms;
      contextStr += `
## 거래 조건
- 인코텀즈: ${dt.incoterms || '미정'}
- 결제조건: ${dt.paymentTerms || '미정'}
- MOQ: ${dt.moq || '미정'}
- 납기: ${dt.leadTime || '미정'}
- 통화: ${dt.currency || 'USD'}
- 총액: ${dt.totalAmount ? `${dt.currency || 'USD'} ${dt.totalAmount.toLocaleString()}` : '미정'}
`;
    }

    const systemPrompt = EMAIL_PROMPTS[emailType as EmailType];
    const lang = safeContext.language;
    const userPrompt = `${contextStr}

위 정보를 바탕으로 ${lang === 'ko' || lang === '한국어' ? '한국어로' : lang === 'ja' || lang === '일본어' ? '일본어로' : lang === 'zh' || lang === '중국어' ? '중국어로' : '영어로'} 이메일을 작성해주세요.

## 출력 형식
Subject: [제목]

[본문]

Best regards,
[서명]`;

    // ── Claude API 호출 ──────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    console.log(`[generate-email] tokens - input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`);

    const emailContent = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse subject and body
    const subjectMatch = emailContent.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Business Proposal';
    const body = emailContent.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();

    return new Response(
      JSON.stringify({
        success: true,
        email: {
          subject,
          body,
          type: emailType,
          language: safeContext.language || 'en',
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-email error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
