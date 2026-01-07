-- ====================================================================
-- SCRIPT TO ADD MISSING COLUMNS TO EXISTING TABLES
-- This script ensures that all tables have the necessary columns
-- that might have been missed during the initial setup.
-- It uses "ADD COLUMN IF NOT EXISTS" to run safely multiple times.
-- ====================================================================

-- Add columns to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS attachment_path TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS check_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS goal_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS loan_payment_id UUID;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS debt_payment_id UUID;

-- Add columns to incomes table
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add columns to cheques table
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS clearance_receipt_path TEXT;

-- Add columns to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add columns to loan_payments table
ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS expense_id UUID;
ALTER TABLE public.loan_payments ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add columns to debts table
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add columns to debt_payments table
ALTER TABLE public.debt_payments ADD COLUMN IF NOT EXISTS expense_id UUID;
ALTER TABLE public.debt_payments ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add columns to financial_goals table
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add columns to bank_accounts table
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add columns to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add columns to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID;

-- Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signature_image_path TEXT;

-- Refresh notification function to include new columns/logic if any.
-- (Dropping and recreating is the safest way to ensure the latest version is used)
DROP FUNCTION IF EXISTS public.send_system_notification(actor_user_id uuid, details jsonb);
CREATE OR REPLACE FUNCTION public.send_system_notification(p_actor_user_id uuid, p_details jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.chat_messages (sender_id, sender_name, text, type, transaction_details, read_by)
    VALUES (
        'system',
        'دستیار هوشمند مالی',
        p_details->>'title',
        'system',
        p_details,
        ARRAY[p_actor_user_id]
    );
END;
$$;
COMMENT ON FUNCTION public.send_system_notification(uuid, jsonb) IS 'Sends a system message to the chat with transaction details.';
GRANT EXECUTE ON FUNCTION public.send_system_notification(uuid, jsonb) TO authenticated;
