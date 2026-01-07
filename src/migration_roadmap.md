-- ====================================================================
-- HESAB KETAB: COMPLETE DATABASE SETUP SCRIPT
-- ====================================================================
-- This script contains all necessary SQL commands to set up the 
-- database from scratch, including tables, policies, functions, 
-- and triggers. Run this entire script once in the Supabase SQL Editor.
-- ====================================================================


-- ====================================================================
-- PART 1: TABLE CREATION
-- ====================================================================

-- --------------------------------------------------------------------
-- Table: users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL PRIMARY KEY,
    email character varying,
    first_name character varying,
    last_name character varying,
    signature_image_path text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.users IS 'User profiles, linked one-to-one with auth.users. Stores app-specific user data.';

-- --------------------------------------------------------------------
-- Table: bank_accounts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id text,
    bank_name text,
    account_number text,
    card_number text,
    expiry_date text,
    cvv2 text,
    account_type text,
    balance numeric,
    initial_balance numeric DEFAULT 0,
    blocked_balance numeric DEFAULT 0,
    theme text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone
);
COMMENT ON TABLE public.bank_accounts IS 'Bank accounts, both personal and shared.';

-- --------------------------------------------------------------------
-- Table: categories
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text,
    description text,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Expense and income categories.';

-- --------------------------------------------------------------------
-- Table: payees
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payees (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text,
    phone_number text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.payees IS 'Payees, such as persons, stores, or organizations.';

-- --------------------------------------------------------------------
-- Table: expenses
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    bank_account_id uuid,
    category_id uuid,
    payee_id uuid,
    amount numeric,
    date timestamp with time zone,
    description text,
    expense_for text,
    sub_type text,
    goal_id uuid,
    loan_payment_id uuid,
    debt_payment_id uuid,
    check_id uuid,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    owner_id text,
    attachment_path text
);
COMMENT ON TABLE public.expenses IS 'Expense transactions.';

-- --------------------------------------------------------------------
-- Table: incomes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    bank_account_id uuid,
    source_text text,
    owner_id text,
    category text,
    amount numeric,
    date timestamp with time zone,
    description text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    attachment_path text
);
COMMENT ON TABLE public.incomes IS 'Income transactions.';

-- --------------------------------------------------------------------
-- Table: transfers
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    from_bank_account_id uuid,
    to_bank_account_id uuid,
    amount numeric,
    transfer_date timestamp with time zone,
    description text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    from_account_balance_before numeric,
    from_account_balance_after numeric,
    to_account_balance_before numeric,
    to_account_balance_after numeric
);
COMMENT ON TABLE public.transfers IS 'Internal account-to-account transfers.';

-- --------------------------------------------------------------------
-- Table: cheques
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cheques (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sayad_id text,
    serial_number text,
    amount numeric,
    issue_date timestamp with time zone,
    due_date timestamp with time zone,
    status text DEFAULT 'pending'::text,
    bank_account_id uuid,
    payee_id uuid,
    category_id uuid,
    description text,
    expense_for text,
    cleared_date timestamp with time zone,
    signature_data_url text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_path text,
    clearance_receipt_path text
);
COMMENT ON TABLE public.cheques IS 'Manages outgoing cheques as future liabilities.';

-- --------------------------------------------------------------------
-- Table: financial_goals
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text,
    target_amount numeric,
    current_amount numeric DEFAULT 0,
    target_date timestamp with time zone,
    priority text,
    is_achieved boolean DEFAULT false,
    actual_cost numeric,
    owner_id text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_path text
);
COMMENT ON TABLE public.financial_goals IS 'Financial goals for users.';

-- --------------------------------------------------------------------
-- Table: loans
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text,
    amount numeric,
    remaining_amount numeric,
    installment_amount numeric,
    number_of_installments integer,
    paid_installments integer DEFAULT 0,
    start_date timestamp with time zone,
    first_installment_date timestamptz,
    payment_day integer,
    payee_id uuid,
    deposit_on_create boolean DEFAULT false,
    deposit_to_account_id uuid,
    owner_id text,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    attachment_path text
);
COMMENT ON TABLE public.loans IS 'Loans taken (money borrowed), typically structured with installments.';

