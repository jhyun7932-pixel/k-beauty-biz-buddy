import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Validate UUID format
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Validate share token format (16 hex chars)
function isValidToken(str: string): boolean {
  return /^[a-f0-9]{16}$/.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // GET 요청: 공유 링크로 패키지 조회
    if (req.method === "GET" && token) {
      // Validate token format before querying
      if (!isValidToken(token)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 링크입니다." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 공유 링크 조회는 RLS를 우회해야 하므로 Service Role 사용
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // 토큰으로 공유 링크 조회
      const { data: shareLink, error: linkError } = await supabaseAdmin
        .from("share_links")
        .select("*")
        .eq("token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (linkError || !shareLink) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 링크입니다." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 만료 확인
      if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "링크가 만료되었습니다." }),
          { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 조회수 증가
      await supabaseAdmin
        .from("share_links")
        .update({ view_count: (shareLink.view_count || 0) + 1 })
        .eq("id", shareLink.id);
      
      // Validate deal_id before querying
      if (!shareLink.deal_id || !isValidUUID(shareLink.deal_id)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 링크입니다." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 관련 거래 정보 조회
      const { data: deal } = await supabaseAdmin
        .from("deals")
        .select(`
          *,
          buyer:buyers(*),
          product:products(*),
          documents(*)
        `)
        .eq("id", shareLink.deal_id)
        .maybeSingle();

      // 회사 정보 조회
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("*")
        .eq("user_id", shareLink.user_id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          shareLink,
          deal,
          company,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST 요청: 새 공유 링크 생성 (인증 필요)
    if (req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "인증이 필요합니다." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ error: "인증에 실패했습니다." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      const { dealId, expiresInDays = 30 } = body;

      // Validate dealId is a valid UUID
      if (!dealId || typeof dealId !== 'string' || !isValidUUID(dealId)) {
        return new Response(
          JSON.stringify({ error: "유효하지 않은 dealId 형식입니다." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate expiresInDays is within safe bounds (1-365 days)
      const safeDays = Math.min(365, Math.max(1, Math.floor(Number(expiresInDays) || 30)));

      // Verify user owns the deal before creating share link
      const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("id")
        .eq("id", dealId)
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (dealError || !deal) {
        return new Response(
          JSON.stringify({ error: "해당 거래를 찾을 수 없습니다." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 고유 토큰 생성
      const newToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      
      // 만료일 계산
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + safeDays);

      const { data: newLink, error: insertError } = await supabase
        .from("share_links")
        .insert({
          user_id: authData.user.id,
          deal_id: dealId,
          token: newToken,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "링크 생성에 실패했습니다." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 공유 URL 생성
      const shareUrl = `${url.origin.replace('/functions/v1/share-package', '')}/share/${newToken}`;

      return new Response(
        JSON.stringify({
          ...newLink,
          shareUrl,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "지원하지 않는 메서드입니다." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("share-package error:", error);
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
