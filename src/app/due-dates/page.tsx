
'use client';
import React, { useMemo, useState } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { DueDatesList, type Deadline } from '@/components/due-dates/due-dates-list';
import { getNextDueDate } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { Check, Loan, PreviousDebt, OwnerId } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { startOfToday, endOfDay, addDays, isPast } from 'date-fns';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DueDatesPage() {
  const { isLoading, allData } = useDashboardData();
  const router = useRouter();
  const { toast } = useToast();

  const allDeadlines = useMemo((): Deadline[] => {
    if (isLoading || !allData) return [];
    
    const { checks, loans, payees, previousDebts, users, categories, bankAccounts } = allData;

    const upcomingChecks: Deadline[] = (checks || [])
      .filter(c => c.status === 'pending')
      .map(c => {
        const bankAccount = bankAccounts.find(b => b.id === c.bankAccountId);
        const liabilityOwnerId = bankAccount?.ownerId ?? c.ownerId;

        return {
          id: c.id,
          type: 'check' as const,
          date: new Date(c.dueDate),
          title: c.description || `چک به ${payees.find(p => p.id === c.payeeId)?.name || 'ناشناس'}`,
          amount: c.amount,
          details: {
            liabilityOwnerId: liabilityOwnerId,
            expenseFor: c.expenseFor,
            bankAccountName: bankAccount?.bankName || 'نامشخص',
            registeredBy: users.find(u => u.id === c.registeredByUserId)?.firstName || 'نامشخص',
            categoryName: categories.find(cat => cat.id === c.categoryId)?.name || 'نامشخص',
            payeeName: payees.find(p => p.id === c.payeeId)?.name,
            description: c.description,
            sayadId: c.sayadId,
          },
          originalItem: c,
        };
      });

    const upcomingLoanPayments: Deadline[] = (loans || [])
      .filter(l => l.remainingAmount > 0)
      .map(l => {
        const nextDueDate = getNextDueDate(l);
        if (!nextDueDate) return null;

        return {
            id: l.id,
            type: 'loan' as const,
            date: nextDueDate,
            title: `قسط وام: ${l.title}`,
            amount: l.installmentAmount,
            details: {
              liabilityOwnerId: l.ownerId, 
              expenseFor: l.ownerId,
              bankAccountName: undefined,
              registeredBy: users.find(u => u.id === l.registeredByUserId)?.firstName || 'نامشخص',
              categoryName: 'اقساط و بدهی',
              payeeName: payees.find(p => p.id === l.payeeId)?.name,
              description: `پرداخت قسط وام به ${payees.find(p => p.id === l.payeeId)?.name || 'نامشخص'}`,
              sayadId: undefined,
            },
            originalItem: l,
        }
      }).filter((d): d is Deadline => d !== null);


     const upcomingDebts: Deadline[] = (previousDebts || [])
      .filter(d => d.remainingAmount > 0)
      .map(d => {
        const dueDate = getNextDueDate(d);
        if (!dueDate) return null;

        return {
          id: d.id,
          type: d.isInstallment ? 'debt' : 'debt',
          date: dueDate,
          title: `پرداخت بدهی: ${d.description}`,
          amount: d.isInstallment ? (d.installmentAmount || d.remainingAmount) : d.remainingAmount,
          details: {
            liabilityOwnerId: d.ownerId,
            expenseFor: d.ownerId,
            bankAccountName: undefined,
            registeredBy: users.find(u => u.id === d.registeredByUserId)?.firstName || 'نامشخص',
            categoryName: 'اقساط و بدهی',
            payeeName: payees.find(p => p.id === d.payeeId)?.name,
            description: `پرداخت بدهی به ${payees.find(p => p.id === d.payeeId)?.name || 'نامشخص'}`,
            sayadId: undefined,
          },
          originalItem: d,
        };
      }).filter((d): d is Deadline => d !== null);


    return [...upcomingChecks, ...upcomingLoanPayments, ...upcomingDebts]
      .sort((a, b) => a.date.getTime() - b.date.getTime());
      
  }, [isLoading, allData]);

  const filteredDeadlines = useMemo(() => {
    const today = startOfToday();
    const fifteenDaysFromNow = endOfDay(addDays(today, 15));
    
    return allDeadlines.filter(d => {
        const dueDate = new Date(d.date);
        return isPast(dueDate) || (dueDate >= today && dueDate <= fifteenDaysFromNow);
    });
  }, [allDeadlines]);
  
  const handleAction = (item: Deadline) => {
    switch (item.type) {
        case 'check':
            router.push('/checks');
            toast({
                title: "انتقال به صفحه چک‌ها",
                description: `برای مدیریت چک مورد نظر به صفحه چک‌ها منتقل شدید.`,
            });
            break;
        case 'loan':
            router.push('/loans');
            toast({
                title: "انتقال به صفحه وام‌ها",
                description: `برای پرداخت قسط وام "${(item.originalItem as Loan).title}" به صفحه وام‌ها منتقل شدید.`,
            });
            break;
        case 'debt':
             router.push('/debts');
            toast({
                title: "انتقال به صفحه بدهی‌ها",
                description: `برای پرداخت بدهی "${(item.originalItem as PreviousDebt).description}" به صفحه بدهی‌ها منتقل شدید.`,
            });
            break;
    }
  };


  if (isLoading) {
    return (
        <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <h1 className="font-headline text-3xl font-bold tracking-tight">سررسیدهای نزدیک</h1>
            <p className="text-muted-foreground">چک‌ها، اقساط وام و بدهی‌های پیش روی خود را مدیریت کنید.</p>
            <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
            </div>
        </main>
    )
  }


  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
       <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className='flex items-center gap-2'>
               <Link href="/" passHref>
                  <Button variant="ghost" size="icon" className="md:hidden">
                      <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="space-y-1">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">سررسیدهای نزدیک</h1>
                    <p className="text-muted-foreground">تعهدات مالی شما که موعد آن‌ها گذشته یا طی ۱۵ روز آینده است.</p>
                </div>
            </div>
        </div>
        <DueDatesList deadlines={filteredDeadlines} onAction={handleAction} />
    </main>
  );
}