-- --------------------------------------------------------------------
-- Table: loan_payments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    loan_id uuid,
    expense_id uuid,
    amount numeric,
    payment_date timestamp with time zone,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    attachment_path text
);
COMMENT ON TABLE public.loan_payments IS 'Records of loan installment payments. Each payment is also an expense.';

-- --------------------------------------------------------------------
-- Table: debts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    description text,
    amount numeric,
    remaining_amount numeric,
    payee_id uuid,
    is_installment boolean DEFAULT false,
    due_date timestamp with time zone,
    installment_amount numeric,
    first_installment_date timestamptz,
    number_of_installments integer,
    paid_installments integer DEFAULT 0,
    owner_id text,
    registered_by_user_id uuid,
    start_date timestamptz,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    attachment_path text
);
COMMENT ON TABLE public.debts IS 'Debts owed to others, can be single payment or informal installments.';

-- --------------------------------------------------------------------
-- Table: debt_payments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    debt_id uuid,
    expense_id uuid,
    amount numeric,
    payment_date timestamp with time zone,
    registered_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    attachment_path text
);
COMMENT ON TABLE public.debt_payments IS 'Records payments made towards a debt. Each payment is also an expense.';

-- --------------------------------------------------------------------
-- Table: chat_messages
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sender_id text,
    sender_name text,
    text text,
    read_by uuid[],
    type text,
    transaction_details jsonb,
    reply_to_message_id uuid,
    "timestamp" timestamp with time zone
);
COMMENT ON TABLE public.chat_messages IS 'Messages in the in-app chat.';


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


-- ====================================================================
-- PART 3: FUNCTIONS & TRIGGERS
-- ====================================================================

-- --------------------------------------------------------------------
-- Function 1: Handle New User
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, signature_image_path)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email ILIKE 'ali@%' THEN 'علی'
      ELSE 'فاطمه'
    END,
    CASE 
      WHEN NEW.email ILIKE 'ali@%' THEN 'کاکایی'
      ELSE 'صالح'
    END,
    CASE 
      WHEN NEW.email ILIKE 'ali@%' THEN '/images/ali-signature.png'
      ELSE '/images/fatemeh-signature.png'
    END
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user profile upon new user registration in auth.users.';


