-- ReceiptGen Engine — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query

-- 1. Receipts / Ledger table
CREATE TABLE IF NOT EXISTS receipts (
  id                TEXT PRIMARY KEY,
  customer_name     TEXT NOT NULL,
  phone_number      TEXT NOT NULL,
  timestamp         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'SALES',
  items             JSONB NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax               NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total             NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes             TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Client Directory table
CREATE TABLE IF NOT EXISTS directory (
  phone                    TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  last_transaction_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_transactions       INTEGER NOT NULL DEFAULT 0,
  last_transaction_date    TEXT NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE receipts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory ENABLE ROW LEVEL SECURITY;

-- 4. Allow full public access (tighten these policies before going to production)
CREATE POLICY "Allow all on receipts"  ON receipts  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on directory" ON directory FOR ALL USING (true) WITH CHECK (true);
