import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { hcmUrl, username, password, organizationId } = await req.json();

    if (!hcmUrl || !username || !password || !organizationId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: HCM URL, username, password, or organization ID' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize the HCM URL - ensure it has proper protocol and format
    let normalizedUrl = hcmUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    const loginEndpoint = `${normalizedUrl}/api/account/login`;
    
    console.log(`Testing Sapience HCM connection to: ${loginEndpoint}`);

    // Test the connection by calling the login API
    const loginResponse = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        userName: username,
        password: password,
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`Sapience HCM login failed: ${loginResponse.status} - ${errorText}`);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Authentication failed: ${loginResponse.status} ${loginResponse.statusText}`,
        details: errorText 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const loginResult = await loginResponse.json();
    console.log('Sapience HCM login successful');

    // Extract the token from the response (adjust based on actual API response structure)
    const token = loginResult.token || loginResult.accessToken || loginResult.access_token;
    
    if (!token) {
      console.error('No token found in Sapience HCM response:', loginResult);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No authentication token received from Sapience HCM' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate token expiry (assume 24 hours if not provided)
    const expiresIn = loginResult.expiresIn || loginResult.expires_in || 86400; // 24 hours default
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));

    // Save the token to the organization settings
    const { error: updateError } = await supabase
      .from('organization_settings')
      .update({
        sapience_hcm_token: token,
        sapience_hcm_token_expires_at: expiresAt.toISOString(),
      })
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Failed to save token:', updateError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to save authentication token' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Sapience HCM token saved successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Connection test successful! Authentication token has been saved.',
      tokenExpiry: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sapience-hcm-test function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});