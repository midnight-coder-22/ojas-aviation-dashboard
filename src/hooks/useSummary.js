import { useQuery } from '@tanstack/react-query'
import { fetchDeptSummary } from '../api/dashboard'

export const useSummary = (dept) => useQuery({
  queryKey: ['dept-summary', dept],
  queryFn:  () => fetchDeptSummary(dept),
  enabled:  !!dept,
  staleTime: 5 * 60 * 1000,
})