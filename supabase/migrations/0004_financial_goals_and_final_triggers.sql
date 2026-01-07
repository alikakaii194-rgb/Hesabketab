-- ====================================================================
-- HESAB KETAB: MIGRATION SCRIPT 4 of 4
-- Financial Goal Logic & Final Triggers
-- ====================================================================

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

    -- Block the amount in the bank account, but don't deduct from main balance yet
    UPDATE public.bank_accounts 
    SET blocked_balance = blocked_balance + p_amount,
        updated_at = now()
    WHERE id = p_bank_account_id;
    
    -- This now just tracks the goal's progress, not a separate balance.
    UPDATE public.financial_goals
    SET current_amount = current_amount + p_amount,
        updated_at = now()
    WHERE id = p_goal_id;

    -- Create an expense record to track the contribution
    INSERT INTO public.expenses (description, amount, date, bank_account_id, category_id, expense_for, sub_type, goal_id, registered_by_user_id, owner_id)
    VALUES ('پس‌انداز برای هدف: ' || v_goal.name, p_amount, now(), p_bank_account_id, v_expense_category.id, v_goal.owner_id, 'goal_contribution', p_goal_id, p_user_id, v_bank_account.owner_id);

END;
$$;
COMMENT ON FUNCTION public.add_contribution_to_goal(uuid, uuid, numeric, uuid) IS 'Atomically adds a contribution to a goal, creating an expense and managing balances.';

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
            blocked_balance = blocked_balance - v_contribution.amount,
            updated_at = now()
        WHERE id = v_contribution.bank_account_id;
    END LOOP;

    v_cash_payment_needed := p_actual_cost - v_goal.current_amount;

    IF v_cash_payment_needed > 0 THEN
        IF p_payment_card_id IS NULL THEN RAISE EXCEPTION 'برای پرداخت مابقی هزینه، انتخاب کارت الزامی است.'; END IF;
        
        SELECT * INTO v_account FROM public.bank_accounts WHERE id = p_payment_card_id;
        IF (v_account.balance - v_account.blocked_balance) < v_cash_payment_needed THEN RAISE EXCEPTION 'موجودی کارت انتخابی برای پرداخت مابقی هزینه کافی نیست.'; END IF;
        
        UPDATE public.bank_accounts SET balance = balance - v_cash_payment_needed, updated_at = now() WHERE id = p_payment_card_id;
        
        SELECT * INTO v_expense_category FROM public.categories WHERE name LIKE '%خرید از محل پس‌انداز%' LIMIT 1;
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
COMMENT ON FUNCTION public.achieve_financial_goal(uuid, numeric, uuid, uuid) IS 'Handles the logic for achieving a financial goal.';


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
            blocked_balance = blocked_balance + v_contribution.amount,
            updated_at = now()
        WHERE id = v_contribution.bank_account_id;
    END LOOP;
    
    -- Revert the cash portion payment if it exists
    v_cash_payment_needed := v_goal.actual_cost - v_goal.current_amount;
    IF v_cash_payment_needed > 0 THEN
        SELECT * INTO v_cash_expense FROM public.expenses WHERE description = 'پرداخت نقدی برای تحقق هدف: ' || v_goal.name LIMIT 1;
        IF v_cash_expense IS NOT NULL THEN
            UPDATE public.bank_accounts SET balance = balance + v_cash_payment_needed, updated_at = now() WHERE id = v_cash_expense.bank_account_id;
            DELETE FROM public.expenses WHERE id = v_cash_expense.id;
        END IF;
    END IF;

    -- Revert the goal status
    UPDATE public.financial_goals SET is_achieved = false, actual_cost = NULL, updated_at = now() WHERE id = p_goal_id;
END;
$$;
COMMENT ON FUNCTION public.revert_financial_goal(uuid) IS 'Reverts an achieved financial goal to its previous state.';


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
        SET blocked_balance = blocked_balance - v_contribution.amount,
            updated_at = now()
        WHERE id = v_contribution.bank_account_id;
        
        -- Delete the contribution expense
        DELETE FROM public.expenses WHERE id = v_contribution.expense_id;
    END LOOP;
    
    -- Also update the goal's current amount to 0
    UPDATE public.financial_goals SET current_amount = 0, updated_at = now() WHERE id = p_goal_id;

    -- Finally, delete the goal itself
    DELETE FROM public.financial_goals WHERE id = p_goal_id;
END;
$$;
COMMENT ON FUNCTION public.delete_financial_goal(uuid) IS 'Safely deletes a goal and reverts all its financial contributions.';

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


-- ====================================================================
-- PART 4: FINAL TRIGGER CREATION
-- ====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions on all RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_check(text, text, numeric, timestamptz, timestamptz, uuid, uuid, uuid, text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_check(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_loan(text, numeric, text, numeric, integer, timestamptz, timestamptz, uuid, boolean, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_loan_installment(uuid, uuid, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_loan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_debt_installment(uuid, uuid, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_debt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_transfer(uuid, uuid, numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_transfer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_contribution_to_goal(uuid, uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.achieve_financial_goal(uuid, numeric, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_financial_goal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_financial_goal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense(numeric, text, timestamptz, uuid, uuid, uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_income(numeric, text, timestamptz, uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_income(uuid) TO authenticated;


-- ====================================================================
-- END OF SCRIPT
-- ====================================================================
-- Trigger CI/CD
