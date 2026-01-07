
'use client';

import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PayeeList } from '@/components/payees/payee-list';
import { PayeeForm } from '@/components/payees/payee-form';
import type { Payee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';

export default function PayeesPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPayee, setEditingPayee] = React.useState<Payee | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { payees, checks, expenses, loans, previousDebts } = allData;

  const handleFormSubmit = useCallback(async (values: Omit<Payee, 'id'>) => {
    if (!user) return;
    setIsSubmitting(true);

    const onComplete = async () => {
        await refreshData();
        setIsSubmitting(false);
        setIsFormOpen(false);
        setEditingPayee(null);
    };

    if (editingPayee) {
        const { error } = await supabase
            .from('payees')
            .update({ name: values.name, phone_number: values.phoneNumber })
            .eq('id', editingPayee.id);

        if (error) {
            toast({ variant: "destructive", title: "خطا در ویرایش", description: error.message });
            setIsSubmitting(false);
        } else {
            toast({ title: "موفقیت", description: "طرف حساب با موفقیت ویرایش شد." });
            await onComplete();
        }
    } else {
        const { data, error } = await supabase
            .from('payees')
            .insert([{ name: values.name, phone_number: values.phoneNumber }])
            .select()
            .single();

        if (error) {
            toast({ variant: "destructive", title: "خطا در ثبت", description: error.message });
            setIsSubmitting(false);
        } else {
            toast({ title: "موفقیت", description: "طرف حساب جدید با موفقیت اضافه شد." });
            await onComplete();
        }
    }
  }, [user, editingPayee, toast, refreshData]);

  const handleDelete = useCallback(async (payeeId: string) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
        const usedIn = [];
        if ((checks || []).some((c: any) => c.payeeId === payeeId)) usedIn.push('چک');
        if ((expenses || []).some((e: any) => e.payeeId === payeeId)) usedIn.push('هزینه');
        if ((loans || []).some((l: any) => l.payeeId === payeeId)) usedIn.push('وام');
        if ((previousDebts || []).some((d: any) => d.payeeId === payeeId)) usedIn.push('بدهی');
        
        if (usedIn.length > 0) {
            throw new Error(`امکان حذف وجود ندارد. این طرف حساب در یک یا چند تراکنش (${usedIn.join(', ')}) استفاده شده است.`);
        }

        const { error } = await supabase.from('payees').delete().eq('id', payeeId);

        if (error) throw error;
        
        toast({ title: "موفقیت", description: "طرف حساب با موفقیت حذف شد." });
        await refreshData();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "خطا در حذف",
            description: error.message || "مشکلی در حذف طرف حساب پیش آمد.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, checks, expenses, loans, previousDebts, refreshData]);

  const handleEdit = useCallback((payee: Payee) => {
    setEditingPayee(payee);
    setIsFormOpen(true);
  }, []);
  
  const handleAddNew = useCallback(() => {
    setEditingPayee(null);
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
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            مدیریت طرف حساب‌ها
          </h1>
        </div>
        <div className="hidden md:block">
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                افزودن طرف حساب
            </Button>
        </div>
      </div>

      { isFormOpen && (
        <PayeeForm
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            onSubmit={handleFormSubmit}
            initialData={editingPayee}
            isSubmitting={isSubmitting}
        />
      )}

      {isLoading ? (
          <div className="space-y-4 mt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      ) : !isFormOpen && (
        <PayeeList
          payees={payees || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Floating Action Button for Mobile */}
       {!isFormOpen && (
          <div className="md:hidden fixed bottom-20 right-4 z-50">
              <Button
                onClick={handleAddNew}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg"
                aria-label="افزودن طرف حساب"
                disabled={isSubmitting}
              >
                <Plus className="h-6 w-6" />
              </Button>
          </div>
       )}
    </div>
  );
}
