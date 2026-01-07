
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Briefcase,
  Landmark,
  Calendar,
  PenSquare,
  Building,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react';
import type { Income, BankAccount, UserProfile } from '@/lib/types';
import { formatCurrency, formatJalaliDate, getPublicUrl } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface IncomeListProps {
  incomes: Income[];
  bankAccounts: BankAccount[];
  onDelete: (income: Income) => void;
  onEdit: (income: Income) => void; // Added for editing
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

export function IncomeList({ incomes, bankAccounts, onDelete, onEdit, users }: IncomeListProps) {
  const getBankAccount = (id: string) => bankAccounts.find((acc) => acc.id === id);
  
  const getOwnerSourceText = (ownerId: 'ali' | 'fatemeh' | 'daramad_moshtarak') => {
    if (!ownerId) return 'نامشخص';
    switch (ownerId) {
      case 'ali': return `درآمد ${USER_DETAILS.ali.firstName}`;
      case 'fatemeh': return `درآمد ${USER_DETAILS.fatemeh.firstName}`;
      case 'daramad_moshtarak': return 'شغل مشترک';
      default: return 'نامشخص';
    }
  }

  const getRegisteredByName = (userId?: string) => {
    if (!userId) return "نامشخص";
    return users.find(u => u.id === userId)?.firstName || "نامشخص";
  }

  if (incomes.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader><CardTitle className="font-headline">لیست درآمدها</CardTitle></CardHeader>
        <CardContent><p className="py-8 text-center text-muted-foreground">هیچ درآمدی برای نمایش وجود ندارد.</p></CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">لیست درآمدها</CardTitle>
          <CardDescription>درآمدهای ثبت شده اخیر شما در اینجا نمایش داده می‌شود.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((income) => {
            const bankAccount = getBankAccount(income.bankAccountId);
            const attachmentUrl = income.attachment_path ? getPublicUrl(income.attachment_path) : null;

            return (
              <Card key={income.id} className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <p className="text-lg font-bold">{income.description}</p>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-emerald-500">{`+${formatCurrency(income.amount, 'IRT')}`}</p>
                      {income.ownerId === 'daramad_moshtarak' && <Badge variant="secondary">مشترک</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <Separator />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <DetailItem icon={Briefcase} label="منبع درآمد" value={getOwnerSourceText(income.ownerId)} />
                    <DetailItem icon={Building} label="واریز کننده" value={income.source} />
                    <DetailItem icon={Landmark} label="واریز به" value={bankAccount?.bankName || 'نامشخص'} />
                    <DetailItem icon={Calendar} label="تاریخ ثبت" value={formatJalaliDate(new Date(income.date))} />
                    <DetailItem icon={PenSquare} label="ثبت توسط" value={getRegisteredByName(income.registeredByUserId)} />
                  </div>
                </CardContent>
                 <CardFooter className="p-2 bg-muted/50 flex items-center justify-start gap-1">
                    <Button variant="ghost" className="text-xs" onClick={() => onEdit(income)}>
                        <Edit className="ml-2 h-4 w-4" />
                        ویرایش
                    </Button>
                    
                    {attachmentUrl && (
                         <Button asChild variant="ghost" className="text-xs text-blue-600 hover:text-blue-700">
                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="ml-2 h-4 w-4" />
                                مشاهده پیوست
                            </a>
                        </Button>
                    )}

                    <div className="flex-grow" />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" className="h-8 text-xs text-destructive" aria-label="حذف درآمد">
                                <Trash2 className="ml-2 h-4 w-4" />
                                حذف
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>آیا از حذف این درآمد مطمئن هستید؟</AlertDialogTitle>
                                <AlertDialogDescription>این عمل قابل بازگشت نیست. مبلغ از موجودی حساب کسر خواهد شد.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(income)} className={buttonVariants({ variant: "destructive" })}>بله، حذف کن</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
