import { createContext, useState, useEffect, useContext } from 'react'
import { login as loginApi, getMe } from '../api/auth'
import { STORAGE_AUTH, STORAGE_TOKEN } from '../utils/constants'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_TOKEN)
    const savedAuth = localStorage.getItem(STORAGE_AUTH)

    // No saved login
    if (!token || !savedAuth) {
      setIsLoading(false)
      return
    }

    try {
      // Trust localStorage first so refresh does not log user out
      const savedUser = JSON.parse(savedAuth)
      setUser(savedUser)
      setIsLoading(false)

      // Optional: verify with backend in background
      getMe()
        .then((userData) => {
          const updatedUser = {
            user_id: userData.user_id,
            full_name: userData.full_name,
            username: userData.username,
            role: userData.role,
            department: userData.department,
            dashboard_access: userData.dashboard_access,
            can_edit_data: userData.can_edit_data,
            can_flag: userData.can_flag,
            can_resolve_flag: userData.can_resolve_flag,
          }

          localStorage.setItem(STORAGE_AUTH, JSON.stringify(updatedUser))
          setUser(updatedUser)
        })
        .catch(() => {
          // For "forever login", do NOT clear storage here.
          // Backend may be temporarily unavailable.
          console.warn('Could not verify user with backend, using saved login.')
        })
    } catch (error) {
      console.error('Invalid saved auth data:', error)
      localStorage.removeItem(STORAGE_TOKEN)
      localStorage.removeItem(STORAGE_AUTH)
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    const data = await loginApi(credentials)

    localStorage.setItem(STORAGE_TOKEN, data.access_token)

    const userData = {
      user_id: data.user_id,
      full_name: data.full_name,
      username: data.username,
      role: data.role,
      department: data.department,
      dashboard_access: data.dashboard_access,
      can_edit_data: data.can_edit_data,
      can_flag: data.can_flag,
      can_resolve_flag: data.can_resolve_flag,
    }

    localStorage.setItem(STORAGE_AUTH, JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN)
    localStorage.removeItem(STORAGE_AUTH)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}