
"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/input';
import type { FinancialGoal, BankAccount, OwnerId } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';


const createFormSchema = (maxAmount: number) => z.object({
  bankAccountId: z.string().min(1, { message: 'لطفا یک کارت برای برداشت انتخاب کنید.' }),
  amount: z.coerce
    .number()
    .positive({ message: 'مبلغ باید یک عدد مثبت باشد.' })
    .max(maxAmount, { message: `مبلغ نمی‌تواند از ${formatCurrency(maxAmount, 'IRT')} (مبلغ باقی‌مانده) بیشتر باشد.`}),
});


interface AddToGoalDialogProps {
  goal: FinancialGoal;
  bankAccounts: BankAccount[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { goal: FinancialGoal; amount: number; bankAccountId: string; }) => void;
  isSubmitting: boolean;
}

export function AddToGoalDialog({
  goal,
  bankAccounts,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AddToGoalDialogProps) {
    
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const formSchema = createFormSchema(remainingAmount);
  type AddToGoalFormValues = z.infer<typeof formSchema>;

  const form = useForm<AddToGoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
      amount: 0,
    },
  });
  
  React.useEffect(() => {
    if (isOpen) {
        form.reset({
            bankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
            amount: 0,
        });
    }
  }, [goal, bankAccounts, isOpen, form]);


  const getOwnerName = (account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  };

  const selectedBankAccountId = form.watch('bankAccountId');
  const amountToContribute = form.watch('amount');
  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);
  const availableBalance = selectedBankAccount ? selectedBankAccount.balance - (selectedBankAccount.blockedBalance || 0) : 0;
  
  const hasInsufficientFunds = amountToContribute > availableBalance;

  function handleFormSubmit(data: AddToGoalFormValues) {
    if (hasInsufficientFunds || isSubmitting) return;
    onSubmit({
      goal,
      ...data,
    });
  }

  const sortedBankAccounts = [...bankAccounts].sort((a,b) => b.balance - a.balance);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">افزودن به پس‌انداز هدف: {goal.name}</DialogTitle>
          <DialogDescription>
            مبلغ مورد نظر را از یکی از حساب‌ها به پس‌انداز این هدف اضافه کنید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
             <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                    مبلغ باقی‌مانده تا رسیدن به هدف: <span className="font-bold font-mono">{formatCurrency(remainingAmount, 'IRT')}</span>
                </AlertDescription>
             </Alert>
            
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>برداشت از کارت</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="یک کارت بانکی انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedBankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                           {`${account.bankName} ${getOwnerName(account)} (قابل استفاده: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مبلغ (تومان)</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/>
                  </FormControl>
                  {selectedBankAccount && (
                    <FormDescription className={cn(hasInsufficientFunds && "text-destructive font-bold")}>
                        موجودی قابل استفاده: {formatCurrency(availableBalance, 'IRT')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                انصراف
              </Button>
              <Button type="submit" disabled={hasInsufficientFunds || isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                افزودن و مسدود کردن
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
