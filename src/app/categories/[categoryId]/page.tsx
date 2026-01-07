'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryDetail } from '@/components/categories/category-detail';
import { CategoryDetailSkeleton } from '@/components/categories/category-detail-skeleton';

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { isLoading, allData } = useDashboardData();

  const category = allData.categories?.find((c) => c.id === categoryId);

  if (isLoading) {
    return <CategoryDetailSkeleton />;
  }

  if (!category) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>دسته‌بندی یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه دسته‌بندی با این مشخصات در سیستم وجود ندارد.</p>
            <Button onClick={() => router.push('/categories')} className="mt-4">
              بازگشت به لیست
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <CategoryDetail category={category} />
  );
}
