CREATE TABLE company_settings (
  id serial PRIMARY KEY,
  company_name text,
  timezone text,
  created_at timestamptz DEFAULT now()
);
