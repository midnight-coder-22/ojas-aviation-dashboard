import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function getInitials(fullName = '') {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = getInitials(user?.full_name) || 'OA'

  return (
    <div className="relative ml-1" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Open profile menu"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="px-4 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-slate-950">
              {user?.full_name}
            </p>
            <span className="mt-1.5 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
              {user?.role}
            </span>
            <p className="mt-2 truncate text-xs text-slate-500">
              {user?.username}
            </p>
          </div>

          <div className="border-t border-slate-100" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
