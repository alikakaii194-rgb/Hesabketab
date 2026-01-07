
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { FolderKanban } from 'lucide-react';

interface CategorySpendingListProps {
  categoryData: [string, number][];
}

export function CategorySpendingList({ categoryData }: CategorySpendingListProps) {
  const totalSpending = categoryData.reduce((sum, [, amount]) => sum + amount, 0);

  if (categoryData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        هیچ هزینه‌ای برای نمایش وجود ندارد.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-muted-foreground" />
          تفکیک هزینه‌ها
        </CardTitle>
        <CardDescription>بررسی سهم هر دسته‌بندی از کل هزینه‌ها.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryData.map(([category, amount]) => {
          const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
          return (
            <div key={category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{category}</span>
                <span className="font-mono font-semibold">{formatCurrency(amount, 'IRT')}</span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
