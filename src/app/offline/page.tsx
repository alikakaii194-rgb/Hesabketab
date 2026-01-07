import { WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <WifiOff className="size-8 text-destructive" />
          </div>
          <CardTitle className="pt-4 font-headline text-2xl">
            شما آفلاین هستید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            به نظر می‌رسد اتصال شما به اینترنت قطع شده است. لطفاً اتصال خود را
            بررسی کرده و دوباره تلاش کنید.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
