import { createContext, useContext, useState, useEffect } from 'react'

export const DashboardContext = createContext(null)
export const useDashboard = () => useContext(DashboardContext)

export default function DashboardProvider({ children }) {
  const [flagMode,       setFlagMode]       = useState(null)
  const [selectedWoIds,  setSelectedWoIds]  = useState(new Set())
  const [preExistingIds, setPreExistingIds] = useState(new Set())
  const [workOrders,     setWorkOrders]     = useState([])
  const [currentDept,    setCurrentDept]    = useState(null)
  const [isRefreshing,   setIsRefreshing]   = useState(false)
  const [isFullscreen,   setIsFullscreen]   = useState(false)

  // Escape key exits fullscreen
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Start Add Flag mode — pre-populate already-flagged rows
  const startAddMode = () => {
    const existing = new Set(
      workOrders.filter(r => r.has_active_flag).map(r => r.wo_id)
    )
    setPreExistingIds(existing)
    setSelectedWoIds(new Set(existing))
    setFlagMode('add')
  }

  // Start Resolve Flag mode — pre-select all flagged rows
  const startResolveMode = () => {
    const flagged = new Set(
      workOrders.filter(r => r.has_active_flag).map(r => r.wo_id)
    )
    setSelectedWoIds(flagged)
    setFlagMode('resolve')
  }

  // Toggle one WO ID in/out of selection
  const toggleWoId = (woId) => {
    setSelectedWoIds(prev => {
      const next = new Set(prev)
      if (next.has(woId)) next.delete(woId)
      else next.add(woId)
      return next
    })
  }

  // Reset all flag state
  const cancelFlag = () => {
    setFlagMode(null)
    setSelectedWoIds(new Set())
    setPreExistingIds(new Set())
  }

  return (
    <DashboardContext.Provider value={{
      flagMode,       setFlagMode,
      selectedWoIds,
      preExistingIds,
      workOrders,     setWorkOrders,
      currentDept,    setCurrentDept,
      isRefreshing,   setIsRefreshing,
      isFullscreen,   setIsFullscreen,
      startAddMode,
      startResolveMode,
      toggleWoId,
      cancelFlag,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}