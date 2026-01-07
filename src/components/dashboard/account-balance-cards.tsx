
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { User, Users, Wallet } from 'lucide-react';
import React, { useMemo } from 'react';
import { USER_DETAILS } from '@/lib/constants';
import type { User as AuthUser } from '@supabase/supabase-js';

type AccountBalanceCardsProps = {
  aliBalance: number;
  fatemehBalance: number;
  sharedBalance: number;
  currentUser: AuthUser | null;
};

export function AccountBalanceCards({ aliBalance, fatemehBalance, sharedBalance, currentUser }: AccountBalanceCardsProps) {
  
  const loggedInUserOwnerId = currentUser?.email?.startsWith('ali') ? 'ali' : 'fatemeh';

  const cards = useMemo(() => {
    const allCards = [
      { id: 'shared', title: 'موجودی حساب مشترک', balance: sharedBalance, Icon: Users, description: 'موجودی کل حساب‌های مشترک' },
      { id: 'ali', title: `موجودی ${USER_DETAILS.ali.firstName}`, balance: aliBalance, Icon: User, description: 'موجودی کل حساب‌های شخصی' },
      { id: 'fatemeh', title: `موجودی ${USER_DETAILS.fatemeh.firstName}`, balance: fatemehBalance, Icon: User, description: 'موجودی کل حساب‌های شخصی' },
    ];
    
    // Sort logic: shared first, then logged-in user, then the other user.
    return allCards.sort((a, b) => {
        if (a.id === 'shared') return -1;
        if (b.id === 'shared') return 1;
        if (a.id === loggedInUserOwnerId) return -1;
        if (b.id === loggedInUserOwnerId) return 1;
        return 0;
    })
  }, [aliBalance, fatemehBalance, sharedBalance, loggedInUserOwnerId]);

  return (
    <>
      {cards.map(({id, title, balance, Icon, description}) => (
        <Card key={id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance, 'IRT')}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
