import { useEffect, useMemo, useState } from 'react'
import { FilterX, Minimize2, Search } from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import ChartCard from '../components/charts/ChartCard'
import StandardSingleBarChart from '../components/charts/StandardSingleBarChart'
import StandardPriorityBarChart from '../components/charts/StandardPriorityBarChart'
import WorkOrderTable from '../components/table/WorkOrderTable'
import QcExpandedRow from '../components/qc/QcExpandedRow'
import { QC_TABLE_COLUMNS } from '../components/qc/qcColumns'
import { useQcData } from '../hooks/useQcData'
import { useDeptFlags } from '../hooks/useDeptFlags'
import { useDashboard } from '../context/DashboardContext'
import { QC_DEPARTMENT } from '../utils/constants'
import { toggleFilterValue } from '../utils/dashboardFilters'
import { formatRelative } from '../utils/formatters'
import {
  NO_DATE_BAND,
  QC_TYPES,
  QC_TYPE_SERIES,
  buildIncomingByDeptData,
  buildInwardAgeingData,
  buildProcessAgeingData,
  filterQcRows,
  isInwardRow,
  prepareQcRows,
  searchQcRows,
  uniqueWorkOrders,
} from '../utils/qcFilters'

const EMPTY_ROWS = []
const EMPTY_FLAGS = []

// No bar carries this value, so passing it as the selection dims a whole chart.
const DIM_ALL = '__dim_all__'

const getQcRowId = (row) => row.entry_id
const renderQcExpandedRow = (row) => <QcExpandedRow row={row} />

function ChartLoadingCard() {
  return (
    <div className="h-[290px] animate-pulse rounded-xl border border-slate-200 bg-slate-200" />
  )
}

function FilterChip({ children }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  )
}

