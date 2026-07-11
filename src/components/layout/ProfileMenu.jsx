import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function getInitials(fullName = '') {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')
}

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()
  const ref                 = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center
                   text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
      >
        {getInitials(user?.full_name)}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-2">
          <div className="px-4 pt-2 pb-3">
            <p className="text-sm font-semibold text-slate-900">{user?.full_name}</p>
            <span className="inline-block mt-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {user?.role}
            </span>
            <p className="text-xs text-slate-500 mt-1">{user?.username}</p>
          </div>
          <div className="border-t border-slate-100" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 flex items-center gap-2 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}