'use client';

interface ErrorDisplayProps {
  message: string;
  stack?: string;
  digest?: string;
}

export function ErrorDisplay({ message, stack, digest }: ErrorDisplayProps) {
  return (
    <div className="max-w-xl rounded-lg bg-destructive/10 p-4 text-destructive">
      <h2 className="mb-2 text-lg font-bold">خطایی رخ داد</h2>
      <p className="mb-4 text-sm">{message}</p>
      {digest && (
        <p className="mb-2 text-xs font-mono">
          Digest: {digest}
        </p>
      )}
      {stack && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm">مشاهده جزئیات فنی</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-destructive/10 p-2 text-xs font-mono">
            {stack}
          </pre>
        </details>
      )}
    </div>
  );
}
