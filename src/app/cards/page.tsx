
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, ArrowRight, Plus } from 'lucide-react';
import { CardList } from '@/components/cards/card-list';
import { CardForm } from '@/components/cards/card-form';
import type { BankAccount, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { toEnglishDigits } from '@/lib/utils';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/use-auth';

export default function CardsPage() {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useAuth();
  
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<BankAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { bankAccounts: allBankAccounts, users, expenses, incomes, transfers, checks, loanPayments, debtPayments } = allData;

  const hasSharedAccount = useMemo(() => (allBankAccounts || []).some(acc => acc.ownerId === 'shared_account'), [allBankAccounts]);

  const handleFormSubmit = useCallback(async (values: any) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        if (editingCard) {
            // Update logic
            const { error } = await supabase.from('bank_accounts').update({
                bank_name: values.bankName,
                account_number: values.accountNumber,
                card_number: values.cardNumber,
                expiry_date: values.expiryDate,
                cvv2: values.cvv2,
                theme: values.theme,
                account_type: values.accountType
            }).eq('id', editingCard.id);
            if (error) throw error;
            toast({ title: "موفقیت", description: "کارت با موفقیت ویرایش شد." });
        } else {
            // Create logic
            const { error } = await supabase.from('bank_accounts').insert([{
                bank_name: values.bankName,
                account_number: values.accountNumber,
                card_number: values.cardNumber,
                expiry_date: values.expiryDate,
                cvv2: values.cvv2,
                theme: values.theme,
                account_type: values.accountType,
                owner_id: values.ownerId,
                balance: values.initialBalance,
                initial_balance: values.initialBalance,
                registered_by_user_id: user.id,
            }]);
            if (error) throw error;
            toast({ title: "موفقیت", description: "کارت جدید با موفقیت اضافه شد." });
        }
        await refreshData();
        setIsSubmitting(false);
        setIsFormOpen(false);
        setEditingCard(null);
    } catch (error: any) {
        toast({ variant: "destructive", title: "خطا در عملیات", description: error.message });
        setIsSubmitting(false);
    }
  }, [user, toast, editingCard, refreshData]);

  const handleDelete = useCallback(async (cardId: string) => {
     if (!user) return;
     setIsSubmitting(true);

     const isUsed = [
        ...(expenses || []),
        ...(incomes || []),
        ...(transfers || []),
        ...(checks || []),
        ...(loanPayments || []),
        ...(debtPayments || [])
     ].some(item => ('bankAccountId' in item && item.bankAccountId === cardId) || ('fromBankAccountId' in item && item.fromBankAccountId === cardId) || ('toBankAccountId' in item && item.toBankAccountId === cardId));

    if (isUsed) {
        toast({ variant: "destructive", title: "خطا", description: "امکان حذف این کارت وجود ندارد زیرا در تراکنش‌ها استفاده شده است."});
        setIsSubmitting(false);
        return;
    }

     try {
        const { error } = await supabase.from('bank_accounts').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', cardId);
        if (error) throw error;
        toast({ title: "موفقیت", description: "کارت با موفقیت حذف شد." });
        await refreshData();
     } catch (error: any) {
        toast({ variant: "destructive", title: "خطا در حذف", description: error.message });
     } finally {
        setIsSubmitting(false);
     }
  }, [user, toast, expenses, incomes, transfers, checks, loanPayments, debtPayments, refreshData]);


  const handleEdit = useCallback((card: BankAccount) => {
    setEditingCard(card);
    setIsFormOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingCard(null);
    setIsFormOpen(true);
  }, []);
  
  const isLoading = isUserLoading || isDashboardLoading;
  
  const filteredBankAccounts = React.useMemo(() => {
    if (!allBankAccounts) return [];
    if (!searchQuery) {
      return allBankAccounts;
    }
    const query = toEnglishDigits(searchQuery).toLowerCase();
    return allBankAccounts.filter(card => 
      card.bankName.toLowerCase().includes(query) ||
      (card.cardNumber && card.cardNumber.includes(query)) ||
      (card.accountNumber && card.accountNumber.includes(query))
    );
  }, [searchQuery, allBankAccounts]);


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
            مدیریت کارت‌های بانکی
          </h1>
        </div>
        <div className="hidden md:block">
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                افزودن کارت جدید
            </Button>
        </div>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="جستجو در نام بانک, شماره کارت..."
          className="w-full pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
       {isFormOpen && (
           <CardForm
              isOpen={isFormOpen}
              setIsOpen={setIsFormOpen}
              onSubmit={handleFormSubmit}
              initialData={editingCard}
              users={users || []}
              user={user}
              hasSharedAccount={hasSharedAccount}
              isSubmitting={isSubmitting}
            />
        )}

      {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
          </div>
      ) : !isFormOpen && (
        <CardList
          cards={filteredBankAccounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button
            onClick={handleAddNew}
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            aria-label="افزودن کارت جدید"
          >
            <Plus className="h-6 w-6" />
          </Button>
      </div>
    </div>
  );
}
