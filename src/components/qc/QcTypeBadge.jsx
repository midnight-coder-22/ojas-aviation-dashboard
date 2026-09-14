import { QC_TYPE_BADGE_CLASSES } from '../../utils/qcFilters'

export default function QcTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${
        QC_TYPE_BADGE_CLASSES[type] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {type}
    </span>
  )
}
