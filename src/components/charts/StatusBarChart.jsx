import { useMemo } from 'react'

import StandardPriorityBarChart from './StandardPriorityBarChart'
import { STATUS_DISPLAY } from '../../utils/constants'
import {
  addPriorityStackMeta,
  normalizePriorityKey,
} from '../../utils/priorityChart'
import { normalizeStatus } from '../../utils/dashboardFilters'

const STATUS_ORDER = ['New', 'Ongoing', 'Overdue', 'Completed']

export default function StatusBarChart({
  workOrders = [],
  activeStatus = null,
  activePriority = null,
  onStatusClick,
  onSegmentClick,
}) {
  const chartData = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_ORDER.map((status) => [
        status,
        { low: 0, medium: 0, high: 0 },
      ]),
    )

    for (const workOrder of workOrders) {
      const status = normalizeStatus(workOrder.status)
      const priorityKey = normalizePriorityKey(workOrder.priority)
      counts[status][priorityKey] += 1
    }

    return STATUS_ORDER.map((status) =>
      addPriorityStackMeta({
        status,
        name: STATUS_DISPLAY[status] || status,
        ...counts[status],
      }),
    )
  }, [workOrders])

  return (
    <StandardPriorityBarChart
      data={chartData}
      categoryKey="name"
      emptyMessage="No status data available"
      yAxisLabel="WO count"
      activeCategory={activeStatus}
      activePriority={activePriority}
      onCategoryClick={onStatusClick}
      onSegmentClick={onSegmentClick}
    />
  )
}
