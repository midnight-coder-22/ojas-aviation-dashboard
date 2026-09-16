import { useQuery } from '@tanstack/react-query'
import {
  fetchDataReminder,
  fetchDelayOverdueTrend,
  fetchLossTrend,
  fetchMiPending,
  fetchOverdueByDepartment,
  fetchPendingWatchlist,
} from '../api/executive'

const STALE_TIME = 5 * 60 * 1000

export const useOverdueByDepartment = () => useQuery({
  queryKey: ['executive', 'overdue-by-department'],
  queryFn: fetchOverdueByDepartment,
  staleTime: STALE_TIME,
})

export const useMiPending = () => useQuery({
  queryKey: ['executive', 'mi-pending'],
  queryFn: fetchMiPending,
  staleTime: STALE_TIME,
})

export const usePendingWatchlist = () => useQuery({
  queryKey: ['executive', 'pending-watchlist'],
  queryFn: fetchPendingWatchlist,
  staleTime: STALE_TIME,
})

export const useLossTrend = (financialYear) => useQuery({
  queryKey: ['executive', 'loss-trend', financialYear ?? 'current'],
  queryFn: () => fetchLossTrend(financialYear),
  staleTime: STALE_TIME,
})

export const useDelayOverdueTrend = (financialYear) => useQuery({
  queryKey: ['executive', 'delay-overdue-trend', financialYear ?? 'current'],
  queryFn: () => fetchDelayOverdueTrend(financialYear),
  staleTime: STALE_TIME,
})

// Polled independently of the Executive page itself - the Admin usually
// lands on their own department dashboard, not Executive, so this needs to
// stay live wherever AppLayout renders it.
export const useDataReminder = (enabled) => useQuery({
  queryKey: ['executive', 'data-reminder'],
  queryFn: fetchDataReminder,
  enabled,
  staleTime: 2 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
})
