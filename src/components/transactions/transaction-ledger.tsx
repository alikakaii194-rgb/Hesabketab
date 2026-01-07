'use client';

import React, { useMemo } from 'react';
import { ArrowRightLeft, TrendingDown, TrendingUp, User, Users } from 'lucide-react';
import type { Income, Expense, BankAccount, Transfer, Category } from '@/lib/types';
import { formatCurrency, formatJalaliDate, cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { USER_DETAILS } from '@/lib/constants';

type Transaction = (Income | Expense | Transfer) & {
  type: 'income' | 'expense' | 'transfer';
  date: string;
};

type TransactionLedgerFilter = {
    type: 'bankAccount';
    id: string;
} | {
    type: 'payee';
    id: string;
}

interface TransactionLedgerProps {
    title: string;
    subtitle?: string;
    filter: TransactionLedgerFilter;
}

export function TransactionLedger({ title, subtitle, filter }: TransactionLedgerProps) {
  const { allData } = useDashboardData();
  const { bankAccounts, incomes, expenses, transfers, categories } = allData;

  const ledger = useMemo(() => {
    let relatedIncomes: Income[] = [];
    let relatedExpenses: Expense[] = [];
    let relatedTransfers: Transfer[] = [];

    if (filter.type === 'bankAccount') {
        relatedIncomes = (incomes || []).filter(i => i.bankAccountId === filter.id);
        relatedExpenses = (expenses || []).filter(e => e.bankAccountId === filter.id);
        relatedTransfers = (transfers || []).filter(t => t.fromBankAccountId === filter.id || t.toBankAccountId === filter.id);
    }
    // Add other filter types here if needed, e.g., 'payee'

    const combinedLedger: Transaction[] = [
      ...relatedIncomes.map(i => ({...i, type: 'income' as const, date: i.date})),
      ...relatedExpenses.map(e => ({...e, type: 'expense' as const, date: e.date})),
      ...relatedTransfers.map(t => ({...t, type: 'transfer' as const, date: t.transferDate})),
    ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return combinedLedger;
  }, [filter, incomes, expenses, transfers]);

  const getCategoryName = (tx: Transaction) => {
    if (tx.type === 'income') return 'درآمد';
    if (tx.type === 'transfer') return 'انتقال داخلی';
    const expense = tx as Expense;
    return categories?.find(c => c.id === expense.categoryId)?.name || 'متفرقه';
  }

  const getExpenseForBadge = (tx: Expense) => {
    if (tx.type !== 'expense' || !tx.expenseFor) return null;
    
    // Don't show badge if the card is not a shared account and expense is for one person
    const bankAccount = bankAccounts.find(ba => ba.id === tx.bankAccountId);
    if(bankAccount?.ownerId !== 'shared_account') return null;

    let text: string;
    let Icon: React.ElementType;

    if (tx.expenseFor === 'ali') { text = USER_DETAILS.ali.firstName; Icon = User; } 
    else if (tx.expenseFor === 'fatemeh') { text = USER_DETAILS.fatemeh.firstName; Icon = User; }
    else { return null; } // Dont show badge for shared expense
    
    return <Badge variant="secondary" className="font-normal"><Icon className="ml-1 h-3 w-3"/>{text}</Badge>;
  }

  const getTransactionIcon = (tx: Transaction) => {
      let isDebit = tx.type === 'expense' || (tx.type === 'transfer' && (tx as Transfer).fromBankAccountId === filter.id);
      
      if (tx.type === 'transfer') return <div className="p-2 rounded-full bg-opacity-10 bg-blue-500"><ArrowRightLeft className="h-5 w-5 text-blue-500" /></div>;
      if (isDebit) return <div className="p-2 rounded-full bg-opacity-10 bg-red-500"><TrendingDown className="h-5 w-5 text-red-500" /></div>;
      return <div className="p-2 rounded-full bg-opacity-10 bg-emerald-500"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>;
  };

  const getTransactionAmountClass = (tx: Transaction) => {
      let isDebit = tx.type === 'expense' || (tx.type === 'transfer' && (tx as Transfer).fromBankAccountId === filter.id);
      if (tx.type === 'transfer') return isDebit ? 'text-red-600' : 'text-emerald-600';
      return isDebit ? 'text-red-600' : 'text-emerald-600';
  }

  const getTransactionAmountPrefix = (tx: Transaction) => {
      return (tx.type === 'expense' || (tx.type === 'transfer' && (tx as Transfer).fromBankAccountId === filter.id)) ? '-' : '+';
  }

  const getTransactionDescription = (tx: Transaction): string => {
      if (tx.type === 'transfer') {
        const transfer = tx as Transfer;
        const isOutgoing = transfer.fromBankAccountId === filter.id;
        const otherAccount = isOutgoing 
            ? bankAccounts.find(b => b.id === transfer.toBankAccountId) 
            : bankAccounts.find(b => b.id === transfer.fromBankAccountId);
        
        if (isOutgoing) return `انتقال به ${otherAccount?.bankName || 'حساب دیگر'}`;
        return `انتقال از ${otherAccount?.bankName || 'حساب دیگر'}`;
      }
      return tx.description;
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-3">
        {ledger.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">هیچ تراکنشی برای نمایش وجود ندارد.</CardContent></Card>
        ) : (
        ledger.map((tx) => (
          <Card key={`${tx.id}-${tx.type}`} className="overflow-hidden relative">
            <div className={cn("border-l-4 h-full absolute left-0 top-0", getTransactionAmountClass(tx))}></div>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-grow">
                     {getTransactionIcon(tx)}
                     <div className="flex-grow">
                        <p className="font-bold flex items-center gap-2">
                          {getTransactionDescription(tx)}
                          {tx.type === 'expense' && getExpenseForBadge(tx as Expense)}
                        </p>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{formatJalaliDate(new Date(tx.date))}</span>
                            <Separator orientation="vertical" className="h-3" />
                            <Badge variant="outline">{getCategoryName(tx)}</Badge>
                        </div>
                     </div>
                </div>

                <div className="font-mono font-semibold text-lg md:text-xl" dir="ltr">
                    <span className={getTransactionAmountClass(tx)}>
                        {getTransactionAmountPrefix(tx)}{formatCurrency(tx.amount, 'IRT')}
                    </span>
                </div>
            </CardContent>
          </Card>
        )))}
      </div>
    </main>
  );
}
