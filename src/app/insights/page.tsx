
'use client';

import React, { useMemo } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { USER_DETAILS } from '@/lib/constants';
import { SummaryCards } from '@/components/insights/summary-cards';
import type { Expense, Income, Loan, PreviousDebt, Check, FinancialGoal, OwnerId, BankAccount } from '@/lib/types';
import { BrainCircuit } from 'lucide-react';

function InsightsPageSkeleton() {
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </main>
  );
}

export default function InsightsPage() {
  const { isLoading, allData } = useDashboardData();

  const { incomes, expenses, loans, previousDebts, checks, goals, categories, bankAccounts } = allData;

  const processedData = useMemo(() => {
    if (isLoading || !incomes || !expenses || !loans || !previousDebts || !checks || !goals || !categories || !bankAccounts) {
      return null;
    }

    const calculateStats = (
      ownerFilter: OwnerId | 'all' | 'daramad_moshtarak'
    ) => {
      let filteredIncomes: Income[] = incomes;
      let filteredExpenses: Expense[] = expenses;
      let filteredLoans: Loan[] = loans;
      let filteredDebts: PreviousDebt[] = previousDebts;
      let filteredChecks: Check[] = checks;
      let filteredGoals: FinancialGoal[] = goals;
      let incomeOnly = false;
      let expenseOnly = false;
      
      if (ownerFilter === 'all') {
          // No filtering, use all data
      } else if (ownerFilter === 'daramad_moshtarak') {
          filteredIncomes = incomes.filter(i => i.ownerId === 'daramad_moshtarak');
          filteredExpenses = [];
          filteredLoans = [];
          filteredDebts = [];
          filteredChecks = [];
          filteredGoals = [];
          incomeOnly = true;
      } else { // 'ali', 'fatemeh', or 'shared'
          filteredIncomes = incomes.filter(i => i.ownerId === ownerFilter);
          filteredExpenses = expenses.filter(e => e.expenseFor === ownerFilter);
          filteredLoans = loans.filter(l => l.ownerId === ownerFilter);
          filteredDebts = previousDebts.filter(d => d.ownerId === ownerFilter);
          // For checks, the owner is the bank account owner, but expenseFor is the beneficiary. We filter by beneficiary.
          filteredChecks = checks.filter(c => c.expenseFor === ownerFilter);
          filteredGoals = goals.filter(g => g.ownerId === ownerFilter);
      }
      
      if (ownerFilter === 'shared') {
          expenseOnly = true;
      }


      const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
      const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
      const netFlow = totalIncome - totalExpense;
      
      const totalLoanLiability = filteredLoans.reduce((sum, item) => sum + item.remainingAmount, 0);
      const totalDebtLiability = filteredDebts.reduce((sum, item) => sum + item.remainingAmount, 0);
      const totalCheckLiability = filteredChecks.filter(c => c.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
      const totalLiabilities = totalLoanLiability + totalDebtLiability + totalCheckLiability;

      const totalGoalSavings = filteredGoals.reduce((sum, item) => sum + item.currentAmount, 0);
      const totalGoalTarget = filteredGoals.reduce((sum, item) => sum + item.targetAmount, 0);

      const expenseByCategory = filteredExpenses.reduce((acc, expense) => {
          const categoryName = categories.find(c => c.id === expense.categoryId)?.name || 'متفرقه';
          acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
          return acc;
      }, {} as {[key: string]: number});
      
      const sortedCategories = Object.entries(expenseByCategory).sort(([,a], [,b]) => b - a);

      return {
        totalIncome,
        totalExpense,
        netFlow,
        totalLiabilities,
        totalLoanLiability,
        totalDebtLiability,
        totalCheckLiability,
        totalGoalSavings,
        totalGoalTarget,
        expenseByCategory: sortedCategories,
        incomeOnly,
        expenseOnly,
      };
    };
    
    return {
        all: calculateStats('all'),
        ali: calculateStats('ali'),
        fatemeh: calculateStats('fatemeh'),
        shared: calculateStats('shared'),
        business: calculateStats('daramad_moshtarak'),
    }

  }, [isLoading, incomes, expenses, loans, previousDebts, checks, goals, categories, bankAccounts]);

  if (isLoading || !processedData) {
    return <InsightsPageSkeleton />;
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          آمار و گزارشات
        </h1>
      </div>
      <p className="text-muted-foreground">تحلیل جامع وضعیت مالی خانواده به تفکیک افراد و موارد مشترک.</p>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">خلاصه کلی</TabsTrigger>
          <TabsTrigger value="ali">{USER_DETAILS.ali.firstName}</TabsTrigger>
          <TabsTrigger value="fatemeh">{USER_DETAILS.fatemeh.firstName}</TabsTrigger>
          <TabsTrigger value="shared">هزینه مشترک</TabsTrigger>
          <TabsTrigger value="business">شغل مشترک</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
            <SummaryCards stats={processedData.all} title="خلاصه کلی تمام فعالیت‌های مالی" />
        </TabsContent>
        <TabsContent value="ali" className="space-y-4">
            <SummaryCards stats={processedData.ali} title={`عملکرد مالی ${USER_DETAILS.ali.firstName}`} />
        </TabsContent>
        <TabsContent value="fatemeh" className="space-y-4">
            <SummaryCards stats={processedData.fatemeh} title={`عملکرد مالی ${USER_DETAILS.fatemeh.firstName}`} />
        </TabsContent>
        <TabsContent value="shared" className="space-y-4">
            <SummaryCards stats={processedData.shared} title="عملکرد مالی هزینه‌های مشترک" />
        </TabsContent>
         <TabsContent value="business" className="space-y-4">
            <SummaryCards stats={processedData.business} title="عملکرد مالی شغل مشترک" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
