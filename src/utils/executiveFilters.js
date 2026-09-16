import { CHART_COLORS } from './constants'

export const EMPTY_EXECUTIVE_FILTERS = Object.freeze({
  department: null,
  status: null,
  flaggedOnly: null,
})

// Same shape as PRIORITY_SERIES (utils/priorityChart.js) so
// StandardPriorityBarChart can stack on flag status instead of priority.
export const FLAG_STATUS_SERIES = [
  { key: 'unflagged', label: 'Unflagged', color: CHART_COLORS.flagStatus.unflagged },
  { key: 'flagged', label: 'Flagged', color: CHART_COLORS.flagStatus.flagged },
]

export const NO_DATE_BAND = 'no-date'

// Same 0-7 / 8-14 / 15-30 / 30+ bands already used for department ageing
// (utils/dashboardFilters.js's getAgeingBand), just applied to KPI 2's
// WO-start-date ageing instead of dept_ageing_days.
export const MI_AGEING_BANDS = [
  { key: '0-7', label: '0-7', max: 7 },
  { key: '8-14', label: '8-14', max: 14 },
  { key: '15-30', label: '15-30', max: 30 },
  { key: '30+', label: '30+', max: Infinity },
]

export function getMiAgeingBand(ageingDays) {
  const days = Number(ageingDays)
  if (!Number.isFinite(days)) return NO_DATE_BAND
  return MI_AGEING_BANDS.find((band) => days <= band.max)?.key ?? '30+'
}

/*
 * KPI 1 - overdue-by-department. Always returns all 6 departments (the
 * department filter dims non-matching bars via the chart's activeCategory
 * prop rather than removing data, same convention as every other chart).
 */
export function buildOverdueByDeptData(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  return safeRows.map((row) => ({
    name: row.department,
    flagged: Number(row.flagged) || 0,
    unflagged: Number(row.unflagged) || 0,
    total: Number(row.total) || 0,
  }))
}

/*
 * KPI 2 - MI-pending ageing. Here the department filter genuinely narrows
 * the WO list before bucketing (there's no per-department bar to dim - the
 * chart's only dimension is ageing band).
 */
export function buildMiPendingAgeingData(rows, filters) {
  const safeRows = Array.isArray(rows) ? rows : []
  const scoped = filters?.department
    ? safeRows.filter((row) => row.department === filters.department)
    : safeRows

  const counts = { [NO_DATE_BAND]: 0 }
  for (const band of MI_AGEING_BANDS) counts[band.key] = 0

  for (const row of scoped) {
    counts[getMiAgeingBand(row.ageing_days)] += 1
  }

  const bars = MI_AGEING_BANDS.map((band) => ({
    name: band.label,
    value: counts[band.key],
    color: '#F59E0B',
  }))

  if (counts[NO_DATE_BAND] > 0) {
    bars.push({ name: 'No date', value: counts[NO_DATE_BAND], color: '#94A3B8' })
  }

  return bars
}

/* KPI 4 - pivot flat {snapshot_date, department, count} rows into one row per date. */
export function buildDelayOverdueTrendSeries(points) {
  const safePoints = Array.isArray(points) ? points : []
  const byDate = new Map()

  for (const point of safePoints) {
    const key = point.snapshot_date
    if (!byDate.has(key)) byDate.set(key, { date: key })
    byDate.get(key)[point.department] = Number(point.count) || 0
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )
}

/* Indian financial year (Apr-Mar), matching the ERP's own WO-numbering convention. */
export function currentFinancialYear(referenceDate = new Date()) {
  const month = referenceDate.getMonth() + 1
  const startYear = month >= 4 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

export function shiftFinancialYear(fyLabel, delta) {
  const startYear = Number(String(fyLabel).slice(0, 4)) + delta
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

/* Indian Lakh/Crore notation - a raw rupee figure here can run into the millions. */
export function formatCompactINR(value) {
  const amount = Number(value) || 0
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)

  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`
  return `${sign}₹${abs.toFixed(0)}`
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return ''
  const [year, month] = String(monthKey).split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export function formatSnapshotDateLabel(isoDate) {
  if (!isoDate) return ''
  const [, month, day] = String(isoDate).split('-')
  return `${day}/${month}`
}
