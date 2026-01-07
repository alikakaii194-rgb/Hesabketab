
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatJalali } from 'date-fns-jalali';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { supabase } from './supabase-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toEnglishDigits(str: string): string {
    if (!str) return '';
    const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let newStr = str;
    for (let i = 0; i < 10; i++) {
        newStr = newStr.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
    }
    return newStr;
}

export function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (d) => persianNumbers[parseInt(d)]);
}

export function formatCurrency(amount?: number, currency: 'USD' | 'IRT' = 'IRT') {
    const numericAmount = (typeof amount !== 'number' || isNaN(amount)) ? 0 : amount;
    if (currency === 'IRT') {
        return new Intl.NumberFormat('fa-IR').format(numericAmount) + ' تومان';
    }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(numericAmount);
}

export function formatJalaliDate(date: Date | string) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return formatJalali(dateObj, 'yyyy/MM/dd');
}

export function getRelativeTime(date: Date | string) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: faIR });
}


export function formatCardNumber(cardNumber?: string) {
    if (!cardNumber) return '---- ---- ---- ----';
    return cardNumber.replace(/(\d{4})/g, '$1 ').trim();
};

const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const thousands = ["", " هزار", " میلیون", " میلیارد", " تریلیون"];

function convertThreeDigits(num: number): string {
    if (num === 0) return "";
    let str = "";
    if (num >= 100) {
        str += hundreds[Math.floor(num / 100)] + " و ";
        num %= 100;
    }
    if (num >= 10 && num < 20) {
        str += teens[num - 10];
    } else if (num >= 20) {
        str += tens[Math.floor(num / 10)];
        if (num % 10 !== 0) {
            str += " و " + units[num % 10];
        }
    } else if (num > 0) {
        str += units[num];
    }
    return str.replace(/ و $/, "");
}

export function amountToWords(amount: number): string {
    if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return 'صفر';

    let numStr = Math.floor(amount).toString();
    let result = [];
    let i = numStr.length;

    while (i > 0) {
        let chunk = parseInt(numStr.substring(Math.max(0, i - 3), i));
        if (chunk > 0) {
            let chunkStr = convertThreeDigits(chunk);
            let thousand = thousands[Math.floor((numStr.length - i) / 3)];
            result.push(chunkStr + thousand);
        }
        i -= 3;
    }
    
    return result.reverse().join(" و ").trim();
}

const BUCKET_NAME = 'hesabketabsatl';

export const getPublicUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data?.publicUrl || null;
}
