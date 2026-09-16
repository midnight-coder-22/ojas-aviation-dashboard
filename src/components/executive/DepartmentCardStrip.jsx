import { Flag } from 'lucide-react'
import { CHART_COLORS, deptToSlug } from '../../utils/constants'
import { toggleFilterValue } from '../../utils/dashboardFilters'

const STATUS_ORDER = ['New', 'Ongoing', 'Delayed', 'Overdue', 'Completed']

function getStatusCount(breakdown, status) {
  if (status === 'Ongoing') return Number(breakdown?.Ongoing ?? breakdown?.InProcess ?? 0)
  return Number(breakdown?.[status] ?? 0)
}

/*
 * The upper strip (KPI 0): one compact row, all 6 departments. No separate
 * legend-text row under the status bar (that's what made the old 3-column
 * card grid tall) - a title attribute gives the exact per-segment count on
 * hover instead, to keep this to "minimum height, reasonable aesthetics."
 *
 * Single-click anywhere on a card sets the department filter (or a specific
 * status/flag value, if that's what was clicked); double-click the
 * department name navigates to its own dashboard.
 */
export default function DepartmentCardStrip({
  summaries = [],
  filters,
  onSetFilter,
  onSetFilterGroup,
  onNavigateDepartment,
}) {
  const selectDepartment = (department) => {
    onSetFilter('department', toggleFilterValue(filters.department, department))
  }

  const selectStatus = (department, status) => {
    const isSame = filters.department === department && filters.status === status
    onSetFilterGroup({
      department: isSame ? null : department,
      status: isSame ? null : status,
    })
  }

  const selectFlagged = (department) => {
    const isSame = filters.department === department && filters.flaggedOnly === 'flagged'
    onSetFilterGroup({
      department: isSame ? null : department,
      flaggedOnly: isSame ? null : 'flagged',
    })
  }

  return (
    <div className="flex gap-3">
      {summaries.map((summary) => {
        const total = summary.total_wos
        const isEmpty = total === 0
        const isActiveDept = filters.department === summary.department

        return (
          <div
            key={summary.department}
            onClick={() => selectDepartment(summary.department)}
            className={`min-w-0 flex-1 cursor-pointer rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-all
              ${isActiveDept ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200 hover:border-orange-200'}
              ${isEmpty ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onNavigateDepartment(deptToSlug(summary.department))
                }}
                title="Double-click to open this department's dashboard"
                className="truncate text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-orange-600 hover:underline decoration-dotted underline-offset-2"
              >
                {summary.department}
              </button>

              <span
                onClick={(event) => {
                  event.stopPropagation()
                  selectFlagged(summary.department)
                }}
                title={`${summary.flagged_count} flagged`}
                className={`flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold
                  ${summary.flagged_count > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}
              >
                <Flag size={9} />
                {summary.flagged_count}
              </span>
            </div>

            <p className="mt-0.5 text-2xl font-bold leading-none text-slate-900">
              {isEmpty ? <span className="text-sm font-medium text-slate-400">No WOs</span> : total}
            </p>

            {!isEmpty && (
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                {STATUS_ORDER.map((status) => {
                  const count = getStatusCount(summary.status_breakdown, status)
                  if (count === 0) return null
                  const isActiveSegment = isActiveDept && filters.status === status

                  return (
                    <div
                      key={status}
                      onClick={(event) => {
                        event.stopPropagation()
                        selectStatus(summary.department, status)
                      }}
                      title={`${status}: ${count}`}
                      style={{
                        width: `${(count / total) * 100}%`,
                        backgroundColor: CHART_COLORS.status[status],
                        opacity: filters.status && !isActiveSegment ? 0.35 : 1,
                      }}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
