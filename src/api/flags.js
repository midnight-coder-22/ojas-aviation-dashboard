import apiClient from './client'
import { deptToSlug } from '../utils/constants'

// GET /api/flags/{dept}
export const fetchDeptFlags = async (dept) => {
  const res = await apiClient.get(`/api/flags/${deptToSlug(dept)}`)
  return res.data
}

// POST /api/flags/raise
// body: { wo_ids: ['WOB001', 'WOB002'], department: 'CNC' }
export const raiseFlags = async ({ wo_ids, department }) => {
  const res = await apiClient.post('/api/flags/raise', { wo_ids, department })
  return res.data
}

// POST /api/flags/resolve
// body: { wo_ids: ['WOB001'] }
export const resolveFlags = async ({ wo_ids }) => {
  const res = await apiClient.post('/api/flags/resolve', { wo_ids })
  return res.data
}