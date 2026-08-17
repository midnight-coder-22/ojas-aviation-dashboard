import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

/*
 * Dashboard dates are business calendar dates, not moments in time.
 * When the API sends an ISO date/timestamp, render the YYYY-MM-DD part
 * directly so browser timezone conversion can never move it by a day.
 */
export const formatDate = (dateValue) => {
  if (!dateValue) return '—'

  if (typeof dateValue === 'string') {
    const normalized = dateValue.trim()
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalized)

    if (match) {
      const [, year, month, day] = match
      return `${day}/${month}/${year.slice(-2)}`
    }
  }

  try {
    const d =
      typeof dateValue === 'string'
        ? parseISO(dateValue)
        : new Date(dateValue)

    return isValid(d) ? format(d, 'dd/MM/yy') : '—'
  } catch {
    return '—'
  }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return 'Not yet refreshed'

  try {
    const d =
      typeof dateStr === 'string'
        ? parseISO(dateStr)
        : new Date(dateStr)

    return isValid(d)
      ? formatDistanceToNow(d, { addSuffix: true })
      : 'Unknown'
  } catch {
    return 'Unknown'
  }
}

export const formatDeptHeading = (dept) => {
  if (!dept) return 'Department'

  const titled = dept
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return `${titled} Department`
}

export const formatDecimal = (val) => {
  if (val === null || val === undefined) return '—'
  return Number(val).toFixed(1)
}

export const ageingColor = (days, type = 'wo') => {
  if (days === null || days === undefined) return 'text-slate-500'

  const warn = type === 'wo' ? 14 : 7
  const danger = type === 'wo' ? 30 : 14

  if (days > danger) return 'text-red-600 font-semibold'
  if (days > warn) return 'text-amber-600 font-semibold'
  return 'text-green-600'
}

export const avgField = (rows, field) => {
  if (!rows || rows.length === 0) return 0

  const valid = rows.filter(
    (row) => row[field] !== null && row[field] !== undefined,
  )

  if (valid.length === 0) return 0

  return (
    valid.reduce((sum, row) => sum + row[field], 0) /
    valid.length
  )
}

export const formatAgeingCompact = (days) => {
  if (days === null || days === undefined) return '—'
  return `${days}d`
}
