
'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowRight, Plus } from 'lucide-react';
import { CategoryList } from '@/components/categories/category-list';
import { CategoryForm } from '@/components/categories/category-form';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

export default function CategoriesPage() {
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useAuth();
  
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { categories, expenses, checks } = allData;

  const handleFormSubmit = useCallback(async (values: Omit<Category, 'id'>) => {
    if (!user) return;
    setIsSubmitting(true);

    const onComplete = async () => {
        await refreshData();
        setIsSubmitting(false);
        setIsFormOpen(false);
        setEditingCategory(null);
    };

    if (editingCategory) {
        const { error } = await supabase
            .from('categories')
            .update({ name: values.name, description: values.description })
            .eq('id', editingCategory.id);

        if (error) {
            toast({ variant: "destructive", title: "خطا در ویرایش", description: error.message });
            setIsSubmitting(false);
        } else {
            toast({ title: "موفقیت", description: "دسته‌بندی با موفقیت ویرایش شد." });
            await onComplete();
        }
    } else {
        const { error } = await supabase
            .from('categories')
            .insert([{ name: values.name, description: values.description }]);

        if (error) {
            toast({ variant: "destructive", title: "خطا در ثبت", description: error.message });
            setIsSubmitting(false);
        } else {
            toast({ title: "موفقیت", description: "دسته‌بندی جدید با موفقیت اضافه شد." });
            await onComplete();
        }
    }
  }, [user, editingCategory, toast, refreshData]);

  const handleDelete = useCallback(async (categoryId: string) => {
    if (!user) return;
    
    setIsSubmitting(true);

    try {
        const isUsedInExpense = (expenses || []).some((e: any) => e.categoryId === categoryId);
        const isUsedInCheck = (checks || []).some((c: any) => c.categoryId === categoryId);

        if (isUsedInExpense || isUsedInCheck) {
            const usedIn = [];
            if(isUsedInExpense) usedIn.push("هزینه");
            if(isUsedInCheck) usedIn.push("چک");
            throw new Error(`امکان حذف وجود ندارد. این دسته‌بندی در یک یا چند ${usedIn.join(' یا ')} استفاده شده است.`);
        }

        const { error } = await supabase
            .from('categories')
            .update({ is_archived: true }) 
            .eq('id', categoryId);

        if (error) throw error;
        
        toast({ title: "موفقیت", description: "دسته‌بندی با موفقیت بایگانی (حذف) شد." });
        await refreshData();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "خطا در حذف",
            description: error.message || "مشکلی در حذف دسته‌بندی پیش آمد.",
        });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, expenses, checks, refreshData]);

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  }, []);
  
  const handleAddNew = useCallback(() => {
    setEditingCategory(null);
    setIsFormOpen(true);
  }, []);
  
  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingCategory(null);
  }, []);


  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" passHref>
              <Button variant="ghost" size="icon" className="md:hidden">
                  <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            مدیریت دسته‌بندی‌ها
          </h1>
        </div>
        {!isFormOpen && (
            <div className="hidden md:block">
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    افزودن دسته‌بندی
                </Button>
            </div>
        )}
      </div>

      {isLoading ? (
          <div className="space-y-4 mt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
      ) : isFormOpen ? (
        <CategoryForm
          onSubmit={handleFormSubmit}
          initialData={editingCategory}
          onCancel={handleCancelForm}
          isSubmitting={isSubmitting}
        />
      ) : (
        <CategoryList
          categories={categories || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Floating Action Button for Mobile */}
      {!isFormOpen && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
            <Button
              onClick={handleAddNew}
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg"
              aria-label="افزودن دسته‌بندی"
            >
              <Plus className="h-6 w-6" />
            </Button>
        </div>
      )}
    </div>
  );
}
