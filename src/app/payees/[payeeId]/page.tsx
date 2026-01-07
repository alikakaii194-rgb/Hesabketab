'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PayeeLedger, PayeeLedgerSkeleton } from '@/components/payees/payee-ledger';

export default function PayeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const payeeId = params.payeeId as string;

  const { isLoading, allData } = useDashboardData();
  const { payees } = allData;

  const payee = payees?.find((p) => p.id === payeeId);

  if (isLoading) {
    return <PayeeLedgerSkeleton />;
  }

  if (!payee) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>طرف حساب یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه طرف حسابی با این مشخصات در سیستم وجود ندارد.</p>
            <Button onClick={() => router.push('/payees')} className="mt-4">
              بازگشت به لیست
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <PayeeLedger payee={payee} />;
}
