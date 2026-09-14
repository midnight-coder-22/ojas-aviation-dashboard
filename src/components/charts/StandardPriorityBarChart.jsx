import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import LabeledRoundedStackSegment from './LabeledRoundedStackSegment'
import { PRIORITY_SERIES } from '../../utils/priorityChart'
import {
  fitTickWords,
  getIntegerAxisScale,
} from '../../utils/chartScale'

function sameValue(first, second) {
  return String(first ?? '').trim().toLowerCase() ===
    String(second ?? '').trim().toLowerCase()
}

function CategoryTick({
  x,
  y,
  width,
  index,
  visibleTicksCount,
  payload,
  categories = [],
  interactive,
  activeCategory,
  onCategoryClick,
}) {
  const category = String(payload?.value ?? '').trim()
  const words = fitTickWords({
    label: category,
    categories,
    index,
    axisWidth: width,
    tickCount: visibleTicksCount,
  })
  const isActive = activeCategory && sameValue(activeCategory, category)

  const activate = () => {
    if (interactive && category) onCategoryClick?.(category)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate()
    }
  }

  return (
    <g
      transform={`translate(${x},${y})`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Filter by ${category}` : undefined}
      onClick={activate}
      onKeyDown={interactive ? handleKeyDown : undefined}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      <title>{category}</title>
      <text
        textAnchor="middle"
        fill={isActive ? '#0F172A' : '#64748B'}
        fontSize={9}
        fontWeight={isActive ? 700 : 400}
      >
        {words.map((word, line) => (
          <tspan
            key={`${word}-${line}`}
            x={0}
            dy={line === 0 ? 12 : 11}
          >
            {word}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function PriorityStackTooltip({
  active,
  payload,
  label,
  series = PRIORITY_SERIES,
}) {
  if (!active || !payload?.length) return null

  const row = payload[0]?.payload ?? {}

  return (
    <div className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">{label}</p>
      <div className="space-y-1.5">
        {series.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-6"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="font-semibold text-slate-800">
              {Number(row[item.key]) || 0}
            </span>
          </div>
        ))}

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
          <span className="font-medium text-slate-500">Total</span>
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
  activeCategory = null,
  activePriority = null,
  onCategoryClick,
  onSegmentClick,
  series = PRIORITY_SERIES,
  seriesLabel = 'priority',
}) {
  const hasData = data.some((row) => Number(row.total) > 0)
  const interactive = Boolean(onCategoryClick || onSegmentClick)

  if (!hasData) {
    return (
      <div className="flex h-full min-h-[175px] items-center justify-center px-4 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const axisScale = getIntegerAxisScale(
    Math.max(0, ...data.map((row) => Number(row.total) || 0)),
  )
  const categories = data.map((row) => row[categoryKey])

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={175}>
      <BarChart
        data={data}
        barCategoryGap="32%"
        margin={{ top: 18, right: 52, bottom: 8, left: 0 }}
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
          tick={
            <CategoryTick
              categories={categories}
              interactive={Boolean(onCategoryClick)}
              activeCategory={activeCategory}
              onCategoryClick={onCategoryClick}
            />
          }
        />

        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          interval={0}
          width={34}
          domain={axisScale.domain}
          ticks={axisScale.ticks}
          tick={{ fontSize: 9, fill: '#94A3B8' }}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748B',
                  fontSize: 9,
                }
              : undefined
          }
        />

        <Tooltip
          content={<PriorityStackTooltip series={series} />}
          cursor={{ fill: '#F8FAFC' }}
        />

        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.label}
            stackId="priority"
            fill={item.color}
            maxBarSize={30}
            shape={(shapeProps) => {
              const category = shapeProps.payload?.[categoryKey]
              const categoryMatches =
                !activeCategory || sameValue(activeCategory, category)
              const priorityMatches =
                !activePriority || sameValue(activePriority, item.label)
              const hasSelection = Boolean(
                activeCategory || activePriority,
              )

              return (
                <LabeledRoundedStackSegment
                  {...shapeProps}
                  dataKey={item.key}
                  radius={7}
                  showTotal
                  interactive={Boolean(onSegmentClick)}
                  isActive={
                    hasSelection && categoryMatches && priorityMatches
                  }
                  isDimmed={!categoryMatches || !priorityMatches}
                  ariaLabel={`${category}, ${item.label} ${seriesLabel}`}
                  onClick={() =>
                    onSegmentClick?.({
                      category,
                      priority: item.label,
                      row: shapeProps.payload,
                    })
                  }
                />
              )
            }}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
