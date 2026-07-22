import { useQuery } from '@tanstack/react-query'
import { fetchDeptFlags } from '../api/flags'

export const useDeptFlags = (department) =>
  useQuery({
    queryKey: ['flags', department],
    queryFn: () => fetchDeptFlags(department),
    enabled: Boolean(department),

    // Flags should always be treated as live operational data.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })