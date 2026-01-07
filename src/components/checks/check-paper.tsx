"use client";

import React from 'react';
import type { Check, BankAccount } from '@/lib/types';
import { formatCurrency, formatJalaliDate, cn, amountToWords, getPublicUrl, toPersianDigits } from '@/lib/utils';
import { HesabKetabLogo } from '../icons';
import Image from 'next/image';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Camera, CheckCircle, Edit, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { ClearCheckDialog } from './clear-check-dialog';
import { ConfirmationDialog } from '../shared/confirmation-dialog';
import Link from 'next/link';

interface CheckPaperProps {
    check: Check;
    bankAccount?: BankAccount;
    payeeName: string;
    ownerName: string;
    expenseForName: string;
    categoryName: string;
    signatureImage?: string;
    // Actions
    onClear?: (data: { check: Check; receiptPath?: string }) => void;
    onDelete?: () => void;
    onEdit?: () => void;
    isSubmitting?: boolean;
    showActions?: boolean;
}

export function CheckPaper({
    check,
    bankAccount,
    payeeName,
    ownerName,
    expenseForName,
    categoryName,
    signatureImage,
    onClear,
    onDelete,
    onEdit,
    isSubmitting = false,
    showActions = false,
}: CheckPaperProps) {
    
    const isCleared = check.status === 'cleared';
    const isDeleteDisabled = isCleared || isSubmitting;
    const imageUrl = check.imagePath ? getPublicUrl(check.imagePath) : null;
    const clearanceReceiptUrl = check.clearanceReceiptPath ? getPublicUrl(check.clearanceReceiptPath) : null;
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);


    return (
        <div className={cn("overflow-hidden rounded-lg shadow-lg h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-2 border-gray-300 dark:border-gray-700", isCleared && "opacity-60")}>
            {isCleared && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 border-4 border-emerald-500 text-emerald-500 rounded-lg p-2 text-3xl md:text-4xl font-black uppercase opacity-60 select-none z-20">
                    پاس شد
                </div>
            )}
            
            <div className="p-3 relative bg-gray-100 dark:bg-gray-800/50 flex justify-between items-start">
                <div className="text-left w-1/3 space-y-1 text-xs">
                    <p className="text-[9px] text-muted-foreground font-body">شناسه صیاد: <span className="font-handwriting tracking-wider text-foreground block">{toPersianDigits(check.sayadId)}</span></p>
                    <p className="text-[9px] text-muted-foreground font-body">سریال چک: <span className="font-handwriting tracking-tight text-foreground block">{toPersianDigits(check.checkSerialNumber)}</span></p>
                </div>

                <div className="text-center w-1/3">
                    <HesabKetabLogo className="w-5 h-5 mx-auto text-primary/70" />
                    <p className="font-bold font-body text-xs">{bankAccount?.bankName}</p>
                </div>
                
                <div className="text-right w-1/3 flex flex-col items-end pl-2 pt-1">
                     <p className="text-[10px] text-muted-foreground font-body">سررسید:</p>
                     <p className="font-handwriting font-bold text-base">{toPersianDigits(formatJalaliDate(new Date(check.dueDate)))}</p>
                </div>
                
                 {showActions && (
                    <div className="absolute top-1 right-1 z-20">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions" disabled={isSubmitting}>
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem asChild><Link href={`/checks/${check.id}`}>مشاهده جزئیات</Link></DropdownMenuItem>
                                {onClear && !isCleared && (
                                    <ClearCheckDialog check={check} onClear={onClear} isSubmitting={isSubmitting}>
                                        <div className={cn("relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", "text-emerald-600 focus:text-emerald-700")}>
                                            <CheckCircle className="ml-2 h-4 w-4" /> پاس کردن چک
                                        </div>
                                    </ClearCheckDialog>
                                )}
                                {onEdit && <DropdownMenuItem onSelect={onEdit} disabled={isCleared || isSubmitting}><Edit className="ml-2 h-4 w-4" /> ویرایش چک</DropdownMenuItem>}
                                {imageUrl && (<DropdownMenuItem onSelect={() => window.open(imageUrl, '_blank')}><Camera className="ml-2 h-4 w-4" /> مشاهده عکس چک</DropdownMenuItem>)}
                                {clearanceReceiptUrl && (<DropdownMenuItem onSelect={() => window.open(clearanceReceiptUrl, '_blank')}><FileText className="ml-2 h-4 w-4" /> مشاهده رسید پاس شدن</DropdownMenuItem>)}
                                {onDelete && <DropdownMenuSeparator />}
                                {onDelete && <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} disabled={isDeleteDisabled} className="text-destructive focus:text-destructive"><Trash2 className="ml-2 h-4w-4" /> حذف چک</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
            
            <div className="p-4 space-y-2 flex-grow flex flex-col text-xs">
                 <div className="flex items-baseline gap-2 border-b-2 border-dotted border-gray-400 pb-1">
                    <span className="shrink-0 font-body">مبلغ:</span>
                     <span className="font-handwriting text-sm text-center flex-grow px-1">
                        {amountToWords(check.amount)} تومان
                    </span>
                </div>
                <div className="flex items-baseline gap-2 border-b-2 border-dotted border-gray-400 pb-1">
                    <span className="shrink-0 font-body">در وجه:</span>
                    <span className="font-handwriting text-sm flex-grow">{payeeName}</span>
                    <span className="shrink-0 ml-4 font-body">هزینه برای:</span>
                    <span className="font-handwriting text-sm shrink-0">
                      {expenseForName}
                    </span>
                </div>
                <div className="flex-grow"></div>
                <div className="flex justify-between items-end pt-4">
                    <div className="text-left">
                        <p className="font-handwriting text-lg">{formatCurrency(check.amount, 'IRT')}</p>
                    </div>
                     <div className="text-center">
                        <span className="text-xs text-muted-foreground font-body">دسته‌بندی</span>
                        <p className="font-handwriting text-xs">{categoryName}</p>
                    </div>
                    <div className="text-right relative">
                        <span className="text-xs text-muted-foreground font-body">صاحب حساب:</span>
                        <p className="font-handwriting text-xs h-6">{ownerName}</p>
                        {signatureImage && (
                            <div className="absolute -bottom-2 -right-2 w-24 h-12 pointer-events-none">
                                <Image 
                                    src={signatureImage} 
                                    alt={`امضای ${ownerName}`} 
                                    width={96} 
                                    height={48}
                                    style={{ objectFit: 'contain'}}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
             {onDelete && <ConfirmationDialog 
              isOpen={isDeleteDialogOpen} 
              onOpenChange={setIsDeleteDialogOpen}
              onConfirm={onDelete}
              title="آیا از حذف این چک مطمئن هستید؟"
              description={isCleared ? "امکان حذف چک پاس شده وجود ندارد." : "این عمل چک را برای همیشه حذف می‌کند."}
              isSubmitting={isSubmitting}
              disabled={isDeleteDisabled}
              disabledReason={isCleared ? "چک‌های پاس شده قابل حذف نیستند." : undefined}
            />}
        </div>
    );
}
    