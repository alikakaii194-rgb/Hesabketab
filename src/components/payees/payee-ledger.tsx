'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, HandCoins, AlertCircle } from 'lucide-react';
import { formatCurrency, formatJalaliDate, cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Payee } from '@/lib/types';
import { useDashboardData } from '@/hooks/use-dashboard-data';

type CombinedTransaction = {
  date: Date;
  description: string;
  type: 'expense' | 'check' | 'loan' | 'debt';
  amount: number;
  status?: 'pending' | 'cleared';
  original: any;
};

interface PayeeLedgerProps {
  payee: Payee;
}

export function PayeeLedger({ payee }: PayeeLedgerProps) {
  const { allData } = useDashboardData();
  const { expenses, checks, loans, previousDebts } = allData;

  const { summary, combinedHistory } = useMemo(() => {
    const relatedExpenses = (expenses || []).filter(e => e.payeeId === payee.id);
    const relatedChecks = (checks || []).filter(c => c.payeeId === payee.id);
    const relatedLoans = (loans || []).filter(l => l.payeeId === payee.id);
    const relatedDebts = (previousDebts || []).filter(d => d.payeeId === payee.id);
    
    const clearedCheckExpenses = (expenses || []).filter(e => e.checkId && relatedChecks.some(rc => rc.id === e.checkId && rc.status === 'cleared'));
    const totalCashPayment = relatedExpenses.reduce((sum, e) => sum + e.amount, 0) + clearedCheckExpenses.reduce((sum, e) => sum + e.amount, 0);

    const pendingChecks = relatedChecks.filter(c => c.status === 'pending');
    const totalPendingChecksAmount = pendingChecks.reduce((sum, c) => sum + c.amount, 0);
    const totalLoanAmount = relatedLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
    const totalPreviousDebtsAmount = relatedDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalDebt = totalPendingChecksAmount + totalLoanAmount + totalPreviousDebtsAmount;

    const expenseHistory: CombinedTransaction[] = relatedExpenses.map(e => ({ date: new Date(e.date), description: e.description, type: 'expense', amount: e.amount, original: e }));
    const checkHistory: CombinedTransaction[] = relatedChecks.map(c => ({ date: new Date(c.issueDate), description: c.description || `چک به شماره صیادی ${c.sayadId}`, type: 'check', amount: c.amount, status: c.status as 'pending' | 'cleared', original: c }));
    const loanHistory: CombinedTransaction[] = relatedLoans.map(l => ({ date: new Date(l.startDate), description: `دریافت وام: ${l.title}`, type: 'loan', amount: l.amount, original: l }));
    const debtHistory: CombinedTransaction[] = relatedDebts.map(d => ({ date: new Date(d.startDate), description: `بدهی متفرقه: ${d.description}`, type: 'debt', amount: d.amount, original: d }));

    const allHistory = [...expenseHistory, ...checkHistory, ...loanHistory, ...debtHistory].sort((a,b) => b.date.getTime() - a.date.getTime());

    return {
      summary: { totalDebt, totalCashPayment, pendingChecksCount: pendingChecks.length, totalPendingChecksAmount },
      combinedHistory: allHistory,
    };
  }, [payee, expenses, checks, loans, previousDebts]);

  const getTypeBadge = (type: 'expense' | 'check' | 'loan' | 'debt') => {
    switch(type) {
        case 'expense': return <Badge variant="default" className="bg-fuchsia-600 hover:bg-fuchsia-700">پرداخت نقدی</Badge>;
        case 'check': return <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">چک</Badge>;
        case 'loan': return <Badge variant="default" className="bg-sky-600 hover:bg-sky-700">وام دریافتی</Badge>;
        case 'debt': return <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700">بدهی</Badge>;
    }
  };
  
  const getStatusBadge = (tx: CombinedTransaction) => {
    if (tx.type === 'check') {
       if(tx.status === 'cleared') return <Badge className="bg-emerald-500">پاس شده</Badge>;
       return <Badge variant="secondary">در انتظار</Badge>;
    }
    if (tx.type === 'loan' || tx.type === 'debt') {
        if(tx.original.remainingAmount <= 0) return <Badge className="bg-emerald-500">تسویه شده</Badge>;
        return <Badge variant="secondary">در حال پرداخت</Badge>;
    }
    return null;
  };

  const getAmountClass = (tx: CombinedTransaction) => {
    if (tx.type === 'loan' || tx.type === 'debt') return 'text-emerald-600';
    return 'text-destructive';
  };

  const getAmountPrefix = (tx: CombinedTransaction) => {
      if (tx.type === 'loan' || tx.type === 'debt') return '+';
      return '-';
  };

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight">دفتر حساب: {payee.name}</h1>
        <p className="text-muted-foreground">خلاصه و تاریخچه تمام تعاملات مالی با این طرف حساب.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="border-l-4 border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">کل بدهی شما</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalDebt || 0, 'IRT')}</div>
            <p className="text-xs text-muted-foreground">چک‌ها، وام‌ها و بدهی‌های باقی‌مانده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">کل وجوه پرداخت شده</CardTitle><HandCoins className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCashPayment || 0, 'IRT')}</div>
            <p className="text-xs text-muted-foreground">مجموع هزینه‌های نقدی و چک‌های پاس شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">چک‌های در انتظار</CardTitle><BookCopy className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPendingChecksAmount || 0, 'IRT')}</div>
            <p className="text-xs text-muted-foreground">{summary.pendingChecksCount} فقره چک در انتظار پاس شدن</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader><CardTitle>تاریخچه تراکنش‌ها</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>تاریخ</TableHead><TableHead>شرح</TableHead><TableHead>نوع</TableHead><TableHead>وضعیت</TableHead><TableHead className="text-left">مبلغ</TableHead></TableRow></TableHeader>
            <TableBody>
              {combinedHistory.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">هیچ تراکنشی برای این طرف حساب ثبت نشده است.</TableCell></TableRow>
              ) : (
                combinedHistory.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatJalaliDate(tx.date)}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>{getTypeBadge(tx.type)}</TableCell>
                    <TableCell>{getStatusBadge(tx)}</TableCell>
                    <TableCell className={cn("text-left font-mono", getAmountClass(tx))}>{getAmountPrefix(tx)}{formatCurrency(tx.amount, 'IRT')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
