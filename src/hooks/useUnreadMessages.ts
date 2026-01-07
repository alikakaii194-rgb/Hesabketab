
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { useDashboardData } from './use-dashboard-data';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

/**
 * A hook to get the count of unread chat messages for the current user.
 * It now uses the data fetched by `useDashboardData`.
 * @returns {object} An object containing the `unreadCount`.
 */
export function useUnreadMessages() {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { allData, isLoading: isDashboardLoading } = useDashboardData();
  
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsUserLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const allMessages: ChatMessage[] = allData.chatMessages || [];

  const unreadCount = useMemo(() => {
    if (!allMessages || !user) {
      return 0;
    }
    // Filter messages that weren't sent by the current user AND
    // where the 'readBy' field either doesn't exist or doesn't include the user's UID.
    return allMessages.filter(msg => 
        msg.senderId !== user.id && msg.senderId !== 'system' &&
        (!msg.readBy || !msg.readBy.includes(user.id))
    ).length;
  }, [allMessages, user]);

  const isLoading = isUserLoading || isDashboardLoading;

  return { unreadCount: isLoading ? 0 : unreadCount };
}
