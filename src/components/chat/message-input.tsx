
'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, X, CornerDownLeft } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
}

export function MessageInput({ onSendMessage, replyingTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyingTo) {
        inputRef.current?.focus();
    }
  }, [replyingTo]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {replyingTo && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm">
            <div className="flex items-center gap-2 overflow-hidden">
                <CornerDownLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="overflow-hidden">
                    <p className="font-bold truncate">در پاسخ به: {replyingTo.senderName}</p>
                    <p className="truncate text-muted-foreground">{replyingTo.text}</p>
                </div>
            </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 space-x-reverse">
        <Input
          ref={inputRef}
          type="text"
          placeholder="پیام خود را بنویسید..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit">
          <Send className="h-4 w-4 ml-2" />
          ارسال
        </Button>
      </form>
    </div>
  );
}
