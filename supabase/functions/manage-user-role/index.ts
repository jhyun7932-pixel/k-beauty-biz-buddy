import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
    const { target_user_id, new_role } = await req.json() as {
      target_user_id: string;
      new_role: 'admin' | 'user' | 'partner';
    };

    if (!target_user_id || !new_role) {
      return new Response(JSON.stringify({ error: 'target_user_id and new_role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-demotion
    if (target_user_id === user.id && new_role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Cannot remove your own admin role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove existing role
    await supabase.from('user_roles').delete().eq('user_id', target_user_id);

    // Insert new role (service role bypasses RLS)
    const { error: insertErr } = await supabase.from('user_roles').insert({
      user_id: target_user_id,
      role: new_role,
    });

    if (insertErr) throw new Error(`Role insert failed: ${insertErr.message}`);

    return new Response(
      JSON.stringify({ success: true, user_id: target_user_id, role: new_role }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('manage-user-role error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
