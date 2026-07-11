import { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Bell, Flag, ShieldCheck, CheckCircle, RotateCw,
  Loader2, Maximize2, Minimize2, X, FileSpreadsheet,
} from 'lucide-react'

import { useAuth }        from '../../context/AuthContext'
import { useDashboard }   from '../../context/DashboardContext'
import { ToastContext }   from '../../context/ToastContext'
import { raiseFlags, resolveFlags } from '../../api/flags'
import DeptSelector from './DeptSelector'
import ProfileMenu  from './ProfileMenu'

export default function TopNav() {
  const { user }      = useAuth()
  const db            = useDashboard()
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const { showToast } = useContext(ToastContext)

  // Detect if we are on a department dashboard page (not executive)
  const path = useLocation().hash.replace('#', '')
  const isOnDeptDashboard = path.startsWith('/dashboard/') && !path.includes('/executive')

  // Refresh the current department's data
  const handleRefresh = () => {
    if (!db.currentDept) return
    db.setIsRefreshing(true)
    queryClient.invalidateQueries(['dept-data',    db.currentDept])
    queryClient.invalidateQueries(['dept-summary', db.currentDept])
    queryClient.invalidateQueries(['flags',        db.currentDept])
    setTimeout(() => db.setIsRefreshing(false), 1500)
  }

  // Done button — raises or resolves depending on current mode
  const handleDone = async () => {
    if (db.flagMode === 'add') {
      // Only newly selected rows (not the ones already flagged before Add mode started)
      const newIds = [...db.selectedWoIds].filter(id => !db.preExistingIds.has(id))
      if (newIds.length === 0) { db.cancelFlag(); return }
      try {
        const result = await raiseFlags({ wo_ids: newIds, department: db.currentDept })
        showToast(result.message || `${newIds.length} flag(s) raised.`, 'success')
        queryClient.invalidateQueries(['dept-data',    db.currentDept])
        queryClient.invalidateQueries(['dept-summary', db.currentDept])
      } catch (e) {
        showToast(e.response?.data?.detail || 'Failed to raise flags.', 'error')
      }
      db.cancelFlag()
    } else if (db.flagMode === 'resolve') {
      if (db.selectedWoIds.size === 0) { db.cancelFlag(); return }
      try {
        const result = await resolveFlags({ wo_ids: [...db.selectedWoIds] })
        showToast(result.message || `${db.selectedWoIds.size} flag(s) resolved.`, 'success')
        queryClient.invalidateQueries(['dept-data',    db.currentDept])
        queryClient.invalidateQueries(['dept-summary', db.currentDept])
      } catch (e) {
        showToast(e.response?.data?.detail || 'Failed to resolve flags.', 'error')
      }
      db.cancelFlag()
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-11 bg-white border-b border-slate-200 z-50">
      <div className="h-full px-4 flex items-center gap-2">

        {/* ── LOGO ── */}
        <div className="flex items-center gap-1.5 shrink-0 mr-1">
          <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold leading-none">OA</span>
          </div>
          <span className="text-sm font-bold text-slate-900 whitespace-nowrap">Ojas Aviation</span>
        </div>

        {/* ── DEPARTMENT SELECTOR ── */}
        <DeptSelector />

        {/* ── ACTION BUTTONS (only on department dashboards) ── */}
        {isOnDeptDashboard && (
          <div className="flex items-center gap-1.5">

            {/* Edit Data */}
            {user?.can_edit_data && (
              <button
                onClick={() => navigate('/edit-data')}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg
                           px-2.5 py-1 text-xs font-semibold flex items-center gap-1
                           transition-colors shrink-0"
              >
                <FileSpreadsheet size={12} />
                Edit Data
              </button>
            )}

            {/* Add Flag */}
            {user?.can_flag && (
              db.flagMode === 'add' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDone}
                    className="bg-orange-500 text-white rounded-lg px-2.5 py-1
                               text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <CheckCircle size={12} /> Done
                  </button>
                  <button
                    onClick={db.cancelFlag}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5 shrink-0"
                  >
                    <X size={11} /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={db.startAddMode}
                  disabled={db.flagMode === 'resolve'}
                  className="border border-slate-200 text-slate-600 rounded-lg
                             px-2.5 py-1 text-xs font-medium flex items-center gap-1
                             hover:bg-slate-50 disabled:opacity-40 transition-colors shrink-0"
                >
                  <Flag size={12} /> Add Flag
                </button>
              )
            )}

            {/* Resolve Flag */}
            {user?.can_resolve_flag && (
              db.flagMode === 'resolve' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDone}
                    className="bg-green-500 text-white rounded-lg px-2.5 py-1
                               text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <CheckCircle size={12} /> Done
                  </button>
                  <button
                    onClick={db.cancelFlag}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-0.5 shrink-0"
                  >
                    <X size={11} /> Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={db.startResolveMode}
                  disabled={db.flagMode === 'add'}
                  className="border border-slate-200 text-slate-600 rounded-lg
                             px-2.5 py-1 text-xs font-medium flex items-center gap-1
                             hover:bg-slate-50 disabled:opacity-40 transition-colors shrink-0"
                >
                  <ShieldCheck size={12} /> Resolve Flag
                </button>
              )
            )}
          </div>
        )}

        {/* ── SPACER ── */}
        <div className="flex-1" />

        {/* ── RIGHT ICONS ── */}
        <div className="flex items-center gap-0.5">

          {/* Refresh icon */}
          {isOnDeptDashboard && (
            <button
              onClick={handleRefresh}
              title="Refresh data"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {db.isRefreshing
                ? <Loader2 size={14} className="animate-spin" />
                : <RotateCw size={14} />
              }
            </button>
          )}

          {/* Fullscreen icon */}
          {isOnDeptDashboard && (
            <button
              onClick={() => db.setIsFullscreen(f => !f)}
              title={db.isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                         hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {db.isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          {/* Notification bell */}
          <div className="relative">
            <button className="w-7 h-7 flex items-center justify-center rounded-lg
                               hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={14} />
            </button>
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white
                             rounded-full w-3.5 h-3.5 flex items-center justify-center
                             text-[9px] font-bold leading-none">
              0
            </span>
          </div>

          {/* Profile avatar */}
          <ProfileMenu />
        </div>

      </div>
    </header>
  )
}