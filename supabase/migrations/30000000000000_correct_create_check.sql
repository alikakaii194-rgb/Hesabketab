
CREATE OR REPLACE FUNCTION public.create_check(
    p_sayad_id text,
    p_serial_number text,
    p_amount numeric,
    p_issue_date timestamptz,
    p_due_date timestamptz,
    p_bank_account_id uuid,
    p_payee_id uuid,
    p_category_id uuid,
    p_description text,
    p_expense_for text,
    p_signature_data_url text,
    p_registered_by_user_id uuid,
    p_image_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- This function now ONLY inserts a record into the cheques table.
  -- It NO LONGER touches the blocked_balance, as per the correct logic.
  INSERT INTO public.cheques (
      sayad_id, serial_number, amount, issue_date, due_date,
      bank_account_id, payee_id, category_id, description,
      expense_for, signature_data_url, registered_by_user_id,
      image_path,
      status
  )
  VALUES (
      p_sayad_id, p_serial_number, p_amount, p_issue_date, p_due_date,
      p_bank_account_id, p_payee_id, p_category_id, p_description,
      p_expense_for, p_signature_data_url, p_registered_by_user_id,
      p_image_path,
      'pending'
  );
END;
$$;
