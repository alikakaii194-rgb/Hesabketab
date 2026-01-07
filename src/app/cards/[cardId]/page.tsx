'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { TransactionLedger } from '@/components/transactions/transaction-ledger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionLedgerSkeleton } from '@/components/transactions/transaction-ledger-skeleton';

export default function CardTransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;
  const { isLoading, allData } = useDashboardData();

  const card = allData.bankAccounts?.find((c) => c.id === cardId);

  if (isLoading) {
    return <TransactionLedgerSkeleton />;
  }

  if (!card) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>کارت بانکی یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه کارتی با این مشخصات در سیستم وجود ندارد.</p>
            <Button onClick={() => router.push('/cards')} className="mt-4">
              بازگشت به لیست کارت‌ها
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <TransactionLedger
      title={`تاریخچه تراکنش‌های ${card.bankName}`}
      subtitle={`آخرین موجودی: ${new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRT' }).format(card.balance)}`}
      filter={{ type: 'bankAccount', id: cardId }}
    />
  );
}
