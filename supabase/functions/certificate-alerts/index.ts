import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting certificate expiry check...');

    // Get certificates expiring in 90, 60, and 30 days
    const alertIntervals = [90, 60, 30];
    const results = [];

    for (const days of alertIntervals) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find certificates expiring on the target date
      const { data: certificates, error } = await supabaseClient
        .from('employee_certificates')
        .select(`
          *,
          employees!inner(name, email, auth_user_id),
          courses!inner(title)
        `)
        .eq('expiry_date', dateStr);

      if (error) {
        console.error(`Error fetching certificates for ${days} days:`, error);
        continue;
      }

      console.log(`Found ${certificates?.length || 0} certificates expiring in ${days} days`);

      if (certificates && certificates.length > 0) {
        results.push({
          interval: days,
          certificates: certificates.length,
          data: certificates
        });

        // Here you would integrate with your email service
        // For now, we'll just log the information
        for (const cert of certificates) {
          console.log(`Alert: ${cert.employees.name} - ${cert.courses.title} expires in ${days} days`);
          
          // You can add email sending logic here
          // Example: await sendEmail(cert.employees.email, cert);
        }
      }
    }

    // Log summary to audit table
    await supabaseClient
      .from('training_audit')
      .insert({
        table_name: 'certificate_alerts',
        row_pk: crypto.randomUUID(),
        action: 'alert_check',
        changed_by: null,
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
        results: results,
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
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});