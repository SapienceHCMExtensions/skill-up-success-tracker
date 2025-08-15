-- Update the existing SSO settings to work with default subdomain for Azure login
UPDATE public.sso_settings 
SET subdomain = 'default'
WHERE organization_id = '319b53cc-28c0-4b09-9567-f17fdc3c64f5' 
AND subdomain = 'skill-up-success-tracker';