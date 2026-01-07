-- Add attachment path to loan_payments table
ALTER TABLE public.loan_payments
ADD COLUMN IF NOT EXISTS attachment_path TEXT;
