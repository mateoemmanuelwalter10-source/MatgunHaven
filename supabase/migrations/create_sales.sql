CREATE TABLE sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  gallons numeric NOT NULL,
  price_per_gallon numeric NOT NULL,
  total_amount numeric NOT NULL,
  sale_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
