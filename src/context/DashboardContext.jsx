import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { EMPTY_DASHBOARD_FILTERS } from '../utils/dashboardFilters'

export const DashboardContext = createContext(null)
export const useDashboard = () => useContext(DashboardContext)

const FULLSCREEN_TARGET_ID = 'department-dashboard-fullscreen'

function isActiveFlag(value) {
  if (value === true || value === 1) return true

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }

  return false
}

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    null
  )
}

export default function DashboardProvider({ children }) {
  const [flagMode, setFlagMode] = useState(null)
  const [selectedWoIds, setSelectedWoIds] = useState(new Set())
  const [preExistingIds, setPreExistingIds] = useState(new Set())
  const [workOrders, setWorkOrders] = useState([])
  const [currentDept, setCurrentDept] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dashboardFilters, setDashboardFilters] = useState({
    ...EMPTY_DASHBOARD_FILTERS,
  })

  const hasActiveDashboardFilters = useMemo(
    () => Object.values(dashboardFilters).some(Boolean),
    [dashboardFilters],
  )

  const setDashboardFilter = useCallback((key, value) => {
    setDashboardFilters((current) => ({
      ...current,
      [key]: value || null,
    }))
  }, [])

  const setDashboardFilterGroup = useCallback((updates) => {
    setDashboardFilters((current) => ({
      ...current,
      ...updates,
    }))
  }, [])

  const resetDashboardFilters = useCallback(() => {
    setDashboardFilters({ ...EMPTY_DASHBOARD_FILTERS })
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()))

      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'))
      })
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener(
      'webkitfullscreenchange',
      handleFullscreenChange,
    )

    handleFullscreenChange()

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange,
      )
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange,
      )
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    const fullscreenTarget = document.getElementById(
      FULLSCREEN_TARGET_ID,
    )

    if (!fullscreenTarget) {
      console.error(
        `Fullscreen target #${FULLSCREEN_TARGET_ID} was not found.`,
      )
      return false
    }

    try {
      if (fullscreenTarget.requestFullscreen) {
        await fullscreenTarget.requestFullscreen({
          navigationUI: 'hide',
        })
      } else if (fullscreenTarget.webkitRequestFullscreen) {
        fullscreenTarget.webkitRequestFullscreen()
      } else {
        throw new Error(
          'The Fullscreen API is not supported by this browser.',
        )
      }

      return true
    } catch (error) {
      console.error('Could not enter fullscreen mode:', error)
      return false
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (
        document.fullscreenElement &&
        document.exitFullscreen
      ) {
        await document.exitFullscreen()
      } else if (
        document.webkitFullscreenElement &&
        document.webkitExitFullscreen
      ) {
        document.webkitExitFullscreen()
      }

      return true
    } catch (error) {
      console.error('Could not exit fullscreen mode:', error)
      return false
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (getFullscreenElement()) return exitFullscreen()
    return enterFullscreen()
  }, [enterFullscreen, exitFullscreen])

  const startAddMode = () => {
    const existing = new Set(
      workOrders
        .filter((row) => isActiveFlag(row.has_active_flag))
        .map((row) => row.wo_id),
    )

    setPreExistingIds(existing)
    setSelectedWoIds(new Set(existing))
    setFlagMode('add')
  }

  const startResolveMode = () => {
    const flagged = new Set(
      workOrders
        .filter((row) => isActiveFlag(row.has_active_flag))
        .map((row) => row.wo_id),
    )

    setSelectedWoIds(flagged)
    setFlagMode('resolve')
  }

  const toggleWoId = (woId) => {
    setSelectedWoIds((previous) => {
      const next = new Set(previous)

      if (next.has(woId)) next.delete(woId)
      else next.add(woId)

      return next
    })
  }

  const cancelFlag = () => {
    setFlagMode(null)
    setSelectedWoIds(new Set())
    setPreExistingIds(new Set())
  }

  const value = {
    flagMode,
    setFlagMode,
    selectedWoIds,
    preExistingIds,
    workOrders,
    setWorkOrders,
    currentDept,
    setCurrentDept,
    isRefreshing,
    setIsRefreshing,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    dashboardFilters,
    setDashboardFilter,
    setDashboardFilterGroup,
    resetDashboardFilters,
    hasActiveDashboardFilters,
    startAddMode,
    startResolveMode,
    toggleWoId,
    cancelFlag,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
