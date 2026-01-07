
"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { formatJalaliDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder: string;
  disabled?: boolean;
}

export function DatePicker({ date, setDate, placeholder, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectDate = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setIsOpen(false); // Close the dialog after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-right font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {date ? formatJalaliDate(date) : <span>{placeholder}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          initialFocus
          dir="rtl"
        />
      </DialogContent>
    </Dialog>
  );
}
