
'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { 
    BankAccount, 
    Income, 
    Expense, 
    Category, 
    Payee, 
    Check, 
    FinancialGoal, 
    FinancialGoalContribution,
    Loan, 
    LoanPayment,
    PreviousDebt,
    DebtPayment,
    Transfer,
    UserProfile,
    ChatMessage
} from '@/lib/types';

// A robust function to convert snake_case keys from Supabase to camelCase for the app
const transformData = (data: any[] | null): any[] => {
    if (!data) return [];
    return data.map(item => {
        if (item === null || typeof item !== 'object') {
            return item;
        }
        const newItem: { [key: string]: any } = {};
        for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
                const camelCaseKey = key.replace(/_([a-z0-9])/g, g => g[1].toUpperCase());
                newItem[camelCaseKey] = item[key];
            }
        }
        return newItem;
    });
};

interface AllData {
    bankAccounts: BankAccount[];
    incomes: Income[];
    expenses: Expense[];
    transfers: Transfer[];
    checks: Check[];
    loans: Loan[];
    loanPayments: LoanPayment[];
    previousDebts: PreviousDebt[];
    debtPayments: DebtPayment[];
    goals: FinancialGoal[];
    categories: Category[];
    payees: Payee[];
    users: UserProfile[];
    chatMessages: ChatMessage[];
}

interface DashboardContextType {
    allData: AllData;
    isLoading: boolean;
    error: Error | null;
    refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [allData, setAllData] = useState<AllData>({
    bankAccounts: [],
    incomes: [],
    expenses: [],
    transfers: [],
    checks: [],
    loans: [],
    loanPayments: [],
    previousDebts: [],
    debtPayments: [],
    goals: [],
    categories: [],
    payees: [],
    users: [],
    chatMessages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
      // Don't set loading to true on refresh, to avoid UI flickering
      setError(null);

      try {
        const [
          usersRes, bankAccountsRes, categoriesRes, payeesRes, expensesRes,
          incomesRes, transfersRes, checksRes, goalsRes, loansRes,
          loanPaymentsRes, debtsRes, debtPaymentsRes, chatMessagesRes,
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('bank_accounts').select('*').eq('is_deleted', false),
          supabase.from('categories').select('*').eq('is_archived', false),
          supabase.from('payees').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('incomes').select('*'),
          supabase.from('transfers').select('*'),
          supabase.from('cheques').select('*'),
          supabase.from('financial_goals').select('*'),
          supabase.from('loans').select('*'),
          supabase.from('loan_payments').select('*'),
          supabase.from('debts').select('*'),
          supabase.from('debt_payments').select('*'),
          supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
        ]);

        const responses = [
          usersRes, bankAccountsRes, categoriesRes, payeesRes, expensesRes,
          incomesRes, transfersRes, checksRes, goalsRes, loansRes,
          loanPaymentsRes, debtsRes, debtPaymentsRes, chatMessagesRes,
        ];

        for (const res of responses) {
          if (res.error) {
            console.error(`Error fetching table:`, res.error);
            throw new Error(`Failed to fetch data: ${res.error.message}`);
          }
        }
        
        const goalsData = transformData(goalsRes.data) as FinancialGoal[];
        const expensesData = transformData(expensesRes.data) as Expense[];
        
         const allGoalContributions = expensesData
            .filter(expense => expense.subType === 'goal_contribution' && expense.goalId)
            .map((expense): FinancialGoalContribution => ({
                id: expense.id, 
                goalId: expense.goalId!,
                bankAccountId: expense.bankAccountId,
                amount: expense.amount,
                date: expense.date,
                registeredByUserId: expense.registeredByUserId,
            }));

        const goalsWithContributions = goalsData.map((goal: FinancialGoal) => {
            const contributions = allGoalContributions.filter(c => c.goalId === goal.id);
            const currentAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
            return { ...goal, contributions, currentAmount };
        });

        // Special handling for chat messages to build the replyTo object
        const rawChatMessages = transformData(chatMessagesRes.data) as (ChatMessage & { replyToMessageId?: string })[];
        const enrichedChatMessages = rawChatMessages.map(msg => {
            if (msg.replyToMessageId) {
                const originalMessage = rawChatMessages.find(m => m.id === msg.replyToMessageId);
                if (originalMessage) {
                    return {
                        ...msg,
                        replyTo: {
                            messageId: originalMessage.id,
                            text: originalMessage.text,
                            senderName: originalMessage.senderName,
                        }
                    };
                }
            }
            return msg;
        });


        setAllData({
          users: transformData(usersRes.data) as UserProfile[],
          bankAccounts: transformData(bankAccountsRes.data) as BankAccount[],
          categories: transformData(categoriesRes.data) as Category[],
          payees: transformData(payeesRes.data) as Payee[],
          expenses: expensesData,
          incomes: transformData(incomesRes.data) as Income[],
          transfers: transformData(transfersRes.data) as Transfer[],
          checks: transformData(checksRes.data) as Check[],
          goals: goalsWithContributions,
          loans: transformData(loansRes.data) as Loan[],
          loanPayments: transformData(loanPaymentsRes.data) as LoanPayment[],
          previousDebts: transformData(debtsRes.data) as PreviousDebt[],
          debtPayments: transformData(debtPaymentsRes.data) as DebtPayment[],
          chatMessages: enrichedChatMessages as ChatMessage[],
        });

      } catch (e: any) {
        console.error("Dashboard data fetching error:", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('hesab_ketab_db_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Database change received, refreshing data:', payload);
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const value = { allData, isLoading, error, refreshData: fetchData };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}
