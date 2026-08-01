import { useMemo } from 'react'

import StandardSingleBarChart from './StandardSingleBarChart'
import {
  getTargetHealth,
  TARGET_HEALTH_ORDER,
} from '../../utils/dashboardFilters'

const HEALTH_COLORS = {
  Overdue: '#EF4444',
  'Due Soon': '#F59E0B',
  'On Track': '#22C55E',
  'No Date': '#94A3B8',
}

export default function TargetHealthBarChart({
  workOrders = [],
  activeHealth = null,
  onHealthClick,
}) {
  const data = useMemo(() => {
    const counts = Object.fromEntries(
      TARGET_HEALTH_ORDER.map((label) => [label, 0]),
    )

    for (const row of workOrders) {
      counts[getTargetHealth(row)] += 1
    }

    return TARGET_HEALTH_ORDER.map((label) => ({
      name: label,
      value: counts[label],
      color: HEALTH_COLORS[label],
    }))
  }, [workOrders])

  return (
    <StandardSingleBarChart
      data={data}
      emptyMessage="No target-date data available"
      yAxisLabel="WO count"
      activeValue={activeHealth}
      onCategoryClick={onHealthClick}
    />
  )
}
