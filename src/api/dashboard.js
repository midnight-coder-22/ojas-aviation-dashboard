import apiClient from './client'
import { deptToSlug } from '../utils/constants'

// GET /api/departments
export const fetchDepartments = async () => {
  const res = await apiClient.get('/api/departments')
  return res.data
}

// GET /api/dashboard/cnc or /api/dashboard/sheet-metal etc.
// Returns { department, record_count, data: WorkOrderKPI[] }
export const fetchDeptData = async (dept) => {
  const res = await apiClient.get(`/api/dashboard/${deptToSlug(dept)}`)
  return res.data
}

// GET /api/dashboard/cnc/summary
// Returns { department, total_wos, qc_alert_count, mi_alert_count,
//           flagged_count, status_breakdown, priority_breakdown, last_refreshed }
export const fetchDeptSummary = async (dept) => {
  const res = await apiClient.get(`/api/dashboard/${deptToSlug(dept)}/summary`)
  return res.data
}

// GET /api/dashboard/all/summary
// Returns array of 6 DepartmentSummary objects — one per department
export const fetchAllSummary = async () => {
  const res = await apiClient.get('/api/dashboard/all/summary')
  return res.data
}