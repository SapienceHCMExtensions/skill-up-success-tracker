-- Fix security function issues identified by linter

-- Update existing functions to have proper search_path security
CREATE OR REPLACE FUNCTION public.get_current_user_org()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT organization_id FROM public.employees WHERE auth_user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _role app_role, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND organization_id = _org_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_sso_settings(_subdomain text)
 RETURNS TABLE(enable_azure boolean, azure_tenant text, azure_tenant_url text, azure_client_id text, azure_client_secret text, azure_callback_url text, enable_saml boolean, saml_domain text, saml_callback_url text, organization_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

CREATE OR REPLACE FUNCTION public.get_public_sso_settings(_subdomain text)
 RETURNS TABLE(enable_azure boolean, enable_saml boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.enable_azure, s.enable_saml
  FROM public.sso_settings s
  WHERE s.subdomain = _subdomain
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_employee_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id
  FROM public.employees
  WHERE auth_user_id = _user_id
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.generate_secure_password(length integer DEFAULT 16)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$function$;

-- Create a new function to detect SSO provider based on email domain
CREATE OR REPLACE FUNCTION public.detect_sso_provider(_email text, _subdomain text)
 RETURNS TABLE(provider text, domain text, enabled boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH email_domain AS (
    SELECT lower(split_part(_email, '@', 2)) as domain
  ),
  sso_config AS (
    SELECT 
      s.enable_azure,
      s.enable_saml,
      s.saml_domain,
      s.azure_tenant
    FROM public.sso_settings s
    WHERE s.subdomain = _subdomain
    LIMIT 1
  )
  SELECT 
    CASE 
      WHEN sc.enable_saml AND ed.domain = lower(sc.saml_domain) THEN 'saml'
      WHEN sc.enable_azure THEN 'azure'
      ELSE 'email'
    END as provider,
    ed.domain,
    CASE 
      WHEN sc.enable_saml AND ed.domain = lower(sc.saml_domain) THEN true
      WHEN sc.enable_azure THEN true
      ELSE false
    END as enabled
  FROM email_domain ed, sso_config sc;
$function$;

-- Add domain validation function for enhanced security
CREATE OR REPLACE FUNCTION public.validate_sso_domain(_email text, _subdomain text, _provider text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      WHEN _provider = 'saml' THEN
        EXISTS (
          SELECT 1 FROM public.sso_settings s
          WHERE s.subdomain = _subdomain 
            AND s.enable_saml = true
            AND lower(s.saml_domain) = lower(split_part(_email, '@', 2))
        )
      WHEN _provider = 'azure' THEN
        EXISTS (
          SELECT 1 FROM public.sso_settings s
          WHERE s.subdomain = _subdomain 
            AND s.enable_azure = true
        )
      ELSE false
    END;
$function$;