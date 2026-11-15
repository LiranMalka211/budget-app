import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Direction } from 'radix-ui'
import { useState, type ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/authStore'
import { useDirection } from '@/lib/i18n/useDirection'
import { ApiError } from '@/types'

/** Applies the active language's text direction to Radix components and the document. */
function DirectionBoundary({ children }: { children: ReactNode }) {
  const lang = useDirection()
  return <Direction.Provider dir={lang.dir}>{children}</Direction.Provider>
}

/** Creates the React Query client with sensible defaults; never retries auth failures. */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  })
}

/** Composes every global provider: data cache, auth session, direction, tooltips and toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DirectionBoundary>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </DirectionBoundary>
      </AuthProvider>
    </QueryClientProvider>
  )
}
