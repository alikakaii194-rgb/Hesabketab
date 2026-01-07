
import { supabase } from './supabase-client';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@supabase/supabase-js';

const BUCKET_NAME = 'hesabketabsatl';

const uploadAttachment = async (file: File, pathPrefix: string, user: User): Promise<string> => {
  if (!file) {
    throw new Error('فایلی برای آپلود انتخاب نشده است.');
  }
  if (!user) {
    throw new Error('کاربر برای آپلود فایل مشخص نشده است.');
  }

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `${pathPrefix}/${user.id}/${uuidv4()}-${sanitizedFileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`خطا در آپلود فایل: ${error.message}`);
  }

  return filePath;
};

export const uploadReceipt = (user: User, file: File) => {
  return uploadAttachment(file, 'receipts', user);
};

export const uploadGoalImage = (user: User, file: File) => {
  return uploadAttachment(file, 'goals', user);
};

export const uploadCheckImage = (user: User, file: File) => {
  return uploadAttachment(file, 'checks', user);
};

export const uploadClearanceReceipt = (user: User, file: File) => {
  return uploadAttachment(file, 'check-receipts', user);
};

export const uploadLoanDocument = (user: User, file: File) => {
  return uploadAttachment(file, 'loans', user);
};

export const uploadDebtDocument = (user: User, file: File) => {
  return uploadAttachment(file, 'debts', user);
};

export const uploadIncomeDocument = (user: User, file: File) => {
  return uploadAttachment(file, 'income', user);
};

export const uploadLoanReceipt = (user: User, loanId: string, file: File) => {
  const pathPrefix = `loan-receipts/${loanId}`;
  return uploadAttachment(file, pathPrefix, user);
};


export const uploadDebtReceipt = (user: User, debtId: string, file: File) => {
  const pathPrefix = `debt-receipts/${debtId}`;
  return uploadAttachment(file, pathPrefix, user);
};


export const getPublicUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data?.publicUrl || null;
}
