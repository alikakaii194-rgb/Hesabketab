
"use client";

import React, { useState, useEffect } from 'react';
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
import type { PreviousDebt, BankAccount } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { CurrencyInput, Input } from '../ui/input';
import { USER_DETAILS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { uploadDebtReceipt } from '@/lib/storage';
import { cn } from '@/lib/utils';

const createFormSchema = (remainingAmount: number) => z.object({
  paymentBankAccountId: z.string().min(1, { message: 'لطفا یک کارت برای پرداخت انتخاب کنید.' }),
  amount: z.coerce
    .number()
    .positive('مبلغ پرداختی باید مثبت باشد.')
    .max(remainingAmount, `مبلغ نمی‌تواند از مبلغ باقی‌مانده (${formatCurrency(remainingAmount, 'IRT')}) بیشتر باشد.`),
  attachment_path: z.string().optional(),
});

interface PayDebtDialogProps {
  debt: PreviousDebt;
  bankAccounts: BankAccount[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { debt: PreviousDebt; paymentBankAccountId: string; amount: number; attachment_path?: string }) => void;
  isSubmitting: boolean;
}

export function PayDebtDialog({
  debt,
  bankAccounts,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: PayDebtDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

  const formSchema = createFormSchema(debt.remainingAmount);
  type PayDebtFormValues = z.infer<typeof formSchema>;

  const form = useForm<PayDebtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentBankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
      amount: debt.isInstallment && debt.installmentAmount ? Math.min(debt.installmentAmount, debt.remainingAmount) : debt.remainingAmount,
      attachment_path: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset({
            paymentBankAccountId: bankAccounts.length > 0 ? bankAccounts[0].id : '',
            amount: debt.isInstallment && debt.installmentAmount ? Math.min(debt.installmentAmount, debt.remainingAmount) : debt.remainingAmount,
            attachment_path: '',
        });
        setUploadStatus('idle');
        setFileName('');
    }
  }, [debt, bankAccounts, isOpen, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setFileName(file.name);

    try {
      const path = await uploadDebtReceipt(user, debt.id, file);
      form.setValue('attachment_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'پیوست رسید با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      form.setValue('attachment_path', '');
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود پیوست ناموفق بود.' });
      console.error(error);
    }
  };

  function handleFormSubmit(data: PayDebtFormValues) {
    onSubmit({ debt, ...data });
  }
  
  const getOwnerName = (account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  };

  const sortedBankAccounts = [...bankAccounts].sort((a,b) => b.balance - a.balance);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">پرداخت بدهی: {debt.description}</DialogTitle>
          <DialogDescription>اطلاعات پرداخت را وارد و رسید را ضمیمه کنید.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ پرداخت (تومان)</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="paymentBankAccountId" render={({ field }) => (<FormItem><FormLabel>پرداخت از کارت</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="یک کارت بانکی انتخاب کنید" /></SelectTrigger></FormControl><SelectContent>{sortedBankAccounts.map((account) => (<SelectItem key={account.id} value={account.id}>{`${account.bankName} ${getOwnerName(account)} (قابل استفاده: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            
            <FormItem>
              <FormLabel>پیوست رسید (اختیاری)</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    id="debt-receipt-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploadStatus === 'uploading' || isSubmitting}
                    className="flex-grow"
                  />
                </FormControl>
                {uploadStatus === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
              {fileName && <p className="text-sm text-muted-foreground pt-1">فایل: {fileName}</p>}
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>انصراف</Button>
              <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
                پرداخت بدهی
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
