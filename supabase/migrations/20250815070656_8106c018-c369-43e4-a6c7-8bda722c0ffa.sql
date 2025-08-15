-- Add SSO settings for default subdomain to enable Azure login
INSERT INTO public.sso_settings (organization_id, subdomain, enable_azure, azure_tenant) 
VALUES (
  '319b53cc-28c0-4b09-9567-f17fdc3c64f5', 
  'default', 
  true, 
  'e2a9b42d-87b4-417b-8377-50b86822661a'
) 
ON CONFLICT (subdomain) 
DO UPDATE SET 
  enable_azure = true, 
  azure_tenant = 'e2a9b42d-87b4-417b-8377-50b86822661a',
  organization_id = '319b53cc-28c0-4b09-9567-f17fdc3c64f5';