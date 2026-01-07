

"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
  FormDescription
} from '@/components/ui/form';
import { Input, CurrencyInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Expense, BankAccount, Category, Payee, ExpenseFor } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import { cn, formatCurrency, getPublicUrl } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import { Textarea } from '../ui/textarea';
import { AddPayeeDialog } from '../payees/add-payee-dialog';
import { AddCategoryDialog } from '../categories/add-category-dialog';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { uploadReceipt } from '@/lib/storage';
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  description: z.string().min(2, { message: 'شرح هزینه باید حداقل ۲ حرف داشته باشد.' }),
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  date: z.date({ required_error: 'لطفا تاریخ را انتخاب کنید.' }),
  bankAccountId: z.string().min(1, { message: 'لطفا کارت برداشت را انتخاب کنید.' }),
  categoryId: z.string().min(1, { message: 'لطفا دسته‌بندی را انتخاب کنید.' }),
  expenseFor: z.enum(['ali', 'fatemeh', 'shared']).default('shared'),
  payeeId: z.string().optional(),
  attachment_path: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: ExpenseFormValues) => void;
  initialData: Expense | null;
  bankAccounts: BankAccount[];
  categories: Category[];
  payees: Payee[];
  user: User | null;
  isSubmitting: boolean;
  onQuickAdd?: () => void;
}

