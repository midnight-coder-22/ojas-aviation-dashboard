import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Minimize2 } from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import ChartCard from '../components/charts/ChartCard'
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

import { slugToDept } from '../utils/constants'
import { formatDeptHeading } from '../utils/formatters'

/*
 * Stable fallback arrays prevent a new empty-array reference from being
 * created on every render. This keeps the useMemo dependency lists stable.
 */
const EMPTY_WORK_ORDERS = []
const EMPTY_FLAGS = []

/*
 * Build a usable priority breakdown even while the summary API is loading or
 * when it temporarily fails. The summary response remains the preferred source.
 */
function buildPriorityBreakdown(workOrders) {
  return workOrders.reduce(
    (breakdown, workOrder) => {
      const normalizedPriority = String(
        workOrder.priority ?? 'Low',
      )
        .trim()
        .toLowerCase()

      if (normalizedPriority === 'high') {
        breakdown.High += 1
      } else if (normalizedPriority === 'medium') {
        breakdown.Medium += 1
      } else {
        breakdown.Low += 1
      }

      return breakdown
    },
    {
      Low: 0,
      Medium: 0,
      High: 0,
    },
  )
}

/*
 * Standard loading card matching the final height and shape of ChartCard.
 */
function ChartLoadingCard() {
  return (
    <div className="h-[290px] animate-pulse rounded-xl border border-slate-200 bg-slate-200" />
  )
}

