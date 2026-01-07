'use client';

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils";

interface IncomeExpenseChartProps {
    income: number;
    expense: number;
}

export function IncomeExpenseChart({ income, expense }: IncomeExpenseChartProps) {
  const chartData = [
    { type: "درآمد", value: income, fill: "var(--color-income)" },
    { type: "هزینه", value: expense, fill: "var(--color-expense)" },
  ];

  const chartConfig = {
    value: {
      label: "مبلغ",
    },
    income: {
      label: "درآمد",
      color: "hsl(var(--chart-2))",
    },
    expense: {
      label: "هزینه",
      color: "hsl(var(--chart-5))",
    },
  }

  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="type"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                formatter={(value) => formatCurrency(value as number, 'IRT')}
                labelClassName="font-bold text-lg"
             />}
          />
          <Bar dataKey="value" radius={8} />
        </BarChart>
      </ChartContainer>
  )
}
