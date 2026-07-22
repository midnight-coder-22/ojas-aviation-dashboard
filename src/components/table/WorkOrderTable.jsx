import {
  Fragment,
  useEffect,
  useMemo,
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

const SORTABLE_FIELDS = new Set([
  'wo_id',
  'wo_name',
  'dept_in_date',
  'wo_ageing_days',
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

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeWoId(value) {
  return normalizeText(value)
}

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
  if (
    value === null ||
    value === undefined ||
    normalizeText(value) === ''
  ) {
    return '—'
  }

  const numericValue = Number(value)

  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString()
  }

  return String(value)
}

function compareValues(
  firstRow,
  secondRow,
  field,
  direction,
) {
  const multiplier =
    direction === 'asc' ? 1 : -1

  if (NUMERIC_FIELDS.has(field)) {
    const firstNumber = Number(
      firstRow?.[field],
    )
    const secondNumber = Number(
      secondRow?.[field],
    )

    const firstIsValid =
      Number.isFinite(firstNumber)
    const secondIsValid =
      Number.isFinite(secondNumber)

    if (firstIsValid && secondIsValid) {
      return (
        (firstNumber - secondNumber) *
        multiplier
      )
    }

    if (firstIsValid) return -1
    if (secondIsValid) return 1
  }

  if (field === 'dept_in_date') {
    const firstTime = Date.parse(
      firstRow?.[field] ?? '',
    )
    const secondTime = Date.parse(
      secondRow?.[field] ?? '',
    )

    const firstIsValid =
      Number.isFinite(firstTime)
    const secondIsValid =
      Number.isFinite(secondTime)

    if (firstIsValid && secondIsValid) {
      return (
        (firstTime - secondTime) *
        multiplier
      )
    }

    if (firstIsValid) return -1
    if (secondIsValid) return 1
  }

  const firstText = normalizeText(
    firstRow?.[field],
  )
  const secondText = normalizeText(
    secondRow?.[field],
  )

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

  if (!style) return null

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
}) {
  const [sortField, setSortField] =
    useState('wo_ageing_days')

  const [sortDir, setSortDir] =
    useState('desc')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] =
    useState(10)

  const [expanded, setExpanded] =
    useState(null)

  const normalizedSelectedWoIds =
    useMemo(
      () =>
        new Set(
          Array.from(
            selectedWoIds ?? [],
          ).map(normalizeWoId),
        ),
      [selectedWoIds],
    )

  const filtered = useMemo(() => {
    const query = normalizeText(
      searchText,
    ).toLowerCase()

    if (!query) {
      return data
    }

    return data.filter((row) => {
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
  }, [data, searchText])

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

  useEffect(() => {
    if (flagMode) {
      setExpanded(null)
    }
  }, [flagMode])

  const pageStart =
    (page - 1) * perPage

  const pageData = sorted.slice(
    pageStart,
    pageStart + perPage,
  )

  const showingStart =
    sorted.length === 0
      ? 0
      : pageStart + 1

  const showingEnd = Math.min(
    pageStart + perPage,
    sorted.length,
  )

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
    const rowIsFlagged =
      isActiveFlag(
        row?.has_active_flag,
      )

    if (flagMode === 'add') {
      if (!rowIsFlagged) {
        onRowSelect(row.wo_id)
      }

      return
    }

    if (flagMode === 'resolve') {
      if (rowIsFlagged) {
        onRowSelect(row.wo_id)
      }

      return
    }

    setExpanded(
      (currentWoId) =>
        currentWoId === row.wo_id
          ? null
          : row.wo_id,
    )
  }

  const getRowClass = (row) => {
    const rowIsFlagged =
      isActiveFlag(
        row?.has_active_flag,
      )

    const rowIsSelected =
      normalizedSelectedWoIds.has(
        normalizeWoId(row?.wo_id),
      )

    let className =
      'border-b border-slate-100 transition-colors '

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

    if (rowIsFlagged) {
      className +=
        'border-l-2 border-red-400 '
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
        className="
          ml-0.5 inline
          text-orange-500
        "
      />
    ) : (
      <ChevronDown
        size={11}
        className="
          ml-0.5 inline
          text-orange-500
        "
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

    const alignmentClass =
      align === 'right'
        ? 'text-right'
        : align === 'center'
          ? 'text-center'
          : 'text-left'

    return (
      <th
        scope="col"
        onClick={() =>
          handleSort(field)
        }
        className={`
          whitespace-nowrap
          px-3 py-3
          text-xs font-semibold
          uppercase tracking-wide
          text-slate-500
          ${alignmentClass}
          ${
            isSortable
              ? 'cursor-pointer select-none hover:text-slate-800'
              : ''
          }
          ${className}
        `}
      >
        {children}

        {isSortable && (
          <SortIcon field={field} />
        )}
      </th>
    )
  }

  return (
    <div className="min-w-0">
      <div
        className="
          overflow-x-auto
          rounded-xl
          border border-slate-200
        "
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

              <th
                scope="col"
                className="
                  whitespace-nowrap
                  px-3 py-3
                  text-left text-xs
                  font-semibold uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                WO Target Date
              </th>

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

              <th
                scope="col"
                className="
                  px-3 py-3
                  text-left text-xs
                  font-semibold uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                Alerts
              </th>

              <th
                scope="col"
                className="
                  px-3 py-3
                  text-center text-xs
                  font-semibold uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                Flags
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
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
              pageData.map(
                (row, rowIndex) => {
                  const rowIsFlagged =
                    isActiveFlag(
                      row?.has_active_flag,
                    )

                  const rowKey =
                    normalizeWoId(
                      row?.wo_id,
                    ) ||
                    `${page}-${rowIndex}`

                  const rowIsSelected =
                    normalizedSelectedWoIds.has(
                      normalizeWoId(
                        row?.wo_id,
                      ),
                    )

                  return (
                    <Fragment key={rowKey}>
                      <tr
                        onClick={() =>
                          handleRowClick(
                            row,
                          )
                        }
                        className={getRowClass(
                          row,
                        )}
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
                            {normalizeText(
                              row?.wo_id,
                            ) || '—'}
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
                            className={`
                              text-sm
                              font-semibold
                              ${
                                Number(
                                  row?.wo_ageing_days,
                                ) > 30
                                  ? 'text-red-500'
                                  : Number(
                                        row?.wo_ageing_days,
                                      ) > 14
                                    ? 'text-amber-500'
                                    : 'text-slate-600'
                              }
                            `}
                          >
                            {formatAgeingCompact(
                              row?.wo_ageing_days,
                            )}
                          </span>
                        </td>

                        <td
                          className="
                            px-3 py-3
                            text-sm
                            text-slate-400
                          "
                        >
                          —
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-3 py-3
                          "
                        >
                          <span
                            className={`
                              text-sm
                              font-semibold
                              ${
                                Number(
                                  row?.dept_ageing_days,
                                ) > 14
                                  ? 'text-red-500'
                                  : Number(
                                        row?.dept_ageing_days,
                                      ) > 7
                                    ? 'text-amber-500'
                                    : row?.dept_ageing_days !==
                                          null &&
                                        row?.dept_ageing_days !==
                                          undefined
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                              }
                            `}
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
                            <span
                              className="
                                text-slate-300
                              "
                            >
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
                            status={
                              row?.status
                            }
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
                                <span
                                  className="
                                    text-sm
                                    text-slate-300
                                  "
                                >
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
                                className="
                                  text-red-600
                                "
                              />
                            </span>
                          ) : (
                            <span
                              className="
                                text-sm
                                text-slate-300
                              "
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>

                      {!flagMode &&
                        expanded ===
                          row.wo_id && (
                          <tr>
                            <td
                              colSpan={12}
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
                },
              )
            )}
          </tbody>
        </table>
      </div>

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
              border
              border-slate-200
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
          <span
            className="
              text-xs
              text-slate-500
            "
          >
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
              border
              border-slate-200
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
              border
              border-slate-200
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
    </div>
  )
}