export default function DepartmentDashboard() {
  const { dept } = useParams()
  const deptName = slugToDept(dept)

  const db = useDashboard()
  const deptQuery = useDeptData(deptName)
  const summaryQuery = useSummary(deptName)
  const flagsQuery = useDeptFlags(deptName)
  const incomingFlowQuery = useIncomingFlow(deptName)

  const rawWorkOrders =
    deptQuery.data?.data ?? EMPTY_WORK_ORDERS

  const summary = summaryQuery.data
  const incomingFlow = incomingFlowQuery.data

  const recordCount =
    deptQuery.data?.record_count ?? rawWorkOrders.length

  const totalWorkOrders =
    summary?.total_wos ?? recordCount

  /*
   * Build a lookup containing every WO that currently has an active flag.
   * GET /api/flags/{department} returns the active flag records.
   */
  const activeFlagIds = useMemo(() => {
    const flags = flagsQuery.data ?? EMPTY_FLAGS

    return new Set(
      flags.map((flag) =>
        String(flag.wo_id ?? '').trim(),
      ),
    )
  }, [flagsQuery.data])

  /*
   * Once the dedicated flags API succeeds, it becomes the live source of
   * truth for has_active_flag.
   *
   * Until then, preserve the value supplied by the department dashboard API.
   */
  const workOrders = useMemo(() => {
    if (!flagsQuery.isSuccess) {
      return rawWorkOrders
    }

    return rawWorkOrders.map((row) => ({
      ...row,
      has_active_flag: activeFlagIds.has(
        String(row.wo_id ?? '').trim(),
      ),
    }))
  }, [
    rawWorkOrders,
    activeFlagIds,
    flagsQuery.isSuccess,
  ])

  /*
   * The summary API is preferred, but this local fallback keeps the Priority
   * visual usable if the summary request is still loading or fails.
   */
  const fallbackPriorityBreakdown = useMemo(
    () => buildPriorityBreakdown(workOrders),
    [workOrders],
  )

  const priorityBreakdown =
    summary?.priority_breakdown ??
    fallbackPriorityBreakdown

  /*
   * Count only work orders that actually have a next department.
   * This value appears in the Flow to Next Dept metric card.
   */
  const flowingWorkOrders = useMemo(
    () =>
      workOrders.reduce(
        (total, workOrder) => {
          const nextDepartment = String(
            workOrder.next_dept ?? '',
          ).trim()

          return total + (nextDepartment ? 1 : 0)
        },
        0,
      ),
    [workOrders],
  )

  /*
   * Department data controls the table, Status chart, and Flow chart.
   * Summary and Incoming WOs are allowed to load independently.
   */
  const isLoading = deptQuery.isLoading
  const isError = deptQuery.isError

  /*
   * Tell DashboardContext which department is currently open.
   *
   * cancelFlag clears unfinished flag-selection state when the user leaves
   * the department dashboard.
   */
  useEffect(() => {
    db.setCurrentDept(deptName)

    return () => {
      db.setCurrentDept(null)
      db.cancelFlag()
    }

    /*
     * DashboardContext action functions are intentionally excluded.
     * Including the complete db object would cause this effect to run whenever
     * the provider value receives a new object reference.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptName])

  /*
   * Keep the merged work-order rows in DashboardContext.
   *
   * TopNav uses these rows for:
   * - notification counts
   * - Add Flag mode
   * - Resolve Flag mode
   */
  useEffect(() => {
    db.setWorkOrders(workOrders)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrders])

  const handleRowSelect = (woId) => {
    const normalizedWoId = String(
      woId ?? '',
    ).trim()

    const matchingWorkOrder = workOrders.find(
      (workOrder) =>
        String(
          workOrder.wo_id ?? '',
        ).trim() === normalizedWoId,
    )

    /*
     * Prefer the ID stored on the matching row so it remains consistent with
     * the IDs already placed in DashboardContext.
     */
    const canonicalWoId =
      matchingWorkOrder?.wo_id ?? woId

    if (db.flagMode === 'add') {
      /*
       * Existing active flags are locked while the user adds new flags.
       */
      if (
        db.preExistingIds.has(
          canonicalWoId,
        )
      ) {
        return
      }

      db.toggleWoId(canonicalWoId)
      return
    }

    if (db.flagMode === 'resolve') {
      /*
       * Only rows with active flags may be selected for resolution.
       */
      if (
        !matchingWorkOrder?.has_active_flag
      ) {
        return
      }

      db.toggleWoId(canonicalWoId)
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
        {/*
         * Keep the department heading visible in normal and fullscreen views.
         */}
        <div className="shrink-0">
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            {formatDeptHeading(deptName)}
          </h1>
        </div>

        {/*
         * Standardized chart grid:
         *
         * Status | Priority | Flow to Next Dept | Incoming WOs
         *
         * This grid stays visible and unchanged in fullscreen mode. Only the
         * work-order table below receives fullscreen auto-scroll behavior.
         */}
        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from(
              { length: 3 },
              (_, index) => (
                <ChartLoadingCard
                  key={`primary-chart-loading-${index}`}
                />
              ),
            )
          ) : (
            <>
              {/* Status */}
              <ChartCard
                title="Status"
                subtitle="Work orders by status"
                metricValue={totalWorkOrders}
                metricLabel="Total WOs"
                showPriorityLegend
              >
                <StatusBarChart
                  workOrders={workOrders}
                />
              </ChartCard>

              {/* Priority */}
              <ChartCard
                title="Priority"
                subtitle="Overall priority breakdown"
                metricValue={totalWorkOrders}
                metricLabel="Total WOs"
              >
                <PriorityPieChart
                  priorityBreakdown={
                    priorityBreakdown
                  }
                />
              </ChartCard>

              {/* Flow to next department */}
              <ChartCard
                title="Flow to Next Dept"
                subtitle="Next department by priority"
                metricValue={
                  flowingWorkOrders
                }
                metricLabel="Flowing"
                showPriorityLegend
              >
                <FlowToNextDeptChart
                  data={workOrders}
                />
              </ChartCard>
            </>
          )}

          {/* Incoming work orders load independently from department data. */}
          {incomingFlowQuery.isLoading ? (
            <ChartLoadingCard />
          ) : (
            <ChartCard
              title="Incoming WOs"
              subtitle={`Incoming to ${deptName}`}
              metricValue={
                incomingFlow?.total_wos ?? 0
              }
              metricLabel="Incoming"
              showPriorityLegend
            >
              {incomingFlowQuery.isError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <p className="text-sm text-slate-500">
                    Incoming-flow data could not be loaded.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      incomingFlowQuery.refetch()
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <IncomingFlowChart
                  rows={
                    incomingFlow?.data ?? []
                  }
                />
              )}
            </ChartCard>
          )}
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

          <div
            className={`
              min-h-0 flex-1 px-3 pb-1
              ${
                db.isFullscreen
                  ? 'flex flex-col overflow-hidden'
                  : 'overflow-auto'
              }
            `}
          >
            {isLoading && (
              <div className="pt-4">
                <LoadingSkeleton type="table" />
              </div>
            )}

            {isError && (
              <div className="pt-4">
                <ErrorState
                  onRetry={() =>
                    deptQuery.refetch()
                  }
                />
              </div>
            )}

            {!isLoading &&
              !isError &&
              workOrders.length === 0 && (
                <EmptyState />
              )}

            {!isLoading &&
              !isError &&
              workOrders.length > 0 && (
                <WorkOrderTable
                  data={workOrders}
                  flagMode={db.flagMode}
                  selectedWoIds={
                    db.selectedWoIds
                  }
                  onRowSelect={
                    handleRowSelect
                  }
                  searchText=""
                  isFullscreen={
                    db.isFullscreen
                  }
                />
              )}
          </div>
        </div>

        {/*
         * TopNav is outside the fullscreen target. This button is inside the
         * target so it remains available when the dashboard enters fullscreen.
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