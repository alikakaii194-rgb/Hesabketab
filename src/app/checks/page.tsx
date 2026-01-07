"use client";

import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CheckList } from '@/components/checks/check-list';
import { CheckForm } from '@/components/checks/check-form';
import type { Check, BankAccount, Payee, Category, Expense, TransactionDetails, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { sendSystemNotification } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';

type CheckFormData = Omit<Check, 'id' | 'registeredByUserId' | 'status'> & { signatureDataUrl?: string; image_path?: string };

export default function ChecksPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCheck, setEditingCheck] = React.useState<Check | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const { checks, bankAccounts, payees, categories, users } = allData;

  const handleFormSubmit = useCallback(async (values: CheckFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
        const { error } = await supabase.rpc('create_check', {
            p_sayad_id: values.sayadId,
            p_serial_number: values.checkSerialNumber,
            p_amount: values.amount,
            p_issue_date: (values.issueDate as any).toISOString(),
            p_due_date: (values.dueDate as any).toISOString(),
            p_bank_account_id: values.bankAccountId,
            p_payee_id: values.payeeId,
            p_category_id: values.categoryId,
            p_description: values.description,
            p_expense_for: values.expenseFor,
            p_signature_data_url: values.signatureDataUrl,
            p_registered_by_user_id: user.id,
            p_image_path: values.image_path,
        });

        if (error) throw new Error(error.message);
        
        await refreshData();
        setIsFormOpen(false);
        setEditingCheck(null);
        toast({ title: 'موفقیت', description: 'چک جدید با موفقیت ثبت شد.' });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در ثبت چک', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);
  
  const handleClearCheck = useCallback(async (data: { check: Check; receiptPath?: string }) => {
    const { check, receiptPath } = data;
    if (!user) return;
    setIsSubmitting(true);
    try {
        const { error } = await supabase.rpc('clear_check', {
            p_check_id: check.id,
            p_user_id: user.id,
            p_clearance_receipt_path: receiptPath || null
        });
        if (error) throw new Error(error.message);

        await refreshData();
        toast({ title: 'موفقیت!', description: `چک به مبلغ ${formatCurrency(check.amount, 'IRT')} با موفقیت پاس و هزینه آن ثبت شد.` });
        
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در پاس کردن چک', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);
  
  const handleDeleteCheck = useCallback(async (check: Check) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        if (check.imagePath) {
            await supabase.storage.from('hesabketabsatl').remove([check.imagePath]);
        }
        const { error } = await supabase.rpc('delete_check', { p_check_id: check.id });
        if (error) throw new Error(error.message);
        await refreshData();
        toast({ title: 'موفقیت', description: 'چک با موفقیت حذف شد.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در حذف چک', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);

  const handleAddNew = useCallback(() => {
    setEditingCheck(null);
    setIsFormOpen(true);
  }, []);
  
  const handleEdit = useCallback((check: Check) => {
    toast({ variant: "destructive", title: "غیرفعال", description: "ویرایش چک پس از ثبت امکان‌پذیر نیست. لطفا چک فعلی را حذف و یک چک جدید ثبت کنید."})
  }, [toast]);
  
  const onQuickAdd = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const isLoading = isUserLoading || isDashboardLoading;
  
  const checkingAccounts = useMemo(() => (bankAccounts || []).filter(acc => acc.accountType === 'checking'), [bankAccounts]);


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" className="md:hidden">
                  <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            مدیریت چک‌ها
          </h1>
        </div>
        {!isFormOpen && (
            <div className="hidden md:block">
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ثبت چک جدید
                </Button>
            </div>
        )}
      </div>

      {isFormOpen && (
          <CheckForm
            onSubmit={handleFormSubmit}
            initialData={editingCheck}
            bankAccounts={checkingAccounts}
            payees={payees || []}
            categories={categories || []}
            onCancel={() => { setIsFormOpen(false); setEditingCheck(null); }}
            user={user}
            isSubmitting={isSubmitting}
            onQuickAdd={onQuickAdd}
        />
      )}

      {isLoading ? (
          <div className="space-y-4 mt-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
          </div>
      ) : !isFormOpen && (
        <CheckList
          checks={checks || []}
          bankAccounts={bankAccounts || []}
          payees={payees || []}
          categories={categories || []}
          onClear={handleClearCheck}
          onDelete={handleDeleteCheck}
          onEdit={handleEdit}
          users={users || []}
          isSubmitting={isSubmitting}
        />
      )}

      {!isFormOpen && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
            <Button
                onClick={handleAddNew}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg"
                aria-label="ثبت چک جدید"
            >
                <Plus className="h-6 w-6" />
            </Button>
        </div>
      )}
    </div>
  );
}
    