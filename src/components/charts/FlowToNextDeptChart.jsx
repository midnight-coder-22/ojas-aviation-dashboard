import { useMemo } from 'react'

import StandardPriorityBarChart
  from './StandardPriorityBarChart'

import {
  addPriorityStackMeta,
  normalizePriorityKey,
} from '../../utils/priorityChart'

/*
 * Build one stacked bar per next department.
 *
 * Each bar is divided into:
 * - Low
 * - Medium
 * - High
 */
export default function FlowToNextDeptChart({
  data = [],
}) {
  const chartData = useMemo(() => {
    const departmentCounts = new Map()

    const safeRows = Array.isArray(data)
      ? data
      : []

    for (const workOrder of safeRows) {
      const nextDepartment = String(
        workOrder?.next_dept ?? '',
      ).trim()

      // Rows without a next department cannot participate in this chart.
      if (!nextDepartment) {
        continue
      }

      if (
        !departmentCounts.has(
          nextDepartment,
        )
      ) {
        departmentCounts.set(
          nextDepartment,
          {
            low: 0,
            medium: 0,
            high: 0,
          },
        )
      }

      const priorityKey =
        normalizePriorityKey(
          workOrder?.priority,
        )

      const priorityCounts =
        departmentCounts.get(
          nextDepartment,
        )

      priorityCounts[priorityKey] += 1
    }

    /*
     * StandardPriorityBarChart expects:
     * - low
     * - medium
     * - high
     * - total
     * - topKey
     *
     * addPriorityStackMeta adds total and topKey.
     */
    return Array.from(
      departmentCounts.entries(),
    )
      .map(
        ([
          nextDepartment,
          priorityCounts,
        ]) =>
          addPriorityStackMeta({
            name: nextDepartment,
            ...priorityCounts,
          }),
      )
      .sort(
        (first, second) =>
          second.total - first.total,
      )
  }, [data])

  return (
    <StandardPriorityBarChart
      data={chartData}
      categoryKey="name"
      emptyMessage="No next department data available"
      yAxisLabel="WO count"
    />
  )
}