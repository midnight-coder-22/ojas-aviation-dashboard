import { useQuery } from '@tanstack/react-query'
import { fetchQcDashboard } from '../api/qc'
import { QC_DEPARTMENT } from '../utils/constants'

// Shares the department-data key so TopNav's refresh and flag cache updates
// apply to the QC dashboard unchanged.
export const useQcData = () => useQuery({
  queryKey: ['dept-data', QC_DEPARTMENT],
  queryFn: fetchQcDashboard,
  staleTime: 5 * 60 * 1000,
  retry: (failureCount, error) =>
    error?.response?.status !== 503 && failureCount < 3,
})
