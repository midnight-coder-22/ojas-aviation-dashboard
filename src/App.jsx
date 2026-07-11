import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { deptToSlug } from './utils/constants'

import LoginPage             from './pages/LoginPage'
import DepartmentDashboard   from './pages/DepartmentDashboard'
import ExecutiveDashboard    from './pages/ExecutiveDashboard'
import EditDataPage          from './pages/EditDataPage'

// Redirect to correct dashboard based on role
function DefaultRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'Executive') return <Navigate to="/dashboard/executive" replace />
  if (user.role === 'Admin')     return <Navigate to="/dashboard/cnc" replace />
  return <Navigate to={`/dashboard/${deptToSlug(user.department || 'cnc')}`} replace />
}

// Protect any route — redirect to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard/executive" element={
        <ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>
      } />

      <Route path="/dashboard/:dept" element={
        <ProtectedRoute><DepartmentDashboard /></ProtectedRoute>
      } />

      <Route path="/edit-data" element={
        <ProtectedRoute><EditDataPage /></ProtectedRoute>
      } />

      {/* Default — smart redirect */}
      <Route path="/"  element={<DefaultRedirect />} />
      <Route path="*"  element={<DefaultRedirect />} />
    </Routes>
  )
}