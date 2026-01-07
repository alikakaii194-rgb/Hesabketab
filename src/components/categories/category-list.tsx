

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import type { Category } from '@/lib/types';
import Link from 'next/link';
import { ConfirmationDialog } from '../shared/confirmation-dialog';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  isSubmitting: boolean;
}

export function CategoryList({ categories, onEdit, onDelete, isSubmitting }: CategoryListProps) {
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleConfirmDelete = () => {
    if (deletingCategory) {
      onDelete(deletingCategory.id);
      setDeletingCategory(null);
    }
  };

  if (categories.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle className="font-headline">لیست دسته‌بندی‌ها</CardTitle></CardHeader>
            <CardContent><p className='text-center text-muted-foreground py-8'>هیچ دسته‌بندی برای نمایش وجود ندارد.</p></CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">لیست دسته‌بندی‌ها</CardTitle>
          <CardDescription>دسته‌بندی‌های هزینه شما در اینجا نمایش داده می‌شوند. برای مشاهده جزئیات روی هر مورد کلیک کنید.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام دسته‌بندی</TableHead>
                <TableHead className="hidden sm:table-cell">توضیحات</TableHead>
                <TableHead className="text-left w-[150px]">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="group cursor-pointer">
                  <TableCell className="font-medium"><Link href={`/categories/${category.id}`} className="flex items-center gap-2 group-hover:underline">{category.name}</Link></TableCell>
                  <TableCell className="hidden sm:table-cell">{category.description || '-'}</TableCell>
                  <TableCell className="text-left">
                      <div className='flex items-center gap-0 justify-end'>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(category)} aria-label="Edit"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete" onClick={() => handleDeleteClick(category)}><Trash2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity"><Link href={`/categories/${category.id}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {deletingCategory && (
        <ConfirmationDialog
          isOpen={!!deletingCategory}
          onOpenChange={() => setDeletingCategory(null)}
          onConfirm={handleConfirmDelete}
          title={`آیا از حذف دسته‌بندی "${deletingCategory.name}" مطمئن هستید؟`}
          description="این عمل قابل بازگشت نیست. این دسته‌بندی برای همیشه حذف خواهد شد."
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
