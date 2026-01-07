
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import type { ChatMessage, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { USER_DETAILS } from '@/lib/constants';
import { Check, CheckCheck, CornerDownLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { SystemMessageCard } from './system-message-card';


interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onReply: (message: ChatMessage) => void;
  allUsers: UserProfile[];
}

export function MessageList({ messages, currentUserId, onReply, allUsers }: MessageListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const otherUser = useMemo(() => {
    return allUsers.find(u => u.id !== currentUserId);
  }, [allUsers, currentUserId]);


  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate();
        return formatDistanceToNow(date, { addSuffix: true, locale: faIR });
    } catch(e) {
        return 'همین الان';
    }
  }

  const getReadStatusIcon = (message: ChatMessage) => {
    if (!otherUser) return <Check className="h-4 w-4" />;
    
    const isReadByOther = message.readBy?.includes(otherUser.id);
    
    if (isReadByOther) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4" />;
  };
  
  if (messages.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">هنوز پیامی رد و بدل نشده است. اولین نفر باشید!</p>
        </div>
      )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        if (message.type === 'system') {
            return <SystemMessageCard key={message.id} message={message} />;
        }
        
        const isCurrentUser = message.senderId === currentUserId;
        const sender = allUsers.find(u => u.id === message.senderId);
        const senderKey = sender?.email.startsWith('ali') ? 'ali' : 'fatemeh';
        const avatar = getPlaceholderImage(`${senderKey}-avatar`);

        return (
          <div
            key={message.id}
            className={cn('group flex items-end gap-3', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint} />
              <AvatarFallback>{message.senderName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'max-w-xs rounded-lg p-3 lg:max-w-md cursor-pointer transition-transform duration-150 group-hover:scale-[1.02]',
                isCurrentUser
                  ? 'rounded-br-none bg-primary text-primary-foreground'
                  : 'rounded-bl-none bg-muted'
              )}
              onClick={() => onReply(message)}
            >
              {message.replyTo && (
                  <div className={cn(
                      "mb-2 border-l-2 pl-2 text-xs",
                      isCurrentUser ? "border-primary-foreground/50" : "border-primary"
                  )}>
                      <p className={cn("font-bold", isCurrentUser ? "text-white" : "text-primary")}>در پاسخ به: {message.replyTo.senderName}</p>
                      <p className="truncate opacity-80">{message.replyTo.text}</p>
                  </div>
              )}
              <p className="whitespace-pre-wrap text-sm">{message.text}</p>
              <div className={cn(
                  "mt-2 flex items-center gap-1 text-xs",
                  isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                <span>{formatDate(message.timestamp)}</span>
                {isCurrentUser && getReadStatusIcon(message)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
}
