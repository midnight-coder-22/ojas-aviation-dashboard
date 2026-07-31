import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import LabeledRoundedStackSegment
  from './LabeledRoundedStackSegment'

import {
  PRIORITY_SERIES,
} from '../../utils/priorityChart'

import {
  getIntegerAxisScale,
} from '../../utils/chartScale'

function CategoryTick({
  x,
  y,
  payload,
}) {
  const words = String(
    payload?.value ?? '',
  )
    .trim()
    .split(/\s+/)

  return (
    <g
      transform={`translate(${x},${y})`}
    >
      <text
        textAnchor="middle"
        fill="#64748B"
        fontSize={9}
      >
        {words.map(
          (word, index) => (
            <tspan
              key={`${word}-${index}`}
              x={0}
              dy={
                index === 0
                  ? 12
                  : 11
              }
            >
              {word}
            </tspan>
          ),
        )}
      </text>
    </g>
  )
}

function PriorityStackTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null
  }

  const row =
    payload[0]?.payload ?? {}

  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">
        {label}
      </p>

      <div className="space-y-1.5">
        {PRIORITY_SERIES.map(
          (series) => (
            <div
              key={series.key}
              className="flex items-center justify-between gap-6"
            >
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{
                    backgroundColor:
                      series.color,
                  }}
                />

                {series.label}
              </span>

              <span className="font-semibold text-slate-800">
                {Number(
                  row[series.key],
                ) || 0}
              </span>
            </div>
          ),
        )}

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="font-medium text-slate-500">
            Total
          </span>

          <span className="font-bold text-slate-900">
            {Number(row.total) || 0}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function StandardPriorityBarChart({
  data = [],
  categoryKey = 'name',
  emptyMessage = 'No chart data available',
  yAxisLabel = 'WO count',
}) {
  const hasData = data.some(
    (row) => Number(row.total) > 0,
  )

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center px-4 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const axisScale =
    getIntegerAxisScale(
      Math.max(
        0,
        ...data.map(
          (row) =>
            Number(row.total) || 0,
        ),
      ),
    )

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minHeight={175}
    >
      <BarChart
        data={data}
        barCategoryGap="32%"
        margin={{
          top: 18,
          right: 52,
          bottom: 8,
          left: 0,
        }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#E2E8F0"
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey={categoryKey}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={42}
          tick={<CategoryTick />}
        />

        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          interval={0}
          width={34}
          domain={axisScale.domain}
          ticks={axisScale.ticks}
          tick={{
            fontSize: 9,
            fill: '#94A3B8',
          }}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position:
                    'insideLeft',
                  fill: '#64748B',
                  fontSize: 9,
                }
              : undefined
          }
        />

        <Tooltip
          content={
            <PriorityStackTooltip />
          }
          cursor={{
            fill: '#F8FAFC',
          }}
        />

        {PRIORITY_SERIES.map(
          (series) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={series.label}
              stackId="priority"
              fill={series.color}
              maxBarSize={30}
              shape={(shapeProps) => (
                <LabeledRoundedStackSegment
                  {...shapeProps}
                  dataKey={series.key}
                  radius={7}
                  showTotal
                />
              )}
              isAnimationActive={false}
            />
          ),
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}