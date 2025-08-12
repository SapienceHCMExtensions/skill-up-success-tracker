import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function applyTemplate(str: string, variables: Record<string, string> = {}) {
  return str.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => variables[key] ?? "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const ELASTICEMAIL_API_KEY = Deno.env.get("ELASTICEMAIL_API_KEY");
  const ELASTICEMAIL_FROM_EMAIL = Deno.env.get("ELASTICEMAIL_FROM_EMAIL");
  const ELASTICEMAIL_FROM_NAME = Deno.env.get("ELASTICEMAIL_FROM_NAME") ?? "Lovable App";

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

    // Role check: only admin or manager can send emails
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);
    if (roleError) throw roleError;
    const allowed = (roles || []).some(r => r.role === 'admin' || r.role === 'manager');
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { to, template_id, template_name, subject_override, variables = {} } = await req.json();

    if (!Array.isArray(to) || to.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'to' recipients" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load template
    let template: any = null;
    if (template_id) {
      const { data, error } = await supabaseAdmin.from('email_templates').select('*').eq('id', template_id).maybeSingle();
      if (error) throw error;
      template = data;
    } else if (template_name) {
      const { data, error } = await supabaseAdmin.from('email_templates').select('*').eq('name', template_name).maybeSingle();
      if (error) throw error;
      template = data;
    } else {
      return new Response(JSON.stringify({ error: "Provide template_id or template_name" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!template || template.is_active === false) {
      return new Response(JSON.stringify({ error: "Template not found or inactive" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subject = applyTemplate(subject_override ?? template.subject, variables);
    const html = applyTemplate(template.html, variables);

    if (!ELASTICEMAIL_API_KEY || !ELASTICEMAIL_FROM_EMAIL) {
      return new Response(JSON.stringify({ error: "ElasticEmail secrets missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Send via ElasticEmail v2 (form encoded)
    const params = new URLSearchParams();
    params.set('apikey', ELASTICEMAIL_API_KEY);
    params.set('to', to.join(','));
    params.set('subject', subject);
    params.set('from', ELASTICEMAIL_FROM_EMAIL);
    params.set('fromName', ELASTICEMAIL_FROM_NAME);
    params.set('isTransactional', 'true');
    params.set('bodyHtml', html);

    const resp = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const result = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "ElasticEmail error", details: result }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error('send-templated-email error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});