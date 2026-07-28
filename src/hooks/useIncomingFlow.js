import { useQuery } from '@tanstack/react-query'
import { fetchIncomingFlow } from '../api/dashboard'

export const useIncomingFlow = (dept) => useQuery({
  queryKey: ['incoming-flow', dept],
  queryFn: () => fetchIncomingFlow(dept),
  enabled: Boolean(dept),
  staleTime: 5 * 60 * 1000,
})