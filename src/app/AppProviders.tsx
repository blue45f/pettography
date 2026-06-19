import ToastProvider from '@components/common/Toast'
import { installAuthInterceptors } from '@domains/auth'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router'

import { appQueryClient } from './queryClient'

import { AuthProvider } from '@/lib/firebaseAuth'
import { router as defaultRouter } from '@/router'

installAuthInterceptors()

interface AppProvidersProps {
  queryClient?: QueryClient
  router?: typeof defaultRouter
  showDevtools?: boolean
}

function AppProviders({
  queryClient = appQueryClient,
  router = defaultRouter,
  showDevtools = import.meta.env.DEV,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default AppProviders
