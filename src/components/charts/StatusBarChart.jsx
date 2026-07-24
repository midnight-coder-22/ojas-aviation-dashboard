import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  CHART_COLORS,
  STATUS_DISPLAY,
} from '../../utils/constants'

const STATUS_ORDER = [
  'New',
  'InProcess',
  'Completed',
  'Unknown',
]

const PRIORITY_ORDER = [
  'Low',
  'Medium',
  'High',
]

// Match the width and corner rounding used by Flow to Next Dept.
const BAR_WIDTH = 36
const BAR_RADIUS = 5

/**
 * Converts null, undefined, and empty values into a fallback value.
 */
function cleanValue(value, fallback) {
  if (value === null || value === undefined) {
    return fallback
  }

  const cleaned = String(value).trim()

  return cleaned || fallback
}

/**
 * Ensures the dashboard receives only the three supported priority values.
 *
 * Missing, blank, numeric, or unsupported source values default to Low.
 */
function normalizePriority(value) {
  const cleaned = String(value ?? '')
    .trim()
    .toLowerCase()

  if (cleaned === 'high') {
    return 'High'
  }

  if (cleaned === 'medium') {
    return 'Medium'
  }

  return 'Low'
}

/**
 * Converts work-order rows into stacked chart data grouped by:
 *
 * Status -> Priority -> Count
 */
function buildStatusPriorityData(workOrders) {
  const statusPriorityCounts = {}
  const discoveredStatuses = []
  const discoveredPriorities = []

  for (const workOrder of workOrders) {
    const status = cleanValue(
      workOrder.status,
      'Unknown',
    )

    const priority = normalizePriority(
      workOrder.priority,
    )

    if (!statusPriorityCounts[status]) {
      statusPriorityCounts[status] = {}
    }

    statusPriorityCounts[status][priority] =
      (statusPriorityCounts[status][priority] || 0) + 1

    if (!discoveredStatuses.includes(status)) {
      discoveredStatuses.push(status)
    }

    if (!discoveredPriorities.includes(priority)) {
      discoveredPriorities.push(priority)
    }
  }

  // Keep known statuses in a consistent order while still supporting
  // any unexpected status returned by the source data.
  const orderedStatuses = [
    ...STATUS_ORDER.filter((status) =>
      discoveredStatuses.includes(status),
    ),
    ...discoveredStatuses.filter(
      (status) => !STATUS_ORDER.includes(status),
    ),
  ]

  const orderedPriorities = PRIORITY_ORDER.filter(
    (priority) =>
      discoveredPriorities.includes(priority),
  )

  const data = orderedStatuses.map((status) => {
    const row = {
      status,
      name: STATUS_DISPLAY[status] || status,
      total: 0,
    }

    for (const priority of orderedPriorities) {
      const count =
        statusPriorityCounts[status]?.[priority] || 0

      row[priority] = count
      row.total += count
    }

    /*
     * Only the highest visible segment of a stacked bar should have
     * rounded upper corners. Internal stack boundaries remain flat.
     */
    row.topPriority =
      [...PRIORITY_ORDER]
        .reverse()
        .find((priority) => row[priority] > 0) ??
      null

    return row
  })

  return {
    data,
    priorities: orderedPriorities,
  }
}

/**
 * Returns the configured dashboard colour for a priority.
 */
function getPriorityColor(priority) {
  return (
    CHART_COLORS.priority[priority] ||
    CHART_COLORS.priority.Low ||
    '#22C55E'
  )
}

/**
 * Custom stacked-bar segment.
 *
 * The top visible priority segment receives rounded upper corners,
 * matching the visual style of the Flow to Next Dept chart.
 */
function RoundedStackSegment({
  x,
  y,
  width,
  height,
  fill,
  payload,
  priority,
}) {
  const numericHeight = Number(height)

  if (
    !Number.isFinite(numericHeight) ||
    numericHeight <= 0
  ) {
    return null
  }

  const isTopSegment =
    payload?.topPriority === priority

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={
        isTopSegment
          ? [BAR_RADIUS, BAR_RADIUS, 0, 0]
          : [0, 0, 0, 0]
      }
    />
  )
}

/**
 * Tooltip displaying the priority breakdown and total for one status.
 */
function PriorityTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null
  }

  const visibleItems = payload.filter(
    (entry) =>
      entry.dataKey !== 'total' &&
      Number(entry.value) > 0,
  )

  const total =
    payload[0]?.payload?.total ?? 0

  return (
    <div className="min-w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">
        {label}
      </p>

      <div className="space-y-1.5">
        {visibleItems.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-5"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: entry.color,
                }}
              />

              {entry.dataKey}
            </span>

            <span className="font-semibold text-slate-800">
              {entry.value}
            </span>
          </div>
        ))}

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="font-medium text-slate-500">
            Total
          </span>

          <span className="font-bold text-slate-900">
            {total}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function StatusBarChart({
  workOrders = [],
}) {
  const { data, priorities } = useMemo(
    () => buildStatusPriorityData(workOrders),
    [workOrders],
  )

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        No status data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{
          top: 8,
          right: 8,
          bottom: 0,
          left: 0,
        }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#F1F5F9"
        />

        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{
            fontSize: 11,
            fill: '#64748B',
          }}
        />

        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={28}
          tick={{
            fontSize: 10,
            fill: '#94A3B8',
          }}
        />

        <Tooltip
          content={<PriorityTooltip />}
          cursor={{
            fill: '#F8FAFC',
          }}
        />

        <Legend
          verticalAlign="bottom"
          iconType="square"
          iconSize={8}
          wrapperStyle={{
            paddingTop: 8,
            fontSize: 11,
            color: '#64748B',
          }}
        />

        {priorities.map((priority) => (
          <Bar
            key={priority}
            dataKey={priority}
            name={priority}
            stackId="priority"
            fill={getPriorityColor(priority)}
            barSize={BAR_WIDTH}
            shape={(shapeProps) => (
              <RoundedStackSegment
                {...shapeProps}
                priority={priority}
              />
            )}
            isAnimationActive
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}