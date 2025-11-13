'use client';

import { useEffect } from 'react';

/**
 * Global error boundary for fallback errors triggered before
 * route-level error boundaries are able to render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error captured:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white shadow-lg rounded-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-sm text-gray-600">
            An unexpected error occurred while rendering this page. Please try again or contact support if the issue
            persists.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="p-4 bg-red-50 border border-red-100 rounded text-left text-xs text-red-700 overflow-auto max-h-48">
              <p className="font-semibold mb-1">Error message:</p>
              <pre>{error.message}</pre>
              {error.digest && (
                <>
                  <p className="font-semibold mt-2 mb-1">Error digest:</p>
                  <pre>{error.digest}</pre>
                </>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}


