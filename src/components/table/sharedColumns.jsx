import { CircleAlert } from 'lucide-react'

/*
 * Pieces shared by WorkOrderTable column sets. A column renders one cell per
 * row: { key, label, className, render, sortType?: 'text' | 'number' | 'date',
 * align?, sticky? }. Only columns with a sortType get a sortable header, and
 * they sort on row[key]. A sticky column is pinned to the table's right edge.
 */

function normalizeText(value) {
  return String(value ?? '').trim()
}

export function isActiveFlag(value) {
  if (value === true || value === 1) return true

  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y', 'active'].includes(
      value.trim().toLowerCase(),
    )
  }

  return false
}

export function formatQuantity(value) {
  const normalized = normalizeText(value)

  if (!normalized) return '—'

  const numericValue = Number(value)
  return Number.isFinite(numericValue)
    ? numericValue.toLocaleString()
    : normalized
}

export function getAgeingTextClass(
  value,
  warningThreshold,
  dangerThreshold,
) {
  const numericValue = normalizeText(value) ? Number(value) : NaN

  if (!Number.isFinite(numericValue)) return 'text-slate-400'
  if (numericValue > dangerThreshold) return 'text-red-500'
  if (numericValue > warningThreshold) return 'text-amber-500'
  return 'text-slate-600'
}

/* Long codes and names truncate below 1700px so the columns fit on laptops. */
export function renderTruncated(
  text,
  className = 'max-w-[10rem] min-[1700px]:max-w-none',
) {
  if (!text) return '—'

  return (
    <span className={`block truncate ${className}`} title={text}>
      {text}
    </span>
  )
}

export function renderDeptChip(department) {
  if (!department) {
    return <span className="text-slate-300">—</span>
  }

  return (
    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
      {department}
    </span>
  )
}

export const FLAGS_COLUMN = {
  key: 'has_active_flag',
  label: 'Flags',
  align: 'center',
  sticky: true,
  className: 'px-2 py-3 text-center min-[1700px]:px-3',
  render: (row) =>
    isActiveFlag(row?.has_active_flag) ? (
      <span
        title="This work order has an active flag"
        aria-label="Active flag"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50"
      >
        <CircleAlert
          size={19}
          strokeWidth={2.5}
          className="text-red-600"
        />
      </span>
    ) : (
      <span className="text-sm text-slate-300">—</span>
    ),
}
