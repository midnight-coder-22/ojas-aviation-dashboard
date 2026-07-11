import { useEffect }      from 'react'
import { useParams }      from 'react-router-dom'
import { Minimize2 }      from 'lucide-react'

import AppLayout           from '../components/layout/AppLayout'
import LoadingSkeleton     from '../components/ui/LoadingSkeleton'
import EmptyState          from '../components/ui/EmptyState'
import ErrorState          from '../components/ui/ErrorState'
import StatusBarChart      from '../components/charts/StatusBarChart'
import PriorityPieChart    from '../components/charts/PriorityPieChart'
import FlowToNextDeptChart from '../components/charts/FlowToNextDeptChart'
import WorkOrderTable      from '../components/table/WorkOrderTable'

import { useDeptData }       from '../hooks/useDeptData'
import { useSummary }        from '../hooks/useSummary'
import { useDashboard }      from '../context/DashboardContext'
import { slugToDept }        from '../utils/constants'
import { formatDeptHeading } from '../utils/formatters'

export default function DepartmentDashboard() {
  const { dept }   = useParams()
  const deptName   = slugToDept(dept)
  const db         = useDashboard()

  const deptQuery    = useDeptData(deptName)
  const summaryQuery = useSummary(deptName)

  const workOrders  = deptQuery.data?.data ?? []
  const summary     = summaryQuery.data
  const recordCount = deptQuery.data?.record_count ?? 0
  const isLoading   = deptQuery.isLoading || summaryQuery.isLoading
  const isError     = deptQuery.isError

  // Tell the context what department we're on
  useEffect(() => {
    db.setCurrentDept(deptName)
    return () => {
      // Cleanup when leaving this page
      db.setCurrentDept(null)
      db.cancelFlag()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptName])

  // Keep workOrders in context so TopNav can use them for flag logic
  useEffect(() => {
    db.setWorkOrders(workOrders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrders])

  // Row click handler — delegates to context with guards
  const handleRowSelect = (woId) => {
    if (db.flagMode === 'add') {
      // Pre-existing flagged rows cannot be deselected
      if (db.preExistingIds.has(woId)) return
      db.toggleWoId(woId)
    } else if (db.flagMode === 'resolve') {
      // Only flagged rows can be toggled in resolve mode
      const row = workOrders.find(r => r.wo_id === woId)
      if (!row?.has_active_flag) return
      db.toggleWoId(woId)
    }
    // Outside flag mode: row expansion is handled inside WorkOrderTable
  }

  return (
    <AppLayout>
      {/*
        Full-height flex column layout:
        - Heading: shrink-0 (minimal height)
        - Charts:  shrink-0 (fixed height)
        - Table:   flex-1   (fills all remaining space = ~2/3 of screen)
      */}
      <div className={`flex flex-col h-full px-5 gap-3 ${db.isFullscreen ? 'pt-0' : 'pt-3 pb-3'}`}>

        {/* ── HEADING (minimal whitespace) ── */}
        {!db.isFullscreen && (
          <div className="shrink-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {formatDeptHeading(deptName)}
            </h1>
          </div>
        )}

        {/* ── 3-COLUMN CHARTS (fixed height, shrink-0 so they don't grow) ── */}
        {!db.isFullscreen && (
          <div className="shrink-0 grid grid-cols-3 gap-4">
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="h-52 bg-slate-200 animate-pulse rounded-xl" />
                ))
              : (
                <>
                  {/* Status chart */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider leading-none">Chart</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 mb-3">Status</p>
                    <StatusBarChart statusBreakdown={summary?.status_breakdown ?? {}} />
                  </div>

                  {/* Priority chart */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider leading-none">Chart</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 mb-3">Priority</p>
                    <PriorityPieChart priorityBreakdown={summary?.priority_breakdown ?? {}} />
                  </div>

                  {/* Flow to Next Dept chart */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider leading-none">Chart</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 mb-3">Flow to Next Dept</p>
                    <FlowToNextDeptChart data={workOrders} />
                  </div>
                </>
              )
            }
          </div>
        )}

        {/* ── WORK ORDERS TABLE (flex-1 = fills all remaining space) ── */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

          {/* Table card header — no search box */}
          <div className="shrink-0 flex items-center gap-2 px-4 pt-3 pb-2 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">Work Orders</span>
            <span className="text-xs text-slate-400">{recordCount} records</span>
          </div>

          {/* Table body — scrollable */}
          <div className="flex-1 overflow-auto px-4 pb-2">
            {isLoading  && <div className="pt-4"><LoadingSkeleton type="table" /></div>}
            {isError    && <div className="pt-4"><ErrorState onRetry={() => deptQuery.refetch()} /></div>}
            {!isLoading && !isError && workOrders.length === 0 && <EmptyState />}
            {!isLoading && !isError && workOrders.length > 0 && (
              <WorkOrderTable
                data={workOrders}
                flagMode={db.flagMode}
                selectedWoIds={db.selectedWoIds}
                onRowSelect={handleRowSelect}
                searchText=""
              />
            )}
          </div>

        </div>

      </div>

      {/* Fullscreen restore button */}
      {db.isFullscreen && (
        <button
          onClick={() => db.setIsFullscreen(false)}
          title="Exit fullscreen (Esc)"
          className="fixed bottom-5 right-5 z-50 bg-slate-800/80 text-white
                     rounded-full p-2.5 shadow-lg hover:bg-slate-900 transition-all"
        >
          <Minimize2 size={16} />
        </button>
      )}
    </AppLayout>
  )
}