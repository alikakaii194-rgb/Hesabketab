-- HESAB KETAB: MIGRATION SCRIPT (PART 3 OF 4)
-- This script contains: FUNCTIONS & TRIGGERS

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
-- Function 3: Clear a Check (Corrected Typo: cleared_date)
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
