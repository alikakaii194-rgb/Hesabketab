
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HesabKetabLogo } from '@/components/icons';
import { ALLOWED_USERS, USER_DETAILS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import type { UserProfile } from '@/lib/types';

const formSchema = z.object({
  email: z
    .string()
    .email({ message: 'لطفا یک ایمیل معتبر وارد کنید.' })
    .refine((email) => ALLOWED_USERS.includes(email.toLowerCase()), {
      message: 'شما اجازه ورود به این اپلیکیشن را ندارید.',
    }),
  password: z
    .string()
    .min(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      setIsUserLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      setIsUserLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isUserLoading && currentUser) {
      router.push('/');
    }
  }, [currentUser, isUserLoading, router]);

  const ensureUserProfile = async (user: User) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
      throw error;
    }

    if (!data) { // Profile does not exist
      const userDetailKey = user.email!.split('@')[0] as 'ali' | 'fatemeh';
      const userDetail = USER_DETAILS[userDetailKey];
      if (userDetail) {
        const profileData: Omit<UserProfile, 'id' | 'signatureImage'> & { id: string, signature_image_path: string | null } = {
          id: user.id,
          email: user.email!,
          first_name: userDetail.firstName,
          last_name: userDetail.lastName,
          signature_image_path: userDetail.signatureImage || null,
        };
        const { error: insertError } = await supabase.from('users').insert([profileData]);
        if (insertError) throw insertError;
      }
    }
  };

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    const { email, password } = values;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      const user = data.user;
      if (!user) throw new Error("ورود ناموفق بود. لطفاً دوباره تلاش کنید.");

      toast({
        title: 'ورود موفق',
        description: 'شما با موفقیت وارد شدید.',
      });

      await ensureUserProfile(user);
      router.push('/');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطا در ورود',
        description: error.message === 'Invalid login credentials' ? 'ایمیل یا رمز عبور اشتباه است.' : (error.message || 'مشکلی در ورود پیش آمد.'),
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const totalLoading = isLoading || isUserLoading;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <HesabKetabLogo className="size-10 text-primary" />
            <h1 className="font-headline text-3xl font-bold">حساب کتاب</h1>
          </div>
          <CardTitle className="font-headline">ورود به حساب کاربری</CardTitle>
          <CardDescription>
             برای ادامه ایمیل و رمز عبور خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                        disabled={totalLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={totalLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={totalLoading}>
                {totalLoading && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                ورود
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
