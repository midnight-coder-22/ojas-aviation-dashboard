import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import ExpandedRow from './ExpandedRow'
import {
  FLAGS_COLUMN,
  formatQuantity,
  getAgeingTextClass,
  isActiveFlag,
  renderDeptChip,
  renderTruncated,
} from './sharedColumns'
import {
  formatAgeingCompact,
  formatDate,
} from '../../utils/formatters'

const ROWS_OPTIONS = [10, 25, 50]

/*
 * A `sticky` column (Flags) stays pinned to the right edge while narrower
 * screens scroll the table sideways. Body cells inherit the row colour, so
 * every row branch in getRowClass sets an opaque background.
 */
const STICKY_HEADER_CLASS =
  'sticky right-0 z-20 bg-slate-50 shadow-[inset_1px_0_0_#e2e8f0]'
const STICKY_CELL_CLASS =
  'sticky right-0 z-[1] bg-inherit shadow-[inset_1px_0_0_#f1f5f9]'

/* Fullscreen infinite-scroll settings. */
const AUTO_SCROLL_PIXELS_PER_SECOND = 18
const AUTO_SCROLL_START_DELAY_MS = 1500
const MAX_ANIMATION_FRAME_GAP_MS = 100
const FULLSCREEN_SPACER_ROW_COUNT = 2
const FULLSCREEN_SPACER_ROW_HEIGHT_PX = 52
const ESTIMATED_VISIBLE_ROW_CAPACITY = 18
const MAX_FULLSCREEN_CYCLE_COUNT = 8

/*
 * Delayed is included because the backend now assigns it whenever the
 * department due date is before today for an unfinished work order.
 */
const ACTIVE_DEADLINE_STATUSES = new Set([
  'new',
  'ongoing',
  'delayed',
  'overdue',
  'notstarted',
  'inprocess',
  'inprogress',
])

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeWoId(value) {
  return normalizeText(value)
}

function normalizeStatusKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

function parseSortableNumber(value) {
  if (!normalizeText(value)) return null

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function parseSortableDate(value) {
  if (!normalizeText(value)) return null

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
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
  const dayValue = Date.UTC(year, month - 1, day)
  const parsedDate = new Date(dayValue)

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null
  }

  return dayValue
}

function getTodayCalendarDay() {
  const today = new Date()

  return Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )
}

function getDeadlineState(row) {
  const statusKey = normalizeStatusKey(row?.status)

  if (!ACTIVE_DEADLINE_STATUSES.has(statusKey)) return null

  const today = getTodayCalendarDay()
  const woTargetDay = parseCalendarDay(row?.wo_target_date)

  if (woTargetDay !== null && today > woTargetDay) {
    return 'wo-overdue'
  }

  const departmentTargetDay = parseCalendarDay(
    row?.dept_target_date,
  )

  if (
    departmentTargetDay !== null &&
    today > departmentTargetDay
  ) {
    return 'department-overdue'
  }

  return null
}

function compareValues(
  firstRow,
  secondRow,
  field,
  direction,
  sortType,
) {
  const multiplier = direction === 'asc' ? 1 : -1

  if (sortType === 'number') {
    const firstNumber = parseSortableNumber(firstRow?.[field])
    const secondNumber = parseSortableNumber(secondRow?.[field])

    if (firstNumber !== null && secondNumber !== null) {
      return (firstNumber - secondNumber) * multiplier
    }

    if (firstNumber !== null) return -1
    if (secondNumber !== null) return 1
    return 0
  }

  if (sortType === 'date') {
    const firstTime = parseSortableDate(firstRow?.[field])
    const secondTime = parseSortableDate(secondRow?.[field])

    if (firstTime !== null && secondTime !== null) {
      return (firstTime - secondTime) * multiplier
    }

    if (firstTime !== null) return -1
    if (secondTime !== null) return 1
    return 0
  }

  const firstText = normalizeText(firstRow?.[field])
  const secondText = normalizeText(secondRow?.[field])

  if (!firstText && !secondText) return 0
  if (!firstText) return 1
  if (!secondText) return -1

  return (
    firstText.localeCompare(secondText, undefined, {
      numeric: true,
      sensitivity: 'base',
    }) * multiplier
  )
}

