import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    // Authenticate caller
    const { data: userData } = await supabaseUser.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve user's organization
    const { data: orgRes, error: orgErr } = await supabaseUser.rpc('get_current_user_org');
    if (orgErr) {
      return new Response(JSON.stringify({ error: 'Unable to resolve organization' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const org_id = orgRes as string | null;
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'Organization not found for user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authorize: admin, manager, or compliance in this org
    const [isAdminRes, isManagerRes, isComplianceRes] = await Promise.all([
      supabaseUser.rpc('has_org_role', { _user_id: user.id, _role: 'admin', _org_id: org_id }),
      supabaseUser.rpc('has_org_role', { _user_id: user.id, _role: 'manager', _org_id: org_id }),
      supabaseUser.rpc('has_org_role', { _user_id: user.id, _role: 'compliance', _org_id: org_id }),
    ]);
    const allowed = !!isAdminRes.data || !!isManagerRes.data || !!isComplianceRes.data;
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Starting certificate expiry check...');

    // Get certificates expiring in 90, 60, and 30 days
    const alertIntervals = [90, 60, 30];
    const results: Array<{ interval: number; certificates: number }> = [];

    for (const days of alertIntervals) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find certificates expiring on the target date within org
      const { data: certificates, error } = await supabaseAdmin
        .from('employee_certificates')
        .select('id')
        .eq('expiry_date', dateStr)
        .eq('organization_id', org_id);

      if (error) {
        console.error(`Error fetching certificates for ${days} days:`, error);
        continue;
      }

      const count = certificates?.length || 0;
      console.log(`Found ${count} certificates expiring in ${days} days`);

      results.push({ interval: days, certificates: count });
    }

    // Log summary to audit table (no PII)
    await supabaseAdmin
      .from('training_audit')
      .insert({
        organization_id: org_id,
        table_name: 'certificate_alerts',
        row_pk: crypto.randomUUID(),
        action: 'alert_check',
        changed_by: user.id,
        diff: {
          summary: results,
          timestamp: new Date().toISOString(),
          total_alerts: results.reduce((sum, r) => sum + r.certificates, 0)
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Certificate expiry check completed',
        results,
        total_alerts: results.reduce((sum, r) => sum + r.certificates, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in certificate-alerts function:', error);
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});