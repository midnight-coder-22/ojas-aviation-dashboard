import { useEffect, useMemo, useState } from 'react'
import {
  FilterX,
  Maximize2,
  Minimize2,
  Search,
  X,
} from 'lucide-react'

import ChartCard from '../charts/ChartCard'
import StatusBarChart from '../charts/StatusBarChart'
import PriorityPieChart from '../charts/PriorityPieChart'
import AgeingBarChart from '../charts/AgeingBarChart'
import TargetHealthBarChart from '../charts/TargetHealthBarChart'
import WorkOrderTable from '../table/WorkOrderTable'
import { useDashboard } from '../../context/DashboardContext'
import {
  buildPriorityBreakdown,
  filterIncomingPopupRows,
  normalizeDepartment,
  toggleFilterValue,
} from '../../utils/dashboardFilters'

const EMPTY_POPUP_FILTERS = {
  status: null,
  priority: null,
  ageingBand: null,
  targetHealth: null,
}

function FilterChip({ children }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  )
}

export default function IncomingFocusDashboard({
  isOpen,
  sourceDepartment,
  targetDepartment,
  initialPriority = null,
  workOrders = [],
  onClose,
}) {
  const db = useDashboard()
  const [filters, setFilters] = useState({
    ...EMPTY_POPUP_FILTERS,
  })
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setFilters({
      ...EMPTY_POPUP_FILTERS,
      priority: initialPriority || null,
    })
    setSearchText('')
  }, [initialPriority, isOpen, sourceDepartment, targetDepartment])

  const sourceRows = useMemo(() => {
    const normalizedSource = normalizeDepartment(sourceDepartment)
    const normalizedTarget = normalizeDepartment(targetDepartment)

    return (Array.isArray(workOrders) ? workOrders : []).filter(
      (row) =>
        normalizeDepartment(row?.source_department) ===
          normalizedSource &&
        normalizeDepartment(row?.next_dept) === normalizedTarget,
    )
  }, [sourceDepartment, targetDepartment, workOrders])

  const tableRows = useMemo(
    () =>
      filterIncomingPopupRows(
        sourceRows,
        filters,
        null,
        searchText,
      ),
    [filters, searchText, sourceRows],
  )

  const statusRows = useMemo(
    () =>
      filterIncomingPopupRows(
        sourceRows,
        filters,
        'status',
        searchText,
      ),
    [filters, searchText, sourceRows],
  )

  const priorityRows = useMemo(
    () =>
      filterIncomingPopupRows(
        sourceRows,
        filters,
        'priority',
        searchText,
      ),
    [filters, searchText, sourceRows],
  )

  const ageingRows = useMemo(
    () =>
      filterIncomingPopupRows(
        sourceRows,
        filters,
        'ageingBand',
        searchText,
      ),
    [filters, searchText, sourceRows],
  )

  const targetHealthRows = useMemo(
    () =>
      filterIncomingPopupRows(
        sourceRows,
        filters,
        'targetHealth',
        searchText,
      ),
    [filters, searchText, sourceRows],
  )

  const priorityBreakdown = useMemo(
    () => buildPriorityBreakdown(priorityRows),
    [priorityRows],
  )

  const hasRefinements =
    Boolean(searchText.trim()) || Object.values(filters).some(Boolean)

  const resetFilters = () => {
    setFilters({ ...EMPTY_POPUP_FILTERS })
    setSearchText('')
  }

  const setOneFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: toggleFilterValue(current[key], value),
    }))
  }

  const setStatusAndPriority = ({ category, priority }) => {
    setFilters((current) => {
      const isSamePair =
        current.status === category &&
        current.priority === priority

      return {
        ...current,
        status: isSamePair ? null : category,
        priority: isSamePair ? null : priority,
      }
    })
  }

  const activeFilterLabels = [
    filters.status && `Status: ${filters.status}`,
    filters.priority && `Priority: ${filters.priority}`,
    filters.ageingBand && `Ageing: ${filters.ageingBand} days`,
    filters.targetHealth && `Target: ${filters.targetHealth}`,
    searchText.trim() && `Search: ${searchText.trim()}`,
  ].filter(Boolean)

  if (!isOpen) return null

  const title = `Showing ${tableRows.length} work order${
    tableRows.length === 1 ? '' : 's'
  } incoming from ${sourceDepartment} to ${targetDepartment}`

  return (
    <div className="absolute inset-0 z-40 flex bg-slate-950/45 p-2 backdrop-blur-[2px] sm:p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Incoming work orders dashboard"
        className="flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#f7f8fa] shadow-2xl"
      >
        <header className="flex shrink-0 items-start gap-4 border-b border-slate-200 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">
              {title}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <FilterChip>Source: {sourceDepartment}</FilterChip>
              <FilterChip>Next Dept: {targetDepartment}</FilterChip>
              {activeFilterLabels.map((label) => (
                <FilterChip key={label}>{label}</FilterChip>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasRefinements && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FilterX size={15} />
                Reset Filters
              </button>
            )}

            <button
              type="button"
              onClick={db.toggleFullscreen}
              title={db.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={
                db.isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {db.isFullscreen ? (
                <Minimize2 size={17} />
              ) : (
                <Maximize2 size={17} />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close incoming dashboard"
              aria-label="Close incoming dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="grid shrink-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
          <ChartCard
            title="Status"
            subtitle="Incoming work orders by status"
            metricValue={tableRows.length}
            metricLabel="Filtered WOs"
            showPriorityLegend
          >
            <StatusBarChart
              workOrders={statusRows}
              activeStatus={filters.status}
              activePriority={filters.priority}
              onStatusClick={(status) =>
                setOneFilter('status', status)
              }
              onSegmentClick={setStatusAndPriority}
            />
          </ChartCard>

          <ChartCard
            title="Priority"
            subtitle="Priority breakdown"
            metricValue={tableRows.length}
            metricLabel="Filtered WOs"
          >
            <PriorityPieChart
              priorityBreakdown={priorityBreakdown}
              activePriority={filters.priority}
              onPriorityClick={(priority) =>
                setOneFilter('priority', priority)
              }
            />
          </ChartCard>

          <ChartCard
            title="Ageing"
            subtitle="Days in the source department"
            metricValue={tableRows.length}
            metricLabel="Filtered WOs"
          >
            <AgeingBarChart
              workOrders={ageingRows}
              activeBand={filters.ageingBand}
              onBandClick={(band) =>
                setOneFilter('ageingBand', band)
              }
            />
          </ChartCard>

          <ChartCard
            title="Target Date Health"
            subtitle="Deadline condition"
            metricValue={tableRows.length}
            metricLabel="Filtered WOs"
          >
            <TargetHealthBarChart
              workOrders={targetHealthRows}
              activeHealth={filters.targetHealth}
              onHealthClick={(health) =>
                setOneFilter('targetHealth', health)
              }
            />
          </ChartCard>
        </div>

        <div className="mx-3 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                Work Orders
              </span>
              <span className="text-xs text-slate-400">
                {tableRows.length} of {sourceRows.length} records
              </span>
            </div>

            <label className="relative ml-auto w-full max-w-xs">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search work orders..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>
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
            <WorkOrderTable
              data={tableRows}
              flagMode={null}
              selectedWoIds={new Set()}
              onRowSelect={() => {}}
              searchText=""
              isFullscreen={db.isFullscreen}
              resetKey={`${JSON.stringify(filters)}|${searchText}`}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
