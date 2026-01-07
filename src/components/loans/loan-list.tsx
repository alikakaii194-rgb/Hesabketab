
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, CalendarCheck2, FileText, Edit, MoreVertical, Users, User, Landmark } from 'lucide-react';
import type { Loan, LoanPayment, Payee, UserProfile } from '@/lib/types';
import { formatCurrency, formatJalaliDate, getPublicUrl } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '../ui/badge';
import { USER_DETAILS } from '@/lib/constants';
import { Separator } from '../ui/separator';
import Link from 'next/link';

interface LoanListProps {
  loans: Loan[];
  payees: Payee[];
  users: UserProfile[];
  loanPayments: LoanPayment[];
  onDelete: (loan: Loan) => void;
  onPay: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  isSubmitting: boolean;
}

export function LoanList({ loans, payees, users, loanPayments, onDelete, onPay, onEdit, isSubmitting }: LoanListProps) {

  const getPayeeName = (payeeId?: string) => payees.find(p => p.id === payeeId)?.name || 'نامشخص';
  const getOwnerName = (ownerId: 'ali' | 'fatemeh' | 'shared') => {
      if (ownerId === 'shared') return 'مشترک';
      return USER_DETAILS[ownerId]?.firstName || 'نامشخص';
  }

  if (loans.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent>
          <div className="text-center py-12">
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">هنوز وامی ثبت نشده است</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4 mt-4">
      {loans.sort((a, b) => (a.remainingAmount > 0 ? -1 : 1) - (b.remainingAmount > 0 ? -1 : 1) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((loan) => {
        const progress = loan.amount > 0 ? 100 - (loan.remainingAmount / loan.amount) * 100 : 0;
        const isCompleted = loan.remainingAmount <= 0;
        const paymentsForLoan = loanPayments.filter(p => p.loanId === loan.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        const attachmentUrl = loan.attachment_path ? getPublicUrl(loan.attachment_path) : null;

        return (
          <AccordionItem key={loan.id} value={loan.id} className="border-none">
            <Card className={`shadow-sm hover:shadow-md transition-shadow ${isCompleted ? 'bg-muted/50' : ''}`}>
               <div className="p-4 flex items-start justify-between">
                 <Link href={`/loans/${loan.id}`} className="flex-grow">
                    <CardTitle className={`font-headline ${isCompleted ? 'text-muted-foreground' : ''}`}>{loan.title}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-2">وام‌گیرنده: {getOwnerName(loan.ownerId)}</div>
                 </Link>
                 <Badge variant={isCompleted ? 'default' : 'secondary'}>{isCompleted ? 'تسویه شده' : 'در حال پرداخت'}</Badge>
               </div>
               <CardContent className="px-4 pb-4 pt-0">
                  <Progress value={progress} className="mt-4 h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>{formatCurrency(loan.remainingAmount, 'IRT')} مانده</span>
                    <span>{loan.paidInstallments} از {loan.numberOfInstallments} قسط</span>
                  </div>
               </CardContent>
              <AccordionTrigger className="px-4 py-2 text-sm text-muted-foreground">مشاهده تاریخچه و عملیات</AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <Separator className="mb-4"/>
                <h4 className="font-semibold mb-3">تاریخچه پرداخت‌ها</h4>
                {paymentsForLoan.length > 0 ? (
                  <ul className="space-y-3">
                    {paymentsForLoan.map(payment => {
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
                  <p className="text-sm text-muted-foreground text-center py-4">هنوز پرداختی برای این وام ثبت نشده است.</p>
                )}
                <div className="flex items-center justify-end gap-2 mt-6 border-t pt-4">
                   {attachmentUrl && (
                    <Button asChild variant="outline" size="sm">
                      <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="ml-2 h-4 w-4"/> سند وام
                      </a>
                    </Button>
                   )}
                   <Button variant="outline" onClick={() => onEdit(loan)} disabled={isCompleted || isSubmitting}><Edit className="ml-2 h-4 w-4"/> ویرایش</Button>
                   <Button onClick={() => onPay(loan)} disabled={isCompleted || isSubmitting}><CalendarCheck2 className="ml-2 h-4 w-4"/> پرداخت قسط</Button>
                </div>
              </AccordionContent>
            </Card>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
