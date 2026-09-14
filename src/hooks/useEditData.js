import { useQueries } from '@tanstack/react-query'
import { fetchEditSheet } from '../api/editData'
import { EDIT_SHEETS } from '../utils/constants'

const sharedQueryOptions = {
  staleTime: 0,
  retry: 1,

  // The user may leave this browser window to copy data from local Excel.
  // Do not automatically refetch and replace unsaved grid state when focus
  // returns to the dashboard.
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
}

/* One query per Edit Data sheet, keyed by sheet key. */
export const useEditData = () => {
  const results = useQueries({
    queries: EDIT_SHEETS.map(({ key }) => ({
      queryKey: [`edit-${key}`],
      queryFn: () => fetchEditSheet(key),
      ...sharedQueryOptions,
    })),
  })

  return {
    sheets: Object.fromEntries(
      EDIT_SHEETS.map(({ key }, index) => [key, results[index]]),
    ),
  }
}
