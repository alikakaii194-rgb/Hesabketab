
'use client';
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import type { PreviousDebt, BankAccount, Category, Payee, Expense, UserProfile, TransactionDetails } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatCurrency, formatJalaliDate } from '@/lib/utils';
import { DebtList } from '@/components/debts/debt-list';
import { DebtForm } from '@/components/debts/debt-form';
import { PayDebtDialog } from '@/components/debts/pay-debt-dialog';
import Link from 'next/link';
import { sendSystemNotification } from '@/lib/notifications';
import { USER_DETAILS } from '@/lib/constants';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';


export default function DebtsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<PreviousDebt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    previousDebts,
    bankAccounts,
    categories,
    payees,
    users,
    debtPayments
  } = allData;

 const handleFormSubmit = useCallback(async (values: Omit<PreviousDebt, 'id'|'remainingAmount'>) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const { error } = await supabase.from('debts').insert([{
            ...values,
            remaining_amount: values.amount,
            registered_by_user_id: user.id
        }]);

        if (error) throw new Error(error.message);
        
        await refreshData();
        toast({ title: "موفقیت", description: "بدهی جدید با موفقیت ثبت شد." });
        setIsFormOpen(false);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در ثبت بدهی', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, payees, users, refreshData]);


  const handlePayDebt = useCallback(async ({ debt, paymentBankAccountId, amount, attachment_path }: { debt: PreviousDebt, paymentBankAccountId: string, amount: number, attachment_path?: string }) => {
    if (!user || !users || !bankAccounts || !payees) return;

    if (amount <= 0) {
        toast({ variant: "destructive", title: "خطا", description: "مبلغ پرداختی باید بیشتر از صفر باشد."});
        return;
    }
    setIsSubmitting(true);
    
    try {
        const { error } = await supabase.rpc('pay_debt_installment', {
            p_debt_id: debt.id,
            p_bank_account_id: paymentBankAccountId,
            p_amount: amount,
            p_user_id: user.id,
            p_attachment_path: attachment_path
        });

        if (error) throw new Error(error.message);

        await refreshData();
        toast({ title: "موفقیت", description: "پرداخت با موفقیت ثبت و به عنوان هزینه در سیستم منظور شد." });
        setPayingDebt(null);
    
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'خطا در پرداخت بدهی',
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, categories, bankAccounts, toast, payees, users, refreshData]);

  const handleDeleteDebt = useCallback(async (debt: PreviousDebt) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        if (debt.attachment_path) {
            await supabase.storage.from('hesabketabsatl').remove([debt.attachment_path]);
        }
        const { error } = await supabase.rpc('delete_debt', { p_debt_id: debt.id });
        if (error) throw new Error(error.message);
        await refreshData();
        toast({ title: "موفقیت", description: "بدهی با موفقیت حذف شد." });
    } catch(e: any) {
        toast({ variant: "destructive", title: "خطا در حذف", description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);

  const handleAddNew = () => setIsFormOpen(true);
  const handleCancel = () => setIsFormOpen(false);

  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8 md:pb-20">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">مدیریت بدهی‌ها</h1>
        <Button onClick={handleAddNew} className='hidden md:inline-flex'><PlusCircle className="ml-2 h-4 w-4" />ثبت بدهی جدید</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : isFormOpen ? (
        <DebtForm
            onCancel={handleCancel}
            onSubmit={handleFormSubmit}
            payees={payees || []}
            isSubmitting={isSubmitting}
            onQuickAdd={refreshData}
        />
      ) : (
        <>
            <DebtList
                debts={previousDebts || []}
                payees={payees || []}
                debtPayments={debtPayments || []}
                onPay={setPayingDebt}
                onDelete={handleDeleteDebt}
                users={users || []}
                isSubmitting={isSubmitting}
            />
            {payingDebt && (
                <PayDebtDialog
                    debt={payingDebt}
                    bankAccounts={bankAccounts || []}
                    isOpen={!!payingDebt}
                    onOpenChange={() => setPayingDebt(null)}
                    onSubmit={handlePayDebt}
                    isSubmitting={isSubmitting}
                />
            )}
        </>
      )}
      <Button onClick={handleAddNew} className="md:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-20" size="icon" aria-label="ثبت بدهی جدید">
        <Plus className="h-6 w-6" />
      </Button>
    </main>
  );
}
