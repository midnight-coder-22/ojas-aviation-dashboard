import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getIntegerAxisScale,
} from '../../utils/chartScale'

function DepartmentTick({
  x,
  y,
  payload,
}) {
  const words = String(
    payload?.value ?? '',
  ).split(' ')

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

export default function FlowToNextDeptChart({
  data = [],
}) {
  const counts = {}

  for (const row of data) {
    if (!row.next_dept) {
      continue
    }

    counts[row.next_dept] =
      (counts[row.next_dept] || 0) +
      1
  }

  const chartData = Object.entries(
    counts,
  )
    .sort(
      (first, second) =>
        second[1] - first[1],
    )
    .map(([department, count]) => ({
      name: department,
      count,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[195px] items-center justify-center text-sm text-slate-400">
        No next department data
      </div>
    )
  }

  const axisScale =
    getIntegerAxisScale(
      Math.max(
        0,
        ...chartData.map(
          (row) => row.count,
        ),
      ),
    )

  return (
    <ResponsiveContainer
      width="100%"
      height={195}
    >
      <BarChart
        data={chartData}
        barSize={32}
        margin={{
          top: 26,
          right: 8,
          bottom: 8,
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
          height={42}
          tick={<DepartmentTick />}
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
          contentStyle={{
            borderRadius: 12,
            border:
              '1px solid #E2E8F0',
            fontSize: 12,
          }}
          cursor={{
            fill: '#FFF7ED',
          }}
        />

        <Bar
          dataKey="count"
          fill="#F97316"
          radius={[5, 5, 0, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="count"
            position="top"
            style={{
              fontSize: 11,
              fontWeight: 700,
              fill: '#475569',
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}