
'use client';

import './globals.css';
import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { SupabaseAuthProvider } from '@/hooks/use-auth';
import { DashboardDataProvider } from '@/hooks/use-dashboard-data';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF9933" />
        <link
            href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap"
            rel="stylesheet"
        />
        <title>حساب کتاب</title>
        <meta name="description" content="اپلیکیشن مدرن و جامع برای مدیریت مالی شخصی و خانوادگی" />
      </head>
      <body>
        <SupabaseAuthProvider>
          <DashboardDataProvider>
            <AppLayout>{children}</AppLayout>
          </DashboardDataProvider>
        </SupabaseAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
