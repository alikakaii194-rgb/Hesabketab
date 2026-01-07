
"use client";
import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input, CurrencyInput, NumericInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Loan, BankAccount, Payee, OwnerId } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import { cn, formatCurrency, getPublicUrl } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { USER_DETAILS } from '@/lib/constants';
import { AddPayeeDialog } from '@/components/payees/add-payee-dialog';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { uploadLoanDocument } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

const baseSchema = z.object({
  title: z.string().min(2, { message: 'عنوان وام باید حداقل ۲ حرف داشته باشد.' }),
  payeeId: z.string().optional(),
  amount: z.coerce.number().positive({ message: 'مبلغ وام باید یک عدد مثبت باشد.' }),
  ownerId: z.enum(['ali', 'fatemeh', 'shared'], { required_error: 'لطفا مشخص کنید این وام برای کیست.'}),
  installmentAmount: z.coerce.number().min(0, 'مبلغ قسط نمی‌تواند منفی باشد.').optional(),
  numberOfInstallments: z.coerce.number().int().min(0, 'تعداد اقساط نمی‌تواند منفی باشد.').optional(),
  startDate: z.date({ required_error: 'لطفا تاریخ شروع را انتخاب کنید.' }),
  firstInstallmentDate: z.date({ required_error: 'لطفا تاریخ اولین قسط را انتخاب کنید.'}),
  paymentDay: z.coerce.number().min(1).max(30, 'روز پرداخت باید بین ۱ تا ۳۰').optional(),
  depositOnCreate: z.boolean().default(false),
  depositToAccountId: z.string().optional(),
  attachment_path: z.string().optional(),
});

const formSchema = baseSchema.refine(data => {
    if (data.depositOnCreate) {
        return !!data.depositToAccountId;
    }
    return true;
}, {
    message: "برای واریز مبلغ، انتخاب حساب مقصد الزامی است.",
    path: ["depositToAccountId"], 
}).refine(data => data.firstInstallmentDate >= data.startDate, {
    message: "تاریخ اولین قسط نمی‌تواند قبل از تاریخ دریافت وام باشد.",
    path: ["firstInstallmentDate"],
});

type LoanFormValues = z.infer<typeof formSchema>;

interface LoanFormProps {
  onCancel: () => void;
  onSubmit: (data: LoanFormValues) => void;
  initialData: Loan | null;
  bankAccounts: BankAccount[];
  payees: Payee[];
  isSubmitting: boolean;
  onQuickAdd?: () => void;
}

