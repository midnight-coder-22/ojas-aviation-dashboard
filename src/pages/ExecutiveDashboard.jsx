import { useState }           from 'react'
import { useNavigate }        from 'react-router-dom'
import { useQueryClient }     from '@tanstack/react-query'
import {
  BarChart3, ShieldAlert, AlertTriangle, Flag,
  RotateCw, Loader2, Maximize2, Minimize2,
} from 'lucide-react'

import AppLayout       from '../components/layout/AppLayout'
import KPICard         from '../components/ui/KPICard'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import ErrorState      from '../components/ui/ErrorState'
import CrossDeptChart  from '../components/charts/CrossDeptChart'
import { useAllSummary } from '../hooks/useAllSummary'
import { useAuth }       from '../context/AuthContext'
import { useFullscreen } from '../hooks/useFullscreen'
import { deptToSlug }    from '../utils/constants'

export default function ExecutiveDashboard() {
  const { data: allSummaries = [], isLoading, isError, refetch, isFetching } = useAllSummary()
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen()
  const [activeTab, setActiveTab] = useState('qc')

  // Redirect departmental users
  if (user && user.role === 'Departmental') {
    navigate('/dashboard/' + deptToSlug(user.department || 'cnc'), { replace: true })
    return null
  }

  const totals = allSummaries.reduce((acc, s) => ({
    wos:     acc.wos     + s.total_wos,
    qc:      acc.qc      + s.qc_alert_count,
    mi:      acc.mi      + s.mi_alert_count,
    flagged: acc.flagged + s.flagged_count,
  }), { wos: 0, qc: 0, mi: 0, flagged: 0 })

  const handleRefresh = () => queryClient.invalidateQueries(['all-summary'])

  return (
    <AppLayout>

      {/* ---- HEADER ---- */}
      {!isFullscreen && (
        <div className="flex justify-between items-start pt-8 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Cross-department operational overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={enterFullscreen}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 flex items-center gap-1.5 hover:bg-slate-50">
              <Maximize2 size={14} /> Fullscreen
            </button>
            <button onClick={handleRefresh}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-600 flex items-center gap-1.5 hover:bg-slate-50">
              {isFetching
                ? <><Loader2 size={14} className="animate-spin" /> Refreshing...</>
                : <><RotateCw size={14} /> Refresh</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ---- KPI CARDS ---- */}
      <div className="mt-2">
        {isLoading
          ? <LoadingSkeleton type="cards" />
          : (
            <div className="grid grid-cols-4 gap-6">
              <KPICard icon={BarChart3} iconBg="bg-orange-100" iconColor="text-orange-500"
                label="Total Work Orders" value={totals.wos} accentColor="bg-orange-500" />
              <KPICard icon={ShieldAlert} iconBg="bg-amber-100" iconColor="text-amber-500"
                label="Total QC Alerts" value={totals.qc}
                valueColor={totals.qc > 0 ? 'text-amber-500' : undefined}
                accentColor="bg-amber-500" />
              <KPICard icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-500"
                label="Total MI Alerts" value={totals.mi}
                valueColor={totals.mi > 0 ? 'text-red-500' : undefined}
                accentColor="bg-red-500" />
              <KPICard icon={Flag} iconBg="bg-orange-100" iconColor="text-orange-500"
                label="Active Flags" value={totals.flagged} accentColor="bg-orange-500" />
            </div>
          )
        }
      </div>

      {/* ---- DEPARTMENT CARDS ---- */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Departments</p>
        {isLoading
          ? <LoadingSkeleton type="grid" />
          : (
            <div className="grid grid-cols-3 gap-6">
              {allSummaries.map(s => {
                const total = s.total_wos
                const isEmpty = total === 0
                return (
                  <div
                    key={s.department}
                    onClick={() => navigate('/dashboard/' + deptToSlug(s.department))}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6
                               cursor-pointer hover:border-orange-300 hover:shadow-md transition-all
                               ${isEmpty ? 'opacity-50' : ''}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {s.department}
                    </p>
                    {isEmpty
                      ? <p className="text-sm text-slate-400 mt-2">No active work orders</p>
                      : <p className="text-4xl font-bold text-slate-900 mt-2">{total}</p>
                    }
                    <p className="text-xs text-slate-400 mt-0.5">work orders</p>

                    {/* Alert pills */}
                    <div className="flex gap-2 mt-4">
                      <span className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1
                        ${s.qc_alert_count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        <ShieldAlert size={10} /> {s.qc_alert_count}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1
                        ${s.mi_alert_count > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertTriangle size={10} /> {s.mi_alert_count}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1
                        ${s.flagged_count > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        <Flag size={10} /> {s.flagged_count}
                      </span>
                    </div>

                    {/* Status mini bar */}
                    {total > 0 && (
                      <div className="mt-4">
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                          <div className="bg-blue-400 h-full" style={{ width: `${((s.status_breakdown?.New ?? 0) / total) * 100}%` }} />
                          <div className="bg-orange-400 h-full" style={{ width: `${((s.status_breakdown?.InProcess ?? 0) / total) * 100}%` }} />
                          <div className="bg-green-400 h-full" style={{ width: `${((s.status_breakdown?.Completed ?? 0) / total) * 100}%` }} />
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                          <span>New: {s.status_breakdown?.New ?? 0}</span>
                          <span>In Process: {s.status_breakdown?.InProcess ?? 0}</span>
                          <span>Completed: {s.status_breakdown?.Completed ?? 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* ---- CROSS-DEPT CHART ---- */}
      {!isLoading && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Chart</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5 mb-4">Department Comparison</p>
          <CrossDeptChart summaries={allSummaries} />
        </div>
      )}

      {/* ---- ALERTS TABLE (tabbed) ---- */}
      {!isLoading && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-200 mb-4">
            {[
              { key: 'qc', label: 'QC Alerts' },
              { key: 'mi', label: 'MI Alerts' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-sm font-medium pb-3 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="py-2 text-left">Department</th>
                <th className="py-2 text-left">Alert Count</th>
                <th className="py-2 text-left">% of WOs</th>
              </tr>
            </thead>
            <tbody>
              {allSummaries
                .filter(s => activeTab === 'qc' ? s.qc_alert_count > 0 : s.mi_alert_count > 0)
                .map(s => {
                  const count = activeTab === 'qc' ? s.qc_alert_count : s.mi_alert_count
                  const pct   = s.total_wos > 0 ? ((count / s.total_wos) * 100).toFixed(0) : 0
                  return (
                    <tr key={s.department} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-700">{s.department}</td>
                      <td className="py-3 text-slate-600">{count}</td>
                      <td className="py-3 text-slate-500">{pct}%</td>
                    </tr>
                  )
                })
              }
              {allSummaries.every(s => activeTab === 'qc' ? s.qc_alert_count === 0 : s.mi_alert_count === 0) && (
                <tr><td colSpan={3} className="py-6 text-center text-sm text-slate-400">
                  No {activeTab === 'qc' ? 'QC' : 'MI'} alerts across any department
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isError && <ErrorState onRetry={refetch} />}

      {/* Fullscreen restore */}
      {isFullscreen && (
        <button onClick={exitFullscreen}
          className="fixed bottom-6 right-6 z-50 bg-slate-900/70 text-white rounded-full p-3 shadow-lg hover:bg-slate-900">
          <Minimize2 size={20} />
        </button>
      )}

    </AppLayout>
  )
}