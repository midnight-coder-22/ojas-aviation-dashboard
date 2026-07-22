import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export const DashboardContext = createContext(null)

export const useDashboard = () => useContext(DashboardContext)

const FULLSCREEN_TARGET_ID = 'department-dashboard-fullscreen'

function isActiveFlag(value) {
  if (value === true || value === 1) {
    return true
  }

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

  /*
   * Synchronize React state with the browser's actual fullscreen state.
   *
   * This is important because the user can leave fullscreen by:
   * - pressing Escape
   * - using the browser's fullscreen controls
   * - navigating away
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()))

      /*
       * Allow responsive chart libraries to recalculate their dimensions
       * after the viewport changes.
       */
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'))
      })
    }

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange,
    )

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
        /*
         * Safari fallback.
         */
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
    if (getFullscreenElement()) {
      return exitFullscreen()
    }

    return enterFullscreen()
  }, [enterFullscreen, exitFullscreen])

  /*
   * Add Flag mode:
   * Existing active flags are selected and locked.
   */
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

  /*
   * Resolve Flag mode:
   * Start with all active flags selected.
   */
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

      if (next.has(woId)) {
        next.delete(woId)
      } else {
        next.add(woId)
      }

      return next
    })
  }

  const cancelFlag = () => {
    setFlagMode(null)
    setSelectedWoIds(new Set())
    setPreExistingIds(new Set())
  }

  return (
    <DashboardContext.Provider
      value={{
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

        startAddMode,
        startResolveMode,
        toggleWoId,
        cancelFlag,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}