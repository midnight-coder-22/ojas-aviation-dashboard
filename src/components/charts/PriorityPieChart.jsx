import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { PRIORITY_SERIES } from '../../utils/priorityChart'

const RADIAN = Math.PI / 180

function renderSectorValue({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  value,
  name,
}) {
  if (!value) return null

  const radius =
    innerRadius + (outerRadius - innerRadius) * 0.58
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const textColor = name === 'Medium' ? '#0F172A' : '#FFFFFF'

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
      pointerEvents="none"
    >
      {value}
    </text>
  )
}

export default function PriorityPieChart({
  priorityBreakdown = {},
  activePriority = null,
  onPriorityClick,
}) {
  const data = PRIORITY_SERIES.map((series) => ({
    key: series.key,
    name: series.label,
    value: Number(priorityBreakdown[series.label]) || 0,
    color: series.color,
  }))

  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  if (total === 0) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center text-sm text-slate-400">
        No priority data available
      </div>
    )
  }

  const visibleData = data.filter((entry) => entry.value > 0)
  const interactive = Boolean(onPriorityClick)

  return (
    <div className="flex h-full items-center justify-center gap-3">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={visibleData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={64}
            dataKey="value"
            nameKey="name"
            stroke="#FFFFFF"
            strokeWidth={2}
            labelLine={false}
            label={renderSectorValue}
            isAnimationActive={false}
            onClick={(entry) => {
              if (interactive) onPriorityClick?.(entry?.name)
            }}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            {visibleData.map((entry) => {
              const selected = activePriority === entry.name
              const dimmed = activePriority && !selected

              return (
                <Cell
                  key={entry.key}
                  fill={entry.color}
                  opacity={dimmed ? 0.3 : 1}
                  stroke={selected ? '#0F172A' : '#FFFFFF'}
                  strokeWidth={selected ? 3 : 2}
                />
              )
            })}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex min-w-[115px] flex-col gap-2.5">
        {data.map((entry) => {
          const percentage =
            total > 0
              ? Math.round((entry.value / total) * 100)
              : 0
          const selected = activePriority === entry.name
          const dimmed = activePriority && !selected

          return (
            <button
              key={entry.key}
              type="button"
              disabled={!interactive || entry.value === 0}
              onClick={() => onPriorityClick?.(entry.name)}
              className={`
                flex items-center justify-between gap-4 rounded-md px-1 py-0.5
                text-left transition
                ${interactive && entry.value > 0 ? 'hover:bg-slate-50' : ''}
                ${dimmed ? 'opacity-35' : 'opacity-100'}
                ${selected ? 'ring-1 ring-slate-300' : ''}
              `}
            >
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>

              <span className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {entry.value}
                </span>
                <span className="min-w-8 text-right text-slate-400">
                  {percentage}%
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
