'use client';
import React from 'react';
import type { FinancialGoal, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatJalaliDate, getPublicUrl } from '@/lib/utils';
import { USER_DETAILS } from '@/lib/constants';
import Image from 'next/image';
import { Edit, Trash2, CheckCircle, RotateCcw, Plus, Gift } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

interface GoalListProps {
  goals: FinancialGoal[];
  users: UserProfile[];
  onContribute: (goal: FinancialGoal) => void;
  onAchieve: (goal: FinancialGoal) => void;
  onRevert: (goal: FinancialGoal) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: FinancialGoal) => void;
  isSubmitting: boolean;
}

export function GoalList({ goals, users, onContribute, onAchieve, onRevert, onDelete, onEdit, isSubmitting }: GoalListProps) {
  const findUser = (id: string) => users.find(u => u.id === id);

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center mt-6">
        <h3 className="text-xl font-bold tracking-tight">هنوز هیچ هدفی تعریف نشده.</h3>
        <p className="text-sm text-muted-foreground mt-2">یک هدف جدید برای شروع پس‌انداز اضافه کنید.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {goals.map(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const registeredBy = findUser(goal.registeredByUserId);
        const ownerName = USER_DETAILS[goal.ownerId as keyof typeof USER_DETAILS]?.firstName || 'مشترک';
        const imageUrl = goal.image_path ? getPublicUrl(goal.image_path) : null;
        
        const isDeleteDisabled = isSubmitting || goal.isAchieved;

        return (
          <Card key={goal.id} className="flex flex-col overflow-hidden group">
            <Link href={`/goals/${goal.id}`} className="block">
              <CardHeader className="relative p-0">
                  {imageUrl ? (
                      <div className="relative h-48 w-full">
                          <Image src={imageUrl} alt={goal.name} layout="fill" objectFit="cover" />
                          <div className="absolute inset-0 bg-black/20" />
                      </div>
                  ) : (
                      <div className="h-24 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
                  )}
              </CardHeader>
              <CardContent className="flex-grow p-4">
                <CardTitle className="font-headline text-lg">{goal.name}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  <span>برای: {ownerName}</span> &bull; <span>ثبت توسط: {registeredBy?.firstName}</span>
                </div>
                <div className="my-4">
                  <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">پس‌انداز شده</span>
                      <span className="text-xs text-muted-foreground">هدف: {formatCurrency(goal.targetAmount, 'IRT')}</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex justify-between items-end mt-1">
                      <span className="text-lg font-bold text-primary">{formatCurrency(goal.currentAmount, 'IRT')}</span>
                      <span className="text-xs font-mono">%{Math.round(progress)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                    <p>تاریخ هدف: {formatJalaliDate(new Date(goal.targetDate))}</p>
                    <p>اولویت: {goal.priority}</p>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="p-2 border-t">
                {goal.isAchieved ? (
                    <Button variant="ghost" className="w-full" onClick={() => onRevert(goal)} disabled={isSubmitting}>
                        <RotateCcw className="ml-2 h-4 w-4"/>بازگردانی هدف
                    </Button>
                ) : (
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="secondary" onClick={() => onContribute(goal)} disabled={isSubmitting}>
                            <Plus className="ml-2 h-4 w-4"/>افزایش پس‌انداز
                        </Button>
                        <Button onClick={() => onAchieve(goal)} disabled={isSubmitting}>
                           <Gift className="ml-2 h-4 w-4"/>تحقق هدف
                        </Button>
                    </div>
                )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
