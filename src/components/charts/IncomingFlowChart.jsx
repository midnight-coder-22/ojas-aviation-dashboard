import { useMemo } from 'react'

import StandardPriorityBarChart from './StandardPriorityBarChart'
import { addPriorityStackMeta } from '../../utils/priorityChart'

export default function IncomingFlowChart({
  rows = [],
  activeSourceDepartment = null,
  activePriority = null,
  onSourceDepartmentClick,
  onSegmentClick,
}) {
  const chartData = useMemo(
    () =>
      rows
        .map((row) =>
          addPriorityStackMeta({
            name: row.source_department,
            low: Number(row.low) || 0,
            medium: Number(row.medium) || 0,
            high: Number(row.high) || 0,
          }),
        )
        .filter((row) => row.total > 0)
        .sort((first, second) => second.total - first.total),
    [rows],
  )

  return (
    <StandardPriorityBarChart
      data={chartData}
      categoryKey="name"
      emptyMessage="No work orders are currently incoming to this department."
      yAxisLabel="WO count"
      activeCategory={activeSourceDepartment}
      activePriority={activePriority}
      onCategoryClick={onSourceDepartmentClick}
      onSegmentClick={onSegmentClick}
    />
  )
}
