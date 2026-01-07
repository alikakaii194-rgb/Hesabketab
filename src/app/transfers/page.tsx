
'use client';

import React, { useCallback, useState } from 'react';
import type { Transfer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { TransferForm } from '@/components/transfers/transfer-form';
import { TransferList } from '@/components/transfers/transfer-list';
import { Button } from '@/components/ui/button';
import { USER_DETAILS } from '@/lib/constants';
import { ArrowRight, PlusCircle, Plus, Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { sendSystemNotification } from '@/lib/notifications';
import { useAuth } from '@/hooks/use-auth';

export default function TransfersPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { bankAccounts: allBankAccounts, transfers, users } = allData;

  const handleTransferSubmit = useCallback(async (values: Omit<Transfer, 'id' | 'registeredByUserId' | 'transferDate' | 'fromAccountBalanceBefore' | 'fromAccountBalanceAfter' | 'toAccountBalanceBefore' | 'toAccountBalanceAfter'>) => {
    if (!user || !allBankAccounts || !users) return;
    setIsSubmitting(true);

    if (values.fromBankAccountId === values.toBankAccountId) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "حساب مبدا و مقصد نمی‌توانند یکسان باشند.",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
        const { error } = await supabase.rpc('create_transfer', {
            p_from_account_id: values.fromBankAccountId,
            p_to_account_id: values.toBankAccountId,
            p_amount: values.amount,
            p_description: values.description,
            p_user_id: user.id
        });

        if (error) {
             throw new Error(error.message);
        }
        
        await refreshData();
        setIsFormOpen(false);
        toast({
            title: "موفقیت",
            description: "انتقال وجه با موفقیت انجام شد.",
        });

        // Notification logic remains the same...

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "خطا در انتقال وجه",
            description: error.message || "مشکلی در انجام عملیات پیش آمد. لطفا دوباره تلاش کنید.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, allBankAccounts, users, toast, refreshData]);

  const handleDeleteTransfer = useCallback(async (transferId: string) => {
    if (!transfers) return;
    
    try {
       const { error } = await supabase.rpc('delete_transfer', { p_transfer_id: transferId });
       if (error) throw new Error(error.message);

       await refreshData();
       toast({ title: "موفقیت", description: "تراکنش انتقال با موفقیت حذف و مبالغ به حساب‌ها بازگردانده شد." });

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "خطا در حذف انتقال",
            description: error.message || "مشکلی در حذف تراکنش پیش آمد.",
          });
    }
  }, [transfers, toast, refreshData]);

  const handleAddNew = useCallback(() => setIsFormOpen(true), []);
  const handleCancelForm = useCallback(() => setIsFormOpen(false), []);

  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            انتقال داخلی
            </h1>
        </div>
        <div className="hidden md:block">
            <Button onClick={handleAddNew} disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" />
                ثبت انتقال جدید
            </Button>
        </div>
      </div>
      
      <p className="text-muted-foreground text-sm">
          از این بخش برای جابجایی پول بین حساب‌های خود استفاده کنید. این عملیات به عنوان درآمد یا هزینه در گزارش‌ها ثبت نمی‌شود.
      </p>

      <TransferForm
            bankAccounts={allBankAccounts || []}
            onSubmit={handleTransferSubmit}
            user={user}
            onCancel={handleCancelForm}
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            isSubmitting={isSubmitting}
        />

      {isLoading ? (
          <div className="space-y-4 mt-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </div>
      ) : (
          <TransferList 
              transfers={transfers || []}
              bankAccounts={allBankAccounts || []}
              users={users || []}
              onDelete={handleDeleteTransfer}
          />
      )}
      
      {!isFormOpen && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
            <Button
              onClick={handleAddNew}
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
              aria-label="ثبت انتقال جدید"
              disabled={isSubmitting}
            >
              <Plus className="h-6 w-6" />
            </Button>
        </div>
      )}
    </div>
  );
}
