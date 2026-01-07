
"use client"

import React, { useState, useEffect } from "react";
import { format as formatJalali, parse as parseJalali } from 'date-fns-jalali';
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { faIR } from 'date-fns/locale';

interface JalaliDatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  title?: string;
}

export function JalaliDatePicker({ value, onChange, className, placeholder = "یک تاریخ انتخاب کنید", title = "انتخاب تاریخ" }: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
    }
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-right font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {value ? formatJalali(value, 'yyyy/MM/dd') : <span>{placeholder}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto p-0 border-none bg-transparent shadow-none flex items-center justify-center">
        <div className="bg-background rounded-lg">
          <DayPicker
            mode="single"
            selected={value || undefined}
            onSelect={handleSelect}
            locale={faIR}
            dir="rtl"
            showOutsideDays
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
                nav_button_previous: "absolute right-1",
                nav_button_next: "absolute left-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md focus-within:relative focus-within:z-20",
                day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"),
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronRight className="h-4 w-4" />,
              IconRight: () => <ChevronLeft className="h-4 w-4" />,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
