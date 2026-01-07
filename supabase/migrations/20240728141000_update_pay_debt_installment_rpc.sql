
CREATE OR REPLACE FUNCTION public.pay_debt_installment(
    p_debt_id uuid,
    p_bank_account_id uuid,
    p_amount numeric,
    p_user_id uuid,
    p_attachment_path text DEFAULT NULL -- New optional parameter
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_debt record;
    v_bank_account record;
    v_expense_category_id uuid;
    v_expense_id uuid;
    v_new_balance numeric;
BEGIN
    -- 1. Fetch the debt details
    SELECT * INTO v_debt
    FROM public.debts
    WHERE id = p_debt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Debt with ID % not found', p_debt_id;
    END IF;

    -- 2. Fetch and lock the bank account row
    SELECT * INTO v_bank_account
    FROM public.bank_accounts
    WHERE id = p_bank_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bank account with ID % not found', p_bank_account_id;
    END IF;

    -- 3. Check for sufficient funds
    IF v_bank_account.balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in the bank account';
    END IF;

    -- 4. Get the default expense category
    SELECT id INTO v_expense_category_id
    FROM public.categories
    WHERE name = 'اقساط و بدهی‌ها' AND type = 'expense';

    IF NOT FOUND THEN
        INSERT INTO public.categories (name, type, owner_id)
        VALUES ('اقساط و بدهی‌ها', 'expense', v_debt.owner_id)
        RETURNING id INTO v_expense_category_id;
    END IF;

    -- 5. Insert the payment as an expense
    INSERT INTO public.expenses (
        amount, description, date, category_id, bank_account_id, 
        owner_id, payee_id, registered_by_user_id, related_debt_id
    )
    VALUES (
        p_amount, 
        'پرداخت بدهی: ' || v_debt.title, 
        NOW(), 
        v_expense_category_id, 
        p_bank_account_id, 
        v_debt.owner_id, 
        v_debt.payee_id, 
        p_user_id,
        p_debt_id
    )
    RETURNING id INTO v_expense_id;

    -- 6. Insert into debt_payments table
    INSERT INTO public.debt_payments (
        debt_id, amount, payment_date, bank_account_id, 
        related_expense_id, attachment_path
    )
    VALUES (
        p_debt_id, p_amount, NOW(), p_bank_account_id, v_expense_id,
        p_attachment_path
    );

    -- 7. Update bank account balance
    UPDATE public.bank_accounts
    SET balance = balance - p_amount
    WHERE id = p_bank_account_id;

END;
$function$;
