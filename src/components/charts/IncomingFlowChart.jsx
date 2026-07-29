import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART_COLORS } from '../../utils/constants'

import LabeledRoundedStackSegment
  from './LabeledRoundedStackSegment'

import {
  getIntegerAxisScale,
} from '../../utils/chartScale'

const PRIORITY_SERIES = [
  {
    key: 'low',
    label: 'Low',
    color: CHART_COLORS.priority.Low,
  },
  {
    key: 'medium',
    label: 'Medium',
    color: CHART_COLORS.priority.Medium,
  },
  {
    key: 'high',
    label: 'High',
    color: CHART_COLORS.priority.High,
  },
]

function DepartmentTick({
  x,
  y,
  payload,
}) {
  const words = String(payload?.value ?? '').split(' ')

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        fill="#64748B"
        fontSize={9}
      >
        {words.map((word, index) => (
          <tspan
            key={`${word}-${index}`}
            x={0}
            dy={index === 0 ? 12 : 11}
          >
            {word}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function IncomingFlowTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload?.length) {
    return null
  }

  const total = Number(
    payload[0]?.payload?.total,
  ) || 0

  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">
        {label}
      </p>

      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  backgroundColor: entry.color,
                }}
              />

              {entry.name}
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

export default function IncomingFlowChart({
  rows = [],
}) {
  const chartData = rows
    .map((row) => {
      const values = {
        low: Number(row.low) || 0,
        medium:
          Number(row.medium) || 0,
        high:
          Number(row.high) || 0,
      }

      const total =
        values.low +
        values.medium +
        values.high

      const topKey =
        [...PRIORITY_SERIES]
          .reverse()
          .find(
            (series) =>
              values[series.key] > 0,
          )
          ?.key ?? null

      return {
        source_department:
          row.source_department,
        ...values,
        total,
        topKey,
      }
    })
    .filter(
      (row) => row.total > 0,
    )

  if (chartData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center px-4 text-center text-sm text-slate-400">
        No work orders are currently
        incoming to this department.
      </div>
    )
  }

  const axisScale =
    getIntegerAxisScale(
      Math.max(
        0,
        ...chartData.map(
          (row) => row.total,
        ),
      ),
    )

  return (
    <ResponsiveContainer
      width="100%"
      height={200}
    >
      <BarChart
        data={chartData}
        margin={{
          top: 28,
          right: 30,
          bottom: 14,
          left: 0,
        }}
      >
        <CartesianGrid
          vertical={false}
          stroke="#E2E8F0"
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey="source_department"
          axisLine={false}
          tickLine={false}
          interval={0}
          height={42}
          tick={<DepartmentTick />}
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
          label={{
            value: 'WO count',
            angle: -90,
            position: 'insideLeft',
            fill: '#64748B',
            fontSize: 9,
          }}
        />

        <Tooltip
          content={
            <IncomingFlowTooltip />
          }
          cursor={{
            fill: '#F8FAFC',
          }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          iconType="square"
          iconSize={8}
          wrapperStyle={{
            paddingBottom: 6,
            fontSize: 10,
            color: '#64748B',
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
              maxBarSize={34}
              shape={(shapeProps) => (
                <LabeledRoundedStackSegment
                  {...shapeProps}
                  dataKey={series.key}
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