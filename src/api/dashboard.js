import apiClient from './client'
import { deptToSlug } from '../utils/constants'

export const fetchDepartments = async () => {
  const res = await apiClient.get('/api/departments')
  return res.data
}

export const fetchDeptData = async (dept) => {
  const res = await apiClient.get(
    `/api/dashboard/${deptToSlug(dept)}`,
  )
  return res.data
}

export const fetchDeptSummary = async (dept) => {
  const res = await apiClient.get(
    `/api/dashboard/${deptToSlug(dept)}/summary`,
  )
  return res.data
}

export const fetchAllSummary = async () => {
  const res = await apiClient.get('/api/dashboard/all/summary')
  return res.data
}

/*
 * Returns both:
 * - data: source-department totals used by the Incoming WOs chart
 * - work_orders: detailed rows used by the Incoming Focus Dashboard
 *
 * Both arrive in this one request. Popup interactions are entirely client-side.
 */
export const fetchIncomingFlow = async (dept) => {
  const res = await apiClient.get(
    `/api/dashboard/${deptToSlug(dept)}/incoming-flow`,
  )
  return res.data
}
