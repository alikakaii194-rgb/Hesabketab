
'use client';
import React from 'react';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat/chat-interface';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/use-dashboard-data';

function ChatPageSkeleton() {
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="border rounded-lg h-[60vh] flex flex-col p-4 space-y-4">
                <div className="flex-grow space-y-4">
                    <Skeleton className="h-12 w-3/4 self-start rounded-lg" />
                    <Skeleton className="h-16 w-1/2 self-end rounded-lg" />
                    <Skeleton className="h-10 w-2/3 self-start rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-grow" />
                    <Skeleton className="h-10 w-20" />
                </div>
            </div>
        </div>
    )
}

export default function ChatPage() {
    const { user, isUserLoading } = useAuth();
    const { isLoading: isDataLoading, allData } = useDashboardData();
    
    const isLoading = isUserLoading || isDataLoading;

    if (isLoading || !user) {
        return <ChatPageSkeleton />;
    }

  return (
    <main className="flex h-[calc(100vh_-_5rem)] flex-col">
       <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
                <Link href="/" passHref>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="font-headline text-2xl font-bold tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-6 w-6"/>
                    گفتگوی مشترک
                </h1>
            </div>
        </div>
        <ChatInterface currentUser={user} allData={allData} />
    </main>
  );
}
