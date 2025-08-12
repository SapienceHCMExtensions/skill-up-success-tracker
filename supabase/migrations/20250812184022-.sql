-- Restrict public access to SSO settings table
DROP POLICY IF EXISTS "Public can view SSO settings" ON public.sso_settings;

-- Create a SECURITY DEFINER function to return only non-sensitive flags by subdomain
CREATE OR REPLACE FUNCTION public.get_public_sso_settings(_subdomain text)
RETURNS TABLE (enable_azure boolean, enable_saml boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT s.enable_azure, s.enable_saml
  FROM public.sso_settings s
  WHERE s.subdomain = _subdomain
  LIMIT 1;
$$;

-- Grant execute to anon so login page can call it
REVOKE ALL ON FUNCTION public.get_public_sso_settings(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_sso_settings(text) TO anon, authenticated;
