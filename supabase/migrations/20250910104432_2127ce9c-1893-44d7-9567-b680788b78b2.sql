-- Add Sapience HCM integration fields to organization_settings table
ALTER TABLE public.organization_settings 
ADD COLUMN sapience_hcm_url text,
ADD COLUMN sapience_hcm_username text,
ADD COLUMN sapience_hcm_password text,
ADD COLUMN sapience_hcm_token text,
ADD COLUMN sapience_hcm_token_expires_at timestamp with time zone;