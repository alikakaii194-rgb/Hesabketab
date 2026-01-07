
'use client';

import { type Income, type Expense, type UserProfile, type Category, BankAccount, ExpenseFor } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Briefcase, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { USER_DETAILS } from '@/lib/constants';


type RecentTransactionsProps = {
  transactions: (Income | Expense)[];
  categories: Category[];
  bankAccounts: BankAccount[];
  users: UserProfile[];
};

export function RecentTransactions({ transactions, categories, bankAccounts, users }: RecentTransactionsProps) {
    
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">تراکنش اخیر در این بازه زمانی یافت نشد.</p>
      </div>
    );
  }

  const getCategoryName = (id?: string) => {
    if (!id) return 'متفرقه';
    if (id === 'درآمد') return 'درآمد';
    return categories?.find(c => c.id === id)?.name || 'متفرقه';
  }

  const formatDate = (date: any) => {
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true, locale: faIR });
    } catch {
      return "تاریخ نامشخص"
    }
  }

  const getExpenseForBadge = (transaction: Expense) => {
    if (transaction.type !== 'expense' || !transaction.expenseFor) return null;
    
    let text = '';
    switch(transaction.expenseFor as ExpenseFor) {
        case 'ali': text = `برای ${USER_DETAILS.ali.firstName}`; break;
        case 'fatemeh': text = `برای ${USER_DETAILS.fatemeh.firstName}`; break;
        case 'shared': text = 'هزینه مشترک'; break;
    }

    if (text) {
        return <Badge variant="outline" className="font-normal">{text}</Badge>;
    }
    return null;
  }

  const getAccountOwnerBadge = (transaction: Income | Expense) => {
      const account = bankAccounts.find(acc => acc.id === transaction.bankAccountId);
      if (!account) return null;
      
      let text = '';
      if(account.ownerId === 'ali') text = `حساب ${USER_DETAILS.ali.firstName}`;
      if(account.ownerId === 'fatemeh') text = `حساب ${USER_DETAILS.fatemeh.firstName}`;
      if(account.ownerId === 'shared_account') text = 'حساب مشترک';

      return <Badge variant="secondary">{text}</Badge>;
  }
  
  const getRegisteredByName = (userId?: string) => {
      if (!userId) return "نامشخص";
      return users.find(u => u.id === userId)?.firstName || "نامشخص";
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isIncome = 'source' in transaction;
        const categoryId = 'categoryId' in transaction ? transaction.categoryId : 'درآمد';
        const categoryName = getCategoryName(categoryId);
        const registeredByName = getRegisteredByName(transaction.registeredByUserId);
        const transactionDate = 'createdAt' in transaction && transaction.createdAt ? transaction.createdAt : transaction.date;
        
        return (
          <div key={transaction.id} className="flex items-center">
            <Avatar className="h-9 w-9 rounded-md">
              <AvatarFallback className={`rounded-md ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'}`}>
                {isIncome ? <Briefcase className="h-4 w-4 text-emerald-500" /> : <ShoppingCart className="h-4 w-4 text-rose-500" />}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <div className="text-sm font-medium leading-none flex items-center gap-2">
                {transaction.description}
                {getAccountOwnerBadge(transaction)}
                {!isIncome && getExpenseForBadge(transaction as Expense)}
              </div>
              <p className="text-sm text-muted-foreground">{categoryName} (ثبت: {registeredByName}) - <span className="font-mono text-xs">{formatDate(transactionDate)}</span></p>
            </div>
            <div
              className={`mr-auto font-medium ${
                isIncome ? 'text-emerald-500 dark:text-emerald-400' : 'text-foreground'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount, 'IRT')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
