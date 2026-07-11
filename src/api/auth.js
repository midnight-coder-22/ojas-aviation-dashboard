import apiClient from './client'

// POST /api/auth/login
// Sends username + password, gets back JWT + user info
export const login = async ({ username, password }) => {
  const res = await apiClient.post('/api/auth/login', { username, password })
  return res.data
}

// GET /api/auth/me
// Verifies token is still valid, returns current user profile
export const getMe = async () => {
  const res = await apiClient.get('/api/auth/me')
  return res.data
}