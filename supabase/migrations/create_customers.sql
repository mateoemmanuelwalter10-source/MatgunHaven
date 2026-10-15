CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone text,
  price_per_gallon numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
