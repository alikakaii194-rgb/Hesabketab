
'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Target, ArrowLeft } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';


export default function SharingRedirectPage() {
  const { isLoading } = useDashboardData();
 
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8 flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <Target className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="font-headline text-2xl pt-4">
            صفحه اهداف مالی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            این بخش به صفحه "اهداف مالی" منتقل شده است. برای مدیریت اهداف و خواسته‌های خود، لطفا به این صفحه مراجعه کنید.
          </p>
          <Button asChild>
            <Link href="/goals">
              رفتن به صفحه اهداف مالی
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
