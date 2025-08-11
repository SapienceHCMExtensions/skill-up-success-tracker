-- Add unique constraint for translations upsert support
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'translations_unique_lang_key'
  ) THEN
    ALTER TABLE public.translations
    ADD CONSTRAINT translations_unique_lang_key UNIQUE (language_id, translation_key);
  END IF;
END $$;