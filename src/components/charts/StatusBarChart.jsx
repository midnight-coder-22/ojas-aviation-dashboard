import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  CHART_COLORS,
  STATUS_DISPLAY,
} from '../../utils/constants'

import LabeledRoundedStackSegment
  from './LabeledRoundedStackSegment'

import {
  getIntegerAxisScale,
} from '../../utils/chartScale'


const STATUS_ORDER = [
  'New',
  'Ongoing',
  'Overdue',
  'Completed',
]

const PRIORITY_ORDER = [
  'Low',
  'Medium',
  'High',
]


/**
 * Converts null, undefined, and empty values into a fallback value.
 */
// function cleanValue(value, fallback) {
//   if (value === null || value === undefined) {
//     return fallback
//   }

//   const cleaned = String(value).trim()

//   return cleaned || fallback
// }

function normalizeStatus(value) {
  const statusKey = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  const statusMap = {
    new: 'New',
    notstarted: 'New',

    inprocess: 'Ongoing',
    inprogress: 'Ongoing',
    ongoing: 'Ongoing',

    overdue: 'Overdue',

    completed: 'Completed',
    complete: 'Completed',
    done: 'Completed',
  }

  return statusMap[statusKey] || 'New'
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

function buildStatusPriorityData(
  workOrders,
) {
  const statusPriorityCounts = {}

  for (const workOrder of workOrders) {
    const status = normalizeStatus(
      workOrder.status,
    )

    const priority = normalizePriority(
      workOrder.priority,
    )

    if (!statusPriorityCounts[status]) {
      statusPriorityCounts[status] = {}
    }

    statusPriorityCounts[status][priority] =
      (
        statusPriorityCounts[status][priority] ||
        0
      ) + 1
  }

  /*
   * Always include all four status categories, even when one currently
   * has a count of zero.
   */
  const data = STATUS_ORDER.map(
    (status) => {
      const row = {
        status,
        name:
          STATUS_DISPLAY[status] ||
          status,
        total: 0,
      }

      for (
        const priority of PRIORITY_ORDER
      ) {
        const count =
          statusPriorityCounts[status]?.[
            priority
          ] || 0

        row[priority] = count
        row.total += count
      }

      /*
       * The highest non-zero segment gets the rounded top corners
       * and the stack-total label.
       */
      row.topKey =
        [...PRIORITY_ORDER]
          .reverse()
          .find(
            (priority) =>
              row[priority] > 0,
          ) ?? null

      return row
    },
  )

  return {
    data,
    priorities: PRIORITY_ORDER,
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

  const axisScale = useMemo(
  () =>
    getIntegerAxisScale(
      Math.max(
        0,
        ...data.map(
          (row) => row.total,
        ),
      ),
    ),
  [data],
)
  
  if (workOrders.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        No status data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={195}>
      <BarChart
        data={data}
        margin={{
          top: 26,
          right: 30,
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
          interval={0}
          tick={{
            fontSize: 10,
            fill: '#64748B',
          }}
        />

        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          interval={0}
          width={28}
          domain={axisScale.domain}
          ticks={axisScale.ticks}
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

        

        {priorities.map((priority) => (
  <Bar
    key={priority}
    dataKey={priority}
    name={priority}
    stackId="priority"
    fill={getPriorityColor(priority)}
    barSize={30}
    shape={(shapeProps) => (
      <LabeledRoundedStackSegment
        {...shapeProps}
        dataKey={priority}
      />
    )}
    isAnimationActive={false}
  />
))}
      </BarChart>
    </ResponsiveContainer>
  )
}