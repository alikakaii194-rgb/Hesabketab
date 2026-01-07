
'use client';

import { type Check, type Loan, type Payee, type PreviousDebt } from '@/lib/types';
import { formatCurrency, formatJalaliDate } from '@/lib/utils';
import { getNextDueDate } from '@/lib/date-utils';
import { CalendarClock, FileText, Handshake } from 'lucide-react';
import React, { useMemo } from 'react';

type UpcomingDeadlinesProps = {
  checks: Check[];
  loans: Loan[];
  payees: Payee[];
  previousDebts: PreviousDebt[];
};

export function UpcomingDeadlines({ checks, loans, payees, previousDebts }: UpcomingDeadlinesProps) {

  const deadlines = useMemo(() => {
    const upcomingChecks = (checks || [])
      .filter(c => c.status === 'pending')
      .map(c => ({
        id: c.id,
        type: 'check' as const,
        date: new Date(c.dueDate),
        title: `چک برای ${payees.find(p => p.id === c.payeeId)?.name || 'ناشناس'}`,
        amount: c.amount,
      }));

    const upcomingLoanPayments = (loans || [])
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
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null);

    const upcomingDebts = (previousDebts || [])
      .filter(d => d.remainingAmount > 0)
      .map(d => {
        const dueDate = getNextDueDate(d);
        if (!dueDate) return null;

        return {
          id: d.id,
          type: 'debt' as const,
          date: dueDate,
          title: `پرداخت بدهی: ${d.description}`,
          amount: d.isInstallment ? (d.installmentAmount || d.remainingAmount) : d.remainingAmount,
        };
      }).filter((d): d is NonNullable<typeof d> => d !== null);

    return [...upcomingChecks, ...upcomingLoanPayments, ...upcomingDebts]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [checks, loans, payees, previousDebts]);

  if (deadlines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">هیچ موعد پیش رویی وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deadlines.map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex items-center">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${
              item.type === 'check' ? 'bg-amber-100 dark:bg-amber-900' 
            : item.type === 'loan' ? 'bg-sky-100 dark:bg-sky-900' 
            : 'bg-indigo-100 dark:bg-indigo-900'
          }`}>
            {item.type === 'check' ? (
              <FileText className="h-4 w-4 text-amber-500" />
            ) : item.type === 'loan' ? (
              <CalendarClock className="h-4 w-4 text-sky-500" />
            ) : (
              <Handshake className="h-4 w-4 text-indigo-500" />
            )}
          </div>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              موعد: {formatJalaliDate(item.date)}
            </p>
          </div>
          <div className="mr-auto font-medium text-destructive">
            {formatCurrency(item.amount, 'IRT')}
          </div>
        </div>
      ))}
    </div>
  );
}
