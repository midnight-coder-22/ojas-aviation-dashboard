import { useQuery } from '@tanstack/react-query'
import { fetchAllSummary } from '../api/dashboard'

export const useAllSummary = () => useQuery({
  queryKey: ['all-summary'],
  queryFn:  fetchAllSummary,
  staleTime: 5 * 60 * 1000,
})