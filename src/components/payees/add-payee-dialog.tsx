
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Payee } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';


const formSchema = z.object({
  name: z.string().min(2, { message: 'نام باید حداقل ۲ حرف داشته باشد.' }),
  phoneNumber: z.string().optional(),
});

type PayeeFormValues = z.infer<typeof formSchema>;

interface AddPayeeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPayeeAdded: (newPayee: Payee) => void;
}

export function AddPayeeDialog({
  isOpen,
  onOpenChange,
  onPayeeAdded,
}: AddPayeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<PayeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        phoneNumber: '',
    },
  });

  const handleFormSubmit = async (data: PayeeFormValues) => {
    setIsSubmitting(true);
    try {
        const { data: newPayeeData, error } = await supabase
            .from('payees')
            .insert([{ name: data.name, phone_number: data.phoneNumber }])
            .select()
            .single();

        if (error) throw error;
        
        const newPayee: Payee = {
            id: newPayeeData.id,
            name: newPayeeData.name,
            phoneNumber: newPayeeData.phone_number,
        };

        toast({ title: 'موفقیت', description: 'طرف حساب جدید با موفقیت اضافه شد.' });
        onPayeeAdded(newPayee);
        onOpenChange(false);
        form.reset();

    } catch (error: any) {
         toast({ variant: "destructive", title: "خطا", description: "مشکلی در ثبت طرف حساب پیش آمد." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">افزودن سریع طرف حساب</DialogTitle>
          <DialogDescription>
            اطلاعات شخص یا شرکت مورد نظر را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام و نام خانوادگی</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: علی کاکایی" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره تلفن (اختیاری)</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: 09123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                انصراف
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ذخیره
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
