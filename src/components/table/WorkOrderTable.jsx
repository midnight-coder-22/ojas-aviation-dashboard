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
  CircleAlert,
} from 'lucide-react'

import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import ExpandedRow from './ExpandedRow'
import {
  formatAgeingCompact,
  formatDate,
} from '../../utils/formatters'

const ROWS_OPTIONS = [10, 25, 50]
const TABLE_COLUMN_COUNT = 13

/*
 * Fullscreen auto-scroll settings.
 *
 * The table continuously cycles through the current filtered and sorted rows.
 * Two empty rows separate the final entry from the next cycle's first entry.
 */
const AUTO_SCROLL_PIXELS_PER_SECOND = 18
const AUTO_SCROLL_START_DELAY_MS = 1500
const MAX_ANIMATION_FRAME_GAP_MS = 100
const FULLSCREEN_SPACER_ROW_COUNT = 2
const FULLSCREEN_SPACER_ROW_HEIGHT_PX = 52
const ESTIMATED_VISIBLE_ROW_CAPACITY = 18
const MAX_FULLSCREEN_CYCLE_COUNT = 8

/*
 * Fields that can be sorted by clicking their table headers.
 */
const SORTABLE_FIELDS = new Set([
  'wo_id',
  'wo_name',
  'dept_in_date',
  'wo_ageing_days',
  'wo_target_date',
  'dept_target_date',
  'dept_ageing_days',
  'planned_qty',
  'next_dept',
  'priority',
  'status',
])

const NUMERIC_FIELDS = new Set([
  'wo_ageing_days',
  'dept_ageing_days',
  'planned_qty',
])

const DATE_FIELDS = new Set([
  'dept_in_date',
  'wo_target_date',
  'dept_target_date',
])

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeWoId(value) {
  return normalizeText(value)
}

/*
 * The API normally returns has_active_flag as a boolean.
 * This also safely supports older numeric and string representations.
 */
function isActiveFlag(value) {
  if (value === true || value === 1) {
    return true
  }

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .toLowerCase()

    return [
      'true',
      '1',
      'yes',
      'y',
      'active',
    ].includes(normalized)
  }

  return false
}

function formatQuantity(value) {
  const normalized = normalizeText(value)

  if (!normalized) {
    return '—'
  }

  const numericValue = Number(value)

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString()
  }

  return normalized
}

/*
 * Convert a value into a valid sortable number.
 * Blank values remain null instead of accidentally becoming zero.
 */
function parseSortableNumber(value) {
  if (!normalizeText(value)) {
    return null
  }

  const numericValue = Number(value)

  return Number.isFinite(numericValue)
    ? numericValue
    : null
}

/*
 * Convert an API date into a timestamp used for chronological sorting.
 */
function parseSortableDate(value) {
  if (!normalizeText(value)) {
    return null
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp)
    ? timestamp
    : null
}

/*
 * Statuses eligible for overdue highlighting.
 *
 * The API currently uses New and InProcess, while the UI displays
 * them as Not Started and In Process. The normalized variants below
 * support both API and display-style values.
 */
const ACTIVE_DEADLINE_STATUSES = new Set([
  'new',
  'ongoing',
  'overdue',

  // Temporary rollout compatibility.
  'notstarted',
  'inprocess',
  'inprogress',
])

