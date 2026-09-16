import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getIntegerAxisScale } from '../../utils/chartScale'

function LineTooltip({ active, payload, label, series, valueFormatter }) {
  if (!active || !payload?.length) return null
  const format = valueFormatter || ((value) => value.toLocaleString())

  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">{label}</p>
      <div className="space-y-1.5">
        {series.map((item) => {
          const point = payload.find((entry) => entry.dataKey === item.key)
          if (!point || point.value === undefined || point.value === null) return null

          return (
            <div key={item.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
              <span className="font-semibold text-slate-800">{format(point.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/*
 * Shared line-chart primitive (the codebase only had bar charts before this).
 * `series` is the same {key, label, color} shape as PRIORITY_SERIES /
 * FLAG_STATUS_SERIES, so KPI 3 (one series) and KPI 4 (six departments) both
 * render through this one component.
 */
export default function StandardLineChart({
  data = [],
  xKey = 'x',
  series = [],
  emptyMessage = 'No data available',
  yAxisLabel = 'Count',
  activeSeriesKey = null,
  valueFormatter,
}) {
  const hasData =
    data.length > 0 &&
    series.some((item) => data.some((row) => Number(row[item.key]) > 0))

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center px-4 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const maxValue = Math.max(
    0,
    ...data.flatMap((row) => series.map((item) => Number(row[item.key]) || 0)),
  )
  const axisScale = getIntegerAxisScale(maxValue)

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={175}>
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />

        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#94A3B8' }}
          minTickGap={24}
        />

        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={44}
          domain={axisScale.domain}
          ticks={axisScale.ticks}
          tick={{ fontSize: 9, fill: '#94A3B8' }}
          tickFormatter={valueFormatter}
          label={
            yAxisLabel
              ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 9 }
              : undefined
          }
        />

        <Tooltip
          content={<LineTooltip series={series} valueFormatter={valueFormatter} />}
          cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }}
        />

        {series.map((item) => {
          const isDimmed = activeSeriesKey && activeSeriesKey !== item.key

          return (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={isDimmed ? 1.5 : 2.25}
              strokeOpacity={isDimmed ? 0.25 : 1}
              dot={{ r: 2.5, strokeWidth: 0, fill: item.color, fillOpacity: isDimmed ? 0.25 : 1 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
