
"use client";
import React, { useState, useEffect } from 'react';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input, CurrencyInput, NumericInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Payee, OwnerId } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import { USER_DETAILS } from '@/lib/constants';
import { Textarea } from '../ui/textarea';
import { AddPayeeDialog } from '../payees/add-payee-dialog';
import { Switch } from '../ui/switch';
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { uploadDebtDocument } from '@/lib/storage';
import { cn, getPublicUrl } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  description: z.string().min(2, { message: 'شرح بدهی باید حداقل ۲ حرف داشته باشد.' }),
  payeeId: z.string().min(1, { message: 'لطفا طرف حساب را انتخاب کنید.' }),
  ownerId: z.enum(['ali', 'fatemeh', 'shared'], { required_error: 'لطفا مشخص کنید این بدهی برای کیست.' }),
  amount: z.coerce.number().positive({ message: 'مبلغ بدهی باید یک عدد مثبت باشد.' }),
  startDate: z.date({ required_error: 'لطفا تاریخ ایجاد بدهی را انتخاب کنید.' }),
  isInstallment: z.boolean().default(false),
  dueDate: z.date().optional(),
  firstInstallmentDate: z.date().optional(),
  numberOfInstallments: z.coerce.number().int().min(0).optional(),
  installmentAmount: z.coerce.number().min(0).optional(),
  paidInstallments: z.coerce.number().default(0),
  attachment_path: z.string().optional(),
}).refine(data => {
    if (data.isInstallment) return !!data.firstInstallmentDate;
    return !!data.dueDate;
}, {
    message: "تاریخ اولین قسط یا تاریخ سررسید الزامی است.",
    path: ["isInstallment"],
}).refine(data => {
    if (data.isInstallment && data.firstInstallmentDate) return data.firstInstallmentDate >= data.startDate;
    return true;
}, {
    message: "تاریخ اولین قسط نمی‌تواند قبل از تاریخ ایجاد بدهی باشد.",
    path: ["firstInstallmentDate"],
});

type DebtFormValues = z.infer<typeof formSchema>;

interface DebtFormProps {
  onCancel: () => void;
  onSubmit: (data: DebtFormValues) => void;
  payees: Payee[];
  isSubmitting: boolean;
  onQuickAdd?: () => void;
}

export function DebtForm({ onCancel, onSubmit, payees, isSubmitting, onQuickAdd }: DebtFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddPayeeOpen, setIsAddPayeeOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<DebtFormValues>({ resolver: zodResolver(formSchema), defaultValues: { isInstallment: false } });
  
  useEffect(() => {
    // Reset form and upload state when it becomes visible
    form.reset({ isInstallment: false });
    setPreviewUrl(null);
    setUploadStatus('idle');
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const path = await uploadDebtDocument(user, file);
      form.setValue('attachment_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'پیوست با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      setPreviewUrl(null);
      form.setValue('attachment_path', '');
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود پیوست ناموفق بود.' });
    }
  };

  const handleRemoveFile = () => {
    form.setValue('attachment_path', '');
    setPreviewUrl(null);
    setUploadStatus('idle');
  };

  const isInstallment = form.watch('isInstallment');

  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle className="font-headline">ثبت بدهی جدید</CardTitle>
          </CardHeader>
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                   <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>شرح بدهی</FormLabel><FormControl><Textarea placeholder="مثال: قرض از دوست برای خرید..." {...field} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>مبلغ کل بدهی (تومان)</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="payeeId" render={({ field }) => (<FormItem><FormLabel>طرف حساب (بستانکار)</FormLabel><Select onValueChange={(value) => value === 'add_new' ? setIsAddPayeeOpen(true) : field.onChange(value)} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="یک طرف حساب انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="add_new" className="font-bold text-primary">افزودن طرف حساب جدید...</SelectItem>{payees.map((payee) => (<SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="ownerId" render={({ field }) => (<FormItem><FormLabel>بدهی برای</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><FormControl><SelectTrigger><SelectValue placeholder="شخص مورد نظر را انتخاب کنید" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ali">{USER_DETAILS.ali.firstName}</SelectItem><SelectItem value="fatemeh">{USER_DETAILS.fatemeh.firstName}</SelectItem><SelectItem value="shared">مشترک</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ ایجاد بدهی</FormLabel><JalaliDatePicker title="تاریخ ایجاد بدهی" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                   </div>
                   <FormField control={form.control} name="isInstallment" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>آیا بدهی قسطی است؟</FormLabel><FormDescription>در غیر این صورت، یک بدهی با پرداخت یکجا ثبت می‌شود.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    {isInstallment ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField control={form.control} name="installmentAmount" render={({ field }) => (<FormItem><FormLabel>مبلغ هر قسط</FormLabel><FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="numberOfInstallments" render={({ field }) => (<FormItem><FormLabel>تعداد اقساط</FormLabel><FormControl><NumericInput {...field} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={form.control} name="firstInstallmentDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ اولین قسط</FormLabel><JalaliDatePicker title="تاریخ اولین قسط" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                        </div>
                    ) : (
                         <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاریخ سررسید</FormLabel><JalaliDatePicker title="تاریخ سررسید" value={field.value} onChange={field.onChange} /><FormMessage /></FormItem>)} />
                    )}
                   <FormField
                        control={form.control}
                        name="attachment_path"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>پیوست مستندات (اختیاری)</FormLabel>
                                <FormControl>
                                    <div className='flex items-center gap-4'>
                                        <input id='debt-attachment-upload' type='file' accept='image/*,application/pdf' onChange={handleFileChange} className='hidden' disabled={uploadStatus === 'uploading' || isSubmitting} />
                                        <label htmlFor='debt-attachment-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
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
