
import { getNextDueDate } from '@/lib/date-utils';
import type { Loan, PreviousDebt } from '@/lib/types';
import { addMonths, startOfDay } from 'date-fns';

describe('getNextDueDate', () => {
  const today = startOfDay(new Date());

  // --- Test Case 1: Loan with 0 paid installments ---
  it('should return the first installment date for a loan with 0 paid installments', () => {
    const loan: Loan = {
      id: 'loan1',
      title: 'Test Loan',
      firstInstallmentDate: today.toISOString(),
      paidInstallments: 0,
      numberOfInstallments: 12,
      // other required fields...
      amount: 12000, installmentAmount: 1000, remainingAmount: 12000, ownerId: 'shared', registeredByUserId: 'u1', startDate: new Date().toISOString(), depositOnCreate: false,
    };
    const nextDueDate = getNextDueDate(loan);
    expect(startOfDay(nextDueDate!)).toEqual(today);
  });

  // --- Test Case 2: Loan with 5 paid installments ---
  it('should return the correct next due date for a loan with multiple paid installments', () => {
    const firstDate = new Date('2024-01-15T12:00:00.000Z');
    const loan: Loan = {
      id: 'loan2',
      title: 'Mid-payment Loan',
      firstInstallmentDate: firstDate.toISOString(),
      paidInstallments: 5,
      numberOfInstallments: 24,
      // other required fields...
       amount: 24000, installmentAmount: 1000, remainingAmount: 19000, ownerId: 'shared', registeredByUserId: 'u1', startDate: new Date().toISOString(), depositOnCreate: false,
    };
    const expectedDate = addMonths(firstDate, 5);
    const nextDueDate = getNextDueDate(loan);
    expect(startOfDay(nextDueDate!)).toEqual(startOfDay(expectedDate));
  });

  // --- Test Case 3: Fully paid loan ---
  it('should return null for a fully paid loan', () => {
    const loan: Loan = {
      id: 'loan3',
      title: 'Fully Paid Loan',
      firstInstallmentDate: new Date().toISOString(),
      paidInstallments: 12,
      numberOfInstallments: 12,
      remainingAmount: 0,
       // other required fields...
      amount: 12000, installmentAmount: 1000, ownerId: 'shared', registeredByUserId: 'u1', startDate: new Date().toISOString(), depositOnCreate: false,
    };
    const nextDueDate = getNextDueDate(loan);
    expect(nextDueDate).toBeNull();
  });
  
  // --- Test Case 4: Single payment debt ---
  it('should return the fixed due date for a single-payment debt', () => {
    const dueDate = new Date('2025-01-01T12:00:00.000Z');
    const debt: PreviousDebt = {
        id: 'debt1',
        isInstallment: false,
        dueDate: dueDate.toISOString(),
        // other required fields...
        description: 'Single Pay', amount: 500, remainingAmount: 500, ownerId: 'ali', payeeId: 'p1', registeredByUserId: 'u1', startDate: new Date().toISOString(), paidInstallments: 0,
    };
    const nextDueDate = getNextDueDate(debt);
    expect(startOfDay(nextDueDate!)).toEqual(startOfDay(dueDate));
  });

  // --- Test Case 5: Installment debt ---
  it('should calculate the next due date for an installment-based debt', () => {
    const firstDate = new Date('2024-03-20T12:00:00.000Z');
    const debt: PreviousDebt = {
        id: 'debt2',
        isInstallment: true,
        firstInstallmentDate: firstDate.toISOString(),
        paidInstallments: 2,
        numberOfInstallments: 6,
        // other required fields...
        description: 'Installment debt', amount: 600, remainingAmount: 400, ownerId: 'fatemeh', payeeId: 'p2', registeredByUserId: 'u1', startDate: new Date().toISOString()
    };
    const expectedDate = addMonths(firstDate, 2);
    const nextDueDate = getNextDueDate(debt);
    expect(startOfDay(nextDueDate!)).toEqual(startOfDay(expectedDate));
  });

  // --- Test Case 6: Loan with no specific number of installments (should still calculate) ---
   it('should return the next due date even if numberOfInstallments is zero or undefined', () => {
    const loan: Loan = {
      id: 'loan4',
      title: 'Open-ended Loan',
      firstInstallmentDate: today.toISOString(),
      paidInstallments: 3,
      numberOfInstallments: 0, // or undefined
      remainingAmount: 5000,
      // other required fields...
      amount: 10000, installmentAmount: 1000, ownerId: 'shared', registeredByUserId: 'u1', startDate: new Date().toISOString(), depositOnCreate: false,
    };
    const expectedDate = addMonths(today, 3);
    const nextDueDate = getNextDueDate(loan);
    expect(startOfDay(nextDueDate!)).toEqual(startOfDay(expectedDate));
  });

  // --- Test Case 7: Fully paid debt ---
  it('should return null for a fully paid debt', () => {
    const debt: PreviousDebt = {
        id: 'debt3',
        isInstallment: true,
        firstInstallmentDate: new Date().toISOString(),
        paidInstallments: 6,
        numberOfInstallments: 6,
        remainingAmount: 0,
        // other required fields...
        description: 'Fully paid debt', amount: 600, ownerId: 'fatemeh', payeeId: 'p2', registeredByUserId: 'u1', startDate: new Date().toISOString()
    };
    const nextDueDate = getNextDueDate(debt);
    expect(nextDueDate).toBeNull();
  });

  // --- Test Case 8: Input is null or undefined ---
  it('should return null when the input is null or undefined', () => {
    expect(getNextDueDate(null)).toBeNull();
    expect(getNextDueDate(undefined)).toBeNull();
  });

});
