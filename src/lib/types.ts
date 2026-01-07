

import type { LucideIcon } from 'lucide-react';

export type OwnerId = 'ali' | 'fatemeh' | 'shared';

// Defines who an EXPENSE, LIABILITY or GOAL is FOR. This is about the beneficiary.
// This is completely separate from the bank account owner.
export type ExpenseFor = 'ali' | 'fatemeh' | 'shared';

export type BankTheme = 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'red' | 'teal' | 'cyan' | 'pink' | 'indigo';

export type Income = {
  id: string;
  date: string;
  description:string;
  amount: number;
  type: 'income';
  source: string; // The original source of income text
  ownerId: 'ali' | 'fatemeh' | 'daramad_moshtarak'; // An income can belong to a person or the shared business
  category: string; // This is 'درآمد' for all incomes
  registeredByUserId: string;
  bankAccountId: string;
  createdAt: any;
  updatedAt?: any;
  balanceAfter?: number;
  attachment_path?: string;
}

export type Expense = {
  id: string;
  ownerId: 'ali' | 'fatemeh' | 'shared_account'; // Owner of the bank account used for payment
  registeredByUserId: string;
  bankAccountId: string;
  categoryId: string;
  payeeId?: string; // Optional payee for direct expenses
  amount: number;
  date: string;
  description: string;
  type: 'expense';
  subType?: 'goal_saved_portion' | 'goal_cash_portion' | 'loan_payment' | 'debt_payment' | 'goal_contribution'; // For differentiating special expenses
  expenseFor: ExpenseFor; // The person/entity this expense was for.
  checkId?: string;
  goalId?: string;
  loanPaymentId?: string;
  debtPaymentId?: string;
  createdAt: any;
  updatedAt?: any;
  balanceBefore?: number;
  balanceAfter?: number;
  attachment_path?: string;
};


export type BankAccount = {
    id: string;
    ownerId: 'ali' | 'fatemeh' | 'shared_account'; // A bank account can be personal ('ali', 'fatemeh') or the single shared account
    bankName: string;
    accountNumber: string;
    cardNumber: string;
    expiryDate: string; // MM/YY
    cvv2: string;
    accountType: 'checking' | 'savings';
    balance: number;
    initialBalance: number;
    blockedBalance: number;
    theme: BankTheme;
    registeredByUserId: string;
}

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  signatureImage?: string;
}

export type Payee = {
    id: string;
    name: string;
    phoneNumber?: string;
}

export type Check = {
    id: string;
    registeredByUserId: string;
    ownerId: 'ali' | 'fatemeh' | 'shared_account'; // Who owns this liability (person or shared account)
    expenseFor: ExpenseFor; // Who the check is for
    bankAccountId: string;
    payeeId: string;
    categoryId: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: 'pending' | 'cleared';
    clearedDate?: string;
    description?: string;
    sayadId: string;
    checkSerialNumber: string;
    signatureDataUrl?: string; // Changed from signatureUrl
    imagePath?: string;
    clearanceReceiptPath?: string;
}

export type FinancialGoalContribution = {
  id: string; // The ID of the corresponding 'goal_contribution' expense
  goalId: string;
  bankAccountId: string;
  amount: number;
  date: string;
  registeredByUserId: string;
};

export type FinancialGoal = {
    id: string;
    registeredByUserId: string;
    ownerId: OwnerId; // A goal can be for a person or a shared family goal
    name: string;
    targetAmount: number;
    currentAmount: number;
    actualCost?: number; // The real cost when achieved
    targetDate: string;
    isAchieved: boolean;
    priority: 'low' | 'medium' | 'high';
    contributions: FinancialGoalContribution[];
    image_path?: string;
}


export type Loan = {
    id: string;
    registeredByUserId: string;
    ownerId: OwnerId; // Who is responsible for this loan (beneficiary)
    payeeId?: string;
    title: string;
    amount: number;
    installmentAmount: number;
    remainingAmount: number;
    startDate: string;
    firstInstallmentDate: string;
    numberOfInstallments: number;
    paidInstallments: number;
    depositOnCreate: boolean;
    depositToAccountId?: string;
    paymentDay?: number;
    attachment_path?: string;
}

export type LoanPayment = {
    id: string;
    registeredByUserId: string;
    loanId: string;
    bankAccountId: string;
    amount: number;
    paymentDate: string;
    attachment_path?: string;
}

export type PreviousDebt = {
    id: string;
    registeredByUserId: string;
    ownerId: OwnerId; // Who the debt is for (beneficiary)
    payeeId: string;
    description: string;
    amount: number;
    remainingAmount: number;
    startDate: string;
    isInstallment: boolean;
    dueDate?: string; // For single payment debts
    firstInstallmentDate?: string; // For installment debts
    numberOfInstallments?: number;
    installmentAmount?: number;
    paidInstallments: number;
    attachment_path?: string;
}

export type DebtPayment = {
    id: string;
    registeredByUserId: string;
    debtId: string;
    bankAccountId: string;
    amount: number;
    paymentDate: string;
    attachment_path?: string;
}

export type Transfer = {
    id: string;
    registeredByUserId: string;
    fromBankAccountId: string;
    toBankAccountId: string;
    amount: number;
    transferDate: string;
    description?: string;
    fromAccountBalanceBefore: number;
    fromAccountBalanceAfter: number;
    toAccountBalanceBefore: number;
    toAccountBalanceAfter: number;
}

export type TransactionDetails = {
    type: 'expense' | 'income' | 'transfer' | 'check' | 'loan' | 'debt' | 'goal' | 'payment';
    title: string;
    amount: number;
    date: string;
    icon: keyof typeof import('lucide-react');
    color: string;
    payee?: string;
    category?: string;
    bankAccount?: {
      name: string;
      owner: string;
    };
    toBankAccount?: {
      name: string;
      owner: string;
    };
    expenseFor?: string;
    registeredBy: string;
    properties?: { label: string; value?: string | null }[];
    checkDetails?: {
      sayadId: string;
      dueDate: string;
    };
};

export type ChatMessage = {
    id: string;
    senderId: string; // Can be a user UID or 'system'
    senderName: string;
    text: string;
    timestamp: any;
    readBy: string[]; // Array of user UIDs who have read the message
    type: 'user' | 'system';
    transactionDetails?: TransactionDetails;
    replyTo?: {
        messageId: string;
        text: string;
        senderName: string;
    }
}

export type DashboardFilter = 'all' | 'ali' | 'fatemeh' | 'shared' | 'daramad_moshtarak';
