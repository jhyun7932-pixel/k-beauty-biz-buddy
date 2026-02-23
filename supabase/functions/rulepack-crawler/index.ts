import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PendingUpdate {
  country: string;
  country_code: string;
  ingredient: string;
  change_description: string;
  source: string;
  severity: 'high' | 'medium' | 'low';
  regulation_before: string;
  regulation_after: string;
  evidence_links: { label: string; url: string }[];
}

// ── AI-powered regulatory crawler ────────────────────────────────────────────
async function crawlRegulatoryUpdates(): Promise<PendingUpdate[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const prompt = `You are an expert regulatory compliance analyst specializing in global cosmetics regulations.
Generate 3 to 5 REALISTIC and PLAUSIBLE regulatory changes that could occur in 2026 for cosmetics/beauty products.
These should be based on real regulatory trends in these markets: US (FDA/MoCRA), EU (EC 1223/2009), Japan (薬機法), China (NMPA), Thailand (Thai FDA), Vietnam (DAV), Indonesia (BPOM), Malaysia (NPRA), Taiwan (TFDA), Australia (AICIS), Hong Kong.

For each update, provide a JSON object with these exact fields:
- country: full country name in Korean (e.g., "미국", "EU", "일본")
- country_code: ISO code (US, EU, JP, CN, TH, VN, ID, MY, TW, AU, HK)
- ingredient: ingredient name in Korean + English in parentheses
- change_description: concise description of what changed (1-2 sentences, in Korean)
- source: official source name + document/regulation reference
- severity: "high" if it's a ban or strict limit, "medium" if limit change, "low" if guidance/recommendation
- regulation_before: what the regulation said before (1 sentence in Korean)
- regulation_after: what the regulation says now (1 sentence in Korean)
- evidence_links: array of 2-3 objects with {label, url} pointing to realistic government/regulatory body URLs

Return ONLY a valid JSON array. No markdown, no explanation.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown code fences if present
  const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const updates: PendingUpdate[] = JSON.parse(jsonStr);
  return updates;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify admin role via JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Validate calling user is admin
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Starting AI-powered regulatory crawl...');
    const updates = await crawlRegulatoryUpdates();
    console.log(`Crawled ${updates.length} regulatory updates`);

    // Insert into pending_updates table (skip duplicates based on country_code + ingredient + change_description)
    const rows = updates.map((u) => ({
      country: u.country,
      country_code: u.country_code,
      ingredient: u.ingredient,
      change_description: u.change_description,
      source: u.source,
      severity: u.severity,
      regulation_before: u.regulation_before,
      regulation_after: u.regulation_after,
      evidence_links: u.evidence_links,
      status: 'pending',
      detected_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from('rulepack_pending_updates')
      .insert(rows)
      .select('id');

    if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: inserted?.length ?? 0,
        updates: rows,
        crawled_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Crawler error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
