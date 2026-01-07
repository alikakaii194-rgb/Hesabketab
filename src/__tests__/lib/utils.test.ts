

import { formatCurrency, formatJalaliDate, toEnglishDigits, toPersianDigits, formatCardNumber, amountToWords } from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format a number to IRT correctly', () => {
    expect(formatCurrency(12345, 'IRT')).toBe('۱۲٬۳۴۵ تومان');
  });

  it('should handle zero correctly for IRT', () => {
    expect(formatCurrency(0, 'IRT')).toBe('۰ تومان');
  });

  it('should handle large numbers correctly for IRT', () => {
    expect(formatCurrency(10000000, 'IRT')).toBe('۱۰٬۰۰۰٬۰۰۰ تومان');
  });

  it('should format a number to USD correctly', () => {
    expect(formatCurrency(123.45, 'USD')).toBe('$123.45');
  });
  
  it('should treat NaN or invalid numbers as zero', () => {
    expect(formatCurrency(NaN, 'IRT')).toBe('۰ تومان');
    expect(formatCurrency(undefined as any, 'IRT')).toBe('۰ تومان');
  });

});

describe('formatJalaliDate', () => {
  it('should format a Date object to a Jalali date string', () => {
    // Note: The result depends on the timezone of the test runner.
    // We test for the format, not the exact conversion.
    const date = new Date(2024, 4, 21); // May 21, 2024
    expect(formatJalaliDate(date)).toMatch(/1403\/03\/01/);
  });

  it('should handle invalid date gracefully', () => {
    const invalidDate = new Date('invalid-date-string');
    expect(formatJalaliDate(invalidDate)).toBe('');
  });

   it('should handle null or undefined gracefully', () => {
    expect(formatJalaliDate(null as any)).toBe('');
    expect(formatJalaliDate(undefined as any)).toBe('');
  });
});

describe('digit conversion utilities', () => {
  it('toEnglishDigits should convert Persian and Arabic numbers to English', () => {
    expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
    expect(toEnglishDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
    expect(toEnglishDigits('hello ۱۲۳ world')).toBe('hello 123 world');
  });

  it('toPersianDigits should convert English numbers to Persian', () => {
    expect(toPersianDigits('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(toPersianDigits('test 123 test')).toBe('test ۱۲۳ test');
  });
});

describe('formatCardNumber', () => {
    it('should format a 16-digit card number with spaces', () => {
        expect(formatCardNumber('6037991012345678')).toBe('6037 9910 1234 5678');
    });
    
    it('should return a placeholder for undefined or short input', () => {
        expect(formatCardNumber(undefined)).toBe('---- ---- ---- ----');
        expect(formatCardNumber('1234')).toBe('1234');
    });
});

describe('amountToWords', () => {
    it('should convert 0 to "صفر"', () => {
        expect(amountToWords(0)).toBe('صفر');
    });

    it('should convert a simple number', () => {
        expect(amountToWords(5)).toBe('پنج');
    });

    it('should convert a two-digit number', () => {
        expect(amountToWords(25)).toBe('بیست و پنج');
    });

    it('should convert a teen number', () => {
        expect(amountToWords(14)).toBe('چهارده');
    });

    it('should convert a three-digit number', () => {
        expect(amountToWords(345)).toBe('سیصد و چهل و پنج');
    });

    it('should convert a number with thousands', () => {
        expect(amountToWords(12345)).toBe('دوازده هزار و سیصد و چهل و پنج');
    });

     it('should convert a number with millions', () => {
        expect(amountToWords(7654321)).toBe('هفت میلیون و ششصد و پنجاه و چهار هزار و سیصد و بیست و یک');
    });

    it('should handle numbers with zeros correctly', () => {
        expect(amountToWords(1005000)).toBe('یک میلیون و پنج هزار');
    });
});
