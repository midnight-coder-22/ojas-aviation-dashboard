import apiClient from './client'

// GET /api/qc/dashboard - every open Inward / Inline / Final QC entry.
export const fetchQcDashboard = async () => {
  const res = await apiClient.get('/api/qc/dashboard')
  return res.data
}
