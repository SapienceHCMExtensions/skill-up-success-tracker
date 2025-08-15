-- Enhanced RLS policies for SSO settings table to ensure maximum security

-- First, ensure the table has proper RLS enabled (it already does)
-- Add explicit SELECT policy that only allows admins to view SSO settings
CREATE POLICY "Only admins can view SSO settings" 
ON public.sso_settings 
FOR SELECT 
USING (has_org_role(auth.uid(), 'admin'::app_role, organization_id));

-- Update the get_public_sso_settings function to have immutable search path for security
DROP FUNCTION IF EXISTS public.get_public_sso_settings(text);
CREATE OR REPLACE FUNCTION public.get_public_sso_settings(_subdomain text)
RETURNS TABLE(enable_azure boolean, enable_saml boolean, saml_domain text)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only return minimal non-sensitive data needed for UI
  SELECT 
    s.enable_azure, 
    s.enable_saml,
    s.saml_domain  -- Domain is needed for email detection but not sensitive
  FROM public.sso_settings s
  WHERE s.subdomain = _subdomain
  LIMIT 1;
$function$;

-- Update the get_admin_sso_settings function to have immutable search path
DROP FUNCTION IF EXISTS public.get_admin_sso_settings(text);
CREATE OR REPLACE FUNCTION public.get_admin_sso_settings(_subdomain text)
RETURNS TABLE(enable_azure boolean, azure_tenant text, azure_tenant_url text, azure_client_id text, azure_client_secret text, azure_callback_url text, enable_saml boolean, saml_domain text, saml_callback_url text, organization_id uuid)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return all data only to org admins
  SELECT 
    s.enable_azure,
    s.azure_tenant,
    s.azure_tenant_url,
    s.azure_client_id,
    s.azure_client_secret,
    s.azure_callback_url,
    s.enable_saml,
    s.saml_domain,
    s.saml_callback_url,
    s.organization_id
  FROM public.sso_settings s
  WHERE s.subdomain = _subdomain
    AND has_org_role(auth.uid(), 'admin'::app_role, s.organization_id)
  LIMIT 1;
$function$;

-- Create a security audit function to log SSO settings access
CREATE OR REPLACE FUNCTION public.log_sso_access(_subdomain text, _access_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    org_id uuid;
BEGIN
    -- Get organization ID for the subdomain
    SELECT organization_id INTO org_id 
    FROM public.sso_settings 
    WHERE subdomain = _subdomain 
    LIMIT 1;
    
    -- Log the access attempt
    IF org_id IS NOT NULL THEN
        INSERT INTO public.security_audit_logs (
            event_type,
            user_id,
            organization_id,
            details
        ) VALUES (
            'sso_settings_access',
            auth.uid(),
            org_id,
            jsonb_build_object(
                'subdomain', _subdomain,
                'access_type', _access_type,
                'timestamp', now()
            )
        );
    END IF;
END;
$function$;