
'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCopy, HandCoins, Landmark, AlertCircle, Calendar, User, Users, PenSquare, FileText } from 'lucide-react';
import { formatCurrency, formatJalaliDate, cn, getPublicUrl } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { USER_DETAILS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import type { OwnerId } from '@/lib/types';
import Link from 'next/link';

function LoanDetailSkeleton() {
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
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

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div>
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-semibold">{value}</span>
            </div>
        </div>
    );
};


export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const loanId = params.loanId as string;

  const { isLoading, allData } = useDashboardData();
  const { loans, loanPayments, bankAccounts, payees, users } = allData;

  const { loan, paymentHistory } = useMemo(() => {
    if (isLoading || !loanId || !loans || !loanPayments || !bankAccounts || !payees || !users) {
      return { loan: null, paymentHistory: [] };
    }

    const currentLoan = loans.find((l) => l.id === loanId);
    if (!currentLoan) return { loan: null, paymentHistory: [] };

    const relatedPayments = loanPayments
        .filter(p => p.loanId === loanId)
        .map(p => {
            const bankAccount = bankAccounts.find(b => b.id === p.bankAccountId);
            const ownerId = bankAccount?.ownerId;
            const ownerName = ownerId === 'shared_account' ? 'حساب مشترک' : (ownerId && USER_DETAILS[ownerId as 'ali' | 'fatemeh'] ? `${USER_DETAILS[ownerId as 'ali' | 'fatemeh'].firstName}` : 'ناشناس');
            return {
                ...p,
                bankName: bankAccount?.bankName || 'نامشخص',
                ownerName,
            }
        })
        .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return {
      loan: currentLoan,
      paymentHistory: relatedPayments,
    };
  }, [isLoading, loanId, loans, loanPayments, bankAccounts, payees, users]);

  if (isLoading) {
    return <LoanDetailSkeleton />;
  }

  if (!loan) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>وام یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه وامی با این مشخصات در سیستم وجود ندارد.</p>
            <Button onClick={() => router.push('/loans')} className="mt-4">
              بازگشت به لیست وام‌ها
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
  
  const getOwnerName = (ownerId: OwnerId) => USER_DETAILS[ownerId]?.firstName || 'مشترک';
  const registeredByName = users.find(u => u.id === loan.registeredByUserId)?.firstName || 'نامشخص';

  const progress = 100 - (loan.remainingAmount / loan.amount) * 100;

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                جزئیات وام: {loan.title}
              </h1>
              <p className="text-muted-foreground">
                دریافت شده از: {getPayeeName(loan.payeeId)}
              </p>
            </div>
        </div>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>خلاصه وضعیت</CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span>پرداخت شده: {formatCurrency(loan.amount - loan.remainingAmount, 'IRT')}</span>
                        <span>مبلغ کل: {formatCurrency(loan.amount, 'IRT')}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground text-center">
                        <span>{`${progress.toFixed(0)}٪ پرداخت شده`}</span>
                        <span>مبلغ باقی‌مانده: <span className='font-bold text-destructive'>{formatCurrency(loan.remainingAmount, 'IRT')}</span></span>
                    </div>
                </div>
                 <Separator className="my-4" />
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <DetailItem icon={loan.ownerId === 'shared' ? Users : User} label="وام برای" value={getOwnerName(loan.ownerId)} />
                    <DetailItem icon={Calendar} label="تاریخ دریافت" value={formatJalaliDate(new Date(loan.startDate))} />
                    <DetailItem icon={PenSquare} label="ثبت توسط" value={registeredByName} />
                 </div>
            </CardContent>
       </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>تاریخچه پرداخت اقساط</CardTitle>
          </CardHeader>
          <CardContent>
               <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>تاریخ پرداخت</TableHead>
                    <TableHead>مبلغ قسط</TableHead>
                    <TableHead>برداشت از حساب</TableHead>
                    <TableHead>صاحب حساب</TableHead>
                    <TableHead className="text-left">رسید</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paymentHistory.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                هیچ قسطی برای این وام پرداخت نشده است.
                            </TableCell>
                        </TableRow>
                    ) : (
                    paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell>{formatJalaliDate(new Date(payment.paymentDate))}</TableCell>
                        <TableCell className="font-medium font-mono">{formatCurrency(payment.amount, 'IRT')}</TableCell>
                        <TableCell>{payment.bankName}</TableCell>
                        <TableCell>{payment.ownerName}</TableCell>
                        <TableCell className="text-left">
                            {payment.attachment_path ? (
                                <Button asChild variant="outline" size="sm">
                                  <a href={getPublicUrl(payment.attachment_path) || '#'} target="_blank" rel="noopener noreferrer">
                                    <FileText className="ml-2 h-4 w-4"/> مشاهده
                                  </a>
                                </Button>
                            ) : '-'}
                        </TableCell>
                    </TableRow>
                    )))}
                </TableBody>
                </Table>
          </CardContent>
      </Card>
    </main>
  );
}
