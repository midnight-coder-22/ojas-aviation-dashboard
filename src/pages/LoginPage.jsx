import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { deptToSlug } from '../utils/constants'

function getDefaultRoute(user) {
  if (!user) return '/login'
  if (user.role === 'Executive') return '/dashboard/executive'
  if (user.role === 'Admin')     return '/dashboard/cnc'
  return '/dashboard/' + deptToSlug(user.department || 'cnc')
}

export default function LoginPage() {
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [error,     setError]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, user }           = useAuth()
  const navigate                  = useNavigate()

  // Already logged in — redirect
  useEffect(() => {
    if (user) navigate(getDefaultRoute(user), { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const loggedInUser = await login({ username, password })
      navigate(getDefaultRoute(loggedInUser), { replace: true })
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen">

      {/* Left — branding */}
      <div className="w-3/5 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden flex flex-col items-center justify-center">
        {/* Subtle grid texture */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 text-center px-12">
          <h1 className="text-5xl font-bold text-white">Ojas Aviation</h1>
          <p className="text-lg text-white/70 mt-3">Operational Command Center</p>
          <div className="flex gap-2 justify-center mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-0.5 w-12 bg-white/30 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="w-2/5 bg-white flex flex-col items-center justify-center px-12">
        {/* Monogram */}
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl font-black text-orange-500">OA</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mt-6">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1">Sign in to continue to Ojas Aviation</p>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-4">
          {/* Username */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full h-11 rounded-xl border border-slate-200 px-4 text-sm
                         focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full h-11 rounded-xl border border-slate-200 px-4 pr-10 text-sm
                           focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-60
                       text-white rounded-xl font-semibold text-sm transition-all
                       flex items-center justify-center gap-2 mt-2"
          >
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              : <><span>Sign In</span><ArrowRight size={16} /></>
            }
          </button>
        </form>
      </div>

    </div>
  )
}