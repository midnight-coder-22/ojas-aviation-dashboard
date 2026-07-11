import { useQueries } from '@tanstack/react-query'
import { fetchWosSheet, fetchOwsSheet } from '../api/editData'

export const useEditData = () => {
  const results = useQueries({
    queries: [
      { queryKey: ['edit-wos'], queryFn: fetchWosSheet, staleTime: 0 },
      { queryKey: ['edit-ows'], queryFn: fetchOwsSheet, staleTime: 0 },
    ],
  })
  return {
    wosData:    results[0].data,
    owsData:    results[1].data,
    isLoading:  results.some(r => r.isLoading),
    isError:    results.some(r => r.isError),
    refetchAll: () => { results[0].refetch(); results[1].refetch() },
  }
}