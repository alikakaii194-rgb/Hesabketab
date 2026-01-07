-- 1. Add clearance receipt path to cheques table
ALTER TABLE public.cheques
ADD COLUMN IF NOT EXISTS clearance_receipt_path TEXT;

-- 2. Recreate the clear_check function to accept the receipt path
CREATE OR REPLACE FUNCTION public.clear_check(
    p_check_id uuid, 
    p_user_id uuid,
    p_clearance_receipt_path text -- New parameter
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_check public.cheques;
    v_bank_account public.bank_accounts;
    v_new_expense_id uuid;
BEGIN
    -- Lock the check row to prevent race conditions
    SELECT * INTO v_check FROM public.cheques WHERE id = p_check_id FOR UPDATE;
    IF v_check IS NULL THEN RAISE EXCEPTION 'چک یافت نشد.'; END IF;
    IF v_check.status = 'cleared' THEN RAISE EXCEPTION 'این چک قبلاً پاس شده است.'; END IF;

    -- Check account balance
    SELECT * INTO v_bank_account FROM public.bank_accounts WHERE id = v_check.bank_account_id;
    IF (v_bank_account.balance - v_bank_account.blocked_balance) < v_check.amount THEN 
        RAISE EXCEPTION 'موجودی قابل استفاده حساب برای پاس کردن چک کافی نیست.'; 
    END IF;

    -- Update bank account balances
    UPDATE public.bank_accounts
    SET balance = balance - v_check.amount,
        blocked_balance = blocked_balance - v_check.amount
    WHERE id = v_check.bank_account_id;

    -- Create the corresponding expense record and get its ID
    INSERT INTO public.expenses (
        bank_account_id, category_id, payee_id, amount, date, description, 
        expense_for, check_id, registered_by_user_id, owner_id, attachment_path
    )
    VALUES (
        v_check.bank_account_id, v_check.category_id, v_check.payee_id, v_check.amount, now(), v_check.description, 
        v_check.expense_for, v_check.id, p_user_id, v_bank_account.owner_id, p_clearance_receipt_path -- Also save path in expense
    )
    RETURNING id INTO v_new_expense_id;

    -- Update the check status and add the receipt path
    UPDATE public.cheques
    SET status = 'cleared', 
        cleared_date = now(), 
        updated_at = now(),
        clearance_receipt_path = p_clearance_receipt_path -- Save the new path
    WHERE id = p_check_id;
END;
$$;
