-- Add attachment_path to expenses
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add attachment_path to incomes
ALTER TABLE public.incomes
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add image_path to financial_goals
ALTER TABLE public.financial_goals
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add attachment_path to loans
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add attachment_path to loan_payments
ALTER TABLE public.loan_payments
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add attachment_path to debts
ALTER TABLE public.debts
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add attachment_path to debt_payments
ALTER TABLE public.debt_payments
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add image_path and clearance_receipt_path to cheques
ALTER TABLE public.cheques
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS clearance_receipt_path TEXT;

-- ====================================================================
-- PART 2: UPDATE FUNCTIONS TO HANDLE ATTACHMENTS
-- ====================================================================

-- Function: create_check
DROP FUNCTION IF EXISTS public.create_check(text, text, numeric, timestamptz, timestamptz, uuid, uuid, uuid, text, text, text, uuid);
CREATE OR REPLACE FUNCTION public.create_check(p_sayad_id text, p_serial_number text, p_amount numeric, p_issue_date timestamptz, p_due_date timestamptz, p_bank_account_id uuid, p_payee_id uuid, p_category_id uuid, p_description text, p_expense_for text, p_signature_data_url text, p_registered_by_user_id uuid, p_image_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.cheques (sayad_id, serial_number, amount, issue_date, due_date, bank_account_id, payee_id, category_id, description, expense_for, signature_data_url, registered_by_user_id, status, image_path)
  VALUES (p_sayad_id, p_serial_number, p_amount, p_issue_date, p_due_date, p_bank_account_id, p_payee_id, p_category_id, p_description, p_expense_for, p_signature_data_url, p_registered_by_user_id, 'pending', p_image_path);
  
  UPDATE public.bank_accounts
  SET blocked_balance = blocked_balance + p_amount
  WHERE id = p_bank_account_id;
END;
$$;
COMMENT ON FUNCTION public.create_check IS 'Creates a new cheque with "pending" status, blocks the amount, and stores an optional image path.';

-- Function: clear_check
DROP FUNCTION IF EXISTS public.clear_check(uuid, uuid);
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
    SET balance = balance - v_check.amount,
        blocked_balance = blocked_balance - v_check.amount
    WHERE id = v_check.bank_account_id;

    INSERT INTO public.expenses (bank_account_id, category_id, payee_id, amount, date, description, expense_for, check_id, registered_by_user_id, owner_id)
    VALUES (v_check.bank_account_id, v_check.category_id, v_check.payee_id, v_check.amount, now(), v_check.description, v_check.expense_for, v_check.id, p_user_id, v_bank_account.owner_id);

    UPDATE public.cheques
    SET status = 'cleared', cleared_date = now(), updated_at = now(), clearance_receipt_path = p_clearance_receipt_path
    WHERE id = p_check_id;
END;
$$;
COMMENT ON FUNCTION public.clear_check IS 'Atomically clears a cheque, creates an expense, updates balances and stores the receipt path.';

-- Function: pay_loan_installment
DROP FUNCTION IF EXISTS public.pay_loan_installment(uuid, uuid, numeric, uuid);
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
COMMENT ON FUNCTION public.pay_loan_installment IS 'Atomically pays a loan installment, creates an expense, updates balances and saves the receipt.';


-- Function: pay_debt_installment
DROP FUNCTION IF EXISTS public.pay_debt_installment(uuid, uuid, numeric, uuid);
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
COMMENT ON FUNCTION public.pay_debt_installment IS 'Atomically pays a debt installment, creates an expense, updates balances and saves the receipt.';
