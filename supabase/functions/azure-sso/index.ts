import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced logging utility
const logInfo = (message: string, data?: any) => {
  console.log(`[Azure SSO] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

const logError = (message: string, error?: any) => {
  console.error(`[Azure SSO ERROR] ${message}`, error)
}

// Security utility to validate domain
const validateDomain = (email: string, allowedDomain?: string): boolean => {
  if (!allowedDomain) return true
  const emailDomain = email.split('@')[1]?.toLowerCase()
  return emailDomain === allowedDomain.toLowerCase()
}

// Enhanced error response utility
const errorResponse = (message: string, statusCode = 400, logData?: any) => {
  logError(message, logData)
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// HTML redirect utility with loading state
const redirectWithLoading = (url: string, message = 'Redirecting...') => {
  return new Response(
    `<html><head><title>Redirecting...</title></head><body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 1rem;">
          <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
        <p style="margin: 0; color: #666;">${message}</p>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      <script>setTimeout(() => window.location.href = '${url}', 1000)</script>
    </body></html>`,
    { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
  )
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
      const body = await req.json()
      const { subdomain, email } = body
      
      logInfo('Azure SSO initiation', { subdomain, emailDomain: email?.split('@')[1] })
      
      if (!subdomain) {
        return errorResponse('Subdomain is required')
      }
      
      // Get Azure settings for the subdomain with enhanced validation
      const { data: ssoSettings, error } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_azure', true)
        .single()

      if (error || !ssoSettings) {
        return errorResponse('Azure SSO not configured for this organization', 400, error)
      }

      // Validate email domain if provided and domain restriction is set
      if (email && ssoSettings.azure_tenant && ssoSettings.azure_tenant !== 'common') {
        const emailDomain = email.split('@')[1]?.toLowerCase()
        // For tenant-specific Azure, we could add domain validation here
        logInfo('Email domain check', { emailDomain, tenant: ssoSettings.azure_tenant })
      }

      const state = crypto.randomUUID()
      const redirectUri = `${url.origin}/supabase/functions/v1/azure-sso/callback`
      
      // Use tenant-specific or common endpoint
      const tenant = ssoSettings.azure_tenant || 'common'
      const authUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`)
      authUrl.searchParams.set('client_id', ssoSettings.azure_client_id)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', 'openid profile email')
      authUrl.searchParams.set('state', `${state}:${subdomain}`)
      authUrl.searchParams.set('response_mode', 'query')
      authUrl.searchParams.set('prompt', 'select_account') // Better UX

      logInfo('Azure auth URL generated', { tenant, clientId: ssoSettings.azure_client_id.substring(0, 8) + '...' })

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
      const errorDescription = url.searchParams.get('error_description')

      logInfo('Azure callback received', { hasCode: !!code, hasState: !!state, error })

      if (error) {
        const errorMsg = errorDescription || error
        return redirectWithLoading(`/auth?error=${encodeURIComponent(errorMsg)}`, 'Authentication failed...')
      }

      if (!code || !state) {
        return redirectWithLoading('/auth?error=Missing authorization code', 'Authentication failed...')
      }

      const [, subdomain] = state.split(':')
      
      if (!subdomain) {
        return redirectWithLoading('/auth?error=Invalid authentication state', 'Authentication failed...')
      }
      
      // Get Azure settings for the subdomain
      const { data: ssoSettings, error: settingsError } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_azure', true)
        .single()

      if (settingsError || !ssoSettings) {
        logError('SSO settings not found', { subdomain, error: settingsError })
        return redirectWithLoading('/auth?error=SSO configuration not found', 'Configuration error...')
      }

      // Exchange code for tokens with enhanced error handling
      const tenant = ssoSettings.azure_tenant || 'common'
      const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
      const redirectUri = `${url.origin}/supabase/functions/v1/azure-sso/callback`
      
      logInfo('Exchanging code for tokens', { tenant, redirectUri })
      
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
        logError('Token exchange failed', { status: tokenResponse.status, error: tokenData })
        return redirectWithLoading('/auth?error=Token exchange failed', 'Authentication failed...')
      }

      logInfo('Tokens received successfully')

      // Get user info from Microsoft Graph with retry logic
      let userResponse, userData: AzureUserInfo
      let retries = 3
      
      while (retries > 0) {
        userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        })
        
        if (userResponse.ok) {
          userData = await userResponse.json()
          break
        } else {
          retries--
          if (retries === 0) {
            logError('User info failed after retries', { status: userResponse.status })
            return redirectWithLoading('/auth?error=Failed to get user info', 'Authentication failed...')
          }
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
        }
      }

      logInfo('User info received', { email: userData!.email, name: userData!.name })

      // Enhanced domain validation
      if (ssoSettings.azure_tenant && ssoSettings.azure_tenant !== 'common') {
        // Add any tenant-specific domain validation here if needed
      }

      // Get organization for this subdomain
      const { data: organization, error: orgError } = await supabaseClient
        .from('organizations')
        .select('id, name')
        .eq('subdomain', subdomain)
        .single()

      if (orgError || !organization) {
        logError('Organization not found', { subdomain, error: orgError })
        return redirectWithLoading('/auth?error=Organization not found', 'Configuration error...')
      }

      // Create or update user in Supabase Auth with better error handling
      let authUser
      try {
        const createResult = await supabaseClient.auth.admin.createUser({
          email: userData!.email,
          email_confirm: true,
          user_metadata: {
            name: userData!.name,
            subdomain: subdomain,
            org_id: organization.id,
            provider: 'azure',
            azure_id: userData!.sub
          }
        })
        
        if (createResult.error && createResult.error.message !== 'User already registered') {
          throw createResult.error
        }
        
        authUser = createResult.data
        logInfo('User created/found', { userId: authUser?.user?.id })
        
      } catch (authError) {
        logError('Failed to create user', authError)
        return redirectWithLoading('/auth?error=Failed to create user account', 'Account creation failed...')
      }

      // Generate session token with better error handling
      const { data: session, error: sessionError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email: userData!.email,
      })

      if (sessionError) {
        logError('Failed to generate session', sessionError)
        return redirectWithLoading('/auth?error=Failed to create session', 'Session creation failed...')
      }

      // Redirect with the session
      const redirectUrl = new URL(session.properties.action_link)
      const token = redirectUrl.searchParams.get('token')
      
      logInfo('Redirecting to app with session', { hasToken: !!token })
      
      return redirectWithLoading(
        `/auth/callback?access_token=${token}&type=azure&provider=azure`,
        'Sign in successful! Redirecting...'
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