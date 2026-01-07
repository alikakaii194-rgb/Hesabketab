'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { isEqual, startOfDay, endOfDay } from 'date-fns';
import { OverallSummary } from '@/components/dashboard/overall-summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { CategorySpending } from '@/components/dashboard/category-spending';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { IncomeExpenseChart } from '@/components/dashboard/income-expense-chart';
import { AccountBalanceCards } from '@/components/dashboard/account-balance-cards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_DETAILS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, TrendingUp, TrendingDown, Bell, BookCopy, Landmark, Handshake, FolderKanban, BookUser, Target, CreditCard, ArrowRightLeft, MessageSquare, Settings, BrainCircuit } from 'lucide-react';
import { getDateRange } from '@/lib/date-utils';
import type { DashboardFilter, Income, Expense, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

function DashboardSkeleton() {
  const router = useRouter();
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={handleSignOut}>
                <LogOut className="ml-2 h-4 w-4" />
                خروج اضطراری
            </Button>
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-72" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </main>
  );
}

const quickAccessItems = [
    { href: '/income', label: 'درآمدها', icon: TrendingUp, color: 'text-emerald-500' },
    { href: '/transactions', label: 'هزینه‌ها', icon: TrendingDown, color: 'text-red-500' },
    { href: '/cards', label: 'کارت‌ها', icon: CreditCard, color: 'text-sky-500' },
    { href: '/transfers', label: 'انتقال داخلی', icon: ArrowRightLeft, color: 'text-blue-500' },
    { href: '/chat', label: 'گفتگو', icon: MessageSquare, color: 'text-lime-500' },
    { href: '/goals', label: 'اهداف', icon: Target, color: 'text-teal-500' },
    { href: '/due-dates', label: 'سررسیدها', icon: Bell, color: 'text-rose-500' },
    { href: '/insights', label: 'آمار', icon: BrainCircuit, color: 'text-purple-500' },
    { href: '/payees', label: 'طرف حساب‌ها', icon: BookUser, color: 'text-pink-500' },
    { href: '/checks', label: 'چک‌ها', icon: BookCopy, color: 'text-amber-500' },
    { href: '/loans', label: 'وام‌ها', icon: Landmark, color: 'text-violet-500' },
    { href: '/debts', label: 'بدهی‌ها', icon: Handshake, color: 'text-indigo-500' },
    { href: '/categories', label: 'دسته‌بندی‌ها', icon: FolderKanban, color: 'text-orange-500' },
];

function QuickAccess() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">دسترسی سریع</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {quickAccessItems.map(item => (
                    <Link key={item.href} href={item.href} className="group">
                        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-muted hover:shadow-sm transition-all duration-200 h-full text-center border">
                           <item.icon className={cn("h-8 w-8 transition-transform group-hover:scale-110", item.color)} />
                           <span className="text-sm font-semibold">{item.label}</span>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}


