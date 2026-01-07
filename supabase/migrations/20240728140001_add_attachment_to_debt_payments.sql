-- Add attachment path to debt_payments table
ALTER TABLE public.debt_payments
ADD COLUMN IF NOT EXISTS attachment_path TEXT;
