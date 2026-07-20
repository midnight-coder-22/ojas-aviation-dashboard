import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Circle } from 'lucide-react'
import { DEPARTMENTS, deptToSlug, slugToDept } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

export default function DeptSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const ref = useRef(null)

  // HashRouter already converts /#/dashboard/cnc into pathname=/dashboard/cnc.
  const path = location.pathname
  let activeName = ''

  if (path.startsWith('/dashboard/executive')) {
    activeName = 'Executive Dashboard'
  } else if (path.startsWith('/dashboard/')) {
    const slug = path.split('/dashboard/')[1]?.split('/')[0]
    activeName = slug ? slugToDept(slug) : ''
  }

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

  const filteredDepts = DEPARTMENTS.filter((department) =>
    department.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = (target) => {
    setIsOpen(false)
    setSearch('')

    if (target === 'executive') {
      navigate('/dashboard/executive')
      return
    }

    navigate(`/dashboard/${deptToSlug(target)}`)
  }

  const canSeeExecutive = user?.role === 'Admin' || user?.role === 'Executive'
  const triggerText =
    activeName === 'Executive Dashboard'
      ? activeName
      : activeName
        ? `${activeName} Dashboard`
        : 'Select Department'

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 min-w-[164px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200"
      >
        <span className="max-w-[190px] truncate">{triggerText}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          <div className="px-3 pb-2">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search departments..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {canSeeExecutive && (
              <button
                type="button"
                onClick={() => handleSelect('executive')}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                  activeName === 'Executive Dashboard'
                    ? 'bg-orange-50 font-semibold text-orange-700'
                    : 'text-slate-700'
                }`}
              >
                <span className="flex w-3 justify-center">
                  {activeName === 'Executive Dashboard' && (
                    <Circle size={7} className="fill-orange-500 text-orange-500" />
                  )}
                </span>
                Executive Dashboard
              </button>
            )}

            {filteredDepts.map((department) => {
              const isActive = activeName === department

              return (
                <button
                  type="button"
                  key={department}
                  onClick={() => handleSelect(department)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                    isActive
                      ? 'bg-orange-50 font-semibold text-orange-700'
                      : 'text-slate-700'
                  }`}
                >
                  <span className="flex w-3 justify-center">
                    {isActive && (
                      <Circle size={7} className="fill-orange-500 text-orange-500" />
                    )}
                  </span>
                  {department}
                </button>
              )
            })}

            {filteredDepts.length === 0 && (
              <p className="px-4 py-5 text-center text-sm text-slate-400">
                No department found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
