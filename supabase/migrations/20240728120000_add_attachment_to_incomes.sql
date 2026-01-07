-- Add attachment path to incomes table
ALTER TABLE public.incomes
ADD COLUMN IF NOT EXISTS attachment_path TEXT;
