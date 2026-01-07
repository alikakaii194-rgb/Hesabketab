ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'savings';

COMMENT ON COLUMN public.bank_accounts.account_type IS 'Specifies the type of the bank account, e.g., checking or savings.';