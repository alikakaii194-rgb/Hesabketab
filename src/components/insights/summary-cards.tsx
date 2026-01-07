
import React from 'react';
import { StatsCard } from './stats-card';
import { CategorySpendingList } from './category-spending-list';
import { TrendingUp, TrendingDown, ArrowRightLeft, Scale, Target, Landmark, FileText, Handshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Stats {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  totalLiabilities: number;
  totalLoanLiability: number;
  totalDebtLiability: number;
  totalCheckLiability: number;
  totalGoalSavings: number;
  totalGoalTarget: number;
  expenseByCategory: [string, number][];
  incomeOnly: boolean;
  expenseOnly: boolean;
}

interface SummaryCardsProps {
  stats: Stats;
  title: string;
}

export function SummaryCards({ stats, title }: SummaryCardsProps) {
  
  const getNetFlowDescription = () => {
    if (stats.incomeOnly) return 'این بخش فقط شامل درآمد است';
    if (stats.expenseOnly) return 'این بخش فقط شامل هزینه است';
    if (stats.netFlow >= 0) return 'ورودی مثبت';
    return 'خروجی مثبت';
  }

  return (
    <Card className="bg-muted/20">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsCard title="کل درآمد" amount={stats.totalIncome} Icon={TrendingUp} colorClass="text-emerald-500" />
          <StatsCard title="کل هزینه" amount={stats.totalExpense} Icon={TrendingDown} colorClass="text-red-500" />
          <StatsCard
            title="جریان نقدینگی"
            amount={stats.netFlow}
            Icon={ArrowRightLeft}
            colorClass={stats.netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}
            description={getNetFlowDescription()}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
                 <CategorySpendingList categoryData={stats.expenseByCategory} />
            </div>

            <div className="space-y-4">
                <StatsCard 
                    title="مجموع کل بدهی‌ها" 
                    amount={stats.totalLiabilities} 
                    Icon={Scale} 
                    colorClass="text-destructive"
                    description="شامل چک، وام و بدهی‌های متفرقه"
                />
                <StatsCard 
                    title="پس‌انداز برای اهداف" 
                    amount={stats.totalGoalSavings} 
                    Icon={Target} 
                    colorClass="text-blue-500"
                    description={`از مجموع ${stats.totalGoalTarget.toLocaleString('fa-IR')} تومان هدف‌گذاری شده`}
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