function AlertBadge({ type }) {
  const styles = {
    MI: {
      className: 'bg-orange-100 text-orange-700',
      label: 'MI',
    },
    QC: {
      className: 'bg-blue-100 text-blue-700',
      label: 'QC',
    },
  }

  const style = styles[type]
  if (!style) return null

  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  )
}

/* Department dashboard columns; see sharedColumns.jsx for the column shape. */
const WORK_ORDER_COLUMNS = [
  {
    key: 'wo_id',
    label: 'WO ID',
    sortType: 'text',
    className: 'px-2 py-3 min-[1700px]:px-3',
    render: (row) => (
      <span className="text-xs font-bold tracking-wide text-slate-800">
        {normalizeWoId(row?.wo_id) || '—'}
      </span>
    ),
  },
  {
    key: 'item_code',
    label: 'Item Code',
    sortType: 'text',
    className:
      'whitespace-nowrap px-2 py-3 min-[1700px]:px-3 text-sm font-medium text-slate-700',
    render: (row) => renderTruncated(normalizeText(row?.item_code)),
  },
  {
    key: 'dept_in_date',
    label: 'In Date',
    sortType: 'date',
    className: 'whitespace-nowrap px-2 py-3 min-[1700px]:px-3 text-sm text-slate-600',
    render: (row) => formatDate(row?.dept_in_date),
  },
  {
    key: 'wo_ageing_days',
    label: 'WO Ageing',
    sortType: 'number',
    className: 'whitespace-nowrap px-2 py-3 min-[1700px]:px-3',
    render: (row) => (
      <span
        className={`text-sm font-semibold ${getAgeingTextClass(
          row?.wo_ageing_days,
          14,
          30,
        )}`}
      >
        {formatAgeingCompact(row?.wo_ageing_days)}
      </span>
    ),
  },
  {
    key: 'wo_target_date',
    label: 'WO Due Dt',
    sortType: 'date',
    className: 'whitespace-nowrap px-2 py-3 min-[1700px]:px-3 text-sm text-slate-600',
    render: (row) => formatDate(row?.wo_target_date),
  },
  {
    key: 'dept_target_date',
    label: 'Dept Due Dt',
    sortType: 'date',
    className: 'whitespace-nowrap px-2 py-3 min-[1700px]:px-3 text-sm text-slate-600',
    render: (row) => formatDate(row?.dept_target_date),
  },
  {
    key: 'dept_ageing_days',
    label: 'Dept Ageing',
    sortType: 'number',
    className: 'whitespace-nowrap px-2 py-3 min-[1700px]:px-3',
    render: (row) => (
      <span
        className={`text-sm font-semibold ${getAgeingTextClass(
          row?.dept_ageing_days,
          7,
          14,
        )}`}
      >
        {formatAgeingCompact(row?.dept_ageing_days)}
      </span>
    ),
  },
  {
    key: 'planned_qty',
    label: 'Qty',
    sortType: 'number',
    align: 'right',
    className: 'px-2 py-3 min-[1700px]:px-3 text-right text-sm text-slate-700',
    render: (row) => formatQuantity(row?.planned_qty),
  },
  {
    key: 'next_dept',
    label: 'Next Department',
    sortType: 'text',
    className: 'px-2 py-3 min-[1700px]:px-3',
    render: (row) => renderDeptChip(row?.next_dept),
  },
  {
    key: 'priority',
    label: 'Priority',
    sortType: 'text',
    className: 'px-2 py-3 min-[1700px]:px-3',
    render: (row) => <PriorityBadge priority={row?.priority} />,
  },
  {
    key: 'status',
    label: 'Status',
    sortType: 'text',
    className: 'px-2 py-3 min-[1700px]:px-3',
    render: (row) => <StatusBadge status={row?.status} />,
  },
  {
    key: 'alerts',
    label: 'Alerts',
    className: 'px-2 py-3 min-[1700px]:px-3',
    render: (row) => (
      <div className="flex items-center gap-1.5">
        {row?.mi_alert && <AlertBadge type="MI" />}
        {row?.qc_alert && <AlertBadge type="QC" />}

        {!row?.mi_alert && !row?.qc_alert && (
          <span className="text-sm text-slate-300">
            —
          </span>
        )}
      </div>
    ),
  },
  FLAGS_COLUMN,
]

