
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Handshake, Calendar, User, Users, BookUser, PenSquare, Clock } from 'lucide-react';
import { formatCurrency, formatJalaliDate, toPersianDigits } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { USER_DETAILS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

function DebtDetailSkeleton() {
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-28" />
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </CardContent>
      </Card>
    </main>
  );
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
            </div>
        </div>
    );
};


export default function DebtDetailPage() {
  const router = useRouter();
  const params = useParams();
  const debtId = params.debtId as string;

  const { isLoading, allData } = useDashboardData();
  const { previousDebts, debtPayments, bankAccounts, payees, users } = allData;

  const { debt, paymentHistory, registeredByName } = useMemo(() => {
    if (isLoading || !debtId || !previousDebts || !debtPayments || !bankAccounts || !users) {
      return { debt: null, paymentHistory: [], registeredByName: 'نامشخص' };
    }

    const currentDebt = previousDebts.find((d) => d.id === debtId);
    if (!currentDebt) return { debt: null, paymentHistory: [], registeredByName: 'نامشخص' };
    
    const relatedPayments = debtPayments
        .filter(p => p.debtId === debtId)
        .map(p => {
            const bankAccount = bankAccounts.find(b => b.id === p.bankAccountId);
            const ownerId = bankAccount?.ownerId;
            const ownerName = ownerId === 'shared_account' ? 'حساب مشترک' : (ownerId && USER_DETAILS[ownerId as 'ali' | 'fatemeh'] ? `${USER_DETAILS[ownerId as 'ali' | 'fatemeh'].firstName}` : 'ناشناس');
            const paymentRegisteredBy = users.find(u => u.id === p.registeredByUserId)?.firstName || 'نامشخص';
            
            return {
                ...p,
                bankName: bankAccount?.bankName || 'نامشخص',
                bankCardNumber: bankAccount?.cardNumber.slice(-4) || '----',
                ownerName,
                registeredByName: paymentRegisteredBy,
            }
        })
        .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    
    const debtRegisteredBy = users.find(u => u.id === currentDebt.registeredByUserId)?.firstName || 'نامشخص';

    return {
      debt: currentDebt,
      paymentHistory: relatedPayments,
      registeredByName: debtRegisteredBy,
    };
  }, [isLoading, debtId, previousDebts, debtPayments, bankAccounts, users]);

  if (isLoading) {
    return <DebtDetailSkeleton />;
  }

  if (!debt) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>بدهی یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه بدهی با این مشخصات در سیستم وجود ندارد.</p>
            <Button onClick={() => router.push('/debts')} className="mt-4">
              بازگشت به لیست بدهی‌ها
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  const getPayeeName = (payeeId?: string) => {
    if (!payeeId || !payees) return 'نامشخص';
    return payees.find(p => p.id === payeeId)?.name || 'نامشخص';
  };
  
  const getOwnerName = (ownerId: 'ali' | 'fatemeh' | 'shared') => {
      if (ownerId === 'shared') return 'مشترک';
      const userDetail = Object.values(USER_DETAILS).find(u => u.email.startsWith(ownerId));
      return userDetail?.firstName || 'نامشخص';
  };

  const progress = 100 - (debt.remainingAmount / debt.amount) * 100;
  
  let dueDateText = '';
  if (debt.isInstallment && debt.firstInstallmentDate) {
      dueDateText = `اولین قسط: ${formatJalaliDate(new Date(debt.firstInstallmentDate))}`;
  } else if (debt.dueDate) {
      dueDateText = formatJalaliDate(new Date(debt.dueDate));
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                جزئیات بدهی: {debt.description}
              </h1>
              <p className="text-muted-foreground">
                بدهی به: {getPayeeName(debt.payeeId)}
              </p>
            </div>
        </div>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Handshake className="w-6 h-6 text-primary" />
                    خلاصه وضعیت
                </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span>پرداخت شده: {formatCurrency(debt.amount - debt.remainingAmount, 'IRT')}</span>
                        <span>مبلغ کل: {formatCurrency(debt.amount, 'IRT')}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground text-center">
                        <span>{`${progress.toFixed(0)}٪ پرداخت شده`}</span>
                        <span>مبلغ باقی‌مانده: <span className='font-bold text-destructive'>{formatCurrency(debt.remainingAmount, 'IRT')}</span></span>
                    </div>
                </div>
                 <Separator className="my-4" />
                 <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <DetailItem icon={debt.ownerId === 'shared' ? Users : User} label="بدهی برای" value={getOwnerName(debt.ownerId)} />
                    <DetailItem icon={Calendar} label="تاریخ ایجاد" value={formatJalaliDate(new Date(debt.startDate))} />
                    <DetailItem icon={Clock} label="موعد پرداخت" value={dueDateText} />
                    <DetailItem icon={BookUser} label="طرف حساب" value={getPayeeName(debt.payeeId)} />
                    <DetailItem icon={PenSquare} label="ثبت توسط" value={registeredByName} />
                 </div>
            </CardContent>
       </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>تاریخچه پرداخت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>تاریخ پرداخت</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>برداشت از حساب</TableHead>
                    <TableHead>صاحب حساب</TableHead>
                    <TableHead className="text-left">ثبت توسط</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentHistory.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                هیچ پرداختی برای این بدهی ثبت نشده است.
                            </TableCell>
                        </TableRow>
                    ) : (
                    paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{formatJalaliDate(new Date(payment.paymentDate))}</TableCell>
                        <TableCell className="font-medium font-mono">{formatCurrency(payment.amount, 'IRT')}</TableCell>
                        <TableCell>{payment.bankName} (...{payment.bankCardNumber})</TableCell>
                        <TableCell>{payment.ownerName}</TableCell>
                        <TableCell className="text-left">{payment.registeredByName}</TableCell>
                    </TableRow>
                    )))}
                </TableBody>
                </Table>
          </CardContent>
      </Card>
    </main>
  );
}
