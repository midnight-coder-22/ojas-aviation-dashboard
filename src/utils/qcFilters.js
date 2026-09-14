import {
  normalizePriority,
  normalizeText,
} from './dashboardFilters'
import {
  addPriorityStackMeta,
  addStackMeta,
  normalizePriorityKey,
} from './priorityChart'

export const QC_TYPES = ['Inward', 'Inline', 'Final']

export const QC_TYPE_BADGE_CLASSES = {
  Inward: 'bg-teal-100 text-teal-800',
  Inline: 'bg-blue-100 text-blue-700',
  Final: 'bg-violet-100 text-violet-700',
}

// CVD-validated pair; the badges above use the same hue families.
export const QC_TYPE_SERIES = [
  { key: 'inline', label: 'Inline', color: '#2a78d6' },
  { key: 'final', label: 'Final', color: '#4a3aa7' },
]

export const NO_DATE_BAND = 'No date'

export const QC_AGEING_BANDS = [
  { key: '0-3', color: '#22C55E' },
  { key: '4-7', color: '#F59E0B' },
  { key: '7+', color: '#EF4444' },
  { key: NO_DATE_BAND, color: '#94A3B8' },
]

export const ISSUE_STATUS_LABELS = {
  PENDING: 'Issue pending',
  PARTIAL: 'Issue partial',
  'NO WO': 'No WO',
}

export const ISSUE_STATUS_BADGE_CLASSES = {
  PENDING: 'bg-amber-100 text-amber-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  'NO WO': 'bg-slate-100 text-slate-600',
}

const SEARCH_FIELDS = [
  'wo_id',
  'item_no',
  'item_code',
  'item_desc',
  'grn_no',
  'invoice_no',
  'supplier_name',
  'source_dept',
  'wo_item_code',
]

export function isInwardRow(row) {
  return row?.qc_type === 'Inward'
}

export function getQcAgeingBand(row) {
  const value = row?.qc_ageing_days

  if (value === null || value === undefined || value === '') {
    return NO_DATE_BAND
  }

  const age = Number(value)

  if (!Number.isFinite(age)) return NO_DATE_BAND
  if (age <= 3) return '0-3'
  if (age <= 7) return '4-7'
  return '7+'
}

/* Adds the display fields the table sorts on, so each column sorts one field. */
export function prepareQcRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const isInward = isInwardRow(row)

    return {
      ...row,
      source_name: isInward ? row.supplier_name : row.source_dept,
      qc_qty: isInward ? row.grn_qty : row.planned_qty,
      qc_status: isInward
        ? ISSUE_STATUS_LABELS[row.issue_status] ?? row.issue_status
        : row.status,
    }
  })
}

export function searchQcRows(rows, searchText) {
  const query = normalizeText(searchText).toLowerCase()

  if (!query) return rows

  return rows.filter((row) =>
    SEARCH_FIELDS.some((field) =>
      normalizeText(row?.[field]).toLowerCase().includes(query),
    ),
  )
}

export function filterQcRows(rows, filters, omittedKeys = []) {
  const applies = (key) => Boolean(filters[key]) && !omittedKeys.includes(key)

  return rows.filter((row) => {
    if (applies('qcType') && row.qc_type !== filters.qcType) {
      return false
    }

    if (
      applies('ageingBand') &&
      getQcAgeingBand(row) !== filters.ageingBand
    ) {
      return false
    }

    if (
      applies('sourceDept') &&
      normalizeText(row.source_dept).toUpperCase() !==
        normalizeText(filters.sourceDept).toUpperCase()
    ) {
      return false
    }

    if (
      applies('priority') &&
      normalizePriority(row.priority) !== filters.priority
    ) {
      return false
    }

    return true
  })
}

function dropEmptyNoDateBand(chartRows, getTotal) {
  return chartRows.filter(
    (row) => row.name !== NO_DATE_BAND || getTotal(row) > 0,
  )
}

export function buildInwardAgeingData(rows) {
  const counts = Object.fromEntries(
    QC_AGEING_BANDS.map(({ key }) => [key, 0]),
  )

  for (const row of rows) counts[getQcAgeingBand(row)] += 1

  return dropEmptyNoDateBand(
    QC_AGEING_BANDS.map(({ key, color }) => ({
      name: key,
      value: counts[key],
      color,
    })),
    (row) => row.value,
  )
}

export function buildProcessAgeingData(rows) {
  const counts = Object.fromEntries(
    QC_AGEING_BANDS.map(({ key }) => [key, { inline: 0, final: 0 }]),
  )

  for (const row of rows) {
    const seriesKey = row.qc_type === 'Final' ? 'final' : 'inline'
    counts[getQcAgeingBand(row)][seriesKey] += 1
  }

  return dropEmptyNoDateBand(
    QC_AGEING_BANDS.map(({ key }) =>
      addStackMeta({ name: key, ...counts[key] }, QC_TYPE_SERIES),
    ),
    (row) => row.total,
  )
}

export function buildIncomingByDeptData(rows) {
  const counts = new Map()

  for (const row of rows) {
    const department = normalizeText(row.source_dept).toUpperCase()
    if (!department) continue

    const bucket = counts.get(department) ?? {
      name: department,
      low: 0,
      medium: 0,
      high: 0,
    }
    bucket[normalizePriorityKey(row.priority)] += 1
    counts.set(department, bucket)
  }

  return [...counts.values()]
    .map((bucket) => addPriorityStackMeta(bucket))
    .sort(
      (first, second) =>
        second.total - first.total ||
        first.name.localeCompare(second.name),
    )
}

/* One entry per WO for the flag toolbar; inward entries can repeat a WO. */
export function uniqueWorkOrders(rows) {
  const byWoId = new Map()

  for (const row of rows) {
    const woId = normalizeText(row.wo_id)
    if (!woId) continue

    byWoId.set(woId, {
      wo_id: woId,
      has_active_flag: Boolean(
        byWoId.get(woId)?.has_active_flag || row.has_active_flag,
      ),
    })
  }

  return [...byWoId.values()]
}
