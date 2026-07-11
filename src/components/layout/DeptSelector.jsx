import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Circle } from 'lucide-react'
import { DEPARTMENTS, deptToSlug, slugToDept } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function DeptSelector() {
  const [isOpen,  setIsOpen]  = useState(false)
  const [search,  setSearch]  = useState('')
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const ref       = useRef(null)

  // Determine what's currently active from URL
  const path = location.hash.replace('#', '')
  let activeName = ''
  if (path.includes('/dashboard/executive')) {
    activeName = 'Executive Dashboard'
  } else if (path.includes('/dashboard/')) {
    const slug = path.split('/dashboard/')[1]
    activeName = slugToDept(slug)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredDepts = DEPARTMENTS.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (target) => {
    setIsOpen(false)
    setSearch('')
    if (target === 'executive') {
      navigate('/dashboard/executive')
    } else {
      navigate('/dashboard/' + deptToSlug(target))
    }
  }

  const canSeeExecutive = user?.role === 'Admin' || user?.role === 'Executive'

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700
                   min-w-52 flex items-center justify-between gap-2
                   hover:border-orange-300 transition-all"
      >
        <span className="truncate">{activeName === 'Executive Dashboard'
  ? 'Executive Dashboard'
  : activeName
    ? `${activeName} Dashboard`
    : 'Select Department'}</span>
        <ChevronDown
          size={15}
          className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-2">
          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:border-orange-300"
              />
            </div>
          </div>

          {/* Executive option */}
          {canSeeExecutive && (
            <button
              onClick={() => handleSelect('executive')}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50
                ${activeName === 'Executive Dashboard'
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-slate-700'
                }`}
            >
              {activeName === 'Executive Dashboard' && (
                <Circle size={6} className="fill-orange-500 text-orange-500 shrink-0" />
              )}
              Executive Dashboard
            </button>
          )}

          {/* Department options */}
          {filteredDepts.map(dept => {
            const isActive = activeName === dept
            return (
              <button
                key={dept}
                onClick={() => handleSelect(dept)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50
                  ${isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-slate-700'}`}
              >
                {isActive && (
                  <Circle size={6} className="fill-orange-500 text-orange-500 shrink-0" />
                )}
                {dept}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}