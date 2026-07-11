import axios from 'axios'
import { STORAGE_TOKEN, STORAGE_AUTH } from '../utils/constants'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Before every request: attach the JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// After every response: if 401 (unauthorized) → force logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_TOKEN)
      localStorage.removeItem(STORAGE_AUTH)
      window.location.hash = '#/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient