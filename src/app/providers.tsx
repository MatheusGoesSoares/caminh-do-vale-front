import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getSession, subscribeSession } from '@/services/api/session';
import { ApiError } from '@/services/api/http';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      staleTime: 10_000,
      refetchOnWindowFocus: true,
    },
  },
});

// Data from one user must not leak to the next login.
subscribeSession(() => {
  if (!getSession()) queryClient.clear();
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
