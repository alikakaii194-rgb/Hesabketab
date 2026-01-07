'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { FolderKanban, TrendingDown, User, Users, Wallet } from 'lucide-react';
import type { Expense, ExpenseFor, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseList } from '@/components/transactions/expense-list';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '../shared/confirmation-dialog';

type FilterType = 'all' | ExpenseFor;

interface CategoryDetailProps {
  category: Category;
}

export function CategoryDetail({ category }: CategoryDetailProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { allData, refreshData } = useDashboardData();
  const { expenses, bankAccounts, categories, payees, users } = allData;
  const { toast } = useToast();

  const { filteredExpenses, totalAmount } = useMemo(() => {
    const categoryExpenses = (expenses || []).filter(e => e.categoryId === category.id);
    const expensesToDisplay = filter === 'all' 
        ? categoryExpenses 
        : categoryExpenses.filter(e => e.expenseFor === filter);

    const amount = expensesToDisplay.reduce((sum, e) => sum + e.amount, 0);

    return { filteredExpenses: expensesToDisplay, totalAmount: amount };

  }, [category, expenses, filter]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    
    try {
        const { error } = await supabase.rpc('delete_expense', { p_expense_id: deletingExpense.id });
        if (error) throw new Error(error.message);
        
        await refreshData();
        toast({ title: "موفقیت", description: "تراکنش هزینه با موفقیت حذف و مبلغ به حساب بازگردانده شد." });
        setDeletingExpense(null);

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "خطا در حذف هزینه",
            description: error.message || "مشکلی در حذف تراکنش پیش آمد.",
          });
    } finally {
      setIsSubmitting(false);
    }
  }, [deletingExpense, refreshData, toast]);

  return (
    <>
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="w-8 h-8 text-primary" />
            {category.name}
          </h1>
          <p className="text-muted-foreground">{category.description || 'جزئیات هزینه‌های این دسته‌بندی'}</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع هزینه در این دسته‌بندی</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalAmount, 'IRT')}</div>
            <p className="text-xs text-muted-foreground">بر اساس فیلتر انتخاب شده</p>
          </CardContent>
        </Card>
      
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all"><Wallet className="ml-2 h-4 w-4" />همه</TabsTrigger>
            <TabsTrigger value="ali"><User className="ml-2 h-4 w-4" />{USER_DETAILS.ali.firstName}</TabsTrigger>
            <TabsTrigger value="fatemeh"><User className="ml-2 h-4 w-4" />{USER_DETAILS.fatemeh.firstName}</TabsTrigger>
            <TabsTrigger value="shared"><Users className="ml-2 h-4 w-4" />مشترک</TabsTrigger>
          </TabsList>
          <TabsContent value={filter}>
            <ExpenseList
              expenses={filteredExpenses}
              bankAccounts={bankAccounts || []}
              categories={categories || []}
              users={users || []}
              payees={payees || []}
              onDelete={setDeletingExpense}
            />
          </TabsContent>
        </Tabs>
      </main>
      
      {deletingExpense && (
        <ConfirmationDialog
          isOpen={!!deletingExpense}
          onOpenChange={() => setDeletingExpense(null)}
          onConfirm={handleDeleteConfirm}
          title="آیا از حذف این هزینه مطمئن هستید؟"
          description="این عمل قابل بازگشت نیست. مبلغ هزینه به حساب شما بازگردانده خواهد شد."
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
