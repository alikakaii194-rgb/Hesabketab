'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreVertical, Wifi, Users, User, History, Copy, PiggyBank } from 'lucide-react';
import type { BankAccount, UserProfile, FinancialGoal, OwnerId, BankTheme } from '@/lib/types';
import { formatCurrency, cn, formatCardNumber } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { USER_DETAILS } from '@/lib/constants';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getBankTheme } from '@/lib/bank-data';
import { Separator } from '../ui/separator';
import { supabase } from '@/lib/supabase-client';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ConfirmationDialog } from '../shared/confirmation-dialog';

const ChipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="36" viewBox="0 0 48 36" fill="none" className="w-10 h-auto sm:w-12">
        <rect x="0.5" y="0.5" width="47" height="35" rx="4.5" fill="#D9D9D9" stroke="#A6A6A6"/>
        <path d="M24 0V36" stroke="#A6A6A6" strokeWidth="0.5"/>
        <path d="M24 18H0" stroke="#A6A6A6" strokeWidth="0.5"/>
        <path d="M24 18H48" stroke="#A6A6A6" strokeWidth="0.5"/>
        <path d="M12 9H36" stroke="#A6A6A6" strokeWidth="0.5"/>
        <path d="M12 27H36" stroke="#A6A6A6" strokeWidth="0.5"/>
    </svg>
);

const OWNER_DETAILS_CARDS: Record<'ali' | 'fatemeh' | 'shared_account', { name: string; Icon: React.ElementType }> = {
    ali: { name: USER_DETAILS.ali.firstName, Icon: User },
    fatemeh: { name: USER_DETAILS.fatemeh.firstName, Icon: User },
    shared_account: { name: "مشترک", Icon: Users }
};

function CardItem({ card, onEdit, onDelete }: { card: BankAccount; onEdit: (card: BankAccount) => void; onDelete: (cardId: string) => void; }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const availableBalance = card.balance; // No longer subtracting blockedBalance

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد", description: `${label} در کلیپ‌بورد کپی شد.` });
    };

    const { name: ownerName, Icon: OwnerIcon } = OWNER_DETAILS_CARDS[card.ownerId];
    const themeClasses = getBankTheme(card.theme as BankTheme | null);

    return (
        <>
            <div className="relative group flex flex-col">
                <div className={cn("relative rounded-t-xl p-4 sm:p-6 text-white flex flex-col justify-between shadow-lg aspect-[1.586] bg-gradient-to-br transition-transform", themeClasses)}>
                    <div className="absolute inset-0 bg-black/10 rounded-t-xl"></div>
                    <div className='relative z-10 flex justify-between items-start'>
                        <span className="font-bold text-base sm:text-lg tracking-wider">{card.bankName}{card.accountType === 'checking' && ' (جاری)'}</span>
                         <div onClick={(e) => {e.preventDefault(); e.stopPropagation();}} className="absolute top-2 left-2 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" aria-label="Actions"><MoreVertical className="h-5 w-5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => onEdit(card)}><Edit className="ml-2 h-4 w-4" />ویرایش کارت</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive focus:text-destructive"><Trash2 className="ml-2 h-4 w-4" />حذف کارت</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    <div className="relative z-10 space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between"><ChipIcon /><Wifi className="h-6 w-6 sm:h-8 sm:w-8 -rotate-45" /></div>
                        <div className="text-center space-y-1" dir="ltr">
                            <div className="flex items-center justify-center gap-2 font-mono text-xl sm:text-2xl tracking-widest font-bold"><span>{formatCardNumber(card.cardNumber)}</span></div>
                            <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-wider opacity-80">
                                <span>{`IR - ${card.accountNumber}`}</span>
                                <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCopy(card.accountNumber, 'شماره حساب');}} className="opacity-50 hover:opacity-100 transition-opacity" aria-label="کپی شماره حساب"><Copy className="h-3 w-3" /></button>
                            </div>
                        </div>
                         <div className="flex justify-between items-end text-xs font-mono pt-1" dir="ltr">
                            <div><p className="opacity-70 text-[10px] sm:text-xs">CVV2</p><p>{card.cvv2}</p></div>
                             <div><p className="opacity-70 text-[10px] sm:text-xs">EXPIRES</p><p>{card.expiryDate}</p></div>
                        </div>
                        <div className="flex justify-between items-end pt-1 sm:pt-2">
                            <span className="font-mono text-xs sm:text-sm tracking-wider uppercase flex items-center gap-1"><OwnerIcon className="w-4 h-4" />{ownerName}</span>
                            <div className='text-left'><p className="text-base sm:text-xl font-mono tracking-widest font-bold">{formatCurrency(card.balance, 'IRT').replace(' تومان', '')}</p><p className="text-[10px] sm:text-xs opacity-80">موجودی کل</p></div>
                        </div>
                    </div>
                </div>
                <div className="bg-muted p-2 rounded-b-xl border-t">
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => handleCopy(card.cardNumber, 'شماره کارت')}><Copy className="ml-2 h-4 w-4" />کپی شماره کارت</Button>
                        <Button size="sm" variant="ghost" className="w-full text-xs" asChild><Link href={`/cards/${card.id}`}><History className="ml-2 h-4 w-4" />تاریخچه</Link></Button>
                   </div>
                </div>
            </div>
             <ConfirmationDialog 
                isOpen={isDeleteDialogOpen} 
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={() => onDelete(card.id)}
                title="آیا از حذف این کارت مطمئن هستید؟"
                description="این عمل قابل بازگشت نیست. این کارت برای همیشه حذف خواهد شد. تنها در صورتی می‌توانید کارت را حذف کنید که هیچ تراکنشی با آن ثبت نشده باشد."
             />
        </>
    );
}

