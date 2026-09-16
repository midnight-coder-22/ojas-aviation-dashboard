import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  FilterX, Loader2, Maximize2, Minimize2, RotateCw,
} from 'lucide-react'

import AppLayout from '../components/layout/AppLayout'
import ChartCard from '../components/charts/ChartCard'
import ErrorState from '../components/ui/ErrorState'
import DataRefreshed from '../components/ui/DataRefreshed'
import DepartmentCardStrip from '../components/executive/DepartmentCardStrip'
import OverdueByDepartmentChart from '../components/executive/OverdueByDepartmentChart'
import MiPendingAgeingChart from '../components/executive/MiPendingAgeingChart'
import PendingWatchlistTable from '../components/executive/PendingWatchlistTable'
import LossTrendChart from '../components/executive/LossTrendChart'
import DelayOverdueTrendChart from '../components/executive/DelayOverdueTrendChart'
import KpiPlaceholder from '../components/executive/KpiPlaceholder'

import { useAllSummary } from '../hooks/useAllSummary'
import {
  useDelayOverdueTrend,
  useLossTrend,
  useMiPending,
  useOverdueByDepartment,
  usePendingWatchlist,
} from '../hooks/useExecutiveData'
import { useAuth } from '../context/AuthContext'
import { useDashboard } from '../context/DashboardContext'
import { useFullscreen } from '../hooks/useFullscreen'
import { deptToSlug } from '../utils/constants'
import { latestTimestamp } from '../utils/formatters'
import { currentFinancialYear } from '../utils/executiveFilters'

function ChartLoadingCard({ className = 'h-[290px]' }) {
  return <div className={`animate-pulse rounded-xl border border-slate-200 bg-slate-200 ${className}`} />
}

// A query error must not render as if it were healthy empty data (`?? []`
// silently looks like "0 rows, all clear") - each KPI query gets its own
// retry affordance instead.
function ChartErrorCard({ query, className = 'h-[290px]' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ErrorState
        message={query.error?.response?.data?.detail || 'Failed to load this chart'}
        onRetry={() => query.refetch()}
      />
    </div>
  )
}