export function LoanForm({ onCancel, onSubmit, initialData, bankAccounts, payees, isSubmitting, onQuickAdd }: LoanFormProps) {
    const { user } = useAuth();
    const [isAddPayeeOpen, setIsAddPayeeOpen] = useState(false);
    const { toast } = useToast();
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<LoanFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            payeeId: '',
            amount: 0,
            ownerId: 'shared',
            installmentAmount: 0,
            numberOfInstallments: 0,
            startDate: new Date(),
            firstInstallmentDate: new Date(),
            paymentDay: undefined,
            depositOnCreate: false,
            depositToAccountId: '',
            attachment_path: '',
        }
    });

    useEffect(() => {
        if(initialData) {
            form.reset({
                ...initialData,
                startDate: new Date(initialData.startDate),
                firstInstallmentDate: new Date(initialData.firstInstallmentDate),
            });
            if (initialData.attachment_path) {
                setPreviewUrl(getPublicUrl(initialData.attachment_path));
                setUploadStatus('success');
            }
        } else {
            form.reset({
                title: '',
                payeeId: '',
                amount: 0,
                ownerId: 'shared',
                installmentAmount: 0,
                numberOfInstallments: 0,
                startDate: new Date(),
                firstInstallmentDate: new Date(),
                paymentDay: undefined,
                depositOnCreate: false,
                depositToAccountId: '',
                attachment_path: '',
            });
            setPreviewUrl(null);
            setUploadStatus('idle');
        }
    }, [initialData, form]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setUploadStatus('uploading');
        setPreviewUrl(URL.createObjectURL(file));

        try {
        const path = await uploadLoanDocument(user, file);
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

    const watchDepositOnCreate = form.watch('depositOnCreate');
    const watchLoanOwnerId = form.watch('ownerId');
    
    const availableDepositAccounts = useMemo(() => {
        const targetOwnerIds: string[] = [];
        if (watchLoanOwnerId === 'ali') targetOwnerIds.push('ali');
        if (watchLoanOwnerId === 'fatemeh') targetOwnerIds.push('fatemeh');
        if (watchLoanOwnerId === 'shared') targetOwnerIds.push('ali', 'fatemeh', 'shared_account');
        
        return bankAccounts.filter(acc => targetOwnerIds.includes(acc.ownerId));
    }, [watchLoanOwnerId, bankAccounts]);
    
    useEffect(() => {
        const currentDepositAccountId = form.getValues('depositToAccountId');
        const isCurrentAccountValid = availableDepositAccounts.some(acc => acc.id === currentDepositAccountId);
        if (!isCurrentAccountValid) {
            form.setValue('depositToAccountId', '');
        }
    }, [watchLoanOwnerId, availableDepositAccounts, form]);
    
    const handlePayeeSelection = (value: string) => {
        if (value === 'add_new') {
            setIsAddPayeeOpen(true);
        } else {
            form.setValue('payeeId', value);
        }
    };

    const getOwnerName = (account: BankAccount) => {
        if (account.ownerId === 'shared_account') return "(مشترک)";
        const userDetail = USER_DETAILS[account.ownerId as 'ali' | 'fatemeh'];
        return userDetail ? `(${userDetail.firstName})` : "(ناشناس)";
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{initialData ? 'ویرایش وام' : 'ثبت وام جدید'}</CardTitle>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>عنوان وام</FormLabel><FormControl><Input placeholder="مثال: وام خرید خودرو" {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="payeeId" render={({ field }) => (<FormItem><FormLabel>وام دهنده (اختیاری)</FormLabel><Select onValueChange={handlePayeeSelection} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="یک طرف حساب انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="add_new" className="font-bold text-primary">افزودن طرف حساب جدید...</SelectItem>{payees.map((payee) => (<SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ کل وام (تومان)</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="ownerId" render={({ field }) => (<FormItem><FormLabel>وام برای</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="شخص مورد نظر را انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ali">{USER_DETAILS.ali.firstName}</SelectItem><SelectItem value="fatemeh">{USER_DETAILS.fatemeh.firstName}</SelectItem><SelectItem value="shared">مشترک</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="installmentAmount" render={({ field }) => (<FormItem><FormLabel>مبلغ هر قسط</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>تعداد کل اقساط</FormLabel><FormControl><NumericInput {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ دریافت وام</FormLabel><JalaliDatePicker title="تاریخ دریافت وام" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="firstInstallmentDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ اولین قسط</FormLabel><JalaliDatePicker title="تاریخ اولین قسط" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="depositOnCreate" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>مبلغ وام به حساب واریز شود؟</FormLabel><FormDescription>در صورت فعال بودن، مبلغ وام به موجودی حساب انتخابی اضافه می‌شود.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>)} />
                            {watchDepositOnCreate && (
                                <FormField control={form.control} name="depositToAccountId" render={({ field }) => (<FormItem><FormLabel>واریز به حساب</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="یک حساب برای واریز مبلغ وام انتخاب کنید" /></SelectTrigger></FormControl><SelectContent>{availableDepositAccounts.map((account) => (<SelectItem key={account.id} value={account.id}>{`${account.bankName} ${getOwnerName(account)} (موجودی: ${formatCurrency(account.balance - (account.blockedBalance || 0), 'IRT')})`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                            )}
                             <FormField
                                control={form.control}
                                name="attachment_path"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>پیوست مستندات (اختیاری)</FormLabel>
                                        <FormControl>
                                            <div className='flex items-center gap-4'>
                                                <input id='loan-attachment-upload' type='file' accept='image/*,application/pdf' onChange={handleFileChange} className='hidden' disabled={uploadStatus === 'uploading' || isSubmitting} />
                                                <label htmlFor='loan-attachment-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
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
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || uploadStatus === 'uploading'}>لغو</Button>
                            <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                                {(isSubmitting || uploadStatus === 'uploading') && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                ذخیره
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
            {isAddPayeeOpen && (
                <AddPayeeDialog isOpen={isAddPayeeOpen} onOpenChange={setIsAddPayeeOpen} onPayeeAdded={async (newPayee) => {
                    if(onQuickAdd) await onQuickAdd();
                    form.setValue('payeeId', newPayee.id);
                }} />
            )}
        </>
    );
}
