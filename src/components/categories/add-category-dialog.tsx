
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

const formSchema = z.object({
  name: z.string().min(2, { message: 'نام دسته‌بندی باید حداقل ۲ حرف داشته باشد.' }),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface AddCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryAdded: (newCategory: Category) => void;
}

export function AddCategoryDialog({
  isOpen,
  onOpenChange,
  onCategoryAdded,
}: AddCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        description: '',
    },
  });

  const handleFormSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
        const { data: newCategoryData, error } = await supabase
            .from('categories')
            .insert([{ name: data.name, description: data.description }])
            .select()
            .single();

        if (error) throw error;
        
        toast({ title: 'موفقیت', description: 'دسته‌بندی جدید با موفقیت اضافه شد.' });
        onCategoryAdded(newCategoryData as Category);
        onOpenChange(false);
        form.reset();

    } catch (error: any) {
         toast({ variant: "destructive", title: "خطا", description: error.message || "مشکلی در ثبت دسته‌بندی پیش آمد." });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">افزودن سریع دسته‌بندی</DialogTitle>
          <DialogDescription>
            اطلاعات دسته‌بندی جدید را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نام دسته‌بندی</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: هزینه‌های خودرو" {...field} />
                  </FormControl>
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
                    <Textarea placeholder="توضیح مختصری در مورد این دسته‌بندی..." {...field} />
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
