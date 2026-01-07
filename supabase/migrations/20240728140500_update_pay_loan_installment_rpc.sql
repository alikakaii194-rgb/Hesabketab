
CREATE OR REPLACE FUNCTION public.pay_loan_installment(
    p_loan_id uuid,
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
    v_loan record;
    v_bank_account record;
    v_expense_category_id uuid;
    v_expense_id uuid;
    v_new_balance numeric;
BEGIN
    -- 1. Fetch the loan details
    SELECT * INTO v_loan
    FROM public.loans
    WHERE id = p_loan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan with ID % not found', p_loan_id;
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

    -- 4. Get the default expense category for loan payments
    SELECT id INTO v_expense_category_id
    FROM public.categories
    WHERE name = 'اقساط و بدهی‌ها' AND type = 'expense';

    IF NOT FOUND THEN
        -- Create the category if it doesn't exist
        INSERT INTO public.categories (name, type, owner_id)
        VALUES ('اقساط و بدهی‌ها', 'expense', v_loan.owner_id)
        RETURNING id INTO v_expense_category_id;
    END IF;

    -- 5. Insert the payment as an expense
    INSERT INTO public.expenses (
        amount, description, date, category_id, bank_account_id, 
        owner_id, payee_id, registered_by_user_id, related_loan_id
    )
    VALUES (
        p_amount, 
        'پرداخت قسط وام: ' || v_loan.title, 
        NOW(), 
        v_expense_category_id, 
        p_bank_account_id, 
        v_loan.owner_id, 
        v_loan.payee_id, 
        p_user_id,
        p_loan_id
    )
    RETURNING id INTO v_expense_id;

    -- 6. Insert into loan_payments table
    INSERT INTO public.loan_payments (
        loan_id, amount, payment_date, bank_account_id, 
        related_expense_id, attachment_path -- Added attachment_path
    )
    VALUES (
        p_loan_id, p_amount, NOW(), p_bank_account_id, v_expense_id,
        p_attachment_path -- Use the new parameter
    );

    -- 7. Update bank account balance
    v_new_balance := v_bank_account.balance - p_amount;
    UPDATE public.bank_accounts
    SET balance = v_new_balance
    WHERE id = p_bank_account_id;

END;
$function$;
