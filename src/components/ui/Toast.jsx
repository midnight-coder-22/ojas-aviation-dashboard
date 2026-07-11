import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ICONS  = { success: CheckCircle2, error: AlertCircle, info: Info }
const COLORS = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' }

export default function Toast({ id, message, type, onRemove }) {
  const Icon = ICONS[type] || Info

  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000)
    return () => clearTimeout(t)
  }, [id, onRemove])

  return (
    <div className={`flex items-center gap-3 ${COLORS[type]} text-white rounded-xl px-4 py-3 shadow-lg min-w-72 max-w-96`}>
      <Icon size={18} className="shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={() => onRemove(id)} className="shrink-0 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  )
}