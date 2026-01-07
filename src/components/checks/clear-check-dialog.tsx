
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Check } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { uploadClearanceReceipt } from '@/lib/storage';
import { Input } from '../ui/input';

interface ClearCheckDialogProps {
  check: Check;
  onClear: (data: { check: Check; receiptPath?: string }) => void;
  isSubmitting: boolean;
  children: React.ReactNode;
}

export const ClearCheckDialog = ({ check, onClear, isSubmitting, children }: ClearCheckDialogProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [receiptPath, setReceiptPath] = useState<string | undefined>(undefined);
    const [fileName, setFileName] = useState<string>('');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setUploadStatus('uploading');
        setFileName(file.name);

        try {
            const path = await uploadClearanceReceipt(user, file);
            setReceiptPath(path);
            setUploadStatus('success');
            toast({ title: 'موفقیت', description: 'رسید با موفقیت آپلود شد.' });
        } catch (error) {
            setUploadStatus('error');
            setReceiptPath(undefined);
            toast({ variant: 'destructive', title: 'خطا', description: 'آپلود رسید ناموفق بود.' });
            console.error(error);
        }
    };

    const handleConfirm = () => {
        onClear({ check, receiptPath });
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>پاس کردن چک</DialogTitle>
                    <DialogDescription>
                        مبلغ {formatCurrency(check.amount, 'IRT')} از حساب کسر خواهد شد. برای تکمیل فرآیند، می‌توانید رسید تراکنش را پیوست کنید (اختیاری).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <label htmlFor="receipt-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">پیوست رسید</label>
                    <div className="flex items-center gap-2">
                        <Input
                            id="receipt-upload"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            disabled={uploadStatus === 'uploading'}
                            className="flex-grow"
                        />
                         {uploadStatus === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                         {uploadStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                         {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    {fileName && <p className="text-sm text-muted-foreground">فایل: {fileName}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>انصراف</Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting || uploadStatus === 'uploading'}>
                        {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : 'تایید و پاس کردن'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
