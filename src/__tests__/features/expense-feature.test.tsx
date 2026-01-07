
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ExpensesPage from '@/app/transactions/page.tsx';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { USER_DETAILS } from '@/lib/constants';

// --- JSDOM API Mocks ---
if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.HTMLElement.prototype.hasPointerCapture = jest.fn();
    window.HTMLElement.prototype.releasePointerCapture = jest.fn();
}

// --- Mocks Setup ---
jest.mock('@/hooks/use-dashboard-data');
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } }})),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('next/link', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/lib/notifications', () => ({
    sendSystemNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('lucide-react', () => {
    const original = jest.requireActual('lucide-react');
    return { ...original, Plus: () => <div />, PlusCircle: () => <div /> };
});

// --- Test Data ---
const mockUsers = [
    { id: 'ali_uid', ...USER_DETAILS.ali },
    { id: 'fatemeh_uid', ...USER_DETAILS.fatemeh },
];
const mockBankAccounts = [
    { id: 'ali_bank_1', bankName: 'Melli', balance: 100000, ownerId: 'ali', blockedBalance: 0 },
    { id: 'fati_bank_1', bankName: 'Sepah', balance: 150000, ownerId: 'fatemeh', blockedBalance: 20000 },
    { id: 'shared_bank_1', bankName: 'Saderat', balance: 500000, ownerId: 'shared_account', blockedBalance: 0 },
];
const mockCategories = [{ id: 'cat_food', name: 'Food' }];
const mockPayees = [{ id: 'payee_store', name: 'Hyperstar' }];

describe('Feature: Expense Management', () => {
    const testUsers = [
        { user: { id: 'ali_uid', email: 'ali@khanevadati.app' }, name: 'Ali' },
        { user: { id: 'fatemeh_uid', email: 'fatemeh@khanevadati.app' }, name: 'Fatemeh' },
    ];

    describe.each(testUsers)('when logged in as $name', ({ user }) => {

        beforeEach(() => {
            jest.clearAllMocks();
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user } } });

            const fromMock = supabase.from as jest.Mock;
            fromMock.mockImplementation((tableName) => ({
                insert: jest.fn().mockResolvedValue({ error: null }),
                update: jest.fn().mockResolvedValue({ error: null }),
            }));
        });

        it('should create a new expense, update bank balance, and display it correctly', async () => {
            // 1. ARRANGE
            const useDashboardDataMock = useDashboardData as jest.Mock;
            useDashboardDataMock.mockReturnValue({
                isLoading: false,
                allData: { expenses: [], bankAccounts: mockBankAccounts, categories: mockCategories, payees: mockPayees, users: mockUsers },
            });

            const { rerender } = render(<ExpensesPage />);

            // 2. ACT
            fireEvent.click(screen.getByTestId('add-new-expense-desktop'));
            await waitFor(() => expect(screen.getByRole('heading', { name: 'ثبت هزینه جدید' })).toBeInTheDocument());
            
            fireEvent.input(screen.getByLabelText(/شرح هزینه/i), { target: { value: 'Weekly Groceries' } });
            fireEvent.input(screen.getByLabelText(/مبلغ/i), { target: { value: '75000' } });

            const bankSelect = screen.getByTestId('bank-account-select-wrapper').querySelector('button[role="combobox"]');
            fireEvent.click(bankSelect!);
            await waitFor(() => screen.getByText(/Saderat/i));
            fireEvent.click(screen.getByText(/Saderat/i));

            const categorySelect = screen.getByTestId('category-select-wrapper').querySelector('button[role="combobox"]');
            fireEvent.click(categorySelect!);
            await waitFor(() => screen.getByText(/Food/i));
            fireEvent.click(screen.getByText(/Food/i));

            const expenseForSelect = screen.getByTestId('expense-for-select-wrapper').querySelector('button[role="combobox"]');
            fireEvent.click(expenseForSelect!);
            await waitFor(() => screen.getByText(/مشترک/i));
            fireEvent.click(screen.getByText(/مشترک/i));

            fireEvent.click(screen.getByRole('button', { name: /ذخیره/i }));


            // 3. ASSERT (Backend)
            const fromMock = supabase.from as jest.Mock;
            const updateMock = fromMock('bank_accounts').update as jest.Mock;
            const insertMock = fromMock('expenses').insert as jest.Mock;
            
            await waitFor(() => {
                expect(updateMock).toHaveBeenCalledWith({ balance: 500000 - 75000 });
                expect(insertMock).toHaveBeenCalledWith([expect.objectContaining({
                    description: 'Weekly Groceries',
                    amount: 75000,
                    bank_account_id: 'shared_bank_1',
                    category_id: 'cat_food',
                    expense_for: 'shared',
                    owner_id: 'shared_account',
                    registered_by_user_id: user.id
                })]);
            });

            // 4. ARRANGE & ASSERT (UI)
            const newExpenseForUI = { ...insertMock.mock.calls[0][0], id: 'new_exp_1', date: new Date().toISOString() };
            const updatedBankAccounts = mockBankAccounts.map(acc => acc.id === 'shared_bank_1' ? { ...acc, balance: 425000 } : acc);

            useDashboardDataMock.mockReturnValue({
                isLoading: false,
                allData: { expenses: [newExpenseForUI], bankAccounts: updatedBankAccounts, categories: mockCategories, payees: mockPayees, users: mockUsers },
            });

            rerender(<ExpensesPage />);

            await waitFor(() => {
                const expenseCard = screen.getByTestId('expense-item-new_exp_1');
                expect(expenseCard).toBeInTheDocument();
                const registrarFirstName = user.id === 'ali_uid' ? USER_DETAILS.ali.firstName : USER_DETAILS.fatemeh.firstName;
                expect(within(expenseCard).getByText(registrarFirstName)).toBeInTheDocument();
            });
        });
    });
});
