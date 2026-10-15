ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT 'Purified Drinking Station';
