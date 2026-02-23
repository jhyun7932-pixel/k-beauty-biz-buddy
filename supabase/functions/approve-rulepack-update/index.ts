import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PendingUpdate {
  id: string;
  country: string;
  country_code: string;
  ingredient: string;
  change_description: string;
  source: string;
  severity: string;
  regulation_before: string | null;
  regulation_after: string | null;
  evidence_links: { label: string; url: string }[];
  admin_notes: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const body = await req.json();
    const { ids, admin_notes, bulk } = body as { ids: string[]; admin_notes?: string; bulk?: boolean };

    if (!ids || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No ids provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch the pending updates to process
    const { data: pendingRows, error: fetchErr } = await supabase
      .from('rulepack_pending_updates')
      .select('*')
      .in('id', ids)
      .eq('status', 'pending');

    if (fetchErr) throw new Error(`Fetch pending failed: ${fetchErr.message}`);
    if (!pendingRows || pendingRows.length === 0) {
      return new Response(JSON.stringify({ error: 'No pending updates found for given ids' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates = pendingRows as unknown as PendingUpdate[];
    const appliedCountries = new Set<string>();
    const results: { id: string; country_code: string; ingredient: string; action: string }[] = [];

    // 2. For each approved update, upsert into compliance_rules
    for (const update of updates) {
      const countryCode = update.country_code;
      appliedCountries.add(countryCode);

      // Fetch existing compliance rule for this country
      const { data: existingRule } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('country_code', countryCode)
        .maybeSingle();

      const ingredientName = update.ingredient;
      const regulationAfter = update.regulation_after ?? update.change_description;

      if (existingRule) {
        // Determine if this is a ban or restriction based on severity/content
        const isBan = update.severity === 'high' ||
          update.change_description.toLowerCase().includes('금지') ||
          update.change_description.toLowerCase().includes('ban') ||
          update.regulation_after?.toLowerCase().includes('금지') ||
          update.regulation_after?.toLowerCase().includes('prohibited');

        let updatedBanned = (existingRule.banned_ingredients as any[]) ?? [];
        let updatedRestricted = (existingRule.restricted_ingredients as any[]) ?? [];

        if (isBan) {
          // Add to banned list (avoid duplicates by INCI/name)
          const alreadyBanned = updatedBanned.some(
            (b: any) => b.name?.toLowerCase() === ingredientName.toLowerCase() ||
              b.inci?.toLowerCase() === ingredientName.toLowerCase()
          );
          if (!alreadyBanned) {
            updatedBanned = [
              ...updatedBanned,
              {
                name: ingredientName,
                inci: ingredientName,
                reason: regulationAfter,
                action: '제품에서 제거하거나 대체 성분으로 교체하세요.',
              },
            ];
          } else {
            // Update existing ban reason
            updatedBanned = updatedBanned.map((b: any) =>
              b.name?.toLowerCase() === ingredientName.toLowerCase()
                ? { ...b, reason: regulationAfter }
                : b
            );
          }
        } else {
          // Parse max percent from regulation_after if possible (e.g. "5%" or "10%")
          const percentMatch = regulationAfter.match(/(\d+(?:\.\d+)?)\s*%/);
          const maxPercent = percentMatch ? parseFloat(percentMatch[1]) : 0;

          const alreadyRestricted = updatedRestricted.some(
            (r: any) => r.name?.toLowerCase() === ingredientName.toLowerCase() ||
              r.inci?.toLowerCase() === ingredientName.toLowerCase()
          );

          if (!alreadyRestricted) {
            updatedRestricted = [
              ...updatedRestricted,
              {
                name: ingredientName,
                inci: ingredientName,
                maxPercent,
                action: `배합 한도(${maxPercent}%)를 준수하세요. 초과 시 성분 조정 필요.`,
                severity: 'WARNING',
              },
            ];
          } else {
            // Update the existing restriction
            updatedRestricted = updatedRestricted.map((r: any) =>
              r.name?.toLowerCase() === ingredientName.toLowerCase()
                ? { ...r, maxPercent, action: `배합 한도(${maxPercent}%)를 준수하세요.` }
                : r
            );
          }
        }

        // Upsert into compliance_rules
        const { error: upsertErr } = await supabase
          .from('compliance_rules')
          .update({
            banned_ingredients: updatedBanned,
            restricted_ingredients: updatedRestricted,
            notes: existingRule.notes
              ? `${existingRule.notes}\n[${new Date().toISOString().split('T')[0]}] ${update.change_description} (출처: ${update.source})`
              : `[${new Date().toISOString().split('T')[0]}] ${update.change_description} (출처: ${update.source})`,
            updated_at: new Date().toISOString(),
          })
          .eq('country_code', countryCode);

        if (upsertErr) {
          console.error(`compliance_rules update failed for ${countryCode}:`, upsertErr.message);
        }
      } else {
        // No existing rule for this country — insert a new one
        const { error: insertErr } = await supabase
          .from('compliance_rules')
          .insert({
            country_code: countryCode,
            country_name: update.country,
            banned_ingredients: update.severity === 'high' ? [
              {
                name: ingredientName,
                inci: ingredientName,
                reason: regulationAfter,
                action: '제품에서 제거 필요.',
              }
            ] : [],
            restricted_ingredients: update.severity !== 'high' ? [
              {
                name: ingredientName,
                inci: ingredientName,
                maxPercent: 0,
                action: '배합 한도를 확인하세요.',
                severity: 'WARNING',
              }
            ] : [],
            label_requirements: '',
            notes: `[${new Date().toISOString().split('T')[0]}] ${update.change_description} (출처: ${update.source})`,
          });

        if (insertErr) {
          console.error(`compliance_rules insert failed for ${countryCode}:`, insertErr.message);
        }
      }

      results.push({
        id: update.id,
        country_code: countryCode,
        ingredient: ingredientName,
        action: update.severity === 'high' ? 'banned' : 'restricted',
      });
    }

    // 3. Refresh rulepacks payload_json for affected countries
    for (const countryCode of appliedCountries) {
      // Fetch fresh compliance_rules row
      const { data: freshRule } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('country_code', countryCode)
        .maybeSingle();

      if (!freshRule) continue;

      // Build a rulepack payload that mirrors what the compliance engine expects
      const payload = {
        country_code: freshRule.country_code,
        country_name: freshRule.country_name,
        regulatory_body: freshRule.regulatory_body,
        key_regulation: freshRule.key_regulation,
        label_requirements: freshRule.label_requirements,
        banned_ingredients: freshRule.banned_ingredients,
        restricted_ingredients: freshRule.restricted_ingredients,
        notes: freshRule.notes,
        synced_at: new Date().toISOString(),
      };

      // Upsert into rulepacks table (match by country)
      const { data: existingRulepack } = await supabase
        .from('rulepacks')
        .select('rulepack_id, version')
        .eq('country', countryCode)
        .maybeSingle();

      if (existingRulepack) {
        // Bump patch version (e.g. "1.0.3" -> "1.0.4")
        const parts = existingRulepack.version.split('.').map(Number);
        parts[2] = (parts[2] ?? 0) + 1;
        const newVersion = parts.join('.');

        await supabase
          .from('rulepacks')
          .update({
            payload_json: payload,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('rulepack_id', existingRulepack.rulepack_id);
      } else {
        await supabase
          .from('rulepacks')
          .insert({
            country: countryCode,
            version: '1.0.0',
            payload_json: payload,
            coverage_notes: [`Auto-generated from approved regulatory update on ${new Date().toISOString().split('T')[0]}`],
          });
      }
    }

    // 4. Mark pending updates as approved
    const { error: statusErr } = await supabase
      .from('rulepack_pending_updates')
      .update({
        status: 'approved',
        admin_notes: admin_notes ?? null,
      })
      .in('id', ids);

    if (statusErr) throw new Error(`Status update failed: ${statusErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        applied: results.length,
        countries_updated: [...appliedCountries],
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Approve error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
