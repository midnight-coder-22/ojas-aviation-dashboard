import { useQuery } from '@tanstack/react-query'
import { fetchActiveFlags } from '../api/flags'

export const useDeptFlags = (department) =>
  useQuery({
    // Keyed per page so TopNav's optimistic raise/resolve updates stay local,
    // but the data is every active flag: flags belong to the WO, not to the
    // department that raised them, so a flagged WO that moved on is still
    // shown as flagged (and can be resolved) where it is now.
    queryKey: ['flags', department],
    queryFn: fetchActiveFlags,
    enabled: Boolean(department),

    // Flags should always be treated as live operational data.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })