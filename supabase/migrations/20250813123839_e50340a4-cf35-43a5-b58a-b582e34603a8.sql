-- 1) Extend sso_settings with secure provider fields
ALTER TABLE public.sso_settings
  ADD COLUMN IF NOT EXISTS azure_client_id text,
  ADD COLUMN IF NOT EXISTS azure_client_secret text,
  ADD COLUMN IF NOT EXISTS azure_tenant_url text,
  ADD COLUMN IF NOT EXISTS azure_callback_url text,
  ADD COLUMN IF NOT EXISTS saml_callback_url text;

-- 2) Admin-only function to fetch full SSO settings for a subdomain
CREATE OR REPLACE FUNCTION public.get_admin_sso_settings(_subdomain text)
RETURNS TABLE (
  enable_azure boolean,
  azure_tenant text,
  azure_tenant_url text,
  azure_client_id text,
  azure_client_secret text,
  azure_callback_url text,
  enable_saml boolean,
  saml_domain text,
  saml_callback_url text,
  organization_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_admin_sso_settings(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_sso_settings(text) TO authenticated;