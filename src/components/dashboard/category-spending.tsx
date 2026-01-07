
'use client';

import * as React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { type Expense, type Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';


const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(240, 50%, 60%)',
  'hsl(300, 50%, 60%)',
  'hsl(20, 50%, 60%)',
];

type SpendingChartProps = {
  expenses: Expense[];
  categories: Category[];
};

export function CategorySpending({ expenses, categories }: SpendingChartProps) {
  
  const chartData = React.useMemo(() => {
    if (!categories || categories.length === 0 || !expenses || expenses.length === 0) return [];
    
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'متفرقه';

    const expenseByCategory = expenses
      .reduce((acc, t) => {
        const categoryLabel = getCategoryName(t.categoryId);
        acc[categoryLabel] = (acc[categoryLabel] || 0) + t.amount;
        return acc;
      }, {} as { [key: string]: number });

    return Object.entries(expenseByCategory).map(([category, total]) => ({
      name: category,
      value: total,
      tooltip: formatCurrency(total, 'IRT'),
    })).sort((a,b) => b.value - a.value);
  }, [expenses, categories]);
  
  const chartConfig = React.useMemo(() => {
      const config: any = {};
      chartData.forEach((item, index) => {
          config[item.name] = {
              label: item.name,
              color: CHART_COLORS[index % CHART_COLORS.length],
          };
      });
      return config;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <p className="text-muted-foreground">داده‌ای برای نمایش هزینه وجود ندارد.</p>
      </div>
    );
  }
  
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value, name) => <div><p className="font-bold">{formatCurrency(value as number, 'IRT')}</p></div>}
            hideLabel 
          />}
        />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name in chartConfig ? chartConfig[entry.name].color : CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
        </Pie>
        <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
