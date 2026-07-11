import { createContext, useState, useContext } from 'react'

export const ToastContext = createContext(null)

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => {
      const updated = prev.length >= 3 ? prev.slice(1) : prev
      return [...updated, { id, message, type }]
    })
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)