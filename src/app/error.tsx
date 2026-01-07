'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDisplay } from '@/components/error-display';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <ErrorDisplay
        // Pass only the serializable and necessary properties of the error object
        // to avoid circular reference issues with the Next.js dev overlay.
        message={error.message}
        stack={error.stack}
        digest={error.digest}
      />
      <Button onClick={() => reset()} className="mt-6">
        تلاش مجدد
      </Button>
    </div>
  );
}
