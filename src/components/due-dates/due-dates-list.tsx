
'use client';

import React from 'react';
import type { Check, Loan, PreviousDebt, OwnerId } from '@/lib/types';
import { formatCurrency, formatJalaliDate, toPersianDigits } from '@/lib/utils';
import { differenceInDays, isPast, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Handshake, Landmark, HandCoins, AlertTriangle, User, Users, FolderKanban, BookUser, PenSquare, MessageSquareText, FileBadge } from 'lucide-react';
import { USER_DETAILS } from '@/lib/constants';
import { Separator } from '../ui/separator';

export type Deadline = {
  id: string;
  type: 'check' | 'loan' | 'debt';
  date: Date;
  title: string;
  amount: number;
  details: {
    liabilityOwnerId: OwnerId | 'shared_account'; // The person/entity responsible for paying
    expenseFor: OwnerId; // The beneficiary
    bankAccountName?: string; // Only for checks
    registeredBy: string;
    categoryName: string;
    payeeName?: string;
    description?: string;
    sayadId?: string; // Specific to checks
  };
  originalItem: Check | Loan | PreviousDebt;
};

interface DueDatesListProps {
  deadlines: Deadline[];
  onAction: (item: Deadline) => void;
}

const ItemIcon = ({ type }: { type: Deadline['type'] }) => {
  const baseClasses = "h-8 w-8";
  switch (type) {
    case 'check':
      return <FileText className={`${baseClasses} text-amber-600`} />;
    case 'loan':
      return <Landmark className={`${baseClasses} text-sky-600`} />;
    case 'debt':
      return <Handshake className={`${baseClasses} text-indigo-600`} />;
  }
};

const getOwnerDetails = (ownerId: OwnerId | 'shared_account') => {
    if (ownerId === 'shared' || ownerId === 'shared_account') return { name: "مشترک", Icon: Users };
    const userDetail = USER_DETAILS[ownerId as 'ali' | 'fatemeh'];
    if (!userDetail) return { name: "ناشناس", Icon: User };
    return { name: userDetail.firstName, Icon: User };
};


const renderStatus = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    const daysDiff = differenceInDays(dueDate, today);

    if (daysDiff === 0) {
      return <span className="font-bold text-amber-600">امروز</span>;
    }
    if (daysDiff < 0) {
      return <span className="text-destructive font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{toPersianDigits(Math.abs(daysDiff))} روز گذشته</span>;
    }
    return <span className="text-muted-foreground">{toPersianDigits(daysDiff)} روز دیگر</span>;
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2 text-xs">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="truncate">
                <span className="text-muted-foreground">{label}: </span>
                <span className="font-semibold">{value}</span>
            </p>
        </div>
    );
};


export function DueDatesList({ deadlines, onAction }: DueDatesListProps) {
  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex h-48 flex-col items-center justify-center gap-4 text-center">
            <HandCoins className="h-16 w-16 text-emerald-500" />
            <h3 className="text-xl font-bold">تبریک!</h3>
            <p className="text-muted-foreground">شما هیچ تعهد مالی نزدیک یا پرداخت معوقی ندارید.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deadlines.map((item) => {
        const { Icon: BeneficiaryIcon, name: beneficiaryName } = getOwnerDetails(item.details.expenseFor);
        const { Icon: LiabilityOwnerIcon, name: liabilityOwnerName } = getOwnerDetails(item.details.liabilityOwnerId);
        const isOverdue = isPast(item.date) && !isToday(item.date);
        
        let cardClasses = "shadow-md transition-shadow hover:shadow-lg";
        if(isOverdue) {
            cardClasses += " border-destructive bg-destructive/5";
        }


        return (
            <Card key={`${item.type}-${item.id}`} className={cardClasses}>
                <CardHeader className="flex-row items-start justify-between gap-4 pb-4">
                    <div className="flex items-start gap-4">
                        <ItemIcon type={item.type} />
                        <div className="space-y-1">
                            <CardTitle className={`text-lg ${isOverdue ? 'text-destructive' : ''}`}>{item.title}</CardTitle>
                            <p className="text-xs text-muted-foreground font-mono">
                                {formatJalaliDate(item.date)}
                            </p>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-xl font-mono tracking-tighter">{formatCurrency(item.amount, 'IRT')}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <Separator />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 pt-4">
                        <DetailItem icon={BookUser} label="طرف حساب" value={item.details.payeeName} />
                        <DetailItem icon={FolderKanban} label="بابت" value={item.details.categoryName} />
                        <DetailItem icon={LiabilityOwnerIcon} label="تعهد برای" value={liabilityOwnerName} />
                        <DetailItem icon={BeneficiaryIcon} label="ذی‌نفع" value={beneficiaryName} />
                        <DetailItem icon={PenSquare} label="ثبت توسط" value={item.details.registeredBy} />
                        {item.details.bankAccountName && <DetailItem icon={Landmark} label="از حساب" value={item.details.bankAccountName} />}
                        {item.details.sayadId && <DetailItem icon={FileBadge} label="شناسه صیاد" value={item.details.sayadId} />}
                        {item.details.description && <div className="col-span-full"><DetailItem icon={MessageSquareText} label="توضیحات" value={item.details.description} /></div>}
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between bg-muted/50 p-3">
                     <p className="text-sm font-semibold">{renderStatus(item.date)}</p>
                     <Button onClick={() => onAction(item)} size="sm">
                        {item.type === 'check' ? 'مدیریت چک' : 'پرداخت'}
                    </Button>
                </CardFooter>
            </Card>
      )})}
    </div>
  );
}
