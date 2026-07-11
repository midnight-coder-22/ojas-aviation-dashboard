import { useQuery } from '@tanstack/react-query'
import { fetchDeptData } from '../api/dashboard'

export const useDeptData = (dept) => useQuery({
  queryKey: ['dept-data', dept],
  queryFn:  () => fetchDeptData(dept),
  enabled:  !!dept,
  staleTime: 5 * 60 * 1000,
})