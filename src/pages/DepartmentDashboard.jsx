import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FilterX, Minimize2 } from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import ChartCard from '../components/charts/ChartCard'
import StatusBarChart from '../components/charts/StatusBarChart'
import PriorityPieChart from '../components/charts/PriorityPieChart'
import FlowToNextDeptChart from '../components/charts/FlowToNextDeptChart'
import IncomingFlowChart from '../components/charts/IncomingFlowChart'
import IncomingFocusDashboard from '../components/dashboard/IncomingFocusDashboard'
import WorkOrderTable from '../components/table/WorkOrderTable'
import { useDeptData } from '../hooks/useDeptData'
import { useDeptFlags } from '../hooks/useDeptFlags'
import { useIncomingFlow } from '../hooks/useIncomingFlow'
import { useDashboard } from '../context/DashboardContext'
import { slugToDept } from '../utils/constants'
import { formatDeptHeading } from '../utils/formatters'
import {
  buildPriorityBreakdown,
  filterWorkOrders,
  toggleFilterValue,
} from '../utils/dashboardFilters'

const EMPTY_WORK_ORDERS = []
const EMPTY_FLAGS = []

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
  const flagsQuery = useDeptFlags(deptName)
  const incomingFlowQuery = useIncomingFlow(deptName)
  const [incomingPopup, setIncomingPopup] = useState({
    isOpen: false,
    sourceDepartment: null,
    initialPriority: null,
  })

  const rawWorkOrders = deptQuery.data?.data ?? EMPTY_WORK_ORDERS
  const incomingFlow = incomingFlowQuery.data
  const unfilteredRecordCount =
    deptQuery.data?.record_count ?? rawWorkOrders.length

  const activeFlagIds = useMemo(() => {
    const flags = flagsQuery.data ?? EMPTY_FLAGS

    return new Set(
      flags.map((flag) => String(flag.wo_id ?? '').trim()),
    )
  }, [flagsQuery.data])

  const workOrders = useMemo(() => {
    if (!flagsQuery.isSuccess) return rawWorkOrders

    return rawWorkOrders.map((row) => ({
      ...row,
      has_active_flag: activeFlagIds.has(
        String(row.wo_id ?? '').trim(),
      ),
    }))
  }, [activeFlagIds, flagsQuery.isSuccess, rawWorkOrders])

  const filteredWorkOrders = useMemo(
    () => filterWorkOrders(workOrders, db.dashboardFilters),
    [db.dashboardFilters, workOrders],
  )

  /*
   * Each chart ignores only its own dimension while respecting the other
   * active filters. This preserves the other available categories and makes
   * replacing a filter possible without first pressing Reset Filters.
   */
  const statusChartRows = useMemo(
    () => filterWorkOrders(workOrders, db.dashboardFilters, 'status'),
    [db.dashboardFilters, workOrders],
  )

  const priorityChartRows = useMemo(
    () => filterWorkOrders(workOrders, db.dashboardFilters, 'priority'),
    [db.dashboardFilters, workOrders],
  )

  const flowChartRows = useMemo(
    () => filterWorkOrders(workOrders, db.dashboardFilters, 'nextDept'),
    [db.dashboardFilters, workOrders],
  )

  const priorityBreakdown = useMemo(
    () => buildPriorityBreakdown(priorityChartRows),
    [priorityChartRows],
  )

  const flowingWorkOrders = useMemo(
    () =>
      filteredWorkOrders.reduce((total, workOrder) => {
        const nextDepartment = String(
          workOrder.next_dept ?? '',
        ).trim()
        return total + (nextDepartment ? 1 : 0)
      }, 0),
    [filteredWorkOrders],
  )

  const isLoading = deptQuery.isLoading
  const isError = deptQuery.isError

  useEffect(() => {
    db.setCurrentDept(deptName)
    db.resetDashboardFilters()
    setIncomingPopup({
      isOpen: false,
      sourceDepartment: null,
      initialPriority: null,
    })

    return () => {
      db.setCurrentDept(null)
      db.cancelFlag()
    }
    // Dashboard action functions are stable and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptName])

  useEffect(() => {
    db.setWorkOrders(workOrders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrders])

  const handleRowSelect = (woId) => {
    const normalizedWoId = String(woId ?? '').trim()
    const matchingWorkOrder = workOrders.find(
      (workOrder) =>
        String(workOrder.wo_id ?? '').trim() === normalizedWoId,
    )
    const canonicalWoId = matchingWorkOrder?.wo_id ?? woId

    if (db.flagMode === 'add') {
      if (db.preExistingIds.has(canonicalWoId)) return
      db.toggleWoId(canonicalWoId)
      return
    }

    if (db.flagMode === 'resolve') {
      if (!matchingWorkOrder?.has_active_flag) return
      db.toggleWoId(canonicalWoId)
    }
  }

  const setOneMainFilter = (key, value) => {
    db.setDashboardFilter(
      key,
      toggleFilterValue(db.dashboardFilters[key], value),
    )
  }

  const handleStatusSegmentClick = ({ category, priority }) => {
    const samePair =
      db.dashboardFilters.status === category &&
      db.dashboardFilters.priority === priority

    db.setDashboardFilterGroup({
      status: samePair ? null : category,
      priority: samePair ? null : priority,
    })
  }

  const handleFlowSegmentClick = ({ category, priority }) => {
    const samePair =
      db.dashboardFilters.nextDept === category &&
      db.dashboardFilters.priority === priority

    db.setDashboardFilterGroup({
      nextDept: samePair ? null : category,
      priority: samePair ? null : priority,
    })
  }

  const openIncomingPopup = (
    sourceDepartment,
    initialPriority = null,
  ) => {
    if (!sourceDepartment) return

    setIncomingPopup({
      isOpen: true,
      sourceDepartment,
      initialPriority,
    })
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
        <div className="shrink-0">
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            {formatDeptHeading(deptName)}
          </h1>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 3 }, (_, index) => (
              <ChartLoadingCard
                key={`primary-chart-loading-${index}`}
              />
            ))
          ) : (
            <>
              <ChartCard
                title="Status"
                subtitle="Work orders by status"
                metricValue={filteredWorkOrders.length}
                metricLabel="Filtered WOs"
                showPriorityLegend
              >
                <StatusBarChart
                  workOrders={statusChartRows}
                  activeStatus={db.dashboardFilters.status}
                  activePriority={db.dashboardFilters.priority}
                  onStatusClick={(status) =>
                    setOneMainFilter('status', status)
                  }
                  onSegmentClick={handleStatusSegmentClick}
                />
              </ChartCard>

              <ChartCard
                title="Priority"
                subtitle="Overall priority breakdown"
                metricValue={filteredWorkOrders.length}
                metricLabel="Filtered WOs"
              >
                <PriorityPieChart
                  priorityBreakdown={priorityBreakdown}
                  activePriority={db.dashboardFilters.priority}
                  onPriorityClick={(priority) =>
                    setOneMainFilter('priority', priority)
                  }
                />
              </ChartCard>

              <ChartCard
                title="Flow to Next Dept"
                subtitle="Next department by priority"
                metricValue={flowingWorkOrders}
                metricLabel="Flowing"
                showPriorityLegend
              >
                <FlowToNextDeptChart
                  data={flowChartRows}
                  activeDepartment={db.dashboardFilters.nextDept}
                  activePriority={db.dashboardFilters.priority}
                  onDepartmentClick={(department) =>
                    setOneMainFilter('nextDept', department)
                  }
                  onSegmentClick={handleFlowSegmentClick}
                />
              </ChartCard>
            </>
          )}

          {incomingFlowQuery.isLoading ? (
            <ChartLoadingCard />
          ) : (
            <ChartCard
              title="Incoming WOs"
              subtitle={`Incoming to ${deptName}`}
              metricValue={incomingFlow?.total_wos ?? 0}
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
                    onClick={() => incomingFlowQuery.refetch()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <IncomingFlowChart
                  rows={incomingFlow?.data ?? []}
                  activeSourceDepartment={
                    incomingPopup.isOpen
                      ? incomingPopup.sourceDepartment
                      : null
                  }
                  activePriority={
                    incomingPopup.isOpen
                      ? incomingPopup.initialPriority
                      : null
                  }
                  onSourceDepartmentClick={(sourceDepartment) =>
                    openIncomingPopup(sourceDepartment)
                  }
                  onSegmentClick={({ category, priority }) =>
                    openIncomingPopup(category, priority)
                  }
                />
              )}
            </ChartCard>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-bold text-slate-800">
              Work Orders
            </span>
            <span className="text-xs text-slate-400">
              {filteredWorkOrders.length}
              {db.hasActiveDashboardFilters
                ? ` of ${unfilteredRecordCount}`
                : ''}{' '}
              records
            </span>
          </div>

          <div
            className={`
              min-h-0 flex-1 px-3 pb-1
              ${
                db.isFullscreen && !incomingPopup.isOpen
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
                <ErrorState onRetry={() => deptQuery.refetch()} />
              </div>
            )}

            {!isLoading && !isError && workOrders.length === 0 && (
              <EmptyState />
            )}

            {!isLoading && !isError && workOrders.length > 0 && (
              <WorkOrderTable
                data={filteredWorkOrders}
                flagMode={db.flagMode}
                selectedWoIds={db.selectedWoIds}
                onRowSelect={handleRowSelect}
                searchText=""
                isFullscreen={
                  db.isFullscreen && !incomingPopup.isOpen
                }
                resetKey={JSON.stringify(db.dashboardFilters)}
              />
            )}
          </div>
        </div>

        <IncomingFocusDashboard
          isOpen={incomingPopup.isOpen}
          sourceDepartment={incomingPopup.sourceDepartment}
          targetDepartment={deptName}
          initialPriority={incomingPopup.initialPriority}
          workOrders={incomingFlow?.work_orders ?? []}
          onClose={() =>
            setIncomingPopup({
              isOpen: false,
              sourceDepartment: null,
              initialPriority: null,
            })
          }
        />

        {db.isFullscreen && !incomingPopup.isOpen && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
            {db.hasActiveDashboardFilters && (
              <button
                type="button"
                onClick={db.resetDashboardFilters}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-xl transition hover:bg-slate-50"
              >
                <FilterX size={17} />
                Reset Filters
              </button>
            )}

            <button
              type="button"
              onClick={db.exitFullscreen}
              title="Exit fullscreen (Esc)"
              aria-label="Exit fullscreen"
              className="rounded-full bg-slate-900/85 p-3 text-white shadow-xl transition hover:scale-105 hover:bg-slate-950"
            >
              <Minimize2 size={18} />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
