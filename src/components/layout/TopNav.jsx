import { useContext, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Flag,
  ShieldCheck,
  CheckCircle,
  RotateCw,
  Loader2,
  Maximize2,
  Minimize2,
  X,
  Database,
  Plane,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { ToastContext } from '../../context/ToastContext'
import { raiseFlags, resolveFlags } from '../../api/flags'
import DeptSelector from './DeptSelector'
import ProfileMenu from './ProfileMenu'

const BRAND_ORANGE = '#f05a00'

export default function TopNav() {
  const { user } = useAuth()
  const db = useDashboard()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { showToast } = useContext(ToastContext)

  // HashRouter exposes the route as pathname, not location.hash.
  // Using location.hash here caused the selector to show "Select Department"
  // and hid all department action buttons on /#/dashboard/:dept.
  const path = location.pathname
  const isOnDeptDashboard =
    path.startsWith('/dashboard/') && !path.startsWith('/dashboard/executive')

  const notificationCount = useMemo(
    () => db.workOrders.filter((row) => row.has_active_flag).length,
    [db.workOrders],
  )

  const invalidateCurrentDepartment = (
  department = db.currentDept,
  ) => {
  if (!department) {
    return Promise.resolve()
  }

  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['dept-data', department],
    }),

    queryClient.invalidateQueries({
      queryKey: ['dept-summary', department],
    }),

    queryClient.invalidateQueries({
      queryKey: ['flags', department],
    }),
  ])
  const setFlagStateInCache = (
  woIds,
  hasActiveFlag,
  department = db.currentDept,
) => {
  if (!department || woIds.length === 0) {
    return
  }

  const normalizedIds = new Set(
    woIds.map((woId) => String(woId).trim()),
  )

  /*
   * Update the department-data cache immediately.
   */
  queryClient.setQueryData(
    ['dept-data', department],
    (currentData) => {
      if (!currentData?.data) {
        return currentData
      }

      return {
        ...currentData,

        data: currentData.data.map((row) => {
          const rowId = String(row.wo_id).trim()

          if (!normalizedIds.has(rowId)) {
            return row
          }

          return {
            ...row,
            has_active_flag: hasActiveFlag,
          }
        }),
      }
    },
  )

  /*
   * Update the dedicated active-flags cache immediately.
   */
  queryClient.setQueryData(
    ['flags', department],
    (currentFlags) => {
      const existingFlags = Array.isArray(currentFlags)
        ? currentFlags
        : []

      if (!hasActiveFlag) {
        return existingFlags.filter(
          (flag) =>
            !normalizedIds.has(
              String(flag.wo_id).trim(),
            ),
        )
      }

      const existingIds = new Set(
        existingFlags.map((flag) =>
          String(flag.wo_id).trim(),
        ),
      )

      const newFlags = [...normalizedIds]
        .filter((woId) => !existingIds.has(woId))
        .map((woId) => ({
          sr_no: null,
          wo_id: woId,
          item_no: null,
          department,
          flag_status: 1,
          raised_date: new Date().toISOString(),
          resolved_date: null,
          raised_by: user?.username ?? null,
          resolved_by: null,
        }))

      return [...existingFlags, ...newFlags]
    },
  )
}
}

  const handleRefresh = () => {
    if (!db.currentDept || db.isRefreshing) return

    db.setIsRefreshing(true)
    invalidateCurrentDepartment()
    window.setTimeout(() => db.setIsRefreshing(false), 1500)
  }

  const handleDone = async () => {
  const department = db.currentDept

  if (!department) {
    showToast(
      'No department is currently selected.',
      'error',
    )

    return
  }

  if (db.flagMode === 'add') {
    const newIds = [...db.selectedWoIds].filter(
      (woId) => !db.preExistingIds.has(woId),
    )

    if (newIds.length === 0) {
      db.cancelFlag()
      return
    }

    try {
      const result = await raiseFlags({
        wo_ids: newIds,
        department,
      })

      /*
       * Update the UI before performing the background refetch.
       */
      setFlagStateInCache(
        newIds,
        true,
        department,
      )

      db.cancelFlag()

      showToast(
        result.message ||
          `${newIds.length} flag(s) raised.`,
        'success',
      )

      /*
       * Synchronize the optimistic cache with the server.
       */
      void invalidateCurrentDepartment(department)
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          'Failed to raise flags.',
        'error',
      )
    }

    return
  }

  if (db.flagMode === 'resolve') {
    const selectedIds = [...db.selectedWoIds]

    if (selectedIds.length === 0) {
      db.cancelFlag()
      return
    }

    try {
      const result = await resolveFlags({
        wo_ids: selectedIds,
      })

      setFlagStateInCache(
        selectedIds,
        false,
        department,
      )

      db.cancelFlag()

      showToast(
        result.message ||
          `${selectedIds.length} flag(s) resolved.`,
        'success',
      )

      void invalidateCurrentDepartment(department)
    } catch (error) {
      showToast(
        error.response?.data?.detail ||
          'Failed to resolve flags.',
        'error',
      )
    }
  }
}
  const handleFullscreen = async () => {
  const succeeded = await db.toggleFullscreen()

  if (!succeeded) {
    showToast(
      'Fullscreen mode could not be started. Open the dashboard directly in a browser tab and try again.',
      'error',
    )
  }
}

  const neutralActionClass =
    'h-9 rounded-xl bg-slate-100 px-3.5 text-sm font-medium text-slate-700 ' +
    'flex items-center gap-2 whitespace-nowrap transition-colors ' +
    'hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40'

  const primaryActionClass =
    'h-9 rounded-xl px-3.5 text-sm font-semibold text-white ' +
    'flex items-center gap-2 whitespace-nowrap transition-colors ' +
    'shadow-[0_1px_2px_rgba(15,23,42,0.12)]'

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex h-full min-w-0 items-center px-5">
        <div className="flex shrink-0 items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: BRAND_ORANGE }}
            aria-hidden="true"
          >
            <Plane size={20} strokeWidth={2.15} className="-rotate-45" />
          </div>
          <span className="whitespace-nowrap text-base font-bold tracking-[-0.015em] text-slate-950">
            Ojas Aviation
          </span>
        </div>

        <div className="mx-3 h-8 w-px shrink-0 bg-slate-200" />

        <DeptSelector />

        {isOnDeptDashboard && (
          <div className="mx-3 h-8 w-px shrink-0 bg-slate-200" />
        )}

        {isOnDeptDashboard && (
          <div className="flex min-w-0 items-center gap-2">
            {user?.can_edit_data && (
              <button
                type="button"
                onClick={() => navigate('/edit-data')}
                className={`${primaryActionClass} hover:brightness-95`}
                style={{ backgroundColor: BRAND_ORANGE }}
              >
                <Database size={16} strokeWidth={2} />
                Edit Data
              </button>
            )}

            {user?.can_flag &&
              (db.flagMode === 'add' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDone}
                    className={primaryActionClass}
                    style={{ backgroundColor: BRAND_ORANGE }}
                  >
                    <CheckCircle size={16} />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={db.cancelFlag}
                    className={neutralActionClass}
                  >
                    <X size={15} />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={db.startAddMode}
                  disabled={db.flagMode === 'resolve'}
                  className={neutralActionClass}
                >
                  <Flag size={16} />
                  Add Flag
                </button>
              ))}

            {user?.can_resolve_flag &&
              (db.flagMode === 'resolve' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDone}
                    className={`${primaryActionClass} bg-emerald-600 hover:bg-emerald-700`}
                  >
                    <CheckCircle size={16} />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={db.cancelFlag}
                    className={neutralActionClass}
                  >
                    <X size={15} />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={db.startResolveMode}
                  disabled={db.flagMode === 'add'}
                  className={neutralActionClass}
                >
                  <ShieldCheck size={16} />
                  Resolve Flag
                </button>
              ))}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-3">
          {isOnDeptDashboard && (
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh data"
              aria-label="Refresh data"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              {db.isRefreshing ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RotateCw size={17} />
              )}
            </button>
          )}

          {isOnDeptDashboard && (
            <button
              type="button"
              onClick={handleFullscreen}
              title={db.isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              aria-label={db.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              {db.isFullscreen ? (
                <Minimize2 size={17} />
              ) : (
                <Maximize2 size={17} />
              )}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell size={17} />
            </button>

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </div>

          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