-- --------------------------------------------------------------------
-- Function 2: Create a Check
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_check(p_sayad_id text, p_serial_number text, p_amount numeric, p_issue_date timestamptz, p_due_date timestamptz, p_bank_account_id uuid, p_payee_id uuid, p_category_id uuid, p_description text, p_expense_for text, p_signature_data_url text, p_registered_by_user_id uuid, p_image_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bank_account public.bank_accounts;
BEGIN
    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = p_bank_account_id;
    
    INSERT INTO public.cheques (sayad_id, serial_number, amount, issue_date, due_date, bank_account_id, payee_id, category_id, description, expense_for, signature_data_url, registered_by_user_id, status, image_path, owner_id)
    VALUES (p_sayad_id, p_serial_number, p_amount, p_issue_date, p_due_date, p_bank_account_id, p_payee_id, p_category_id, p_description, p_expense_for, p_signature_data_url, p_registered_by_user_id, 'pending', p_image_path, v_bank_account.owner_id);
END;
$$;
COMMENT ON FUNCTION public.create_check IS 'Creates a new cheque with "pending" status and sets the owner_id based on the bank account.';

-- --------------------------------------------------------------------
-- Function 3: Clear a Check
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_check(p_check_id uuid, p_user_id uuid, p_clearance_receipt_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check public.cheques;
    v_bank_account public.bank_accounts;
BEGIN
    SELECT * INTO v_check FROM public.cheques WHERE id = p_check_id FOR UPDATE;
    IF v_check IS NULL THEN RAISE EXCEPTION 'چک یافت نشد.'; END IF;
    IF v_check.status = 'cleared' THEN RAISE EXCEPTION 'این چک قبلاً پاس شده است.'; END IF;

    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = v_check.bank_account_id;
    IF (v_bank_account.balance - v_bank_account.blocked_balance) < v_check.amount THEN RAISE EXCEPTION 'موجودی قابل استفاده حساب برای پاس کردن چک کافی نیست.'; END IF;

    UPDATE public.bank_accounts
    SET balance = balance - v_check.amount
    WHERE id = v_check.bank_account_id;

    INSERT INTO public.expenses (bank_account_id, category_id, payee_id, amount, date, description, expense_for, check_id, registered_by_user_id, owner_id, attachment_path)
    VALUES (v_check.bank_account_id, v_check.category_id, v_check.payee_id, v_check.amount, now(), 'پاس شدن چک: ' || v_check.description, v_check.expense_for, v_check.id, p_user_id, v_check.owner_id, p_clearance_receipt_path);

    UPDATE public.cheques
    SET status = 'cleared', cleared_date = now(), updated_at = now(), clearance_receipt_path = p_clearance_receipt_path
    WHERE id = p_check_id;
END;
$$;
COMMENT ON FUNCTION public.clear_check IS 'Atomically clears a cheque, creates an expense, updates balance, and stores the receipt path.';

-- --------------------------------------------------------------------
-- Function 4: Delete a Check
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_check(p_check_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check public.cheques;
BEGIN
    SELECT * INTO v_check FROM public.cheques WHERE id = p_check_id;
    IF v_check IS NULL THEN RAISE EXCEPTION 'چک یافت نشد.'; END IF;
    IF v_check.status = 'cleared' THEN RAISE EXCEPTION 'امکان حذف چک پاس شده وجود ندارد.'; END IF;

    DELETE FROM public.cheques WHERE id = p_check_id;
END;
$$;
COMMENT ON FUNCTION public.delete_check IS 'Safely deletes a non-cleared cheque.';


-- --------------------------------------------------------------------
-- Function 5: Create a Loan
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_loan(p_title text, p_amount numeric, p_owner_id text, p_installment_amount numeric, p_number_of_installments integer, p_start_date timestamptz, p_first_installment_date timestamptz, p_payee_id uuid, p_deposit_on_create boolean, p_deposit_to_account_id uuid, p_registered_by_user_id uuid, p_attachment_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.loans (title, amount, remaining_amount, owner_id, installment_amount, number_of_installments, start_date, first_installment_date, payee_id, deposit_to_account_id, registered_by_user_id, attachment_path)
  VALUES (p_title, p_amount, p_amount, p_owner_id, p_installment_amount, p_number_of_installments, p_start_date, p_first_installment_date, p_payee_id, p_deposit_to_account_id, p_registered_by_user_id, p_attachment_path);
  
  IF p_deposit_on_create AND p_deposit_to_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts SET balance = balance + p_amount WHERE id = p_deposit_to_account_id;
  END IF;
END;
$$;
COMMENT ON FUNCTION public.create_loan IS 'Creates a new loan and optionally deposits the amount into a bank account.';

-- --------------------------------------------------------------------
-- Function 6: Pay a Loan Installment
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pay_loan_installment(p_loan_id uuid, p_bank_account_id uuid, p_amount numeric, p_user_id uuid, p_attachment_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_loan public.loans;
    v_bank_account public.bank_accounts;
    v_expense_category public.categories;
    v_new_expense_id uuid;
    v_new_loan_payment_id uuid;
BEGIN
    SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
    IF v_loan IS NULL THEN RAISE EXCEPTION 'وام یافت نشد.'; END IF;
    IF v_loan.remaining_amount < p_amount THEN RAISE EXCEPTION 'مبلغ قسط از باقیمانده وام بیشتر است.'; END IF;

    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = p_bank_account_id;
    IF (v_bank_account.balance - v_bank_account.blocked_balance) < p_amount THEN RAISE EXCEPTION 'موجودی قابل استفاده حساب کافی نیست.'; END IF;

    SELECT * INTO v_expense_category FROM public.categories WHERE name LIKE '%اقساط%' LIMIT 1;
    IF v_expense_category IS NULL THEN 
      INSERT INTO public.categories(name, description) VALUES ('پرداخت اقساط', 'دسته‌بندی خودکار برای پرداخت اقساط وام و بدهی') RETURNING * INTO v_expense_category;
    END IF;

    UPDATE public.bank_accounts SET balance = balance - p_amount WHERE id = p_bank_account_id;

    INSERT INTO public.loan_payments (loan_id, amount, payment_date, registered_by_user_id, attachment_path)
    VALUES (p_loan_id, p_amount, now(), p_user_id, p_attachment_path) RETURNING id INTO v_new_loan_payment_id;

    INSERT INTO public.expenses (bank_account_id, category_id, payee_id, amount, date, description, expense_for, sub_type, registered_by_user_id, owner_id, loan_payment_id, attachment_path)
    VALUES (p_bank_account_id, v_expense_category.id, v_loan.payee_id, p_amount, now(), 'پرداخت قسط وام: ' || v_loan.title, v_loan.owner_id, 'loan_payment', p_user_id, v_bank_account.owner_id, v_new_loan_payment_id, p_attachment_path)
    RETURNING id INTO v_new_expense_id;

    UPDATE public.loan_payments SET expense_id = v_new_expense_id WHERE id = v_new_loan_payment_id;

    UPDATE public.loans
    SET remaining_amount = remaining_amount - p_amount,
        paid_installments = paid_installments + 1,
        updated_at = now()
    WHERE id = p_loan_id;
END;
$$;
COMMENT ON FUNCTION public.pay_loan_installment IS 'Atomically pays a loan installment, creating an expense and updating balances.';

-- --------------------------------------------------------------------
-- Function 7: Delete a Loan
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_loan(p_loan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_count integer;
    v_loan public.loans;
BEGIN
    SELECT count(*) INTO payment_count FROM public.loan_payments WHERE loan_id = p_loan_id;
    IF payment_count > 0 THEN RAISE EXCEPTION 'این وام دارای سابقه پرداخت است و قابل حذف نیست.'; END IF;
    
    SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
    IF v_loan.deposit_to_account_id IS NOT NULL THEN
        UPDATE public.bank_accounts
        SET balance = balance - v_loan.amount
        WHERE id = v_loan.deposit_to_account_id;
    END IF;

    DELETE FROM public.loans WHERE id = p_loan_id;
END;
$$;
COMMENT ON FUNCTION public.delete_loan IS 'Safely deletes a loan only if no payments have been made.';


-- --------------------------------------------------------------------
-- Functions 8 & 9: Pay and Delete a Debt
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pay_debt_installment(p_debt_id uuid, p_bank_account_id uuid, p_amount numeric, p_user_id uuid, p_attachment_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt public.debts;
    v_bank_account public.bank_accounts;
    v_expense_category public.categories;
    v_new_expense_id uuid;
    v_new_debt_payment_id uuid;
BEGIN
    SELECT * INTO v_debt FROM public.debts WHERE id = p_debt_id FOR UPDATE;
    IF v_debt IS NULL THEN RAISE EXCEPTION 'بدهی یافت نشد.'; END IF;
    IF v_debt.remaining_amount < p_amount THEN RAISE EXCEPTION 'مبلغ پرداختی از باقیمانده بدهی بیشتر است.'; END IF;

    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = p_bank_account_id;
    IF (v_bank_account.balance - v_bank_account.blocked_balance) < p_amount THEN RAISE EXCEPTION 'موجودی قابل استفاده حساب کافی نیست.'; END IF;
    
    SELECT * INTO v_expense_category FROM public.categories WHERE name LIKE '%اقساط%' LIMIT 1;
    IF v_expense_category IS NULL THEN 
      INSERT INTO public.categories(name, description) VALUES ('پرداخت اقساط', 'دسته‌بندی خودکار برای پرداخت اقساط وام و بدهی') RETURNING * INTO v_expense_category;
    END IF;

    UPDATE public.bank_accounts SET balance = balance - p_amount WHERE id = p_bank_account_id;
    
    INSERT INTO public.debt_payments (debt_id, amount, payment_date, registered_by_user_id, attachment_path)
    VALUES (p_debt_id, p_amount, now(), p_user_id, p_attachment_path) RETURNING id INTO v_new_debt_payment_id;

    INSERT INTO public.expenses (bank_account_id, category_id, payee_id, amount, date, description, expense_for, sub_type, registered_by_user_id, owner_id, debt_payment_id, attachment_path)
    VALUES (p_bank_account_id, v_expense_category.id, v_debt.payee_id, p_amount, now(), 'پرداخت بدهی: ' || v_debt.description, v_debt.owner_id, 'debt_payment', p_user_id, v_bank_account.owner_id, v_new_debt_payment_id, p_attachment_path)
    RETURNING id INTO v_new_expense_id;
    
    UPDATE public.debt_payments SET expense_id = v_new_expense_id WHERE id = v_new_debt_payment_id;

    UPDATE public.debts
    SET remaining_amount = remaining_amount - p_amount,
        paid_installments = CASE WHEN is_installment THEN paid_installments + 1 ELSE paid_installments END,
        updated_at = now()
    WHERE id = p_debt_id;
END;
$$;
COMMENT ON FUNCTION public.pay_debt_installment IS 'Atomically pays a debt installment, creating an expense and updating balances.';


CREATE OR REPLACE FUNCTION public.delete_debt(p_debt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_count integer;
BEGIN
    SELECT count(*) INTO payment_count FROM public.debt_payments WHERE debt_id = p_debt_id;
    IF payment_count > 0 THEN RAISE EXCEPTION 'این بدهی دارای سابقه پرداخت است و قابل حذف نیست.'; END IF;
    DELETE FROM public.debts WHERE id = p_debt_id;
END;
$$;
COMMENT ON FUNCTION public.delete_debt IS 'Safely deletes a debt only if no payments have been made.';


-- --------------------------------------------------------------------
-- Functions 10 & 11: Create and Delete an Internal Transfer
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_transfer(p_from_account_id uuid, p_to_account_id uuid, p_amount numeric, p_description text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_from_balance_before numeric;
    v_to_balance_before numeric;
    v_from_account public.bank_accounts;
BEGIN
    IF p_from_account_id = p_to_account_id THEN RAISE EXCEPTION 'حساب مبدا و مقصد نمی‌توانند یکسان باشند.'; END IF;
    
    SELECT * INTO v_from_account FROM public.bank_accounts WHERE id = p_from_account_id FOR UPDATE;
    SELECT balance INTO v_to_balance_before FROM public.bank_accounts WHERE id = p_to_account_id FOR UPDATE;

    IF (v_from_account.balance - v_from_account.blocked_balance) < p_amount THEN
        RAISE EXCEPTION 'موجودی قابل استفاده حساب مبدا کافی نیست.';
    END IF;

    UPDATE public.bank_accounts SET balance = balance - p_amount WHERE id = p_from_account_id;
    UPDATE public.bank_accounts SET balance = balance + p_amount WHERE id = p_to_account_id;

    INSERT INTO public.transfers (
        from_bank_account_id, to_bank_account_id, amount, description, registered_by_user_id,
        transfer_date, from_account_balance_before, from_account_balance_after, to_account_balance_before, to_account_balance_after
    ) VALUES (
        p_from_account_id, p_to_account_id, p_amount, p_description, p_user_id,
        now(), v_from_account.balance, v_from_account.balance - p_amount, v_to_balance_before, v_to_balance_before + p_amount
    );
END;
$$;
COMMENT ON FUNCTION public.create_transfer IS 'Atomically creates an internal transfer between two accounts.';


CREATE OR REPLACE FUNCTION public.delete_transfer(p_transfer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transfer public.transfers;
BEGIN
    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id FOR UPDATE;
    IF v_transfer IS NULL THEN RAISE EXCEPTION 'تراکنش انتقال یافت نشد.'; END IF;

    -- Revert balances
    UPDATE public.bank_accounts SET balance = balance + v_transfer.amount WHERE id = v_transfer.from_bank_account_id;
    UPDATE public.bank_accounts SET balance = balance - v_transfer.amount WHERE id = v_transfer.to_bank_account_id;

    DELETE FROM public.transfers WHERE id = p_transfer_id;
END;
$$;
COMMENT ON FUNCTION public.delete_transfer IS 'Atomically deletes a transfer and reverts the balance changes.';


-- --------------------------------------------------------------------
-- Functions 12, 13, 14: Financial Goal Management
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_contribution_to_goal(p_goal_id uuid, p_bank_account_id uuid, p_amount numeric, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal public.financial_goals;
    v_bank_account public.bank_accounts;
    v_expense_category public.categories;
BEGIN
    SELECT * INTO v_goal FROM public.financial_goals WHERE id = p_goal_id FOR UPDATE;
    IF v_goal IS NULL THEN RAISE EXCEPTION 'هدف مالی یافت نشد.'; END IF;
    
    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = p_bank_account_id FOR UPDATE;
    IF v_bank_account IS NULL THEN RAISE EXCEPTION 'حساب بانکی یافت نشد.'; END IF;
    
    IF (v_bank_account.balance - v_bank_account.blocked_balance) < p_amount THEN
        RAISE EXCEPTION 'موجودی قابل استفاده حساب کافی نیست.';
    END IF;

    SELECT * INTO v_expense_category FROM public.categories WHERE name LIKE '%پس‌انداز%' LIMIT 1;
    IF v_expense_category IS NULL THEN 
      INSERT INTO public.categories(name, description) VALUES ('پس‌انداز برای اهداف', 'دسته‌بندی خودکار برای کمک به اهداف مالی') RETURNING * INTO v_expense_category;
    END IF;

    UPDATE public.bank_accounts 
    SET blocked_balance = blocked_balance + p_amount
    WHERE id = p_bank_account_id;
    
    UPDATE public.financial_goals
    SET current_amount = current_amount + p_amount,
        updated_at = now()
    WHERE id = p_goal_id;

    INSERT INTO public.expenses (description, amount, date, bank_account_id, category_id, expense_for, sub_type, goal_id, registered_by_user_id, owner_id)
    VALUES ('پس‌انداز برای هدف: ' || v_goal.name, p_amount, now(), p_bank_account_id, v_expense_category.id, v_goal.owner_id, 'goal_contribution', p_goal_id, p_user_id, v_bank_account.owner_id);

END;
$$;
COMMENT ON FUNCTION public.add_contribution_to_goal IS 'Atomically adds a contribution to a goal, creating an expense and managing balances.';

CREATE OR REPLACE FUNCTION public.achieve_financial_goal(p_goal_id uuid, p_actual_cost numeric, p_user_id uuid, p_payment_card_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal public.financial_goals;
    v_account public.bank_accounts;
    v_cash_payment_needed numeric;
    v_expense_category public.categories;
    v_contribution RECORD;
BEGIN
    SELECT * INTO v_goal FROM public.financial_goals WHERE id = p_goal_id FOR UPDATE;
    IF v_goal IS NULL THEN RAISE EXCEPTION 'هدف مالی یافت نشد.'; END IF;
    IF v_goal.is_achieved THEN RAISE EXCEPTION 'این هدف قبلاً محقق شده است.'; END IF;

    -- Unblock the saved amount from all contributing accounts and deduct from main balance
    FOR v_contribution IN
        SELECT exp.amount, exp.bank_account_id
        FROM public.expenses AS exp WHERE exp.goal_id = p_goal_id AND exp.sub_type = 'goal_contribution'
    LOOP
        UPDATE public.bank_accounts 
        SET balance = balance - v_contribution.amount,
            blocked_balance = blocked_balance - v_contribution.amount 
        WHERE id = v_contribution.bank_account_id;
    END LOOP;

    v_cash_payment_needed := p_actual_cost - v_goal.current_amount;

    IF v_cash_payment_needed > 0 THEN
        IF p_payment_card_id IS NULL THEN RAISE EXCEPTION 'برای پرداخت مابقی هزینه، انتخاب کارت الزامی است.'; END IF;
        
        SELECT * INTO v_account FROM public.bank_accounts WHERE id = p_payment_card_id;
        IF (v_account.balance - v_account.blocked_balance) < v_cash_payment_needed THEN RAISE EXCEPTION 'موجودی کارت انتخابی برای پرداخت مابقی هزینه کافی نیست.'; END IF;
        
        UPDATE public.bank_accounts SET balance = balance - v_cash_payment_needed WHERE id = p_payment_card_id;
        
        SELECT * INTO v_expense_category FROM public.categories WHERE name LIKE '%پس‌انداز%' LIMIT 1;
        IF v_expense_category IS NULL THEN 
          INSERT INTO public.categories(name, description) VALUES ('خرید از محل پس‌انداز', 'هزینه‌های مربوط به تحقق اهداف مالی') RETURNING * INTO v_expense_category;
        END IF;

        INSERT INTO public.expenses (description, amount, date, bank_account_id, category_id, expense_for, registered_by_user_id, owner_id)
        VALUES ('پرداخت نقدی برای تحقق هدف: ' || v_goal.name, v_cash_payment_needed, now(), p_payment_card_id, v_expense_category.id, v_goal.owner_id, p_user_id, v_account.owner_id);
    END IF;

    UPDATE public.financial_goals
    SET is_achieved = true, actual_cost = p_actual_cost, updated_at = now()
    WHERE id = p_goal_id;
END;
$$;
COMMENT ON FUNCTION public.achieve_financial_goal IS 'Handles the logic for achieving a financial goal.';


CREATE OR REPLACE FUNCTION public.revert_financial_goal(p_goal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal public.financial_goals;
    v_cash_expense public.expenses;
    v_cash_payment_needed numeric;
    v_contribution RECORD;
BEGIN
    SELECT * INTO v_goal FROM public.financial_goals WHERE id = p_goal_id FOR UPDATE;
    IF v_goal IS NULL THEN RAISE EXCEPTION 'هدف مالی یافت نشد.'; END IF;
    IF NOT v_goal.is_achieved THEN RAISE EXCEPTION 'این هدف هنوز محقق نشده است که بازگردانی شود.'; END IF;

    -- Re-block the contributed amounts and add back to main balance
    FOR v_contribution IN
        SELECT exp.amount, exp.bank_account_id
        FROM public.expenses AS exp WHERE exp.goal_id = p_goal_id AND exp.sub_type = 'goal_contribution'
    LOOP
        UPDATE public.bank_accounts 
        SET balance = balance + v_contribution.amount,
            blocked_balance = blocked_balance + v_contribution.amount 
        WHERE id = v_contribution.bank_account_id;
    END LOOP;
    
    -- Revert the cash portion payment if it exists
    v_cash_payment_needed := v_goal.actual_cost - v_goal.current_amount;
    IF v_cash_payment_needed > 0 THEN
        SELECT * INTO v_cash_expense FROM public.expenses WHERE description = 'پرداخت نقدی برای تحقق هدف: ' || v_goal.name LIMIT 1;
        IF v_cash_expense IS NOT NULL THEN
            UPDATE public.bank_accounts SET balance = balance + v_cash_payment_needed WHERE id = v_cash_expense.bank_account_id;
            DELETE FROM public.expenses WHERE id = v_cash_expense.id;
        END IF;
    END IF;

    -- Revert the goal status
    UPDATE public.financial_goals SET is_achieved = false, actual_cost = NULL, updated_at = now() WHERE id = p_goal_id;
END;
$$;
COMMENT ON FUNCTION public.revert_financial_goal IS 'Reverts an achieved financial goal to its previous state.';


CREATE OR REPLACE FUNCTION public.delete_financial_goal(p_goal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal public.financial_goals;
    v_contribution RECORD;
BEGIN
    SELECT * INTO v_goal FROM public.financial_goals WHERE id = p_goal_id FOR UPDATE;
    IF v_goal IS NULL THEN RAISE EXCEPTION 'هدف مالی یافت نشد.'; END IF;
    IF v_goal.is_achieved THEN RAISE EXCEPTION 'ابتدا باید هدف را بازگردانی کنید تا بتوانید آن را حذف کنید.'; END IF;

    -- Find all contributions, revert balances, and delete the expense records
    FOR v_contribution IN
        SELECT exp.id as expense_id, exp.amount, exp.bank_account_id
        FROM public.expenses AS exp WHERE exp.goal_id = p_goal_id AND exp.sub_type = 'goal_contribution'
    LOOP
        -- Revert balances (remove from blocked balance, balance itself is not changed as it is just a contribution)
        UPDATE public.bank_accounts 
        SET blocked_balance = blocked_balance - v_contribution.amount 
        WHERE id = v_contribution.bank_account_id;
        
        -- Delete the contribution expense
        DELETE FROM public.expenses WHERE id = v_contribution.expense_id;
    END LOOP;
    
    -- Also update the goal''s current amount to 0
    UPDATE public.financial_goals SET current_amount = 0 WHERE id = p_goal_id;

    -- Finally, delete the goal itself
    DELETE FROM public.financial_goals WHERE id = p_goal_id;
END;
$$;
COMMENT ON FUNCTION public.delete_financial_goal IS 'Safely deletes a goal and reverts all its financial contributions.';

-- --------------------------------------------------------------------
-- Function 15: Get All Users
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email character varying, first_name character varying, last_name character varying, signature_image_path text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, email, first_name, last_name, signature_image_path FROM public.users;
$$;
COMMENT ON FUNCTION public.get_all_users() IS 'Securely fetches a list of all user profiles.';

-- --------------------------------------------------------------------
-- ATOMIC TRANSACTION FUNCTIONS
-- --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_expense(p_amount numeric, p_description text, p_date timestamptz, p_bank_account_id uuid, p_category_id uuid, p_payee_id uuid, p_expense_for text, p_owner_id text, p_registered_by_user_id uuid, p_attachment_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account public.bank_accounts;
BEGIN
    SELECT * INTO v_account FROM public.bank_accounts WHERE id = p_bank_account_id FOR UPDATE;

    IF (v_account.balance - v_account.blocked_balance) < p_amount THEN
        RAISE EXCEPTION 'موجودی قابل استفاده حساب برای انجام این هزینه کافی نیست.';
    END IF;

    UPDATE public.bank_accounts SET balance = balance - p_amount WHERE id = p_bank_account_id;

    INSERT INTO public.expenses (amount, description, date, bank_account_id, category_id, payee_id, expense_for, owner_id, registered_by_user_id, attachment_path)
    VALUES (p_amount, p_description, p_date, p_bank_account_id, p_category_id, p_payee_id, p_expense_for, p_owner_id, p_registered_by_user_id, p_attachment_path);
END;
$$;
COMMENT ON FUNCTION public.create_expense IS 'Atomically creates an expense and deducts the amount from the bank account balance.';


CREATE OR REPLACE FUNCTION public.delete_expense(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expense public.expenses;
BEGIN
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id FOR UPDATE;
    IF v_expense IS NULL THEN RAISE EXCEPTION 'هزینه یافت نشد.'; END IF;

    UPDATE public.bank_accounts SET balance = balance + v_expense.amount WHERE id = v_expense.bank_account_id;
    
    DELETE FROM public.expenses WHERE id = p_expense_id;
END;
$$;
COMMENT ON FUNCTION public.delete_expense IS 'Atomically deletes an expense and reverts the bank account balance.';


CREATE OR REPLACE FUNCTION public.create_income(p_amount numeric, p_description text, p_date timestamptz, p_bank_account_id uuid, p_owner_id text, p_source_text text, p_registered_by_user_id uuid, p_attachment_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.bank_accounts SET balance = balance + p_amount WHERE id = p_bank_account_id;

    INSERT INTO public.incomes (amount, description, date, bank_account_id, owner_id, source_text, category, registered_by_user_id, attachment_path)
    VALUES (p_amount, p_description, p_date, p_bank_account_id, p_owner_id, p_source_text, 'درآمد', p_registered_by_user_id, p_attachment_path);
END;
$$;
COMMENT ON FUNCTION public.create_income IS 'Atomically creates an income and adds the amount to the bank account balance.';


CREATE OR REPLACE FUNCTION public.delete_income(p_income_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_income public.incomes;
BEGIN
    SELECT * INTO v_income FROM public.incomes WHERE id = p_income_id FOR UPDATE;
    IF v_income IS NULL THEN RAISE EXCEPTION 'درآمد یافت نشد.'; END IF;

    UPDATE public.bank_accounts SET balance = balance - v_income.amount WHERE id = v_income.bank_account_id;
    
    DELETE FROM public.incomes WHERE id = p_income_id;
END;
$$;
COMMENT ON FUNCTION public.delete_income IS 'Atomically deletes an income and reverts the bank account balance.';


-- ====================================================================
-- PART 4: FINAL TRIGGER CREATION
-- ====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.get_all_users() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION public.create_expense(numeric, text, timestamptz, uuid, uuid, uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_income(numeric, text, timestamptz, uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_income(uuid) TO authenticated;


-- ====================================================================
-- END OF SCRIPT
-- ====================================================================