export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const [ownerFilter, setOwnerFilter] = useState<DashboardFilter>('all');
  const [date, setDate] = useState<DateRange | undefined>(() => getDateRange('thisMonth').range);
  const [activePreset, setActivePreset] = useState<ReturnType<typeof getDateRange>['preset']>('thisMonth');
  
  const { allData, isLoading: isDashboardLoading } = useDashboardData();
  const { 
    incomes, 
    expenses, 
    bankAccounts, 
    categories, 
    checks, 
    loans, 
    payees, 
    previousDebts, 
    users,
    goals,
  } = allData;

  useEffect(() => {
    if (user && !isUserLoading) {
      const defaultFilter = user.email?.startsWith('ali') ? 'ali' : 'fatemeh';
      setOwnerFilter(defaultFilter);
    }
  }, [user, isUserLoading]);

  const isLoading = isUserLoading || isDashboardLoading;


  const { summary, details, globalSummary } = useMemo(() => {
    const dateMatches = (d: string) => {
        if (!date || !date.from || !date.to) return true;
        const itemDate = new Date(d);
        // Ensure we compare date parts only, ignoring time
        return itemDate >= startOfDay(date.from) && itemDate <= endOfDay(date.to);
    };

    let filteredIncomes: Income[] = [];
    let filteredExpenses: Expense[] = [];

    if (ownerFilter === 'all') {
        filteredIncomes = (incomes || []).filter(i => dateMatches(i.date));
        filteredExpenses = (expenses || []).filter(e => dateMatches(e.date));
    } else if (ownerFilter === 'daramad_moshtarak') {
        filteredIncomes = (incomes || []).filter(i => i.ownerId === 'daramad_moshtarak' && dateMatches(i.date));
    } else { // 'ali', 'fatemeh', or 'shared' (for expenses)
        if (ownerFilter === 'ali' || ownerFilter === 'fatemeh') {
             filteredIncomes = (incomes || []).filter(i => i.ownerId === ownerFilter && dateMatches(i.date));
        }
        filteredExpenses = (expenses || []).filter(e => e.expenseFor === ownerFilter && dateMatches(e.date));
    }

    const totalIncome = filteredIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const allTransactions = [...filteredIncomes, ...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Global summaries (not filtered by date/owner)
    const aliBalance = (bankAccounts || []).filter(b => b.ownerId === 'ali').reduce((sum, acc) => sum + acc.balance, 0);
    const fatemehBalance = (bankAccounts || []).filter(b => b.ownerId === 'fatemeh').reduce((sum, acc) => sum + acc.balance, 0);
    const sharedBalance = (bankAccounts || []).filter(b => b.ownerId === 'shared_account').reduce((sum, acc) => sum + acc.balance, 0);
    const totalAssets = aliBalance + fatemehBalance + sharedBalance;
    const pendingChecksAmount = (checks || []).filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
    const remainingLoanAmount = (loans || []).reduce((sum, l) => sum + l.remainingAmount, 0);
    const remainingDebtsAmount = (previousDebts || []).reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalSavedForGoals = (goals || []).reduce((sum, g) => sum + g.currentAmount, 0);
    const totalLiabilities = pendingChecksAmount + remainingLoanAmount + remainingDebtsAmount;
    const netWorth = totalAssets - totalLiabilities;
    
    return {
      summary: { totalIncome, totalExpense, netWorth, totalAssets, totalLiabilities, pendingChecksAmount, remainingLoanAmount, remainingDebtsAmount, totalSavedForGoals },
      details: { expenses: filteredExpenses, transactions: allTransactions },
      globalSummary: { aliBalance, fatemehBalance, sharedBalance },
    };
  }, [ownerFilter, date, incomes, expenses, bankAccounts, checks, loans, previousDebts, goals]);

  useEffect(() => {
    let matchedPreset: ReturnType<typeof getDateRange>['preset'] | null = null;
    const presets: Array<Parameters<typeof getDateRange>[0]> = ['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisYear'];
    for (const preset of presets) {
        const presetRange = getDateRange(preset).range;
        if (date?.from && date?.to && isEqual(date.from, presetRange.from) && isEqual(date.to, presetRange.to)) {
            matchedPreset = preset;
            break;
        }
    }
    setActivePreset(matchedPreset);
  }, [date]);


  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const handleDatePreset = (preset: Parameters<typeof getDateRange>[0]) => {
      setDate(getDateRange(preset).range);
      setActivePreset(preset);
  }
  
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold tracking-tight">داشبورد</h1>
      </div>

      <div className="space-y-4">
        <QuickAccess />
      </div>
      
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row pt-4">
          <Select onValueChange={(value) => setOwnerFilter(value as DashboardFilter)} value={ownerFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="نمایش داده‌های..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value='ali'>{USER_DETAILS.ali.firstName}</SelectItem>
              <SelectItem value='fatemeh'>{USER_DETAILS.fatemeh.firstName}</SelectItem>
              <SelectItem value="shared">مشترک (هزینه‌ها)</SelectItem>
              <SelectItem value="daramad_moshtarak">شغل مشترک (درآمد)</SelectItem>
            </SelectContent>
          </Select>
          <div className='flex gap-2'>
            <Button variant={activePreset === 'thisWeek' ? 'default' : 'outline'} onClick={() => handleDatePreset('thisWeek')}>این هفته</Button>
            <Button variant={activePreset === 'thisMonth' ? 'default' : 'outline'} onClick={() => handleDatePreset('thisMonth')}>این ماه</Button>
            <Button variant={activePreset === 'thisYear' ? 'default' : 'outline'} onClick={() => handleDatePreset('thisYear')}>امسال</Button>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 pt-4">
        <OverallSummary 
            filteredSummary={summary} 
        />
      </div>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AccountBalanceCards 
            aliBalance={globalSummary.aliBalance}
            fatemehBalance={globalSummary.fatemehBalance}
            sharedBalance={globalSummary.sharedBalance}
            currentUser={user}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4 pt-4">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="transactions">تراکنش‌ها</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle className="font-headline">درآمد در مقابل هزینه</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart income={summary.totalIncome} expense={summary.totalExpense} />
              </CardContent>
            </Card>
            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle className="font-headline">هزینه‌ها بر اساس دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySpending expenses={details.expenses} categories={categories || []} />
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle className="font-headline">موعدهای پیش رو</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <UpcomingDeadlines
                  checks={checks || []}
                  loans={loans || []}
                  payees={payees || []}
                  previousDebts={previousDebts || []}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">تراکنش‌های اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions
                transactions={details.transactions}
                categories={categories || []}
                bankAccounts={bankAccounts || []}
                users={users || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
