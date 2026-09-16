import apiClient from './client'

export const fetchOverdueByDepartment = async () => {
  const res = await apiClient.get('/api/executive/overdue-by-department')
  return res.data
}

export const fetchMiPending = async () => {
  const res = await apiClient.get('/api/executive/mi-pending')
  return res.data
}

export const fetchPendingWatchlist = async () => {
  const res = await apiClient.get('/api/executive/pending-watchlist')
  return res.data
}

export const fetchLossTrend = async (financialYear) => {
  const res = await apiClient.get('/api/executive/loss-trend', {
    params: financialYear ? { financial_year: financialYear } : undefined,
  })
  return res.data
}

export const fetchDelayOverdueTrend = async (financialYear) => {
  const res = await apiClient.get('/api/executive/delay-overdue-trend', {
    params: financialYear ? { financial_year: financialYear } : undefined,
  })
  return res.data
}

export const fetchDataReminder = async () => {
  const res = await apiClient.get('/api/executive/data-reminder')
  return res.data
}
