import { useMemo } from 'react'

import StandardPriorityBarChart from './StandardPriorityBarChart'
import {
  addPriorityStackMeta,
  normalizePriorityKey,
} from '../../utils/priorityChart'

export default function FlowToNextDeptChart({
  data = [],
  activeDepartment = null,
  activePriority = null,
  onDepartmentClick,
  onSegmentClick,
}) {
  const chartData = useMemo(() => {
    const departmentCounts = new Map()
    const safeRows = Array.isArray(data) ? data : []

    for (const workOrder of safeRows) {
      const nextDepartment = String(
        workOrder?.next_dept ?? '',
      ).trim()

      if (!nextDepartment) continue

      if (!departmentCounts.has(nextDepartment)) {
        departmentCounts.set(nextDepartment, {
          low: 0,
          medium: 0,
          high: 0,
        })
      }

      const priorityKey = normalizePriorityKey(workOrder?.priority)
      departmentCounts.get(nextDepartment)[priorityKey] += 1
    }

    return Array.from(departmentCounts.entries())
      .map(([nextDepartment, priorityCounts]) =>
        addPriorityStackMeta({
          name: nextDepartment,
          ...priorityCounts,
        }),
      )
      .sort((first, second) => second.total - first.total)
  }, [data])

  return (
    <StandardPriorityBarChart
      data={chartData}
      categoryKey="name"
      emptyMessage="No next department data available"
      yAxisLabel="WO count"
      activeCategory={activeDepartment}
      activePriority={activePriority}
      onCategoryClick={onDepartmentClick}
      onSegmentClick={onSegmentClick}
    />
  )
}
