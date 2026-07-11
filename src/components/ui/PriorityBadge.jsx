import { PRIORITY_COLORS } from '../../utils/constants'

export default function PriorityBadge({ priority }) {
  const colors = PRIORITY_COLORS[priority] || { bg: 'bg-slate-100', text: 'text-slate-600' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
      {priority}
    </span>
  )
}