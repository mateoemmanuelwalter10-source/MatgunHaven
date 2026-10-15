CREATE TABLE IF NOT EXISTS public.system_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_logs_event_type_not_empty
    CHECK (length(trim(event_type)) > 0),
  CONSTRAINT system_logs_message_not_empty
    CHECK (length(trim(message)) > 0),
  CONSTRAINT system_logs_details_is_object
    CHECK (jsonb_typeof(details) = 'object')
);

COMMENT ON TABLE public.system_logs IS
  'Activity and audit events such as login, logout, errors, create, update, delete, print, export, and imports.';
COMMENT ON COLUMN public.system_logs.event_type IS
  'Free-form event name, for example login, logout, login_failed, create, update, delete, print, export, import, or error.';
COMMENT ON COLUMN public.system_logs.details IS
  'Optional structured event context. Do not store passwords, tokens, or other secrets.';

CREATE INDEX IF NOT EXISTS system_logs_created_at_idx
  ON public.system_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS system_logs_actor_created_at_idx
  ON public.system_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS system_logs_event_created_at_idx
  ON public.system_logs (event_type, created_at DESC);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can write own system logs"
  ON public.system_logs;
CREATE POLICY "Authenticated users can write own system logs"
  ON public.system_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can read system logs"
  ON public.system_logs;
CREATE POLICY "Admins can read system logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND lower(trim(profile.role)) = 'admin'
    )
  );

REVOKE ALL ON TABLE public.system_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.system_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.system_logs_id_seq TO authenticated;

CREATE OR REPLACE FUNCTION public.log_public_auth_failure(p_event_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_event_type NOT IN (
    'login_failed',
    'registration_failed',
    'password_reset_failed'
  ) THEN
    RAISE EXCEPTION 'Unsupported public authentication event';
  END IF;

  INSERT INTO public.system_logs (
    actor_id,
    event_type,
    message,
    details
  )
  VALUES (
    NULL,
    p_event_type,
    CASE p_event_type
      WHEN 'login_failed' THEN 'Authentication attempt failed'
      WHEN 'registration_failed' THEN 'Account registration failed'
      ELSE 'Password reset request failed'
    END,
    '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_public_auth_failure(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_public_auth_failure(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_failed_login()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.log_public_auth_failure('login_failed');
$$;

REVOKE ALL ON FUNCTION public.log_failed_login() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_failed_login() TO anon, authenticated;
