import { Navigate, Outlet } from 'react-router-dom'
import { homePath, useAuth } from '../context/AuthContext'
import { PageLoader } from './ui'

/** Renders child routes only for logged-in users with one of the allowed roles. */
export default function ProtectedRoute({ roles }) {
  const { user, checking } = useAuth()
  if (checking) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />
  return <Outlet />
}
