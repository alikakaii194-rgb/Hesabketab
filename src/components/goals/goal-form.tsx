"use client";
import React, { useEffect, useMemo, useState } from 'react';
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
import type { FinancialGoal, BankAccount, OwnerId } from '@/lib/types';
import { JalaliDatePicker } from '@/components/ui/jalali-calendar';
import { cn, formatCurrency, getPublicUrl } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';
import { Loader2, Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { uploadGoalImage } from '@/lib/storage';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  name: z.string().min(2, { message: 'نام هدف باید حداقل ۲ حرف داشته باشد.' }),
  targetAmount: z.coerce.number().positive({ message: 'مبلغ هدف باید یک عدد مثبت باشد.' }),
  targetDate: z.date({ required_error: 'لطفا تاریخ هدف را انتخاب کنید.' }),
  priority: z.enum(['low', 'medium', 'high'], { required_error: 'لطفا اولویت را مشخص کنید.' }),
  ownerId: z.enum(['ali', 'fatemeh', 'shared'], { required_error: 'لطفا مشخص کنید این هدف برای کیست.' }),
  image_path: z.string().optional(),
});

type GoalFormValues = z.infer<typeof formSchema>;

interface GoalFormProps {
  onSubmit: (data: GoalFormValues) => void;
  initialData: FinancialGoal | null;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function GoalForm({ onSubmit, initialData, onCancel, isSubmitting }: GoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const loggedInUserOwnerId = user?.email?.startsWith('ali') ? 'ali' : 'fatemeh';

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? { ...initialData, targetDate: new Date(initialData.targetDate), image_path: initialData.image_path || '' }
      : {
          name: '',
          targetAmount: 0,
          targetDate: new Date(),
          priority: 'medium',
          ownerId: loggedInUserOwnerId as OwnerId,
          image_path: '',
        },
  });

  useEffect(() => {
    if (initialData?.image_path) {
        setPreviewUrl(getPublicUrl(initialData.image_path));
        setUploadStatus('success');
    }
  }, [initialData]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadStatus('uploading');
    setPreviewUrl(URL.createObjectURL(file)); 

    try {
      const path = await uploadGoalImage(user, file);
      form.setValue('image_path', path);
      setUploadStatus('success');
      toast({ title: 'موفقیت', description: 'عکس هدف با موفقیت آپلود شد.' });
    } catch (error) {
      setUploadStatus('error');
      setPreviewUrl(null); 
      toast({ variant: 'destructive', title: 'خطا', description: 'آپلود عکس ناموفق بود.' });
      console.error(error);
    }
  };
  
  const handleRemoveImage = () => {
      form.setValue('image_path', '');
      setPreviewUrl(null);
      setUploadStatus('idle');
  }

  return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{initialData ? 'ویرایش هدف مالی' : 'افزودن هدف جدید'}</CardTitle>
            </CardHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>نام هدف</FormLabel>
                            <FormControl>
                            <Input placeholder="مثال: سفر به شمال" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="image_path"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>عکس هدف (اختیاری)</FormLabel>
                                <FormControl>
                                    <div className='flex items-center gap-4'>
                                        <input id='goal-image-upload' type='file' accept='image/*' onChange={handleFileChange} className='hidden' disabled={uploadStatus === 'uploading' || isSubmitting}/>
                                        <label htmlFor='goal-image-upload' className={cn('flex-1 cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary', (uploadStatus === 'uploading' || isSubmitting) && 'cursor-not-allowed opacity-50')}>
                                           {uploadStatus === 'idle' && !previewUrl && <><Upload className='mx-auto mb-2 h-6 w-6' /><span>برای آپلود کلیک کنید یا عکس را بکشید</span></>}
                                           {uploadStatus === 'uploading' && <><Loader2 className='mx-auto mb-2 h-6 w-6 animate-spin' /><span>در حال آپلود...</span></>}
                                           {(uploadStatus === 'success' || (previewUrl && uploadStatus === 'idle')) && <><CheckCircle className='mx-auto mb-2 h-6 w-6 text-green-500' /><span>برای تغییر عکس کلیک کنید</span></>}
                                           {uploadStatus === 'error' && <><AlertCircle className='mx-auto mb-2 h-6 w-6 text-red-500' /><span>خطا! دوباره تلاش کنید.</span></>}
                                        </label>
                                        {previewUrl && (
                                            <div className='relative h-24 w-24 flex-shrink-0 rounded-md border'>
                                                <Image src={previewUrl} alt='پیش‌نمایش هدف' layout='fill' objectFit='cover' className='rounded-md' />
                                                <Button type='button' variant='destructive' size='icon' className='absolute -top-2 -right-2 h-6 w-6 rounded-full' onClick={handleRemoveImage} disabled={isSubmitting}>
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
                        <FormField
                            control={form.control}
                            name="targetAmount"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>مبلغ کل هدف (تومان)</FormLabel>
                                <FormControl>
                                <CurrencyInput value={field.value} onChange={field.onChange} disabled={isSubmitting}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="targetDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>تاریخ هدف</FormLabel>
                                <JalaliDatePicker title="تاریخ هدف" value={field.value} onChange={field.onChange} />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>اولویت</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="یک اولویت انتخاب کنید" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">پایین</SelectItem>
                                    <SelectItem value="medium">متوسط</SelectItem>
                                    <SelectItem value="high">بالا</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="ownerId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>این هدف برای کیست؟</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting || !!initialData}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="شخص مورد نظر را انتخاب کنید" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ali">{USER_DETAILS.ali.firstName}</SelectItem>
                                    <SelectItem value="fatemeh">{USER_DETAILS.fatemeh.firstName}</SelectItem>
                                    <SelectItem value="shared">مشترک</SelectItem>
                                </SelectContent>
                                </Select>
                                {!!initialData && <FormDescription>مالکیت هدف پس از ایجاد قابل تغییر نیست.</FormDescription>}
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                     </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || uploadStatus === 'uploading'}>لغو</Button>
                    <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                        {(isSubmitting || uploadStatus === 'uploading') && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'ذخیره تغییرات' : 'افزودن هدف'}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
  );
}
