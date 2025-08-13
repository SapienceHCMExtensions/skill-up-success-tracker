import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AzureTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  id_token: string
}

interface AzureUserInfo {
  sub: string
  name: string
  email: string
  given_name?: string
  family_name?: string
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
      // Initiate Azure OAuth flow
      const { subdomain } = await req.json()
      
      // Get Azure settings for the subdomain
      const { data: ssoSettings, error } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_azure', true)
        .single()

      if (error || !ssoSettings) {
        return new Response(
          JSON.stringify({ error: 'Azure SSO not configured for this organization' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const state = crypto.randomUUID()
      const redirectUri = `${url.origin}/supabase/functions/v1/azure-sso/callback`
      
      const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
      authUrl.searchParams.set('client_id', ssoSettings.azure_client_id)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', 'openid profile email')
      authUrl.searchParams.set('state', `${state}:${subdomain}`)
      authUrl.searchParams.set('response_mode', 'query')

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'callback') {
      // Handle Azure OAuth callback
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      if (error) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=${encodeURIComponent(error)}'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      if (!code || !state) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Missing authorization code'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      const [, subdomain] = state.split(':')
      
      // Get Azure settings for the subdomain
      const { data: ssoSettings, error: settingsError } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_azure', true)
        .single()

      if (settingsError || !ssoSettings) {
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=SSO configuration not found'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Exchange code for tokens
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      const redirectUri = `${url.origin}/supabase/functions/v1/azure-sso/callback`
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ssoSettings.azure_client_id,
          client_secret: ssoSettings.azure_client_secret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })

      const tokenData: AzureTokenResponse = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData)
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Token exchange failed'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Get user info from Microsoft Graph
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      })

      const userData: AzureUserInfo = await userResponse.json()

      if (!userResponse.ok) {
        console.error('User info failed:', userData)
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Failed to get user info'</script></body></html>`,
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

      // Create or update user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          subdomain: subdomain,
          org_name: organization.id,
          provider: 'azure'
        }
      })

      if (authError && authError.message !== 'User already registered') {
        console.error('Failed to create user:', authError)
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Failed to create user account'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Generate session token
      const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      })

      if (sessionError) {
        console.error('Failed to generate session:', sessionError)
        return new Response(
          `<html><body><script>window.location.href = '/auth?error=Failed to create session'</script></body></html>`,
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )
      }

      // Redirect with the session
      const redirectUrl = new URL(session.properties.action_link)
      const token = redirectUrl.searchParams.get('token')
      
      return new Response(
        `<html><body><script>window.location.href = '/auth/callback?access_token=${token}&type=magiclink'</script></body></html>`,
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
    console.error('Azure SSO error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})