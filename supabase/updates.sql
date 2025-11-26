-- Add columns for intelligent contract filtering
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS unspsc_codes jsonb; -- Array of UNSPSC codes extracted from RUP
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS financial_indicators jsonb; -- Financial metrics (liquidity, debt, etc.)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS experience_summary jsonb; -- Summary of experience (total contracts, value)
