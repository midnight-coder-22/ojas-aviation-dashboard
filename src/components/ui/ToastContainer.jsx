import { useContext } from 'react'
import { ToastContext } from '../../context/ToastContext'
import Toast from './Toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  )
}