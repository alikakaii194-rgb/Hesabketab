"use client";

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { CurrencyInput, NumericInput } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Check, BankAccount, Payee, Category } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import { USER_DETAILS } from '@/lib/constants';
import { cn, getPublicUrl } from '@/lib/utils';
import { Textarea } from '../ui/textarea';
import { AddPayeeDialog } from '../payees/add-payee-dialog';
import { AddCategoryDialog } from '../categories/add-category-dialog';
import { SignatureDialog } from './signature-dialog';
import { useToast } from '@/hooks/use-toast';
import { uploadCheckImage } from '@/lib/storage';
import type { User } from '@supabase/supabase-js';
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  payeeId: z.string().min(1, { message: 'لطفا طرف حساب را انتخاب کنید.' }),
  bankAccountId: z.string().min(1, { message: 'لطفا حساب بانکی را انتخاب کنید.' }),
  categoryId: z.string().min(1, { message: 'لطفا دسته‌بندی را انتخاب کنید.' }),
  expenseFor: z.enum(['ali', 'fatemeh', 'shared'], { required_error: 'لطفا مشخص کنید این هزینه برای کیست.'}),
  amount: z.coerce.number().positive({ message: 'مبلغ باید یک عدد مثبت باشد.' }),
  issueDate: z.date({ required_error: 'لطفا تاریخ صدور را انتخاب کنید.' }),
  dueDate: z.date({ required_error: 'لطفا تاریخ سررسید را انتخاب کنید.' }),
  description: z.string().optional(),
  sayadId: z.string().length(16, { message: 'شناسه صیاد باید ۱۶ رقم باشد.' }),
  checkSerialNumber: z.string().min(1, { message: 'شماره سریال چک الزامی است.' }),
  signatureDataUrl: z.string().optional(),
  image_path: z.string().optional(),
}).refine(data => data.dueDate >= data.issueDate, {
    message: "تاریخ سررسید نمی‌تواند قبل از تاریخ صدور باشد.",
    path: ["dueDate"],
});

type CheckFormValues = z.infer<typeof formSchema>;

interface CheckFormProps {
  onSubmit: (data: CheckFormValues) => void;
  initialData: Check | null;
  bankAccounts: BankAccount[];
  payees: Payee[];
  categories: Category[];
  onCancel: () => void;
  user: User | null;
  isSubmitting: boolean;
  onQuickAdd?: () => void;
}

export function CheckForm({ onSubmit, initialData, bankAccounts, payees, categories, onCancel, user, isSubmitting, onQuickAdd }: CheckFormProps) {
  const { toast } = useToast();
  const [isAddPayeeOpen, setIsAddPayeeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<CheckFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          issueDate: new Date(initialData.issueDate),
          dueDate: new Date(initialData.dueDate),
        }
      : {
          payeeId: '',
          bankAccountId: '',
          categoryId: '',
          amount: 0,
          issueDate: new Date(),
          dueDate: new Date(),
          description: '',
          sayadId: '',
          checkSerialNumber: '',
        },
  });

  useEffect(() => {
    if (initialData?.imagePath) {
        setPreviewUrl(getPublicUrl(initialData.imagePath));
        setUploadStatus('success');
    } else {
        setPreviewUrl(null);
        setUploadStatus('idle');
    }
  }, [initialData]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const path = await uploadCheckImage(user, file);
      form.setValue('image_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'عکس چک با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      setPreviewUrl(null);
      form.setValue('image_path', undefined);
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود عکس چک ناموفق بود.' });
      console.error(error);
    }
  };

  const handleRemoveFile = () => {
      form.setValue('image_path', undefined);
      setPreviewUrl(null);
      setUploadStatus('idle');
  };

  const handleFormSubmit = (data: CheckFormValues) => {
      setIsSignatureDialogOpen(true);
  };
  
  const handleSignatureConfirm = (signature: string) => {
    const currentFormData = form.getValues();
    const finalData = { ...currentFormData, signatureDataUrl: signature };
    onSubmit(finalData);
    setIsSignatureDialogOpen(false);
  };

  const selectedBankAccountId = form.watch('bankAccountId');
  const selectedBankAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

  return (
      <>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{initialData ? 'ویرایش چک' : 'ثبت چک جدید'}</CardTitle>
            </CardHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)}>
                <CardContent className="space-y-4">
                   <CheckFormFields
                        form={form}
                        isSubmitting={isSubmitting}
                        bankAccounts={bankAccounts}
                        payees={payees}
                        categories={categories}
                        setIsAddPayeeOpen={setIsAddPayeeOpen}
                        setIsAddCategoryOpen={setIsAddCategoryOpen}
                        handleFileChange={handleFileChange}
                        handleRemoveFile={handleRemoveFile}
                        previewUrl={previewUrl}
                        uploadStatus={uploadStatus}
                        selectedBankAccount={selectedBankAccount}
                   />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || uploadStatus === 'uploading'}>لغو</Button>
                    <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                        {(isSubmitting || uploadStatus === 'uploading') && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'ویرایش و امضای مجدد' : 'ثبت و امضا'}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

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
        
        <SignatureDialog
          open={isSignatureDialogOpen}
          onOpenChange={setIsSignatureDialogOpen}
          onConfirm={handleSignatureConfirm}
        />
      </>
  );
}


