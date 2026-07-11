import { useQuery } from '@tanstack/react-query'
import { fetchDeptFlags } from '../api/flags'

export const useFlags = (dept) => useQuery({
  queryKey: ['flags', dept],
  queryFn:  () => fetchDeptFlags(dept),
  enabled:  !!dept,
  staleTime: 2 * 60 * 1000,
})