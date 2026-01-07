-- HESAB KETAB: MIGRATION SCRIPT (PART 2 OF 4)
-- This script contains: ROW LEVEL SECURITY (RLS) POLICIES

-- ====================================================================
-- PART 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- --------------------------------------------------------------------
-- Enable RLS on all tables
-- --------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- Create Policies: Allow full access for any authenticated user
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.users;
CREATE POLICY "Allow all access to authenticated users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.bank_accounts;
CREATE POLICY "Allow all access to authenticated users" ON public.bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.categories;
CREATE POLICY "Allow all access to authenticated users" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.payees;
CREATE POLICY "Allow all access to authenticated users" ON public.payees FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.expenses;
CREATE POLICY "Allow all access to authenticated users" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.incomes;
CREATE POLICY "Allow all access to authenticated users" ON public.incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.transfers;
CREATE POLICY "Allow all access to authenticated users" ON public.transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.cheques;
CREATE POLICY "Allow all access to authenticated users" ON public.cheques FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.financial_goals;
CREATE POLICY "Allow all access to authenticated users" ON public.financial_goals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.loans;
CREATE POLICY "Allow all access to authenticated users" ON public.loans FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.loan_payments;
CREATE POLICY "Allow all access to authenticated users" ON public.loan_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.debts;
CREATE POLICY "Allow all access to authenticated users" ON public.debts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.debt_payments;
CREATE POLICY "Allow all access to authenticated users" ON public.debt_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.chat_messages;
CREATE POLICY "Allow all access to authenticated users" ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
