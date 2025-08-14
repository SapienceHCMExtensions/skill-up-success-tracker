import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced logging utility
const logInfo = (message: string, data?: any) => {
  console.log(`[SAML SSO] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

const logError = (message: string, error?: any) => {
  console.error(`[SAML SSO ERROR] ${message}`, error)
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
      const body = await req.json()
      const { email, subdomain } = body
      
      logInfo('SAML SSO initiation', { subdomain, email: email ? email.split('@')[0] + '@***' : 'none' })
      
      if (!email || !subdomain) {
        return errorResponse('Email and subdomain are required')
      }
      
      const emailDomain = email.split('@')[1]?.toLowerCase()
      if (!emailDomain) {
        return errorResponse('Invalid email format')
      }

      // Get SAML settings for the subdomain with enhanced validation
      const { data: ssoSettings, error } = await supabaseClient
        .from('sso_settings')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('enable_saml', true)
        .single()

      if (error || !ssoSettings) {
        return errorResponse('SAML SSO not configured for this organization', 400, error)
      }

      // Enhanced domain validation
      if (ssoSettings.saml_domain && emailDomain !== ssoSettings.saml_domain.toLowerCase()) {
        logError('Domain mismatch', { 
          emailDomain, 
          configuredDomain: ssoSettings.saml_domain,
          subdomain 
        })
        return errorResponse(
          `Email domain "${emailDomain}" is not authorized for SSO. Expected: ${ssoSettings.saml_domain}`,
          403
        )
      }

      logInfo('Domain validation passed', { emailDomain, configuredDomain: ssoSettings.saml_domain })

      // Use Supabase's built-in SAML SSO with enhanced callback
      const callbackUrl = `${url.origin}/supabase/functions/v1/saml-sso/callback?subdomain=${subdomain}&email=${encodeURIComponent(email)}`
      
      const { data: ssoData, error: ssoError } = await supabaseClient.auth.signInWithSSO({
        domain: emailDomain,
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            subdomain: subdomain,
            email: email
          }
        }
      })

      if (ssoError) {
        logError('SAML SSO initiation failed', ssoError)
        return errorResponse('Failed to initiate SAML SSO. Please check your SSO configuration.', 500, ssoError)
      }

      logInfo('SAML SSO URL generated successfully')

      return new Response(
        JSON.stringify({ 
          ssoUrl: ssoData.url,
          domain: emailDomain,
          subdomain: subdomain
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'callback') {
      // Handle SAML callback
      const subdomain = url.searchParams.get('subdomain')
      const email = url.searchParams.get('email')
      const access_token = url.searchParams.get('access_token')
      const refresh_token = url.searchParams.get('refresh_token')
      const error = url.searchParams.get('error')
      const errorDescription = url.searchParams.get('error_description')

      logInfo('SAML callback received', { 
        subdomain, 
        hasToken: !!access_token, 
        error,
        email: email ? email.split('@')[0] + '@***' : 'none'
      })

      if (error) {
        const errorMsg = errorDescription || error
        logError('SAML callback error', { error, errorDescription })
        return redirectWithLoading(`/auth?error=${encodeURIComponent(errorMsg)}`, 'Authentication failed...')
      }

      if (!access_token || !subdomain) {
        logError('Missing required callback parameters', { hasToken: !!access_token, subdomain })
        return redirectWithLoading('/auth?error=Missing authentication tokens', 'Authentication failed...')
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

      // Get user info from the token with enhanced error handling
      let userResult
      try {
        userResult = await supabaseClient.auth.getUser(access_token)
        
        if (userResult.error || !userResult.data.user) {
          throw userResult.error || new Error('No user data received')
        }
      } catch (userError) {
        logError('Failed to get user info', userError)
        return redirectWithLoading('/auth?error=Failed to get user info', 'Authentication failed...')
      }

      const user = userResult.data.user
      logInfo('User info retrieved', { 
        userId: user.id, 
        email: user.email,
        provider: user.app_metadata?.provider 
      })

      // Enhanced domain validation for SAML users
      if (email) {
        const emailDomain = email.split('@')[1]?.toLowerCase()
        const userEmailDomain = user.email?.split('@')[1]?.toLowerCase()
        
        if (emailDomain !== userEmailDomain) {
          logError('Email domain mismatch', { 
            providedDomain: emailDomain, 
            userDomain: userEmailDomain 
          })
          return redirectWithLoading('/auth?error=Email domain verification failed', 'Verification failed...')
        }
      }

      // Update user metadata to include organization info with enhanced data
      try {
        const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              subdomain: subdomain,
              org_id: organization.id,
              org_name: organization.name,
              provider: 'saml',
              last_saml_login: new Date().toISOString()
            }
          }
        )

        if (updateError) {
          logError('Failed to update user metadata', updateError)
          // Don't fail the login for metadata update issues
        } else {
          logInfo('User metadata updated successfully')
        }
      } catch (metadataError) {
        logError('User metadata update exception', metadataError)
        // Continue with login even if metadata update fails
      }

      // Redirect with the session tokens and enhanced parameters
      const redirectParams = new URLSearchParams({
        access_token,
        refresh_token: refresh_token || '',
        type: 'saml',
        provider: 'saml',
        subdomain: subdomain
      })

      logInfo('Redirecting to app with SAML session')

      return redirectWithLoading(
        `/auth/callback?${redirectParams.toString()}`,
        'SAML sign in successful! Redirecting...'
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