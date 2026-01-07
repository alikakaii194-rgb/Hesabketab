
'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { FinancialGoal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { GoalList } from '@/components/goals/goal-list';
import { GoalForm } from '@/components/goals/goal-form';
import { AchieveGoalDialog } from '@/components/goals/achieve-goal-dialog';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { AddToGoalDialog } from '@/components/goals/add-to-goal-dialog';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

export default function GoalsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const { isLoading: isDashboardLoading, allData, refreshData } = useDashboardData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [achievingGoal, setAchievingGoal] = useState<FinancialGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<FinancialGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { goals, bankAccounts, users } = allData;

  const handleFormSubmit = useCallback(async (values: any) => {
    if (!user) return;
    setIsSubmitting(true);

    const { image_path, ...goalData } = values;

    try {
      if (editingGoal) {
        // Logic for UPDATING an existing goal
        const { error } = await supabase
          .from('financial_goals')
          .update({
            name: goalData.name,
            target_amount: goalData.targetAmount,
            target_date: goalData.targetDate.toISOString(),
            priority: goalData.priority,
            owner_id: goalData.ownerId,
            image_path: image_path, // Update the image path
          })
          .eq('id', editingGoal.id);
        if (error) throw error;
        toast({ title: 'موفقیت', description: 'هدف مالی با موفقیت ویرایش شد.' });
      } else {
        // Logic for CREATING a new goal
        const { error } = await supabase
          .from('financial_goals')
          .insert({
            name: goalData.name,
            target_amount: goalData.targetAmount,
            current_amount: 0, // Initial amount is always 0, managed by contributions
            target_date: goalData.targetDate.toISOString(),
            priority: goalData.priority,
            owner_id: goalData.ownerId,
            registered_by_user_id: user.id,
            is_achieved: false,
            image_path: image_path,
          });
        if (error) throw error;
        toast({ title: 'موفقیت', description: 'هدف مالی جدید با موفقیت ایجاد شد.' });
      }
      
      await refreshData();
      setIsFormOpen(false);
      setEditingGoal(null);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطا در ذخیره‌سازی هدف',
        description: error.message || 'مشکلی در ثبت اطلاعات پیش آمد.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, editingGoal, refreshData]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('delete_financial_goal', { p_goal_id: goalId });
      if (error) throw new Error(error.message);
      toast({ title: "موفقیت", description: "هدف مالی با موفقیت حذف شد." });
      await refreshData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا در حذف هدف",
        description: error.message || "مشکلی در حذف هدف پیش آمد.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);

  const handleAddNew = useCallback(() => {
    setEditingGoal(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((goal: FinancialGoal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  }, []);

  const handleCancel = () => {
      setIsFormOpen(false);
      setEditingGoal(null);
  }

  const handleContribute = useCallback(async ({ goal, amount, bankAccountId }: { goal: FinancialGoal, amount: number, bankAccountId: string }) => {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.rpc('add_contribution_to_goal', {
        p_goal_id: goal.id,
        p_bank_account_id: bankAccountId,
        p_amount: amount,
        p_user_id: user.id,
      });

      if (error) throw error;
      
      toast({ title: "موفقیت!", description: "مبلغ با موفقیت به پس‌انداز اضافه و از حساب شما مسدود شد."});
      await refreshData();
      setContributingGoal(null);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطا در افزودن به پس‌انداز', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }, [user, toast, refreshData]);
  
  const handleAchieveGoal = useCallback(async ({ goal, actualCost, paymentCardId }: { goal: FinancialGoal, actualCost: number, paymentCardId?: string }) => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          const { error } = await supabase.rpc('achieve_financial_goal', {
              p_goal_id: goal.id,
              p_actual_cost: actualCost,
              p_user_id: user.id,
              p_payment_card_id: paymentCardId
          });
          if (error) throw error;
          
          toast({ title: "تبریک!", description: `هدف "${goal.name}" با موفقیت محقق شد.` });
          await refreshData();
          setAchievingGoal(null);

      } catch (error: any) {
          toast({ variant: 'destructive', title: 'خطا در تحقق هدف', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }, [user, toast, refreshData]);

  const handleRevertGoal = useCallback(async (goal: FinancialGoal) => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          const { error } = await supabase.rpc('revert_financial_goal', { p_goal_id: goal.id });
          if (error) throw error;
          
          toast({ title: "بازگردانی شد", description: `هدف "${goal.name}" به حالت "در حال انجام" بازگردانده شد.` });
          await refreshData();

      } catch (error: any) {
          toast({ variant: 'destructive', title: 'خطا در بازگردانی هدف', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }, [user, toast, refreshData]);

  const isLoading = isUserLoading || isDashboardLoading;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight font-headline">اهداف مالی</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="ml-2 h-4 w-4" />
          افزودن هدف جدید
        </Button>
      </div>

      {isFormOpen && (
        <GoalForm
          key={editingGoal ? editingGoal.id : 'new'}
          onSubmit={handleFormSubmit}
          initialData={editingGoal}
          user={user}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60 w-full rounded-xl" />)}
        </div>
      ) : !isFormOpen && (
        <>
          <GoalList
            goals={goals || []}
            users={users || []}
            onEdit={handleEdit}
            onDelete={handleDeleteGoal}
            onContribute={setContributingGoal}
            onAchieve={setAchievingGoal}
            onRevert={handleRevertGoal}
            isSubmitting={isSubmitting}
          />
           {contributingGoal && (
                <AddToGoalDialog
                    goal={contributingGoal}
                    bankAccounts={bankAccounts || []}
                    isOpen={!!contributingGoal}
                    onOpenChange={() => setContributingGoal(null)}
                    onSubmit={handleContribute}
                    isSubmitting={isSubmitting}
                />
            )}
             {achievingGoal && (
                <AchieveGoalDialog
                    goal={achievingGoal}
                    bankAccounts={bankAccounts || []}
                    isOpen={!!achievingGoal}
                    onOpenChange={() => setAchievingGoal(null)}
                    onSubmit={handleAchieveGoal}
                    isSubmitting={isSubmitting}
                />
            )}
        </>
      )}
    </div>
  );
}
