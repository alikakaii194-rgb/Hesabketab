-- HESAB KETAB: MIGRATION SCRIPT (PART 1 OF 4)
-- This script contains: TABLE CREATION

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
