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
export function addPriorityStackMeta(row) {
  const low = Number(row.low) || 0
  const medium = Number(row.medium) || 0
  const high = Number(row.high) || 0

  const total = low + medium + high

  const normalizedRow = {
    ...row,
    low,
    medium,
    high,
    total,
  }

  const topKey =
    [...PRIORITY_SERIES]
      .reverse()
      .find(
        (series) =>
          normalizedRow[series.key] > 0,
      )
      ?.key ?? null

  return {
    ...normalizedRow,
    topKey,
  }
}