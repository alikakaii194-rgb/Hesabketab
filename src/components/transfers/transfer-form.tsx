
"use client";

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CurrencyInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { BankAccount, OwnerId } from '@/lib/types';
import { ArrowDown, ArrowRightLeft, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';
import { USER_DETAILS } from '@/lib/constants';

const formSchema = z.object({
  fromBankAccountId: z.string().min(1, { message: 'لطفا حساب مبدا را انتخاب کنید.' }),
  toBankAccountId: z.string().min(1, { message: 'لطفا حساب مقصد را انتخاب کنید.' }),
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  description: z.string().optional(),
});

type TransferFormValues = z.infer<typeof formSchema>;

interface TransferFormProps {
  onSubmit: (data: TransferFormValues) => void;
  bankAccounts: BankAccount[];
  user: User | null;
  onCancel: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSubmitting: boolean;
}

export function TransferForm({ onSubmit, bankAccounts, user, onCancel, isOpen, setIsOpen, isSubmitting }: TransferFormProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromBankAccountId: '',
      toBankAccountId: '',
      amount: 0,
      description: '',
    },
  });
  
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const getOwnerName = (account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  };

  function handleFormSubmit(data: TransferFormValues) {
    onSubmit(data);
  }

  const fromAccountId = form.watch('fromBankAccountId');
  const fromAccount = bankAccounts.find(acc => acc.id === fromAccountId);
  const fromAccountAvailableBalance = fromAccount ? fromAccount.balance - (fromAccount.blockedBalance || 0) : 0;

  const sortedFromAccounts = [...bankAccounts].sort((a, b) => b.balance - a.balance);

  const availableToAccounts = React.useMemo(() => {
    const sorted = [...bankAccounts].sort((a,b) => b.balance - a.balance);
    return sorted.filter(acc => acc.id !== fromAccountId);
  }, [fromAccountId, bankAccounts]);

  React.useEffect(() => {
    const toAccountId = form.getValues('toBankAccountId');
    if (toAccountId && !availableToAccounts.some(acc => acc.id === toAccountId)) {
      form.setValue('toBankAccountId', '');
    }
  }, [fromAccountId, availableToAccounts, form]);


  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="font-headline flex items-center gap-2">
                    <ArrowRightLeft className="h-6 w-6 text-primary"/>
                    <span>فرم انتقال وجه</span>
                </DialogTitle>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
                <FormField
                    control={form.control}
                    name="fromBankAccountId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>از حساب</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="یک حساب بانکی به عنوان مبدا انتخاب کنید" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[250px]">
                            {sortedFromAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {`${account.bankName} ${getOwnerName(account)} - (قابل استفاده: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <div className="flex justify-center">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                </div>

                <FormField
                    control={form.control}
                    name="toBankAccountId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>به حساب</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!fromAccountId || isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder={!fromAccountId ? "ابتدا حساب مبدا را انتخاب کنید" : "یک حساب بانکی به عنوان مقصد انتخاب کنید"} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[250px]">
                            {availableToAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                                {`${account.bankName} ${getOwnerName(account)} - (موجودی: ${formatCurrency(account.balance, 'IRT')})`}
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
                        <FormLabel>مبلغ انتقال (تومان)</FormLabel>
                        <FormControl>
                        <CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/>
                        </FormControl>
                        {fromAccount && (
                            <p className="text-xs text-muted-foreground pt-1">
                                موجودی قابل استفاده مبدا: {formatCurrency(fromAccountAvailableBalance, 'IRT')}
                            </p>
                        )}
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>توضیحات (اختیاری)</FormLabel>
                        <FormControl>
                        <Textarea placeholder="شرح مختصری از این انتقال..." {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>لغو</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        تایید و انتقال
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
      </Dialog>
  );
}
