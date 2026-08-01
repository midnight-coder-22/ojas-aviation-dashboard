export const EMPTY_DASHBOARD_FILTERS = Object.freeze({
  status: null,
  priority: null,
  nextDept: null,
})

export const AGEING_BANDS = [
  { key: '0-7', label: '0-7' },
  { key: '8-14', label: '8-14' },
  { key: '15-30', label: '15-30' },
  { key: '30+', label: '30+' },
]

export const TARGET_HEALTH_ORDER = [
  'Overdue',
  'Due Soon',
  'On Track',
  'No Date',
]

export function normalizeText(value) {
  return String(value ?? '').trim()
}

export function normalizePriority(value) {
  const normalized = normalizeText(value).toLowerCase()

  if (normalized === 'high') return 'High'
  if (normalized === 'medium') return 'Medium'
  return 'Low'
}

export function normalizeStatus(value) {
  const normalized = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  const statusMap = {
    new: 'New',
    notstarted: 'New',
    ongoing: 'Ongoing',
    inprocess: 'Ongoing',
    inprogress: 'Ongoing',
    overdue: 'Overdue',
    completed: 'Completed',
    complete: 'Completed',
    done: 'Completed',
  }

  return statusMap[normalized] || 'New'
}

export function normalizeDepartment(value) {
  return normalizeText(value).toUpperCase()
}

export function toggleFilterValue(currentValue, nextValue) {
  return currentValue === nextValue ? null : nextValue
}

export function matchesDashboardFilters(row, filters, omittedKey = null) {
  if (
    omittedKey !== 'status' &&
    filters.status &&
    normalizeStatus(row?.status) !== filters.status
  ) {
    return false
  }

  if (
    omittedKey !== 'priority' &&
    filters.priority &&
    normalizePriority(row?.priority) !== filters.priority
  ) {
    return false
  }

  if (
    omittedKey !== 'nextDept' &&
    filters.nextDept &&
    normalizeDepartment(row?.next_dept) !==
      normalizeDepartment(filters.nextDept)
  ) {
    return false
  }

  return true
}

export function filterWorkOrders(rows, filters, omittedKey = null) {
  const safeRows = Array.isArray(rows) ? rows : []

  return safeRows.filter((row) =>
    matchesDashboardFilters(row, filters, omittedKey),
  )
}

export function buildPriorityBreakdown(rows) {
  return (Array.isArray(rows) ? rows : []).reduce(
    (breakdown, row) => {
      breakdown[normalizePriority(row?.priority)] += 1
      return breakdown
    },
    { Low: 0, Medium: 0, High: 0 },
  )
}

export function getAgeingBand(row) {
  const numericAge = Number(row?.dept_ageing_days)

  if (!Number.isFinite(numericAge)) return null
  if (numericAge <= 7) return '0-7'
  if (numericAge <= 14) return '8-14'
  if (numericAge <= 30) return '15-30'
  return '30+'
}

function parseCalendarDay(value) {
  const normalized = normalizeText(value)

  if (!normalized) return null

  const datePart = normalized.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)

  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return timestamp
}

function getTodayCalendarDay() {
  const today = new Date()

  return Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
}

export function getTargetHealth(row) {
  if (normalizeStatus(row?.status) === 'Completed') {
    return 'On Track'
  }

  const targetDays = [
    parseCalendarDay(row?.wo_target_date),
    parseCalendarDay(row?.dept_target_date),
  ].filter((value) => value !== null)

  if (targetDays.length === 0) return 'No Date'

  const earliestTarget = Math.min(...targetDays)
  const today = getTodayCalendarDay()
  const daysUntilTarget = Math.floor(
    (earliestTarget - today) / 86400000,
  )

  if (daysUntilTarget < 0) return 'Overdue'
  if (daysUntilTarget <= 7) return 'Due Soon'
  return 'On Track'
}

export function matchesIncomingPopupFilters(
  row,
  filters,
  omittedKey = null,
) {
  if (
    omittedKey !== 'status' &&
    filters.status &&
    normalizeStatus(row?.status) !== filters.status
  ) {
    return false
  }

  if (
    omittedKey !== 'priority' &&
    filters.priority &&
    normalizePriority(row?.priority) !== filters.priority
  ) {
    return false
  }

  if (
    omittedKey !== 'ageingBand' &&
    filters.ageingBand &&
    getAgeingBand(row) !== filters.ageingBand
  ) {
    return false
  }

  if (
    omittedKey !== 'targetHealth' &&
    filters.targetHealth &&
    getTargetHealth(row) !== filters.targetHealth
  ) {
    return false
  }

  return true
}

export function filterIncomingPopupRows(
  rows,
  filters,
  omittedKey = null,
  searchText = '',
) {
  const query = normalizeText(searchText).toLowerCase()

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!matchesIncomingPopupFilters(row, filters, omittedKey)) {
      return false
    }

    if (!query) return true

    return (
      normalizeText(row?.wo_id).toLowerCase().includes(query) ||
      normalizeText(row?.wo_name).toLowerCase().includes(query)
    )
  })
}
