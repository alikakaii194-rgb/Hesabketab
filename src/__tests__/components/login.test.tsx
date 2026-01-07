
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { supabase } from '@/lib/supabase-client';

// Mock useRouter from next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
    })),
  },
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation
    jest.clearAllMocks();
  });

  it('should render the login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/ایمیل/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/رمز عبور/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ورود/i })).toBeInTheDocument();
  });

  it('should show a validation error for unauthorized emails on the client-side', async () => {
    render(<LoginPage />);
    fireEvent.input(screen.getByLabelText(/ایمیل/i), { target: { value: 'intruder@wrong.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

    await waitFor(() => {
      expect(screen.getByText('شما اجازه ورود به این اپلیکیشن را ندارید.')).toBeInTheDocument();
    });
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  // Test suite for authorized users (Ali and Fatemeh)
  const authorizedUsers = [
    { email: 'ali@khanevadati.app', uid: 'ali_uid' },
    { email: 'fatemeh@khanevadati.app', uid: 'fatemeh_uid' },
  ];

  describe.each(authorizedUsers)('for user $email', ({ email, uid }) => {
    it('should redirect to dashboard and create a profile on first successful login', async () => {
      // Arrange: Mock successful authentication and a non-existent user profile
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: uid, email } },
        error: null,
      });
      // Mock the chained calls for checking user existence
      const fromMock = supabase.from as jest.Mock;
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }); // Not found
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      fromMock.mockImplementation((tableName) => {
        if (tableName === 'users') {
          return { select: selectMock, insert: insertMock };
        }
        return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }; // Default mock for other tables
      });
      selectMock.mockImplementation(() => ({ eq: eqMock }));
      eqMock.mockImplementation(() => ({ single: singleMock }));


      render(<LoginPage />);

      // Act: Fill and submit the form
      fireEvent.input(screen.getByLabelText(/ایمیل/i), { target: { value: email } });
      fireEvent.input(screen.getByLabelText(/رمز عبور/i), { target: { value: 'any-password' } });
      fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

      // Assert: Check for redirection and profile creation
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email, password: 'any-password' });
        expect(insertMock).toHaveBeenCalled(); // Profile creation is called
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'ورود موفق' }));
      });
    });

    it('should show a toast error for wrong password', async () => {
      // Arrange: Mock the specific "wrong-password" error from Supabase
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      render(<LoginPage />);

      // Act: Fill and submit the form
      fireEvent.input(screen.getByLabelText(/ایمیل/i), { target: { value: email } });
      fireEvent.input(screen.getByLabelText(/رمز عبور/i), { target: { value: 'wrong-password' } });
      fireEvent.submit(screen.getByRole('button', { name: /ورود/i }));

      // Assert: Check for the specific error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: 'خطا در ورود',
            description: 'ایمیل یا رمز عبور اشتباه است.',
          })
        );
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