// A new sub-component to hold the form fields for better readability
const CheckFormFields = ({ form, isSubmitting, bankAccounts, payees, categories, setIsAddPayeeOpen, setIsAddCategoryOpen, handleFileChange, handleRemoveFile, previewUrl, uploadStatus, selectedBankAccount }: any) => {
    
    const getOwnerName = (ownerId: 'ali' | 'fatemeh' | 'shared_account') => {
        if (!ownerId) return '';
        if (ownerId === 'shared_account') return `(مشترک)`;
        return `(${USER_DETAILS[ownerId]?.firstName || ''})`;
    };
    
    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="image_path"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>عکس برگه چک (اختیاری)</FormLabel>
                        <FormControl>
                            <div className='flex items-center gap-4'>
                                <input id='check-image-upload' type='file' accept='image/*' onChange={handleFileChange} className='hidden' disabled={uploadStatus === 'uploading' || isSubmitting} />
                                <label htmlFor='check-image-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
                                   {uploadStatus === 'idle' && !previewUrl && <><Upload className='mx-auto mb-2 h-6 w-6' /><span>برای آپلود کلیک کنید</span></>}
                                   {uploadStatus === 'uploading' && <><Loader2 className='mx-auto mb-2 h-6 w-6 animate-spin' /><span>در حال آپلود...</span></>}
                                   {(uploadStatus === 'success' || (previewUrl && uploadStatus === 'idle')) && <><CheckCircle className='mx-auto mb-2 h-6 w-6 text-green-500' /><span>برای تغییر کلیک کنید</span></>}
                                   {uploadStatus === 'error' && <><AlertCircle className='mx-auto mb-2 h-6 w-6 text-red-500' /><span>خطا! دوباره تلاش کنید.</span></>}
                                </label>
                                {previewUrl && (
                                    <div className='relative h-24 w-24 flex-shrink-0 rounded-md border'>
                                        <Image src={previewUrl} alt='پیش‌نمایش چک' layout='fill' objectFit='cover' className='rounded-md' />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="sayadId" render={({ field }) => (<FormItem><FormLabel>شناسه صیاد (۱۶ رقم)</FormLabel><FormControl><NumericInput {...field} maxLength={16} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="checkSerialNumber" render={({ field }) => (<FormItem><FormLabel>شماره سریال چک</FormLabel><FormControl><NumericInput {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ چک (تومان)</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="issueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ صدور</FormLabel><JalaliDatePicker title="تاریخ صدور" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ سررسید</FormLabel><JalaliDatePicker title="تاریخ سررسید" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
            </div>

            <FormField 
                control={form.control} 
                name="bankAccountId" 
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>از حساب جاری</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl><SelectTrigger><SelectValue placeholder="یک حساب جاری انتخاب کنید" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {bankAccounts.map((account: BankAccount) => (<SelectItem key={account.id} value={account.id}>{`${account.bankName} ${getOwnerName(account.ownerId)}`}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        {selectedBankAccount && <FormDescription>صاحب این حساب: <span className="font-bold">{getOwnerName(selectedBankAccount.ownerId)}</span></FormDescription>}
                        <FormMessage />
                    </FormItem>
                )} 
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="payeeId" render={({ field }) => (<FormItem><FormLabel>در وجه</FormLabel><Select onValueChange={(value) => value === 'add_new' ? setIsAddPayeeOpen(true) : field.onChange(value)} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="یک طرف حساب انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="add_new" className="font-bold text-primary">افزودن طرف حساب جدید...</SelectItem>{payees.map((payee: Payee) => (<SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>دسته‌بندی</FormLabel><Select onValueChange={(value) => value === 'add_new' ? setIsAddCategoryOpen(true) : field.onChange(value)} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="یک دسته‌بندی انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="add_new" className="font-bold text-primary">افزودن دسته‌بندی جدید...</SelectItem>{categories.map((cat: Category) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
             <FormField control={form.control} name="expenseFor" render={({ field }) => (<FormItem><FormLabel>هزینه برای</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="شخص مورد نظر را انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="shared">مشترک</SelectItem><SelectItem value="ali">{USER_DETAILS.ali.firstName}</SelectItem><SelectItem value="fatemeh">{USER_DEtails.fatemeh.firstName}</SelectItem></SelectContent></Select><FormDescription>این هزینه در آمار کدام شخص محاسبه شود؟</FormDescription><FormMessage /></FormItem>)} />

            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>توضیحات (اختیاری)</FormLabel><FormControl><Textarea placeholder="شرح مختصری در مورد این چک..." {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
    )
}
    