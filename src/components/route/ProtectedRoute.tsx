import { useAppStore } from '@store/index'
import { Navigate, useLocation } from 'react-router'

import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
