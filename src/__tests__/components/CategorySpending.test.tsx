
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategorySpending } from '@/components/dashboard/category-spending';
import type { Expense, Category } from '@/lib/types';

// Mock the ChartContainer and its components since we are not testing the chart library itself
jest.mock("@/components/ui/chart", () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
  ChartLegend: ({ content }: { content: React.ReactNode }) => <div>{content}</div>,
  ChartLegendContent: () => <div>Chart Legend</div>,
}));

jest.mock("recharts", () => ({
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie">Pie</div>,
    Cell: () => null,
}));


const mockCategories: Category[] = [
  { id: 'cat1', name: 'خوراک' },
  { id: 'cat2', name: 'حمل و نقل' },
];

describe('CategorySpending', () => {
  it('should render "no data" message when there are no expenses', () => {
    render(<CategorySpending expenses={[]} categories={mockCategories} />);
    expect(screen.getByText('داده‌ای برای نمایش هزینه وجود ندارد.')).toBeInTheDocument();
  });

  it('should render "no data" message when categories are empty', () => {
     const mockExpenses: Expense[] = [
      { id: 'exp1', categoryId: 'cat1', amount: 100, date: new Date().toISOString(), description:"test", bankAccountId:"b1", createdAt: new Date(), ownerId:"ali", registeredByUserId:"u1", type:"expense", expenseFor:"ali" },
    ];
    render(<CategorySpending expenses={mockExpenses} categories={[]} />);
    expect(screen.getByText('داده‌ای برای نمایش هزینه وجود ندارد.')).toBeInTheDocument();
  });

  it('should render the chart when data is available', () => {
    const mockExpenses: Expense[] = [
      { id: 'exp1', categoryId: 'cat1', amount: 15000, date: new Date().toISOString(), description:"test", bankAccountId:"b1", createdAt: new Date(), ownerId:"ali", registeredByUserId:"u1", type:"expense", expenseFor:"ali"},
      { id: 'exp2', categoryId: 'cat2', amount: 5000, date: new Date().toISOString(), description:"test", bankAccountId:"b1", createdAt: new Date(), ownerId:"ali", registeredByUserId:"u1", type:"expense", expenseFor:"ali"},
      { id: 'exp3', categoryId: 'cat1', amount: 10000, date: new Date().toISOString(), description:"test", bankAccountId:"b1", createdAt: new Date(), ownerId:"ali", registeredByUserId:"u1", type:"expense", expenseFor:"ali"},
    ];
    render(<CategorySpending expenses={mockExpenses} categories={mockCategories} />);
    
    // Check if the chart components are rendered instead of the "no data" message
    expect(screen.queryByText('داده‌ای برای نمایش هزینه وجود ندارد.')).not.toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

});
