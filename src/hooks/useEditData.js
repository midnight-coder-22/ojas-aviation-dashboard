import { useQueries } from '@tanstack/react-query'
import { fetchOwsSheet, fetchWosSheet } from '../api/editData'

const sharedQueryOptions = {
  staleTime: 0,
  retry: 1,

  // The user may leave this browser window to copy data from local Excel.
  // Do not automatically refetch and replace unsaved grid state when focus
  // returns to the dashboard.
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}

export const useEditData = () => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['edit-wos'],
        queryFn: fetchWosSheet,
        ...sharedQueryOptions,
      },
      {
        queryKey: ['edit-ows'],
        queryFn: fetchOwsSheet,
        ...sharedQueryOptions,
      },
    ],
  })

  return {
    wosData: results[0].data,
    owsData: results[1].data,
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    refetchAll: () =>
      Promise.all([
        results[0].refetch(),
        results[1].refetch(),
      ]),
  }
}
