-- Create SSO settings table for provider availability (non-secret flags)
CREATE TABLE IF NOT EXISTS public.sso_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subdomain text NOT NULL,
  enable_azure boolean NOT NULL DEFAULT false,
  azure_tenant text NULL,
  enable_saml boolean NOT NULL DEFAULT false,
  saml_domain text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sso_settings_org_unique UNIQUE (organization_id),
  CONSTRAINT sso_settings_subdomain_unique UNIQUE (subdomain)
);

-- Enable RLS
ALTER TABLE public.sso_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read of non-sensitive flags so login page can render buttons
DROP POLICY IF EXISTS "Public can view SSO settings" ON public.sso_settings;
CREATE POLICY "Public can view SSO settings"
ON public.sso_settings
FOR SELECT
USING (true);

-- Admins manage their org's SSO settings
DROP POLICY IF EXISTS "Admins can insert SSO settings" ON public.sso_settings;
CREATE POLICY "Admins can insert SSO settings"
ON public.sso_settings
FOR INSERT
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Admins can update SSO settings" ON public.sso_settings;
CREATE POLICY "Admins can update SSO settings"
ON public.sso_settings
FOR UPDATE
USING (public.has_org_role(auth.uid(), 'admin', organization_id))
WITH CHECK (public.has_org_role(auth.uid(), 'admin', organization_id));

DROP POLICY IF EXISTS "Admins can delete SSO settings" ON public.sso_settings;
CREATE POLICY "Admins can delete SSO settings"
ON public.sso_settings
FOR DELETE
USING (public.has_org_role(auth.uid(), 'admin', organization_id));

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_sso_settings_updated_at ON public.sso_settings;
CREATE TRIGGER update_sso_settings_updated_at
BEFORE UPDATE ON public.sso_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();