function QcTypeTabs({ counts, activeType, onSelect }) {
  const tabs = [
    { type: null, label: 'All', count: counts.all },
    ...QC_TYPES.map((type) => ({ type, label: type, count: counts[type] })),
  ]

  return (
    <div
      role="tablist"
      aria-label="QC type"
      className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5"
    >
      {tabs.map(({ type, label, count }) => {
        const isActive = (activeType || null) === type

        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {label}
            <span className="tabular-nums text-[10px] font-medium text-slate-400">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function QcDashboard() {
  const db = useDashboard()
  const qcQuery = useQcData()
  const flagsQuery = useDeptFlags(QC_DEPARTMENT)
  const [searchText, setSearchText] = useState('')
  const filters = db.dashboardFilters

  const rawRows = qcQuery.data?.data ?? EMPTY_ROWS

  const activeFlagIds = useMemo(
    () =>
      new Set(
        (flagsQuery.data ?? EMPTY_FLAGS).map((flag) =>
          String(flag.wo_id ?? '').trim(),
        ),
      ),
    [flagsQuery.data],
  )

  const rows = useMemo(() => {
    const prepared = prepareQcRows(rawRows)

    if (!flagsQuery.isSuccess) return prepared

    return prepared.map((row) => ({
      ...row,
      has_active_flag:
        Boolean(row.wo_id) &&
        activeFlagIds.has(String(row.wo_id).trim()),
    }))
  }, [activeFlagIds, flagsQuery.isSuccess, rawRows])

  const searchedRows = useMemo(
    () => searchQcRows(rows, searchText),
    [rows, searchText],
  )

  /*
   * Each chart ignores only its own dimensions while respecting the other
   * active filters, like the department dashboards.
   */
  const tableRows = useMemo(
    () => filterQcRows(searchedRows, filters),
    [filters, searchedRows],
  )

  const typeTabRows = useMemo(
    () => filterQcRows(searchedRows, filters, ['qcType']),
    [filters, searchedRows],
  )

  const ageingRows = useMemo(
    () => filterQcRows(searchedRows, filters, ['qcType', 'ageingBand']),
    [filters, searchedRows],
  )

  const inwardAgeingData = useMemo(
    () => buildInwardAgeingData(ageingRows.filter(isInwardRow)),
    [ageingRows],
  )

  const processAgeingData = useMemo(
    () =>
      buildProcessAgeingData(
        ageingRows.filter((row) => !isInwardRow(row)),
      ),
    [ageingRows],
  )

  const incomingData = useMemo(
    () =>
      buildIncomingByDeptData(
        filterQcRows(searchedRows, filters, ['sourceDept', 'priority'])
          .filter((row) => !isInwardRow(row)),
      ),
    [filters, searchedRows],
  )

  const typeCounts = useMemo(() => {
    const counts = { all: typeTabRows.length }

    for (const type of QC_TYPES) {
      counts[type] = typeTabRows.filter((row) => row.qc_type === type).length
    }

    return counts
  }, [typeTabRows])

  const inwardTotal = inwardAgeingData.reduce((sum, row) => sum + row.value, 0)
  const processTotal = processAgeingData.reduce((sum, row) => sum + row.total, 0)
  const incomingTotal = incomingData.reduce((sum, row) => sum + row.total, 0)

  const inwardSelected = filters.qcType === 'Inward'
  const processSelected =
    filters.qcType === 'Inline' || filters.qcType === 'Final'

  const isLoading = qcQuery.isLoading
  const isError = qcQuery.isError
  const isNotGenerated =
    isError && qcQuery.error?.response?.status === 503
  const lastRefreshed = qcQuery.data?.last_refreshed
  const hasRefinements =
    db.hasActiveDashboardFilters || Boolean(searchText.trim())

  const activeFilterLabels = [
    filters.qcType && `${filters.qcType} QC`,
    filters.ageingBand &&
      (filters.ageingBand === NO_DATE_BAND
        ? 'No in-date'
        : `${filters.ageingBand} days`),
    filters.sourceDept && `From ${filters.sourceDept}`,
    filters.priority && `${filters.priority} priority`,
    searchText.trim() && `Search: ${searchText.trim()}`,
  ].filter(Boolean)

  useEffect(() => {
    db.setCurrentDept(QC_DEPARTMENT)
    db.resetDashboardFilters()

    return () => {
      db.setCurrentDept(null)
      db.setWorkOrders([])
      db.cancelFlag()
    }
    // Dashboard action functions are stable and intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    db.setWorkOrders(uniqueWorkOrders(rows))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  const handleRowSelect = (woId) => {
    if (db.flagMode === 'add') {
      if (!db.preExistingIds.has(woId)) db.toggleWoId(woId)
      return
    }

    if (
      db.flagMode === 'resolve' &&
      rows.some((row) => row.wo_id === woId && row.has_active_flag)
    ) {
      db.toggleWoId(woId)
    }
  }

  const selectAgeing = (qcType, ageingBand) => {
    const isSame =
      filters.qcType === qcType && filters.ageingBand === ageingBand

    db.setDashboardFilterGroup({
      qcType: isSame ? null : qcType,
      ageingBand: isSame ? null : ageingBand,
    })
  }

  const selectSourceAndPriority = ({ category, priority }) => {
    const isSame =
      filters.sourceDept === category && filters.priority === priority

    db.setDashboardFilterGroup({
      sourceDept: isSame ? null : category,
      priority: isSame ? null : priority,
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
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            QC Department
          </h1>

          {lastRefreshed && (
            <span className="text-xs text-slate-400">
              Data refreshed {formatRelative(lastRefreshed)}
            </span>
          )}

          {activeFilterLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeFilterLabels.map((label) => (
                <FilterChip key={label}>{label}</FilterChip>
              ))}
            </div>
          )}
        </div>

        {!isError && (
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <ChartLoadingCard key={`qc-chart-loading-${index}`} />
              ))
            ) : (
              <>
                <ChartCard
                  title="Inward Material QC Ageing"
                  subtitle="Open GRN lines per linked WO · days since GRN"
                  metricValue={inwardTotal}
                  metricLabel="Open"
                >
                  <StandardSingleBarChart
                    data={inwardAgeingData}
                    emptyMessage="No open inward QC entries match the current filters."
                    yAxisLabel="Entries"
                    activeValue={
                      processSelected ? DIM_ALL : filters.ageingBand
                    }
                    onCategoryClick={(band) => selectAgeing('Inward', band)}
                  />
                </ChartCard>

                <ChartCard
                  title="Inline & Final QC Ageing"
                  subtitle="Days in the current department"
                  metricValue={processTotal}
                  metricLabel="WOs"
                  legendSeries={QC_TYPE_SERIES}
                >
                  <StandardPriorityBarChart
                    data={processAgeingData}
                    series={QC_TYPE_SERIES}
                    seriesLabel="QC"
                    emptyMessage="No Inline or Final QC work orders match the current filters."
                    yAxisLabel="WO count"
                    activeCategory={inwardSelected ? null : filters.ageingBand}
                    activePriority={
                      inwardSelected
                        ? DIM_ALL
                        : processSelected
                          ? filters.qcType
                          : null
                    }
                    onSegmentClick={({ category, priority }) =>
                      selectAgeing(priority, category)
                    }
                  />
                </ChartCard>

                <ChartCard
                  title="Incoming WOs"
                  subtitle="Department each QC work order comes from"
                  metricValue={incomingTotal}
                  metricLabel="Incoming"
                  showPriorityLegend
                >
                  <StandardPriorityBarChart
                    data={incomingData}
                    emptyMessage="No Inline or Final QC work orders match the current filters."
                    yAxisLabel="WO count"
                    activeCategory={filters.sourceDept}
                    activePriority={filters.priority}
                    onCategoryClick={(department) =>
                      db.setDashboardFilter(
                        'sourceDept',
                        toggleFilterValue(filters.sourceDept, department),
                      )
                    }
                    onSegmentClick={selectSourceAndPriority}
                  />
                </ChartCard>
              </>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-bold text-slate-800">
              QC Entries
            </span>
            <span className="text-xs text-slate-400">
              {tableRows.length}
              {hasRefinements ? ` of ${rows.length}` : ''} records
            </span>

            {!isLoading && !isError && rows.length > 0 && (
              <QcTypeTabs
                counts={typeCounts}
                activeType={filters.qcType}
                onSelect={(type) => db.setDashboardFilter('qcType', type)}
              />
            )}

            <label className="relative ml-auto w-full max-w-xs">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search WO, item, GRN, supplier..."
                aria-label="Search QC entries"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <div
            className={`
              min-h-0 flex-1 px-3 pb-1
              ${db.isFullscreen ? 'flex flex-col overflow-hidden' : 'overflow-auto'}
            `}
          >
            {isLoading && (
              <div className="pt-4">
                <LoadingSkeleton type="table" />
              </div>
            )}

            {isNotGenerated && (
              <EmptyState
                message="QC data has not been generated yet"
                subMessage={qcQuery.error?.response?.data?.detail}
              />
            )}

            {isError && !isNotGenerated && (
              <div className="pt-4">
                <ErrorState onRetry={() => qcQuery.refetch()} />
              </div>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <EmptyState
                message="No open QC entries"
                subMessage="Nothing is waiting for Inward, Inline, or Final QC."
              />
            )}

            {!isLoading && !isError && rows.length > 0 && (
              <WorkOrderTable
                data={tableRows}
                flagMode={db.flagMode}
                selectedWoIds={db.selectedWoIds}
                onRowSelect={handleRowSelect}
                isFullscreen={db.isFullscreen}
                resetKey={`${JSON.stringify(filters)}|${searchText}`}
                columns={QC_TABLE_COLUMNS}
                getRowId={getQcRowId}
                renderExpandedRow={renderQcExpandedRow}
                defaultSortField="qc_ageing_days"
                emptyMessage="No QC entries match the current filters."
              />
            )}
          </div>
        </div>

        {db.isFullscreen && (
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