interface CardListProps {
  cards: BankAccount[];
  onEdit: (card: BankAccount) => void;
  onDelete: (cardId: string) => void;
}

export function CardList({ cards, onEdit, onDelete }: CardListProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    };
    getSession();
  }, []);
  const loggedInUserOwnerId = currentUser?.email?.startsWith('ali') ? 'ali' : 'fatemeh';

  const sortedCards = [...(cards || [])].sort((a, b) => {
    const getGroup = (ownerId: string) => {
        if (ownerId === 'shared_account') return 0;
        if (ownerId === loggedInUserOwnerId) return 1;
        return 2;
    };
    const groupA = getGroup(a.ownerId);
    const groupB = getGroup(b.ownerId);
    if (groupA !== groupB) return groupA - groupB;
    return b.balance - a.balance;
  });

  if (cards.length === 0) {
    return (
        <Card>
            <CardHeader><CardTitle className="font-headline">لیست کارت‌ها</CardTitle></CardHeader>
            <CardContent><p className='text-center text-muted-foreground py-8'>هیچ کارتی برای نمایش وجود ندارد.</p></CardContent>
        </Card>
    );
  }
  
  const sharedCards = sortedCards.filter(c => c.ownerId === 'shared_account');
  const aliCards = sortedCards.filter(c => c.ownerId === 'ali');
  const fatemehCards = sortedCards.filter(c => c.ownerId === 'fatemeh');

  const renderCardSection = (cardList: BankAccount[], title: string, key: string) => {
    if (cardList.length === 0) return null;
    return (
        <Card key={key}>
            <CardHeader><CardTitle className="font-headline">{title}</CardTitle></CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cardList.map((card) => <CardItem key={card.id} card={card} onEdit={onEdit} onDelete={onDelete} />)}
                </div>
            </CardContent>
        </Card>
    );
  };

  const sections = [
    { id: 'shared', title: 'کارت‌های مشترک', data: sharedCards },
    { id: 'ali', title: `کارت‌های ${USER_DETAILS.ali.firstName}`, data: aliCards },
    { id: 'fatemeh', title: `کارت‌های ${USER_DETAILS.fatemeh.firstName}`, data: fatemehCards },
  ].sort((a,b) => {
     if (a.id === 'shared') return -1;
     if (b.id === 'shared') return 1;
     if (a.id === loggedInUserOwnerId) return -1;
     if (b.id === loggedInUserOwnerId) return 1;
     return 0;
  });

  return (
    <div className='space-y-6'>
       {sections.map(section => renderCardSection(section.data, section.title, section.id))}
    </div>
  );
}
