import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (action === 'initiate') {
      // Initiate SAML SSO flow
      const { email, subdomain } = await req.json()
      
      const emailDomain = email.split('@')[1]?.toLowerCase()
      if (!emailDomain) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get SAML settings for the subdomain
      const { data: ssoSettings, error } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_saml', true)
        .single()

      if (error || !ssoSettings) {
        return new Response(
          JSON.stringify({ error: 'SAML SSO not configured for this organization' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate email domain matches configured domain
      if (ssoSettings.saml_domain && emailDomain !== ssoSettings.saml_domain.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: `Email domain ${emailDomain} is not authorized for SSO` }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Use Supabase's built-in SAML SSO
      const { data: ssoData, error: ssoError } = await supabaseClient.auth.signInWithSSO({
        domain: emailDomain,
        options: {
          redirectTo: `${url.origin}/supabase/functions/v1/saml-sso/callback?subdomain=${subdomain}`
        }
      })

      if (ssoError) {
        console.error('SAML SSO initiation failed:', ssoError)
        return new Response(
          JSON.stringify({ error: 'Failed to initiate SAML SSO' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      return new Response(
        JSON.stringify({ ssoUrl: ssoData.url }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'callback') {
      // Handle SAML callback
      const subdomain = url.searchParams.get('subdomain')
      const access_token = url.searchParams.get('access_token')
      const refresh_token = url.searchParams.get('refresh_token')
      const error = url.searchParams.get('error')

      if (error) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=${encodeURIComponent(error)}'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      if (!access_token || !subdomain) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Missing authentication tokens'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Get organization for this subdomain
      const { data: organization, error: orgError } = await supabaseClient
        .from('organizations')
        .select('id')
        .eq('subdomain', subdomain)
        .single()

      if (orgError || !organization) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Organization not found'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Get user info from the token
      const { data: user, error: userError } = await supabaseClient.auth.getUser(access_token)

      if (userError || !user.user) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Failed to get user info'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Update user metadata to include organization info
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        user.user.id,
        {
          user_metadata: {
            ...user.user.user_metadata,
            subdomain: subdomain,
            org_name: organization.id,
            provider: 'saml'
          }
        }
      )

      if (updateError) {
        console.error('Failed to update user metadata:', updateError)
      }

      // Redirect with the session tokens
      const redirectParams = new URLSearchParams({
        access_token,
        refresh_token: refresh_token || '',
        type: 'saml'
      })

      return new Response(
        `<html><body><script>window.location.href = '/auth/callback?${redirectParams.toString()}'</script></body></html>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('SAML SSO error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})