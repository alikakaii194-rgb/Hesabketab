
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { OverallSummary } from '@/components/dashboard/overall-summary';
import { formatCurrency } from '@/lib/utils';

describe('OverallSummary', () => {
  const mockSummary = {
    totalIncome: 5000000,
    totalExpense: 1500000,
    netWorth: 120000000,
    totalAssets: 150000000,
    totalLiabilities: 30000000,
    pendingChecksAmount: 5000000,
    remainingLoanAmount: 20000000,
    remainingDebtsAmount: 5000000,
    totalSavedForGoals: 10000000,
  };

  it('renders all summary cards with correctly formatted values', () => {
    render(<OverallSummary filteredSummary={mockSummary} />);

    const checkCard = (title, value) => {
      const titleElement = screen.getByText(title);
      const cardElement = titleElement.closest('.rounded-lg');
      
      expect(cardElement).not.toBeNull();
      expect(cardElement).toBeInTheDocument();

      const valueElement = within(cardElement).getByText(formatCurrency(value, 'IRT'));
      expect(valueElement).toBeInTheDocument();
    };

    checkCard('دارایی خالص', mockSummary.netWorth);
    checkCard('کل دارایی', mockSummary.totalAssets);
    checkCard('کل درآمد', mockSummary.totalIncome);
    checkCard('کل هزینه', mockSummary.totalExpense);
    checkCard('بدهی وام‌ها', mockSummary.remainingLoanAmount);
    checkCard('بدهی چک‌ها', mockSummary.pendingChecksAmount);
    checkCard('بدهی‌های متفرقه', mockSummary.remainingDebtsAmount);
  });

  it('handles zero values correctly', () => {
    const zeroSummary = {
        totalIncome: 0,
        totalExpense: 0,
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        pendingChecksAmount: 0,
        remainingLoanAmount: 0,
        remainingDebtsAmount: 0,
        totalSavedForGoals: 0,
    };
    render(<OverallSummary filteredSummary={zeroSummary} />);

    expect(screen.getAllByText('۰ تومان').length).toBeGreaterThan(0);
  });
});
