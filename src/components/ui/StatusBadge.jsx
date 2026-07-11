import { STATUS_COLORS, STATUS_DISPLAY } from '../../utils/constants'

export default function StatusBadge({ status }) {
  const colors  = STATUS_COLORS[status] || { bg: 'bg-slate-100', text: 'text-slate-600' }
  const display = STATUS_DISPLAY[status] || status

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      {display}
    </span>
  )
}