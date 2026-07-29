import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import {
  CHART_COLORS,
} from '../../utils/constants'

const PRIORITY_ORDER = [
  'Low',
  'Medium',
  'High',
]

export default function PriorityPieChart({
  priorityBreakdown = {},
}) {
  const data = PRIORITY_ORDER.map(
    (priority) => ({
      name: priority,
      value:
        Number(
          priorityBreakdown[priority],
        ) || 0,
      color:
        CHART_COLORS.priority[
          priority
        ] || '#94A3B8',
    }),
  )

  const total = data.reduce(
    (sum, entry) =>
      sum + entry.value,
    0,
  )

  const visibleData = data.filter(
    (entry) => entry.value > 0,
  )

  if (total === 0) {
    return (
      <div className="flex h-[190px] items-center justify-center text-sm text-slate-400">
        No priority data available
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center gap-3">
      <ResponsiveContainer
        width={180}
        height={180}
      >
        <PieChart>
          <Pie
            data={visibleData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={62}
            dataKey="value"
            stroke="#FFFFFF"
            strokeWidth={2}
            label={({ value }) => value}
            labelLine={{
              stroke: '#CBD5E1',
              strokeWidth: 1,
            }}
            isAnimationActive={false}
          >
            {visibleData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.color}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border:
                '1px solid #E2E8F0',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex min-w-[118px] flex-col gap-2.5">
        {data.map((entry) => {
          const percentage =
            total > 0
              ? Math.round(
                  (
                    entry.value /
                    total
                  ) * 100,
                )
              : 0

          return (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      entry.color,
                  }}
                />

                <span className="text-sm text-slate-600">
                  {entry.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {entry.value}
                </span>

                <span className="min-w-8 text-right text-slate-400">
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}