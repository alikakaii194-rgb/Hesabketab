"use client";

import React from 'react';
import type { Check, BankAccount, Payee, Category, UserProfile } from '@/lib/types';
import { USER_DETAILS } from '@/lib/constants';
import Link from 'next/link';
import { CheckPaper } from './check-paper'; 
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface CheckListProps {
  checks: Check[];
  bankAccounts: BankAccount[];
  payees: Payee[];
  categories: Category[];
  onClear: (data: { check: Check; receiptPath?: string }) => void;
  onDelete: (check: Check) => void;
  onEdit: (check: Check) => void;
  users: UserProfile[];
  isSubmitting: boolean;
}

const getDetails = (item: Check, payees: Payee[], categories: Category[], bankAccounts: BankAccount[]) => {
    const payeeName = payees.find(p => p.id === item.payeeId)?.name || 'نامشخص';
    const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'نامشخص';
    const bankAccount = bankAccounts.find(b => b.id === item.bankAccountId);
    const ownerName = bankAccount?.ownerId === 'shared_account' 
        ? 'علی و فاطمه' 
        : (bankAccount?.ownerId && USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'] 
            ? `${USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'].firstName} ${USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'].lastName}` 
            : 'ناشناس');
    const expenseForName = item.expenseFor && USER_DETAILS[item.expenseFor] ? USER_DETAILS[item.expenseFor].firstName : 'مشترک';
    const signatureImage = item.signatureDataUrl || (bankAccount?.ownerId ? (USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh']?.signatureImage) : undefined);
    
    return { payeeName, categoryName, bankAccount, ownerName, expenseForName, signatureImage };
};

export function CheckList({ checks, bankAccounts, payees, categories, onClear, onDelete, onEdit, users, isSubmitting }: CheckListProps) {
  
  if (checks.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle className="font-headline">لیست چک‌ها</CardTitle></CardHeader>
            <CardContent><p className='text-center text-muted-foreground py-8'>هیچ چکی برای نمایش وجود ندارد.</p></CardContent>
        </Card>
    );
  }

  return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {checks.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()).map((check) => {
            const { payeeName, categoryName, bankAccount, ownerName, expenseForName, signatureImage } = getDetails(check, payees, categories, bankAccounts);
            return (
                <div key={check.id} className="relative group flex flex-col" data-testid={`check-item-${check.id}`}>
                    <CheckPaper 
                        check={check}
                        bankAccount={bankAccount}
                        payeeName={payeeName}
                        ownerName={ownerName}
                        expenseForName={expenseForName}
                        categoryName={categoryName}
                        signatureImage={signatureImage}
                        showActions={true}
                        onClear={onClear}
                        onDelete={() => onDelete(check)}
                        onEdit={() => onEdit(check)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )
        })}
      </div>
  );
}
    