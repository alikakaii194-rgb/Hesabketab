'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Transfer, BankAccount, UserProfile } from '@/lib/types';
import { formatCurrency, formatJalaliDate } from '@/lib/utils';
import { ArrowDown, ArrowUp, Banknote, Trash2, PenSquare } from 'lucide-react';
import { USER_DETAILS } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '../shared/confirmation-dialog';


interface TransferListProps {
  transfers: Transfer[];
  bankAccounts: BankAccount[];
  onDelete: (transferId: string) => void;
  users: UserProfile[];
}

const BalanceChange = ({ label, amount }: { label: string, amount: number }) => (
  <div className="text-xs">
    <span className="text-muted-foreground">{label}: </span>
    <span className="font-mono font-semibold">{formatCurrency(amount, 'IRT').replace(' تومان', '')}</span>
  </div>
);


export function TransferList({ transfers, bankAccounts, onDelete, users }: TransferListProps) {
  const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(null);

  const getAccountDisplayName = (id: string) => {
    const account = bankAccounts.find(acc => acc.id === id);
    if (!account) return { name: 'نامشخص', owner: '' };
    const ownerName = account.ownerId === 'shared_account' ? '(مشترک)' : `(${(account.ownerId && USER_DETAILS[account.ownerId as 'ali' | 'fatemeh']?.firstName) || 'ناشناس'})`;
    return { name: account.bankName, owner: ownerName };
  };

  const getRegisteredByName = (userId?: string) => users.find(u => u.id === userId)?.firstName || "نامشخص";

  if (transfers.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle className="font-headline">تاریخچه انتقال‌ها</CardTitle></CardHeader>
            <CardContent><p className='text-center text-muted-foreground py-8'>هیچ انتقالی برای نمایش وجود ندارد.</p></CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">تاریخچه انتقال‌ها</CardTitle>
            <CardDescription>انتقال‌های اخیر شما در اینجا نمایش داده می‌شود.</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="space-y-4">
        {transfers.sort((a,b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime()).map((transfer) => {
          const fromAccount = getAccountDisplayName(transfer.fromBankAccountId);
          const toAccount = getAccountDisplayName(transfer.toBankAccountId);
          const registeredByName = getRegisteredByName(transfer.registeredByUserId);

          return (
              <Card key={transfer.id}>
                  <CardHeader>
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-muted-foreground" /><p className="font-bold text-lg">{formatCurrency(transfer.amount, 'IRT')}</p></div>
                          <span className="text-sm text-muted-foreground">{formatJalaliDate(new Date(transfer.transferDate))}</span>
                      </div>
                       {transfer.description && <p className="text-sm text-muted-foreground pt-2">{transfer.description}</p>}
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-3 rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900"><ArrowUp className="h-4 w-4 text-red-500" /></div>
                              <div><p className="font-semibold text-sm">از حساب</p><p className="text-xs text-muted-foreground">{fromAccount.name} {fromAccount.owner}</p></div>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                              <BalanceChange label="موجودی قبل" amount={transfer.fromAccountBalanceBefore} />
                              <div className="text-xs flex items-center gap-1 text-red-600"><span className="font-mono font-semibold">-{formatCurrency(transfer.amount, 'IRT').replace(' تومان', '')}</span></div>
                              <BalanceChange label="موجودی بعد" amount={transfer.fromAccountBalanceAfter} />
                          </div>
                      </div>
                       <div className="flex flex-col gap-3 rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900"><ArrowDown className="h-4 w-4 text-emerald-500" /></div>
                              <div><p className="font-semibold text-sm">به حساب</p><p className="text-xs text-muted-foreground">{toAccount.name} {toAccount.owner}</p></div>
                          </div>
                          <Separator />
                           <div className="space-y-2">
                              <BalanceChange label="موجودی قبل" amount={transfer.toAccountBalanceBefore} />
                              <div className="text-xs flex items-center gap-1 text-emerald-600"><span className="font-mono font-semibold">+{formatCurrency(transfer.amount, 'IRT').replace(' تومان', '')}</span></div>
                              <BalanceChange label="موجودی بعد" amount={transfer.toAccountBalanceAfter} />
                          </div>
                      </div>
                  </CardContent>
                   <CardFooter className="p-2 bg-muted/50 flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`ثبت توسط: ${registeredByName}`}><PenSquare className="h-3 w-3" /><span>{registeredByName}</span></div>
                      <Button variant="ghost" className="h-8 text-xs text-destructive" aria-label="حذف انتقال" onClick={() => setDeletingTransfer(transfer)}><Trash2 className="ml-2 h-4 w-4" />حذف تراکنش</Button>
                  </CardFooter>
              </Card>
          );
        })}
      </div>
      
      {deletingTransfer && (
        <ConfirmationDialog
          isOpen={!!deletingTransfer}
          onOpenChange={() => setDeletingTransfer(null)}
          onConfirm={() => { onDelete(deletingTransfer.id); setDeletingTransfer(null); }}
          title="آیا از حذف این انتقال مطمئن هستید؟"
          description="این عمل قابل بازگشت نیست. با حذف این انتقال، مبلغ آن از حساب مقصد کسر و به حساب مبدا بازگردانده خواهد شد."
        />
      )}
    </>
  );
}