function normalizeStatusKey(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

/*
 * Convert an API date into a timezone-safe calendar-day value.
 *
 * The API normally returns YYYY-MM-DD values. Using the individual
 * year/month/day components prevents UTC conversion from changing
 * the date in the browser.
 */
function parseCalendarDay(value) {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  const datePart = normalized.slice(0, 10)

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    datePart,
  )

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const dayValue = Date.UTC(
    year,
    month - 1,
    day,
  )

  const parsedDate = new Date(dayValue)

  /*
   * Reject invalid dates such as 2026-02-31 instead of allowing
   * JavaScript to silently roll them into the following month.
   */
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

/*
 * Return the deadline state used to highlight the complete row.
 *
 * Precedence:
 * 1. WO target overdue -> red
 * 2. Department target overdue -> amber
 * 3. Otherwise -> no highlight
 */
function getDeadlineState(row) {
  const statusKey = normalizeStatusKey(
    row?.status,
  )

  if (
    !ACTIVE_DEADLINE_STATUSES.has(statusKey)
  ) {
    return null
  }

  const today = getTodayCalendarDay()

  const woTargetDay = parseCalendarDay(
    row?.wo_target_date,
  )

  if (
    woTargetDay !== null &&
    today > woTargetDay
  ) {
    return 'wo-overdue'
  }

  const departmentTargetDay =
    parseCalendarDay(
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

/*
 * Compare two rows while keeping blank values at the bottom for both
 * ascending and descending sorting.
 */
function compareValues(
  firstRow,
  secondRow,
  field,
  direction,
) {
  const multiplier =
    direction === 'asc' ? 1 : -1

  if (NUMERIC_FIELDS.has(field)) {
    const firstNumber =
      parseSortableNumber(
        firstRow?.[field],
      )

    const secondNumber =
      parseSortableNumber(
        secondRow?.[field],
      )

    if (
      firstNumber !== null &&
      secondNumber !== null
    ) {
      return (
        (firstNumber - secondNumber) *
        multiplier
      )
    }

    if (firstNumber !== null) {
      return -1
    }

    if (secondNumber !== null) {
      return 1
    }

    return 0
  }

  if (DATE_FIELDS.has(field)) {
    const firstTime =
      parseSortableDate(
        firstRow?.[field],
      )

    const secondTime =
      parseSortableDate(
        secondRow?.[field],
      )

    if (
      firstTime !== null &&
      secondTime !== null
    ) {
      return (
        (firstTime - secondTime) *
        multiplier
      )
    }

    if (firstTime !== null) {
      return -1
    }

    if (secondTime !== null) {
      return 1
    }

    return 0
  }

  const firstText = normalizeText(
    firstRow?.[field],
  )

  const secondText = normalizeText(
    secondRow?.[field],
  )

  if (!firstText && !secondText) {
    return 0
  }

  if (!firstText) {
    return 1
  }

  if (!secondText) {
    return -1
  }

  return (
    firstText.localeCompare(
      secondText,
      undefined,
      {
        numeric: true,
        sensitivity: 'base',
      },
    ) * multiplier
  )
}

function AlertBadge({ type }) {
  const styles = {
    MI: {
      className:
        'bg-orange-100 text-orange-700',
      label: 'MI',
    },
    QC: {
      className:
        'bg-blue-100 text-blue-700',
      label: 'QC',
    },
  }

  const style = styles[type]

  if (!style) {
    return null
  }

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md px-1.5 py-0.5
        text-xs font-semibold
        ${style.className}
      `}
    >
      {style.label}
    </span>
  )
}

export default function WorkOrderTable({
  data = [],
  flagMode = null,
  selectedWoIds = new Set(),
  onRowSelect = () => {},
  searchText = '',
  isFullscreen = false,
}) {
  const [sortField, setSortField] =
    useState('wo_ageing_days')

  const [sortDir, setSortDir] =
    useState('desc')

  const [page, setPage] = useState(1)

  const [perPage, setPerPage] =
    useState(10)

  const [expandedWoId, setExpandedWoId] =
    useState(null)

  const tableViewportRef = useRef(null)
  const firstCycleStartRef = useRef(null)
  const secondCycleStartRef = useRef(null)

  const safeData = useMemo(
    () =>
      Array.isArray(data)
        ? data
        : [],
    [data],
  )

  const normalizedSelectedWoIds =
    useMemo(() => {
      const values = Array.from(
        selectedWoIds ?? [],
      )

      return new Set(
        values
          .map(normalizeWoId)
          .filter(Boolean),
      )
    }, [selectedWoIds])

  /*
   * Search remains focused on work-order ID and work-order name.
   */
  const filtered = useMemo(() => {
    const query = normalizeText(
      searchText,
    ).toLowerCase()

    if (!query) {
      return safeData
    }

    return safeData.filter((row) => {
      const woId = normalizeText(
        row?.wo_id,
      ).toLowerCase()

      const woName = normalizeText(
        row?.wo_name,
      ).toLowerCase()

      return (
        woId.includes(query) ||
        woName.includes(query)
      )
    })
  }, [safeData, searchText])

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (firstRow, secondRow) =>
          compareValues(
            firstRow,
            secondRow,
            sortField,
            sortDir,
          ),
      ),
    [
      filtered,
      sortDir,
      sortField,
    ],
  )

  const totalPages = Math.max(
    1,
    Math.ceil(
      sorted.length / perPage,
    ),
  )

  /*
   * Keep the active page valid when filtering or data refresh changes
   * the number of available rows.
   */
  useEffect(() => {
    setPage((currentPage) =>
      Math.min(
        Math.max(currentPage, 1),
        totalPages,
      ),
    )
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [searchText])

  /*
   * Expanded-row mode and flag-selection mode are mutually exclusive.
   */
  useEffect(() => {
    if (flagMode) {
      setExpandedWoId(null)
    }
  }, [flagMode])

  /*
   * Fullscreen always begins in auto-scroll-ready mode, even if a row was
   * expanded immediately before the user entered fullscreen.
   */
  useEffect(() => {
    if (isFullscreen) {
      setExpandedWoId(null)
    }
  }, [isFullscreen])

  /*
   * Close the expanded row if it is no longer present after a refresh
   * or search operation.
   */
  useEffect(() => {
    if (!expandedWoId) {
      return
    }

    const rowStillExists = filtered.some(
      (row) =>
        normalizeWoId(row?.wo_id) ===
        expandedWoId,
    )

    if (!rowStillExists) {
      setExpandedWoId(null)
    }
  }, [expandedWoId, filtered])

  const pageStart =
    (page - 1) * perPage

  const pageData = useMemo(
    () =>
      sorted.slice(
        pageStart,
        pageStart + perPage,
      ),
    [pageStart, perPage, sorted],
  )

  /*
   * Normal mode uses the existing page slice. Fullscreen ignores pagination
   * and uses every row after the current filtering and sorting are applied.
   */
  const displayedRows = isFullscreen
    ? sorted
    : pageData

  /*
   * Fullscreen renders enough repeated cycles to keep the viewport scrollable
   * even when the current filter leaves only a small number of rows.
   * Large datasets use only two cycles to avoid unnecessary DOM growth.
   */
  const fullscreenCycleCount = useMemo(() => {
    if (!isFullscreen || sorted.length === 0) {
      return 1
    }

    const estimatedRowsPerCycle =
      sorted.length +
      FULLSCREEN_SPACER_ROW_COUNT

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

  /*
   * The repeated items form this visual sequence in fullscreen:
   * rows 1..N -> blank row -> blank row -> rows 1..N -> ...
   */
  const tableItems = useMemo(() => {
    if (!isFullscreen) {
      return pageData.map(
        (row, rowIndex) => ({
          type: 'row',
          row,
          rowIndex,
          cycleIndex: 0,
        }),
      )
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

      if (
        cycleIndex <
        fullscreenCycleCount - 1
      ) {
        for (
          let spacerIndex = 0;
          spacerIndex <
          FULLSCREEN_SPACER_ROW_COUNT;
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
  }, [
    fullscreenCycleCount,
    isFullscreen,
    pageData,
    sorted,
  ])

  const showingStart =
    sorted.length === 0
      ? 0
      : pageStart + 1

  const showingEnd = Math.min(
    pageStart + perPage,
    sorted.length,
  )

  /*
   * Start at the first row whenever fullscreen mode, sorting, or searching
   * changes. Exiting fullscreen also resets the normal table viewport.
   */
  useEffect(() => {
    const viewport = tableViewportRef.current

    if (!viewport) {
      return
    }

    viewport.scrollTop = 0
  }, [
    isFullscreen,
    searchText,
    sortDir,
    sortField,
    sorted,
  ])

  /*
   * Auto-scroll only the table viewport while the dashboard is fullscreen.
   *
   * Fullscreen contains repeated copies of the same filtered and sorted rows.
   * The distance between the first row of cycle one and the first row of cycle
   * two is one complete visual cycle, including the two blank separator rows.
   * When that distance is crossed, scrollTop is reduced by exactly one cycle.
   * Because the rows at both positions are identical, the reset is invisible
   * and the table appears to scroll forever.
   *
   * Auto-scroll pauses while a row is expanded or flag-selection mode is active.
   */
  useEffect(() => {
    const viewport = tableViewportRef.current

    if (
      !isFullscreen ||
      flagMode ||
      expandedWoId ||
      displayedRows.length === 0 ||
      !viewport
    ) {
      return undefined
    }

    let animationFrameId = null
    let previousTimestamp = null
    let intendedScrollTop =
      viewport.scrollTop
    let delayRemaining =
      AUTO_SCROLL_START_DELAY_MS

    const getCycleHeight = () => {
      const firstCycleStart =
        firstCycleStartRef.current
      const secondCycleStart =
        secondCycleStartRef.current

      if (
        !firstCycleStart ||
        !secondCycleStart
      ) {
        return 0
      }

      return Math.max(
        0,
        secondCycleStart.offsetTop -
          firstCycleStart.offsetTop,
      )
    }

    const normalizeToFirstCycle = (
      scrollTop,
      cycleHeight,
    ) => {
      if (cycleHeight <= 0) {
        return scrollTop
      }

      let normalizedScrollTop = scrollTop

      while (
        normalizedScrollTop >= cycleHeight
      ) {
        normalizedScrollTop -= cycleHeight
      }

      return normalizedScrollTop
    }

    const scrollFrame = (timestamp) => {
      if (previousTimestamp === null) {
        previousTimestamp = timestamp
        animationFrameId =
          window.requestAnimationFrame(
            scrollFrame,
          )
        return
      }

      const elapsedMilliseconds = Math.min(
        timestamp - previousTimestamp,
        MAX_ANIMATION_FRAME_GAP_MS,
      )

      previousTimestamp = timestamp

      if (delayRemaining > 0) {
        delayRemaining -= elapsedMilliseconds
        animationFrameId =
          window.requestAnimationFrame(
            scrollFrame,
          )
        return
      }

      const cycleHeight = getCycleHeight()
      const maximumScrollTop = Math.max(
        0,
        viewport.scrollHeight -
          viewport.clientHeight,
      )

      if (
        cycleHeight <= 0 ||
        maximumScrollTop <= 0
      ) {
        animationFrameId =
          window.requestAnimationFrame(
            scrollFrame,
          )
        return
      }

      /*
       * Respect manual scrolling. If the user moves the table, continue from
       * the equivalent position within the first logical cycle.
       */
      if (
        Math.abs(
          viewport.scrollTop -
            intendedScrollTop,
        ) > 2
      ) {
        intendedScrollTop =
          normalizeToFirstCycle(
            viewport.scrollTop,
            cycleHeight,
          )

        viewport.scrollTop =
          intendedScrollTop
      }

      const movement =
        (AUTO_SCROLL_PIXELS_PER_SECOND *
          elapsedMilliseconds) /
        1000

      intendedScrollTop =
        normalizeToFirstCycle(
          intendedScrollTop + movement,
          cycleHeight,
        )

      viewport.scrollTop =
        intendedScrollTop

      animationFrameId =
        window.requestAnimationFrame(
          scrollFrame,
        )
    }

    animationFrameId =
      window.requestAnimationFrame(
        scrollFrame,
      )

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
          animationFrameId,
        )
      }
    }
  }, [
    displayedRows.length,
    expandedWoId,
    flagMode,
    fullscreenCycleCount,
    isFullscreen,
    searchText,
    sortDir,
    sortField,
    sorted,
  ])

  const handleSort = (field) => {
    if (!SORTABLE_FIELDS.has(field)) {
      return
    }

    if (sortField === field) {
      setSortDir(
        (currentDirection) =>
          currentDirection === 'asc'
            ? 'desc'
            : 'asc',
      )
    } else {
      setSortField(field)
      setSortDir('desc')
    }

    setPage(1)
  }

  const handleRowClick = (row) => {
    const woId = normalizeWoId(
      row?.wo_id,
    )

    if (!woId) {
      return
    }

    const rowIsFlagged = isActiveFlag(
      row?.has_active_flag,
    )

    if (flagMode === 'add') {
      if (!rowIsFlagged) {
        onRowSelect(woId)
      }

      return
    }

    if (flagMode === 'resolve') {
      if (rowIsFlagged) {
        onRowSelect(woId)
      }

      return
    }

    setExpandedWoId(
      (currentWoId) =>
        currentWoId === woId
          ? null
          : woId,
    )
  }

  const getRowClass = (row) => {
    const rowIsFlagged = isActiveFlag(
      row?.has_active_flag,
    )

    const rowIsSelected =
      normalizedSelectedWoIds.has(
        normalizeWoId(row?.wo_id),
      )

    const deadlineState =
      getDeadlineState(row)

    let className =
      'border-b border-slate-100 transition-colors '

    /*
     * Flag-selection mode keeps its own colors because users need
     * to clearly see selectable, unavailable and selected rows.
     */
    if (flagMode === 'add') {
      if (rowIsFlagged) {
        return (
          className +
          'cursor-not-allowed border-l-2 border-red-400 bg-red-50'
        )
      }

      if (rowIsSelected) {
        return (
          className +
          'cursor-pointer border-l-2 border-orange-400 bg-orange-50'
        )
      }

      return (
        className +
        'cursor-pointer hover:bg-orange-50'
      )
    }

    if (flagMode === 'resolve') {
      if (!rowIsFlagged) {
        return (
          className +
          'cursor-not-allowed opacity-30'
        )
      }

      if (rowIsSelected) {
        return (
          className +
          'cursor-pointer border-l-2 border-green-400 bg-green-50'
        )
      }

      return (
        className +
        'cursor-pointer border-l-2 border-red-400 bg-red-50'
      )
    }

    /*
     * Preserve the active-flag marker without replacing the
     * deadline background.
     */
    if (rowIsFlagged) {
      className +=
        'border-l-2 border-red-400 '
    }

    /*
     * Overall WO target-date breach takes precedence over the
     * departmental target-date breach.
     */
    if (deadlineState === 'wo-overdue') {
      return (
        className +
        'cursor-pointer bg-red-100 hover:bg-red-200'
      )
    }

    if (
      deadlineState ===
      'department-overdue'
    ) {
      return (
        className +
        'cursor-pointer bg-amber-100 hover:bg-amber-200'
      )
    }

    return (
      className +
      'cursor-pointer hover:bg-slate-50'
    )
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return null
    }

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
    const isSortable =
      SORTABLE_FIELDS.has(field)

    const isActiveSort =
      sortField === field

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
        className={`
          whitespace-nowrap
          px-3 py-3
          text-xs font-semibold
          uppercase tracking-wide
          text-slate-500
          ${alignmentClass}
          ${className}
        `}
      >
        {isSortable ? (
          <button
            type="button"
            onClick={() =>
              handleSort(field)
            }
            className={`
              inline-flex items-center
              gap-0.5
              uppercase tracking-wide
              transition-colors
              hover:text-slate-800
              ${buttonAlignmentClass}
            `}
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
        className={`
          rounded-xl
          border border-slate-200
          ${
            isFullscreen
              ? 'min-h-0 flex-1 overflow-auto'
              : 'overflow-x-auto'
          }
        `}
      >
        <table className="w-full text-sm">
          <thead
            className="
              sticky top-0 z-10
              bg-slate-50
            "
          >
            <tr
              className="
                border-b
                border-slate-200
              "
            >
              <TableHeader field="wo_id">
                WO ID
              </TableHeader>

              <TableHeader field="wo_name">
                WO Name
              </TableHeader>

              <TableHeader field="dept_in_date">
                In Date
              </TableHeader>

              <TableHeader field="wo_ageing_days">
                WO Ageing
              </TableHeader>

              <TableHeader field="wo_target_date">
                WO Target Date
              </TableHeader>

              <TableHeader field="dept_target_date">
                Dept Target Date
              </TableHeader>

              <TableHeader field="dept_ageing_days">
                Dept Ageing
              </TableHeader>

              <TableHeader
                field="planned_qty"
                align="right"
              >
                Planned Qty
              </TableHeader>

              <TableHeader field="next_dept">
                Next Department
              </TableHeader>

              <TableHeader field="priority">
                Priority
              </TableHeader>

              <TableHeader field="status">
                Status
              </TableHeader>

              <TableHeader field="">
                Alerts
              </TableHeader>

              <TableHeader
                field=""
                align="center"
              >
                Flags
              </TableHeader>
            </tr>
          </thead>

          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMN_COUNT}
                  className="
                    px-4 py-10
                    text-center text-sm
                    text-slate-400
                  "
                >
                  No matching work orders.
                </td>
              </tr>
            ) : (
              tableItems.map((item) => {
                if (item.type === 'spacer') {
                  return (
                    <tr
                      key={`fullscreen-spacer-${item.cycleIndex}-${item.spacerIndex}`}
                      aria-hidden="true"
                      className="pointer-events-none bg-white"
                    >
                      <td
                        colSpan={TABLE_COLUMN_COUNT}
                        className="border-0 p-0"
                      >
                        <div
                          style={{
                            height:
                              FULLSCREEN_SPACER_ROW_HEIGHT_PX,
                          }}
                        />
                      </td>
                    </tr>
                  )
                }

                const {
                  row,
                  rowIndex,
                  cycleIndex,
                } = item

                const woId = normalizeWoId(
                  row?.wo_id,
                )

                const rowIsFlagged =
                  isActiveFlag(
                    row?.has_active_flag,
                  )

                const rowIsSelected =
                  normalizedSelectedWoIds.has(
                    woId,
                  )

                const rowKey = isFullscreen
                  ? `fullscreen-${cycleIndex}-${woId || 'row'}-${rowIndex}`
                  : `${woId || 'row'}-${rowIndex}`

                return (
                    <Fragment key={rowKey}>
                      <tr
                        ref={(node) => {
                          if (rowIndex !== 0) {
                            return
                          }

                          if (cycleIndex === 0) {
                            firstCycleStartRef.current =
                              node
                          }

                          if (cycleIndex === 1) {
                            secondCycleStartRef.current =
                              node
                          }
                        }}
                        onClick={() =>
                          handleRowClick(row)
                        }
                        className={getRowClass(
                          row,
                        )}
                        data-deadline-state={
                          getDeadlineState(row) ||
                          undefined
                        }
                        aria-selected={
                          rowIsSelected ||
                          undefined
                        }
                      >
                        <td className="px-3 py-3">
                          <span
                            className="
                              text-xs font-bold
                              tracking-wide
                              text-slate-800
                            "
                          >
                            {woId || '—'}
                          </span>
                        </td>

                        <td
                          className="
                            max-w-44
                            px-3 py-3
                          "
                        >
                          <span
                            className="
                              block truncate
                              text-sm
                              text-slate-700
                            "
                            title={normalizeText(
                              row?.wo_name,
                            )}
                          >
                            {normalizeText(
                              row?.wo_name,
                            ) || '—'}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                            text-sm
                            text-slate-600
                          "
                        >
                          {formatDate(
                            row?.dept_in_date,
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                          "
                        >
                          <span
                            className="
                              text-sm font-semibold
                              text-slate-700
                            "
                          >
                            {formatAgeingCompact(
                              row?.wo_ageing_days,
                            )}
                          </span>
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                            text-sm
                            text-slate-600
                          "
                        >
                          {formatDate(
                            row?.wo_target_date,
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                            text-sm
                            text-slate-600
                          "
                        >
                          {formatDate(
                            row?.dept_target_date,
                          )}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                          "
                        >
                          <span
                            className="
                              text-sm font-semibold
                              text-slate-700
                            "
                          >
                            {formatAgeingCompact(
                              row?.dept_ageing_days,
                            )}
                          </span>
                        </td>

                        <td
                          className="
                            px-3 py-3
                            text-right text-sm
                            text-slate-700
                          "
                        >
                          {formatQuantity(
                            row?.planned_qty,
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {row?.next_dept ? (
                            <span
                              className="
                                rounded-md
                                bg-slate-100
                                px-2 py-1
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-700
                              "
                            >
                              {row.next_dept}
                            </span>
                          ) : (
                            <span className="text-slate-300">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <PriorityBadge
                            priority={
                              row?.priority
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <StatusBadge
                            status={row?.status}
                          />
                        </td>

                        <td className="px-3 py-3">
                          <div
                            className="
                              flex items-center
                              gap-1.5
                            "
                          >
                            {row?.mi_alert && (
                              <AlertBadge type="MI" />
                            )}

                            {row?.qc_alert && (
                              <AlertBadge type="QC" />
                            )}

                            {!row?.mi_alert &&
                              !row?.qc_alert && (
                                <span className="text-sm text-slate-300">
                                  —
                                </span>
                              )}
                          </div>
                        </td>

                        <td
                          className="
                            px-3 py-3
                            text-center
                          "
                        >
                          {rowIsFlagged ? (
                            <span
                              title="This work order has an active flag"
                              aria-label="Active flag"
                              className="
                                inline-flex
                                h-7 w-7
                                items-center
                                justify-center
                                rounded-full
                                bg-red-50
                              "
                            >
                              <CircleAlert
                                size={19}
                                strokeWidth={2.5}
                                className="text-red-600"
                              />
                            </span>
                          ) : (
                            <span className="text-sm text-slate-300">
                              —
                            </span>
                          )}
                        </td>
                      </tr>

                      {!flagMode &&
                        expandedWoId === woId && (
                          <tr>
                            <td
                              colSpan={
                                TABLE_COLUMN_COUNT
                              }
                              className="p-0"
                            >
                              <ExpandedRow
                                row={row}
                              />
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

      {/*
       * Pagination remains exactly for normal mode and is removed only while
       * the dashboard is fullscreen.
       */}
      {!isFullscreen && (
        <div
          className="
            flex flex-wrap
            items-center
            justify-between
            gap-3 px-1 pt-4
          "
        >
          <div
            className="
              flex items-center
              gap-2 text-xs
              text-slate-500
            "
          >
            <label htmlFor="work-order-rows-per-page">
              Rows per page:
            </label>

            <select
              id="work-order-rows-per-page"
              value={perPage}
              onChange={(event) => {
                setPerPage(
                  Number(
                    event.target.value,
                  ),
                )
                setPage(1)
              }}
              className="
                rounded-lg
                border border-slate-200
                px-2 py-1
                text-xs
              "
            >
              {ROWS_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ),
              )}
            </select>
          </div>

          <div
            className="
              flex flex-wrap
              items-center
              gap-3
            "
          >
            <span className="text-xs text-slate-500">
              Showing {showingStart}–
              {showingEnd} of{' '}
              {sorted.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage(
                  (currentPage) =>
                    Math.max(
                      1,
                      currentPage - 1,
                    ),
                )
              }
              disabled={page <= 1}
              className="
                rounded-lg
                border border-slate-200
                px-3 py-1.5
                text-xs
                transition-colors
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setPage(
                  (currentPage) =>
                    Math.min(
                      totalPages,
                      currentPage + 1,
                    ),
                )
              }
              disabled={
                page >= totalPages ||
                sorted.length === 0
              }
              className="
                rounded-lg
                border border-slate-200
                px-3 py-1.5
                text-xs
                transition-colors
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
