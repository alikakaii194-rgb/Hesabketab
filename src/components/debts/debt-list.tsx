'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Handshake, FileText, CheckCircle, User, Users, Trash2, MoreVertical, PenSquare } from 'lucide-react';
import type { PreviousDebt, Payee, OwnerId, UserProfile, DebtPayment } from '@/lib/types';
import { formatCurrency, cn, getPublicUrl, formatJalaliDate } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { USER_DETAILS } from '@/lib/constants';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '../ui/separator';
import Link from 'next/link';

interface DebtListProps {
  debts: PreviousDebt[];
  payees: Payee[];
  debtPayments: DebtPayment[];
  onPay: (debt: PreviousDebt) => void;
  onDelete: (debt: PreviousDebt) => void;
  users: UserProfile[];
  isSubmitting: boolean;
}

export function DebtList({ debts, payees, debtPayments, onPay, onDelete, users, isSubmitting }: DebtListProps) {

  const getPayeeName = (payeeId?: string) => payees.find(p => p.id === payeeId)?.name || 'نامشخص';
  const getOwnerName = (ownerId: OwnerId) => {
    if (ownerId === 'shared') return 'مشترک';
    const userDetail = USER_DETAILS[ownerId as 'ali' | 'fatemeh'];
    return userDetail?.firstName || 'نامشخص';
  };

  if (debts.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent>
          <div className="text-center py-12">
            <Handshake className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">هنوز بدهی ثبت نشده است</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4 mt-4">
      {debts.sort((a, b) => (a.remainingAmount > 0 ? -1 : 1) - (b.remainingAmount > 0 ? -1 : 1) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((debt) => {
        const progress = debt.amount > 0 ? 100 - (debt.remainingAmount / debt.amount) * 100 : 0;
        const isCompleted = debt.remainingAmount <= 0;
        const paymentsForDebt = debtPayments.filter(p => p.debtId === debt.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        const attachmentUrl = debt.attachment_path ? getPublicUrl(debt.attachment_path) : null;

        return (
          <AccordionItem key={debt.id} value={debt.id} className="border-none">
            <Card className={`shadow-sm hover:shadow-md transition-shadow ${isCompleted ? 'bg-muted/50' : ''}`}>
               <div className="p-4 flex items-start justify-between">
                <Link href={`/debts/${debt.id}`} className="flex-grow">
                    <CardTitle className={`font-headline ${isCompleted ? 'text-muted-foreground' : ''}`}>{debt.description}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-2">بدهکار: {getOwnerName(debt.ownerId)} (به: {getPayeeName(debt.payeeId)})</div>
                </Link>
                <Badge variant={isCompleted ? 'default' : 'destructive'}>{isCompleted ? 'تسویه شده' : 'در حال پرداخت'}</Badge>
               </div>
               <CardContent className="px-4 pb-4 pt-0">
                  <Progress value={progress} className="mt-4 h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{formatCurrency(debt.remainingAmount, 'IRT')} مانده</span>
                    <span>{Math.round(progress)}٪ پرداخت شده</span>
                  </div>
               </CardContent>
              <AccordionTrigger className="px-4 py-2 text-sm text-muted-foreground">مشاهده تاریخچه و عملیات</AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <Separator className="mb-4"/>
                <h4 className="font-semibold mb-3">تاریخچه پرداخت‌ها</h4>
                {paymentsForDebt.length > 0 ? (
                  <ul className="space-y-3">
                    {paymentsForDebt.map(payment => {
                       const receiptUrl = payment.attachment_path ? getPublicUrl(payment.attachment_path) : null;
                       return (
                        <li key={payment.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                          <div className="flex flex-col">
                             <span className="font-semibold">{formatCurrency(payment.amount, 'IRT')}</span>
                             <span className="text-xs text-muted-foreground">{formatJalaliDate(new Date(payment.paymentDate))}</span>
                          </div>
                          {receiptUrl && (
                            <Button asChild variant="outline" size="sm">
                              <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="ml-2 h-4 w-4"/> مشاهده رسید
                              </a>
                            </Button>
                          )}
                        </li>
                       )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">هنوز پرداختی برای این بدهی ثبت نشده است.</p>
                )}
                <div className="flex items-center justify-end gap-2 mt-6 border-t pt-4">
                   {attachmentUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="ml-2 h-4 w-4"/> سند بدهی
                      </a>
                    </Button>
                   )}
                   <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={isSubmitting || paymentsForDebt.length > 0}>حذف</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئنید؟</AlertDialogTitle><AlertDialogDescription>{paymentsForDebt.length > 0 ? 'این بدهی دارای سابقه پرداخت است و قابل حذف نیست.' : 'این بدهی برای همیشه حذف خواهد شد.'}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(debt)} disabled={paymentsForDebt.length > 0} className={buttonVariants({ variant: "destructive" })}>حذف</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                   </AlertDialog>
                   <Button onClick={() => onPay(debt)} disabled={isCompleted || isSubmitting}><Handshake className="ml-2 h-4 w-4"/> پرداخت</Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
