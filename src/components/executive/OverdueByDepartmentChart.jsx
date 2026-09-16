import StandardPriorityBarChart from '../charts/StandardPriorityBarChart'
import { addStackMeta } from '../../utils/priorityChart'
import { toggleFilterValue } from '../../utils/dashboardFilters'
import { FLAG_STATUS_SERIES, buildOverdueByDeptData } from '../../utils/executiveFilters'

const FLAG_LABEL = { flagged: 'Flagged', unflagged: 'Unflagged' }

/*
 * KPI 1: overdue WOs per department, stacked flagged/unflagged. Flags have
 * no reason/type field in this system, so "breakdown of flags" is this
 * binary split - the only honest breakdown the data supports.
 */
export default function OverdueByDepartmentChart({ rows, filters, onSetFilter, onSetFilterGroup }) {
  const data = buildOverdueByDeptData(rows).map((row) => addStackMeta(row, FLAG_STATUS_SERIES))

  return (
    <StandardPriorityBarChart
      data={data}
      series={FLAG_STATUS_SERIES}
      seriesLabel="flag status"
      emptyMessage="No overdue work orders right now."
      yAxisLabel="Overdue WOs"
      activeCategory={filters.department}
      activePriority={filters.flaggedOnly ? FLAG_LABEL[filters.flaggedOnly] : null}
      onCategoryClick={(department) =>
        onSetFilter('department', toggleFilterValue(filters.department, department))
      }
      onSegmentClick={({ category, priority }) => {
        const wanted = priority === FLAG_LABEL.flagged ? 'flagged' : 'unflagged'
        const isSame = filters.department === category && filters.flaggedOnly === wanted
        onSetFilterGroup({
          department: isSame ? null : category,
          flaggedOnly: isSame ? null : wanted,
        })
      }}
    />
  )
}