export function ExpenseForm({ isOpen, setIsOpen, onSubmit, initialData, bankAccounts, categories, payees, user, isSubmitting, onQuickAdd }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isAddPayeeOpen, setIsAddPayeeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        description: '',
        amount: 0,
        date: new Date(),
        bankAccountId: '',
        categoryId: '',
        expenseFor: 'shared',
        payeeId: '',
        attachment_path: '',
      },
  });

  useEffect(() => {
    if (isOpen) {
        const defaultVals = initialData 
            ? { ...initialData, date: new Date(initialData.date), expenseFor: initialData.expenseFor || 'shared' }
            : {
                description: '',
                amount: 0,
                date: new Date(),
                bankAccountId: '',
                categoryId: '',
                expenseFor: 'shared',
                payeeId: '',
                attachment_path: '',
            };
        form.reset(defaultVals as any);

        if (initialData?.attachment_path) {
            setPreviewUrl(getPublicUrl(initialData.attachment_path));
            setUploadStatus('success');
        } else {
            setPreviewUrl(null);
            setUploadStatus('idle');
        }
    }
  }, [isOpen, initialData, form]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const path = await uploadReceipt(user, file);
      form.setValue('attachment_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'رسید با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      setPreviewUrl(null);
      form.setValue('attachment_path', '');
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود رسید ناموفق بود.' });
      console.error(error);
    }
  };

  const handleRemoveFile = () => {
      form.setValue('attachment_path', '');
      setPreviewUrl(null);
      setUploadStatus('idle');
  }

  const handleFormSubmit = (data: ExpenseFormValues) => {
      const submissionData = {...data};
      if (submissionData.payeeId === 'none') {
          delete (submissionData as any).payeeId;
      }
      onSubmit(submissionData);
  };

  const selectedBankAccountId = form.watch('bankAccountId');
  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

  const getOwnerName = (account: BankAccount) => {
    if (account.ownerId === 'shared_account') return "(مشترک)";
    const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
    return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
  };

  const handlePayeeSelection = (value: string) => {
    if (value === 'add_new') {
        setIsAddPayeeOpen(true);
    } else {
        form.setValue('payeeId', value);
    }
  };
  
  const handleCategorySelection = (value: string) => {
    if (value === 'add_new') {
        setIsAddCategoryOpen(true);
    } else {
        form.setValue('categoryId', value);
    }
  };

  const sortedBankAccounts = [...bankAccounts].sort((a,b) => b.balance - a.balance);

  return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className='max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
                <DialogTitle className="font-headline">{initialData ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</DialogTitle>
                <DialogDescription>اطلاعات هزینه جدید را وارد و در صورت تمایل، رسید آن را آپلود کنید.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>شرح هزینه</FormLabel>
                            <FormControl>
                                <Textarea placeholder="مثال: خرید هفتگی از هایپراستار" {...field} disabled={isSubmitting}/>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="attachment_path"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>عکس رسید (اختیاری)</FormLabel>
                                <FormControl>
                                    <div className='flex items-center gap-4'>
                                        <input
                                            id='receipt-upload'
                                            type='file'
                                            accept='image/*,application/pdf'
                                            onChange={handleFileChange}
                                            className='hidden'
                                            disabled={uploadStatus === 'uploading' || isSubmitting}
                                        />
                                        <label htmlFor='receipt-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
                                            {uploadStatus === 'idle' && !previewUrl && <><Upload className='mx-auto mb-2 h-6 w-6' /><span>برای آپلود کلیک کنید</span></>}
                                            {uploadStatus === 'uploading' && <><Loader2 className='mx-auto mb-2 h-6 w-6 animate-spin' /><span>در حال آپلود...</span></>}
                                            {(uploadStatus === 'success' || (previewUrl && uploadStatus === 'idle')) && <><CheckCircle className='mx-auto mb-2 h-6 w-6 text-green-500' /><span>برای تغییر کلیک کنید</span></>}
                                            {uploadStatus === 'error' && <><AlertCircle className='mx-auto mb-2 h-6 w-6 text-red-500' /><span>خطا! دوباره تلاش کنید.</span></>}
                                        </label>
                                        {previewUrl && (
                                            <div className='relative h-24 w-24 flex-shrink-0 rounded-md border'>
                                                <Image src={previewUrl} alt='پیش‌نمایش رسید' layout='fill' objectFit='cover' className='rounded-md' />
                                                <Button type='button' variant='destructive' size='icon' className='absolute -top-2 -right-2 h-6 w-6 rounded-full' onClick={handleRemoveFile} disabled={isSubmitting}>
                                                    <Trash2 className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>مبلغ</FormLabel>
                                <FormControl>
                                    <CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>تاریخ</FormLabel>
                                <JalaliDatePicker title="تاریخ هزینه" value={field.value} onChange={field.onChange} />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="bank-account-select-wrapper">
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
                                {selectedBankAccount && 
                                    <FormDescription className={cn('pt-1', (selectedBankAccount.balance - (selectedBankAccount.blockedBalance || 0)) < form.getValues('amount') && 'text-destructive font-bold')}>
                                        موجودی قابل استفاده: {formatCurrency(selectedBankAccount.balance - (selectedBankAccount.blockedBalance || 0), 'IRT')}
                                    </FormDescription>
                                }
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="expenseFor"
                            render={({ field }) => (
                                <FormItem data-testid="expense-for-select-wrapper">
                                <FormLabel>این هزینه برای کیست؟</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="شخص مورد نظر را انتخاب کنید" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="shared">مشترک</SelectItem>
                                        <SelectItem value="ali">{USER_DETAILS.ali.firstName}</SelectItem>
                                        <SelectItem value="fatemeh">{USER_DETAILS.fatemeh.firstName}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem data-testid="category-select-wrapper">
                                <FormLabel>دسته‌بندی</FormLabel>
                                <Select onValueChange={handleCategorySelection} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="یک دسته‌بندی انتخاب کنید" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="add_new" className="font-bold text-primary">افزودن دسته‌بندی جدید...</SelectItem>
                                        {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="payeeId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>طرف حساب (اختیاری)</FormLabel>
                                <Select onValueChange={handlePayeeSelection} value={field.value} disabled={isSubmitting}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="یک طرف حساب انتخاب کنید" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">هیچکدام / پرداخت نقدی</SelectItem>
                                        <SelectItem value="add_new" className="font-bold text-primary">افزودن طرف حساب جدید...</SelectItem>
                                        {payees.map((payee) => (
                                        <SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting || uploadStatus === 'uploading'}>لغو</Button>
                        <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                            {(isSubmitting || uploadStatus === 'uploading') && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'در حال ذخیره...' : (initialData ? 'ذخیره تغییرات' : 'ذخیره')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {isAddPayeeOpen && (
            <AddPayeeDialog
                isOpen={isAddPayeeOpen}
                onOpenChange={setIsAddPayeeOpen}
                onPayeeAdded={async (newPayee) => {
                    if(onQuickAdd) await onQuickAdd();
                    form.setValue('payeeId', newPayee.id);
                }}
            />
        )}
        
        {isAddCategoryOpen && (
            <AddCategoryDialog
                isOpen={isAddCategoryOpen}
                onOpenChange={setIsAddCategoryOpen}
                onCategoryAdded={async (newCategory) => {
                    if(onQuickAdd) await onQuickAdd();
                    form.setValue('categoryId', newCategory.id);
                }}
            />
        )}
      </>
  );
}
