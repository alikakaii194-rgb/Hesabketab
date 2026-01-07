

"use client";

import React, { useMemo, useEffect } from 'react';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input, CurrencyInput } from '@/components/ui/input';
import type { FinancialGoal, BankAccount, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { USER_DETAILS } from '@/lib/constants';

const formSchema = z.object({
  paymentCardId: z.string().optional(),
  actualCost: z.coerce.number().min(0, { message: 'مبلغ واقعی نمی‌تواند منفی باشد.' }),
});

type AchieveGoalFormValues = z.infer<typeof formSchema>;

interface AchieveGoalDialogProps {
  goal: FinancialGoal;
  bankAccounts: BankAccount[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { goal: FinancialGoal, actualCost: number; paymentCardId?: string; }) => void;
  isSubmitting: boolean;
}

export function AchieveGoalDialog({
  goal,
  bankAccounts,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AchieveGoalDialogProps) {
  
  const form = useForm<AchieveGoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentCardId: '',
      actualCost: goal.targetAmount,
    },
  });

  const getOwnerName = (account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  };
  
  const actualCost = form.watch('actualCost');
  const cashPaymentNeeded = Math.max(0, actualCost - goal.currentAmount);
  
  const availablePaymentAccounts = [...bankAccounts].sort((a,b) => b.balance - a.balance);


  function handleFormSubmit(data: AchieveGoalFormValues) {
    if (cashPaymentNeeded > 0 && !data.paymentCardId) {
        form.setError('paymentCardId', { type: 'manual', message: 'برای پرداخت مابقی، انتخاب کارت الزامی است.' });
        return;
    }
    onSubmit({
      goal,
      actualCost: data.actualCost,
      paymentCardId: data.paymentCardId,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">تحقق هدف: {goal.name}</DialogTitle>
          <DialogDescription>
            مبلغ واقعی هزینه شده برای هدف را وارد کرده و در صورت نیاز، کارت پرداخت مابقی را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form} key={goal.id}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="actualCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ واقعی هزینه شده (تومان)</FormLabel>
                    <FormControl>
                      <CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="font-bold">جزئیات مالی</AlertTitle>
              <AlertDescription className="space-y-1 text-sm">
                <div className="flex justify-between"><span>مبلغ پس‌انداز شده:</span> <span className="font-mono">{formatCurrency(goal.currentAmount, 'IRT')}</span></div>
                <div className="flex justify-between font-bold text-primary"><span>مبلغ نقدی مورد نیاز:</span> <span className="font-mono">{formatCurrency(cashPaymentNeeded, 'IRT')}</span></div>
              </AlertDescription>
            </Alert>
            
            {cashPaymentNeeded > 0 && (
                <FormField
                control={form.control}
                name="paymentCardId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>پرداخت مابقی از کارت</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="یک کارت بانکی انتخاب کنید" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {availablePaymentAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {`${account.bankName} (...${account.cardNumber.slice(-4)}) ${getOwnerName(account)} - (قابل استفاده: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            <p className="text-xs text-muted-foreground">
              پس از تایید، هزینه(ها) در سیستم ثبت و موجودی حساب(های) شما به روز خواهد شد.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                انصراف
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تایید و تحقق هدف
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
