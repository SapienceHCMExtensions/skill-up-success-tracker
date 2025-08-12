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

    // Authorize: admin, manager, or compliance
    const [isAdminRes, isManagerRes, isComplianceRes] = await Promise.all([
      supabaseUser.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
      supabaseUser.rpc('has_role', { _user_id: user.id, _role: 'manager' }),
      supabaseUser.rpc('has_role', { _user_id: user.id, _role: 'compliance' }),
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

      // Find certificates expiring on the target date
      const { data: certificates, error } = await supabaseAdmin
        .from('employee_certificates')
        .select('id')
        .eq('expiry_date', dateStr);

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