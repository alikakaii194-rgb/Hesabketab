'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { IncomeList } from '@/components/income/income-list';
import { IncomeForm } from '@/components/income/income-form';
import type { Income, BankAccount, UserProfile, TransactionDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

// Match the form values from income-form.tsx
type IncomeFormData = Omit<Income, 'id' | 'createdAt' | 'updatedAt' | 'registeredByUserId' | 'type' | 'category'> & { attachment_path?: string };

export default function IncomePage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const { incomes: allIncomes, bankAccounts: allBankAccounts, users } = allData;

  const handleFormSubmit = useCallback(async (values: IncomeFormData) => {
    if (!user || !allBankAccounts || !users) return;
    
    setIsSubmitting(true);
    const isoDate = (values.date as Date).toISOString();
    
    try {
      if (editingIncome) {
        // --- UPDATE LOGIC ---
        // Note: Atomic updates for edits are complex (reverting old amount, applying new). 
        // For simplicity, we're not making this atomic. A more robust solution might involve a dedicated RPC function.
        const { error: updateError } = await supabase
          .from('incomes')
          .update({
            amount: values.amount,
            description: values.description,
            date: isoDate,
            owner_id: values.ownerId,
            bank_account_id: values.bankAccountId,
            source_text: values.source || values.description,
            attachment_path: values.attachment_path, // Update attachment path
          })
          .eq('id', editingIncome.id);

        if (updateError) throw updateError;
        toast({ title: "موفقیت", description: "درآمد با موفقیت ویرایش شد. لطفاً موجودی حساب را به صورت دستی بررسی کنید." });

      } else {
        // --- CREATE LOGIC ---
        const { error } = await supabase.rpc('create_income', {
          p_amount: values.amount,
          p_description: values.description,
          p_date: isoDate,
          p_bank_account_id: values.bankAccountId,
          p_owner_id: values.ownerId,
          p_source_text: values.source || values.description,
          p_registered_by_user_id: user.id,
          p_attachment_path: values.attachment_path,
        });

        if (error) throw error;

        toast({ title: "موفقیت", description: "درآمد جدید با موفقیت ثبت شد." });
        // Notification logic for new income can be added here...
      }

      await refreshData();
      setIsFormOpen(false);
      setEditingIncome(null);

    } catch (error: any) {
        toast({
          variant: "destructive",
          title: editingIncome ? "خطا در ویرایش درآمد" : "خطا در ثبت درآمد",
          description: error.message || "مشکلی در ثبت اطلاعات پیش آمد.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, allBankAccounts, users, toast, editingIncome, refreshData]);

  const handleDelete = useCallback(async (income: Income) => {
    try {
        const { error } = await supabase.rpc('delete_income', { p_income_id: income.id });
        if (error) throw error;
        
        await refreshData();
        toast({ title: "موفقیت", description: "تراکنش درآمد با موفقیت حذف و مبلغ از حساب کسر شد." });

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "خطا در حذف درآمد",
            description: error.message || "مشکلی در حذف تراکنش پیش آمد.",
          });
    }
  }, [toast, refreshData]);

  const handleAddNew = useCallback(() => {
    setEditingIncome(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((income: Income) => {
    setEditingIncome(income);
    setIsFormOpen(true);
  }, []);
  
  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" className="md:hidden">
                  <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
             <h1 className="font-headline text-3xl font-bold tracking-tight">مدیریت درآمدها</h1>
        </div>
          <Button onClick={handleAddNew} disabled={isSubmitting} className="hidden md:inline-flex"><PlusCircle className="mr-2 h-4 w-4" />ثبت درآمد جدید</Button>
      </div>

       <IncomeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingIncome}
          bankAccounts={allBankAccounts || []}
          user={user}
          isSubmitting={isSubmitting}
        />

      {isLoading ? (
          <div className="space-y-4 mt-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
      ) : (
        <IncomeList
          incomes={allIncomes || []}
          bankAccounts={allBankAccounts || []}
          users={users || []}
          onDelete={handleDelete}
          onEdit={handleEdit} // Pass the new handler
        />
      )}

      {!isFormOpen && (
      <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button onClick={handleAddNew} size="icon" className="h-14 w-14 rounded-full shadow-lg" aria-label="ثبت درآمد جدید" disabled={isSubmitting}>
            <Plus className="h-6 w-6" />
          </Button>
      </div>
      )}
    </div>
  );
}
