
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, PenSquare, ExternalLink } from 'lucide-react';
import { formatCurrency, formatJalaliDate, getPublicUrl } from '@/lib/utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import type { Check } from '@/lib/types';
import { CheckPaper } from '@/components/checks/check-paper';
import { useToast } from '@/hooks/use-toast';
import { USER_DETAILS } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';


function CheckDetailSkeleton() {
  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-[28rem] w-full max-w-2xl mx-auto" />
      <Skeleton className="h-24 w-full max-w-2xl mx-auto" />
    </main>
  );
}

export default function CheckDetailPage() {
  const router = useRouter();
  const params = useParams();
  const checkId = params.checkId as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const { allData, refreshData, isLoading } = useDashboardData();

  const { bankAccounts, payees, categories, users, checks } = allData;

  const checkDetails = React.useMemo(() => {
    if (!checkId || !checks) return null;
    return checks.find((c: Check) => c.id === checkId) || null;
  }, [checkId, checks]);


  const handleClearCheck = useCallback(async (checkToClear: any) => {
    if (!user) return;
    try {
        const { error } = await supabase.rpc('clear_check', {
            p_check_id: checkToClear.id,
            p_user_id: user.id,
            p_clearance_receipt_path: null
        });
        if (error) throw new Error(error.message);
        await refreshData();
        toast({ title: 'موفقیت!', description: `چک به مبلغ ${formatCurrency(checkToClear.amount, 'IRT')} پاس شد.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در پاس کردن چک', description: error.message });
    }
  }, [user, refreshData, toast]);


  if (isLoading) {
    return <CheckDetailSkeleton />;
  }

  if (!checkDetails) {
    return (
      <main className="flex-1 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>چک یافت نشد</CardTitle>
          </CardHeader>
          <CardContent>
            <p>متاسفانه چکی با این مشخصات در سیستم وجود ندارد یا شما اجازه دسترسی به آن را ندارید.</p>
            <Button onClick={() => router.push('/checks')} className="mt-4">
              بازگشت به لیست چک‌ها
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  const getPayeeName = (payeeId?: string) => payees?.find((p: any) => p.id === payeeId)?.name || 'نامشخص';
  const getCategoryName = (categoryId?: string) => categories?.find((c: any) => c.id === categoryId)?.name || 'نامشخص';
  const getBankAccount = (bankAccountId?: string) => bankAccounts?.find((b: any) => b.id === bankAccountId);
  
  const bankAccount = getBankAccount(checkDetails.bankAccountId);

  const ownerName = bankAccount?.ownerId === 'shared_account' 
        ? 'علی و فاطمه' 
        : (bankAccount?.ownerId && USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'] 
            ? `${USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'].firstName} ${USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh'].lastName}` 
            : 'ناشناس');

  const expenseForName = checkDetails.expenseFor && USER_DETAILS[checkDetails.expenseFor] ? USER_DETAILS[checkDetails.expenseFor].firstName : 'مشترک';
  
  const signatureImage = checkDetails.signatureDataUrl || (bankAccount?.ownerId ? (USER_DETAILS[bankAccount.ownerId as 'ali' | 'fatemeh']?.signatureImage) : undefined);

  const registeredByName = users?.find((u: any) => u.id === checkDetails.registeredByUserId)?.firstName || 'سیستم';

  const isCleared = checkDetails.status === 'cleared';
  const hasSufficientFunds = bankAccount ? bankAccount.balance >= checkDetails.amount : false;
  
  const imageUrl = checkDetails.imagePath ? getPublicUrl(checkDetails.imagePath) : null;


  return (
    <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                جزئیات چک
              </h1>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>{checkDetails.description || `چک به ${getPayeeName(checkDetails.payeeId)}`}</span>
                {isCleared ? 
                    <Badge className="bg-emerald-500 text-white">پاس شده</Badge> : 
                    <Badge variant="destructive">در انتظار پاس</Badge>
                }
              </div>
            </div>
        </div>
      </div>

       <div className="max-w-2xl mx-auto space-y-4">
         {imageUrl && (
            <Card className="overflow-hidden group relative">
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    <CardContent className="p-0">
                        <Image 
                            src={imageUrl} 
                            alt={`عکس چک ${checkDetails.sayadId}`}
                            width={800}
                            height={400}
                            className="object-cover w-full h-auto max-h-80 transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="text-white bg-black/50 p-2 rounded-md flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                <span>مشاهده در اندازه کامل</span>
                            </div>
                        </div>
                    </CardContent>
                </a>
            </Card>
          )}
         <CheckPaper
            check={checkDetails}
            bankAccount={bankAccount}
            payeeName={getPayeeName(checkDetails.payeeId)}
            ownerName={ownerName}
            expenseForName={expenseForName}
            categoryName={getCategoryName(checkDetails.categoryId)}
            signatureImage={signatureImage}
         />
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">اطلاعات تکمیلی</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">تاریخ صدور</p>
                        <p className="font-semibold">{formatJalaliDate(new Date(checkDetails.issueDate))}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <PenSquare className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">ثبت توسط</p>
                        <p className="font-semibold">{registeredByName}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {!isCleared && (
            <Card>
                <CardContent className="p-4 text-center">
                    {!hasSufficientFunds ? (
                        <div className="flex items-center justify-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-bold">موجودی حساب برای پاس کردن این چک کافی نیست!</span>
                        </div>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>
                                    <CheckCircle className="ml-2 h-4 w-4" />
                                    پاس کردن چک
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>آیا از پاس کردن این چک مطمئن هستید؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    با تایید این عملیات، مبلغ ${formatCurrency(checkDetails.amount, 'IRT')} از حساب شما کسر و یک هزینه در سیستم ثبت خواهد شد. این عمل قابل بازگشت نیست.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleClearCheck(checkDetails)}>
                                    تایید و پاس کردن
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardContent>
            </Card>
        )}
      </div>
    </main>
  );
}
