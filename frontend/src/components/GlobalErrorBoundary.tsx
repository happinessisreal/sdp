import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "./ui/Button";
import { AlertTriangle } from "lucide-react";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-surface-900">Something went wrong</h2>
      <p className="mb-6 max-w-md text-surface-600">
        An unexpected error occurred in the application. Our team has been notified.
      </p>
      <div className="mb-6 w-full max-w-md rounded-md bg-surface-100 p-4 text-left text-sm font-mono text-surface-800 overflow-auto">
        {error instanceof Error ? error.message : String(error)}
      </div>
      <div className="flex gap-4">
        <Button onClick={resetErrorBoundary}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = "/"}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
