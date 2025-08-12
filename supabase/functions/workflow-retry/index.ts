import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabaseAsService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const supabaseAsUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });

  try {
    const { instance_id, node_id } = await req.json();
    if (!instance_id) {
      return new Response(JSON.stringify({ error: "instance_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get current user (for audit) and authorize
    const { data: userData } = await supabaseAsUser.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Require admin or manager role
    const [isAdminRes, isManagerRes] = await Promise.all([
      supabaseAsUser.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
      supabaseAsUser.rpc('has_role', { _user_id: user.id, _role: 'manager' }),
    ]);
    const isAdmin = !!isAdminRes.data;
    const isManager = !!isManagerRes.data;
    if (!isAdmin && !isManager) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const user_id = user.id;

    // Update instance
    const { data: instance, error: instErr } = await supabaseAsService
      .from('workflow_instances')
      .select('*')
      .eq('id', instance_id)
      .maybeSingle();
    if (instErr) throw instErr;
    if (!instance) {
      return new Response(JSON.stringify({ error: "Instance not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const updates: any = { status: 'running', last_error: null, retry_count: (instance.retry_count ?? 0) + 1 };
    if (node_id) updates.current_node_id = node_id;

    const { error: updErr } = await supabaseAsService
      .from('workflow_instances')
      .update(updates)
      .eq('id', instance_id);
    if (updErr) throw updErr;

    // Log event
    const { error: logErr } = await supabaseAsService
      .from('workflow_instance_events')
      .insert({
        instance_id,
        event_type: 'retry',
        message: node_id ? `Retry requested; moved to node ${node_id}` : 'Retry requested',
        metadata: {},
        user_id,
      });
    if (logErr) throw logErr;

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error('workflow-retry error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});