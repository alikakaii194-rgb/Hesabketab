
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Sun,
  Moon,
  LogIn,
  TrendingUp,
  TrendingDown,
  LogOut,
  CreditCard,
  BookUser,
  BookCopy,
  FolderKanban,
  Target,
  Landmark,
  Bell,
  Handshake,
  Menu as MenuIcon,
  MessageSquare,
} from 'lucide-react';
import { HesabKetabLogo } from '@/components/icons';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Skeleton } from '../ui/skeleton';
import { USER_DETAILS } from '@/lib/constants';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

const useSimpleTheme = () => {
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return { theme, toggleTheme };
};

function Menu({ onLinkClick, unreadCount }: { onLinkClick?: () => void; unreadCount: number; }) {
  const pathname = usePathname();
  const menuItems = [
    { href: '/', label: 'داشبورد', icon: LayoutDashboard },
    { href: '/due-dates', label: 'سررسیدها', icon: Bell },
    { href: '/income', label: 'درآمدها', icon: TrendingUp },
    { href: '/transactions', label: 'هزینه‌ها', icon: TrendingDown },
    { href: '/cards', label: 'کارت‌های بانکی', icon: CreditCard },
    { href: '/transfers', label: 'انتقال داخلی', icon: ArrowRightLeft },
    { href: '/goals', label: 'اهداف مالی', icon: Target },
    { href: '/payees', label: 'طرف حساب‌ها', icon: BookUser },
    { href: '/checks', label: 'چک‌ها', icon: BookCopy },
    { href: '/loans', label: 'وام‌ها', icon: Landmark },
    { href: '/debts', label: 'بدهی‌ها', icon: Handshake },
    { href: '/chat', label: 'گفتگو', icon: MessageSquare, badge: unreadCount > 0 },
    { href: '/categories', label: 'دسته‌بندی‌ها', icon: FolderKanban },
  ];

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.label}
              onClick={onLinkClick}
              className="relative"
            >
              <item.icon />
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-destructive" />
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

const MobileMenuContent = ({ user, theme, toggleTheme, handleSignOut, onLinkClick, unreadCount }: {
  user: User | null;
  theme: string;
  toggleTheme: () => void;
  handleSignOut: () => void;
  onLinkClick?: () => void;
  unreadCount: number;
}) => {
    const userDetail = user ? USER_DETAILS[user.email?.startsWith('ali') ? 'ali' : 'fatemeh'] : null;
    const userAvatar = getPlaceholderImage(`${user?.email?.startsWith('ali') ? 'ali' : 'fatemeh'}-avatar`);
    const userName = userDetail?.firstName || 'کاربر';

    return (
        <div className="flex h-full flex-col">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <HesabKetabLogo className="size-8 text-primary" />
                    <span className="font-headline text-2xl font-bold">حساب کتاب</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <Menu onLinkClick={onLinkClick} unreadCount={unreadCount} />
            </SidebarContent>
            <SidebarFooter>
                {user && (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Avatar>
                                <AvatarImage
                                    src={userAvatar?.imageUrl}
                                    data-ai-hint={userAvatar?.imageHint}
                                />
                                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col truncate">
                                <span className="truncate text-sm font-semibold">
                                    {userName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </div>
                        <div className="flex">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                aria-label="تغییر تم"
                            >
                                {theme === 'light' ? <Moon /> : <Sun />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSignOut}
                                aria-label="خروج"
                                className="text-destructive hover:text-destructive"
                            >
                                <LogOut />
                            </Button>
                        </div>
                    </div>
                )}
            </SidebarFooter>
        </div>
    );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useSimpleTheme();
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { unreadCount } = useUnreadMessages();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  React.useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, user, pathname, router]);

  const userDetail = user ? USER_DETAILS[user.email?.startsWith('ali') ? 'ali' : 'fatemeh'] : null;
  const userAvatar = getPlaceholderImage(`${user?.email?.startsWith('ali') ? 'ali' : 'fatemeh'}-avatar`);
  const userName = userDetail?.firstName || 'کاربر';
  
  if (isLoading && pathname !== '/login') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <HesabKetabLogo className="size-16 animate-pulse text-primary" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }
  
  if (pathname === '/login' || (!user && !isLoading)) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="right" className="w-[18rem] bg-card p-0 text-card-foreground">
                <MobileMenuContent 
                  user={user} 
                  theme={theme} 
                  toggleTheme={toggleTheme} 
                  handleSignOut={handleSignOut}
                  onLinkClick={() => setMobileMenuOpen(false)}
                  unreadCount={unreadCount}
                />
            </SheetContent>
        </Sheet>
      </div>
      
      <Sidebar side="right" className="hidden md:flex">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <HesabKetabLogo className="size-8 text-primary" />
            <span className="font-headline text-2xl font-bold">حساب کتاب</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Menu unreadCount={unreadCount} />
        </SidebarContent>
        <SidebarFooter>
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar>
                  <AvatarImage
                    src={userAvatar?.imageUrl}
                    data-ai-hint={userAvatar?.imageHint}
                  />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="truncate text-sm font-semibold">
                    {userName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="تغییر تم"
                >
                  {theme === 'light' ? <Moon /> : <Sun />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="خروج"
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut />
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="w-full">
              <Button className="w-full">
                <LogIn className="ml-2" />
                ورود / ثبت‌نام
              </Button>
            </Link>
          )}
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col h-screen">
         <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm md:hidden">
            <Link href="/" className="flex items-center gap-2">
                <HesabKetabLogo className="size-7 text-primary" />
                <span className="font-headline text-xl font-bold">حساب کتاب</span>
            </Link>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <MenuIcon className="h-4 w-4" />
                      <span className="sr-only">باز کردن منو</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[18rem] bg-card p-0 text-card-foreground">
                    <MobileMenuContent 
                      user={user} 
                      theme={theme} 
                      toggleTheme={toggleTheme} 
                      handleSignOut={handleSignOut}
                      onLinkClick={() => setMobileMenuOpen(false)}
                      unreadCount={unreadCount}
                    />
                </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 overflow-y-auto">
             {children}
          </main>
      </div>
       {/* Floating Action Button for Chat */}
      <div className={cn(
        "fixed bottom-4 left-4 z-50",
        pathname === '/chat' && 'hidden' // Hide on chat page
      )}>
        <Button asChild size="icon" className="h-14 w-14 rounded-full shadow-lg relative">
            <Link href="/chat">
              {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                      {unreadCount}
                  </span>
              )}
              <MessageSquare className="h-6 w-6" />
              <span className="sr-only">گفتگو</span>
            </Link>
        </Button>
      </div>
    </SidebarProvider>
  );
}