export default function ExecutiveDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const db = useDashboard()
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen()

  const filters = db.dashboardFilters
  const financialYear = filters.financialYear || currentFinancialYear()

  const summaryQuery = useAllSummary()
  const overdueQuery = useOverdueByDepartment()
  const miPendingQuery = useMiPending()
  const watchlistQuery = usePendingWatchlist()
  const lossTrendQuery = useLossTrend(financialYear)
  const delayTrendQuery = useDelayOverdueTrend(financialYear)

  useEffect(() => {
    db.resetDashboardFilters()
    return () => db.resetDashboardFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirect departmental users, same as before.
  if (user && user.role === 'Departmental') {
    return <Navigate to={'/dashboard/' + deptToSlug(user.department || 'cnc')} replace />
  }

  const summaries = summaryQuery.data ?? []
  const isLoading = summaryQuery.isLoading
  const isError = summaryQuery.isError

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['all-summary'] })
    queryClient.invalidateQueries({ queryKey: ['executive'] })
  }

  const isFetching =
    summaryQuery.isFetching || overdueQuery.isFetching || miPendingQuery.isFetching ||
    watchlistQuery.isFetching || lossTrendQuery.isFetching || delayTrendQuery.isFetching

  const activeFilterText = [
    filters.department,
    filters.status,
    filters.flaggedOnly && 'Flagged only',
  ].filter(Boolean).join(' · ')

  return (
    <AppLayout scrollable>
      {/* ---- HEADER ---- */}
      {!isFullscreen && (
        <div className="flex items-start justify-between pt-8 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold text-slate-900">Executive Dashboard</h1>
              {activeFilterText && (
                <button
                  type="button"
                  onClick={db.resetDashboardFilters}
                  className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                >
                  <FilterX size={12} />
                  {activeFilterText}
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">Cross-department operational overview</p>
            <div className="mt-1">
              <DataRefreshed timestamp={latestTimestamp(summaries.map((summary) => summary.last_refreshed))} />
            </div>
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

      {isError && <ErrorState onRetry={summaryQuery.refetch} />}

      {!isError && (
        <div className="space-y-4 pb-6">
          {/* ---- KPI 0: DEPARTMENT CARD STRIP ---- */}
          {isLoading ? (
            <div className="flex gap-3">
              {[...Array(6)].map((_, i) => <ChartLoadingCard key={i} className="h-[90px] flex-1" />)}
            </div>
          ) : (
            <DepartmentCardStrip
              summaries={summaries}
              filters={filters}
              onSetFilter={db.setDashboardFilter}
              onSetFilterGroup={db.setDashboardFilterGroup}
              onNavigateDepartment={(slug) => {
                // Clear Executive's filters before leaving so the destination
                // page's first render can't briefly inherit a stale filter
                // (e.g. status: 'Overdue') before its own mount effect resets it.
                db.resetDashboardFilters()
                navigate('/dashboard/' + slug)
              }}
            />
          )}

          {/* ---- KPI 1 / KPI 2 / KPI 0.5 ---- */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {overdueQuery.isLoading ? <ChartLoadingCard /> : overdueQuery.isError ? <ChartErrorCard query={overdueQuery} /> : (
              <ChartCard
                title="Overdue Work Orders by Department"
                subtitle="Flagged vs unflagged"
                metricValue={overdueQuery.data?.reduce((sum, row) => sum + row.total, 0) ?? 0}
                metricLabel="Overdue"
                legendSeries={[
                  { key: 'unflagged', label: 'Unflagged', color: '#94A3B8' },
                  { key: 'flagged', label: 'Flagged', color: '#EF4444' },
                ]}
              >
                <OverdueByDepartmentChart
                  rows={overdueQuery.data ?? []}
                  filters={filters}
                  onSetFilter={db.setDashboardFilter}
                  onSetFilterGroup={db.setDashboardFilterGroup}
                />
              </ChartCard>
            )}

            {miPendingQuery.isLoading ? <ChartLoadingCard /> : miPendingQuery.isError ? <ChartErrorCard query={miPendingQuery} /> : (
              <ChartCard
                title="MI Pending vs Ageing"
                subtitle="No input to production yet, by days since WO start"
                metricValue={miPendingQuery.data?.length ?? 0}
                metricLabel="WOs"
              >
                <MiPendingAgeingChart rows={miPendingQuery.data ?? []} filters={filters} />
              </ChartCard>
            )}

            {watchlistQuery.isLoading ? <ChartLoadingCard /> : watchlistQuery.isError ? <ChartErrorCard query={watchlistQuery} /> : (
              <ChartCard
                title="Pending Watchlist"
                subtitle="Customer SO lines and pending GRNs"
                metricValue={watchlistQuery.data?.length ?? 0}
                metricLabel="Pending"
              >
                <PendingWatchlistTable rows={watchlistQuery.data ?? []} />
              </ChartCard>
            )}
          </div>

          {/* ---- KPI 3 / KPI 4 ---- */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {lossTrendQuery.isLoading ? <ChartLoadingCard className="h-[340px]" /> : lossTrendQuery.isError ? <ChartErrorCard query={lossTrendQuery} className="h-[340px]" /> : (
              <LossTrendChart
                points={lossTrendQuery.data ?? []}
                financialYear={financialYear}
                onChangeFinancialYear={(fy) => db.setDashboardFilter('financialYear', fy)}
              />
            )}

            {delayTrendQuery.isLoading ? <ChartLoadingCard className="h-[340px]" /> : delayTrendQuery.isError ? <ChartErrorCard query={delayTrendQuery} className="h-[340px]" /> : (
              <DelayOverdueTrendChart
                points={delayTrendQuery.data ?? []}
                financialYear={financialYear}
                onChangeFinancialYear={(fy) => db.setDashboardFilter('financialYear', fy)}
                activeDepartment={filters.department}
              />
            )}
          </div>

          {/* ---- RESERVED FOR FUTURE KPIs ---- */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <KpiPlaceholder label="KPI-1" />
            <KpiPlaceholder label="KPI-2" />
            <KpiPlaceholder label="KPI-3" />
          </div>
        </div>
      )}

      {isFullscreen && (
        <button onClick={exitFullscreen}
          className="fixed bottom-6 right-6 z-50 bg-slate-900/70 text-white rounded-full p-3 shadow-lg hover:bg-slate-900">
          <Minimize2 size={20} />
        </button>
      )}
    </AppLayout>
  )
}
