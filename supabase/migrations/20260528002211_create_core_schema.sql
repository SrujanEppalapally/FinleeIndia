/*
  # Core Application Schema

  ## Summary
  Creates all tables required for the personal finance app backend.

  ## Tables Created

  ### users
  - id (uuid, PK) — auth user identity
  - name (text) — display name
  - email (text, unique) — login email
  - phone (text) — phone number
  - password_hash (text) — bcrypt hashed password
  - created_at (timestamptz)

  ### transactions
  - id (uuid, PK)
  - user_id (uuid, FK → users.id)
  - merchant (text) — payee/merchant name
  - category (text) — spending category
  - amount (numeric) — positive value
  - type (text) — 'income' or 'expense'
  - date (date)
  - account (text) — e.g. "HDFC Savings"
  - note (text, nullable)
  - created_at (timestamptz)

  ### budget_categories
  - id (uuid, PK)
  - user_id (uuid, FK → users.id)
  - name (text) — category label
  - month (text) — format YYYY-MM
  - limit_amount (numeric) — monthly budget cap
  - created_at (timestamptz)

  ### networth_items
  - id (uuid, PK)
  - user_id (uuid, FK → users.id)
  - name (text) — asset/liability name
  - value (numeric) — current value
  - category (text) — e.g. savings, investment, home-loan
  - type (text) — 'asset' or 'liability'
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### password_reset_otps
  - id (uuid, PK)
  - email (text)
  - otp (text) — 6-digit code
  - expires_at (timestamptz)
  - used (boolean)
  - created_at (timestamptz)

  ## Security
  - RLS enabled on all tables
  - All data access scoped to authenticated user via user_id
*/

-- Users table (app-managed, separate from Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  amount numeric(14,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'expense' CHECK (type IN ('income','expense')),
  date date NOT NULL DEFAULT CURRENT_DATE,
  account text NOT NULL DEFAULT '',
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);

-- Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  month text NOT NULL DEFAULT '',
  limit_amount numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own budget"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budget_user_month ON budget_categories(user_id, month);

-- Net worth items
CREATE TABLE IF NOT EXISTS networth_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  value numeric(14,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'asset' CHECK (type IN ('asset','liability')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE networth_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own networth items"
  ON networth_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own networth items"
  ON networth_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own networth items"
  ON networth_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own networth items"
  ON networth_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Password reset OTPs (no RLS needed — accessed by service role only)
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_otp_email ON password_reset_otps(email);
