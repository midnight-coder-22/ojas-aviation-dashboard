import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Minimize2 } from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'

import StatusBarChart from '../components/charts/StatusBarChart'
import PriorityPieChart from '../components/charts/PriorityPieChart'
import FlowToNextDeptChart from '../components/charts/FlowToNextDeptChart'

import WorkOrderTable from '../components/table/WorkOrderTable'

import { useDeptData } from '../hooks/useDeptData'
import { useDeptFlags } from '../hooks/useDeptFlags'
import { useSummary } from '../hooks/useSummary'

import { useDashboard } from '../context/DashboardContext'

import { slugToDept } from '../utils/constants'
import { formatDeptHeading } from '../utils/formatters'

export default function DepartmentDashboard() {
  const { dept } = useParams()
  const deptName = slugToDept(dept)

  const db = useDashboard()

  const deptQuery = useDeptData(deptName)
  const summaryQuery = useSummary(deptName)
  const flagsQuery = useDeptFlags(deptName)

  const rawWorkOrders = deptQuery.data?.data ?? []
  const summary = summaryQuery.data
  const recordCount = deptQuery.data?.record_count ?? 0

  /*
   * Build a lookup containing every WO that currently has an active flag.
   *
   * GET /api/flags/{department} only returns active flags.
   */
  const activeFlagIds = useMemo(() => {
    const flags = flagsQuery.data ?? []

    return new Set(
      flags.map((flag) => String(flag.wo_id).trim()),
    )
  }, [flagsQuery.data])

  /*
   * Once the dedicated flags API succeeds, use it as the live source of
   * truth for has_active_flag.
   *
   * Until it succeeds, use the value supplied by the department API.
   */
  const workOrders = useMemo(() => {
    if (!flagsQuery.isSuccess) {
      return rawWorkOrders
    }

    return rawWorkOrders.map((row) => ({
      ...row,
      has_active_flag: activeFlagIds.has(
        String(row.wo_id).trim(),
      ),
    }))
  }, [
    rawWorkOrders,
    activeFlagIds,
    flagsQuery.isSuccess,
  ])

  const isLoading =
    deptQuery.isLoading || summaryQuery.isLoading

  const isError = deptQuery.isError

  /*
   * Tell DashboardContext which department is currently open.
   */
  useEffect(() => {
    db.setCurrentDept(deptName)

    return () => {
      db.setCurrentDept(null)
      db.cancelFlag()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptName])

  /*
   * Keep the merged work-order data in context.
   *
   * TopNav uses this for:
   * - notification count
   * - Add Flag mode
   * - Resolve Flag mode
   */
  useEffect(() => {
    db.setWorkOrders(workOrders)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrders])

  const handleRowSelect = (woId) => {
    if (db.flagMode === 'add') {
      /*
       * Existing flags cannot be deselected while adding flags.
       */
      if (db.preExistingIds.has(woId)) {
        return
      }

      db.toggleWoId(woId)
      return
    }

    if (db.flagMode === 'resolve') {
      /*
       * Only rows with active flags can be selected for resolution.
       */
      const row = workOrders.find(
        (workOrder) => workOrder.wo_id === woId,
      )

      if (!row?.has_active_flag) {
        return
      }

      db.toggleWoId(woId)
    }
  }

  return (
    <AppLayout>
      <div
        id="department-dashboard-fullscreen"
        className={`
          relative flex h-full min-h-0 w-full flex-col gap-3
          bg-[#f7f8fa] px-5
          ${db.isFullscreen ? 'py-4' : 'pb-3 pt-3'}
        `}
      >
        {/* Department heading */}
        {!db.isFullscreen && (
          <div className="shrink-0">
            <h1 className="text-xl font-bold leading-tight text-slate-900">
              {formatDeptHeading(deptName)}
            </h1>
          </div>
        )}

        {/*
         * Three charts.
         *
         * These are deliberately NOT hidden in fullscreen mode.
         */}
        <div className="grid shrink-0 grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-xl bg-slate-200"
              />
            ))
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                  Chart
                </p>

                <p className="mb-3 mt-0.5 text-sm font-semibold text-slate-800">
                  Status
                </p>

                <StatusBarChart workOrders={workOrders} />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                  Chart
                </p>

                <p className="mb-3 mt-0.5 text-sm font-semibold text-slate-800">
                  Priority
                </p>

                <PriorityPieChart
                  priorityBreakdown={
                    summary?.priority_breakdown ?? {}
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                  Chart
                </p>

                <p className="mb-3 mt-0.5 text-sm font-semibold text-slate-800">
                  Flow to Next Dept
                </p>

                <FlowToNextDeptChart data={workOrders} />
              </div>
            </>
          )}
        </div>

        {/* Work-order table */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 pb-2 pt-3">
            <span className="text-sm font-bold text-slate-800">
              Work Orders
            </span>

            <span className="text-xs text-slate-400">
              {recordCount} records
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-4 pb-2">
            {isLoading && (
              <div className="pt-4">
                <LoadingSkeleton type="table" />
              </div>
            )}

            {isError && (
              <div className="pt-4">
                <ErrorState
                  onRetry={() => deptQuery.refetch()}
                />
              </div>
            )}

            {!isLoading &&
              !isError &&
              workOrders.length === 0 && <EmptyState />}

            {!isLoading &&
              !isError &&
              workOrders.length > 0 && (
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

        {/*
         * TopNav is outside the fullscreen element, so it disappears when
         * fullscreen starts. This button remains inside the fullscreen
         * element and allows the user to exit.
         */}
        {db.isFullscreen && (
          <button
            type="button"
            onClick={db.exitFullscreen}
            title="Exit fullscreen (Esc)"
            aria-label="Exit fullscreen"
            className="
              fixed bottom-5 right-5 z-50
              rounded-full bg-slate-900/85 p-3 text-white
              shadow-xl transition-all
              hover:scale-105 hover:bg-slate-950
            "
          >
            <Minimize2 size={18} />
          </button>
        )}
      </div>
    </AppLayout>
  )
}