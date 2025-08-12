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
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify JWT and get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Role check: only admin or manager can send notifications
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    if (roleError) throw roleError;
    const allowed = (roles || []).some(r => r.role === 'admin' || r.role === 'manager');
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { channel, message, title } = await req.json();
    if (!channel || !message) {
      return new Response(JSON.stringify({ error: "channel and message are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load org settings
    const { data: settings, error } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!settings) {
      return new Response(JSON.stringify({ error: "No organization_settings row found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let webhook = '';
    if (channel === 'slack') webhook = settings.slack_webhook_url ?? '';
    if (channel === 'teams') webhook = settings.teams_webhook_url ?? '';

    if (!webhook) {
      return new Response(JSON.stringify({ error: `Missing ${channel} webhook URL in organization settings` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let payload: any = {};
    if (channel === 'slack') {
      payload = { text: title ? `*${title}*\n${message}` : message };
    } else {
      // Microsoft Teams expects a simple message card; at minimum, a text field works
      payload = { text: title ? `${title}\n${message}` : message };
    }

    const resp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return new Response(JSON.stringify({ error: `${channel} webhook returned ${resp.status}`, details: text }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error('send-notification error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});