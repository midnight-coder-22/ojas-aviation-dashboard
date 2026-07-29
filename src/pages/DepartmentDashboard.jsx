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
import IncomingFlowChart from '../components/charts/IncomingFlowChart'

import WorkOrderTable from '../components/table/WorkOrderTable'

import { useDeptData } from '../hooks/useDeptData'
import { useDeptFlags } from '../hooks/useDeptFlags'
import { useSummary } from '../hooks/useSummary'
import { useIncomingFlow } from '../hooks/useIncomingFlow'

import { useDashboard } from '../context/DashboardContext'

import { slugToDept, CHART_COLORS, } from '../utils/constants'
import { formatDeptHeading } from '../utils/formatters'

const EMPTY_WORK_ORDERS = []

const CHART_CARD_CLASS = `
  flex h-[290px] min-w-0 flex-col overflow-hidden
  rounded-xl border border-slate-200 bg-white
  p-3 shadow-sm
`

const PRIORITY_LEGEND = [
  {
    label: 'Low',
    color:
      CHART_COLORS.priority.Low,
  },
  {
    label: 'Medium',
    color:
      CHART_COLORS.priority.Medium,
  },
  {
    label: 'High',
    color:
      CHART_COLORS.priority.High,
  },
] 


export default function DepartmentDashboard() {
  const { dept } = useParams()
  const deptName = slugToDept(dept)

  const db = useDashboard()

  const deptQuery = useDeptData(deptName)
  const summaryQuery = useSummary(deptName)
  const flagsQuery = useDeptFlags(deptName)
  const incomingFlowQuery = useIncomingFlow(deptName)

  const rawWorkOrders = deptQuery.data?.data ?? EMPTY_WORK_ORDERS
  const summary = summaryQuery.data
  const incomingFlow = incomingFlowQuery.data
  const recordCount = deptQuery.data?.record_count ?? 0
  const totalWorkOrders = summary?.total_wos ?? recordCount

  /*
   * Build a lookup containing every WO that currently has an active flag.
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
      /* Existing flags cannot be deselected while adding flags. */
      if (db.preExistingIds.has(woId)) {
        return
      }

      db.toggleWoId(woId)
      return
    }

    if (db.flagMode === 'resolve') {
      /* Only rows with active flags can be selected for resolution. */
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
          relative flex h-full min-h-0 w-full flex-col gap-2
          bg-[#f7f8fa] px-5
          ${db.isFullscreen ? 'py-3' : 'pb-2 pt-2'}
        `}
      >
        {/* Department heading */}
        <div className="shrink-0">
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            {formatDeptHeading(deptName)}
          </h1>
        </div>

        {/*
         * All four visuals live in this single grid.
         *
         * At desktop width they render in one row:
         * Status | Priority | Flow to Next Dept | Incoming WOs
         */}
        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            [...Array(3)].map((_, index) => (
              <div
                key={`chart-loading-${index}`}
                className="h-[290px] animate-pulse rounded-xl bg-slate-200"
              />
            ))
          ) : (
            <>
              {/* Status */}
              {/* Status */}
<div className={CHART_CARD_CLASS}>
  <div className="mb-1.5 flex shrink-0 items-start justify-between gap-2">
    <div className="min-w-0">
      <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
        Chart
      </p>

      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-semibold text-slate-800">
          Status
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {PRIORITY_LEGEND.map(
            (item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500"
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{
                    backgroundColor:
                      item.color,
                  }}
                />

                {item.label}
              </span>
            ),
          )}
        </div>
      </div>
    </div>

    <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
      <p className="text-lg font-bold leading-none text-slate-900">
        {totalWorkOrders}
      </p>

      <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
        Total WOs
      </p>
    </div>
  </div>

  <div className="min-h-0 flex-1">
    <StatusBarChart
      workOrders={workOrders}
    />
  </div>
</div>



              {/* Priority */}
              <div className={CHART_CARD_CLASS}>                
                <div className="shrink-0">
                  <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                    Chart
                  </p>

                  <p className="mb-1.5 mt-0.5 text-sm font-semibold text-slate-800">
                    Priority
                  </p>
                </div>

                <div className="min-h-0 flex-1">
                  <PriorityPieChart
                    priorityBreakdown={
                      summary?.priority_breakdown ?? {}
                    }
                  />
                </div>
              </div>

              {/* Flow to next department */}
              <div className={CHART_CARD_CLASS}>
                <div className="shrink-0">
                  <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                    Chart
                  </p>

                  <p className="mb-3 mt-0.5 text-sm font-semibold text-slate-800">
                    Flow to Next Dept
                  </p>
                </div>

                <div className="min-h-0 flex-1">
                  <FlowToNextDeptChart data={workOrders} />
                </div>
              </div>
            </>
          )}

          {/* Incoming flow */}
          <div className="flex h-[330px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase leading-none tracking-wider text-slate-400">
                  Chart
                </p>

                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  Incoming WOs
                </p>

                <p className="mt-1 truncate text-[10px] text-slate-400">
                  Incoming to {deptName}
                </p>
              </div>

              <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-center">
                <p className="text-lg font-bold leading-none text-slate-900">
                  {incomingFlow?.total_wos ?? 0}
                </p>

                <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
                  Incoming
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {incomingFlowQuery.isLoading ? (
                <div className="h-full animate-pulse rounded-lg bg-slate-100" />
              ) : incomingFlowQuery.isError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-sm text-slate-500">
                    Incoming-flow data could not be loaded.
                  </p>

                  <button
                    type="button"
                    onClick={() => incomingFlowQuery.refetch()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <IncomingFlowChart
                  rows={incomingFlow?.data ?? []}
                />
              )}
            </div>
          </div>
        </div>

        {/* Work-order table */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-2">
              <span className="text-sm font-bold text-slate-800">
              Work Orders
            </span>

            <span className="text-xs text-slate-400">
              {recordCount} records
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-3 pb-1">
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