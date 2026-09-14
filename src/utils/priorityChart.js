import { CHART_COLORS } from './constants'

/*
 * One priority definition used by:
 * - Status
 * - Flow to Next Dept
 * - Incoming WOs
 * - Priority pie
 */
export const PRIORITY_SERIES = [
  {
    key: 'low',
    label: 'Low',
    color: CHART_COLORS.priority.Low,
  },
  {
    key: 'medium',
    label: 'Medium',
    color: CHART_COLORS.priority.Medium,
  },
  {
    key: 'high',
    label: 'High',
    color: CHART_COLORS.priority.High,
  },
]

export function normalizePriorityKey(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (normalized === 'high') {
    return 'high'
  }

  if (normalized === 'medium') {
    return 'medium'
  }

  return 'low'
}

/*
 * Adds the values required by the shared stacked-bar renderer:
 * - total
 * - topKey
 *
 * topKey identifies which visible segment receives rounded upper corners.
 */
export function addStackMeta(row, series = PRIORITY_SERIES) {
  const normalizedRow = { ...row }
  let total = 0

  for (const { key } of series) {
    normalizedRow[key] = Number(row[key]) || 0
    total += normalizedRow[key]
  }

  const topKey =
    [...series]
      .reverse()
      .find(({ key }) => normalizedRow[key] > 0)
      ?.key ?? null

  return {
    ...normalizedRow,
    total,
    topKey,
  }
}

export function addPriorityStackMeta(row) {
  return addStackMeta(row, PRIORITY_SERIES)
}