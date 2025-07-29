// src/components/ProtectedRoute.tsx
import { useSession } from '../hooks/useSession'
import { Navigate } from 'react-router-dom'
import React from 'react'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const session = useSession()

  if (session === undefined) {
    // While loading the session
    return <div>Loading...</div>
  }

  if (!session) {
    // Not logged in
    return <Navigate to="/login" replace />
  }

  // Logged in – render the protected children
  return <>{children}</>
}
