
"use client";

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Upload, Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input, CurrencyInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Income, BankAccount } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import type { User as AuthUser } from '@supabase/supabase-js';
import { USER_DETAILS } from '@/lib/constants';
import { Textarea } from '../ui/textarea';
import { formatCurrency, getPublicUrl, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { uploadIncomeDocument } from '@/lib/storage';
import Image from 'next/image';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  description: z.string().min(2, { message: 'شرح باید حداقل ۲ حرف داشته باشد.' }),
  date: z.date({ required_error: 'لطفا تاریخ را انتخاب کنید.' }),
  ownerId: z.enum(['ali', 'fatemeh', 'daramad_moshtarak'], { required_error: 'لطفا منبع درآمد را مشخص کنید.' }),
  bankAccountId: z.string().min(1, { message: 'لطفا کارت مقصد را انتخاب کنید.' }),
  source: z.string().optional(),
  attachment_path: z.string().optional(), // New field for the attachment path
});

type IncomeFormValues = z.infer<typeof formSchema>;

interface IncomeFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: IncomeFormValues) => void;
  initialData: Income | null;
  bankAccounts: BankAccount[];
  user: AuthUser | null;
  isSubmitting: boolean;
}

export function IncomeForm({ isOpen, setIsOpen, onSubmit, initialData, bankAccounts, user, isSubmitting }: IncomeFormProps) {
  const loggedInUserOwnerId = user?.email?.startsWith('ali') ? 'ali' : 'fatemeh';
  const { toast } = useToast();

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        description: '',
        amount: 0,
        date: new Date(),
        ownerId: loggedInUserOwnerId,
        bankAccountId: '',
        source: '',
        attachment_path: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            form.reset({ 
                ...initialData, 
                date: new Date(initialData.date),
                attachment_path: initialData.attachment_path || '',
            });
            if(initialData.attachment_path) {
              setPreviewUrl(getPublicUrl(initialData.attachment_path));
              setUploadStatus('success');
            } else {
                setPreviewUrl(null);
                setUploadStatus('idle');
            }
        } else {
            form.reset({
                description: '',
                amount: 0,
                date: new Date(),
                ownerId: loggedInUserOwnerId,
                bankAccountId: '',
                source: '',
                attachment_path: '',
            });
            setPreviewUrl(null);
            setUploadStatus('idle');
        }
    }
  }, [initialData, loggedInUserOwnerId, isOpen, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const path = await uploadIncomeDocument(user, file);
      form.setValue('attachment_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'پیوست با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      setPreviewUrl(null);
      form.setValue('attachment_path', '');
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود پیوست ناموفق بود.' });
      console.error(error);
    }
  };
  
  const handleRemoveFile = () => {
    form.setValue('attachment_path', '');
    setPreviewUrl(null);
    setUploadStatus('idle');
  };

  const selectedOwnerId = form.watch('ownerId');
  const availableAccounts = useMemo(() => {
    if (!selectedOwnerId || !bankAccounts) return [];
    let targetOwnerIds: ('ali' | 'fatemeh' | 'shared_account')[] = [];
    if (selectedOwnerId === 'daramad_moshtarak') {
        targetOwnerIds = ['shared_account'];
    } else {
        targetOwnerIds = [selectedOwnerId];
    }
    return [...bankAccounts.filter(acc => targetOwnerIds.includes(acc.ownerId))].sort((a, b) => b.balance - a.balance);
  }, [selectedOwnerId, bankAccounts]);

  const getOwnerName = useCallback((account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  }, []);

  useEffect(() => {
      const currentBankAccountId = form.getValues('bankAccountId');
      const isCurrentAccountStillValid = availableAccounts.some(acc => acc.id === currentBankAccountId);
      if (!isCurrentAccountStillValid) {
          form.setValue('bankAccountId', '');
      }
  }, [selectedOwnerId, availableAccounts, form]);

  function handleFormSubmit(data: IncomeFormValues) {
    if (!user) return;
    onSubmit({ ...data, source: data.source || data.description });
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">
            {initialData ? 'ویرایش درآمد' : 'ثبت درآمد جدید'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>شرح درآمد</FormLabel><FormControl><Textarea placeholder="مثال: حقوق ماهانه، فروش پروژه" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ (تومان)</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ</FormLabel><JalaliDatePicker title="تاریخ درآمد" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="ownerId" render={({ field }) => (<FormItem><FormLabel>منبع درآمد</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="یک منبع انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value='ali'>درآمد {USER_DETAILS.ali.firstName}</SelectItem><SelectItem value='fatemeh'>درآمد {USER_DETAILS.fatemeh.firstName}</SelectItem><SelectItem value="daramad_moshtarak">شغل مشترک</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bankAccountId" render={({ field }) => (<FormItem><FormLabel>واریز به کارت</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedOwnerId || availableAccounts.length === 0}><FormControl><SelectTrigger><SelectValue placeholder={!selectedOwnerId ? "ابتدا منبع درآمد را انتخاب کنید" : (availableAccounts.length === 0 ? "کارتی برای این منبع یافت نشد" : "یک کارت بانکی انتخاب کنید")} /></SelectTrigger></FormControl><SelectContent className="max-h-[250px]">{availableAccounts.map((account) => (<SelectItem key={account.id} value={account.id}>{`${account.bankName} (...${account.cardNumber.slice(-4)}) ${getOwnerName(account)} ${account.accountType === 'checking' ? '(جاری)' : ''} - (موجودی: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="source" render={({ field }) => (<FormItem><FormLabel>نام واریز کننده (اختیاری)</FormLabel><FormControl><Input placeholder="مثال: شرکت راهیان کار" {...field} /></FormControl><FormMessage /></FormItem>)} />

              <FormItem>
                  <FormLabel>پیوست مستندات (اختیاری)</FormLabel>
                   <FormControl>
                        <div className='flex items-center gap-4'>
                            <input id='income-attachment-upload' type='file' accept='image/*,application/pdf,.xlsx,.xls,.doc,.docx' onChange={handleFileChange} className='hidden' disabled={uploadStatus === 'uploading' || isSubmitting}/>
                            <label htmlFor='income-attachment-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
                               {uploadStatus === 'idle' && !previewUrl && <><Upload className='mx-auto mb-2 h-6 w-6' /><span>برای آپلود کلیک کنید</span></>}
                               {uploadStatus === 'uploading' && <><Loader2 className='mx-auto mb-2 h-6 w-6 animate-spin' /><span>در حال آپلود...</span></>}
                               {(uploadStatus === 'success' || (previewUrl && uploadStatus === 'idle')) && <><CheckCircle className='mx-auto mb-2 h-6 w-6 text-green-500' /><span>برای تغییر کلیک کنید</span></>}
                               {uploadStatus === 'error' && <><AlertCircle className='mx-auto mb-2 h-6 w-6 text-red-500' /><span>خطا! دوباره تلاش کنید.</span></>}
                            </label>
                            {previewUrl && (
                                <div className='relative h-24 w-24 flex-shrink-0 rounded-md border'>
                                    <Image src={previewUrl} alt='پیش‌نمایش' layout='fill' objectFit='cover' className='rounded-md' />
                                    <Button type='button' variant='destructive' size='icon' className='absolute -top-2 -right-2 h-6 w-6 rounded-full' onClick={handleRemoveFile} disabled={isSubmitting}>
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </FormControl>
                  <FormMessage />
              </FormItem>
            
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>لغو</Button>
                <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                  {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : 'ذخیره'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