const getWorkOrderRowId = (row) => normalizeWoId(row?.wo_id)

const renderWorkOrderExpandedRow = (row) => <ExpandedRow row={row} />

export default function WorkOrderTable({
  data = [],
  flagMode = null,
  selectedWoIds = new Set(),
  onRowSelect = () => {},
  searchText = '',
  isFullscreen = false,
  resetKey = '',
  columns = WORK_ORDER_COLUMNS,
  getRowId = getWorkOrderRowId,
  renderExpandedRow = renderWorkOrderExpandedRow,
  defaultSortField = 'wo_ageing_days',
  emptyMessage = 'No matching work orders.',
}) {
  const [sortField, setSortField] = useState(defaultSortField)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [expandedRowId, setExpandedRowId] = useState(null)

  const tableViewportRef = useRef(null)
  const firstCycleStartRef = useRef(null)
  const secondCycleStartRef = useRef(null)

  const sortTypes = useMemo(
    () =>
      new Map(
        columns
          .filter((column) => column.sortType)
          .map((column) => [column.key, column.sortType]),
      ),
    [columns],
  )

  const safeData = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data],
  )

  const normalizedSelectedWoIds = useMemo(() => {
    const values = Array.from(selectedWoIds ?? [])

    return new Set(
      values.map(normalizeWoId).filter(Boolean),
    )
  }, [selectedWoIds])

  /* Search by WO ID, Item Code, and retained API item fields. */
  const filtered = useMemo(() => {
    const query = normalizeText(searchText).toLowerCase()

    if (!query) return safeData

    return safeData.filter((row) => {
      const woId = normalizeText(row?.wo_id).toLowerCase()
      const itemCode = normalizeText(row?.item_code).toLowerCase()
      const itemNo = normalizeText(row?.item_no).toLowerCase()
      const woName = normalizeText(row?.wo_name).toLowerCase()

      return (
        woId.includes(query) ||
        itemCode.includes(query) ||
        itemNo.includes(query) ||
        woName.includes(query)
      )
    })
  }, [safeData, searchText])

  const sorted = useMemo(
    () =>
      [...filtered].sort((firstRow, secondRow) =>
        compareValues(
          firstRow,
          secondRow,
          sortField,
          sortDir,
          sortTypes.get(sortField),
        ),
      ),
    [filtered, sortDir, sortField, sortTypes],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / perPage),
  )

  useEffect(() => {
    setPage((currentPage) =>
      Math.min(Math.max(currentPage, 1), totalPages),
    )
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [searchText])

  useEffect(() => {
    setPage(1)
    setExpandedRowId(null)

    const viewport = tableViewportRef.current
    if (viewport) viewport.scrollTop = 0
  }, [resetKey])

  useEffect(() => {
    if (flagMode) setExpandedRowId(null)
  }, [flagMode])

  useEffect(() => {
    if (isFullscreen) setExpandedRowId(null)
  }, [isFullscreen])

  useEffect(() => {
    if (!expandedRowId) return

    const rowStillExists = filtered.some(
      (row) => getRowId(row) === expandedRowId,
    )

    if (!rowStillExists) setExpandedRowId(null)
  }, [expandedRowId, filtered, getRowId])

  const pageStart = (page - 1) * perPage

  const pageData = useMemo(
    () => sorted.slice(pageStart, pageStart + perPage),
    [pageStart, perPage, sorted],
  )

  const displayedRows = isFullscreen ? sorted : pageData

  const fullscreenCycleCount = useMemo(() => {
    if (!isFullscreen || sorted.length === 0) return 1

    const estimatedRowsPerCycle =
      sorted.length + FULLSCREEN_SPACER_ROW_COUNT

    const requiredCycleCount =
      1 +
      Math.ceil(
        ESTIMATED_VISIBLE_ROW_CAPACITY /
          estimatedRowsPerCycle,
      )

    return Math.min(
      MAX_FULLSCREEN_CYCLE_COUNT,
      Math.max(2, requiredCycleCount),
    )
  }, [isFullscreen, sorted.length])

  const tableItems = useMemo(() => {
    if (!isFullscreen) {
      return pageData.map((row, rowIndex) => ({
        type: 'row',
        row,
        rowIndex,
        cycleIndex: 0,
      }))
    }

    const items = []

    for (
      let cycleIndex = 0;
      cycleIndex < fullscreenCycleCount;
      cycleIndex += 1
    ) {
      sorted.forEach((row, rowIndex) => {
        items.push({
          type: 'row',
          row,
          rowIndex,
          cycleIndex,
        })
      })

      if (cycleIndex < fullscreenCycleCount - 1) {
        for (
          let spacerIndex = 0;
          spacerIndex < FULLSCREEN_SPACER_ROW_COUNT;
          spacerIndex += 1
        ) {
          items.push({
            type: 'spacer',
            spacerIndex,
            cycleIndex,
          })
        }
      }
    }

    return items
  }, [fullscreenCycleCount, isFullscreen, pageData, sorted])

  const showingStart = sorted.length === 0 ? 0 : pageStart + 1
  const showingEnd = Math.min(
    pageStart + perPage,
    sorted.length,
  )

  useEffect(() => {
    const viewport = tableViewportRef.current
    if (!viewport) return

    viewport.scrollTop = 0
  }, [isFullscreen, searchText, sortDir, sortField, sorted])

  /*
   * Infinite fullscreen scroll:
   * rows -> 2 blank rows -> same rows -> ...
   * Crossing the start of cycle two resets to the equivalent position
   * in cycle one, making the transition visually continuous.
   */
  useEffect(() => {
    const viewport = tableViewportRef.current

    if (
      !isFullscreen ||
      flagMode ||
      expandedRowId ||
      displayedRows.length === 0 ||
      !viewport
    ) {
      return undefined
    }

    let animationFrameId = null
    let previousTimestamp = null
    let intendedScrollTop = viewport.scrollTop
    let delayRemaining = AUTO_SCROLL_START_DELAY_MS

    const getCycleHeight = () => {
      const firstCycleStart = firstCycleStartRef.current
      const secondCycleStart = secondCycleStartRef.current

      if (!firstCycleStart || !secondCycleStart) return 0

      return Math.max(
        0,
        secondCycleStart.offsetTop - firstCycleStart.offsetTop,
      )
    }

    const normalizeToFirstCycle = (scrollTop, cycleHeight) => {
      if (cycleHeight <= 0) return scrollTop

      let normalizedScrollTop = scrollTop

      while (normalizedScrollTop >= cycleHeight) {
        normalizedScrollTop -= cycleHeight
      }

      return normalizedScrollTop
    }

    const scrollFrame = (timestamp) => {
      if (previousTimestamp === null) {
        previousTimestamp = timestamp
        animationFrameId = window.requestAnimationFrame(scrollFrame)
        return
      }

      const elapsedMilliseconds = Math.min(
        timestamp - previousTimestamp,
        MAX_ANIMATION_FRAME_GAP_MS,
      )

      previousTimestamp = timestamp

      if (delayRemaining > 0) {
        delayRemaining -= elapsedMilliseconds
        animationFrameId = window.requestAnimationFrame(scrollFrame)
        return
      }

      const cycleHeight = getCycleHeight()
      const maximumScrollTop = Math.max(
        0,
        viewport.scrollHeight - viewport.clientHeight,
      )

      if (cycleHeight <= 0 || maximumScrollTop <= 0) {
        animationFrameId = window.requestAnimationFrame(scrollFrame)
        return
      }

      if (
        Math.abs(viewport.scrollTop - intendedScrollTop) > 2
      ) {
        intendedScrollTop = normalizeToFirstCycle(
          viewport.scrollTop,
          cycleHeight,
        )
        viewport.scrollTop = intendedScrollTop
      }

      const movement =
        (AUTO_SCROLL_PIXELS_PER_SECOND * elapsedMilliseconds) /
        1000

      intendedScrollTop = normalizeToFirstCycle(
        intendedScrollTop + movement,
        cycleHeight,
      )
      viewport.scrollTop = intendedScrollTop

      animationFrameId = window.requestAnimationFrame(scrollFrame)
    }

    animationFrameId = window.requestAnimationFrame(scrollFrame)

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [
    displayedRows.length,
    expandedRowId,
    flagMode,
    fullscreenCycleCount,
    isFullscreen,
    searchText,
    sortDir,
    sortField,
    sorted,
  ])

  const handleSort = (field) => {
    if (!sortTypes.has(field)) return

    if (sortField === field) {
      setSortDir((currentDirection) =>
        currentDirection === 'asc' ? 'desc' : 'asc',
      )
    } else {
      setSortField(field)
      setSortDir('desc')
    }

    setPage(1)
  }

  const handleRowClick = (row) => {
    const woId = normalizeWoId(row?.wo_id)
    const rowIsFlagged = isActiveFlag(row?.has_active_flag)

    if (flagMode === 'add') {
      if (woId && !rowIsFlagged) onRowSelect(woId)
      return
    }

    if (flagMode === 'resolve') {
      if (woId && rowIsFlagged) onRowSelect(woId)
      return
    }

    const rowId = getRowId(row)
    if (!rowId) return

    setExpandedRowId((currentRowId) =>
      currentRowId === rowId ? null : rowId,
    )
  }

  const getRowClass = (row) => {
    const woId = normalizeWoId(row?.wo_id)
    const rowIsFlagged = isActiveFlag(row?.has_active_flag)
    const rowIsSelected = normalizedSelectedWoIds.has(woId)
    const deadlineState = getDeadlineState(row)

    let className =
      'border-b border-slate-100 transition-colors '

    if (flagMode === 'add') {
      if (!woId) {
        return className + 'cursor-not-allowed bg-white opacity-30'
      }

      if (rowIsFlagged) {
        return (
          className +
          'cursor-not-allowed border-l-2 border-red-400 bg-red-50'
        )
      }

      if (rowIsSelected) {
        return (
          className +
          'cursor-pointer border-l-2 border-orange-400 bg-orange-100'
        )
      }

      return className + 'cursor-pointer bg-white hover:bg-orange-50'
    }

    if (flagMode === 'resolve') {
      if (!rowIsFlagged) {
        return className + 'cursor-not-allowed bg-white opacity-30'
      }

      if (rowIsSelected) {
        return (
          className +
          'cursor-pointer border-l-2 border-green-400 bg-green-100'
        )
      }

      return (
        className +
        'cursor-pointer border-l-2 border-red-400 bg-red-50'
      )
    }

    if (rowIsFlagged) {
      className += 'border-l-2 border-red-400 '
    }

    if (deadlineState === 'wo-overdue') {
      return className + 'cursor-pointer bg-red-100 hover:bg-red-200'
    }

    if (deadlineState === 'department-overdue') {
      return (
        className +
        'cursor-pointer bg-amber-100 hover:bg-amber-200'
      )
    }

    return className + 'cursor-pointer bg-white hover:bg-slate-50'
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null

    return sortDir === 'asc' ? (
      <ChevronUp
        size={11}
        className="ml-0.5 text-orange-500"
      />
    ) : (
      <ChevronDown
        size={11}
        className="ml-0.5 text-orange-500"
      />
    )
  }

  const TableHeader = ({
    field,
    children,
    className = '',
    align = 'left',
  }) => {
    const isSortable = sortTypes.has(field)
    const isActiveSort = sortField === field

    const alignmentClass =
      align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left'

    const buttonAlignmentClass =
      align === 'right'
        ? 'justify-end'
        : align === 'center'
          ? 'justify-center'
          : 'justify-start'

    return (
      <th
        scope="col"
        aria-sort={
          isActiveSort
            ? sortDir === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }
        className={`whitespace-nowrap px-2 py-3 min-[1700px]:px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${alignmentClass} ${className}`}
      >
        {isSortable ? (
          <button
            type="button"
            onClick={() => handleSort(field)}
            className={`inline-flex items-center gap-0.5 uppercase tracking-wide transition-colors hover:text-slate-800 ${buttonAlignmentClass}`}
          >
            {children}
            <SortIcon field={field} />
          </button>
        ) : (
          children
        )}
      </th>
    )
  }

  return (
    <div
      className={
        isFullscreen
          ? 'flex min-h-0 min-w-0 flex-1 flex-col'
          : 'min-w-0'
      }
    >
      <div
        ref={tableViewportRef}
        className={`rounded-xl border border-slate-200 ${
          isFullscreen
            ? 'fullscreen-table-scroll min-h-0 flex-1 overflow-auto'
            : 'overflow-x-auto'
        }`}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  field={column.sortType ? column.key : ''}
                  align={column.align}
                  className={column.sticky ? STICKY_HEADER_CLASS : ''}
                >
                  {column.label}
                </TableHeader>
              ))}
            </tr>
          </thead>

          <tbody>
            {tableItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              tableItems.map((item) => {
                if (item.type === 'spacer') {
                  return (
                    <tr
                      key={`spacer-${item.cycleIndex}-${item.spacerIndex}`}
                      aria-hidden="true"
                    >
                      <td
                        colSpan={columns.length}
                        style={{
                          height: `${FULLSCREEN_SPACER_ROW_HEIGHT_PX}px`,
                        }}
                      />
                    </tr>
                  )
                }

                const {
                  row,
                  rowIndex,
                  cycleIndex,
                } = item
                const rowId = getRowId(row)
                const rowIsSelected =
                  normalizedSelectedWoIds.has(
                    normalizeWoId(row?.wo_id),
                  )

                const rowKey = isFullscreen
                  ? `fullscreen-${cycleIndex}-${rowId || 'row'}-${rowIndex}`
                  : `${rowId || 'row'}-${rowIndex}`

                return (
                  <Fragment key={rowKey}>
                    <tr
                      ref={(node) => {
                        if (rowIndex !== 0) return

                        if (cycleIndex === 0) {
                          firstCycleStartRef.current = node
                        }

                        if (cycleIndex === 1) {
                          secondCycleStartRef.current = node
                        }
                      }}
                      onClick={() => handleRowClick(row)}
                      className={getRowClass(row)}
                      data-deadline-state={
                        getDeadlineState(row) || undefined
                      }
                      aria-selected={rowIsSelected || undefined}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={
                            column.sticky
                              ? `${column.className} ${STICKY_CELL_CLASS}`
                              : column.className
                          }
                        >
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>

                    {!flagMode && expandedRowId === rowId && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="p-0"
                        >
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <label htmlFor="work-order-rows-per-page">
              Rows per page:
            </label>

            <select
              id="work-order-rows-per-page"
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value))
                setPage(1)
              }}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {ROWS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">
              Showing {showingStart}–{showingEnd} of {sorted.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.max(1, currentPage - 1),
                )
              }
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(totalPages, currentPage + 1),
                )
              }
              disabled={
                page >= totalPages || sorted.length === 0
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
