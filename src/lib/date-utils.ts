
import { set, addMonths, isPast, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, sub, startOfDay, endOfDay, isAfter, isToday, getDate } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { toDate } from 'date-fns-jalali';
import type { Loan, PreviousDebt } from './types';


/**
 * Calculates the next upcoming due date for a Loan or installment-based PreviousDebt.
 * This function intelligently determines the next payment date based on the number of installments already paid
 * and the designated payment day of the month for loans.
 * @param item - The full Loan or PreviousDebt object.
 * @returns A Date object for the next due date, or null if not applicable (e.g., fully paid).
 */
export function getNextDueDate(item: Loan | PreviousDebt): Date | null {
  // For single-payment debts, the due date is fixed.
  if ('isInstallment' in item && !item.isInstallment) {
    return item.dueDate ? new Date(item.dueDate) : null;
  }
  
  const paidCount = 'paidInstallments' in item ? item.paidInstallments || 0 : 0;
  const totalInstallments = 'numberOfInstallments' in item ? item.numberOfInstallments || 0 : 0;
  
  // For installment-based items that have been fully paid.
  if (totalInstallments > 0 && paidCount >= totalInstallments) {
      return null;
  }

  const firstInstallmentDateStr = 'firstInstallmentDate' in item ? item.firstInstallmentDate : undefined;
  if (!firstInstallmentDateStr) return null; // Cannot calculate without the first date.
  
  const firstInstallmentDate = new Date(firstInstallmentDateStr);

  // --- Logic for Loans with a specific paymentDay ---
  if ('paymentDay' in item && item.paymentDay) {
    // 1. Determine the month of the last payment made. If 0 paid, start from the month before the first installment.
    const lastPaymentMonth = addMonths(firstInstallmentDate, paidCount - 1);
    
    // 2. The next payment is in the following month.
    const nextPaymentMonth = addMonths(lastPaymentMonth, 1);

    // 3. Set the day of that month to the designated paymentDay.
    // The `set` function from date-fns handles month rollovers correctly (e.g., setting day 30 in February).
    return set(nextPaymentMonth, { date: item.paymentDay, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
  }

  // --- Fallback/Default Logic for installment items without a paymentDay (e.g., PreviousDebts) ---
  // The next due date is simply `paidCount` months after the first installment date.
  return addMonths(firstInstallmentDate, paidCount);
}



export function getDateRange(preset: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear'): { range: { from: Date, to: Date }, preset: typeof preset } {
    const now = new Date();
    let range: { from: Date, to: Date };

    switch (preset) {
        case 'thisWeek':
            range = { from: startOfWeek(now, { locale: faIR }), to: endOfWeek(now, { locale: faIR }) };
            break;
        case 'lastWeek':
            const lastWeekStart = startOfWeek(sub(now, { weeks: 1 }), { locale: faIR });
            const lastWeekEnd = endOfWeek(sub(now, { weeks: 1 }), { locale: faIR });
            range = { from: lastWeekStart, to: lastWeekEnd };
            break;
        case 'thisMonth':
            range = { from: startOfMonth(now), to: endOfMonth(now) };
            break;
        case 'lastMonth':
            const lastMonthStart = startOfMonth(sub(now, { months: 1 }));
            const lastMonthEnd = endOfMonth(sub(now, { months: 1 }));
            range = { from: lastMonthStart, to: lastMonthEnd };
            break;
        case 'thisYear':
            range = { from: startOfYear(now), to: endOfYear(now) };
            break;
        default:
            range = { from: startOfMonth(now), to: endOfMonth(now) };
    }
    return { range, preset };
}
