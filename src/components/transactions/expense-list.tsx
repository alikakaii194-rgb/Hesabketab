'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Landmark,
  Calendar,
  PenSquare,
  Users,
  User,
  FolderKanban,
  Trash2,
  Receipt,
  BookUser,
} from 'lucide-react';
import type { Expense, BankAccount, Category, UserProfile, ExpenseFor, Payee } from '@/lib/types';
import { formatCurrency, formatJalaliDate, getPublicUrl } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmationDialog } from '../shared/confirmation-dialog';

interface ExpenseListProps {
  expenses: Expense[];
  bankAccounts: BankAccount[];
  categories: Category[];
  payees: Payee[];
  onDelete: (expense: Expense) => void;
  users: UserProfile[];
}

const DetailItem = ({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: string | null | undefined; className?: string; }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-semibold ${className}`}>{value}</span>
            </div>
        </div>
    );
};


export function ExpenseList({ expenses, bankAccounts, categories, payees, onDelete, users }: ExpenseListProps) {
    const getBankAccount = (id: string) => bankAccounts.find((acc) => acc.id === id);
    const getCategoryName = (id: string) => categories.find((cat) => cat.id === id)?.name || 'نامشخص';
    const getPayeeName = (id?: string) => payees.find((p) => p.id === id)?.name;
    const getRegisteredByName = (userId?: string) => users.find(u => u.id === userId)?.firstName || "نامشخص";
    
    const getExpenseForBadge = (expenseFor: ExpenseFor) => {
        const details = USER_DETAILS[expenseFor as 'ali' | 'fatemeh'];
        if (details) return <Badge variant="secondary"><User className="ml-1 h-3 w-3" />{details.firstName}</Badge>;
        if (expenseFor === 'shared') return <Badge variant="secondary"><Users className="ml-1 h-3 w-3" />مشترک</Badge>;
        return null;
    }


  if (expenses.length === 0) {
    return (
        <Card className="mt-4">
            <CardHeader><CardTitle className="font-headline">لیست هزینه‌ها</CardTitle></CardHeader>
            <CardContent><p className="py-8 text-center text-muted-foreground">هیچ هزینه‌ای برای نمایش وجود ندارد.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader><CardTitle className="font-headline">لیست هزینه‌ها</CardTitle><CardDescription>هزینه‌های ثبت شده اخیر شما در اینجا نمایش داده می‌شود.</CardDescription></CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {expenses
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((expense) => {
            const bankAccount = getBankAccount(expense.bankAccountId);
            const registeredByName = getRegisteredByName(expense.registeredByUserId);
            const receiptUrl = expense.attachment_path ? getPublicUrl(expense.attachment_path) : null;
            const [isConfirmOpen, setConfirmOpen] = useState(false);

            return (
              <Card key={expense.id} data-testid={`expense-item-${expense.id}`} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                        <p className="text-lg font-bold">{expense.description}</p>
                        <div className="flex items-center gap-2 pt-1">{getExpenseForBadge(expense.expenseFor)}</div>
                    </div>
                    <div className="text-left"><p className="text-2xl font-bold text-destructive">{`-${formatCurrency(expense.amount, 'IRT')}`}</p></div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <Separator />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                       <DetailItem icon={FolderKanban} label="دسته‌بندی" value={getCategoryName(expense.categoryId)} />
                       <DetailItem icon={BookUser} label="طرف حساب" value={getPayeeName(expense.payeeId)} />
                       <DetailItem icon={Landmark} label="برداشت از" value={bankAccount?.bankName || 'نامشخص'} />
                       <DetailItem icon={Calendar} label="تاریخ ثبت" value={formatJalaliDate(new Date(expense.date))} />
                       <DetailItem icon={PenSquare} label="ثبت توسط" value={registeredByName} />
                    </div>
                </CardContent>
                <CardFooter className="p-2 bg-muted/50 flex items-center justify-end gap-2">
                  {receiptUrl && (
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className={`${buttonVariants({ variant: 'outline' })} text-xs mr-auto`}>
                        <Receipt className="ml-2 h-4 w-4" />مشاهده رسید
                      </a>
                  )}
                  <Button variant="ghost" className="h-8 text-xs text-destructive" aria-label="حذف هزینه" onClick={() => setConfirmOpen(true)}>
                    <Trash2 className="ml-2 h-4 w-4" />حذف تراکنش
                  </Button>
                   <ConfirmationDialog
                    isOpen={isConfirmOpen}
                    onOpenChange={setConfirmOpen}
                    onConfirm={() => { onDelete(expense); setConfirmOpen(false); }}
                    title="آیا از حذف این هزینه مطمئن هستید؟"
                    description="این عمل قابل بازگشت نیست. مبلغ هزینه به حساب شما بازگردانده خواهد شد."
                  />
                </CardFooter>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
