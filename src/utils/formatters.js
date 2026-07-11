import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—'
  } catch { return '—' }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return 'Not yet refreshed'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr)
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : 'Unknown'
  } catch { return 'Unknown' }
}

export const formatDeptHeading = (dept) => {
  if (!dept) return 'Department'
  const titled = dept
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return `${titled} Department`
}

export const formatDecimal = (val) => {
  if (val === null || val === undefined) return '—'
  return Number(val).toFixed(1)
}

export const ageingColor = (days, type = 'wo') => {
  if (days === null || days === undefined) return 'text-slate-500'
  const warn   = type === 'wo' ? 14 : 7
  const danger = type === 'wo' ? 30 : 14
  if (days > danger) return 'text-red-600 font-semibold'
  if (days > warn)   return 'text-amber-600 font-semibold'
  return 'text-green-600'
}

export const avgField = (rows, field) => {
  if (!rows || rows.length === 0) return 0
  const valid = rows.filter(r => r[field] !== null && r[field] !== undefined)
  if (valid.length === 0) return 0
  return valid.reduce((sum, r) => sum + r[field], 0) / valid.length
}

export const formatAgeingCompact = (days) => {
  if (days === null || days === undefined) return '—'
  return `${days}d`
}